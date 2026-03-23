import argparse
import csv
import subprocess
import sys
from pathlib import Path


CSV_PATH = Path(__file__).resolve().parents[1] / "data" / "2_limpios" / "startups_limpias_final.csv"
CONTAINER = "lodo-db-local"
DATABASE = "lodo_db"
USER = "root"
PASSWORD = "root_password"


def sql_literal(value):
    if value is None:
        return "NULL"
    text = str(value)
    if not text or text.lower() in {"nan", "none", "null"}:
        return "NULL"
    escaped = text.replace("\\", "\\\\").replace("'", "''")
    return f"'{escaped}'"


def fit_length(value, max_len):
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:max_len]


def build_insert_row(row):
    name = fit_length(row.get("name"), 255)
    website = fit_length(row.get("website"), 255)
    vertical = fit_length(row.get("vertical"), 64) or "otra"
    sub_vertical = fit_length(row.get("sub_vertical"), 64)
    logo_url = fit_length(row.get("logo_url"), 512)
    estadio_actual = fit_length(row.get("estadio_actual"), 64)
    mail = fit_length(row.get("mail"), 255)
    contact_phone = fit_length(row.get("contact_phone"), 50)
    organization_type = fit_length(row.get("organization_type"), 64) or "startup"
    outcome_status = fit_length(row.get("outcome_status"), 64) or "S/D"
    business_model = fit_length(row.get("business_model"), 64)
    status = fit_length(row.get("status"), 32) or "IN_REVIEW"

    return "(" + ", ".join(
        [
            "UUID()",
            sql_literal(name),
            sql_literal(website),
            sql_literal(vertical),
            sql_literal(sub_vertical),
            sql_literal(row.get("location")),
            sql_literal(logo_url),
            sql_literal(estadio_actual),
            sql_literal(row.get("solucion")),
            sql_literal(mail),
            sql_literal(row.get("social_media")),
            sql_literal(contact_phone),
            sql_literal(row.get("founders")),
            sql_literal(row.get("founded")),
            sql_literal(organization_type),
            sql_literal(outcome_status),
            sql_literal(business_model),
            sql_literal(row.get("badges")),
            sql_literal(row.get("notes")),
            sql_literal(status),
            sql_literal(row.get("lat")),
            sql_literal(row.get("lng")),
        ]
    ) + ")"


def read_rows():
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        return list(reader)


def row_count():
    cmd = [
        "docker",
        "exec",
        CONTAINER,
        "mariadb",
        f"-u{USER}",
        f"-p{PASSWORD}",
        "-N",
        "-e",
        f"USE {DATABASE}; SELECT COUNT(*) FROM organizations;",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return int(result.stdout.strip() or "0")


def load_rows(rows, truncate=False):
    statements = [f"USE {DATABASE};", "SET NAMES utf8mb4;"]
    if truncate:
        statements.append("TRUNCATE TABLE organizations;")

    columns = (
        "id, name, website, vertical, sub_vertical, location, logo_url, estadio_actual, "
        "solucion, mail, social_media, contact_phone, founders, founded, organization_type, "
        "outcome_status, business_model, badges, notes, status, lat, lng"
    )

    batch_size = 200
    for start in range(0, len(rows), batch_size):
        batch = rows[start:start + batch_size]
        values = ",\n".join(build_insert_row(row) for row in batch)
        statements.append(f"INSERT INTO organizations ({columns}) VALUES\n{values};")

    sql = "\n".join(statements)
    cmd = [
        "docker",
        "exec",
        "-i",
        CONTAINER,
        "mariadb",
        f"-u{USER}",
        f"-p{PASSWORD}",
    ]
    subprocess.run(cmd, input=sql.encode("utf-8"), check=True)


def main():
    parser = argparse.ArgumentParser(description="Carga el CSV limpio de startups a MariaDB dentro del contenedor Docker.")
    parser.add_argument("--truncate", action="store_true", help="Vacía organizations antes de insertar.")
    args = parser.parse_args()

    if not CSV_PATH.exists():
        print(f"No existe el CSV limpio: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    rows = read_rows()
    current = row_count()
    if current > 0 and not args.truncate:
        print(
            f"La tabla organizations ya tiene {current} registros. Usa --truncate si querés reemplazarla.",
            file=sys.stderr,
        )
        sys.exit(1)

    load_rows(rows, truncate=args.truncate)
    print(f"Carga completada: {len(rows)} filas insertadas en {DATABASE}.organizations")


if __name__ == "__main__":
    main()
