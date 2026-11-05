# Illustrated hot spring with PixiJS

> Execute inline using executing-plans. Approval: user approved the smooth illustrated reference and PixiJS implementation in this conversation.

**Goal:** Replace the garden's simple Canvas illustration with an animated, illustrated PixiJS scene while preserving editable cells, saves, visitors, controls, and shared screens.

**Architecture:** Keep `garden-model.js` unchanged. A retained PixiJS scene draws connected water and terrain, with generated transparent sprites for scenery and animals. Rebuild static layers only when cells or palette change; animate sprites, ripples and steam with the existing controller clock. One renderer also produces album thumbnails, avoiding one WebGL context per card.

**Tech stack:** Pinned, local PixiJS 8.22.0 browser bundle, JavaScript, generated PNG atlas, existing Node/Edge Playwright tooling.

**Spec:** Approved smooth concept in this conversation, copied to `assets/capybara-garden/sources/approved-reference.png`.

## Constraints and review focus

- Preserve all existing saves and source art; no commits, pushes, or deployment.
- Preserve shared title/visit screens and bilingual standalone/Hub flows.
- Keep input projection correct after resize, zoom, and distant additions.
- Pause and reduced-motion must stop decorative motion; don't add a second ticker.
- Album generation must not create extra GPU contexts or leak textures.
- Loading failure must expose retry; page exit must release resources.
- Old storage and preview isolation remain byte-for-byte protected.

## Tasks

- [x] Add `tools/verify-garden-pixi.cjs`: assert live WebGL rendering, illustrated texture loading, point/input agreement, edit/undo/redo, pause, resize, album context reuse and failure recovery. Run against old renderer and observe missing Pixi runtime.
- [x] Add pinned bundle/license under `assets/vendor/pixi/`, atlas and source provenance under `assets/capybara-garden/`.
- [x] Replace the loaded renderer with `garden-pixi-renderer.js`: retained Pixi scene, geometry mapping, sprite layers, water effects, and thumbnail extraction. Preserve the controller-facing methods/properties and keep old renderer source.
- [x] Adapt `garden-main.js` for async readiness, shared-renderer thumbnails, loading/error states and cleanup. Keep the model and shared screen structure unchanged.
- [x] Run targeted browser checks, `npm test`, garden standalone/Hub matrix and shared-screen regression. Inspect desktop, phone, landscape and mature garden screenshots. Fix and rerun relevant checks.
- [x] Record results, limitations, exact asset generation prompt and dependency provenance in `docs/CAPYBARA_PIXI_RUN_REPORT.md`.

## Execution notes

Ruling: work in the current workspace because the existing garden implementation is untracked and depends on other existing edits. An isolated HEAD checkout would omit that foundation. Limit changes to this renderer and its integration.
Ruling: use a locally vendored pinned browser distribution, matching the project's static no-build deployment and avoiding a runtime CDN dependency.
