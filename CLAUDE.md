# Dark Matter of Perspective

_It takes a shift._ (tagline)

The "dark matter" is the planets hidden behind bigger ones: there, but unseen from a side, and worked out only from
what can be seen, as astronomers infer dark matter.

Puzzle game for a jam with the theme **SHIFT**. A SvelteKit app in the style of `C:\git\BMG\♻️Template` and Unmix:
splash, Home (title, rules, Play), a launcher (the economy, board size, difficulty, Play), Game Page (scoreboard, board, palette, toolbar) on a 450 × 800 page that
scales down to fit, a PWA that plays offline. `npm run dev` serves it on port 1119. The rules, generator and solver come
from the prototype, `edgewise.html`, and its brief, `edgewise-brief.md` (rules, tiers, levels; "Known facts" there are settled).

## Rules

- Planets of three sizes (small, medium, large) on an N × N board, at most one per cell.
- The player sees the board only edge-on, one side at a time, and turns it a quarter at a time.
- A planet hides anything its size or smaller behind it; a bigger one behind still shows over it.
- The player taps a cell (it pulses, and the palette comes up) and marks it small, medium or large, or clears it.
  A blank cell counts as empty; there's no "empty" mark (the designer's call: a blank is an answer too). The game ends
  the moment the map matches the solution: no Done button (the designer's call). It never says which cells are off,
  so guessing can't stand in for turning (the old wrong-cell outlines after a Done let it). Give Up shows the
  solution, after a confirmation ("Average will be affected — give up?" / No). The map changes over to the solution
  through a transition: the wrong planets shrink and fade, then the true ones grow in, cell by cell from the
  north-west corner.

## Look: deep space

- A starfield with nebulae (`Space.svelte`, seeded, some stars twinkle) behind a dark glass page with a violet rim.
- The planets (`Defs.svelte`, drawn once on a unit circle, used through `Planet.svelte`): 1 a golden cratered moon,
  2 a teal ocean world, 3 a violet gas giant with bands and a storm. Lit from the upper left. Radii as the brief:
  17, 29, 44 hundredths of a cell.
- **The map** (`Board.svelte`): flat, top-down, `MAP` (330 px) wide, the side being viewed at the bottom with a gold
  edge. It turns with the board (`ss.angle`), live while the tray is dragged; its planets stay upright. Tap a cell to
  select it (`ss.sel`: gold, pulsing), again to let it go; the map itself doesn't swipe. The board turns with a cell
  selected. No compass letters and no "from the South" label: the designer found them unhelpful (the turning map
  shows the orientation). (Cursors carrying the brush went with the brushes.)
- **Below the tray** (`Game Page.svelte`, the rest of the page's height, its content centred, no separator): with no
  cell selected, the hint (`Message.svelte`: what to do next), moved down from above the map at the designer's
  request; with one selected, "Think twice — changing your mind costs $1." The palette (small, medium, large, clear;
  the cell's own planet lit and disabled, Clear disabled on a blank cell) is being tried at the cell (`Picker.svelte`:
  a pill on the map with a notch pointing at the cell, above it or below it near the top, growing out of it; a tap
  off the map lets the cell go), because the designer kept mistaking a palette below the tray for the tray, both
  rows of planets. `PALETTE_AT_CELL` switches back to the old palette there (`Palette.svelte`). Moving the tray above
  the map was weighed and rejected: it belongs against the gold edge it's seen from. Keys: 1–3 a planet,
  0 / Delete / Backspace clear, Esc lets the cell go. Any prompt takes the same place (`Actions.svelte`, 50 px tall
  so the game-over message doesn't shift when Play new fades in): the confirmations, which follow the template (the
  question is the yes button, beside No); and at a game's end its message ("No more dark matter!", best / average
  improved, the bank broken, or the revealed one) for `OVER_MS` (3 s), then Play new.
- **The launcher** (`Launcher.svelte`, as in Triangula; Home's Play opens it): a glass panel with the economy
  paragraph, Board (4×4 / 5×5) and Difficulty (easy / hard) pills, and Play. No stats there (the designer's call). It
  opens on the last level played; Play goes on with that level's unfinished game. The toolbar's first button is
  Back (text, like the rest: no icons in the toolbar): a game → the launcher → Home.
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
  found that loophole on a wide screen). A drag can't start while a counted turn plays out. A quarter turn is `SWIPE_PX` of travel; a flick goes on to the next quarter, a slow
  drag settles on the nearest. A swipe to the left turns the board clockwise (East comes round). The turn buttons at
  the tray's ends, and ← →, turn it as a swipe that way (left: clockwise); their arrows are Hexodus's shapes
  (`Icon.svelte`), bare, without its rings, upside down, each tilted 35° outwards (left counterclockwise, right
  clockwise) to hint at the way the lineup slides. A swipe's settle takes `TURN_MS` (0.42 s, ease-out); a tap's whole quarter
  turn `TAP_TURN_MS` (0.5 s, linear), slowed at the designer's request. A new puzzle's planets grow from their
  centres (`ss.rise`, 1 to 0).
- A real 3D turn of the planets was rejected: their speeds would show their depth, and hidden ones would show
  mid-turn, giving the puzzle away.
- Fonts in `src/lib/fonts`: Cinzel (`CZ`, titles and numbers), Quicksand (`QS`, text), Space Mono (`SM`, labels).
- Splash: the template's BMG one. Sounds: the template's effects sprite; Unmix's music (Eric Matyas, soundimage.org).
- App icon (`scripts/icon.html`, `sh scripts/render-icons.sh`): the eclipse with the moon and the giant.

## Scoring: the bank

As in Mixed Results and Bits and Pieces (the designer's proposal). Each game starts with `BANK` ($10, every level). A
quarter turn costs `COST_TURN` ($1), every turn, a side seen before too; turns after the game ends are free. The
first mark in a cell is free; any change after that costs `COST_CHANGE` ($1): another size, or clearing it
(`pzl.marks`: -1 never marked, 0 cleared, 1–3 a planet; `pzl.turns`, `pzl.changes`). The scoreboard: the level's
stats, led by its difficulty (plays, solved, average and best balance; the best only from games solved), then
BANK − COST = BALANCE (`Money.svelte`, NumberFlow dollars; the balance red below zero). A win scores the balance,
which may be negative ("…but the bank's broken"). A give-up counts as a play scoring $0, or the balance if lower,
so it never beats breaking even. No board size shown: the board shows it. The sides seen are still recorded
(`pzl.seen`) but not shown. The saves' key went to V2 with the bank (turn-based stats couldn't carry over).

**Par (on the back burner):** the fewest quarter turns from South to see a set of sides that solves the puzzle
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

## Files

- `src/logic.js`: the prototype's rules, solver tiers and generator, as-is (`generate`, `tierOf`, `elevation`), tested
  in `src/logic.test.js` (`npm test`).
- `src/shared.svelte.js`: the store `ss`, per-level saves (`APP_STATE • <level id>`: stats and the puzzle), turning
  (`turnBy`, `spinTo`, `ss.angle`, `sideAt`), selecting and marking (`select`, `mark`; a match ends the game), the budget (`cost`, `balance`), reveal, Back (`goBack`). `pzl.step` is the net count of clockwise quarter turns.
- `src/const.js`: title, levels, sizes, sides, swipe and turn timing, the bank and costs, prompts.
- `scripts/build-itch.js`: `npm run build:itch`, a static build without the PWA parts, zipped for itch.io.

## Open questions

1. A daily or seeded puzzle.
