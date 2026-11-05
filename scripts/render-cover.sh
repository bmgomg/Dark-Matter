#!/bin/sh
# Renders the itch.io art from cover.html with headless Edge (or Chrome): sh scripts/render-cover.sh [output folder]
# (the cover, 630 × 500, and the Embed BG, 640 × 360)
cd "$(dirname "$0")"
BROWSER="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -f "$BROWSER" ] || BROWSER="/c/Program Files/Google/Chrome/Application/chrome.exe"
DIR="$(pwd -W)"
URL="file:///$(echo "$DIR" | sed 's/ /%20/g')"
OUT="${1:-$DIR/../itch}"

render() { # page width height output
	"$BROWSER" --headless=new --disable-gpu --disable-lcd-text --hide-scrollbars --force-device-scale-factor=1 \
		--allow-file-access-from-files --virtual-time-budget=3000 \
		--window-size="$2,$3" --screenshot="$OUT/$4" "$URL/$1" 2>/dev/null
}

mkdir -p "$OUT"
render cover.html 630 500 cover.png
render "cover.html#embed" 640 360 embed-bg.png
