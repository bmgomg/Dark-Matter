---
name: run-game
description: Launch Dark Matter of Perspective and drive it in headless Chrome (splash, Home, launcher, a game, Back), reporting what's on screen and saving screenshots. Use to run or screenshot the game, or to confirm a change works in the real app.
---

# Run the game

1. See whether a dev server is already up. The designer often has one running, and a second fails with "Port 1119 is
   already in use". Reuse it if so.

   ```sh
   curl -s -o /dev/null -m 3 -w '%{http_code}\n' http://localhost:1119/
   ```

   If that doesn't print 200, start one in the background: `npm run dev`.

2. Drive it, saving screenshots to a folder outside the repo (the scratchpad, if there is one):

   ```sh
   node .claude/skills/run-game/drive.mjs <output folder>
   ```

   It opens a 450 × 800 page in headless Chrome with a throwaway profile, waits out the splash, then goes Home → Binge →
   the launcher → Start → a game → Back, printing the launcher panel's and the music credit's boxes at each step, then
   any uncaught page errors. It saves `1-home.png`, `2-launcher.png` and `3-game.png`.

3. **Look at the screenshots.** The boxes can't show whether something looks right. To check something else, add steps
   to the script with its `click(text)`, `evaluate(js)` and `shot(name)`. A mouse is what it simulates, not touch, so the
   page behaves as on a desktop (the sky drifts; touch-only sizes don't apply).

Needs Node 22 or later (for its built-in WebSocket) and Chrome at its usual Windows path, or set `CHROME` to another.
