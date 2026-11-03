# Edgewise

Puzzle game for the **SHIFT** jam. See [edgewise-brief.md](edgewise-brief.md) for the rules and design; [edgewise.html](edgewise.html) is the original single-file prototype.

SvelteKit 2 + Svelte 5 (runes), built as a static single page.

```sh
npm install
npm run dev      # play locally
npm test         # solver/generator and game-flow tests
npm run build    # static site in build/
```

## Layout

- `src/lib/game/logic.ts` — rules, solver tiers, generator (ported as-is from the prototype)
- `src/lib/game/game.svelte.ts` — game state and actions (`Game` class with runes)
- `src/lib/components/` — `Plan` (map), `Elevation` (side view), `Brushes`, `Sphere`
- `src/routes/+page.svelte` — page layout and keyboard input

## Publishing to itch.io

`npm run build`, then zip the **contents** of `build/` (so `index.html` sits at the zip root) and upload it as an HTML game. The build uses hash routing and relative asset paths (`scripts/relative-paths.js`), so it runs from itch's sub-path. Fonts are bundled, with no external requests.

```powershell
Compress-Archive -Path build\* -DestinationPath edgewise.zip -Force
```

Requires Node 22.14+. SvelteKit 3 needs Node 22.17+, so the project stays on SvelteKit 2 for now.
