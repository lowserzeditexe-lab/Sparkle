====================================================
  Vencord BdCompat + AutoQuest  -  Installeur Windows
====================================================

CONTENU DU DOSSIER
  Install.bat            -> Double-clique ici pour installer
  Install.ps1            -> Script d'installation (interface graphique)
  config.json            -> Options choisies dans le portail
  dist\                  -> Build Vencord avec l'extension BdCompat
  AutoQuest.plugin.js    -> Ton plugin (BetterDiscord) charge par BdCompat
  logo.png               -> Logo de l'installeur

INSTALLATION
  1. Ferme Discord (l'installeur peut le faire pour toi).
  2. Double-clique sur Install.bat
  3. Clique sur "Installer" dans la fenetre.
  4. Relance Discord.

CE QUE FAIT L'INSTALLEUR
  - Copie le build Vencord dans %APPDATA%\Vencord\dist
  - Injecte Vencord dans Discord (patch de app.asar)
  - Depose AutoQuest.plugin.js dans %APPDATA%\Vencord\bdPlugins
  - Active BdCompat et AutoQuest par defaut (settings.json)

DESINSTALLER
  - Dans le dossier resources de Discord :
    supprime le dossier "app" et renomme "_app.asar" en "app.asar".
  - Supprime le dossier %APPDATA%\Vencord

Si Windows bloque le script : clic droit sur Install.bat > Executer en tant
qu'administrateur.
