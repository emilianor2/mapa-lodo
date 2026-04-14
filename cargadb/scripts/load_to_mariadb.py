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


def build_update_statement(row):
    existing_id = fit_length(row.get("existing_id"), 36)
    if not existing_id:
        raise ValueError("El CSV de actualizacion necesita la columna existing_id.")

    assignments = [
        f"name = {sql_literal(fit_length(row.get('name'), 255))}",
        f"website = {sql_literal(fit_length(row.get('website'), 255))}",
        f"vertical = {sql_literal(fit_length(row.get('vertical'), 64) or 'otra')}",
        f"sub_vertical = {sql_literal(fit_length(row.get('sub_vertical'), 64))}",
        f"location = {sql_literal(row.get('location'))}",
        f"logo_url = {sql_literal(fit_length(row.get('logo_url'), 512))}",
        f"estadio_actual = {sql_literal(fit_length(row.get('estadio_actual'), 64))}",
        f"solucion = {sql_literal(row.get('solucion'))}",
        f"mail = {sql_literal(fit_length(row.get('mail'), 255))}",
        f"social_media = {sql_literal(row.get('social_media'))}",
        f"contact_phone = {sql_literal(fit_length(row.get('contact_phone'), 50))}",
        f"founders = {sql_literal(row.get('founders'))}",
        f"founded = {sql_literal(row.get('founded'))}",
        f"organization_type = {sql_literal(fit_length(row.get('organization_type'), 64) or 'startup')}",
        f"outcome_status = {sql_literal(fit_length(row.get('outcome_status'), 64) or 'S/D')}",
        f"business_model = {sql_literal(fit_length(row.get('business_model'), 64))}",
        f"badges = {sql_literal(row.get('badges'))}",
        f"notes = {sql_literal(row.get('notes'))}",
    ]

    return f"UPDATE organizations SET {', '.join(assignments)} WHERE id = {sql_literal(existing_id)};"


def read_rows_from(path):
    with Path(path).open("r", encoding="utf-8-sig", newline="") as file_handle:
        sample = file_handle.read(4096)
        file_handle.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=";,")
            delimiter = dialect.delimiter
        except csv.Error:
            delimiter = ";"
        reader = csv.DictReader(file_handle, delimiter=delimiter)
        return list(reader)


def row_count():
    command = [
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
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    return int(result.stdout.strip() or "0")


def load_rows(rows, truncate=False, mode="insert"):
    statements = [f"USE {DATABASE};", "SET NAMES utf8mb4;"]
    if truncate:
        statements.append("TRUNCATE TABLE organizations;")

    if mode == "insert":
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
    elif mode == "update":
        for row in rows:
            statements.append(build_update_statement(row))
    else:
        raise ValueError(f"Modo de carga no soportado: {mode}")

    sql = "\n".join(statements)
    command = [
        "docker",
        "exec",
        "-i",
        CONTAINER,
        "mariadb",
        f"-u{USER}",
        f"-p{PASSWORD}",
    ]
    subprocess.run(command, input=sql.encode("utf-8"), check=True)


def main():
    parser = argparse.ArgumentParser(description="Carga un CSV limpio de startups a MariaDB dentro del contenedor Docker.")
    parser.add_argument("--truncate", action="store_true", help="Vacia organizations antes de insertar.")
    parser.add_argument("--csv", default=str(CSV_PATH), help="Ruta al CSV limpio a cargar.")
    parser.add_argument("--mode", choices=["insert", "update"], default="insert", help="Inserta nuevas filas o actualiza existentes.")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"No existe el CSV limpio: {csv_path}", file=sys.stderr)
        sys.exit(1)

    rows = read_rows_from(csv_path)
    load_rows(rows, truncate=args.truncate, mode=args.mode)
    if args.mode == "update":
        action = "actualizadas"
    else:
        action = "reemplazadas" if args.truncate else "agregadas"
    print(f"Carga completada: {len(rows)} filas {action} en {DATABASE}.organizations")


if __name__ == "__main__":
    main()
