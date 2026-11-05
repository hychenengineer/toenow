# Guarded Trail and Forest Camp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one optional guarded exploration route and an enterable three-building camp.

**Architecture:** Extend the existing campaign with persistent trail encounter state and settlement. Keep camp/trail rendering in separate view modules, coordinated by the existing controller and combat engine.

**Tech Stack:** Vanilla browser JS/CSS, existing Toenow SDK/screens, Node tests, Playwright and project-owned WebP art.

**Spec:** `docs/superpowers/specs/2026-11-04-animal-trail-camp-design.md`

## Global Constraints

- Existing animal species, combat rules, recruitment/training costs and fort rewards remain unchanged.
- Exact HP persists; settlements and rewards must reject repeats and stale battles.
- Only shared ToenowScreens render title/results; practice never overwrites best records.
- Work continues in the existing authorized dirty preview workspace; no commit, branch change or deployment.

## Review Focus

- Leaving a trail must retain its stage and guard HP.
- A wiped army cannot count inaccessible guarded treasure as recovery.
- Trail victory must not capture a fort, raise a fort flag or auto-pay treasure.
- Hidden camp/map controls cannot mutate state during battle or pause.
- Title/restart/handbook/language changes must not strand an alternate view.

### Task 1: Persistent guarded encounter

Files: `campaign.js`, `tests/animal-siege-campaign.test.cjs`.

- [x] Add failing tests for clue progression, visible guards, pre-victory claim rejection, real battle initialization, retreat/re-entry, once-only loot, stale settlement and recovery.
- [x] Implement `investigate(run,id)`, `beginTrailBattle(run,id)`, `completeTrailBattle(run,battle)`; gate `claim` and refine `canRecover`.
- [x] Run campaign and engine tests; retain all existing fort behavior.

### Task 2: Enterable camp and exploration views

Files: new `camp-view.js`, `trail-view.js`, `camp-trail.css`; modify `index.html`, `expedition-view.js`, `main.js`.

- [x] Add browser assertions for explicit camp entry and building selection; real recruitment/training; trail stages, leaving, guards, battle and once-only loot.
- [x] Integrate mutually exclusive views and delegate existing actions; retain current building, trail stage and language across pause/handbook.
- [x] Distinguish trail combat from forts in rendering, terrain, objectives, retreat, capture and settlement.
- [x] Add project-owned camp/trail art with prompts and provenance; verify screenshots at 1280, 390 and 320 pixels.

### Task 3: Regression and review

- [x] Update existing browser drivers for camp entry/building selection and the guarded cache.
- [x] Run `npm test`, shared-screen regression, new flow browser matrix and full three-fort expedition/practice checks.
- [x] Obtain one fresh read-only review of changed gameplay/controller files; fix material findings and verify them.
- [x] Open a fresh preview without replacing the user's current match; deliver actual screenshots.

## Execution ledger

- Ruling: execute inline in the existing preview workspace, following the user's approval of this concrete slice; preserve unrelated dirty files and avoid an unnecessary execution-method confirmation.
- Ruling: use existing upgrade effects inside buildings; no building-level lock or extra upgrade costs in this slice.
- Task 1 complete: observed RED in `artifacts/animal-trail-camp-red.log`, then campaign/engine 25/25 GREEN; full `npm test` 315/315.
- Task 2 complete: new flow matrix 1280 ZH, 390 EN, 320 ZH passed real UI recruitment/training, investigation, leaving, retreat/re-entry exact HP, real guard victory, once-only loot, handbook/language and SDK restart. Screenshots in `artifacts/animal-trail-camp/`.
- Art: generated with built-in image_gen from approved Acorn style; retained PNG sources, WebP runtime files, exact prompts, dimensions and SHA256 provenance alongside each asset.
- Regression so far: shared-screen standalone 4/iframe 1/practice 1; strategy 3 sizes; handbook 3 sizes plus iframe; both other fort terrains 3 sizes passed.
- Fresh read-only final reviewer: `/root/trail_camp_final_review` reported no actionable material findings; independently ran campaign/engine 25/25. Subsequent edits only completed visual presentation and browser-driver selectors/route choices.
- Ruling: browser helpers select visible controls because inactive scene DOM remains mounted. Full-run player policy now collects travelling allies before optional guard combat; training/recruitment and combat values remain unchanged. The automated policy's purchase choices are verification inputs, not game automation.
- Preview: new user-facing IAB tab 9 opened at Forest Camp, Beaver Workshop selected; original match preserved.
- Task 3 complete: final `npm test` 315/315, new flow 3/3, full three-fort expedition plus practice 1280 ZH / 390 ZH / 390 EN all passed (score 1035); persistent fort retreat and army-wipe recovery also passed. Logs: `artifacts/animal-trail-camp-{npm,browser,expedition,shared,strategy,guide,terrain}.log`. `git diff --check` and modified module syntax checks passed. No commit, push or deployment performed.
