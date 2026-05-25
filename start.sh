#!/usr/bin/env bash
# =============================================================================
# Collection Petite Plaisance - Borne 3D
# Lanceur macOS / Linux
#
# Par defaut : mode KIOSQUE plein ecran (prod).
# Pour passer en mode DEV (fenetre normale) : KIOSK=0 ./start.sh
# =============================================================================

set -euo pipefail

# Se placer dans le dossier du script
cd "$(dirname "$0")"

PORT="${PORT:-8000}"
KIOSK="${KIOSK:-1}"
# Pour passer en mode dev (fenetre normale) : KIOSK=0 ./start.sh

echo
echo "============================================================"
echo " Collection Petite Plaisance - Demarrage de la borne"
echo "============================================================"
echo

# 1. Détecter l'OS et le binaire SWS
OS="$(uname -s)"
SWS_BIN=""
case "$OS" in
  Darwin*) SWS_BIN="tools/static-web-server-macos" ;;
  Linux*)  SWS_BIN="tools/static-web-server-linux" ;;
  *)       echo "[ERREUR] OS non supporte : $OS"; exit 1 ;;
esac

if [ ! -x "$SWS_BIN" ]; then
  echo "[ERREUR] Le binaire serveur '$SWS_BIN' est introuvable ou non executable."
  echo ""
  echo "Telechargez la version adaptee depuis :"
  echo "  https://github.com/static-web-server/static-web-server/releases"
  echo "  - macOS : static-web-server-v2.42.0-x86_64-apple-darwin.tar.gz"
  echo "  - Linux : static-web-server-v2.42.0-x86_64-unknown-linux-gnu.tar.gz"
  echo ""
  echo "Decompressez et placez le binaire ici (renomme en) :"
  echo "  $SWS_BIN"
  echo ""
  echo "Puis : chmod +x $SWS_BIN"
  exit 1
fi

# 2. Verifier les modeles 3D
MISSING=0
for f in canoe_sadoux.nxz inti_huatana.nxz dinghy_kirie.nxz canot_rocca_camping.nxz dinghy_rocca_semillante.nxz moth_alu_bouchain.nxz; do
  if [ ! -f "assets/models/$f" ]; then
    MISSING=1
  fi
done
if [ "$MISSING" = "1" ]; then
  echo "[AVERTISSEMENT] Certains modeles 3D sont absents dans assets/models/"
  echo "La borne demarrera mais les modeles concernes ne s'afficheront pas."
  sleep 3
fi

# 3. Trouver le navigateur
BROWSER=""
case "$OS" in
  Darwin*)
    if [ -d "/Applications/Google Chrome.app" ]; then
      BROWSER="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    elif [ -d "/Applications/Microsoft Edge.app" ]; then
      BROWSER="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    fi
    ;;
  Linux*)
    for cmd in google-chrome chromium chromium-browser microsoft-edge; do
      if command -v "$cmd" >/dev/null 2>&1; then
        BROWSER="$cmd"
        break
      fi
    done
    ;;
esac

if [ -z "$BROWSER" ]; then
  echo "[ERREUR] Aucun navigateur compatible (Chrome / Chromium / Edge) trouve."
  exit 1
fi

# 4. Démarrer le serveur en arriere-plan
echo "[INFO] Demarrage du serveur sur le port $PORT..."
"$SWS_BIN" --port "$PORT" --root . --host 127.0.0.1 --log-level error &
SERVER_PID=$!

# Cleanup à la sortie
cleanup() {
  echo
  echo "[INFO] Arret du serveur..."
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM EXIT

# 5. Attendre que le serveur soit pret
sleep 2

# 6. Lancer le navigateur
echo "[INFO] Ouverture du navigateur..."
if [ "$KIOSK" = "1" ]; then
  echo "[INFO] Mode KIOSQUE active."
  "$BROWSER" --kiosk --start-fullscreen --disable-pinch \
    --overscroll-history-navigation=0 --disable-features=TranslateUI \
    "http://127.0.0.1:$PORT/" &
else
  "$BROWSER" --app="http://127.0.0.1:$PORT" &
fi

BROWSER_PID=$!

echo
echo "[INFO] Borne en cours d'utilisation."
echo "[INFO] Ctrl+C dans ce terminal pour tout arreter."
echo

# Attendre la fin du navigateur
wait "$BROWSER_PID" 2>/dev/null || true
