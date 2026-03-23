import json
import logging
import os
import time

import pandas as pd

from location_utils import (
    adjust_city_region_pair,
    MISSING_LOCATION_VALUE,
    clean_location_value,
    normalize_city,
    normalize_country,
    normalize_region,
    slugify,
    smart_title,
    split_city_region,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH_SUCIOS = os.path.join(BASE_DIR, "data", "1_sucios", "dataset_para_limpiar.xlsx")
PATH_SUCIOS_CSV = os.path.join(BASE_DIR, "data", "1_sucios", "dataset_real.csv")
PATH_LIMPIOS = os.path.join(BASE_DIR, "data", "2_limpios", "startups_limpias_final.csv")
GEOCODE_IN_TRANSFORMER = os.getenv("GEOCODE_IN_TRANSFORMER", "false").strip().lower() == "true"

MAP_VERTICAL = {
    "agtech": "agtech",
    "agricultura": "agtech",
    "agri-tech": "agtech",
    "biotecnologia y bioinsumos": "biotech_bioinputs",
    "biotecnología y bioinsumos": "biotech_bioinputs",
    "biotech": "biotech_bioinputs",
    "foodtech": "foodtech",
    "alimentos": "foodtech",
    "climatech": "climatech",
    "clima": "climatech",
    "economia circular": "circular_economy",
    "economía circular": "circular_economy",
    "circular": "circular_economy",
}

geocode_cache = {}

try:
    from geopy.exc import GeocoderTimedOut
    from geopy.geocoders import Nominatim
except ModuleNotFoundError:
    GeocoderTimedOut = Exception
    Nominatim = None

geolocator = Nominatim(user_agent="lodo_etl_transformer") if Nominatim else None

LOCATION_FORCE_COUNTRY_ONLY = {
    slugify("Northvolt"),
    slugify("Beyond SnÃ¡ck"),
    slugify("Vicentin S.A.I.C."),
    slugify("Uncle Nearest"),
    slugify("MarginEdge"),
    slugify("Lwart Environmental Solutions"),
    slugify("Arevon Energy"),
    slugify("Form Energy"),
    slugify("PosiGen"),
    slugify("Beanstalk"),
    slugify("Tiptapp"),
    slugify("Kokhavynska Paper Factory"),
    slugify("Mimbly"),
    slugify("Loopfront"),
    slugify("Nordic SeaFarm"),
    slugify("Stream BioEnergy"),
    slugify("NX-Tech"),
    slugify("BEP Korea"),
    slugify("Cortexia"),
    slugify("NACO Technologies"),
}


def clean_val(val):
    if pd.isna(val) or str(val).strip().lower() in ["s/d", "n/d", "nan", "none", "", "0", 0]:
        return None
    return str(val).strip()


def normalize_dataframe_columns(df):
    rename_map = {}
    for column in df.columns:
        slug = slugify(column)
        if "principal sede de operaciones" in slug:
            slug = "country_source"
        elif slug.startswith("ciudad") and "regi" in slug:
            slug = "city_region_source"
        elif slug.startswith("descripcion"):
            slug = "solucion_source"
        elif slug.startswith("estad") and "actual" in slug:
            slug = "estadio_actual_source"
        elif slug.startswith("tel"):
            slug = "telefono_source"
        elif slug.startswith("founder"):
            slug = "founders_source"
        elif slug.startswith("resultado outcome"):
            slug = "outcome_source"
        rename_map[column] = slug
    return df.rename(columns=rename_map)


def field(row, *candidates):
    for candidate in candidates:
        value = row.get(candidate)
        if value is None:
            value = row.get(slugify(candidate))
        if value is not None and not (isinstance(value, float) and pd.isna(value)):
            return value
    return None


def build_location(row):
    name = clean_val(field(row, "name"))
    raw_country = clean_location_value(
        field(
            row,
            "country_source",
            "país ¿dónde se encuentra su principal sede de operaciones?",
            "pais donde se encuentra su principal sede de operaciones",
        )
    )
    raw_city_region = clean_location_value(field(row, "city_region_source", "ciudad/región", "ciudad region"))

    raw_city, raw_region = split_city_region(raw_city_region)
    country = normalize_country(raw_country)
    region = normalize_region(country, raw_region)
    city = normalize_city(country, raw_city)
    region, city = adjust_city_region_pair(country, region, city)

    # Evita duplicar ciudad y región cuando ambas terminan con el mismo valor normalizado.
    if city != MISSING_LOCATION_VALUE and region != MISSING_LOCATION_VALUE and city == region:
        region = MISSING_LOCATION_VALUE

    if slugify(name) in LOCATION_FORCE_COUNTRY_ONLY:
        region = MISSING_LOCATION_VALUE
        city = MISSING_LOCATION_VALUE

    return {
        "location": {
            "country": country,
            "region": region,
            "city": city,
        },
        "country_raw": raw_country or MISSING_LOCATION_VALUE,
        "region_raw": raw_region or MISSING_LOCATION_VALUE,
        "city_raw": raw_city or MISSING_LOCATION_VALUE,
        "country_normalized": country,
        "region_normalized": region,
        "city_normalized": city,
    }


def get_coords(loc_obj):
    if geolocator is None:
        logging.warning("Geocodificacion omitida: geopy no esta instalado en este entorno.")
        return None, None

    query_parts = [
        part
        for part in [loc_obj.get("city"), loc_obj.get("region"), loc_obj.get("country")]
        if part and part != MISSING_LOCATION_VALUE
    ]
    query = ", ".join(query_parts)

    if not query:
        return None, None

    if query in geocode_cache:
        return geocode_cache[query]

    try:
        location = geolocator.geocode(query, timeout=10)
        if location:
            geocode_cache[query] = (location.latitude, location.longitude)
            return geocode_cache[query]

        country = loc_obj.get("country")
        if country and country != MISSING_LOCATION_VALUE:
            location = geolocator.geocode(country, timeout=10)
            if location:
                geocode_cache[query] = (location.latitude, location.longitude)
                return geocode_cache[query]
    except (GeocoderTimedOut, Exception) as exc:
        logging.warning("Error geocodificando %s: %s", query, exc)

    geocode_cache[query] = (None, None)
    return None, None


def transform_row(row):
    name = clean_val(field(row, "name"))
    if not name:
        return None

    location_data = build_location(row)
    loc_data = location_data["location"]

    lat, lng = None, None
    if GEOCODE_IN_TRANSFORMER:
        lat, lng = get_coords(loc_data)
        time.sleep(1)

    social_media = {}
    social_mapping = {
        "linkedin": field(row, "LINKEDIN"),
        "instagram": field(row, "INSTAGRAM"),
        "facebook": field(row, "FACEBOOK"),
        "twitter": field(row, "X (twitter)"),
    }
    for platform, value in social_mapping.items():
        cleaned = clean_val(value)
        if cleaned:
            social_media[platform] = cleaned

    raw_vert = str(field(row, "vertical") or "").lower().strip()
    vertical_tecnica = MAP_VERTICAL.get(raw_vert, "otra")

    estadio_raw = clean_val(field(row, "estadio_actual_source", "Estadío actual", "Estadio actual"))
    estadio_final = estadio_raw.lower().replace(" ", "_") if estadio_raw else None

    biz_model_raw = clean_val(field(row, "Modelo de Negocio"))
    biz_model_final = biz_model_raw.lower() if biz_model_raw else None

    outcome_raw = clean_val(
        field(
            row,
            "outcome_source",
            "RESULTADO / OUTCOME ¿QUÉ PASÓ CON LA EMPRESA?",
            "RESULTADO / OUTCOME QUE PASO CON LA EMPRESA",
        )
    )
    outcome_final = outcome_raw.lower() if outcome_raw else None

    return {
        "name": name,
        "website": clean_val(field(row, "website")),
        "vertical": vertical_tecnica,
        "sub_vertical": clean_val(field(row, "sub vertical")),
        "location": json.dumps(loc_data, ensure_ascii=False),
        "country_raw": location_data["country_raw"],
        "region_raw": location_data["region_raw"],
        "city_raw": location_data["city_raw"],
        "country_normalized": location_data["country_normalized"],
        "region_normalized": location_data["region_normalized"],
        "city_normalized": location_data["city_normalized"],
        "logo_url": clean_val(field(row, "Logo")),
        "estadio_actual": estadio_final,
        "solucion": clean_val(field(row, "solucion_source", "Descripcion / solución", "Descripcion / solucion")),
        "mail": clean_val(field(row, "Mail")),
        "social_media": json.dumps(social_media, ensure_ascii=False) if social_media else None,
        "contact_phone": clean_val(field(row, "telefono_source", "Teléfono", "Telefono")),
        "founders": json.dumps(
            [f.strip() for f in str(field(row, "founders_source", "Founder/s")).split(",")]
            if pd.notna(field(row, "founders_source", "Founder/s"))
            else []
        ),
        "founded": int(field(row, "Founded"))
        if pd.notna(field(row, "Founded")) and str(field(row, "Founded")).isdigit()
        else None,
        "organization_type": "startup",
        "outcome_status": outcome_final,
        "business_model": biz_model_final,
        "badges": json.dumps([]),
        "notes": clean_val(field(row, "IMPACTO /SOCIOAMBIENTAL")),
        "status": "PUBLISHED" if lat and lng else "IN_REVIEW",
        "lat": lat,
        "lng": lng,
        "geocode_source": "transformer" if lat and lng else "backend_pending",
    }


def transformar_datos():
    mode = "con geocodificacion" if GEOCODE_IN_TRANSFORMER else "sin geocodificacion"
    logging.info("Iniciando fase de Transformacion %s...", mode)

    source_path = None
    if os.path.exists(PATH_SUCIOS_CSV):
        source_path = PATH_SUCIOS_CSV
    elif os.path.exists(PATH_SUCIOS):
        source_path = PATH_SUCIOS

    if not source_path:
        logging.error("Error: No se encontro archivo de origen en %s ni %s", PATH_SUCIOS_CSV, PATH_SUCIOS)
        return

    if source_path.lower().endswith(".csv"):
        df = normalize_dataframe_columns(pd.read_csv(source_path, encoding="utf-8"))
    else:
        df = normalize_dataframe_columns(pd.read_excel(source_path))

    logging.info("Archivo fuente detectado: %s", source_path)
    processed_records = []

    for index, row in df.iterrows():
        record = transform_row(row)
        if not record:
            continue

        processed_records.append(record)
        location = json.loads(record["location"])
        logging.info(
            "[%s] Procesado: %s | %s / %s / %s (Coord: %s, %s)",
            index,
            record["name"],
            location["country"],
            location["region"],
            location["city"],
            record["lat"],
            record["lng"],
        )

    if processed_records:
        df_final = pd.DataFrame(processed_records)
        os.makedirs(os.path.dirname(PATH_LIMPIOS), exist_ok=True)
        df_final.to_csv(PATH_LIMPIOS, index=False, sep=";", encoding="utf-8-sig")
        logging.info("Exito: Se han exportado %s registros a %s", len(df_final), PATH_LIMPIOS)
    else:
        logging.warning("No se procesaron registros. El CSV no fue generado.")


if __name__ == "__main__":
    transformar_datos()
