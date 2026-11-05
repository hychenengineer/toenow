# Battlefield Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a playable battle with animal-local information and centered order confirmation, without a right sidebar.

**Architecture:** Keep the existing controller and engine. Add a focused battle presentation module for unit badges and order descriptions, a field toolbar anchored to the selected tile, and one native order dialog. Keep all mutation in the existing engine calls.

**Tech Stack:** Vanilla JS/CSS, Toenow SDK/screens, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-animal-battle-field-orders.md`

## Constraints

- Keep the existing authorized workspace; no commits or publication.
- Do not change combat rules or approved painted assets.
- Preserve tutorial, bilingual desktop/mobile, practice and expedition behavior.

## Tasks

- [x] Add failing browser coverage for no sidebar, field width, per-unit HP/status, reversible preview, popup cancellation, combined move/attack, move-only then attack, defend/end-turn, pause/language/restart and tutorial.
- [x] Add `battle-view.js` and `field-orders.css`; replace sidebar markup with local orders, bottom turn controls and centered confirmation in `index.html`. Integrate controller and existing coach without altering engine rules.
- [x] Run focused browser matrix, `npm test`, shared screens, real expedition combat and practice/tutorial regression. Inspect screenshots. Update affected drivers and UX guidelines.
- [x] Obtain one fresh read-only final review, fix material findings with regression evidence and show a separate playable preview.

## Ledger

- Ruling: execute inline because this is one shared controller/UI change in the existing preview session; one fresh read-only reviewer at the end, as required by executing-plans.
- Ruling: pending movement remains reversible when the attack popup is dismissed. End-turn confirmation explicitly includes pending movement and auto-defense.
- RED evidence: `animal-field-orders-red.log` (sidebar), `animal-field-orders-obstruction-red.log` (local controls covering reachable cells), `animal-field-orders-coach-red.log` (tutorial cancellation).
- Implemented field-local controls with collision avoidance and a scenic-strip fallback; added per-animal HP, health and readiness badges. Attack popup executes existing engine calls, including reversible combined orders. Combat rules/art remain unchanged.
- Fixed lifecycle findings from regression: pausing retains the pending order; gameover hides floating controls; replaying lessons sets the playing presentation state; cancelling a lesson attack returns to target selection.
- Updated the existing coach unit suite (registered by npm), old order/tutorial browser driver and journey/expedition end-turn helpers for the confirmation popup. Normalized accidentally rewritten driver line endings without changing unrelated test text.
- Verification: npm 316/316; field matrix 1280 ZH, 1024 EN, 390 EN, 320 ZH; combined-order/replay matrix 1280/390/320/844; three first-play lesson cases; normal-motion duplicate click/pause/restart; iframe practice/handbook/language; shared title/end standalone4/iframe1/practice1; complete three-fort expedition plus practice and retreat/wipe recovery at 1280 all passed.
- Fresh read-only reviewer `/root/field_orders_review`: no findings. Subsequent regression-driven fixes verified by the complete tutorial/animation/practice driver. `git diff --check` passed. No commit/push/deploy performed.
