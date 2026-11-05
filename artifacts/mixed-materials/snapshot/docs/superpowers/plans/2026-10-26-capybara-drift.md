# Capybara Drift Implementation Plan

**Goal:** Deliver the approved endless relaxing river game, playable standalone and from the Hub.
**Architecture:** Pure deterministic simulation and persistence helpers in engine.js; canvas scenery and input/lifecycle in main.js. Shared SDK, localization, practice picker and ToenowScreens retain ownership of common services.
**Tech Stack:** Vanilla JavaScript, Canvas 2D, Node tests, Playwright / Edge.
**Spec:** Approved conversation: drag to drift, collect bubbles/yuzu/petals/friends, no time limit or penalties, changing scenery, rest/resume, cumulative points and cosmetics.

## Constraints
Preserve existing dirty files and saves; no commit or deployment. Keep the ten existing island locations intact. Add a separate Carefree entry on the Hub. All title/results use the shared renderer; practice writes no progress. Stage is a journey segment, never an increase in speed.

## Review Focus
Reload mid-run without duplicate wallet credit; practice cannot affect wallet or records; storage unavailable remains playable; background tabs freeze the simulation; pointer cancel/resizing cannot trap steering.

- [x] Write and run failing simulation/persistence tests.
- [x] Implement bounded endless simulation, checkpoints, wallet and cosmetic ownership.
- [x] Build responsive river canvas, original capybara art, pointer/keyboard input, sound, rest and wardrobe.
- [x] Register keys, shared screen config, bilingual copy, preview, Hub entry and test coverage.
- [x] Run npm test and shared-screen browser regression, inspect desktop/mobile gameplay, fix and retest.

Ruling: Work in the existing checkout to retain the user's current uncommitted Hub work. No commits, worktree moves or deployments.
Ruling: Register a separate always-available Carefree Hub entry; retain the ten-location Explorers route and leaderboard requirements.
Ruling: This playable prototype has four float cosmetics and original editable vector/canvas art. A complete Carefree map, purchasable hats and island habitat progression are future additions, not implemented here.
