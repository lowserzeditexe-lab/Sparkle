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

## Sparkle.exe unique (2026-06)
- Un seul exécutable Windows : /app/backend/dist_installers/Sparkle.exe (~76 Mo, PE valide).
- Auto-extractible SFX 7-Zip (7zSD.sfx) : au double-clic, extrait l'app dans %TEMP% puis
  lance Sparkle.exe (Electron) = notre interface, qui installe réellement Vencord+AutoQuest.
- Build : /app/desktop/build-exe.sh (concatène 7zSD.sfx + sfx-config.txt + app-archive.7z).
  Source app : /app/desktop/dist/win-unpacked (electron win-x64 + resources/app + resources/payload).
- Backend GET /api/installer/download -> FileResponse Sparkle.exe.
- Non signé : SmartScreen peut avertir (Informations complémentaires -> Exécuter quand même).
- Vérifié : PE MZ, 7z liste 100 fichiers dont Sparkle.exe app + config RunProgram. Exécution
  Windows réelle non testable dans la preview Linux.

## 4 features (signature, icône, désinstallation, détection) — 2026-06
- SIGNATURE : Sparkle.exe signé (osslsigncode, SHA256 + horodatage RFC3161 DigiCert).
  * Cert auto-signé de démo (desktop/signing/sparkle.pfx) -> signature VALIDE mais NON approuvée
    par Windows => SmartScreen avertit toujours. Pour l'enlever : vrai cert OV/EV via
    `./desktop/sign.sh moncert.pfx motdepasse`. SFX reste fonctionnel après signature (vérifié).
- ICÔNE : icône fenêtre/taskbar Windows = icon.ico (BrowserWindow, embarqué dans resources/app).
  * L'icône du FICHIER .exe n'est pas ré-embarquée (nécessite rcedit/wine, indispo sur aarch64) ->
    à faire via build Windows ou wine+rcedit.
- DÉSINSTALLATION : écran "Désinstaller Sparkle ?" -> installer.uninstall() restaure app.asar de
  Discord et supprime %APPDATA%/Vencord. Accès via lien sur l'accueil. Aperçu simulé sur le web.
- DÉTECTION : installer.detect() liste les installs Discord (flavor + version + patché) ; affichée
  sur l'accueil et l'écran de désinstallation (desktop). IPC sparkle:detect.
- Rebuild : desktop/build-exe.sh (recompile renderer -> archive -> exe -> signe si pfx présent).

## Landing page + Vencord auto-download + Welcome popup (2025-07)
- Landing page: /app/frontend/src/App.js remplacé (assistant supprimé). Sections Hero,
  Présentation, Fonctionnalités AutoQuest, FAQ. 2 téléchargements indépendants:
  Installeur Sparkle (/api/installer/download) + Plugin AutoQuest (/api/plugin/download NOUVEAU).
- Welcome popup: AutoQuest.plugin.js -> showSparkleWelcome() appelé dans start(), une fois par
  version (BdApi.Data key sparkleWelcomeVersion). Style changelog Discord via
  BdApi.UI.showChangelogModal (fallback showConfirmationModal, puis toast). Explique
  Vencord + BdCompat + AutoQuest. Synchronisé dans backend/payload, desktop/resources/payload,
  backend/build/payload.
- Vencord auto-download: installer.js (Electron, fn downloadVencord) + patch.ps1 (NSIS)
  téléchargent le dist officiel depuis la latest release Vendicated/Vencord
  (patcher.js, preload.js, renderer.js, renderer.css + .map). Logique testée en réel sur Linux.
- BLOQUANT connu: le Vencord OFFICIEL n'inclut PAS BdCompat -> AutoQuest (plugin BetterDiscord
  chargé via BdCompat) ne se chargera PAS avec ce build. Nécessite un build Vencord custom
  incluant BdCompat pour qu'AutoQuest fonctionne.
- LIMITE: les .exe (Sparkle.exe Electron 79MB, Spark-Setup*.exe NSIS) doivent être recompilés
  sur un environnement de build Windows; non recompilables/testables sur ce serveur Linux
  (makensis absent, pas de toolchain Windows).

## Bascule vers BDVencord (2025-07) — choix utilisateur "Approche BDVencord"
- Constat: Vencord officiel ne peut pas recevoir BdCompat après build. On utilise BDVencord
  (TheLazySquid/BDVencord), fork prébuilé compatible plugins BetterDiscord.
- installer.js (Electron): downloadBDVencordCli() télécharge BDVencordInstallerCli.exe
  (release "installer"), l'exécute non-interactif: `-install -branch auto` (patch Discord +
  téléchargement du build). Puis dépose AutoQuest.plugin.js dans %APPDATA%\Vencord\plugins.
  uninstall(): CLI `-uninstall -branch auto` + restauration manuelle de secours.
  Téléchargement du CLI vérifié en réel (7,9 Mo, PE MZ).
- NSIS: patch.ps1/unpatch.ps1 réécrits (même logique via CLI). spark.nsi/build.sh: retrait du
  bundle dist devenu inutile. Plugin déposé dans Vencord\plugins.
- Frontend: web=landing (App.js), desktop .exe=assistant (Wizard.js restauré depuis git,
  choix fait dans index.js selon window.sparkle.isDesktop). Copie landing/pop-up mise à jour
  (Vencord compatible BetterDiscord / BDVencord).
- Dossier plugins BDVencord = %APPDATA%\Vencord\plugins. Flags CLI = ceux du Vencord Installer
  (-install/-uninstall/-repair/-branch/-location).
- RAPPEL: .exe à recompiler sur Windows (desktop/build-exe.sh Electron, backend/build/build.sh
  NSIS). Non recompilable/testable sur ce serveur Linux. Patch Discord + pop-up = testables
  uniquement sur Windows/Discord réel.

## Rebuild Sparkle.exe sous Linux (2025-07) — OK
- Chaîne: p7zip-full + osslsigncode installés. app-archive.7z extrait -> dist/win-unpacked,
  mise à jour resources/app (main.js, preload.js, installer.js BDVencord, build renderer
  PUBLIC_URL=. ), resources/payload/AutoQuest.plugin.js (pop-up), suppression payload/dist.
  Ré-archive 7z -> build-exe.sh (7zSD.sfx + sfx-config + archive) -> signé sparkle.pfx
  (auto-signé + horodatage DigiCert) -> backend/dist_installers/Sparkle.exe (78,9 Mo, MZ).
- Vérifié: contenu SFX (installer.js 9366 o, plugin 124307 o, renderer main.51df28b3.js),
  GET /api/installer/download renvoie exactement ce fichier.
- Rappel: overlay emergent retiré de l'index.html desktop. dist/ supprimé après build
  (ré-extraire app-archive.7z pour rebuild). Cert auto-signé => SmartScreen avertira.

## BUGFIX interface assistant .exe sans styles (2025-07)
- Cause: App.css réécrit pour la landing => Wizard.js (assistant desktop) sans CSS dans le .exe.
- Fix: Wizard.css restauré (git c6dae35), importé par Wizard.js. index.js: React.lazy +
  Suspense, Wizard si window.sparkle.isDesktop sinon App => chunks CSS séparés (273=assistant,
  885=landing), aucune collision (.btn/.kicker). publicPath "./" OK sous file://.
- Textes de l'assistant alignés sur BDVencord. Sparkle.exe recompilé/signé/publié (78,9 Mo).
- Testé (agent frontend): assistant stylé + flux install/uninstall OK; landing sans régression.
