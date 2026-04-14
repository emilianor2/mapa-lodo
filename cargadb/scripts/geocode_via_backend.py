import argparse
import csv
import sys
import time
from pathlib import Path

import requests


API_URL = "http://localhost:8080"
ADMIN_TOKEN = "secret123"
CSV_PATH = Path(__file__).resolve().parents[1] / "data" / "2_limpios" / "startups_limpias_final.csv"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def fetch_candidates(limit=None):
    import subprocess

    sql = (
        "USE lodo_db; "
        "SELECT id, name, location_country, location_city, website "
        "FROM organizations "
        "WHERE lat IS NULL AND lng IS NULL "
        "AND location_country IS NOT NULL AND location_country <> '' AND location_country <> 'S/D' "
        "ORDER BY created_at ASC"
    )
    if limit:
        sql += f" LIMIT {int(limit)}"
    sql += ";"

    cmd = [
        "docker",
        "exec",
        "lodo-db-local",
        "mariadb",
        "-uroot",
        "-proot_password",
        "-N",
        "-e",
        sql,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
    rows = []
    for line in result.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) >= 5:
            rows.append(
                {
                    "id": parts[0],
                    "name": parts[1],
                    "country": parts[2],
                    "city": parts[3],
                    "website": parts[4],
                }
            )
    return rows


def count_with_coords():
    import subprocess

    cmd = [
        "docker",
        "exec",
        "lodo-db-local",
        "mariadb",
        "-uroot",
        "-proot_password",
        "-N",
        "-e",
        "USE lodo_db; SELECT COUNT(*) FROM organizations WHERE lat IS NOT NULL AND lng IS NOT NULL;",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
    return int(result.stdout.strip() or "0")


def publish_geocoded():
    import subprocess

    sql = (
        "USE lodo_db; "
        "UPDATE organizations "
        "SET status='PUBLISHED' "
        "WHERE lat IS NOT NULL AND lng IS NOT NULL;"
    )
    cmd = [
        "docker",
        "exec",
        "lodo-db-local",
        "mariadb",
        "-uroot",
        "-proot_password",
        "-e",
        sql,
    ]
    subprocess.run(cmd, check=True)


def main():
    parser = argparse.ArgumentParser(description="Geocodifica organizaciones usando el endpoint del backend.")
    parser.add_argument("--limit", type=int, default=None, help="Cantidad máxima de registros a procesar.")
    parser.add_argument("--delay", type=float, default=1.1, help="Pausa entre requests a Nominatim.")
    parser.add_argument("--publish", action="store_true", help="Publica las organizaciones que queden con coordenadas.")
    args = parser.parse_args()

    if not CSV_PATH.exists():
        print(f"No existe el CSV limpio: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    candidates = fetch_candidates(limit=args.limit)
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}

    total = len(candidates)
    ok = 0
    failed = 0

    for idx, item in enumerate(candidates, start=1):
        url = f"{API_URL}/organizations/{item['id']}/geocode"
        try:
            resp = requests.post(url, headers=headers, timeout=20)
            if resp.status_code == 200:
                ok += 1
            else:
                failed += 1
            print(f"[{idx}/{total}] {item['name']} -> {resp.status_code}")
        except Exception as exc:
            failed += 1
            print(f"[{idx}/{total}] {item['name']} -> ERROR {exc}")
        time.sleep(args.delay)

    with_coords = count_with_coords()
    print(f"Geocodificados OK: {ok}")
    print(f"Fallidos: {failed}")
    print(f"Total con coordenadas en DB: {with_coords}")

    if args.publish:
        publish_geocoded()
        print("Se publicaron los registros con coordenadas.")


if __name__ == "__main__":
    main()
