# Edgewise — build brief

Puzzle game for a jam with the theme **SHIFT**. Build it in **SvelteKit with Svelte 5 (runes mode)**, as a browser game for itch.io, with a mobile-friendly layout.

A working single-file prototype is attached as `edgewise.html`. Use it as the reference for rules, generator, and solver logic. Port the logic as-is; redo the UI properly in Svelte.

## Concept

The board is a square grid. Some cells hold one sphere, which can be Small, Medium, or Large. The player is a 2D being and sees the board only from the side, one edge at a time. They turn the board 90° left or right to see another side. When they think they know the layout, they fill in a map and press Done.

## Rules

1. **Side view (elevation).** Each lane (a row or column, seen from one end) shows spheres standing on a floor line, with no depth information.
2. **Hiding.** A sphere hides anything its size or smaller behind it. A bigger sphere behind it still shows above it. So each lane view shows an increasing sequence of sizes from front to back.
3. **Turning.** One turn = 90° left or right. There are 4 possible views.
4. **Map.** The player marks each cell as Small, Medium, Large, or Empty (×). Blank counts as empty.
5. **Done.** Checks the map against the solution. If any cells are wrong, outline them and offer "Show solution."
6. **Score (for now).** Show turns used and sides seen (out of 4). Neither one limits play yet.

## Layout

- The map (plan view) goes on top and the side view (elevation) below it, at the same width so the lanes line up with the map columns.
- The map rotates with the board (animated), so the side the player faces is always at the bottom, next to the elevation.
- Label the current side: "From the South / East / North / West".
- Draw spheres at the same scale in both views. Radii in a 100-unit cell: S 17, M 29, L 44. Each size gets its own color.
- Input: pick a brush (S / M / L / Empty), then tap cells. Tapping a cell that already holds the brush value clears it. Taps on drawn spheres must reach the cell underneath (`pointer-events: none` on spheres).
- Keyboard: ← → to turn, 1 2 3 for sizes, 0 for empty.
- Respect `prefers-reduced-motion`.

## Puzzle generation and difficulty

Generate a random board, grade it with the solver, and keep it only if it matches the chosen level. Run generation in small batches so the UI doesn't freeze. All solver rules are sound, so a full solve also proves the solution is unique. No separate uniqueness check is needed.

The solver works on candidate sets per cell and applies rules **to one view at a time**. It never combines two views of the same lane, so the player never needs to remember two views together. Tiers:

- **Tier 1:** an empty view means the whole lane is empty; no cell can be bigger than the biggest size seen; a seen size with only one possible cell goes there.
- **Tier 2:** Tier 1, plus: an unseen size must sit behind something its size or bigger; a seen size with nothing able to hide it must have all smaller seen sizes in front of it; the first sphere from the front is the smallest one seen.
- **Tier 3:** every arrangement of one lane that fits one view (if/then reasoning).

A board's tier is the lowest tier that fully solves it. If even Tier 3 fails, reject the board.

| Level | Density | Accept when |
|---|---|---|
| 4×4 Easy | 0.35 | Tier 1 or 2 |
| 4×4 Hard | 0.50 | Tier 3 |
| 5×5 Easy | 0.25 | Tier 2, exactly 5 spheres |
| 5×5 Hard | 0.30 | Tier 2 or 3, 6+ spheres |

Sizes are picked uniformly. Reject boards with fewer than N spheres. In the prototype, each level generates in under 0.2 s.

## Known facts (don't re-investigate)

- A sphere hidden from all four sides can't exist in a unique puzzle, since removing it wouldn't change any view.
- Unique 5×5 puzzles almost never have more than 7 spheres.
- Full line solving (both views of a lane combined) solves essentially every unique board, so it's useless for grading difficulty. That's why the tiers above are deliberately weaker.

## Open questions (ask before deciding)

1. Should turns be limited, or scored more strictly?
2. Final name. "Edgewise" is a working title.
3. Whether to add a daily or seeded puzzle.
