// Sparkle - logique d'installation réelle (process principal Electron, Node).
//
// Méthode : identique à l'installeur officiel Vencord (patcher.go / app_asar.go) :
//   1. télécharge le build BDVencord (Vencord compatible plugins BetterDiscord)
//      dans %APPDATA%\Vencord\dist ;
//   2. pour chaque installation Discord : renomme resources\app.asar -> _app.asar
//      puis écrit un mini app.asar (format ASAR) dont index.js = require("<patcher.js>") ;
//   3. dépose AutoQuest.plugin.js dans %APPDATA%\Vencord\plugins ;
//   4. relance Discord.
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync, spawn } = require("child_process");

// Dans le process principal d'Electron, require("fs") est "asar-aware" : toute
// opération touchant un fichier .asar (rename/stat/write de app.asar) est interceptée
// par la couche ASAR et échoue (ENOENT ... app.asar). On DOIT utiliser "original-fs",
// le module fs non patché d'Electron, pour manipuler app.asar comme un fichier normal.
// En dehors d'Electron (tests Node), original-fs n'existe pas -> repli sur fs.
let ofs;
try { ofs = require("original-fs"); } catch (_) { ofs = fs; }

const FLAVORS = ["Discord", "DiscordPTB", "DiscordCanary", "DiscordDevelopment"];
const PLUGIN_NAME = "AutoQuest.plugin.js";

// Release "devbuild" de BDVencord : contient patcher.js / preload.js / renderer.js / renderer.css
const BDVENCORD_RELEASE_API = "https://api.github.com/repos/TheLazySquid/BDVencord/releases/tags/devbuild";
const BDVENCORD_DIST_FILES = ["patcher.js", "preload.js", "renderer.js", "renderer.css"];
const BDVENCORD_DIST_OPTIONAL = ["patcher.js.map", "preload.js.map", "renderer.js.map", "renderer.css.map"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function vencordDir() {
  return path.join(process.env.APPDATA, "Vencord");
}

/* ------------------------------------------------------------------ */
/*  Réseau                                                             */
/* ------------------------------------------------------------------ */

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

// Télécharge le build BDVencord dans distDst. Renvoie le hash/nom de la release.
async function downloadBDVencordDist(distDst, onStep) {
  const step = (label, pct) => { try { onStep && onStep(label, pct); } catch (_) {} };
  step("Recherche de la dernière version de BDVencord", 12);

  let meta;
  try {
    const buf = await httpsGet(BDVENCORD_RELEASE_API, { Accept: "application/vnd.github+json" });
    meta = JSON.parse(buf.toString("utf8"));
  } catch (e) {
    throw new Error("Impossible de contacter GitHub pour récupérer BDVencord (" + e.message + "). Vérifie ta connexion Internet.");
  }
  const assets = Array.isArray(meta.assets) ? meta.assets : [];
  const byName = new Map(assets.map((a) => [a.name, a.browser_download_url]));
  for (const f of BDVENCORD_DIST_FILES) {
    if (!byName.has(f)) throw new Error("Fichier " + f + " introuvable dans la release BDVencord.");
  }

  fs.mkdirSync(distDst, { recursive: true });
  const all = [...BDVENCORD_DIST_FILES, ...BDVENCORD_DIST_OPTIONAL.filter((f) => byName.has(f))];
  for (let i = 0; i < all.length; i++) {
    const name = all[i];
    step("Téléchargement de BDVencord (" + name + ")", 15 + Math.round((i / all.length) * 30));
    try {
      const buf = await httpsGet(byName.get(name));
      fs.writeFileSync(path.join(distDst, name), buf);
    } catch (e) {
      if (BDVENCORD_DIST_FILES.includes(name)) {
        throw new Error("Échec du téléchargement de " + name + " : " + e.message);
      }
    }
  }
  if (!fs.existsSync(path.join(distDst, "patcher.js"))) {
    throw new Error("patcher.js manquant après téléchargement.");
  }
  return meta.name || meta.tag_name || "devbuild";
}

/* ------------------------------------------------------------------ */
/*  ASAR minimal (port de app_asar.go de l'installeur Vencord)         */
/* ------------------------------------------------------------------ */

function writeAppAsar(outFile, patcherPath) {
  const indexJs = "require(" + JSON.stringify(patcherPath) + ")";
  const packageJson = '{\n\t"name": "discord",\n\t"main": "index.js"\n}';
  const indexBytes = Buffer.byteLength(indexJs, "utf8");
  const pkgBytes = Buffer.byteLength(packageJson, "utf8");

  const header = {
    files: {
      "index.js": { size: indexBytes, offset: "0" },
      "package.json": { size: pkgBytes, offset: String(indexBytes) },
    },
  };
  let headerString = JSON.stringify(header);
  const headerStringSize = Buffer.byteLength(headerString, "utf8");
  const dataSize = 4;
  const alignedSize = (headerStringSize + dataSize - 1) & ~(dataSize - 1);
  const headerSize = alignedSize + 8;
  const headerObjectSize = alignedSize + dataSize;
  const diff = alignedSize - headerStringSize;
  if (diff > 0) headerString += "0".repeat(diff);

  const prefix = Buffer.alloc(16);
  prefix.writeUInt32LE(dataSize, 0);
  prefix.writeUInt32LE(headerSize, 4);
  prefix.writeUInt32LE(headerObjectSize, 8);
  prefix.writeUInt32LE(headerStringSize, 12);

  ofs.writeFileSync(outFile, Buffer.concat([
    prefix,
    Buffer.from(headerString, "utf8"),
    Buffer.from(indexJs + packageJson, "utf8"),
  ]));
}

/* ------------------------------------------------------------------ */
/*  Discord : processus, détection, patch                              */
/* ------------------------------------------------------------------ */

function closeDiscord() {
  for (const f of FLAVORS) {
    try { execSync(`taskkill /F /IM ${f}.exe`, { stdio: "ignore", windowsHide: true }); } catch (_) {}
  }
}

// Relance Discord via Update.exe (méthode standard Squirrel sous Windows).
function startDiscord(flavor) {
  const base = path.join(process.env.LOCALAPPDATA, flavor);
  const updater = path.join(base, "Update.exe");
  try {
    if (fs.existsSync(updater)) {
      const child = spawn(updater, ["--processStart", `${flavor}.exe`], {
        detached: true, stdio: "ignore", windowsHide: true, cwd: base,
      });
      child.unref();
      return true;
    }
    // Repli : lancer directement le dernier app-*\Discord.exe
    const appDirs = fs.readdirSync(base, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith("app-"))
      .map((e) => e.name).sort();
    if (appDirs.length) {
      const exe = path.join(base, appDirs[appDirs.length - 1], `${flavor}.exe`);
      if (fs.existsSync(exe)) {
        const child = spawn(exe, [], { detached: true, stdio: "ignore", windowsHide: true });
        child.unref();
        return true;
      }
    }
  } catch (_) {}
  return false;
}

function appDirsOf(flavor) {
  const base = path.join(process.env.LOCALAPPDATA || "", flavor);
  if (!process.env.LOCALAPPDATA || !fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("app-"))
    .map((e) => path.join(base, e.name));
}

// Renommage avec quelques tentatives (fichier parfois encore verrouillé par Discord).
async function renameRetry(from, to) {
  let lastErr;
  for (let i = 0; i < 6; i++) {
    try { ofs.renameSync(from, to); return; } catch (e) { lastErr = e; await sleep(500); }
  }
  throw new Error("Impossible de renommer " + path.basename(from) + " (Discord est peut-être encore ouvert) : " + lastErr.message);
}

// Patche un dossier resources\ (méthode officielle Vencord). Renvoie true si patché.
async function patchResources(resources, patcherPath) {
  const asar = path.join(resources, "app.asar");
  const backup = path.join(resources, "_app.asar");
  const legacyApp = path.join(resources, "app"); // ancien patch Sparkle (dossier app)

  const hasBackup = ofs.existsSync(backup);
  const asarIsFile = ofs.existsSync(asar) && ofs.statSync(asar).isFile();
  if (!hasBackup && !asarIsFile) return false; // pas une installation Discord exploitable

  if (!hasBackup) {
    // Première installation : sauvegarder l'asar original
    await renameRetry(asar, backup);
    const unpacked = path.join(resources, "app.asar.unpacked");
    const unpackedBak = path.join(resources, "_app.asar.unpacked");
    if (ofs.existsSync(unpacked) && !ofs.existsSync(unpackedBak)) {
      try { ofs.renameSync(unpacked, unpackedBak); } catch (_) {}
    }
  } else if (ofs.existsSync(asar)) {
    // Déjà patché : on remplace juste notre mini asar (fichier ou ancien dossier)
    ofs.rmSync(asar, { recursive: true, force: true });
  }
  if (ofs.existsSync(legacyApp)) ofs.rmSync(legacyApp, { recursive: true, force: true });

  writeAppAsar(asar, patcherPath);
  return true;
}

async function unpatchResources(resources) {
  const asar = path.join(resources, "app.asar");
  const backup = path.join(resources, "_app.asar");
  const legacyApp = path.join(resources, "app");
  let did = false;
  if (ofs.existsSync(legacyApp)) { ofs.rmSync(legacyApp, { recursive: true, force: true }); did = true; }
  if (ofs.existsSync(backup)) {
    if (ofs.existsSync(asar)) ofs.rmSync(asar, { recursive: true, force: true });
    await renameRetry(backup, asar);
    did = true;
  }
  const unpackedBak = path.join(resources, "_app.asar.unpacked");
  const unpacked = path.join(resources, "app.asar.unpacked");
  if (ofs.existsSync(unpackedBak) && !ofs.existsSync(unpacked)) {
    try { ofs.renameSync(unpackedBak, unpacked); } catch (_) {}
  }
  return did;
}

/* ------------------------------------------------------------------ */
/*  API exposée                                                        */
/* ------------------------------------------------------------------ */

// payloadDir contient: AutoQuest.plugin.js
async function install({ installPlugin }, payloadDir, onProgress) {
  const p = (pct, label) => { try { onProgress({ pct, label }); } catch (_) {} };

  if (!process.env.LOCALAPPDATA || !process.env.APPDATA) {
    throw new Error("Variables LOCALAPPDATA/APPDATA introuvables : cet installeur fonctionne sous Windows.");
  }

  const vdir = vencordDir();
  const distDst = path.join(vdir, "dist");
  const pluginsDir = path.join(vdir, "plugins");
  const patcherPath = path.join(distDst, "patcher.js");

  p(5, "Préparation de l'environnement");
  fs.mkdirSync(vdir, { recursive: true });

  // 0) Vérifier qu'il y a bien un Discord à patcher
  const targets = [];
  for (const flavor of FLAVORS) {
    for (const appDir of appDirsOf(flavor)) {
      const resources = path.join(appDir, "resources");
      if (fs.existsSync(resources)) targets.push({ flavor, resources });
    }
  }
  if (!targets.length) {
    throw new Error("Aucune installation Discord trouvée dans " + process.env.LOCALAPPDATA + " (Discord, PTB, Canary). Installe Discord puis relance Sparkle.");
  }

  // 1) Télécharger le build BDVencord (Vencord + compatibilité BetterDiscord)
  await downloadBDVencordDist(distDst, (label, pct) => p(pct, label));

  // 2) Fermer Discord
  p(50, "Fermeture de Discord");
  closeDiscord();
  await sleep(1200);

  // 3) Injection dans chaque installation Discord (méthode officielle Vencord)
  p(60, "Injection de BDVencord dans Discord");
  let patched = 0;
  const patchedFlavors = new Set();
  const errors = [];
  for (const t of targets) {
    try {
      if (await patchResources(t.resources, patcherPath)) { patched++; patchedFlavors.add(t.flavor); }
    } catch (e) {
      errors.push(t.flavor + " : " + e.message);
    }
  }
  if (!patched) {
    throw new Error("Échec de l'injection dans Discord." + (errors.length ? "\n" + errors.join("\n") : ""));
  }

  // 4) Plugin AutoQuest -> dossier des plugins BetterDiscord de BDVencord + activation
  if (installPlugin) {
    p(85, "Ajout du plugin AutoQuest");
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.copyFileSync(path.join(payloadDir, PLUGIN_NAME), path.join(pluginsDir, PLUGIN_NAME));
    // Activer le plugin par défaut : BDVencord ne lance un plugin BD que si
    // Settings.bdplugins[<@name>] est vrai (persisté dans Vencord/settings/settings.json).
    // Sans ça, start() ne s'exécute pas -> pas de pop-up de bienvenue.
    try { enableBdPlugin(readPluginMeta(payloadDir).name || "AutoQuest"); } catch (_) {}
  }

  // 5) Relancer Discord
  p(94, "Redémarrage de Discord");
  let restarted = 0;
  for (const flavor of patchedFlavors) if (startDiscord(flavor)) restarted++;

  p(100, "Terminé");
  return { patched, plugin: !!installPlugin, restarted, warnings: errors };
}

async function uninstall() {
  closeDiscord();
  await sleep(1000);

  let restored = 0;
  const restoredFlavors = new Set();
  for (const flavor of FLAVORS) {
    for (const appDir of appDirsOf(flavor)) {
      const resources = path.join(appDir, "resources");
      if (!fs.existsSync(resources)) continue;
      try {
        if (await unpatchResources(resources)) { restored++; restoredFlavors.add(flavor); }
      } catch (_) {}
    }
  }
  const vdir = vencordDir();
  if (fs.existsSync(vdir)) { try { fs.rmSync(vdir, { recursive: true, force: true }); } catch (_) {} }

  let restarted = 0;
  for (const flavor of restoredFlavors) if (startDiscord(flavor)) restarted++;
  return { ok: true, restored, restarted };
}

// Active un plugin BetterDiscord dans BDVencord en écrivant Vencord/settings/settings.json.
// BDVencord démarre au lancement les plugins où Settings.bdplugins[id] est vrai (id = @name).
function enableBdPlugin(pluginName) {
  const sdir = path.join(vencordDir(), "settings");
  const sfile = path.join(sdir, "settings.json");
  fs.mkdirSync(sdir, { recursive: true });
  let obj = {};
  if (fs.existsSync(sfile)) {
    try { obj = JSON.parse(fs.readFileSync(sfile, "utf8")) || {}; } catch (_) { obj = {}; }
  }
  if (typeof obj !== "object" || obj === null) obj = {};
  if (!obj.bdplugins || typeof obj.bdplugins !== "object") obj.bdplugins = {};
  obj.bdplugins[pluginName] = true;
  // Ceinture + bretelles : BDVencord utilise plugin.id (= @name) comme clé, mais on
  // active aussi la clé "nom de fichier" au cas où l'id retomberait dessus.
  obj.bdplugins[PLUGIN_NAME] = true;
  fs.writeFileSync(sfile, JSON.stringify(obj, null, 4), "utf8");
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
  if (!process.env.LOCALAPPDATA) return out;
  for (const flavor of FLAVORS) {
    const appDirs = appDirsOf(flavor);
    if (!appDirs.length) continue;
    const versions = appDirs.map((d) => path.basename(d).replace(/^app-/, "")).sort();
    const latest = versions[versions.length - 1];
    const patched = appDirs.some((d) => ofs.existsSync(path.join(d, "resources", "_app.asar")));
    out.push({ flavor, version: latest, patched });
  }
  return out;
}

module.exports = { install, uninstall, detect, readPluginMeta, downloadBDVencordDist, writeAppAsar };
