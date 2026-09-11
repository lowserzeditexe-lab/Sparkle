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
