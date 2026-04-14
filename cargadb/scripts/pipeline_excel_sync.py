import argparse
import csv
import json
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
from transformer import transformar_datos


BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "1_sucios"
OUTPUT_DIR = BASE_DIR / "data" / "2_limpios"
BASELINE_SOURCE_XLSX = RAW_DIR / "_baseline_sheet.xlsx"
BASELINE_CLEAN_CSV = OUTPUT_DIR / "_baseline_startups_limpias.csv"
CLEAN_CSV = OUTPUT_DIR / "startups_limpias_final.csv"
NEW_ONLY_CSV = OUTPUT_DIR / "startups_nuevas_para_subir.csv"
NEW_REVIEW_CSV = OUTPUT_DIR / "startups_nuevas_para_revisar.csv"
EXISTING_CHANGES_CSV = OUTPUT_DIR / "startups_existentes_con_cambios.csv"
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
COMPARE_FIELDS = [
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
]


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


def has_value(value):
    cleaned = clean_location_value(value)
    return cleaned is not None and slugify(cleaned) not in {"s d", "n d", "sin dato", "sin datos"}


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


def normalize_field_value(field, value):
    if value is None:
        return ""

    text = str(value).strip()
    if text.lower() in {"", "null", "none", "nan"}:
        return ""

    if field == "name":
        return normalize_identity(text, "")[0]
    if field == "website":
        return normalize_identity("", text)[1]
    if field in {"location", "social_media", "founders", "badges"}:
        try:
            return json.dumps(json.loads(text), ensure_ascii=False, sort_keys=True)
        except Exception:
            return text
    if field == "founded":
        try:
            return str(int(float(text)))
        except Exception:
            return text
    return text


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


def detect_changed_fields(row, existing_record):
    changed_fields = []
    for field in COMPARE_FIELDS:
        incoming_value = normalize_field_value(field, row.get(field))
        existing_value = normalize_field_value(field, existing_record.get(field))
        if incoming_value != existing_value:
            changed_fields.append(field)
    return changed_fields


def build_existing_changes_rows(existing_rows, baseline_indexes, db_indexes):
    changed_rows = []

    for row in existing_rows:
        baseline_record, match_basis = find_existing_match(row, baseline_indexes)
        if not baseline_record:
            continue

        changed_fields = detect_changed_fields(row, baseline_record)
        if not changed_fields:
            continue

        db_record, _ = find_existing_match(row, db_indexes)
        if not db_record:
            continue

        changed_rows.append({
            **row,
            "existing_id": db_record.get("id", ""),
            "match_basis": match_basis,
            "changed_fields": ", ".join(changed_fields),
            "review_reasons": ", ".join(detect_review_reasons(row)),
        })

    return changed_rows


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


def build_summary(rows, review_queue, new_rows, existing_rows, new_review_rows, changed_existing_rows):
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
        "changed_existing_rows": len(changed_existing_rows),
        "review_reason_counts": dict(sorted(review_reason_counts.items())),
        "unique_countries_sample": unique_countries[:25],
        "artifacts": {
            "review_queue_csv": str(REVIEW_QUEUE),
            "new_review_csv": str(NEW_REVIEW_CSV),
            "existing_changes_csv": str(EXISTING_CHANGES_CSV),
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
    if mode != "insert":
        command.extend(["--mode", mode])
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

    rows = read_clean_rows(CLEAN_CSV)
    review_queue = build_review_queue(rows)
    baseline_rows = []
    baseline_indexes = {"records": [], "pairs": {}, "websites": {}, "names": {}}
    try:
        baseline_rows = load_baseline_rows()
        baseline_indexes = build_existing_indexes(baseline_rows)
    except Exception:
        baseline_rows = []

    existing_records = fetch_existing_records()
    db_indexes = build_existing_indexes(existing_records)

    if baseline_rows:
        baseline_new_rows, baseline_existing_rows = split_rows_by_existence(rows, baseline_indexes)
        new_rows, existing_db_only_rows = split_rows_by_existence(baseline_new_rows, db_indexes)
        existing_rows = baseline_existing_rows + existing_db_only_rows
    else:
        new_rows, existing_rows = split_rows_by_existence(rows, db_indexes)

    new_review_rows = build_new_review_rows(new_rows)
    changed_existing_rows = build_existing_changes_rows(existing_rows, baseline_indexes, db_indexes)

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
    write_semicolon_csv(
        EXISTING_CHANGES_CSV,
        changed_existing_rows,
        list(rows[0].keys()) + ["existing_id", "match_basis", "changed_fields", "review_reasons"]
        if rows
        else ["existing_id", "match_basis", "changed_fields", "review_reasons"],
    )

    summary = build_summary(rows, review_queue, new_rows, existing_rows, new_review_rows, changed_existing_rows)
    write_summary(summary)

    return {
        "summary": summary,
        "rows": rows,
        "new_rows": new_rows,
        "new_review_rows": new_review_rows,
        "existing_rows": existing_rows,
        "changed_existing_rows": changed_existing_rows,
        "review_queue": review_queue,
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
    parser.add_argument("--update-existing", action="store_true", help="Actualiza las filas existentes con cambios detectados.")
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
    print(f"Existentes con cambios: {EXISTING_CHANGES_CSV} ({summary['changed_existing_rows']} filas)")
    print(f"Cola de revision completa: {REVIEW_QUEUE} ({summary['full_review_queue_count']} filas)")
    print(f"Filas nuevas detectadas: {summary['new_candidate_rows']}")
    print(f"Filas ya existentes detectadas: {summary['existing_candidate_rows']}")

    selected_modes = sum(bool(option) for option in [args.load, args.load_only_new, args.update_existing])
    if selected_modes > 1:
        print("No se pueden combinar --load, --load-only-new y --update-existing.", file=sys.stderr)
        sys.exit(1)

    if args.load:
        run_load(CLEAN_CSV, truncate=args.truncate)
    elif args.load_only_new:
        run_load(NEW_REVIEW_CSV, truncate=False)
    elif args.update_existing:
        run_load(EXISTING_CHANGES_CSV, truncate=False, mode="update")

    if args.fail_on_review and result["review_queue"]:
        print("Se detectaron filas para revision manual. Revisar la cola antes de continuar.", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
