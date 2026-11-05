# Illustrated Island Buildings Implementation Plan

> Use superpowers:executing-plans in this chat, with one fresh final review.

**Goal:** Replace all ten vector map landmarks with fifty original illustrated building assets: five consistent growth stages for each location, in the approved painterly isometric style.

**Architecture:** Generate a finished Level 5 reference for each landmark, then derive four lower stages while preserving camera, lighting, proportions and identity. Preserve PNG source art and serve efficient WebP copies. The existing progress/preview/dialog adapter selects each actual image; no game mechanics or record changes.

**Approved reference:** `exec-5a6b4c80-311f-444c-a764-08cbdf502a60.png` in this chat's generated-image directory. User approved its detail level and explicitly requested all ten locations with five levels.

## Constraints and review focus

- Ten locations, fifty genuinely distinct illustrations; no simulated growth by recoloring/scaling a single image.
- Stage 1 has a small recognizable main structure; stage 2 completes roofing/frames; stage 3 adds a functional annex/device; stage 4 adds landscaping; stage 5 is the complete landmark.
- Consistent isometric view, canvas anchoring and identity across each five-image set.
- Transparent surroundings and soft contact shadows; no baked labels or UI.
- Preserve all PNG sources, generated-image originals, prompts and provenance. Save project assets under `assets/island-buildings/`.
- No game rules, five-tier mapping, normal records, practice isolation, localization or theme preferences change.
- Missing/corrupt art must not prevent launching a game; maintain a vector fallback.
- Check actual browser-loaded art, all five preview states, narrow layouts, hit-target spacing and normal/practice behavior.

## Tasks

- [x] Generate a five-stage observatory set and inspect style/identity/alpha before scaling production.
- [x] Generate the other nine five-stage sets; record every exact prompt and source path.
- [x] Validate fifty source PNGs; create WebP runtime copies and a manifest using a reproducible packaging tool.
- [x] Add failing asset-selection/coverage tests, implement the image renderer with fallback, and adapt browser assertions to real images.
- [x] Inspect a fifty-image gallery and map/detail screenshots; repair defective assets or layout.
- [x] Run npm test, island browser regression and independent code review; record actual results.

## Execution ledger

- Work continues in `codex/island-explorer`, preserving this chat's prior uncommitted map/theme work. No commits, pushes or public deployment.
- Generation uses the built-in image_gen tool; each building/stage receives its own generation/edit request. Runtime format conversion preserves the original generated PNG artwork.

## Verification results

- 50 distinct transparent source PNGs and 50 WebP runtime copies; SHA-256/provenance/dimensions/alpha independently audited. Sources: 97,557,123 bytes; runtime: 6,437,078 bytes (93.4% reduction).
- All fifty stages visually inspected in `artifacts/island-building-art/all-stages.png`; map, desktop dialog and mobile dialog screenshots inspected. Lighthouse and greenhouse Level 1 annex regressions repaired; earlier originals/provenance preserved under `sources/superseded/`.
- `npm test`: PASS, 100 tests, zero failures (`artifacts/island-building-art/npm-test.log`).
- `node tools/verify-island-browser.cjs`: PASS, 30 responsive/theme/language combinations, all 50 runtime images decoded, five preview stages, all ten locations, actual game launch, normal/practice finish, storage/reload, category/list switching, keyboard/dialog and missing-art fallback (`artifacts/island-explorer/results.json`).
- Fresh independent review: no remaining actionable findings after two art fixes. All source/provenance/runtime hashes and nine focused tests PASS.
- Physical iPad/Safari: NOT VERIFIED. Browser evidence uses desktop Edge and simulated viewport widths.
- Artwork generated/edited through built-in image_gen; exact prompt/reference/source provenance saved alongside each original. Packaging script performs only alpha-preserving resize/WebP encoding, with unchanged-source hash caching.
