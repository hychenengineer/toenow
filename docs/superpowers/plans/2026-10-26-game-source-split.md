# Game source split implementation plan

> Execute inline with `superpowers:executing-plans`; finish with one independent review.

**Goal:** Make the eight large game pages easier to maintain without changing gameplay, storage, art, localization or shared-screen ownership.

**Architecture:** Keep classic scripts and existing SDK load order. Each page owns markup and loads its stylesheet, game-specific pure rules/data, audio where independent, and controller in dependency order. Pure modules expose a single game-specific namespace and support CommonJS for real rule tests. Do not invent a second shared UI or force unrelated mechanics into one engine.

**Tech Stack:** Existing HTML/CSS/JavaScript, Node test runner, Playwright/Edge.

**Spec:** Repository AGENTS.md and the user's approved incremental refactoring direction.

## Constraints and review focus

- Preserve all record keys, practice guards, screen callbacks and SDK behavior.
- Keep the exact CSS cascade and initialization order; external assets use page-relative URLs.
- Update source-based tests and browser instrumentation to follow external scripts, preserving coverage.
- Preserve closure dependencies when moving functions; avoid shared mutable globals between games.
- Work in the existing checkout with tracked files initially clean; preserve all untracked user artifacts. No commit, push, deployment, reset or cleanup is authorized.

## Tasks

- [x] 1. Baseline: run npm test; record original script/style content for extraction comparison in local artifacts.
- [x] 2. Add a failing regression for loading local scripts/styles in document order and meaningful pure-rule cases. Implement the source loader used by tests/instrumentation.
- [x] 3. Refactor spot-quick first: stylesheet, specimen definitions, rules, audio, controller. Verify source preservation, runtime initialization, practice and shared screen behavior before proceeding.
- [x] 4. Apply the pattern to number-pop, ball-track, shadow-match, space-scale, add-up, tap-match and block-match, using responsibility-based boundaries. Keep already modular animal-rescue-train and flash-brain intact. Update source readers in tests and browser tools.
- [x] 5. Run npm test and shared screen browser matrix, plus affected gameplay/tutorial/timing checks. Inspect rendered desktop/mobile pages and fix regressions.
- [x] 6. Write a maintenance map, obtain one independent code review, inspect final diff and report PASS / NOT VERIFIED boundaries.

## Execution ledger

- Baseline: 160/160 tests pass, 0 failures (artifacts/refactor-baseline.log).
- Ruling: use existing checkout rather than create or commit a worktree; no tracked edits existed, and all existing untracked artifacts are preserved.
- Ruling: extract independent rules, data and audio first; do not mechanically split tightly coupled render/controller closures merely to satisfy a line count. Extract rendering only where dependencies can be made explicit without changing behavior.

- Completed: all eight large pages split, renderer dependencies explicit; CSS and original specimen art preserved.
- Final validation: 164/164 unit tests; 36 standalone + 9 iframe + 9 practice screen cases; 10 real-game tutorials + skip/iframe/keyboard/save checks; 12 timing cases. See docs/GAME_SOURCE_SPLIT_RUN_REPORT.md.
- Independent review: no significant issues, including the two test harness corrections.
- Finish: changes remain uncommitted in the original checkout; no merge, push, deployment or cleanup requested.
