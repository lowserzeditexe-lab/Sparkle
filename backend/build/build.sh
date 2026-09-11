#!/usr/bin/env bash
# Rebuild des vrais installeurs Spark (.exe) via NSIS.
# Prérequis : apt-get install -y nsis imagemagick
set -e
cd "$(dirname "$0")"

# 1. Rafraîchir le payload depuis backend/payload
rm -rf payload/dist && mkdir -p payload/dist
cp ../payload/AutoQuest.plugin.js payload/AutoQuest.plugin.js
find ../payload/Vencord/dist -type f ! -name "*.map" -exec cp {} payload/dist/ \;

# 2. Icône
convert ../../frontend/public/brand/logo.png -background none -resize 256x256 \
  -define icon:auto-resize=16,32,48,64,128,256 spark.ico

# 3. Compiler les deux variantes
makensis -DWITHPLUGIN=1 -DOUTFILE=Spark-Setup.exe spark.nsi
makensis -DWITHPLUGIN=0 -DOUTFILE=Spark-Setup-Lite.exe spark.nsi

# 4. Publier
mkdir -p ../dist_installers
cp Spark-Setup.exe Spark-Setup-Lite.exe ../dist_installers/
echo "OK -> backend/dist_installers/"
ls -la ../dist_installers/
