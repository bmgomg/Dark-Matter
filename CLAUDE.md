# Dark Matter of Perspective

_It takes a shift._ (tagline)

The "dark matter" is the planets hidden behind bigger ones: there, but unseen from a side, and worked out only from
what can be seen, as astronomers infer dark matter.

Puzzle game for a jam with the theme **SHIFT**. A SvelteKit app in the style of `C:\git\BMG\♻️Template` and Unmix:
splash, Home (title, rules, level buttons), Game Page (scoreboard, board, palette, toolbar) on a 450 × 800 page that
scales down to fit, a PWA that plays offline. `npm run dev` serves it on port 1119. The rules, generator and solver come
from the prototype, `edgewise.html`, and its brief, `edgewise-brief.md` (rules, tiers, levels; "Known facts" there are settled).

## Rules

- Planets of three sizes (small, medium, large) on an N × N board, at most one per cell.
- The player sees the board only edge-on, one side at a time, and turns it a quarter at a time.
- A planet hides anything its size or smaller behind it; a bigger one behind still shows over it.
- The player marks each cell small, medium, large or empty (blank counts as empty), then taps Done. Wrong cells are
  outlined, with Keep looking / Show solution. Give Up shows the solution too, after a confirmation ("Average will be
  affected — give up?" / No). Showing the solution either way is giving up: it counts as a play, scoring its turns plus
  `GIVE_UP_TURNS` (4), so giving up can't help the average; best is only from solved games. The map changes over to
  the solution through a transition: the wrong planets and crosses shrink and fade, then the true ones grow in, cell
  by cell from the north-west corner.

## Look: deep space

- A starfield with nebulae (`Space.svelte`, seeded, some stars twinkle) behind a dark glass page with a violet rim.
- The planets (`Defs.svelte`, drawn once on a unit circle, used through `Planet.svelte`): 1 a golden cratered moon,
  2 a teal ocean world, 3 a violet gas giant with bands and a storm. Lit from the upper left. Radii as the brief:
  17, 29, 44 hundredths of a cell.
- **The map** (`Board.svelte`): flat, top-down, `MAP` (330 px) wide, the side being viewed at the bottom with a gold
  edge. It turns with the board (`ss.angle`), live while the tray is dragged; its planets stay upright. Tap a cell to
  mark it; the map itself doesn't swipe. No compass letters and no "from the South" label: the designer found them
  unhelpful (the turning map shows the orientation). Over a cell the pointer is an arrow carrying the picked brush
  (`cursor.js`: the planet, sized in the board's ratios, or the cross; the planets' art copied in from Defs).
- **The palette** (`Palette.svelte`): the brushes (small, medium, large, empty) and Done at the end of the row.
- **Messages**: the hint line above the map (`Message.svelte`: what to do next, or how many cells are off). Any
  prompt takes the palette's place (`Actions.svelte`): Keep looking / Show solution after a wrong Done; the
  confirmations, which follow the template (the question is the yes button, beside No); and at a game's end its
  message ("No more dark matter!", or best / average improved, or the revealed one) for `OVER_MS` (3 s), then Play new.
- **The tray** (`Tray.svelte`): the true view, edge-on (the board's edge as a 2D being sees it), with no
  lane lines (the designer dropped the dashed ones) and no line under the planets (a faint separator sets the palette off below instead), its lanes under
  the map's columns at the same scale. The planets are centred on one line of sight (`AXIS`: as low as a large planet allows, its bottom on the old floor
  line, so the separator's spacing holds), not standing on a
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

## Scoring (open)

For now: a quarter turn counts 1 (a half turn 2). The scoreboard shows the level's stats, led by its difficulty:
plays (with give-ups), solved, average turns, best; and the turns ("3 turns", on one line). No board size: the board shows it. The sides seen are still recorded (`pzl.seen`) but no longer shown: the designer dropped
the scoreboard's sides-seen dots and their "n/4 sides" count. The designer wants to play it before settling scoring.

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
  (`turnBy`, `spinTo`, `ss.angle`, `sideAt`), marking, Done, reveal. `pzl.step` is the net count of clockwise quarter turns.
- `src/const.js`: title, levels, sizes, sides, swipe and turn timing, prompts.
- `scripts/build-itch.js`: `npm run build:itch`, a static build without the PWA parts, zipped for itch.io.

## Open questions

1. Scoring: turns, sides seen, time, or a limit on turns.
2. A daily or seeded puzzle.
