# BdCompat Installer — Vencord + AutoQuest

## Problème
L'utilisateur a une extension Vencord (BdCompat) chargeant des plugins BetterDiscord,
et un plugin custom AutoQuest.plugin.js. Il veut un installeur Windows qui installe
l'extension et ajoute le plugin par défaut. Doit être testable dans la preview web.

## Architecture
- Frontend React : assistant d'installation en slides plein écran (sobre, style onboarding).
  Flux : welcome -> plugin (choix oui/non) -> install (anim) -> done (téléchargement).
- Backend FastAPI : /api/info, /api/plugin/preview, /api/installer/download (génère un ZIP
  à la volée depuis /app/backend/payload + /app/backend/installer_assets).
- Payload : build Vencord (dist/) + AutoQuest.plugin.js.
- Installeur Windows réel : Install.bat + Install.ps1 (GUI WinForms) qui :
  * copie dist vers %APPDATA%\Vencord\dist
  * injecte Vencord dans Discord (rename app.asar -> _app.asar, dossier app/ + index.js/package.json)
  * dépose AutoQuest.plugin.js dans %APPDATA%\Vencord\bdPlugins
  * écrit settings.json : plugins.BdCompat.enabled=true + enabledBdPlugins=["AutoQuest.plugin.js"]

## Implémenté (2026-06)
- Portail web brandé (logo/loader/background fournis), 4 slides, téléchargement du ZIP perso.
- Endpoints backend testés (pytest 100%), options propagées dans config.json.
- Installeur ZIP correct (autoquest on/off, cibles PTB/Canary).
- Itération : suppression indicateurs d'étapes + slide options ; logo statique à l'install ; intro courte.

## Backlog (P1/P2)
- Générer un vrai .exe (Inno Setup / Electron) au lieu du ZIP+PS1.
- Bouton désinstallation.
- Détection de version Discord côté web (info seulement).

## Notes
- Le patch réel de Discord ne peut PAS s'exécuter dans la preview Linux ; seul le flux web +
  l'assemblage du paquet sont testés. Le .zip effectue l'installation sur le PC Windows.

## Version réelle "Spark" (2026-06)
- Rebrand complet en Spark (frontend + backend + branding installeur).
- VRAIS installeurs Windows .exe générés via NSIS (compilé sous Linux) :
  * backend/dist_installers/Spark-Setup.exe (avec plugin AutoQuest)
  * backend/dist_installers/Spark-Setup-Lite.exe (BdCompat seul)
- Sources build : backend/build/spark.nsi, patch.ps1, unpatch.ps1, build.sh, spark.ico
- Backend GET /api/installer/download?autoquest=true|false -> FileResponse de l'.exe adéquat.
- L'exe (MUI2 : Welcome/Install/Finish) copie dist -> %APPDATA%\Vencord\dist, dépose le plugin,
  exécute patch.ps1 (injection Discord + settings.json), écrit un désinstalleur + entrée Add/Remove.
- Rebuild : `bash backend/build/build.sh` (nécessite nsis + imagemagick).
- Non signé -> SmartScreen possible (indiqué dans l'UI). Patch non testable en preview Linux.

## Renommage "Sparkle" + interface = installeur (2026-06)
- Rebrand Spark -> Sparkle (frontend, backend, app desktop).
- L'INTERFACE EST L'INSTALLEUR : app Electron dans /app/desktop
  * renderer = build React de /app/frontend (PUBLIC_URL=. yarn build -> desktop/build)
  * main.js + preload.js : IPC sparkle:getInfo / sparkle:install / sparkle:uninstall
  * installer.js : patch Discord réel en Node (rename app.asar, dossier app/, settings.json
    avec plugins.BdCompat.enabled + enabledBdPlugins=["AutoQuest.plugin.js"])
  * payload embarqué : desktop/resources/payload (dist sans .map + AutoQuest.plugin.js)
- Build Windows sans wine (electron-builder exige wine -> contourné) :
  * télécharge electron-vXX-win32-x64.zip, greffe resources/app + resources/payload,
    renomme electron.exe -> Sparkle.exe => /app/desktop/dist/win-unpacked/
  * zip -> /app/backend/dist_installers/Sparkle-Windows-x64.zip (servi par /api/installer/download)
- Frontend : App.js détecte window.sparkle (desktop) -> install réel ; sinon mode "aperçu" web.
- Rebuild renderer : `cd desktop && yarn build:renderer` ; app Windows : réassembler win-unpacked.
- Limite : pas de .exe installeur signé (wine indispo, hôte aarch64) ; app portable Sparkle.exe OK.
