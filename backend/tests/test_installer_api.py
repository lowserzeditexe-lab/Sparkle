"""Backend API tests for Sparkle installer."""
import os
import pytest
import requests
from pathlib import Path

# Load frontend .env for REACT_APP_BACKEND_URL
_env_path = Path(__file__).resolve().parents[2] / "frontend" / ".env"
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


# ----------------- /api/info -----------------
class TestInfo:
    def test_info_structure(self):
        r = requests.get(f"{API}/info", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "extension" in d and "plugin" in d and "steps" in d
        assert d["extension"]["name"] == "Sparkle"
        assert d["plugin"]["name"] == "AutoQuest"
        assert d["plugin"]["author"] == "999none"
        assert isinstance(d["steps"], list) and len(d["steps"]) >= 5


# ----------------- /api/plugin/preview -----------------
class TestPluginPreview:
    def test_preview(self):
        r = requests.get(f"{API}/plugin/preview", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["meta"]["name"] == "AutoQuest"
        assert d["size_bytes"] > 0
        assert isinstance(d["head"], list) and len(d["head"]) > 0


# ----------------- /api/installer/download -----------------
class TestInstallerDownload:
    def test_download_returns_exe_binary(self):
        r = requests.get(f"{API}/installer/download", params={"autoquest": "true"}, timeout=60)
        assert r.status_code == 200, r.text
        cd = r.headers.get("Content-Disposition", "")
        assert "Sparkle.exe" in cd, f"CD header: {cd}"
        ct = r.headers.get("Content-Type", "")
        assert "application/vnd.microsoft.portable-executable" in ct, f"CT: {ct}"
        # PE files start with 'MZ' magic bytes
        assert r.content[:2] == b"MZ", f"Missing MZ magic: {r.content[:8]!r}"
        assert len(r.content) > 100

    def test_download_autoquest_false(self):
        r = requests.get(f"{API}/installer/download", params={"autoquest": "false"}, timeout=60)
        assert r.status_code == 200
        assert r.content[:2] == b"MZ"
