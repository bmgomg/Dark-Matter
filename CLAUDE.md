# Dark Matter of Perspective

_It takes a shift._ (tagline)

The "dark matter" is the planets hidden behind bigger ones: there, but unseen from a side, and worked out only from
what can be seen, as astronomers infer dark matter.

Puzzle game for a jam with the theme **SHIFT**. A SvelteKit app in the style of `C:\git\BMG\♻️Template` and Unmix:
splash, Home (title, rules, Daily and Binge), a launcher (the economy, then today's six puzzles, or board size, difficulty and Start), Game Page (scoreboard, board, palette, toolbar) on a 450 × 800 page that
scales down to fit, a PWA that plays offline. `npm run dev` serves it on port 1119. The rules, generator and solver come
from the prototype, `edgewise.html`, and its brief, `edgewise-brief.md` (rules, tiers, levels; "Known facts" there are settled).

## Rules

- Planets of three sizes (small, medium, large) on an N × N board, at most one per cell.
- The player sees the board only edge-on, one side at a time, and turns it a quarter or a half at a time.
- A planet hides anything its size or smaller behind it; a bigger one behind still shows over it.
- The player taps a cell (it pulses, and the palette comes up) and marks it small, medium or large, or clears it.
  A blank cell counts as empty; there's no "empty" mark (the designer's call: a blank is an answer too). The game ends
  the moment the map matches the solution: no Done button (the designer's call). It never says which cells are off,
  so guessing can't stand in for turning (the old wrong-cell outlines after a Done let it). Give Up shows the
  solution, after a confirmation ("Average will be affected — give up?" / No). The map changes over to the solution
  through a transition: the wrong planets shrink and fade, then the true ones grow in, cell by cell from the
  north-west corner.

## Look: deep space

- A starfield with nebulae (`Space.svelte`, on a canvas, seeded, some stars twinkle) behind a dark glass page with a
  violet rim. It has parallax, at the designer's wish: the bigger a star, the nearer it is and the faster it moves. The
  stars drift, swinging to a new heading every 20–40 s, the sky breathes (zooms slowly in and out), and it pans as the
  board turns (the same way as the tray's planets) and leans with a mouse. On a touch screen (the designer's call: a
  phone's page hides nearly all of it) or with reduced motion, it's still.
- The planets (`Defs.svelte`, one image each on a unit circle, used through `Planet.svelte`): 1 a banded golden world,
  2 a teal swirled ocean world, 3 a violet gas giant. The designer's Recraft images (`src/lib/images/planet-*.webp`),
  replacing drawn SVGs, each cropped to its disc, stretched to a true circle, 256 px. Lit from the upper left. Radii as
  the brief: 17, 29, 44 hundredths of a cell.
- **The map** (`Board.svelte`): flat, top-down, `MAP` (330 px) wide, the side being viewed at the bottom with a gold
  edge. It turns with the board (`ss.angle`), live while the tray is dragged; its planets stay upright. Tap a cell to
  select it (`ss.sel`: gold, pulsing), again to let it go; the map itself doesn't swipe. The board turns with a cell
  selected. No compass letters and no "from the South" label: the designer found them unhelpful (the turning map
  shows the orientation). (Cursors carrying the brush went with the brushes.)
- **Below the tray** (`Game Page.svelte`, the rest of the page's height, its content centred, no separator): with no
  cell selected, the hint (`Message.svelte`: what to do next; the first fades out and the next in once the board has turned, by requestAnimationFrame, any other change at once), moved down from above the map at the designer's
  request; with one selected, "Think twice — changing your mind costs $1." The palette (small, medium, large, clear;
  the cell's own planet lit and disabled, Clear disabled on a blank cell) is being tried at the cell (`Picker.svelte`:
  a pill on the map with a notch pointing at the cell, above it or below it near the top, growing out of it; a tap
  off the map lets the cell go), because the designer kept mistaking a palette below the tray for the tray, both
  rows of planets. `PALETTE_AT_CELL` switches back to the old palette there (`Palette.svelte`). Moving the tray above
  the map was weighed and rejected: it belongs against the gold edge it's seen from. Keys: the map is one Tab stop with a cursor on a cell (`ss.cursor`, white; it
  shows only for the keyboard, `ss.cursorOn`). W A S D move it by the screen, however the board has turned (W A S D only, the
  designer's call; ← → and ↑ ↓ turn the board). Enter or Space
  on the map opens the palette; 1–3 a planet,
  0 / Delete / Backspace clear, on the selected cell or else straight on the cursor's, at the same price; the "Think
  twice" warning shows with the cursor too. Esc lets the cell go, then the cursor. ? the shortcuts card (`Keys.svelte`, over the page above the
  toolbar; any key or a tap puts it away). The toolbar's Keys button opens it too, shown only with a keyboard about
  (`ss.keyboard`: a fine pointer suggests one, a key pressed proves it). Any prompt takes the same place (`Actions.svelte`, 50 px tall
  so the game-over message doesn't shift when Play new fades in): the confirmations, which follow the template (the
  question is the yes button, beside No); and at a game's end its message ("No more dark matter!", best / average
  improved, into the red, or the revealed one) for `OVER_MS` (4 s), then Play new.
- **The launcher** (`Launcher.svelte`, as in Triangula; Home's Binge opens it, and Daily, in the daily's form: see
  Daily): a glass panel with the economy
  paragraph, Board (4×4 / 5×5) and Difficulty (Easy / Not Easy / Quite Hard: `DIFF_NAMES`, what the player reads; the code and the saves say `hard` for Not Easy and `expert` for Quite Hard) pills, each difficulty pill as wide as its name, and Start, or Resume when the picked level has a
  game begun (a turn or a mark) and not finished (`inProgress`); picking another level crossfades the word, the pill
  holding still. No stats there (the designer's call). It opens on
  the level last picked, next session too; an untouched new puzzle is kept, under Start. The toolbar's first button is
  Back (text, like the rest: no icons in the toolbar): a game → the launcher → Home. The music's credit (see License)
  shows at the foot of the page while the launcher is up, and only then (`Game Page.svelte`; the designer's call).
- **The tray** (`Tray.svelte`): the true view, edge-on (the board's edge as a 2D being sees it), with no
  lane lines (the designer dropped the dashed ones) and no line under the planets, its lanes under
  the map's columns at the same scale. The planets are centred on one line of sight (`AXIS`: as low as a large planet allows, its bottom on the old floor
  line), not standing on a
  floor: a bigger one behind shows as a ring around the ones in front, like an annular eclipse (the designer's call;
  the hiding rule holds exactly, and the home page's rule says "shows around it"). Swiping it turns the board, as decided with the designer: the planets follow
  the finger and slide off the tray's end, all at one speed, so no depth shows. The next side's lineup slides in from
  the other end only after a release that turns the board (counted), arriving as the turn ends. It sets off only once
  the old lineup is `LAG` (40%) of the way out, so a tap's turn, which starts from rest, plays like a swipe let go of
  partway: the old lineup leaves, then the new one comes in (the designer's call). A drag shows only the current side's, so it can't peek at the next side and come back (the designer
  found that loophole on a wide screen). A lineup that slid in keeps its elements as it lands (keyed by side): new ones made the planets blink at the end of a swipe in Comet, though not in other browsers. A drag can't start while a counted turn plays out. A quarter turn is `SWIPE_PX` of travel; a flick goes on to the next quarter, a slow
  drag settles on the nearest. A swipe to the left turns the board clockwise (East comes round). The turn buttons at
  the tray's ends, and ← →, turn it as a swipe that way (left: clockwise). Holding one (`HOLD_MS`, 0.4 s) turns it a half
  instead (`turnHalf`), straight to the opposite side, as do ↑ ↓ (the designer's call; "hold", in the hint, because it
  reads right for a finger and a mouse alike). A tap acts on release, so the hold costs a tap no delay. Their arrows are Hexodus's shapes
  (`Icon.svelte`), bare, without its rings, upside down, each tilted 35° outwards (left counterclockwise, right
  clockwise) to hint at the way the lineup slides. They don't scale when pressed, and have no hover on a touch screen: on a
  Pixel 6a, each made a tap's turn stagger at its start (38–44% of its frames late, against 1% without; measured on the
  phone over USB; a hover sticks to the arrow last tapped, so changing direction faded both). A swipe's settle takes `TURN_MS` (0.42 s, ease-out); a tap's whole quarter
  turn `TAP_TURN_MS` (0.5 s, linear), slowed at the designer's request; a half turn `HALF_TURN_MS` (0.7 s, linear). A turn to
  another side can't be called off or added to: arrows and keys are ignored till it lands, and Back lands it at once and
  charges it, since tapping back or leaving just before it landed gave a free look at the next side (the designer's
  call: a quick double tap no longer makes a half turn). A new puzzle's planets grow from their
  centres (`ss.rise`, 1 to 0).
- **A game's end**: on a win the map's planets glow, and swell three times (0.5 s each, linear) in a wave from the
  north-west corner. Play new (`playNew`) flips the map a quarter turn about its horizontal axis (`ss.flip`, `FLIP_MS`
  0.5 s, linear), its gold edge coming towards the player, till it's edge-on, makes the next puzzle out of sight, holds
  there with only the gold edge showing (`FLIP_PAUSE_MS`, 0.5 s; the rim in `Board.svelte`, the plate's thickness on that
  edge), and flips the empty map back (the designer's call: x-axis, linear, 0.5 s each way; easing out and in was tried
  and dropped, and so was the y-axis, which left a pause edge-on a blank screen). Only once it's flat do the tray's new
  planets grow in, so the two don't move at once (the designer's call). Coming to the game page plays the second half
  of this: the map starts edge-on (`arriveEdgeOn`; its pause starts with the page's fade-in, `PAGE_FADE_MS`) and flips
  back. So does a game coming back (Resume, or a finished daily reopened), at the designer's wish, with its planets
  hovering above the gold edge as on the itch cover, upright, their centres on one line and a lane's concentric (the
  designer's call), the nearer ones larger and in front, each with a shadow on the plate, and going to their cells as the map comes flat (`ss.stand`; `standing` in
  `Board.svelte`, a layer apart from the tilted map, using the same projection; `HOVER`, in cells). Play
  new's first half doesn't do this: those planets flatten with the map, since they're leaving. The board can't be turned
  and its cells can't be tapped while it flips (a turn costs, and would show nothing).
- A real 3D turn of the planets was rejected: their speeds would show their depth, and hidden ones would show
  mid-turn, giving the puzzle away.
- Fonts in `src/lib/fonts`: Cinzel (`CZ`, titles and numbers), Spectral (`SR`, text; its italic `SI` for hints and the
  launcher's economy paragraph, as in Mixed Results, at the designer's wish; it replaced Quicksand, which has no italic,
  except in the home page's rules and the shortcuts card, where the designer preferred Quicksand, `QS`),
  Space Mono (`SM`, labels; its bold on a gold button, selected or hovered, where thin dark letters were hard to read,
  more so on a phone; the same width, so nothing shifts).
- Splash: the template's BMG one. Sounds: the template's effects sprite; the music since `f6c4696` isn't Unmix's (see License). It fades up from silence (`MUSIC_FADE_MS`, 5 s) whenever it starts or resumes (the first Start, Music On, back in the window), at the designer's wish; it goes off at once.
- App icon (`scripts/icon.html`, `sh scripts/render-icons.sh`): the eclipse with the moon and the giant.

## Scoring: the bank

As in Mixed Results and Bits and Pieces (the designer's proposal). Each game starts with `BANK` ($10, every level). A
turn costs `COST_TURN` ($1), a quarter or a half alike (so each new side costs $1, and all four still cost $3), every
turn, a side seen before too; turns after the game ends are free. A swipe is one move however far it goes, charged by
where it lands: $1 on another side, $0 full circle on the same one. The
first mark in a cell is free; any change after that costs `COST_CHANGE` ($1): another size, or clearing it
(`pzl.marks`: -1 never marked, 0 cleared, 1–3 a planet; `pzl.turns`, `pzl.changes`). Clear All (toolbar, after
Back; `clearAll`) clears every planet on the map at `COST_CHANGE` each, as by hand, after a prompt that names the price
("Clear 3 planets — $3?" / No; the designer's call: a convenience, not a loophole). The scoreboard: the level's
stats, led by its difficulty (solved M/N, N the plays; average and best balance; the best only from games solved), then
BANK − COST = BALANCE (`Money.svelte`; the balance red below zero). The digits roll (`Roller.svelte`, after Leap of Fate's), by the number's size: down as it
shrinks, so up below zero. On a phone too: `Roller Digit.svelte` moves its strip by requestAnimationFrame, with no mask, because on a Pixel 6a, over a turn every 0.62 s, late frames were
29% with NumberFlow, 42% with a Web Animation on the compositor (mask and glow hardly mattered), 8% by requestAnimationFrame, 1.7% without its mask, against 1% with no rolling. Any
animation on the compositor during a turn seems to do it (the arrows' press scale and hover fade did too). A win scores the balance,
which may be negative ("…but you shifted into the red"). A give-up counts as a play scoring $0, or the balance if lower,
so it never beats breaking even. The stats' row is the map's width, or wider, centred, when the gap between stats would otherwise close up ("Quite Hard" does that). On a touch screen its labels and stats are larger (12 and 16 px, against 10 and 14), in a wider row (410 px) with tighter letter spacing, the board staying put. No board size shown: the board shows it. The sides seen are still recorded
(`pzl.seen`) but not shown. The saves' key went to V2 with the bank (turn-based stats couldn't carry over).

**Par (on the back burner; measured before half turns, which make opposite sides one move apart, so the table is out of date):** the fewest quarter turns from South to see a set of sides that solves the puzzle
(0 to 3; any 3 turns see all four sides). Measured over 1,000 puzzles per level (Nov 2026), by the solver tier that
graded each puzzle; tier 3 and true uniqueness gave the same within a point:

| Level     | par 1 | par 2 | par 3 |
|-----------|-------|-------|-------|
| 4×4 Easy  | 25%   | 38%   | 37%   |
| 4×4 Hard  | 1%    | 33%   | 67%   |
| 5×5 Easy  | 15%   | 37%   | 48%   |
| 5×5 Hard  | 6%    | 35%   | 59%   |

None is solvable from South alone. As a golf score par is weak (looking at every side is never more than 2 over); the
idea left open was showing it up front as the challenge ("par 1: two sides are enough"). 4–190 ms per puzzle to compute.

## Daily

Home offers Daily and Binge, the names and the idea as in Threelogy and Pentagramma. Binge is the game as it was, every
level and Play new. Daily is a puzzle a day at each of the six levels (the designer's call: all six, each its own
button, in place of one Start), one try at each, the same for everyone with that date.

- **The day** is the player's own date (`dayOf`), as in the other daily games, so it turns over at their midnight. There's
  no server: it works offline, and it trusts the device's clock.
- **The board** (`dailyPuzzle` in `logic.js`): the live levels run the normal generator on numbers seeded by the date and
  level (`seeded`). So a change to the generator or to `RULES` changes the puzzles of every day to come, and a test pins
  one day's board to catch that. Quite Hard's boards are the ready-made pool, which random draws didn't suit: the same
  board and orientation came back within weeks. The days walk through the pool instead, a new orientation each pass, so a
  board comes back only after the whole pool: in a year, turned or mirrored, and exactly as it was in 8. Adding to the
  pool (`make-puzzles.js`) changes the boards of the days to come, since the walk goes by its size, and a player partway
  through that day's game keeps the board in their save. Binge's Quite Hard draws from the
  same pool, so it can deal a board the daily also uses. The live levels can repeat by chance: measured over a year, 4×4
  Easy once exactly and 6 times counting turned or mirrored boards, 5×5 Easy 3 times counting those, the others none.
- **The launcher** shows the date and, in place of the pills and Start, six buttons, a row for each board size, each as
  wide as what it says, as in Binge (the designer's call). A tap starts that level. Each is the level's difficulty over
  how its daily stands: nothing yet, "resume", the score, or "gave up"; the last two look the same, lavender (the
  designer's call). A finished one reopens its board to look at. Gold fill shows only on a hover or tap: unlike Binge's
  pills, which select (`ss.picked`, kept with the sound settings), these are buttons that act, so no last selection is
  kept (the designer's call, after trying it). A gold tint for finished was tried against the lavender and came out a
  muddy brown, too near the gold outlines. Share comes under them once one is finished. The time till the next puzzles
  (`Countdown.svelte`) is below. It goes through the launcher, rather than straight from Home, for the economy paragraph.
  The note "Six new puzzles a day, the same for everyone. One try at each." went to make room for Share (the designer's
  call), so the game no longer says it anywhere.
- **Share** copies a text card to the clipboard (`shareCard` in `logic.js`, `copyText` in `utils.js`), the designer's idea:
  the game's name, the date, a line for each finished game (the score, turns and second guesses, or "gave up"; given-up
  ones stay on, or the card would flatter), and `GAME_URL`. A game under way isn't on it, as its score could still change.
  The button says "Copied" or "Copy failed" for `SHARED_MS`. The copy goes in the click itself (`onPress` on
  `Text Button.svelte`), since `onClick` comes later, after the button springs back, and browsers can refuse the clipboard
  by then; `onClick` still makes up for a press that slips off the shrinking button, which gets no click. `navigator.clipboard`
  is refused in a frame of another origin with no rights given, so `copyText` falls back on a selection and
  `execCommand`: that worked in Chrome in such a frame; not yet tried on itch.io itself or on an iPhone.
- **The game** is the same, bank and all, and the scoreboard leads with the difficulty, as in Binge. At the end, the
  countdown takes Play new's place; once midnight has passed, Play new comes back and deals that level's new day's.
  There's no replay: the player knows the answer.
- **The saves**: each level's daily has its own (`APP_STATE • daily <level id>`), stats and puzzle, with `pzl.day`, so the
  stats compare like with like and stay apart from Binge's. Unlike a Binge game, a finished one is kept till its day is
  out. `ss.daily` is Home's choice, `ss.level` the level last played in either, and `ss.slot` the save now loaded. A game
  begun and not finished by the time that level's daily is next opened counts as given up (`closeOldDaily`), once, so
  waiting for midnight is no way out of a bad game (the designer's call); one still open at midnight can be finished.
- `ss.now` is the clock, set each second from `+page.svelte`; `today()` follows it.

## Quite Hard

The designer's aim was a harder puzzle, not a bigger one. A 6×6 board was tried and dropped: it played as just more
cells (6–8 planets in 36). The solver's tiers can't go higher: of about 130,000 random boards, none with a unique answer
needed more than tier 3, so combining a lane's two views adds nothing. Quite Hard is picked from within tier 3 (`fits`
in `logic.js`): a board that takes all four sides, whichever is left out (`needsAllSides`), and at least `DEEP` (4)
rounds of reasoning (`depth`: each round uses only what earlier ones settled, so turning or mirroring a board doesn't
change it). 5×5 Not Easy, by contrast, was about 85% tier 2 when measured. Whether depth is what a player feels as hard
is the designer's judgement from play, not something measured.

Such boards are too rare to generate while the player waits (about 1 s each for 4×4, 13 s for 5×5, on a desktop), so
they ship ready-made: `src/puzzles.js` (365 for each size, a year of dailies, none another turned or mirrored), made by
`scripts/make-puzzles.js`, and turned and mirrored at random by `generate`. The other levels are generated live.

## Files

- `src/logic.js`: the prototype's rules, solver tiers and generator (`generate`, `tierOf`, `elevation`), plus Quite
  Hard's grading and ready-made boards, and the daily's dates and boards, tested in `src/logic.test.js` (`npm test`).
- `scripts/make-puzzles.js`: `node scripts/make-puzzles.js 4expert=365 5expert=365` tops those levels up in
  `src/puzzles.js`, keeping what's there, on most of the cores at low priority (the last 335 boards at 5×5 took 36
  minutes on 5 workers), and skips a board that's another turned or mirrored. The dev server reloads the page when it
  saves, as each level is done.
- `src/shared.svelte.js`: the store `ss`, per-level saves (`APP_STATE • <level id>`: stats and the puzzle), turning
  (`turnBy`, `spinTo`, `ss.angle`, `sideAt`), selecting and marking (`select`, `mark`; a match ends the game), the budget (`cost`, `balance`), reveal, the daily's day (`today`, `dailyGame`, `closeOldDaily`), Back (`goBack`). `pzl.step` is the net count of clockwise quarter turns.
- `src/const.js`: title, levels, sizes, sides, swipe and turn timing, the bank and costs, prompts.
- `scripts/build-itch.js`: `npm run build:itch`, a static build without the PWA parts, zipped for itch.io.
- `scripts/cover.html`: the itch.io cover, 630 × 500: the board seen from low down, under the title. The camera is in line
  with one lane and at the planets' height, so that lane's planets are concentric and the board stays square with the
  picture (the designer's calls: the game's even rings, a level gold edge). Its `#embed` layout is the Embed BG, 640 ×
  360 (the only size that has worked on itch, in the designer's experience): the emblem's dark disc behind itch's central
  Run Game button, the planets in the outer lanes, clear of it. Its `#wide` layout is the Wide Cover, 840 × 360 (21:9),
  with no title, as itch's form says it puts the title or logo over promo modules. Its `#social` layout is the social media image, 1200 × 630, with the title, since a link preview has no
  overlay. `scripts/logo.html` is the logo, 1000 × 300 on transparency: cream letters on a dark outline, as itch wants it
  legible on white and black. `scripts/tile.html` is the page's background, a seamless tile, 1024 × 1024: the game's sky on
  a flat base, its nebulae fractal noise that wraps. `scripts/rules.html` is the rules graphic for the page's description,
  900 × 600, in the format of Hexodus's: its wording states the difficulties' names and the price of a turn, so change it
  with the game. `sh scripts/render-cover.sh` writes the stills to `itch/`: `cover.png`, `embed-bg.png`, `social.png`,
  `logo.png`, `tile.png`, `rules.png`. `node scripts/render-screenshots.mjs` writes `itch/screenshots/`, five shots of the real game, with the dev server
  running; the puzzle is random, so look at them. `node scripts/render-resume-gif.mjs` writes `itch/screenshots/1-resume.gif`: the first shot's view, then Back and the flip of Resume, the launcher kept out of the picture (the designer's call), looping, from the real game on a clock of its own (one frame per tick, as a screenshot is too slow to keep up), with a deal that shows an eclipse at 90°; also random, and its size varies with the deal. `node scripts/render-cover-gif.mjs [cover|embed|wide]` writes `itch/cover.gif`, `itch/embed-bg.gif` or `itch/wide-cover.gif`: a
  hold on that view, then one full turn (needs ffmpeg). GIFs work on itch, in the designer's experience. The settings are
  set to come in under 3 MB, itch's limit on GIFs by forum reports (no official figure found).

## License

The code is MIT (`LICENSE`, the designer's choice). `NOTICE.md` lists what that doesn't cover: the art and the logo (all
rights reserved), the music, the sound effects, the fonts (OFL, its texts in `src/lib/fonts`) and the libraries in the
client bundle (howler, Svelte, SvelteKit, clsx). `static/NOTICE.md` is a copy of it, so that it ships with the game (MIT
asks for the libraries' notices in every copy, and minifying strips them): change the two together, and add any new
runtime library. The music's license (Soundimage: CC BY 4.0 with one restriction, not sublicensable) requires its credit
in the game itself, so the launcher's line can't simply go.

Not on record: the sound effects' source (the same sprite is in 64 of the BMG games), and the music's. The credit to Eric
Matyas was taken from this file's note on Unmix's track, but `f6c4696` replaced that track with one shared with DLMPY,
Forever Contagion, Now You See Me, Parasite, Total Contagion and ZKT, none of which names a source; it's unconfirmed.
