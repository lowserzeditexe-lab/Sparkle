"""Backend API tests for BdCompat Installer."""
import io
import json
import os
import zipfile

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://plugin-installer-ext.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ----------------- /api/info -----------------
class TestInfo:
    def test_info_structure(self):
        r = requests.get(f"{API}/info", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "extension" in d and "plugin" in d and "steps" in d
        assert d["extension"]["name"] == "Vencord BdCompat"
        assert d["plugin"]["name"] == "AutoQuest"
        assert d["plugin"]["author"] == "999none"
        assert d["plugin"]["version"] == "1.5.0"
        assert isinstance(d["steps"], list) and len(d["steps"]) >= 5
        step_ids = [s["id"] for s in d["steps"]]
        for expected in ["prepare", "vencord", "plugin", "close", "inject", "settings", "done"]:
            assert expected in step_ids


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
def _download(params):
    r = requests.get(f"{API}/installer/download", params=params, timeout=60)
    assert r.status_code == 200, r.text
    return r


class TestInstallerDownload:
    def test_download_with_autoquest_true(self):
        r = _download({"autoquest": "true", "enable": "true", "close": "true", "canary": "false", "ptb": "false"})
        cd = r.headers.get("Content-Disposition", "")
        assert "VencordBdCompat-AutoQuest-Setup.zip" in cd
        z = zipfile.ZipFile(io.BytesIO(r.content))
        names = z.namelist()
        base = "VencordBdCompat-AutoQuest"
        required = [f"{base}/Install.bat", f"{base}/Install.ps1", f"{base}/config.json",
                    f"{base}/logo.png", f"{base}/AutoQuest.plugin.js"]
        for f in required:
            assert f in names, f"Missing: {f}"
        # dist folder with patcher.js
        assert any(n.startswith(f"{base}/dist/") and n.endswith("patcher.js") for n in names), \
            f"Missing dist/patcher.js. names: {[n for n in names if 'dist' in n][:5]}"
        # config check
        cfg = json.loads(z.read(f"{base}/config.json"))
        assert cfg["installAutoQuest"] is True
        assert cfg["targets"] == ["Discord"]

    def test_download_with_autoquest_false(self):
        r = _download({"autoquest": "false", "canary": "false", "ptb": "false"})
        z = zipfile.ZipFile(io.BytesIO(r.content))
        names = z.namelist()
        base = "VencordBdCompat-AutoQuest"
        assert f"{base}/AutoQuest.plugin.js" not in names
        cfg = json.loads(z.read(f"{base}/config.json"))
        assert cfg["installAutoQuest"] is False

    def test_download_beta_targets(self):
        r = _download({"autoquest": "true", "canary": "true", "ptb": "true"})
        z = zipfile.ZipFile(io.BytesIO(r.content))
        cfg = json.loads(z.read("VencordBdCompat-AutoQuest/config.json"))
        for t in ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"]:
            assert t in cfg["targets"], f"Missing target {t}: {cfg['targets']}"
