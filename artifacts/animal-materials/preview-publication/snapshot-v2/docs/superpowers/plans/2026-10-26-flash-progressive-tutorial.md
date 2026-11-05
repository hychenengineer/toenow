# Flash Brain Progressive Tutorial Implementation Plan

**Goal:** Teach memory first, introduce thorns and priority only when encountered, and let players control lesson pacing and the first formal start.

**Architecture:** Keep the real Flash Brain engine and shared coach. Add manual lesson actions and in-run lesson sessions to the coach; keep lesson content, snapshots and rule progress in the game adapter. Add narrow engine hooks before simulation and at wave preparation.

**Tech Stack:** Browser JavaScript, existing React bundle, Node test runner, Playwright with Edge.

**Spec:** User-approved proposal in this chat: untimed basic recall, first-encounter thorn/priority demonstrations, explicit ready action, phase-specific prompts, protected scores, and replay access.

## Constraints

- Preserve unrelated uncommitted game refactor and launch fixes.
- Use the real board and existing shared title/result library.
- English and Traditional Chinese; standalone, iframe and practice support.
- Rules derive from actual wave configuration: thorns at wave 11; priority at wave 21.
- Lesson progress is separate from best-score and wave records.

## Tasks

- [x] Add failing adapter tests for manual memorization, retry, first encounters, restoration and blocked storage.
- [x] Extend shared coach with optional lesson actions and in-run sessions without changing existing adapters.
- [x] Implement the game adapter, small engine hooks and localized phase prompts.
- [x] Run targeted and full tests, browser lesson/phase checks and shared-screen regressions; inspect screenshots.

## Review Focus

Fast input and duplicate actions; timer and records during lessons; cancel/restart and stale sessions; direct practice entry at high waves; remembered rules and replay; narrow screens and live language changes.

## Verification

- PASS: `npm test`, 169 tests, zero failures.
- PASS: focused Edge EN/ZH at 390/1100px: manual holds, empty/thorn/priority mistakes, protected timer/records, ready confirmation/cancel, learned-rule replay, practice entry, real wave 10→11 and 20→21 transitions, and iframe lessons.
- PASS: all ten games' tutorial matrix, 40 language/size cases, 10 skip/cancel and 10 iframe cases; existing train saves and keyboard actions preserved.
- PASS: shared-screen matrix, 36 standalone, 9 iframe and 9 practice cases.
- PASS: priority prompt lifecycle, restart/pause, ordinary-wave exclusion, and actual Hub iframe live language changes.
- PASS: independent review after fixing readiness cancellation and the mistake-phase prompt; mobile basic/priority screenshots inspected; `git diff --check`.
- NOT VERIFIED: physical iPad Safari. No push or deployment performed.

Evidence logs: `artifacts/flash-progressive-npm.log`, `artifacts/flash-progressive-browser-reviewed.log`, `artifacts/flash-progressive-all-tutorials.log`, `artifacts/flash-progressive-all-screens.log`, `artifacts/flash-progressive-priority-final.log`.
