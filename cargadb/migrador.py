import os
import io
import pandas as pd
import mysql.connector
import uuid
import shutil
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# --- CONFIGURACIÓN DE RUTAS ---
BASE_PATH = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_FILE = os.path.join(BASE_PATH, 'service_account.json')
PATH_SUCIOS = os.path.join(BASE_PATH, 'excels', '1_sucios')
PATH_LIMPIOS = os.path.join(BASE_PATH, 'excels', '2_limpios')
PATH_USADOS = os.path.join(BASE_PATH, 'excels', '3_usados')

# ID de la carpeta de Drive (Leonel)
DRIVE_FOLDER_ID = "1yqGbYsyTA2lfCSgk49J5lTwvHGpX1vKe"

for p in [PATH_SUCIOS, PATH_LIMPIOS, PATH_USADOS]:
    os.makedirs(p, exist_ok=True)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '', # Tu password aquí
    'database': 'lodo_db'
}

# --- UTILIDADES DE LIMPIEZA ---

def normalizar_texto(texto):
    if pd.isna(texto) or str(texto).strip() == "" or str(texto).lower() == "nan": return None
    return str(texto).strip().lower()

def normalizar_url(url):
    if pd.isna(url) or str(url).strip() == "" or str(url).lower() == "nan": return None
    url = str(url).strip().lower()
    for prefix in ["https://", "http://", "www."]:
        url = url.replace(prefix, "")
    return url.rstrip('/')

def safe_json(val):
    if not val: return None
    return json.dumps(val)

def get_val(row, col_names, default=None):
    if isinstance(col_names, str): col_names = [col_names]
    for col in col_names:
        if col in row:
            val = row[col]
            if not pd.isna(val) and str(val).strip() != "" and str(val).lower() != "nan":
                return str(val).strip()
    return default

# --- LÓGICA DE API GOOGLE DRIVE ---

def descargar_archivos_drive():
    print("Conectando con Google Drive API...")
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=['https://www.googleapis.com/auth/drive']
    )
    service = build('drive', 'v3', credentials=creds)

    # 1. Listar contenido de la carpeta para diagnóstico
    results = service.files().list(
        q=f"'{DRIVE_FOLDER_ID}' in parents and trashed = false",
        fields="files(id, name, mimeType)"
    ).execute()
    items = results.get('files', [])

    if not items:
        print("No se detectaron archivos. Verifica que compartiste la carpeta con el correo del Service Account.")
        return []

    print(f"Archivos encontrados en Drive: {len(items)}")
    
    descargados = []
    for item in items:
        file_id = item['id']
        file_name = item['name']
        mime_type = item['mimeType']
        
        # Ajustar nombre si es Google Sheet nativo para que pandas lo lea
        local_name = file_name if file_name.lower().endswith(('.xlsx', '.csv')) else f"{file_name}.xlsx"
        file_path = os.path.join(PATH_SUCIOS, local_name)

        print(f"Descargando: {file_name}...")
        
        try:
            if mime_type == 'application/vnd.google-apps.spreadsheet':
                # Exportar Google Sheets a XLSX
                request = service.files().export_media(fileId=file_id, mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            else:
                # Descargar binario directo (CSV o XLSX subido)
                request = service.files().get_media(fileId=file_id)

            with io.FileIO(file_path, 'wb') as fh:
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while not done:
                    _, done = downloader.next_chunk()
            descargados.append(local_name)
        except Exception as e:
            print(f"Error descargando {file_name}: {e}")

    return descargados

# --- MIGRACIÓN Y ENRIQUECIMIENTO ---

def ejecutar_migracion():
    descargar_archivos_drive()
    
    archivos_locales = [f for f in os.listdir(PATH_SUCIOS) if f.lower().endswith(('.xlsx', '.csv'))]
    if not archivos_locales:
        print("Nada que procesar en la carpeta local.")
        return

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
    except Exception as e:
        print(f"Error DB: {e}")
        return

    for archivo in archivos_locales:
        ruta_origen = os.path.join(PATH_SUCIOS, archivo)
        print(f"\n>>> Procesando datos de: {archivo}")
        
        try:
            df = pd.read_csv(ruta_origen) if archivo.lower().endswith('.csv') else pd.read_excel(ruta_origen)
            
            # Limpieza de cabeceras sucias
            if any(str(c).startswith("Unnamed") for c in df.columns):
                for i in range(min(5, len(df))):
                    row_vals = [str(x).lower() for x in df.iloc[i].fillna("")]
                    if any(kw in row_vals for kw in ["name", "nombre", "startup"]):
                        df.columns = df.iloc[i]
                        df = df[i+1:].reset_index(drop=True)
                        break

            for _, row in df.iterrows():
                nombre_raw = get_val(row, ['Nombre', 'name', 'Startup', 'Empresa'])
                if not nombre_raw: continue
                
                nombre_l = normalizar_texto(nombre_raw)
                url_l = normalizar_url(get_val(row, ['Website', 'web', 'URL']))

                # Búsqueda de duplicado (Deduplicación inteligente Leonel)
                query_search = "SELECT id, city, region, mail, solucion FROM organizations WHERE LOWER(name) = %s"
                params_search = [nombre_l]
                if url_l:
                    query_search += " OR website LIKE %s"
                    params_search.append(f"%{url_l}%")
                
                cursor.execute(query_search, tuple(params_search))
                existente = cursor.fetchone()

                if existente:
                    # CASO EXISTE: ENRIQUECER HUECOS
                    upd = []
                    params = []
                    mapping = {
                        'city': get_val(row, ['Ciudad', 'City', 'Localidad']),
                        'region': get_val(row, ['Provincia', 'Region', 'Estado']),
                        'mail': get_val(row, ['Email', 'email', 'Correo']),
                        'solucion': get_val(row, ['Solucion', 'Descripción', 'description']),
                        'contact_phone': get_val(row, ['Telefono', 'Teléfono', 'Phone'])
                    }

                    for col_db, val_excel in mapping.items():
                        if not existente.get(col_db) and val_excel:
                            upd.append(f"{col_db} = %s")
                            params.append(val_excel)

                    if upd:
                        sql_upd = f"UPDATE organizations SET {', '.join(upd)}, updated_at = NOW() WHERE id = %s"
                        params.append(existente['id'])
                        cursor.execute(sql_upd, tuple(params))
                        print(f"  [ACTUALIZADO] {nombre_raw} (Huecos llenados)")
                else:
                    # CASO NUEVO: INSERTAR
                    nuevo_id = str(uuid.uuid4())
                    sql_ins = """
                        INSERT INTO organizations 
                        (id, name, website, vertical, country, region, city, estadio_actual, 
                        solucion, mail, status, created_at, updated_at) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'DRAFT', NOW(), NOW())
                    """
                    cursor.execute(sql_ins, (
                        nuevo_id, nombre_raw, get_val(row, 'Website'),
                        get_val(row, ['Vertical', 'Industria'], 'otra'),
                        get_val(row, ['Pais', 'Country'], 'Argentina'),
                        get_val(row, ['Provincia', 'Region'], 'S/D'),
                        get_val(row, ['Ciudad', 'City'], 'S/D'),
                        get_val(row, ['Estadio', 'Stage', 'Madurez']),
                        get_val(row, ['Solucion', 'Descripción'], 'Carga Automática'),
                        get_val(row, ['Email', 'email'])
                    ))
                    print(f"  [INSERTADO] {nombre_raw}")

            conn.commit()
            
            # Mover archivo a usados
            shutil.move(ruta_origen, os.path.join(PATH_USADOS, archivo))

        except Exception as e:
            conn.rollback()
            print(f"Error procesando {archivo}: {e}")

    cursor.close()
    conn.close()
    print("\n>>> Carga masiva finalizada exitosamente.")

if __name__ == "__main__":
    ejecutar_migracion()