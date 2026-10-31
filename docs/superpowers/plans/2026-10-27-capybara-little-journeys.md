# Capybara little journeys implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for separated engine, shared-screen and presentation tasks.

**Goal:** A relaxing 90-second automatically arranged river trip with meaningful collectibles, friends, weather, and at most one shared building resource.
**Architecture:** Keep deterministic, serializable trip mechanics in engine.js; canvas and pointer effects in main.js; all title/result rendering in ToenowScreens with a configuration-driven journey variant. Extend the existing materials ledger with idempotent drift receipts.
**Tech Stack:** Vanilla JS, canvas, existing shared SDK, Node tests and configured Playwright/Edge.
**Spec:** Approved conversation in this chat (2026-10-27).

## Global Constraints
Preserve all existing dirty/untracked work and saves; no commits or publication. User specifically overrides level/rank UI for this relax game; other games retain shared four-stat screens. Practice never persists anything. Each journey lasts 90 seconds of active play. Resume keeps exactly the same itinerary and pickups. Materials <=1 per trip across reloads. Touch and mouse remain supported; EN and zh-Hant.

## Review Focus
- Resume after reward write but before checkpoint: receipt must prevent duplicate materials.
- Background/pause: freeze timer and effects; early shore does not grant unseen items.
- Legacy/corrupt storage: preserve old wallet/cosmetics safely.
- Small mobile/short landscape: overlays scroll and controls remain reachable.
- Repeat journeys: avoid recently used combinations without inventing difficulty.

### Task 1: engine and building material integration
- [x] Add behavioral tests for timer, varied/coherent trips, collected inventory, practice, resume and idempotent material reward; observe failures.
- [x] Implement serializable itinerary, bounded pickup spawning, collection ledger and one-resource receipt in engine.js/shared/toenow-materials.js.
- [x] Run focused Node tests and report API contract to presentation implementer.

### Task 2: shared travel screens
- [x] Add tests for journey variant with no levels/waves, actual inventory summary and three shared actions; observe failures.
- [x] Extend shared screen config/library and catalogs for journey mode, leaving cognitive screen markup intact.
- [x] Run shared screen/i18n tests; document updateGameOver journey payload.

### Task 3: relaxing river presentation and verification
- [x] Integrate engine trip clock, automatic landing, collection book and friends/events, safe shared materials.
- [x] Add smooth palette changes, scenery identities, gentle rain/night/storm, pointer ripples and wakes; update mobile layout and bilingual copy.
- [x] Run npm test and browser regression; inspect real screenshots, lifecycle, touch drag, EN/ZH, practice, resume, iframe, repeat play and material cap. Fix and rerun failures.
