# Capybara touch navigation and restorable postcards

Implemented locally on 2026-10-30. No commit, push, or deployment performed.

## Player behavior

- Two fingers pinch to zoom around their midpoint; two-finger movement also pans. Zoom buttons remain available (0.5–3x).
- Move map toggles single-finger/mouse dragging. Center map resets zoom and position. Selecting a building material exits move mode; keyboard arrows also move the map while move mode is enabled.
- Touch building uses taps, committed on release, so the first finger of a pinch cannot place a piece. Mouse painting remains available. Cancelled touches and the last remaining finger after a pinch do not build.
- Postcard album thumbnails open a larger view with Continue from here and Back to album.
- Continue restores the saved layout, palette, visitors, and equipped float. Current collections stay intact. The previous garden is saved as another postcard first. The selected postcard remains available, including when restoring the oldest card in a full album.
- Existing schema/key and old postcards remain readable. Storage remains local to the same browser/device. The existing 24-postcard limit still applies; a full album discards the oldest other card when adding the backup.
- Failed postcard/restore writes do not claim success or replace the active garden. Preview remains temporary and never writes durable progress.

## Verification

- PASS: `npm test` — 9 garden pretests plus 258 suite tests. Focused garden tests rerun after the full-album detached-card fix: 9/9.
- PASS: `node tools/verify-garden-touch-postcards.cjs` — Chromium CDP touch input at 1024×768 EN, 390×844 ZH, 320×568 EN, 844×390 EN; pinch both ways, cancellation, pan without building, tap coordinates, reload, enlarged postcard, back-to-album, restore, backup, quota-failure rollback, preview isolation, and Hub iframe restore/exit.
- PASS: `node tools/verify-hot-spring-garden.cjs` — 10 bilingual responsive cases plus actual Hub iframe lifecycle.
- PASS: `node tools/verify-garden-pixi.cjs` — renderer, building, pause freeze, album GPU-context reuse, resizing, asset-failure retry.
- PASS: `node tools/verify-shared-screens-browser.cjs` — 40 standalone, 10 iframe, 10 practice cases.
- PASS: syntax and scoped whitespace checks; visually inspected phone portrait, narrow phone, landscape and postcard detail screenshots.
- NOT VERIFIED: physical iPad/iPhone Safari and real-device gesture feel. Browser viewport and synthetic touch checks do not prove those.

Browser checks use Node 20, bundled Playwright, headless Microsoft Edge, `NODE_PATH=C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`, and `TOENOW_TEST_URL=http://127.0.0.1:8765`.

Logs and screenshots: `artifacts/garden-touch-postcards/`.
