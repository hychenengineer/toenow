# Animal Rescue Train — SDK integration

This static HTML/CSS/JavaScript game follows the root AGENTS.md and uses the shared title styles, difficulty mapping, storage registry, security profile, platform adapter, and ToenowGameSDK. No additional engine or dependency is needed at runtime.

| Shared level | Normal waves | Queues | Carriages | Species |
| --- | --- | ---: | ---: | ---: |
| Beginner | 1–5 | 2 | 2 | 2 |
| Intermediate | 6–10 | 3 | 2 | 3 |
| Advanced | 11–15 | 3 | 3 | 5 |
| Expert | 16–20 | 4 | 3 | 6 |
| Master | 21+ | 5 | 4 | 8 |

The bank contains five distinct certified puzzles per level (25 total). Normal mode advances through shared wave bands; Master repeats its five-puzzle bank after wave 25. This is finite content, not unlimited unique generation. Practice can start directly at any shared level and continues within that level, without changing best score or best wave. No player has to replay easy levels to retry a hard puzzle.

The English title screen contains the short rules and practice selection. Gameplay shows the board, targets, and controls; Help opens instructions separately. Retry preserves the current puzzle and difficulty. Undo restores exactly one move, including a winning or losing transition.

Guest progress is stored as a validated move history under the registered session key. It restores puzzle, mode, cumulative normal score, and whether undo has already been used. It works in the same browser/profile without login. Clearing browser data or changing devices removes this local continuity. If browser storage is blocked, play remains available and the menu explains that progress cannot be saved.

SDK lifecycle callbacks handle start, pause, resume, and restart. Completed or blocked rounds report the cumulative number of rescued animals in normal mode. The Hub synchronizes personal records and uses GAME_RESTART/CLOSE_GAME for embedded controls. Practice reports are excluded from records. The game remains excluded from leaderboard/cloud score submission; it does not invoke ads or purchases.

## Difficulty evidence

`tools/build-rescue-bank.cjs` generates the checked-in bank with a fixed seed and certifies every puzzle. `tools/rescue-train-difficulty.cjs` measures exact success probability for uniform legal non-mixing queue choices, one carriage per active species. This is a comparison model, not measured human success. Probability bands are 100%, 65–90%, 25–50%, 6–16%, and 0.5–3.5%. Advanced through Master reject the tested simple greedy strategies.

The solver replays its certificate through the actual game engine; an independent replay also checks targets and rejects mixed species. Visibility and trap-depth metrics concern the selected certificate path, not every possible history or a fixed human thinking depth. Each carriage accepts one species only: empty carriages accept any animal, occupied carriages only matching animals. Incompatible carriage buttons are disabled. A station loses when no queue head can board any carriage, even if seats remain; departures and victory are settled first.

## Local verification

- `npm test`: shared SDK regression, all game startup checks, practice isolation, engine rules, session replay, difficulty analysis, and all 25 puzzle certificates.
- `npm run serve`: local server, currently port 8765.
- With Playwright available in NODE_PATH: `node tools/verify-animal-rescue-train-browser.cjs` (installed Chrome by default; optional RESCUE_BROWSER_CHANNEL).
- Browser evidence: `artifacts/animal-rescue-train/browser-results.json`, plus menu, desktop, mobile, blocked-station and Hub screenshots.

Browser checks cover normal wave progression, all five practice difficulties, winning/blocked undo, reload persistence, unavailable storage, touch emulation, responsive widths, Hub restart and result communication. Physical iPad Safari and authenticated backend services are not verified by these local checks. No public deployment is performed by this change.
