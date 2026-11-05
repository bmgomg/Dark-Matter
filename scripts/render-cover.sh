#!/bin/sh
# Renders the itch.io cover from cover.html, 630 × 500, with headless Edge (or Chrome): sh scripts/render-cover.sh [output.png]
cd "$(dirname "$0")"
BROWSER="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -f "$BROWSER" ] || BROWSER="/c/Program Files/Google/Chrome/Application/chrome.exe"
DIR="$(pwd -W)"
URL="file:///$(echo "$DIR" | sed 's/ /%20/g')"
OUT="${1:-$DIR/../itch/cover.png}"

mkdir -p "$(dirname "$OUT")"
"$BROWSER" --headless=new --disable-gpu --disable-lcd-text --hide-scrollbars --force-device-scale-factor=1 \
	--allow-file-access-from-files --virtual-time-budget=3000 \
	--window-size=630,500 --screenshot="$OUT" "$URL/cover.html" 2>/dev/null
