# best-heist-game-20261122

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Endodo713/best-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Endodo713/best-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**VELVET FOX — The Aldermere Gallery Heist**. A complete, original, offline heist game that runs in desktop Chrome from static files, with no network requests.

Cross one gallery room as the Velvet Fox. Guards with vision cones (cones turn red when they spot you) and sweeping wall cameras hunt you. Grab the glowing "Sun of Aldermere" diamond, then escape through the exit window before the alarm meter fills to 100%.

Throw coins (click) to lure guards to investigate, and puff smoke (hold Shift/Space) to hide briefly. WASD / arrow keys move you. Clear win screen ("CLEAN GETAWAY" + time + score) and lose screen ("CAUGHT!"), both with restart (R key or click).

Original art drawn in canvas, original sounds synthesised with WebAudio, no external fonts, images, CDNs or network calls.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Then open `game/index.html` in Chrome (serve it over localhost — ES modules are blocked on `file://`), or let `main.ts` write `out/` for submission.

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
