// Sparkle - logique d'installation réelle (process principal Electron, Node).
const fs = require("fs");
const path = require("path");
const https = require("https");
const os = require("os");
const { execSync, execFileSync } = require("child_process");

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

// Installeur BDVencord (Vencord modifié compatible plugins BetterDiscord).
const BDVENCORD_CLI_URL =
  "https://github.com/TheLazySquid/BDVencord/releases/download/installer/BDVencordInstallerCli.exe";

// Télécharge BDVencordInstallerCli.exe dans un fichier temporaire et renvoie son chemin.
async function downloadBDVencordCli(onStep) {
  const step = (label, pct) => { try { onStep && onStep(label, pct); } catch (_) {} };
  step("Téléchargement de l'installeur BDVencord", 20);
  const buf = await httpsGet(BDVENCORD_CLI_URL);
  if (!buf || buf.length < 100000) {
    throw new Error("Téléchargement de BDVencordInstallerCli.exe invalide.");
  }
  const dest = path.join(os.tmpdir(), `BDVencordInstallerCli-${Date.now()}.exe`);
  fs.writeFileSync(dest, buf);
  return dest;
}

// Exécute le CLI BDVencord de façon non interactive (télécharge le build + patche Discord).
function runBDVencordCli(cliPath, args) {
  execFileSync(cliPath, args, { stdio: "ignore", windowsHide: true, timeout: 180000 });
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

// payloadDir contient: AutoQuest.plugin.js
async function install({ installPlugin }, payloadDir, onProgress) {
  const p = (pct, label) => { try { onProgress({ pct, label }); } catch (_) {} };

  const vdir = vencordDir();
  const pluginsDir = path.join(vdir, "plugins");

  p(8, "Préparation de l'environnement");
  fs.mkdirSync(vdir, { recursive: true });

  // 1) Récupérer l'installeur BDVencord (Vencord + compatibilité BetterDiscord)
  const cli = await downloadBDVencordCli((label, pct) => p(pct, label));

  // 2) Fermer Discord avant de patcher
  p(45, "Fermeture de Discord");
  closeDiscord();
  await new Promise((r) => setTimeout(r, 700));

  // 3) Installer BDVencord : télécharge le build compatible BD et patche Discord automatiquement
  p(60, "Installation de BDVencord dans Discord");
  runBDVencordCli(cli, ["-install", "-branch", "auto"]);

  // 4) Déposer le plugin AutoQuest dans le dossier des plugins BetterDiscord de BDVencord
  if (installPlugin) {
    p(85, "Ajout du plugin AutoQuest");
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.copyFileSync(path.join(payloadDir, PLUGIN_NAME), path.join(pluginsDir, PLUGIN_NAME));
  }

  // 5) Nettoyage du CLI temporaire
  try { fs.rmSync(cli, { force: true }); } catch (_) {}

  p(100, "Terminé");
  return { patched: 1, plugin: installPlugin };
}

async function uninstall() {
  closeDiscord();
  await new Promise((r) => setTimeout(r, 500));

  // 1) Désinstallation propre via le CLI BDVencord (retire le patch de Discord)
  try {
    const cli = await downloadBDVencordCli();
    runBDVencordCli(cli, ["-uninstall", "-branch", "auto"]);
    try { fs.rmSync(cli, { force: true }); } catch (_) {}
  } catch (_) { /* on tente quand même la restauration manuelle ci-dessous */ }

  // 2) Restauration manuelle de secours (si un ancien patch subsiste)
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

module.exports = { install, uninstall, detect, readPluginMeta, downloadBDVencordCli };
