import os
from fastapi import FastAPI, Query, HTTPException
from requests.exceptions import RequestException
from fastapi.responses import StreamingResponse, JSONResponse, Response
import uvicorn
import requests
import json
from fastapi.middleware.cors import CORSMiddleware
import time
import threading
import logging
import psutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a FastAPI app
app = FastAPI(root_path="/esg/nature-risk")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the base URL for CDN file access
# BASE_URL = "http://cc-esg-svc-clhs-esg-sa-10.apps.colt-np2.ocp.dev.net/esg/clhs/downloadlocationcsv?filename=/wb4_nfs357/imftusr051/cra/alignmentdata/"

BASE_URL = "http://edfinhub.com/files/download?filename=/alignmentdata/"

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create a persistent session with connection pooling for better performance
session = requests.Session()
adapter = requests.adapters.HTTPAdapter(
    pool_connections=10,
    pool_maxsize=20,
    max_retries=3,
    pool_block=False
)
session.mount('http://', adapter)
session.mount('https://', adapter)

# In-memory progress store: {session_id: {"total": int, "sent": int}}
progress_store = {}

# ── In-memory file cache ──────────────────────────────────────────────
# Caches fetched files in memory so repeated requests skip the network round-trip.
file_cache = {}  # {relative_path: {"data": bytes, "time": float}}
CACHE_TTL = 3600  # 1 hour TTL

def get_cached_or_fetch(relative_path: str) -> bytes:
    """Return file bytes from cache or fetch from VPS and cache."""
    now = time.time()
    cached = file_cache.get(relative_path)
    if cached and (now - cached["time"]) < CACHE_TTL:
        logger.info(f"Cache HIT: {relative_path}")
        return cached["data"]

    url = BASE_URL + relative_path.lstrip("/")
    logger.info(f"Cache MISS, fetching: {url}")
    response = session.get(url, timeout=(10, 300), headers={'Accept-Encoding': 'gzip, deflate'})
    response.raise_for_status()
    data = response.content
    file_cache[relative_path] = {"data": data, "time": now}
    logger.info(f"Cached: {relative_path} ({len(data) / (1024*1024):.1f} MB)")
    return data

def prefetch_file(relative_path: str):
    """Prefetch a file in background thread."""
    try:
        get_cached_or_fetch(relative_path)
    except Exception as e:
        logger.error(f"Prefetch failed for {relative_path}: {e}")

# Prefetch commonly used files on startup
PREFETCH_FILES = [
    "client/glencore.topojson",
    "client/sc_assets.topojson",
    "proximity/kba.topojson",
    "proximity/iucn.topojson",
    "proximity/ramsar.topojson",
    "proximity/whs.topojson",
    "aquaduct/bws_annual.topojson",
]

@app.on_event("startup")
def startup_prefetch():
    """Prefetch all common files in parallel on startup. Blocks until all are cached."""
    logger.info("Starting prefetch of common files...")
    threads = []
    for path in PREFETCH_FILES:
        t = threading.Thread(target=prefetch_file, args=(path,), daemon=True)
        t.start()
        threads.append(t)
    for t in threads:
        t.join()
    logger.info(f"Prefetch complete — {len(PREFETCH_FILES)} files cached in memory.")

@app.get("/get_scassets")
async def get_scassets(selectedValue: str = Query(...)):
    if selectedValue == "ClientAssetLocation":
        rel_path = "client/glencore.topojson"
    elif selectedValue == "AssetLocation":
        rel_path = "client/sc_assets.topojson"
    else:
        return {"error": "scassets file not found."}

    try:
        data = get_cached_or_fetch(rel_path)
        return Response(content=data, media_type="application/json")
    except RequestException as e:
        return {"error": f"Failed to fetch file: {str(e)}"}

# New endpoint for CPU info
@app.get("/cpu-info")
async def cpu_info():
    # CPU info
    total_cores = psutil.cpu_count(logical=True)
    physical_cores = psutil.cpu_count(logical=False)
    cpu_percent = psutil.cpu_percent(interval=1)
    # RAM info
    mem = psutil.virtual_memory()
    ram_info = {
        "total": mem.total,
        "available": mem.available,
        "used": mem.used,
        "percent": mem.percent
    }
    info = {
        "total_cores": total_cores,
        "physical_cores": physical_cores,
        "cpu_percent": cpu_percent,
        "ram": ram_info
    }
    return JSONResponse(content=info)


# SSE endpoint for real-time CPU and RAM usage
@app.get("/cpu-stream")
async def cpu_stream():
    def event_stream():
        while True:
            total_cores = psutil.cpu_count(logical=True)
            physical_cores = psutil.cpu_count(logical=False)
            cpu_percent = psutil.cpu_percent(interval=1)
            mem = psutil.virtual_memory()
            ram_info = {
                "total": mem.total,
                "available": mem.available,
                "used": mem.used,
                "percent": mem.percent
            }
            data = json.dumps({
                "total_cores": total_cores,
                "physical_cores": physical_cores,
                "cpu_percent": cpu_percent,
                "ram": ram_info
            })
            yield f"data: {data}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/loadIbatData_kba_stream")
def loadIbatData_kba_stream(selectedValue: str = Query(...)):
    mapping = {
        "KBAPOL2024STREAM": "proximity/kba.topojson",
        "WDPA00STREAM": "proximity/iucn.topojson",
        "RAMSARSTREAM": "proximity/ramsar.topojson",
        "WHS-STREAM": "proximity/whs.topojson",
    }
    rel_path = mapping.get(selectedValue)
    if rel_path is None:
        return {"Error": "TopoJSON file not found."}

    try:
        data = get_cached_or_fetch(rel_path)
        return Response(content=data, media_type="application/json")
    except RequestException as e:
        return {"error": f"Failed to fetch file: {str(e)}"}
    
@app.get("/load_aquaduct_bassline_data")
async def load_aquaduct_bassline_data():
    try:
        data = get_cached_or_fetch("aquaduct/bws_annual.topojson")
        return Response(content=data, media_type="application/json")
    except RequestException as e:
        return {"error": f"Failed to fetch file: {str(e)}"}

@app.get("/getManifest")
async def fetch_manifest(path: str = Query(..., description="Relative path to manifest (e.g. gfc-png/manifest.json)")):
    try:
        data = get_cached_or_fetch(path)
        return Response(content=data, media_type="application/json")
    except RequestException as e:
        raise HTTPException(status_code=404, detail=f"Manifest not found: {str(e)}")

@app.get("/getPng")
async def get_png(path: str = Query(..., description="Relative path to PNG file")):
    try:
        data = get_cached_or_fetch(path)
        return Response(content=data, media_type="image/png")
    except RequestException as e:
        raise HTTPException(status_code=404, detail=f"PNG not found: {str(e)}")

# Run FastAPI
if __name__ == "__main__":
    # Get port from environment variable or default to 8000
    port = int(os.environ.get("PORT", 8510))
    
    # Determine if we're in production (OpenShift) or development
    is_production = os.environ.get("ENV", "development").lower() in ["production", "prod", "prd"]
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        workers=1
    )