# Animal battle orders and hands-on lesson implementation plan

> Use superpowers:executing-plans to implement this approved chat design in this session.

**Goal:** Make the next action visible and let players issue movement and attack together, with a short first-play rehearsal.

**Architecture:** Retain the engine rules and shared screens. The controller previews an attack from the proposed destination, then commits the move and attack in sequence through existing engine APIs and feedback animations. The coach owns lesson progression; an isolated battle fixture temporarily replaces the real battle and restores it unchanged on completion or skip.

**Tech stack:** Existing HTML/CSS/browser JavaScript, Node 20 tests, Playwright with Edge.

**Spec:** Approved chat design, 2026-11-04: desktop right-side actions, mobile fixed bottom actions, reversible move preview, one “Move & attack” command, move-only option, explicit move-and-end-turn option, contextual guidance and five-step hands-on lesson.

## Constraints and decisions

- Preserve engine movement, range, line of sight, practice isolation, SDK lifecycle and shared title/result library.
- First play automatically rehearses selecting an ally, a destination, an enemy, executing a combined attack, and ending the turn. Only the current instruction is enabled; skip and menu remain available.
- Decision: allow skip at every step and replay from the pause menu. Store the new lesson separately from old contextual-tip completion.
- Decision: rehearse before the first actual battle, including expedition entry; restore the original state without supplies, casualties or score changes.
- Work in place: all Animal Siege source is currently untracked amid pre-existing changes. Do not stage, commit, move or discard that work.

## Review focus

- Repeated click, pause or restart during walking must not duplicate or leak queued attacks.
- Invalid preview targets must not spend movement; destination change clears a selected target.
- Preview cancellation, handbook, language switch and mobile resizing retain usable controls.
- Tutorial skip/replay cannot settle or mutate the real expedition or score records.
- End turn during a preview commits only the explicitly labelled movement, then guards idle squads.

## Tasks

### 1. Combined orders and visible actions
- [x] Add browser regression for preview → target → combined attack, cancellation, move-only and move/end-turn; run RED.
- [x] Update `games/animal-siege/main.js` using existing engine APIs; retain animation cancellation tokens and paused callbacks.
- [x] Move actions into the command panel in `index.html`; add responsive `battle-orders.css` with a fixed mobile action dock.
- [x] Run the focused browser suite GREEN, desktop/mobile and both languages.

### 2. Hands-on lesson
- [x] Add coach tests for gated progression, no premature completion, safe fixture, skip and replay; run RED.
- [x] Extend `battle-coach.js` and controller snapshot/restore; use local spotlight and adjacent prompt instead of top banner.
- [x] Exercise first play, completing, skipping, replaying, storage unavailable, practice and expedition restoration.

### 3. Regression and review
- [x] Update older browser expectations for the approved changed controls; mark returning-player suites as lesson completed.
- [x] Run npm test and shared-screen browser regressions plus real gameplay browser coverage.
- [x] Inspect screenshots at desktop/mobile sizes and review changed code; record outcomes.

## Execution ledger

- Baseline: Node v20.17.0, npm test main suite 309/309 PASS.
- Current branch: codex/island-explorer, unchanged; game source and many unrelated files already untracked/modified.
- Original files saved to artifacts/animal-orders-before for a scoped diff without staging user work.

- Combined-order browser regression RED: preview failed to mark destination-based targets; then GREEN on desktop and mobile.
- Hands-on unit RED: 3 missing lesson APIs; then 7/7 coach tests GREEN.
- Review finding: portrait-to-landscape rotation lost the lesson target. Added a failing browser assertion, then fixed resize measurement/scroll positioning. Independent reviewer verified target hit-testing after rotation.
- Extra RED-to-GREEN fixes: SDK restart during a tier-5 rehearsal lost the chosen real wave; fixed wave precedence. Mobile dock remained visible over standalone result; hidden at gameover.
- Verification: npm test PASS (pretest 9/9; main suite 315/315); orders/lesson browser matrix PASS including animation pause/restart, iframe practice tier 5, handbook, language, skip/replay, rotation and restored battle/records.
- Regression: move-preview browser PASS at 3 desktop/mobile/language configurations; attack-guidance browser PASS at 3 configurations. All shared-screen browser suite PASS: 48 standalone, 12 iframe, 12 practice; final Animal Siege repeat PASS: 4 standalone, 1 iframe, 1 practice.
- Scope: only controller, markup, coach, added orders stylesheet, coach tests and associated browser verification setup were edited for this task. Concurrent campaign edits were left intact. No commit/push/deployment.
