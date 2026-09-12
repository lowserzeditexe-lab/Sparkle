// Sparkle - logique d'installation réelle (process principal Electron, Node).
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const FLAVORS = ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"];
const PLUGIN_NAME = "AutoQuest.plugin.js";

function vencordDir() {
  return path.join(process.env.APPDATA, "Vencord");
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Télécharge un contenu HTTPS en suivant les redirections (assets GitHub).
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "SparkleInstaller", ...headers } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(httpsGet(res.headers.location, headers));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error("HTTP " + res.statusCode + " pour " + url));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

// Télécharge le build Vencord (dist) depuis la dernière release GitHub officielle.
const VENCORD_DIST_FILES = [
  "patcher.js", "patcher.js.map",
  "preload.js", "preload.js.map",
  "renderer.js", "renderer.js.map",
  "renderer.css", "renderer.css.map",
];

async function downloadVencord(distDst, onStep) {
  const step = (label, pct) => { try { onStep && onStep(label, pct); } catch (_) {} };
  step("Recherche de la dernière version de Vencord", 18);
  const metaBuf = await httpsGet(
    "https://api.github.com/repos/Vendicated/Vencord/releases/latest",
    { Accept: "application/vnd.github+json" }
  );
  const meta = JSON.parse(metaBuf.toString("utf8"));
  const want = new Set(VENCORD_DIST_FILES);
  const assets = (meta.assets || []).filter((a) => want.has(a.name));
  if (!assets.length) throw new Error("Aucun asset Vencord trouvé dans la release.");
  fs.mkdirSync(distDst, { recursive: true });
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    step(`Téléchargement de Vencord (${a.name})`, 20 + Math.round((i / assets.length) * 25));
    const buf = await httpsGet(a.browser_download_url);
    fs.writeFileSync(path.join(distDst, a.name), buf);
  }
  // Vérification minimale : patcher.js doit être présent.
  if (!fs.existsSync(path.join(distDst, "patcher.js"))) {
    throw new Error("patcher.js manquant après téléchargement.");
  }
}

function closeDiscord() {
  for (const f of FLAVORS) {
    try { execSync(`taskkill /F /IM ${f}.exe`, { stdio: "ignore" }); } catch (_) {}
  }
}

function patchFlavor(flavor, patcherPathForward) {
  const base = path.join(process.env.LOCALAPPDATA, flavor);
  if (!fs.existsSync(base)) return 0;
  let patched = 0;
  const appDirs = fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("app-"));
  for (const dirEnt of appDirs) {
    const resources = path.join(base, dirEnt.name, "resources");
    if (!fs.existsSync(resources)) continue;
    const asar = path.join(resources, "app.asar");
    const backup = path.join(resources, "_app.asar");
    const appFolder = path.join(resources, "app");

    if (!fs.existsSync(backup)) {
      if (fs.existsSync(asar) && fs.statSync(asar).isFile()) {
        fs.renameSync(asar, backup);
      } else {
        continue;
      }
    }
    const unpacked = path.join(resources, "app.asar.unpacked");
    const unpackedBak = path.join(resources, "_app.asar.unpacked");
    if (fs.existsSync(unpacked) && !fs.existsSync(unpackedBak)) {
      try { fs.renameSync(unpacked, unpackedBak); } catch (_) {}
    }
    if (fs.existsSync(appFolder)) fs.rmSync(appFolder, { recursive: true, force: true });
    fs.mkdirSync(appFolder, { recursive: true });
    fs.writeFileSync(
      path.join(appFolder, "index.js"),
      `require("${patcherPathForward}");\nrequire("../_app.asar");\n`,
      "utf8"
    );
    fs.writeFileSync(
      path.join(appFolder, "package.json"),
      '{ "name": "discord", "main": "index.js" }',
      "utf8"
    );
    patched++;
  }
  return patched;
}

function ensureSettings(installPlugin) {
  const vdir = vencordDir();
  const sdir = path.join(vdir, "settings");
  const sfile = path.join(sdir, "settings.json");
  fs.mkdirSync(sdir, { recursive: true });
  let obj = {};
  if (fs.existsSync(sfile)) {
    try { obj = JSON.parse(fs.readFileSync(sfile, "utf8")); } catch (_) { obj = {}; }
  }
  if (!obj.plugins) obj.plugins = {};
  if (!obj.plugins.BdCompat) obj.plugins.BdCompat = {};
  obj.plugins.BdCompat.enabled = true;
  if (installPlugin) {
    const list = Array.isArray(obj.plugins.BdCompat.enabledBdPlugins)
      ? obj.plugins.BdCompat.enabledBdPlugins : [];
    if (!list.includes(PLUGIN_NAME)) list.push(PLUGIN_NAME);
    obj.plugins.BdCompat.enabledBdPlugins = list;
  }
  fs.writeFileSync(sfile, JSON.stringify(obj, null, 2), "utf8");
}

// payloadDir contient: dist/ et AutoQuest.plugin.js
async function install({ installPlugin }, payloadDir, onProgress) {
  const p = (pct, label) => { try { onProgress({ pct, label }); } catch (_) {} };

  const vdir = vencordDir();
  const distDst = path.join(vdir, "dist");
  const distSrc = path.join(payloadDir, "dist");

  p(8, "Préparation de l'environnement");
  fs.mkdirSync(vdir, { recursive: true });

  p(20, "Téléchargement de Vencord");
  if (fs.existsSync(distDst)) fs.rmSync(distDst, { recursive: true, force: true });
  try {
    await downloadVencord(distDst, (label, pct) => p(pct, label));
  } catch (e) {
    // Repli : si un build est fourni dans le payload, on l'utilise.
    if (fs.existsSync(distSrc)) {
      copyDir(distSrc, distDst);
    } else {
      throw new Error("Impossible de télécharger Vencord : " + (e && e.message ? e.message : e));
    }
  }

  if (installPlugin) {
    p(40, "Ajout du plugin AutoQuest");
    const bdDir = path.join(vdir, "bdPlugins");
    fs.mkdirSync(bdDir, { recursive: true });
    fs.copyFileSync(path.join(payloadDir, PLUGIN_NAME), path.join(bdDir, PLUGIN_NAME));
  }

  p(55, "Fermeture de Discord");
  closeDiscord();
  await new Promise((r) => setTimeout(r, 700));

  p(70, "Injection de Vencord dans Discord");
  const patcherPathForward = path.join(distDst, "patcher.js").replace(/\\/g, "/");
  let patched = 0;
  for (const flavor of FLAVORS) patched += patchFlavor(flavor, patcherPathForward);

  p(90, "Activation des composants");
  ensureSettings(installPlugin);

  p(100, "Terminé");
  return { patched, plugin: installPlugin };
}

function uninstall() {
  closeDiscord();
  let restored = 0;
  for (const flavor of FLAVORS) {
    const base = path.join(process.env.LOCALAPPDATA, flavor);
    if (!fs.existsSync(base)) continue;
    for (const dirEnt of fs.readdirSync(base, { withFileTypes: true })) {
      if (!dirEnt.isDirectory() || !dirEnt.name.startsWith("app-")) continue;
      const resources = path.join(base, dirEnt.name, "resources");
      const appFolder = path.join(resources, "app");
      const backup = path.join(resources, "_app.asar");
      const asar = path.join(resources, "app.asar");
      let did = false;
      if (fs.existsSync(appFolder)) { fs.rmSync(appFolder, { recursive: true, force: true }); did = true; }
      if (fs.existsSync(backup) && !fs.existsSync(asar)) { fs.renameSync(backup, asar); did = true; }
      const unpackedBak = path.join(resources, "_app.asar.unpacked");
      const unpacked = path.join(resources, "app.asar.unpacked");
      if (fs.existsSync(unpackedBak) && !fs.existsSync(unpacked)) fs.renameSync(unpackedBak, unpacked);
      if (did) restored++;
    }
  }
  const vdir = vencordDir();
  if (fs.existsSync(vdir)) fs.rmSync(vdir, { recursive: true, force: true });
  return { ok: true, restored };
}

function readPluginMeta(payloadDir) {
  const meta = { name: "AutoQuest", author: "999none", version: "1.5.0", description: "" };
  try {
    const head = fs.readFileSync(path.join(payloadDir, PLUGIN_NAME), "utf8").slice(0, 2000);
    for (const key of ["name", "author", "description", "version"]) {
      const m = head.match(new RegExp("@" + key + "\\s+(.+)"));
      if (m) meta[key] = m[1].trim();
    }
  } catch (_) {}
  return meta;
}

function detect() {
  const out = [];
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return out;
  for (const flavor of FLAVORS) {
    const base = path.join(localAppData, flavor);
    if (!fs.existsSync(base)) continue;
    const appDirs = fs.readdirSync(base, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith("app-"));
    if (!appDirs.length) continue;
    const versions = appDirs.map((d) => d.name.replace(/^app-/, "")).sort();
    const latest = versions[versions.length - 1];
    let patched = false;
    for (const d of appDirs) {
      if (fs.existsSync(path.join(base, d.name, "resources", "_app.asar"))) patched = true;
    }
    out.push({ flavor, version: latest, patched });
  }
  return out;
}

module.exports = { install, uninstall, detect, readPluginMeta, downloadVencord };
