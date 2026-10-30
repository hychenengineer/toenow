# Carefree Farm Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task.

**Goal:** Build the approved single-player Carefree Farm with fixed crop plots, a pasture tab, baby animals, offline growth and surprises.
**Architecture:** A deterministic, browser/Node model owns inventory, timestamps and transactions. A DOM controller renders two tabs and integrates the existing SDK and shared visit screens. An isolated versioned save never changes other games.
**Tech Stack:** Vanilla JavaScript, CSS, generated illustrated assets, Node tests and Playwright.
**Spec:** The approved conversation and two-panel reference: 無憂農場 / Carefree Farm, one baby sheep initially, crops feed animals, purchases expand both crops and animals, offline timers, eventual multiplayer is out of scope.

## Constraints and decisions
- Preserve all existing uncommitted work. Initial implementation remained local; the subsequent explicit user request authorizes a scoped commit/push to preview only, with the farm below the hot spring.
- Reuse shared visit presentation for a persistent relaxing farm; no competitive levels or forced game over.
- User refinement: five farm development stages unlock 3/6/9/12/15 plots and 1/2/3/5/8 animal spaces. These are persistent farm milestones, not cognitive difficulty levels.
- Twelve crops, five species: sheep, pig, cow, alpaca, llama. Before stage 5 welcome one of each species; stage 5 permits duplicates. This avoids filling early capacity with duplicates and blocking the next species milestone.
- Next-stage requirements (harvests / varieties / species / adults / coins): stage 2 = 4/1/1/1/25; stage 3 = 12/3/2/1/60; stage 4 = 24/5/3/2/100; stage 5 = 40/7/4/3/160.
- Free grass planting guarantees recovery from zero coins. Other seeds cost coins, harvests may be fed or sold.
- Feeding starts one timestamped growth/production cycle. No starvation, decay or unlimited offline production. Surprise gifts persist until claimed.
- Preview mode uses a separate in-memory farm and writes no progress or records.
- Saved in this browser only. Multiple tabs read latest saved progress before each action.
- Failed writes preserve normal in-memory progress across preview visits. If a newer saved snapshot appears during a failed-write session, that temporary session cannot overwrite it.

## Review focus
- Reloading after long absences settles each animal cycle exactly once.
- Rapid repeated clicks cannot duplicate money, gifts or purchases.
- Zero coins and zero inventory always leave free grass planting available.
- Invalid/future-format saves and storage failures do not silently overwrite existing data.
- Preview, restart and Hub pause/resume preserve normal progress.

### Task 1: Model and persistence
- [x] Write and run failing `tests/carefree-farm.test.cjs` for offline crops, baby maturation, all species, gifts, economy, malformed saves and preview isolation.
- [x] Implement `games/carefree-farm/model.js`: `create`, `advance`, `act`, `load`, `save`, catalog constants.
- [x] Run `node --test tests/carefree-farm.test.cjs` and inspect results.

### Task 2: Illustrated UI and integration
- [x] Create `games/carefree-farm/index.html`, `style.css`, `main.js`, illustrated animal assets and preserve reference.
- [x] Add game configuration, storage registration, bilingual copy, shared visit text options and Hub entry.
- [x] Cover farm in runtime, practice and shared-screen tests; use existing visit browser lifecycle.

### Task 3: Verify and inspect
- [x] Run `npm test`, shared-screen browser regression, and farm-specific real browser actions at desktop/phone sizes and both languages.
- [x] Test standalone/iframe, offline reload, gifts, buying, selling, preview isolation and storage errors.
- [x] Inspect screenshots, fix important issues, request fresh code review, leave local preview and report limitations.
