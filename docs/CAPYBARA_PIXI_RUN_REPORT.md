# Capybara Hot Spring Garden — illustrated PixiJS renderer

Implemented locally on 2026-10-29 after approval of the smooth illustrated reference. No commit, push, or deployment.

## Result

The existing `games/capybara-drift/` route now renders through a locally pinned PixiJS 8.22.0 WebGL application. Generated transparent sprites provide the capybara, scenery, and animal visitors. Connected water uses a masked illustrated texture, moving caustics, ripples, steam, and bamboo streams aimed toward adjacent water. Terrain and scenery are retained between edits; the existing controller owns the only animation clock. Short landscape layouts place utility controls at the sides to give the garden more space.

The model, storage key and existing saved layouts are unchanged. Building, removal, undo/redo, zoom, preview, visitors, cosmetics, collection, postcards, shared title/visit screens and Hub exit remain connected. The original `garden-renderer.js` is preserved as legacy source but is no longer loaded. Canonical earlier capybara art remains untouched.

Album thumbnails use temporary scenes and render textures in the existing GPU renderer, then copy to plain 2D canvases. They do not allocate additional WebGL contexts. Failed image loading exposes a translated retry button without writing a garden save. The title remains hidden until initialization completes. Exit releases the renderer and cancels the controller's animation request.

## Files

- `games/capybara-drift/garden-pixi-renderer.js`: Pixi scene, projection, animation, texture framing, thumbnails and teardown.
- `games/capybara-drift/index.html`: local Pixi/script loading and loading-status container.
- `games/capybara-drift/garden-main.js`: asynchronous initialization, error recovery, thumbnail reuse and cleanup.
- `games/capybara-drift/garden.css`: illustrated backdrop, loading state, thumbnail sizing and landscape control layout.
- `shared/toenow-i18n-games-b.js`: three additional loading/retry messages. Preexisting unrelated catalog edits are preserved.
- `assets/capybara-garden/illustrated-atlas.png`, `water.png`, `sources/approved-reference.png`: project-local generated assets and approved reference.
- `assets/capybara-garden/PROVENANCE.md`: full production prompts, generation mode and source provenance.
- `assets/vendor/pixi/pixi-8.22.0.min.js`, `LICENSE`, `README.md`: pinned local browser distribution and MIT license. Bundle SHA256: `06D9EF9823E743518793083C296D801E752DB128CB1F519FBABE37E1259567EA`.
- `tools/verify-garden-pixi.cjs`: real-browser migration and resource regression checks.

## Verification

Node 20.17.0, bundled Playwright and Microsoft Edge headless. Set `NODE_PATH=C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules` and `TOENOW_TEST_URL=http://127.0.0.1:8765` for browser commands.

| Check | Result |
|---|---|
| `npm test` | PASS: 7 garden model tests plus 258 suite tests |
| `node tools/verify-garden-pixi.cjs` | PASS: real WebGL, building, undo/redo, frozen pause, illustrated thumbnails, repeated album context reuse, resize, far-coordinate/zoom projection, failed-load retry and storage protection |
| `node tools/verify-hot-spring-garden.cjs` | PASS: 10 English/Traditional Chinese size combinations plus real Hub iframe lifecycle |
| `node tools/verify-shared-screens-browser.cjs` | PASS: 40 standalone, 10 iframe, 10 practice cases |
| Syntax and `git diff --check` | PASS |
| Desktop, phone, short landscape, mature garden visual inspection | PASS |
| Physical iPad Safari / real touchscreen | NOT VERIFIED |

Logs and screenshots are under `artifacts/garden-pixi/`. Garden flow screenshots are under `artifacts/hot-spring-garden/`. The matrix includes 1100×850, 390×844, 320×568, 1024×768, and 844×390; controls and rendering after the final landscape adjustment are additionally covered by the Pixi browser check.

The initial test failed against the old renderer because PixiJS was absent. Screenshot inspection exposed an initial 800×600 inline canvas-size override; a failing viewport regression pinned it, and disabling automatic inline CSS sizing fixed it. The asset-failure test also exposed title-screen interception of the retry button; keeping the title hidden during initialization fixed that. Both regressions pass now. A separate read-only review found no blocking issue; its suggestion to assert actual postcard image content was incorporated.

## Practical boundaries

This is an editable sprite-based interpretation of the approved concept, not a pixel-identical static background. Terrain remains the existing flat axial garden model; it does not add multi-height physics or a new toy system. Source art uses one pose per animal with position/bobbing animation. The local preview requires WebGL; initialization failure offers retry rather than silently presenting the old renderer. No physical iPad Safari, audio-hardware, or long-running device performance claim is made.

Local preview: http://127.0.0.1:8765/games/capybara-drift/
