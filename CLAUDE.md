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
  outlined, with Keep looking / Show solution. Give Up shows the solution too.

## Look: deep space

- A starfield with nebulae (`Space.svelte`, seeded, some stars twinkle) behind a dark glass page with a violet rim.
- The planets (`Defs.svelte`, drawn once on a unit circle, used through `Planet.svelte`): 1 a golden cratered moon,
  2 a teal ocean world, 3 a violet gas giant with bands and a storm. Lit from the upper left. Radii as the brief:
  17, 29, 44 hundredths of a cell.
- **The map** (`Board.svelte`): flat, top-down, `MAP` (330 px) wide, the side being viewed at the bottom with a gold
  edge. It turns with the board (`ss.angle`), live while the tray is dragged; its planets stay upright. Tap a cell to
  mark it; the map itself doesn't swipe. No compass letters and no "from the South" label: the designer found them
  unhelpful (the turning map shows the orientation; the scoreboard's dots show the sides seen).
- **The palette** (`Palette.svelte`): the brushes (small, medium, large, empty) and Done at the end of the row.
- **Messages**: the hint line above the map (`Message.svelte`: what to do next, or how many cells are off). Any
  prompt takes the palette's place (`Actions.svelte`): Keep looking / Show solution after a wrong Done; the
  confirmations, which follow the template (the question is the yes button, beside No); and at a game's end its
  message ("No more dark matter!", or best / average improved, or the revealed one) for `OVER_MS` (3 s), then Play new.
- **The tray** (`Tray.svelte`): the true view, edge-on (the board's edge seen by a 2D being: a line), its lanes under
  the map's columns at the same scale. Swiping it turns the board, as decided with the designer: the planets follow
  the finger and slide off the tray's end, the next side's lineup slides in from the other end (a carousel), all at
  one speed, so no depth shows. A quarter turn is `SWIPE_PX` of travel; a flick goes on to the next quarter, a slow
  drag settles on the nearest. A swipe to the left turns the board clockwise (East comes round). ← → and the arrow
  buttons turn it too. A new puzzle's planets rise from below the tray (`ss.rise`).
- A real 3D turn of the planets was rejected: their speeds would show their depth, and hidden ones would show
  mid-turn, giving the puzzle away.
- Fonts in `src/lib/fonts`: Cinzel (`CZ`, titles and numbers), Quicksand (`QS`, text), Space Mono (`SM`, labels).
- Splash: the template's BMG one. Sounds: the template's effects sprite; Unmix's music (Eric Matyas, soundimage.org).
- App icon (`scripts/icon.html`, `sh scripts/render-icons.sh`): the eclipse with the moon and the giant.

## Scoring (open)

For now: a quarter turn counts 1 (a half turn 2). Per-level stats: solved, average turns, best. Sides seen are shown
(the compass) but don't score. The designer wants to play it before settling scoring.

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
