# Carefree Farm — playable first version

Local preview: http://127.0.0.1:8774/games/carefree-farm/

## Implemented
- Fixed farm plots and a separate pasture tab; direct mouse/touch interaction.
- One baby sheep initially; pig, cow, alpaca and llama purchased later.
- Twelve illustrated crops; planting, offline growth, harvesting, feeding and selling.
- Three completed meals grow a baby into an adult. Adults produce after each feeding cycle. Favorite food shortens the cycle and doubles adult yield.
- Distinct persistent gifts for each species. Crop gifts can unlock seeds early.
- Five milestone stages: 3/6/9/12/15 plots; 1/2/3/5/8 animal capacity. Harvest counts, crop varieties, animal species, adults and coins gate each upgrade.
- Stages 1–4 welcome distinct species first; stage 5 permits duplicates without blocking earlier progression.
- Offline settlement is timestamp-based and idempotent; no spoiled crops, starvation or runaway production.
- Isolated browser save, preview without writes, existing-save protection, failed-write session retention and cross-tab conflict protection.
- Shared SDK and shared title/visit-result renderer, English/Traditional Chinese and separate always-available Carefree Hub entry.

## Original development workspace verification — 2026-10-30
- PASS `npm test`: 9 pretests + 268 main tests.
- PASS farm real-browser checks: 14 groups, zero page errors; desktop/mobile, both languages, offline reload, gifts, milestone upgrade, all 12 crops, purchases to capacity, preview, malformed save and Hub iframe lifecycle.
- PASS storage regressions: retain unsaved normal farm across preview; prevent recovery from overwriting another tab's newer progress.
- PASS shared-screen regression: 44 standalone, 11 iframe, 11 practice scenarios.
- PASS progression simulation: every stage reached from a fresh farm using only legal game actions.
- PASS fresh code review: two significant storage findings reproduced with failing browser tests and fixed; both regression tests pass.
- PASS focused diff whitespace check.
- NOT VERIFIED on a physical iPad/Safari; browser checks used Chromium/Edge.

Logs: `artifacts/carefree-farm-*.log`. Screenshots and browser results: `artifacts/carefree-farm/`.

## Boundaries
This is a playable first version, not a published release. Progress is saved in this browser; multiplayer/cloud saves are not implemented. Offline time follows the device clock. Growth currently changes size/status, using the same illustrated character rather than a separate adult animation set. Later-game screenshots use a validation fixture to show unlocked capacity; the player starts at stage 1.

The initial local build did not commit, push or deploy. A subsequent user request authorized publication to GitHub preview, with the farm entrance directly below Capybara Hot Spring Garden. See CAREFREE_FARM_PREVIEW_PUBLICATION.md for publication-snapshot validation. Existing garden saves and other local work were preserved.
