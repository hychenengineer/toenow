# Island onboarding implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Enter directly into the island, choose sign in / create account / guest once, and discover one game per Level 1 completion.

**Architecture:** A browser/Node exploration module owns persisted unlock order, completed games, welcome choice and pending discovery. The Hub retains authentication, records and iframe lifecycle; the island renders mist, mission and discovery from that state.

**Tech Stack:** Existing vanilla JavaScript, CSS, ToenowI18n, Node test runner and Playwright/Edge.

**Spec:** Approved three-panel concept and discussion in this task; existing AGENTS.md.

## Global constraints
- Fixed first game: number-pop (the existing rabbit garden); shuffle remaining game IDs once and persist.
- Passing Wave 5 means reaching Wave 6. Each distinct unlocked game grants one unlock, once; practice/preview cannot advance progress.
- Existing actual normal-play records retain all entrances. Language/theme/profile defaults do not count as game history.
- Existing game screens, saves and art stay intact. GitHub commit/push authorized after implementation; no deployment requested.
- All new copy supports English and Traditional Chinese, including dialogs and locks.

## Review focus
- New browser with only settings must still have one game; zero-score legacy attempts must retain access.
- Duplicate results, forged messages and practice runs must not create unlocks.
- Reload, other-tab records, unavailable/malformed storage and all-games completion remain usable.
- Sign-in restoration and remote history must not strand returning players or suppress guest access when auth fails.
- Mobile map starts on the available game and keyboard users can navigate the welcome and locked-place dialogs.

### Task 1: Exploration state
**Files:** Create shared/toenow-exploration.js and tests/toenow-exploration.test.cjs; modify package.json.
**Interfaces:** create({storage, levels, gameIds, random}) returns snapshot(), isUnlocked(id), complete({gameId,wave,isPractice}), reconcile(), chooseGuest(), dismissDiscovery(), adoptLegacy(). snapshot returns mode, order, completed, unlocked, welcomed, pending.
- [x] Write tests for fresh/settings-only/legacy, Wave 5 vs 6, duplicate/practice/locked completions, stable order/reload, corrupt/blocked storage and full progression.
- [x] Run tests, observe missing module failure, implement, rerun green.

### Task 2: Hub welcome and gated entry
**Files:** Modify index.html, assets/toenow-island.css, shared/toenow-i18n-core.js.
**Interfaces:** Hub initializes exploration before profile defaults; passes it to island; all Hub launch routes check isUnlocked. Welcome uses native dialog, existing account methods and guest persistence. Auth modes use existing magic link/Google providers.
- [x] Add browser checks for welcome choices, localization, returning guest, legacy access, gated list/deep link and authenticated restoration.
- [x] Connect verified normal results and saved standalone records to exploration, refresh map/list on close/storage/focus; preserve practice filtering.

### Task 3: Island discovery visuals and regression
**Files:** Modify shared/toenow-island.js; create tools/verify-onboarding-browser.cjs; update tools/verify-island-browser.cjs for explicit legacy fixture.
**Interfaces:** mount accepts exploration; refresh reads current unlock state. Locked markers stay keyboard accessible and describe how to unlock; discovery action opens newly unlocked location. New users hide filtering/preview clutter and map scroll targets the starting garden on mobile.
- [x] Implement mist, focused first mission, unlocked counter, discovered-building highlight and route, using current source art.
- [x] Run npm test, onboarding browser matrix and existing island/shared screens regression; inspect desktop/mobile screenshots and fix/retest issues.
- [x] Fresh review of changed files; report actual PASS/NOT VERIFIED boundaries.

## Execution ledger
- Working in the existing clean feature branch codex/island-explorer; preserve all untracked artifacts. No additional worktree or commit needed for this local reviewable change.
- Task 1 -> Tasks 2/3 share snapshot and completion methods above; Hub owns result validation, module owns idempotent progression.
- Task 1 complete: exploration state and 12 targeted Node tests, including failed writes, rejected records, two-tab ordering, replay and orphan iframe recovery.
- Task 2 complete: welcome uses current auth providers with distinct email sign-in/register options; local provider stub verifies session restoration, new accounts and existing cloud records without sending mail.
- Task 3 complete: mist, discovery route, mission, compact mobile header and map recentering use existing artwork. Existing full-island regression now explicitly seeds legacy access.
- Review: independent reviewer identified failed-write rollback and rejected-record reconciliation races; both received failing tests and fixes. Persisted iframe ownership and pagehide recovery prevent orphan guards from lasting permanently.
- Ruling: raw records produced by an unfinished iframe are quarantined on close/reload if they exceed the last accepted result. A later verified Hub result can complete that same wave; later standalone records must exceed the quarantined wave. This prevents rejected/unfinished data from granting discoveries while retaining score saves.
- Verification: npm test 145/145 PASS; full island matrix 30 combinations PASS; shared screens 36 standalone + 9 iframe + 9 practice PASS; onboarding browser matrix including actual two-tab rejection/acceptance PASS. Live authentication delivery and physical iPad Safari NOT VERIFIED.
