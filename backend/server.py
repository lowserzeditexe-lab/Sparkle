from fastapi import FastAPI, APIRouter, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import json
import re
import zipfile
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

PAYLOAD_DIR = ROOT_DIR / "payload"
INSTALLER_DIR = ROOT_DIR / "installer_assets"
BRAND_LOGO = PAYLOAD_DIR.parent.parent / "frontend" / "public" / "brand" / "logo.png"

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="BdCompat Installer API")
api_router = APIRouter(prefix="/api")


# ----------------- Plugin metadata parsing -----------------
def parse_plugin_meta():
    path = PAYLOAD_DIR / "AutoQuest.plugin.js"
    meta = {"name": "AutoQuest", "author": "", "description": "", "version": ""}
    try:
        head = path.read_text(encoding="utf-8", errors="ignore")[:2000]
        for key in ["name", "author", "description", "version"]:
            m = re.search(r"@" + key + r"\s+(.+)", head)
            if m:
                meta[key] = m.group(1).strip()
    except Exception:
        pass
    return meta


EXTENSION_INFO = {
    "name": "Vencord BdCompat",
    "description": "Extension Vencord qui apporte la compatibilite des plugins BetterDiscord.",
    "version": "1.0.0",
}

INSTALL_STEPS = [
    {"id": "prepare", "label": "Preparation de l'environnement"},
    {"id": "vencord", "label": "Copie du build Vencord (BdCompat)"},
    {"id": "plugin", "label": "Installation du plugin AutoQuest"},
    {"id": "close", "label": "Fermeture de Discord"},
    {"id": "inject", "label": "Injection de Vencord dans Discord"},
    {"id": "settings", "label": "Activation de BdCompat + AutoQuest"},
    {"id": "done", "label": "Termine"},
]


class DownloadEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    options: dict = {}
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/")
async def root():
    return {"message": "BdCompat Installer API"}


@api_router.get("/info")
async def info():
    return {
        "extension": EXTENSION_INFO,
        "plugin": parse_plugin_meta(),
        "steps": INSTALL_STEPS,
        "platform": "windows",
    }


@api_router.get("/plugin/preview")
async def plugin_preview():
    path = PAYLOAD_DIR / "AutoQuest.plugin.js"
    lines = []
    try:
        with path.open(encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f):
                if i >= 40:
                    break
                lines.append(line.rstrip("\n"))
    except Exception:
        pass
    size = path.stat().st_size if path.exists() else 0
    return {"meta": parse_plugin_meta(), "size_bytes": size, "head": lines}


async def _record_download(options: dict):
    try:
        await db.downloads.insert_one(DownloadEvent(options=options).model_dump())
    except Exception as e:
        logging.warning("download record failed: %s", e)


@api_router.get("/installer/download")
async def download_installer(
    autoquest: bool = Query(True),
    enable: bool = Query(True),
    close: bool = Query(True),
    canary: bool = Query(True),
    ptb: bool = Query(True),
):
    targets = ["Discord"]
    if ptb:
        targets.append("DiscordPTB")
    if canary:
        targets.append("DiscordCanary")
        targets.append("DiscordDevelopment")

    config = {
        "installAutoQuest": bool(autoquest),
        "enableByDefault": bool(enable),
        "closeDiscord": bool(close),
        "targets": targets,
    }
    await _record_download(config)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        base = "VencordBdCompat-AutoQuest"
        # scripts
        z.write(INSTALLER_DIR / "Install.bat", f"{base}/Install.bat")
        z.write(INSTALLER_DIR / "Install.ps1", f"{base}/Install.ps1")
        z.write(INSTALLER_DIR / "README.txt", f"{base}/README.txt")
        # config
        z.writestr(f"{base}/config.json", json.dumps(config, indent=2))
        # logo for the GUI
        if BRAND_LOGO.exists():
            z.write(BRAND_LOGO, f"{base}/logo.png")
        # plugin
        if autoquest:
            z.write(PAYLOAD_DIR / "AutoQuest.plugin.js", f"{base}/AutoQuest.plugin.js")
        # vencord dist
        dist = PAYLOAD_DIR / "Vencord" / "dist"
        for p in dist.rglob("*"):
            if p.is_file():
                z.write(p, f"{base}/dist/{p.relative_to(dist).as_posix()}")

    buf.seek(0)
    headers = {"Content-Disposition": f'attachment; filename="{base}-Setup.zip"'}
    return StreamingResponse(buf, media_type="application/zip", headers=headers)


@api_router.get("/stats")
async def stats():
    try:
        count = await db.downloads.count_documents({})
    except Exception:
        count = 0
    return {"downloads": count}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
