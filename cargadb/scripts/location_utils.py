import re
import unicodedata


MISSING_LOCATION_VALUE = "S/D"


COUNTRY_ALIASES = {
    "ar": "Argentina",
    "arg": "Argentina",
    "argentina": "Argentina",
    "republica argentina": "Argentina",
    "republicaargentina": "Argentina",
    "uy": "Uruguay",
    "uruguay": "Uruguay",
    "br": "Brasil",
    "bra": "Brasil",
    "brasil": "Brasil",
    "brazil": "Brasil",
    "cl": "Chile",
    "chile": "Chile",
    "mx": "México",
    "mexico": "México",
    "méxico": "México",
    "co": "Colombia",
    "colombia": "Colombia",
    "pe": "Perú",
    "peru": "Perú",
    "perú": "Perú",
    "bo": "Bolivia",
    "bolivia": "Bolivia",
    "py": "Paraguay",
    "paraguay": "Paraguay",
    "ec": "Ecuador",
    "ecuador": "Ecuador",
    "ve": "Venezuela",
    "venezuela": "Venezuela",
    "us": "Estados Unidos",
    "usa": "Estados Unidos",
    "u s a": "Estados Unidos",
    "u.s.a": "Estados Unidos",
    "eeuu": "Estados Unidos",
    "ee uu": "Estados Unidos",
    "estados unidos": "Estados Unidos",
    "united states": "Estados Unidos",
    "united states of america": "Estados Unidos",
    "uk": "Reino Unido",
    "u.k.": "Reino Unido",
    "reino unido": "Reino Unido",
    "united kingdom": "Reino Unido",
    "inglaterra": "Reino Unido",
    "es": "España",
    "espana": "España",
    "españa": "España",
    "spain": "España",
    "pa ses bajos": "Países Bajos",
    "paaises bajos": "Países Bajos",
    "paises bajos": "Países Bajos",
    "países bajos": "Países Bajos",
    "reino unidoraine": "Reino Unido",
    "uae": "Emiratos Árabes Unidos",
    "emiratos arabes unidos": "Emiratos Árabes Unidos",
    "emiratos árabes unidos": "Emiratos Árabes Unidos",
    "japan": "Japón",
    "japon": "Japón",
    "turkiye": "Turquía",
    "turquia": "Turquía",
    "turquía": "Turquía",
    "belgica": "Bélgica",
    "bélgica": "Bélgica",
    "de": "Alemania",
    "alemania": "Alemania",
    "germany": "Alemania",
    "fr": "Francia",
    "francia": "Francia",
    "france": "Francia",
    "it": "Italia",
    "italia": "Italia",
    "italy": "Italia",
    "nl": "Países Bajos",
    "holanda": "Países Bajos",
    "netherlands": "Países Bajos",
    "au": "Australia",
    "australia": "Australia",
    "ca": "Canadá",
    "canada": "Canadá",
    "canadá": "Canadá",
    "il": "Israel",
    "israel": "Israel",
    "cn": "China",
    "china": "China",
    "in": "India",
    "india": "India",
    "sg": "Singapur",
    "singapore": "Singapur",
    "singapur": "Singapur",
    "republica checa": "República Checa",
    "república checa": "República Checa",
    "czechia": "República Checa",
    "barein": "Baréin",
    "baréin": "Baréin",
    "finlandiaia": "Finlandia",
    "argentina brasil": "S/D",
}


REGION_ALIASES_BY_COUNTRY = {
    "Argentina": {
        "buenos aires": "Buenos Aires",
        "provincia de buenos aires": "Buenos Aires",
        "pba": "Buenos Aires",
        "caba": "CABA",
        "capital federal": "CABA",
        "ciudad autonoma de buenos aires": "CABA",
        "cordoba": "Córdoba",
        "córdoba": "Córdoba",
        "santa fe": "Santa Fe",
        "mendoza": "Mendoza",
        "tucuman": "Tucumán",
        "tucumán": "Tucumán",
        "entre rios": "Entre Ríos",
        "entre ríos": "Entre Ríos",
        "salta": "Salta",
        "neuquen": "Neuquén",
        "neuquén": "Neuquén",
        "rio negro": "Río Negro",
        "río negro": "Río Negro",
        "misiones": "Misiones",
        "corrientes": "Corrientes",
        "san juan": "San Juan",
        "la pampa": "La Pampa",
        "jujuy": "Jujuy",
        "chaco": "Chaco",
        "formosa": "Formosa",
        "catamarca": "Catamarca",
        "la rioja": "La Rioja",
        "san luis": "San Luis",
        "santa cruz": "Santa Cruz",
        "tierra del fuego": "Tierra del Fuego",
        "santiago del estero": "Santiago del Estero",
        "chubut": "Chubut",
    },
    "Brasil": {
        "sp": "São Paulo",
        "sao paulo": "São Paulo",
        "rj": "Rio de Janeiro",
        "rio de janeiro": "Rio de Janeiro",
        "mg": "Minas Gerais",
        "rs": "Rio Grande do Sul",
        "pr": "Paraná",
        "sc": "Santa Catarina",
    },
    "Estados Unidos": {
        "al": "Alabama",
        "ak": "Alaska",
        "az": "Arizona",
        "ar": "Arkansas",
        "ca": "California",
        "co": "Colorado",
        "ct": "Connecticut",
        "dc": "District of Columbia",
        "de": "Delaware",
        "fl": "Florida",
        "ga": "Georgia",
        "hi": "Hawaii",
        "ia": "Iowa",
        "id": "Idaho",
        "il": "Illinois",
        "in": "Indiana",
        "ks": "Kansas",
        "ky": "Kentucky",
        "la": "Louisiana",
        "ma": "Massachusetts",
        "md": "Maryland",
        "me": "Maine",
        "mi": "Michigan",
        "mn": "Minnesota",
        "mo": "Missouri",
        "ms": "Mississippi",
        "mt": "Montana",
        "nc": "North Carolina",
        "nd": "North Dakota",
        "ne": "Nebraska",
        "nh": "New Hampshire",
        "nj": "New Jersey",
        "nm": "New Mexico",
        "nv": "Nevada",
        "ny": "New York",
        "oh": "Ohio",
        "ok": "Oklahoma",
        "or": "Oregon",
        "pa": "Pennsylvania",
        "ri": "Rhode Island",
        "sc": "South Carolina",
        "sd": "South Dakota",
        "tn": "Tennessee",
        "tx": "Texas",
        "ut": "Utah",
        "va": "Virginia",
        "vt": "Vermont",
        "wa": "Washington",
        "wi": "Wisconsin",
        "wv": "West Virginia",
        "wy": "Wyoming",
    },
    "Canadá": {
        "ab": "Alberta",
        "bc": "British Columbia",
        "mb": "Manitoba",
        "nb": "New Brunswick",
        "nl": "Newfoundland and Labrador",
        "ns": "Nova Scotia",
        "nt": "Northwest Territories",
        "nu": "Nunavut",
        "on": "Ontario",
        "pe": "Prince Edward Island",
        "qc": "Quebec",
        "sk": "Saskatchewan",
        "yt": "Yukon",
    },
}


CITY_ALIASES_BY_COUNTRY = {
    "Argentina": {
        "capital federal": "CABA",
        "ciudad autonoma de buenos aires": "CABA",
    },
    "Brasil": {
        "s o paulo": "São Paulo",
        "sao paulo": "São Paulo",
    },
    "Israel": {
        "tel aviv yafo": "Tel Aviv",
        "tel aviv": "Tel Aviv",
        "raanana": "Ra'anana",
        "petach tikva": "Petah Tikva",
        "petah tikva": "Petah Tikva",
        "herzilya": "Herzliya",
        "herzliya": "Herzliya",
        "kefar sava": "Kfar Saba",
        "kfar saba": "Kfar Saba",
        "modiin": "Modi'in",
        "nazareth": "Nazareth",
    },
}


GENERIC_REGION_VALUES = {
    "latam",
    "asia",
    "africa",
    "sin contacto",
    "sin datos",
    "sin dato",
    "s d",
    "polonia",
    "lievegem",
    "renania del norte",
    "irlanda del norte",
}


CITY_LIKE_REGION_VALUES = {
    "shenzhen",
    "fremont",
    "rosario",
    "rio cuarto",
    "río cuarto",
    "venado tuerto",
    "sao paulo",
    "madrid",
    "helsinki",
    "turin",
    "turín",
    "kona",
}


KNOWN_COUNTRY_SLUGS = set(COUNTRY_ALIASES.keys())


def slugify(value):
    if value is None:
        return ""
    normalized = unicodedata.normalize("NFKD", str(value))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.lower().strip()
    ascii_value = re.sub(r"[^\w\s/-]", " ", ascii_value)
    ascii_value = re.sub(r"[_\-/]+", " ", ascii_value)
    ascii_value = re.sub(r"\s+", " ", ascii_value)
    return ascii_value.strip()


def fix_mojibake(value):
    if value is None:
        return None
    text = str(value)
    suspicious = ("Ã", "Â", "â", "ð", "×")
    if any(token in text for token in suspicious):
        for src, dst in (("latin1", "utf-8"), ("cp1252", "utf-8")):
            try:
                repaired = text.encode(src, errors="ignore").decode(dst, errors="ignore")
                if repaired and repaired != text:
                    text = repaired
                    break
            except Exception:
                continue
    return text


def clean_location_value(value):
    if value is None:
        return None
    text = fix_mojibake(value)
    text = str(text).strip()
    if not text:
        return None

    text = re.sub(r"\s+", " ", text)
    if slugify(text) in {
        "s d",
        "sd",
        "n d",
        "nd",
        "sin dato",
        "sin datos",
        "none",
        "nan",
        "unknown",
        "no datos disponibles",
        "no datos visibles",
        "no disponible publicamente",
        "no figura",
        "europa n d exacto",
    }:
        return None
    return text


def strip_location_noise(value):
    cleaned = clean_location_value(value)
    if not cleaned:
        return None

    text = cleaned.strip()
    text = re.sub(r"^(d|de|del|desde)\s+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^[,;:.\-_/\\\s]+", "", text)
    text = re.sub(r"[,;:.\-_/\\\s]+$", "", text)
    return text or None


def smart_title(value):
    if not value:
        return None
    lower_words = {"de", "del", "la", "las", "los", "y", "of", "and"}
    words = []
    for word in str(value).split():
        if word.lower() in lower_words:
            words.append(word.lower())
        else:
            words.append(word[:1].upper() + word[1:].lower())
    return " ".join(words)


def looks_like_address(value):
    if not value:
        return False
    text = str(value).strip()
    slug = slugify(text)
    address_words = {
        "street", "st", "road", "rd", "avenue", "ave", "boulevard", "blvd", "building",
        "center", "centre", "wework", "floor", "suite", "park", "port", "derech",
        "rehov", "ha", "ben", "maskit", "habarzel", "rothschild",
    }
    if any(word in slug.split() for word in address_words):
        return True
    if re.search(r"\d", text):
        return True
    return False


def is_country_like(value):
    if not value:
        return False
    return slugify(value) in KNOWN_COUNTRY_SLUGS


def normalize_country(value):
    cleaned = strip_location_noise(value)
    if not cleaned:
        return MISSING_LOCATION_VALUE

    slug = slugify(cleaned)
    if slug in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[slug]

    return smart_title(cleaned)


def simplify_israel_value(value):
    cleaned = strip_location_noise(value)
    if not cleaned:
        return MISSING_LOCATION_VALUE
    aliases = CITY_ALIASES_BY_COUNTRY.get("Israel", {})
    slug = slugify(cleaned)
    if slug in aliases:
        return aliases[slug]
    if slug in {"israel", "tel", "haasmaut"}:
        return MISSING_LOCATION_VALUE
    if looks_like_address(cleaned):
        return MISSING_LOCATION_VALUE
    if len(cleaned.split()) > 3:
        return MISSING_LOCATION_VALUE
    return smart_title(cleaned)


def normalize_region(country, value):
    cleaned = strip_location_noise(value)
    if not cleaned:
        return MISSING_LOCATION_VALUE

    normalized_country = normalize_country(country)
    if normalized_country == "Israel":
        return MISSING_LOCATION_VALUE

    slug = slugify(cleaned)
    if slug in GENERIC_REGION_VALUES or slug in CITY_LIKE_REGION_VALUES:
        return MISSING_LOCATION_VALUE

    if is_country_like(cleaned):
        candidate_country = normalize_country(cleaned)
        if candidate_country == normalized_country or candidate_country != MISSING_LOCATION_VALUE:
            return MISSING_LOCATION_VALUE

    if looks_like_address(cleaned):
        return MISSING_LOCATION_VALUE

    aliases = REGION_ALIASES_BY_COUNTRY.get(normalized_country, {})
    if slug in aliases:
        return aliases[slug]

    return smart_title(cleaned)


def normalize_city(country, value):
    cleaned = strip_location_noise(value)
    if not cleaned:
        return MISSING_LOCATION_VALUE

    normalized_country = normalize_country(country)
    if normalized_country == "Israel":
        return simplify_israel_value(cleaned)

    aliases = CITY_ALIASES_BY_COUNTRY.get(normalized_country, {})
    slug = slugify(cleaned)
    if slug in aliases:
        return aliases[slug]

    if is_country_like(cleaned) and normalize_country(cleaned) == normalized_country:
        return MISSING_LOCATION_VALUE

    if slug in GENERIC_REGION_VALUES:
        return MISSING_LOCATION_VALUE

    return smart_title(cleaned)


def adjust_city_region_pair(country, region, city):
    region_slug = slugify(region)
    city_slug = slugify(city)

    if country != MISSING_LOCATION_VALUE and region == country:
        region = MISSING_LOCATION_VALUE
        region_slug = slugify(region)

    if region_slug in CITY_LIKE_REGION_VALUES and city == MISSING_LOCATION_VALUE:
        city = smart_title(region)
        region = MISSING_LOCATION_VALUE

    if region_slug in GENERIC_REGION_VALUES:
        region = MISSING_LOCATION_VALUE

    if city_slug in GENERIC_REGION_VALUES:
        city = MISSING_LOCATION_VALUE

    if country == "Israel" and city_slug in {"israel", "tel", "haasmaut"}:
        city = MISSING_LOCATION_VALUE

    return region, city


def split_city_region(value):
    cleaned = clean_location_value(value)
    if not cleaned:
        return None, None

    parts = [part.strip() for part in re.split(r"\s*[|,/;-]\s*", cleaned) if part.strip()]
    if not parts:
        return None, None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], parts[1]
