import os
import sys
import json
import time
import requests
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.auth.transport.requests import Request
import pickle
import yt_dlp

# --- CONFIGURATION ---
VIMEO_API_URL = "https://api.vimeo.com"

# Try to load from .env automatically
def load_env():
    paths_to_try = [".env", "../.env", "../../.env"]
    for path in paths_to_try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        val = val.strip("'\"")
                        os.environ[key.strip()] = val
            break

load_env()
VIMEO_TOKEN = os.environ.get("VIMEO_ACCESS_TOKEN", "")

# YouTube settings
YOUTUBE_CLIENT_SECRETS_FILE = "client_secrets.json"
YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
YOUTUBE_PRIVACY_STATUS = "unlisted"  # 'public', 'private', or 'unlisted'

LOG_FILE = "migration_log.json"
URLS_FILE = "videos_to_migrate.txt"

def load_migration_log():
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_migration_log(log_data):
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=4, ensure_ascii=False)

def get_vimeo_videos_from_api(token):
    headers = {"Authorization": f"Bearer {token}"}
    videos = []
    url = f"{VIMEO_API_URL}/me/videos?per_page=100"
    
    print("Obteniendo lista de videos de Vimeo vía API...")
    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Error al conectar con Vimeo (Código {response.status_code}): {response.text}")
            break
            
        data = response.json()
        videos.extend(data.get("data", []))
        
        paging = data.get("paging", {})
        url = paging.get("next")
        if url:
            url = f"{VIMEO_API_URL}{url}" if url.startswith("/") else url
            
    # Convert API response to common format
    standard_list = []
    for item in videos:
        uri = item.get("uri", "")
        vimeo_id = uri.split("/")[-1] if uri else ""
        standard_list.append({
            "id": vimeo_id,
            "title": item.get("name", "Video sin título"),
            "description": item.get("description", "") or "",
            "url": item.get("link", f"https://vimeo.com/{vimeo_id}")
        })
    return standard_list

def get_vimeo_videos_from_file():
    if not os.path.exists(URLS_FILE):
        return []
        
    print(f"Leyendo lista de videos desde '{URLS_FILE}'...")
    videos = []
    with open(URLS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # A line can be just a URL or "URL|Title|Description"
            parts = line.split("|")
            url = parts[0].strip()
            vimeo_id = url.split("/")[-1].split("?")[0]
            
            title = parts[1].strip() if len(parts) > 1 else f"Video {vimeo_id}"
            description = parts[2].strip() if len(parts) > 2 else ""
            
            videos.append({
                "id": vimeo_id,
                "title": title,
                "description": description,
                "url": url
            })
    return videos

def get_youtube_service():
    creds = None
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
            
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(YOUTUBE_CLIENT_SECRETS_FILE):
                print(f"ERROR: No se encontró el archivo '{YOUTUBE_CLIENT_SECRETS_FILE}'.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(
                YOUTUBE_CLIENT_SECRETS_FILE, YOUTUBE_SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)
            
    return build("youtube", "v3", credentials=creds)

def download_video_ytdlp(url, local_filename):
    print(f"Descargando video mediante yt-dlp desde: {url}...")
    ydl_opts = {
        'outtmpl': local_filename,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    print("Descarga completada.")

def upload_to_youtube(youtube, file_path, title, description):
    print(f"Subiendo a YouTube: {title}...")
    body = {
        "snippet": {
            "title": title[:100],
            "description": description or "Migrado desde Vimeo",
            "categoryId": "22"
        },
        "status": {
            "privacyStatus": YOUTUBE_PRIVACY_STATUS
        }
    }
    
    media = MediaFileUpload(
        file_path, 
        chunksize=1024*1024, 
        resumable=True, 
        mimetype="video/*"
    )
    
    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media
    )
    
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Progreso de subida: {int(status.progress() * 100)}%")
            
    print(f"Subido con éxito. ID de YouTube: {response['id']}")
    return response['id']

def main():
    log_data = load_migration_log()
    youtube = get_youtube_service()
    
    # 1. Determine the source of videos (TXT file or API)
    vimeo_videos = get_vimeo_videos_from_file()
    
    if not vimeo_videos:
        if not VIMEO_TOKEN:
            print(f"ERROR: No se encontró la lista '{URLS_FILE}' y tampoco hay un VIMEO_ACCESS_TOKEN configurado en el archivo .env.")
            print("Crea el archivo 'videos_to_migrate.txt' con tus enlaces de Vimeo o añade el token de Vimeo.")
            sys.exit(1)
        vimeo_videos = get_vimeo_videos_from_api(VIMEO_TOKEN)
        
    if not vimeo_videos:
        print("No se encontraron videos para migrar.")
        sys.exit(0)
        
    print(f"Se procesarán {len(vimeo_videos)} videos en total.")
    
    for idx, video in enumerate(vimeo_videos):
        vimeo_id = video["id"]
        title = video["title"]
        description = video["description"]
        url = video["url"]
        
        print(f"\n[{idx + 1}/{len(vimeo_videos)}] Procesando: {title} (ID Vimeo: {vimeo_id})")
        
        # Check if already migrated
        if vimeo_id in log_data and log_data[vimeo_id].get("status") == "completed":
            print(f"Ya migrado anteriormente. Link de YouTube: https://youtu.be/{log_data[vimeo_id]['youtube_id']}")
            continue
            
        temp_filename = f"temp_{vimeo_id}.mp4"
        
        try:
            # Download using yt-dlp
            download_video_ytdlp(url, temp_filename)
            
            # Upload to YouTube
            youtube_id = upload_to_youtube(youtube, temp_filename, title, description)
            
            # Log progress
            log_data[vimeo_id] = {
                "title": title,
                "youtube_id": youtube_id,
                "status": "completed",
                "timestamp": time.time()
            }
            save_migration_log(log_data)
            
        except Exception as e:
            print(f"Error procesando video {title}: {str(e)}")
            log_data[vimeo_id] = {
                "title": title,
                "status": "failed",
                "error": str(e),
                "timestamp": time.time()
            }
            save_migration_log(log_data)
            
        finally:
            # Clean up local file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
                
    print("\n¡Proceso de migración terminado!")

if __name__ == "__main__":
    main()
