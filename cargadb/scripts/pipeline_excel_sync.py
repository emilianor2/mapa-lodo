import argparse
import csv
import json
import pandas as pd
import shutil
import subprocess
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.request import urlretrieve
from urllib.parse import urlparse

from extractor import extraer_startup_data
from location_utils import MISSING_LOCATION_VALUE, clean_location_value, looks_like_address, slugify
from transformer import normalize_dataframe_columns, transformar_datos


BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "1_sucios"
OUTPUT_DIR = BASE_DIR / "data" / "2_limpios"
BASELINE_SOURCE_XLSX = RAW_DIR / "_baseline_sheet.xlsx"
BASELINE_CLEAN_CSV = OUTPUT_DIR / "_baseline_startups_limpias.csv"
CLEAN_CSV = OUTPUT_DIR / "startups_limpias_final.csv"
NEW_ONLY_CSV = OUTPUT_DIR / "startups_nuevas_para_subir.csv"
NEW_REVIEW_CSV = OUTPUT_DIR / "startups_nuevas_para_revisar.csv"
INVALID_SOURCE_ROWS_CSV = OUTPUT_DIR / "filas_invalidas_origen.csv"
AUDIT_SUMMARY = OUTPUT_DIR / "load_audit_summary.json"
REVIEW_QUEUE = OUTPUT_DIR / "location_review_queue.csv"
COUNTRY_MATRIX = OUTPUT_DIR / "country_normalization_matrix.csv"
REGION_MATRIX = OUTPUT_DIR / "region_normalization_matrix.csv"
CITY_MATRIX = OUTPUT_DIR / "city_normalization_matrix.csv"
LOAD_SCRIPT = Path(__file__).resolve().parent / "load_to_mariadb.py"
CONTAINER = "lodo-db-local"
DATABASE = "lodo_db"
DB_USER = "root"
DB_PASSWORD = "root_password"
SOURCE_SHEET_EXPORT_URL = "https://docs.google.com/spreadsheets/d/1PrRrKP-Nz8lHZOkVhvln2sP6sACod2KxN6SpHQooS6s/export?format=xlsx&gid=1025562372"


def default_staged_source_path(source_path):
    extension = source_path.suffix.lower()
    if extension == ".csv":
        return RAW_DIR / "dataset_real.csv"
    return RAW_DIR / "dataset_para_limpiar.xlsx"


def stage_source_file(source_path):
    staged_path = default_staged_source_path(source_path)
    if source_path.resolve() == staged_path.resolve():
        return staged_path
    staged_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, staged_path)
    return staged_path


def download_baseline_sheet():
    BASELINE_SOURCE_XLSX.parent.mkdir(parents=True, exist_ok=True)
    urlretrieve(SOURCE_SHEET_EXPORT_URL, BASELINE_SOURCE_XLSX)
    return BASELINE_SOURCE_XLSX


def read_clean_rows(path=CLEAN_CSV):
    if not path.exists():
        raise FileNotFoundError(f"No existe el CSV limpio: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as file_handle:
        return list(csv.DictReader(file_handle, delimiter=";"))


def load_baseline_rows():
    baseline_source = download_baseline_sheet()
    transformar_datos(source_path=str(baseline_source), output_path=str(BASELINE_CLEAN_CSV))
    return read_clean_rows(BASELINE_CLEAN_CSV)


def read_source_dataframe(source_path):
    if str(source_path).lower().endswith(".csv"):
        return normalize_dataframe_columns(pd.read_csv(source_path, encoding="utf-8"))
    return normalize_dataframe_columns(pd.read_excel(source_path))


def has_value(value):
    cleaned = clean_location_value(value)
    return cleaned is not None and slugify(cleaned) not in {"s d", "n d", "sin dato", "sin datos"}


def has_required_name(row):
    value = row.get("name")
    return value is not None and str(value).strip() != ""


def detect_review_reasons(row):
    reasons = []

    country_raw = row.get("country_raw")
    region_raw = row.get("region_raw")
    city_raw = row.get("city_raw")
    country_norm = row.get("country_normalized") or MISSING_LOCATION_VALUE
    region_norm = row.get("region_normalized") or MISSING_LOCATION_VALUE
    city_norm = row.get("city_normalized") or MISSING_LOCATION_VALUE

    if has_value(country_raw) and country_norm == MISSING_LOCATION_VALUE:
        reasons.append("country_lost_during_normalization")

    if has_value(region_raw) and region_norm == MISSING_LOCATION_VALUE:
        reasons.append("region_removed_or_unresolved")

    if has_value(city_raw) and city_norm == MISSING_LOCATION_VALUE:
        reasons.append("city_removed_or_unresolved")

    if has_value(region_raw) and looks_like_address(region_raw):
        reasons.append("region_looks_like_address")

    if has_value(city_raw) and looks_like_address(city_raw):
        reasons.append("city_looks_like_address")

    if has_value(country_raw) and "/" in str(country_raw):
        reasons.append("country_contains_multiple_values")

    if has_value(region_raw) and "/" in str(region_raw):
        reasons.append("region_contains_multiple_values")

    if has_value(city_raw) and "/" in str(city_raw):
        reasons.append("city_contains_multiple_values")

    return reasons


def build_review_queue(rows):
    queue = []

    for row in rows:
        reasons = detect_review_reasons(row)
        if not reasons:
            continue

        queue.append({
            "name": row.get("name", ""),
            "country_raw": row.get("country_raw", ""),
            "country_normalized": row.get("country_normalized", ""),
            "region_raw": row.get("region_raw", ""),
            "region_normalized": row.get("region_normalized", ""),
            "city_raw": row.get("city_raw", ""),
            "city_normalized": row.get("city_normalized", ""),
            "review_reasons": ", ".join(reasons),
        })

    return queue


def build_invalid_source_rows_report(source_path):
    dataframe = read_source_dataframe(source_path)
    invalid_rows = []

    for index, row in dataframe.iterrows():
        name = row.get("name")
        if name is not None and str(name).strip() != "":
            continue

        invalid_rows.append({
            "source_row_number": index + 2,
            "name": row.get("name", ""),
            "website": row.get("website", ""),
            "vertical": row.get("vertical", ""),
            "sub_vertical": row.get("sub vertical", ""),
            "country_source": row.get("country_source", ""),
            "city_region_source": row.get("city_region_source", ""),
            "solucion_source": row.get("solucion_source", ""),
        })

    write_csv(
        INVALID_SOURCE_ROWS_CSV,
        invalid_rows,
        [
            "source_row_number",
            "name",
            "website",
            "vertical",
            "sub_vertical",
            "country_source",
            "city_region_source",
            "solucion_source",
        ],
    )
    return invalid_rows


def build_new_review_rows(new_rows):
    review_rows = []

    for row in new_rows:
        review_rows.append({
            **row,
            "review_reasons": ", ".join(detect_review_reasons(row)),
        })

    return review_rows


def write_csv(path, rows, fieldnames, delimiter=","):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=fieldnames, delimiter=delimiter)
        writer.writeheader()
        writer.writerows(rows)


def write_semicolon_csv(path, rows, fieldnames):
    write_csv(path, rows, fieldnames, delimiter=";")


def write_normalization_matrix(rows, raw_key, normalized_key, output_path):
    counter = Counter()

    for row in rows:
        raw_value = row.get(raw_key, MISSING_LOCATION_VALUE) or MISSING_LOCATION_VALUE
        normalized_value = row.get(normalized_key, MISSING_LOCATION_VALUE) or MISSING_LOCATION_VALUE
        counter[(raw_value, normalized_value)] += 1

    matrix_rows = [
        {
            "raw_value": raw_value,
            "normalized_value": normalized_value,
            "count": count,
        }
        for (raw_value, normalized_value), count in sorted(
            counter.items(),
            key=lambda item: (-item[1], item[0][0], item[0][1]),
        )
    ]

    write_csv(output_path, matrix_rows, ["raw_value", "normalized_value", "count"])


def normalize_identity(name, website):
    def repair_text(value):
        if value is None:
            return ""
        text = str(value).strip()
        suspicious = ("Ã", "â", "’", "“", "”")
        if any(token in text for token in suspicious):
            for src, dst in (("latin1", "utf-8"), ("cp1252", "utf-8")):
                try:
                    repaired = text.encode(src, errors="ignore").decode(dst, errors="ignore")
                    if repaired:
                        text = repaired
                        break
                except Exception:
                    continue
        return text

    def normalize_website(value):
        text = repair_text(value).strip().lower()
        if not text:
            return ""
        if "://" not in text:
            text = f"https://{text}"
        parsed = urlparse(text)
        host = (parsed.netloc or "").lower()
        if host.startswith("www."):
            host = host[4:]
        path = parsed.path.rstrip("/")
        if path in {"", "/"}:
            return host
        return f"{host}{path}"

    return (
        slugify(repair_text(name)),
        normalize_website(website),
    )


def fetch_existing_records():
    query = (
        f"USE {DATABASE}; "
        "SELECT id, name, COALESCE(website, ''), COALESCE(vertical, ''), COALESCE(sub_vertical, ''), "
        "COALESCE(location, ''), COALESCE(logo_url, ''), COALESCE(estadio_actual, ''), COALESCE(solucion, ''), "
        "COALESCE(mail, ''), COALESCE(social_media, ''), COALESCE(contact_phone, ''), COALESCE(founders, ''), "
        "COALESCE(founded, ''), COALESCE(organization_type, ''), COALESCE(outcome_status, ''), "
        "COALESCE(business_model, ''), COALESCE(badges, ''), COALESCE(notes, ''), COALESCE(status, ''), "
        "COALESCE(lat, ''), COALESCE(lng, '') FROM organizations;"
    )
    command = [
        "docker",
        "exec",
        CONTAINER,
        "mariadb",
        f"-u{DB_USER}",
        f"-p{DB_PASSWORD}",
        "-N",
        "-B",
        "-e",
        query,
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
    except Exception:
        return []

    columns = [
        "id",
        "name",
        "website",
        "vertical",
        "sub_vertical",
        "location",
        "logo_url",
        "estadio_actual",
        "solucion",
        "mail",
        "social_media",
        "contact_phone",
        "founders",
        "founded",
        "organization_type",
        "outcome_status",
        "business_model",
        "badges",
        "notes",
        "status",
        "lat",
        "lng",
    ]
    records = []
    for line in result.stdout.splitlines():
        parts = line.split("\t")
        record = {
            column: parts[index] if index < len(parts) else ""
            for index, column in enumerate(columns)
        }
        records.append(record)
    return records


def build_existing_indexes(existing_records):
    indexes = {
        "records": existing_records,
        "pairs": {},
        "websites": {},
        "names": {},
    }

    for record in existing_records:
        normalized_name, normalized_website = normalize_identity(record.get("name"), record.get("website"))
        pair = (normalized_name, normalized_website)
        indexes["pairs"][pair] = record
        if normalized_website:
            indexes["websites"][normalized_website] = record
        if normalized_name:
            indexes["names"][normalized_name] = record

    return indexes


def find_existing_match(row, existing_indexes):
    if not existing_indexes:
        return None, None

    normalized_name, normalized_website = normalize_identity(row.get("name"), row.get("website"))
    pair = (normalized_name, normalized_website)
    if pair in existing_indexes["pairs"]:
        return existing_indexes["pairs"][pair], "pair"
    if normalized_website and normalized_website in existing_indexes["websites"]:
        return existing_indexes["websites"][normalized_website], "website"
    if normalized_name and normalized_name in existing_indexes["names"]:
        return existing_indexes["names"][normalized_name], "name"
    return None, None


def split_rows_by_existence(rows, existing_indexes):
    if not existing_indexes:
        return rows, []

    new_rows = []
    existing_rows = []
    for row in rows:
        existing_record, _ = find_existing_match(row, existing_indexes)
        if existing_record:
            existing_rows.append(row)
        else:
            new_rows.append(row)
    return new_rows, existing_rows


def fetch_existing_identities():
    existing_indexes = build_existing_indexes(fetch_existing_records())
    return {
        "pairs": set(existing_indexes["pairs"].keys()),
        "websites": set(existing_indexes["websites"].keys()),
        "names": set(existing_indexes["names"].keys()),
    }


def build_summary(rows, review_queue, new_rows, existing_rows, new_review_rows):
    total_rows = len(rows)
    with_country = sum(1 for row in rows if row.get("country_normalized") and row["country_normalized"] != MISSING_LOCATION_VALUE)
    with_region = sum(1 for row in rows if row.get("region_normalized") and row["region_normalized"] != MISSING_LOCATION_VALUE)
    with_city = sum(1 for row in rows if row.get("city_normalized") and row["city_normalized"] != MISSING_LOCATION_VALUE)
    with_coords = sum(1 for row in rows if row.get("lat") and row.get("lng"))

    unique_countries = sorted({
        row["country_normalized"]
        for row in rows
        if row.get("country_normalized") and row["country_normalized"] != MISSING_LOCATION_VALUE
    })

    review_reason_counts = Counter()
    for row in review_queue:
        for reason in row["review_reasons"].split(", "):
            review_reason_counts[reason] += 1

    return {
        "generated_at": datetime.now().isoformat(),
        "source_csv": str(CLEAN_CSV),
        "total_rows": total_rows,
        "with_country": with_country,
        "with_region": with_region,
        "with_city": with_city,
        "with_coords": with_coords,
        "unique_countries_count": len(unique_countries),
        "review_queue_count": len(new_review_rows),
        "full_review_queue_count": len(review_queue),
        "new_candidate_rows": len(new_rows),
        "existing_candidate_rows": len(existing_rows),
        "review_reason_counts": dict(sorted(review_reason_counts.items())),
        "unique_countries_sample": unique_countries[:25],
        "artifacts": {
            "review_queue_csv": str(REVIEW_QUEUE),
            "new_review_csv": str(NEW_REVIEW_CSV),
            "invalid_source_rows_csv": str(INVALID_SOURCE_ROWS_CSV),
            "country_matrix_csv": str(COUNTRY_MATRIX),
            "region_matrix_csv": str(REGION_MATRIX),
            "city_matrix_csv": str(CITY_MATRIX),
            "new_only_csv": str(NEW_ONLY_CSV),
        },
    }


def write_summary(summary):
    AUDIT_SUMMARY.parent.mkdir(parents=True, exist_ok=True)
    AUDIT_SUMMARY.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")


def run_load(csv_path, truncate=False, mode="insert"):
    command = [sys.executable, str(LOAD_SCRIPT), "--csv", str(csv_path)]
    if truncate:
        command.append("--truncate")
    subprocess.run(command, check=True)


def run_pipeline(source_path=None, extract=False):
    if extract:
        extraer_startup_data()

    staged_source = None
    effective_source = None
    if source_path:
        source = Path(source_path).resolve()
        staged_source = stage_source_file(source)
        effective_source = str(staged_source)

    output_path = transformar_datos(source_path=effective_source, output_path=str(CLEAN_CSV))
    if not output_path:
        raise RuntimeError("No se generó el CSV limpio.")

    invalid_source_rows = build_invalid_source_rows_report(effective_source or output_path)
    rows = [row for row in read_clean_rows(CLEAN_CSV) if has_required_name(row)]
    if rows:
        write_semicolon_csv(CLEAN_CSV, rows, rows[0].keys())
    review_queue = build_review_queue(rows)
    existing_records = fetch_existing_records()
    db_indexes = build_existing_indexes(existing_records)
    new_rows, existing_rows = split_rows_by_existence(rows, db_indexes)

    new_review_rows = build_new_review_rows(new_rows)

    write_csv(
        REVIEW_QUEUE,
        review_queue,
        [
            "name",
            "country_raw",
            "country_normalized",
            "region_raw",
            "region_normalized",
            "city_raw",
            "city_normalized",
            "review_reasons",
        ],
    )
    write_normalization_matrix(rows, "country_raw", "country_normalized", COUNTRY_MATRIX)
    write_normalization_matrix(rows, "region_raw", "region_normalized", REGION_MATRIX)
    write_normalization_matrix(rows, "city_raw", "city_normalized", CITY_MATRIX)
    write_semicolon_csv(NEW_ONLY_CSV, new_rows, rows[0].keys() if rows else [])
    write_semicolon_csv(
        NEW_REVIEW_CSV,
        new_review_rows,
        list(rows[0].keys()) + ["review_reasons"] if rows else ["review_reasons"],
    )

    summary = build_summary(rows, review_queue, new_rows, existing_rows, new_review_rows)
    write_summary(summary)

    return {
        "summary": summary,
        "rows": rows,
        "new_rows": new_rows,
        "new_review_rows": new_review_rows,
        "existing_rows": existing_rows,
        "review_queue": review_queue,
        "invalid_source_rows": invalid_source_rows,
        "staged_source": str(staged_source) if staged_source else None,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Pipeline de Excel/Sheet -> limpieza -> auditoria -> carga opcional a MariaDB."
    )
    parser.add_argument("--extract", action="store_true", help="Descarga o exporta el Excel/Sheet antes de transformar.")
    parser.add_argument("--source", help="Ruta local a un CSV/XLSX/XLSM para procesar.")
    parser.add_argument("--load", action="store_true", help="Carga el CSV limpio completo a MariaDB al finalizar.")
    parser.add_argument("--load-only-new", action="store_true", help="Carga solo las filas nuevas detectadas.")
    parser.add_argument("--truncate", action="store_true", help="Si se usa junto con --load, reemplaza organizations.")
    parser.add_argument(
        "--fail-on-review",
        action="store_true",
        help="Devuelve codigo de salida 2 si quedaron filas en la cola de revision manual.",
    )
    args = parser.parse_args()

    result = run_pipeline(source_path=args.source, extract=args.extract)
    summary = result["summary"]

    print(f"CSV limpio listo: {CLEAN_CSV}")
    print(f"Resumen de auditoria: {AUDIT_SUMMARY}")
    print(f"Revision de nuevas: {NEW_REVIEW_CSV} ({summary['review_queue_count']} filas)")
    print(f"Cola de revision completa: {REVIEW_QUEUE} ({summary['full_review_queue_count']} filas)")
    print(f"Filas invalidas del origen: {INVALID_SOURCE_ROWS_CSV} ({len(result['invalid_source_rows'])} filas)")
    print(f"Filas nuevas detectadas: {summary['new_candidate_rows']}")
    print(f"Filas ya existentes detectadas: {summary['existing_candidate_rows']}")

    selected_modes = sum(bool(option) for option in [args.load, args.load_only_new])
    if selected_modes > 1:
        print("No se pueden combinar --load y --load-only-new.", file=sys.stderr)
        sys.exit(1)

    if args.load:
        run_load(CLEAN_CSV, truncate=args.truncate)
    elif args.load_only_new:
        run_load(NEW_REVIEW_CSV, truncate=False)

    if args.fail_on_review and result["review_queue"]:
        print("Se detectaron filas para revision manual. Revisar la cola antes de continuar.", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
