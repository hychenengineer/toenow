# Island Explorer Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Make the Hub an interactive exploration island with one location per existing game and five visual states mapped to the shared five difficulty levels.

**Architecture:** A browser/Node compatible island module owns location configuration, read-only progress derivation and map UI. The existing Hub owns launching games and validating/saving score reports. Refresh the map through existing Hub renders and storage events; do not add a second game-result listener or duplicate game screens.

**Tech Stack:** Vanilla JavaScript, native dialog, HTML/CSS, SVG landmarks, an original generated terrain illustration, Node test runner, Playwright/Edge.

**Spec:** User request in this chat: build the island now; each game has a place; each place has five states corresponding to Levels 1–5.

## Global Constraints

- Preserve existing SDK order, game mechanics, scores, practice isolation, shared ToenowScreens, local-first behavior, EN/Traditional Chinese and all three Hub themes.
- Ten registered games have ten uniquely named locations and five inspectable landmark appearances.
- States represent highest difficulty reached, not completion of an entire tier. Fresh locations use state 1 and an unexplored label.
- A clearly labelled visual-only preview may show Levels 1–5 but never writes score/progress keys or starts a practice level.
- Remain in the active checkout to preserve this chat's uncommitted theme work and existing local preview. No automatic commit, push or deployment.
- Daily quests and achievements remain outside this first island implementation.

## Review Focus

- Existing canonical per-game records can be higher than aggregate Hub records: take the highest valid wave.
- Corrupt/missing/unavailable storage and invalid numeric data must not crash the map or manufacture mastery.
- Switching language, theme, category, or preview preserves the selected location and real progress.
- A practice/invalid game report must not change island progress; normal validated reports refresh the map.
- Touch-sized location buttons, keyboard selection, dialog close/focus and narrow viewport reachability.

## Tasks

### Task 1: Location registry and progress

Files: `shared/toenow-island.js`, `tests/toenow-island.test.cjs`, `package.json`.

- [x] Write and run failing tests for ten unique game locations, five wave boundaries, invalid storage, highest record selection and read-only behavior.
- [x] Implement `getProgress(gameId, storage, levels)` and `LOCATIONS` with Node/browser exports.
- [x] Run focused tests and include them in npm test.

### Task 2: Interactive map and Hub adapter

Files: `assets/toenow-island-terrain.png`, `assets/toenow-island.css`, `shared/toenow-island.js`, `index.html`, `shared/toenow-i18n-core.js`.

- [x] Generate/copy the original terrain asset; render code-native landmarks with five additive visual stages.
- [x] Mount using `{host, listHost, games, levels, openGame}`; add map/list controls, category filtering, persistent view preference and visual-only state preview.
- [x] Add a location detail dialog with actual game title, real progress, five milestones and an action using the existing game launcher.
- [x] Refresh through existing renderBentoGrid and storage events; translate new text using the existing catalog and language-change event.

### Task 3: Verification and inspection

File: `tools/verify-island-browser.cjs`, evidence in `artifacts/island-explorer/`.

- [x] Browser-check ten locations, all five appearances, three themes, EN/ZH, keyboard/dialog, desktop/mobile widths and map/list navigation.
- [x] Exercise real iframe launch/close, normal result persistence, practice exclusion, standalone record reconciliation, reload and unavailable storage behavior.
- [x] Inspect screenshots, fix issues and retest. Run npm test and the applicable existing Hub/shared-screen regressions.
- [x] Have one fresh reviewer inspect the whole change; fix actionable findings and report actual evidence and limits.

## Execution ledger

- Planning: user authorized implementation of the previously discussed island concept. Work proceeds in this chat's checkout to retain the existing uncommitted theme work and the served preview.
- Ruling: five states mean the existing five reached difficulty tiers; an unexplored label is separate from the five building appearances, preventing a sixth building state and misleading completion claims.


- Implementation: ten original SVG landmarks over the generated island terrain; map/list, categories, EN/ZH, three themes, state preview and live normal-record derivation are connected.
- Verification: npm test PASS 97/97; island browser matrix PASS 30 combinations plus ten dialogs/five states, normal/practice result flow, storage/reload, keyboard/focus and non-overlapping map targets. Existing Hub theme regression PASS 30 combinations. Shared screen regression PASS for Number Pop and Flash Brain: 8 standalone, 2 practice, 2 iframe cases.
- Review: one independent reviewer found a P2 focus-return issue after marker refresh; fixed and independently rechecked. Browser regression also verifies focus and guards queued native close events from overriding newer focus.
- Ruling: no game implementations, SDK outcomes or record formats changed; no new daily missions, achievements, cloud deployment or commits. Physical mobile hardware remains unverified.
- Art: original built-in image_gen terrain, source and exact prompt recorded in assets/toenow-island-terrain.provenance.json. Building states are native SVG, not baked into the background.
