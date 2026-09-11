#!/usr/bin/env bash
# Signe Sparkle.exe.
#  - Par défaut : certificat auto-signé de démo (signing/sparkle.pfx) -> signature valide
#    mais NON approuvée par Windows (SmartScreen avertira quand même).
#  - Pour supprimer l'alerte SmartScreen : utilise un VRAI certificat OV/EV d'une autorité
#    (DigiCert, Sectigo, etc.) au format .pfx :
#       ./sign.sh /chemin/moncert.pfx "monMotDePasse"
set -e
cd "$(dirname "$0")"

PFX="${1:-signing/sparkle.pfx}"
PASS="${2:-sparkle}"
IN="Sparkle_unsigned.exe"
OUT="Sparkle.exe"

# (re)crée l'exe non signé si absent
if [ ! -f "$IN" ]; then
  printf ';!@Install@!UTF-8!\r\nTitle="Sparkle"\r\nProgress="yes"\r\nRunProgram="Sparkle.exe"\r\n;!@InstallEnd@!\r\n' > sfx-config.txt
  cat 7zSD.sfx sfx-config.txt app-archive.7z > "$IN"
fi

rm -f "$OUT"
osslsigncode sign -pkcs12 "$PFX" -pass "$PASS" \
  -n "Sparkle Installer" -i "https://sparkle.local" \
  -t http://timestamp.digicert.com \
  -in "$IN" -out "$OUT"

osslsigncode verify "$OUT" | grep -iE "Message digest|Subject|Timestamp" | head
cp "$OUT" ../backend/dist_installers/Sparkle.exe
echo "OK -> backend/dist_installers/Sparkle.exe (signé)"
