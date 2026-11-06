# Island First Visit Implementation Plan

**Goal:** Welcome new players with Rabbit's short arrival story, explain the three existing islands, and lead them to their first destination.
**Architecture:** A small vanilla-JavaScript Hub story controller owns one accessible dialog and an independent completion key. The Hub supplies existing island, home and account callbacks. Reuse existing artwork and bilingual catalog; game screens and game tutorials keep their current owners.
**Spec:** User-approved chat design: Rabbit greeting → three islands → first action; roughly 30 seconds of optional reading, back/next/skip, replay from the menu, accounts secondary.

## Constraints and review focus

- English and Traditional Chinese; use 探索島 / 無憂島 / 遠征島.
- Completed/skipped story stays dismissed on reload; returning players are not interrupted, and new signed-in players can see it.
- Authentication must not mark the story complete or stack dialogs. Cancelling account entry resumes the story.
- Deep links to games/homes keep their destination and are not covered by the welcome story.
- Keyboard focus, 320px screens, short landscape viewports, and unavailable storage must remain usable.
- Navigation/story must not write game scores, material balances, or exploration completion.

## Tasks

- [x] Add story persistence behavior tests and observe the missing-feature failure.
- [x] Implement `shared/toenow-island-story.js` and `assets/toenow-island-story.css`; use `#islandWelcome` as the host, `#welcomeGuestBtn` as Skip story, and existing sign-in/register IDs as secondary actions. Export `mount({host,storage,onChoose,onSkip,onAccount})` with `show({resume=false})`, `shouldShow(returning)`, and `isOpen()`.
- [x] Add bilingual catalog entries, a profile-menu replay action, and Hub callbacks. Exploration choice selects the island and opens Rabbit's home; other choices select their map and focus the first existing entrance. Skip returns to the map.
- [x] Add actual-browser regression for first visit, choices, skip/reload, replay, account return, language, viewport, deep links and saved progress. Update the previous onboarding browser journey to the new welcome flow.
- [x] Run `npm test`, new and existing onboarding/island browser journeys, and shared screens regression; inspect mobile/desktop screenshots.
- [x] Obtain independent code review, resolve actionable findings, record verification, and leave the implementation ready for local review.

## Decisions

- Work in `codex/island-first-visit`; preserve unrelated generated files. The user approved pushing the completed feature to `preview`.
- Keep the existing welcome element and skip-button IDs so other gameplay smoke journeys retain their entry point.
- Use an independent `toenow_island_story_v1` key; authentication and exploration keep their existing state semantics.

## Verification

- `npm test`: 18 pretests + 321 main tests passed, zero failures.
- `verify-island-story-browser.cjs`: 18 checks passed, zero page errors, exit 0. Includes EN/ZH, desktop/mobile/landscape, touch, keyboard, skip/reload/replay, each destination, protected saves, blocked story storage, auth Escape/resume, pending-story reload and direct account links.
- `verify-onboarding-browser.cjs`: passed, including normal/practice boundaries, rejected/duplicate results, migration, and account flows. Updated the existing obsolete Rabbit-home play selector.
- `verify-island-entrances-browser.cjs`: 19 checks passed, zero page errors, exit 0.
- `verify-shared-screens-browser.cjs`: 48 standalone + 12 iframe + 12 practice cases passed, exit 0.
- All 24 story source strings have Chinese catalog entries. Desktop Chinese arrival and 390/320px mobile screenshots inspected.
- Independent review found three authentication edge cases; fixed premature welcome completion on login, Escape cancelling the resumed story, and direct-account entry missing the story. Browser regressions passed after fixes.
- Evidence: `artifacts/island-story/`. Browser testing used local Edge and simulated viewports/touch; physical iPad/Safari and live authentication were not tested (auth exercised with a local stub).
- User subsequently requested publication to GitHub `preview`; fresh `npm test` passed before preparing the scoped commit. Screenshot artifacts and attachments are excluded. Concurrent Animal Siege changes were preserved and excluded from this feature's edits.
