# 動物救援列車 — local prototype

Uses TOENOW's static HTML/CSS/JavaScript and existing card → iframe integration. No engine, build step, third-party dependency, score messages, account, ads, purchases or deployment.

## Design / implementation checklist

- [x] Pure state engine: three FIFO queues, three cars of capacity three, mixed species allowed. A uniform full car departs immediately and rescues three animals; goals count animals, not trains. Settle departures, check victory, then check for legal moves (including exhausted queues).
- [x] Five fixed levels, increasing species and queue lengths; an exact search produces a winning certificate for each. Difficulty is a design progression, not a measured human rating.
- [x] Responsive dark station, original inline SVG animal faces plus species labels, queue head selection followed by car selection, three upcoming animals visible per queue in addition to its head.
- [x] Short tutorial, replay, level selection, next level, exactly one previous-move snapshot. Undo restores departed cars, queues, rescue counters and terminal states. A fresh successful move replenishes undo; consecutive undo is unavailable.
- [x] Hub card/preview, exclude prototype from leaderboard and score ingestion. Preserve pre-existing workspace edits.
- [x] Node engine tests and solution certificates; browser verification of actual clicks/taps, failures, undo/restart, all five wins, iframe mounting, narrow screens and JavaScript errors.

## Local use

From the repository root, run `node tools/serve-local.cjs`, then open <http://127.0.0.1:8765/games/animal-rescue-train/> or launch 動物救援列車 from <http://127.0.0.1:8765/>. The server binds only to 127.0.0.1. Set `PORT` to choose another port. No save storage is written: reload starts at level 1. Route checkmarks track completions during the current page session, including a win subsequently undone.

## Verification

- `node --test` — 8 engine/solvability tests.
- `node tools/verify-animal-rescue-train.cjs` — exact search plus independent certificate replay for all five levels (6, 9, 12, 18, 24 boarding moves).
- With Playwright installed or available through `NODE_PATH`, run `node tools/verify-animal-rescue-train-browser.cjs`. Set `RESCUE_BROWSER_CHANNEL=chrome` to use an installed Chrome; otherwise uses Playwright's bundled Chromium. Set `RESCUE_TEST_ORIGIN` if using a different loopback port. Tests perform actual DOM clicks/taps, not direct state manipulation.

Latest local verification: **PASS**, 8 tests and 75 browser checks using Chrome. Touch uses Chromium emulation; physical iPad Safari is **NOT VERIFIED**. The hub's pre-existing CDN dependency is disabled during isolated iframe integration tests; the new standalone game has no external requests.

Evidence: [`solutions.json`](../../artifacts/animal-rescue-train/solutions.json), [`browser-results.json`](../../artifacts/animal-rescue-train/browser-results.json), and desktop/mobile/failure/win/iframe PNGs in that directory.

## Publication

Publication was authorized after completion of the local prototype. GitHub source publication contains the game, tests and verification evidence. A Cloudflare Pages workflow was prepared locally, but the current GitHub token lacks permission to publish workflow files. Cloudflare deployment awaits Wrangler authentication or updated GitHub workflow permission. No credentials are committed.

The release is prepared from GitHub main in an isolated worktree so unrelated pre-existing local edits remain intact. The current UI retains its prototype label and has no score submission or leaderboard. Only `index.html`, `assets/`, and game runtime files should be published to the existing Pages project `toenow`; exclude documentation, verification artifacts, tests, tools and Git metadata. Expected production game address: <https://toenow.pages.dev/games/animal-rescue-train/>; successful deployment and live checks are required to confirm publication.
