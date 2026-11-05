# Animal Siege Expedition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Extend the approved battle prototype into a single run with exploration, three forts, recruitment, upgrades and persistent casualties after defeat or retreat.

**Architecture:** Keep battle rules in `engine.js`; introduce a DOM-free `campaign.js` for the run economy, map discoveries, defenders and army health. The controller switches between map/base and battles. Only the final expedition outcome settles SDK records; shared title/result screens remain the sole screen templates.

**Tech Stack:** Existing vanilla JavaScript, HTML/CSS, Node test runner and configured Playwright/Edge.

**Spec:** Approved conversation: use existing island animals; counter-based victories with smaller armies; one-session expedition; retain losses, remaining resources and captured forts after a failed siege. Repository constraints are in `AGENTS.md`.

## Global Constraints

- Use the original Beaver, Fox and Squirrel character assets.
- Practice never updates best-score or best-wave records.
- Use ToenowScreens for all title and final game-over UI; do not copy templates.
- Preserve the existing Explorers route and other uncommitted workspace changes.
- Run `npm test` and shared-screen browser regression. Verify real campaign lifecycle separately.

## Decisions

- Enemy casualties persist along with player casualties. Rewards are granted once per captured fort.
- Two outer forts can be attempted in either order; capturing both opens the final fort.
- Gold recruits units; wood buys one distinct upgrade per species (Beaver damage reduction, Fox movement, Squirrel range).
- Retain exact stack HP, including wounded survivors; recruitment adds HP for new units without healing existing wounds.
- One-time hidden sites provide gold/wood or a choice of reinforcements. A wiped army can recover if a legal recruitment or unclaimed resource/reinforcement remains.
- Retain the original single-battle mode at `?mode=battle` for playtesting and existing regression coverage.
- Ruling: work in the current checkout and touch only the prototype and narrow integration hooks. Its approved source is still untracked among extensive pre-existing changes; a HEAD-based worktree would omit that source. No commits, pushes or branch changes.

## Review Focus

- Retreat, defeat and duplicate settlement must not restore HP or duplicate rewards.
- Recruitment must reject invalid amounts, insufficient gold and use during battle.
- All army-loss recovery paths must agree with expedition defeat detection.
- Upgrades must affect legal movement/attacks and displayed previews, without changing enemy units or global stats.
- Practice, title, pause, restart and iframe controls must cancel obsolete enemy callbacks.

### Task 1: Campaign state and battle upgrades

**Files:** create `games/animal-siege/campaign.js`, `tests/animal-siege-campaign.test.cjs`; modify `engine.js`, `package.json`.

**Interfaces:** `AnimalExpedition.create(wave)`, `explore(run,id)`, `claim(run,id,choice)`, `recruit(run,kind,amount)`, `upgrade(run,kind)`, `beginBattle(run,id)`, `completeBattle(run,battle)`, `canRecover(run)`, `score(run)`. Battle engine exposes `stats(unit)` and accepts trained player units via campaign setup.

- [x] Write and run failing tests for economy, persistent HP, retreat, one-time rewards, fort unlocks, recovery and upgraded legal actions.
- [x] Implement the pure model and unit-specific battle stats.
- [x] Run focused engine/campaign tests; retain the existing legal 15-vs-19 victory fixture.

### Task 2: Playable map/base and lifecycle

**Files:** modify `index.html`, `main.js`, `style.css` inside `games/animal-siege`; update the shared screen configuration and bilingual catalog entries.

- [x] Add an illustrated map using existing habitats/characters, scouting panels, one-time discoveries, army/resources and base recruitment/upgrades.
- [x] Start normal and practice runs on the expedition map. Preserve skirmish mode explicitly.
- [x] Connect scouting, battle, retreat, casualty settlement, recovery, final victory/defeat and shared result actions.
- [x] Protect pending enemy turns on pause, title, retreat and restart; show resources and surviving squads after each siege.

### Task 3: Runtime evidence and review

**Files:** create `tools/verify-animal-expedition-browser.cjs`; update existing battle and shared-screen test adapters.

- [x] Drive real map interactions, recruiting, upgrades, retreat, failure/recovery, victories and final SDK settlement in the browser; exercise practice and iframe.
- [x] Verify EN/Traditional Chinese at desktop and mobile widths and save screenshots.
- [x] Run `npm test`, skirmish regression and shared-screen browser regression; inspect screenshots and scoped diff.
- [x] Perform one final read-only review, address consequential findings, and deliver the working local preview.

## Execution ledger

- Initial inspection: existing battle prototype and live local server found; original source is untracked on `codex/island-explorer`. Existing unrelated changes will be retained.

- Completed: campaign model, map/base UI and lifecycle. Engine/campaign checks pass, including persistent wounded HP, one-time rewards, final-fort gating, retreat and wipe recovery.
- Verification: npm test 298/298; legal three-fort normal and practice completion in 1280/ZH, 390/ZH, 390/EN; final score 1025. Fresh desktop run also verifies accessible recruitment labels and live EN/ZH victory/defeat banners. Original skirmish regression and actual Hub iframe entry/exit pass.
- Shared-screen regression: 48 standalone, 12 iframe, 12 practice cases pass across the current suite. Scoped whitespace check passes. Physical mobile devices are not verified.
- One read-only reviewer found outcome localization and non-distinct accessible button labels; both were corrected and verified. No commits, pushes or branch changes were made.
