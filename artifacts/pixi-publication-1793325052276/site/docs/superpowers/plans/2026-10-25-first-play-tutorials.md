# First-play tutorials implementation plan

**Goal:** Teach the core action of all ten games through a short interactive example, automatically shown on first Start and available again from each title screen.

**Architecture:** A shared, isolated lesson dialog runs before the actual game's start callback. Data-driven examples reflect each game's core mechanic. Completion and explicit skipping are versioned per game in browser storage; merely opening or cancelling does not mark a lesson seen. The existing game engines, scores, saves and shared title/result ownership remain intact.

**Tech stack:** Plain JavaScript UMD modules, native dialog, shared CSS, existing localization catalogs, Node tests and Playwright/Edge browser verification.

**Spec:** User-approved in-chat teaching flow and AGENTS.md.

## Constraints and decisions

- Ten games, including the existing Animal Rescue Train screen exception and Flash Brain's React host.
- Lessons run before play; no timer, score, practice records, saves, analytics runs or Hub results change during teaching.
- Each title has a replay entry; verbose arcade rules collapse into optional details.
- English and Traditional Chinese, keyboard and pointer input, standalone and iframe, narrow and desktop screens.
- Storage failures permit play and retain an in-memory completion fallback for this page.
- Completion requires the example's actions; skipping is explicit. Escape returns to the title without marking incomplete teaching seen.
- Existing automatic-start links remain direct starts. First-play teaching is attached to the ordinary title Start action; practice retains its existing flow.
- No new dependencies, source art changes, commit, push or deployment in this implementation request.

## Steps

- [x] Write failing tests for per-game/version completion, failed storage, lesson correctness, wrong actions and all ten integrations.
- [x] Add shared lesson data, pure lesson/progress model, accessible dialog controller, styles and bilingual phrases.
- [x] Integrate the title replay button through ToenowScreens, retain the train exception, include shared dependencies in all ten HTML pages, and collapse long title rules.
- [x] Add real-browser checks for every lesson, first/returning player, skip/replay/cancel, blocked storage, keyboard, mobile/desktop, EN/ZH, iframe and record protection.
- [x] Run npm test, all-game tutorial browser checks and existing shared-screen regression; inspect screenshots and correct failures.

## Review focus

- Capture title Start before inline or React handlers so teaching cannot silently run an engine underneath.
- React rerenders do not lose the replay entry or launch a detached start button.
- Dialog cleanup cancels observation timers; keyboard shortcuts cannot start gameplay behind the modal.
- Flash Brain teaches remembering and priority order; Ball Track shows the hidden target moving; Train teaches queue then same-species carriage.
- Closing/reopening or language switching does not erase current lesson progress or completion records.

## Verification ledger

- PASS: npm test, 133/133 (`artifacts/tutorials-npm-final.log`).
- PASS: real Edge tutorial matrix, 40 lesson scenarios, 10 skip/cancel scenarios, 10 iframe scenarios, plus keyboard/language and blocked-storage edge cases (`artifacts/tutorials-browser-final.log`). Mobile cases use actual browser touchscreen input, not physical hardware.
- PASS: final targeted rerun after keyboard focus/localization corrections, four Block Match dimensions/languages, skip/cancel, iframe and both edge cases (`artifacts/tutorials-final-touchup-browser.log`).
- PASS: returning-player shared-screen regression, 36 standalone, 9 iframe, 9 practice scenarios (`artifacts/tutorials-shared-screens.log`).
- PASS: screenshots inspected for Block Match, Flash Brain, Train and Space Scale; all game/dimension/language screenshots retained under `artifacts/tutorials/`.
- PASS: independent source review; focused Start/replay Enter/Space bypass was identified, reproduced, corrected and rechecked. No outstanding critical or important findings.
- Implementation rulings: Number Pop's fast pointerdown is suppressed until the corresponding click opens the tutorial; focused Start/replay keys are handled before existing engine-wide shortcuts. The existing localization switch is preserved across dialog rerenders, rather than duplicating it.
- NOT VERIFIED: physical iPad Safari. No commit, push or deployment performed.
