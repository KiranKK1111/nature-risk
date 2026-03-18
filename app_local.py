import os
from fastapi import FastAPI, File, UploadFile, Query, Response, BackgroundTasks, HTTPException, Request
from rio_tiler.io import Reader
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse, FileResponse
import uvicorn
import requests
import json
from fastapi.middleware.cors import CORSMiddleware
import time
from fastapi.responses import StreamingResponse
import numpy as np
from PIL import Image
import io
import os
import subprocess
import uuid
import sys
import paramiko
from queue import Queue, Empty
import threading

from typing import Optional, Dict
from datetime import datetime
import logging
import zipfile
from pydantic import BaseModel

# For progress tracking
import uuid as py_uuid
from sse_starlette.sse import EventSourceResponse

# For system info
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
BASE_URL = "http://cc-esg-svc-clhs-esg-sa-10.apps.colt-np2.ocp.dev.net/esg/clhs/downloadlocationcsv?filename=/wb4_nfs357/imftusr051/cra/alignmentdata/"

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create a persistent session with connection pooling for better performance
session = requests.Session()
adapter = requests.adapters.HTTPAdapter(
    pool_connections=10,  # Number of connection pools
    pool_maxsize=20,      # Max connections in pool
    max_retries=3,        # Retry on failure
    pool_block=False
)
session.mount('http://', adapter)
session.mount('https://', adapter)

# In-memory progress store: {session_id: {"total": int, "sent": int}}
progress_store = {}


# Endpoint to get scassets
@app.get("/get_scassets")
async def get_scassets(selectedValue: str = Query(...)):
    print("get_scassets: Selected Value : ", selectedValue)

    if selectedValue == "ClientAssetLocation":
        file_path = os.path.join("data", "client", "glencore.topojson")
    elif selectedValue == "AssetLocation":
        file_path = os.path.join("data", "client", "sc_assets.topojson")
    else:
        file_path = None

    if not file_path or not os.path.isfile(file_path):
        return {"error": "scassets file not found."}

    # Use FileResponse for efficient local file serving
    return FileResponse(
        file_path,
        media_type="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )

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


# FastAPI endpoint to stream the jsonString    
@app.get("/loadIbatData_kba_stream")
def loadIbatData_kba_stream(selectedValue: str = Query(...)):
    if selectedValue == "KBAPOL2024STREAM":
        file_path = os.path.join("data", "proximity", "kba.topojson")
    elif selectedValue == "WDPA00STREAM":
        file_path = os.path.join("data", "proximity", "iucn.topojson")
    elif selectedValue == "RAMSARSTREAM":
        file_path = os.path.join("data", "proximity", "ramsar.topojson")
    elif selectedValue == "WHS-STREAM":
        file_path = os.path.join("data", "proximity", "whs.topojson")
    else:
        file_path = None

    if not file_path or not os.path.isfile(file_path):
        return {"Error": "TopoJSON file not found."}

    return FileResponse(
        file_path,
        media_type="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )

# Layer for aquaduct bassline data
@app.get("/load_aquaduct_bassline_data")
async def load_aquaduct_bassline_data():
    file_path = os.path.join("data", "aquaduct", "bws_annual.topojson")
    if not os.path.isfile(file_path):
        return {"error": "TopoJSON file not found."}
    return FileResponse(
        file_path,
        media_type="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )


MANIFEST_URL = os.environ.get("manifest_host_path", "http://hostname/path/manifest.json")

@app.get("/getManifest")
async def fetch_manifest(path: str = Query(..., description="Relative path to manifest (e.g. gfc-png/manifest.json)")):
    file_path = os.path.join("data", path.lstrip("/"))
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Manifest not found")
    return FileResponse(
        file_path,
        media_type="application/json",
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.get("/getPng")
async def get_png(path: str = Query(..., description="Relative path to PNG file (e.g. gfc-png/Hansen_GFC-2024-v1.12_lossyear_00N_000E.png)")):
    file_path = os.path.join("data", path.lstrip("/"))
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="PNG not found")
    return FileResponse(
        file_path,
        media_type="image/png",
        headers={"Access-Control-Allow-Origin": "*"}
    )

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


