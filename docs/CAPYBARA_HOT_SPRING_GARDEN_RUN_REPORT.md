# Capybara Hot Spring Garden — local replacement, 2026-10-29

The existing `games/capybara-drift/` route now loads an open-ended garden instead of the river runtime. Player-facing name is Capybara Hot Spring Garden / 水豚溫泉花園. It remains Carefree Island, category relax, leaderboard false.

Start with seven connected water patches, bamboo spout, flowers, stones, lantern, floating fruit and a visitor. Swim with pointer/touch or arrows. Select six free building materials, add with taps/drag/Enter, remove, undo/redo, and zoom. Adjacency derives bridges, bamboo spouts, cascades and groves. Animals prefer suitable plants/structures. Visits vary palettes and visitors. Store metadata postcards with small reconstructed album illustrations. Pause, restart, finish, return title and exit work through the existing SDK and shared-screen integration.

## Data protection

New key `capybara_hot_spring_garden_v1`. Maximum 240 cells, 24 postcards and 40 undo snapshots; undo is memory-only. Storage structures are sanitized, duplicate cells removed and malformed/blocked storage handled. Legacy river data is never written: only recognized owned float IDs/equipped cosmetic are imported when creating a new profile. Wallet, receipts, active journey and best records remain untouched. Preview uses isolated defaults and does not import or save. SDK and Hub exclude relaxing visits from competitive record writes. Restart reloads the garden without clearing its collection/album. Layout reset requires an explicit dialog confirmation.

## Files changed for this task

- `games/capybara-drift/index.html`: new runtime entry and accessible UI containers.
- `games/capybara-drift/garden-model.js`: pure durable model and persistence.
- `games/capybara-drift/garden-renderer.js`: canvas view, coordinate mapping, reactions.
- `games/capybara-drift/garden-main.js`: inputs, lifecycle, dialogs, audio, album.
- `games/capybara-drift/garden.css`: responsive garden UI.
- `shared/toenow-screen-config.js`: data-only garden screen configuration.
- `shared/toenow-screens.js`: reusable visit presentation, summary and sharing.
- `shared/toenow-i18n-games-b.js`: English/Traditional Chinese catalog additions.
- `shared/toenow-sdk.js`: relax visits do not save competitive best records.
- `index.html`: renamed Hub entry, preview and relax settlement guard.
- `assets/capybara-hot-spring-garden-preview.png`: actual runtime preview.
- `tests/capybara-garden.test.cjs`: model/persistence tests.
- `tests/games-runtime.test.cjs`: open-ended garden contract; actual browser runtime covered separately.
- `tests/practice-mode.test.cjs`: garden preview contract.
- `tests/toenow-screens.test.cjs`: shared visit presentation and safe summary text.
- `tools/verify-hot-spring-garden.cjs`: real standalone and Hub flows.
- `tools/verify-shared-screens-browser.cjs`: shared relaxed-visit regression.
- `package.json`: garden unit suite runs in npm pretest.
- `docs/superpowers/plans/2026-10-29-hot-spring-garden.md`: implementation plan.
- This report and screenshots under `artifacts/hot-spring-garden/`.

Existing river source modules/tests remain as legacy compatibility evidence; the page no longer loads the river engine, main, stylesheet or route projection. Canonical source/runtime capybara art and original preview are preserved. Existing unrelated worktree modifications were not discarded. Nothing committed, pushed or deployed.

## Verification executed

Node 20.17.0; Playwright from the bundled primary runtime, Microsoft Edge headless.

`npm test`: PASS 7 new garden tests in pretest, 258 existing tests.

`node --test tests/capybara-garden.test.cjs`: PASS 7.

With `NODE_PATH=C:\Users\HsinYuChen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules` and `TOENOW_TEST_URL=http://127.0.0.1:8765`:

- `node tools/verify-hot-spring-garden.cjs`: PASS 10 EN/zh-Hant cases at 1100×850, 390×844, 320×568, 1024×768, 844×390; building, undo/redo, touch, keyboard, postcards, pause, finish, replay, title, preview and legacy byte checks. PASS actual Hub launch, pause/resume, postcard, finish, replay and exit.
- `node tools/verify-shared-screens-browser.cjs`: PASS 40 standalone, 10 iframe, 10 practice cases across all games.
- `node tools/verify-island-browser.cjs`: PASS 10 responsive/language combinations, map states, launch, normal/practice finish and reload.
- Built 59 cells through real keyboard/tool event listeners; inspected starter, mature, phone and Hub screenshots.

| Area | Result |
|---|---|
| Standalone | PASS |
| Hub iframe | PASS |
| Preview isolation | PASS |
| Persistence / legacy protection | PASS |
| English / Traditional Chinese | PASS |
| Responsive browser emulation | PASS |
| Physical iPad Safari | NOT VERIFIED |

## Remaining limitations

This is a playable canvas implementation with simpler graphics than the generated concept artwork. Visitors and tool icons use emoji placeholders. Procedural features are adjacency-based 2D illustrations, without a full multi-height terrain/physics simulation. Floating fruit can be nudged; the broader catalog of physical bath toys, hats/towels, draggable arbitrary decorations, complex animal interaction chains and fine camera composition from the aspirational brief is not implemented. The album stores scene metadata and reconstructs illustrations, not image blobs. No physical touchscreen or audio-hardware listening test was performed.
