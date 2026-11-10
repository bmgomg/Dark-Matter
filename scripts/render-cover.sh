#!/bin/sh
# Renders the itch.io art from cover.html with headless Edge (or Chrome): sh scripts/render-cover.sh [output folder]
# (the cover, 630 × 500, the Embed BG, 640 × 360, the social media image, 1200 × 630, the logo, on transparency, the page's background tile, 1024 × 1024, the rules graphic, 900 × 600, and its second version, 900 wide and as tall as its rules make it)
cd "$(dirname "$0")"
BROWSER="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
[ -f "$BROWSER" ] || BROWSER="/c/Program Files/Google/Chrome/Application/chrome.exe"
DIR="$(pwd -W)"
URL="file:///$(echo "$DIR" | sed 's/ /%20/g')"
OUT="${1:-$DIR/../itch}"

render() { # page width height output [more browser flags]; SCALE: the pixels per CSS pixel, 1 unless set
	"$BROWSER" --headless=new --disable-gpu --disable-lcd-text --hide-scrollbars --force-device-scale-factor="${SCALE:-1}" \
		--allow-file-access-from-files --virtual-time-budget=3000 $5 \
		--window-size="$2,$3" --screenshot="$OUT/$4" "$URL/$1" 2>/dev/null
}

mkdir -p "$OUT"
render cover.html 630 500 cover.png
render "cover.html#embed" 640 360 embed-bg.png
render "cover.html#social" 1200 630 social.png
render logo.html 1000 300 logo.png --default-background-color=00000000
render tile.html 1024 1024 tile.png
render rules.html 900 600 rules.png

# the second rules graphic sizes itself to its rules: its height (data-height) first, then the picture at twice the size
H=$("$BROWSER" --headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=3000 --dump-dom "$URL/rules-2.html" 2>/dev/null |
	sed -n 's/.*data-height="\([0-9]*\)".*/\1/p')
SCALE=2 render rules-2.html 450 "$H" rules-2.png
