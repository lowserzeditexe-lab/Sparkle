#!/usr/bin/env bash
# Reconstruit l'unique Sparkle.exe (SFX 7-Zip qui lance l'app Electron).
# Prérequis : le dossier dist/win-unpacked doit exister (voir README),
#             et 7zSD.sfx présent dans ce dossier, p7zip-full installé.
set -e
cd "$(dirname "$0")"

# 1. (re)builder le renderer + réassembler win-unpacked si besoin
#    yarn build:renderer   # met à jour desktop/build depuis frontend
#    Puis regarnir dist/win-unpacked/resources/app avec main.js/preload.js/installer.js/build

# 2. Archive 7z de l'app Windows
rm -f app-archive.7z
( cd dist/win-unpacked && 7z a -t7z -mx=5 ../../app-archive.7z ./* >/dev/null )

# 3. Config SFX (silencieux : pas de fenêtre d'extraction, lance direct l'interface)
printf ';!@Install@!UTF-8!\r\nProgress="no"\r\nRunProgram="Sparkle.exe"\r\n;!@InstallEnd@!\r\n' > sfx-config.txt

# 4. Concaténer -> exe unique (non signé)
cat 7zSD.sfx sfx-config.txt app-archive.7z > Sparkle_unsigned.exe

# 5. Signer (auto-signé par défaut ; passe ton .pfx en argument pour un vrai cert)
if [ -f signing/sparkle.pfx ]; then
  ./sign.sh
else
  cp Sparkle_unsigned.exe Sparkle.exe
  cp Sparkle.exe ../backend/dist_installers/Sparkle.exe
fi
ls -la Sparkle.exe
echo "OK -> backend/dist_installers/Sparkle.exe"
