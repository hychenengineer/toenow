# Shared Game Screens Implementation Plan

**Goal:** The nine non-rescue games render their title and game-over screens through one shared library, with no per-game copies of the screen templates.

**Architecture:** `shared/toenow-screens.js` owns templates, accessibility, actions, sharing, and the four standard result fields. A data-only catalog supplies game copy and legacy button IDs. Games retain their lifecycle/storage logic and pass score, best score, reached wave and peak combo to the renderer. Flash Brain uses a React host adapter to the same DOM library.

**Constraints:** Preserve existing uncommitted changes, storage keys, practice record protection, gameplay, localization, standalone and iframe operation. Exclude Animal Rescue Train. Do not commit or publish.

## Tasks

- [x] Write failing tests for the shared API, nine integrations, and absence of copied view markup.
- [x] Implement data catalog and shared title/game-over renderer; standard results: score, best score, wave reached, peak combo, plus the common five-level badge.
- [x] Replace eight HTML title/end templates with hosts and adapter calls; remove obsolete end-screen presentation and sharing code.
- [x] Replace Flash Brain's React view templates with lifecycle adapters to the same renderer.
- [x] Update existing runtime/practice tests to inspect library-generated screens rather than expecting copied HTML.
- [x] Run npm test and browser regression across all nine games: both languages, desktop/mobile, title/start/practice, expiration, real result data, retry/title/share, record protection and iframe operation.
- [x] Inspect generated screens, fix failures, rerun checks and report evidence and limitations.

## Implementation notes

- Title record formatting is also centralized in `ToenowScreens.updateTitle`; adapters only provide best score/wave.
- Games without a combo metric pass null, displayed as a dash instead of inventing a statistic.
- Flash Brain uses React refs/effects solely as host adapters to the same DOM renderer; its old title/end JSX templates were removed.
- Browser state hooks drive the actual game-over lifecycle, including the actual Flash Brain engine completion callback. Practice cases seed 17 points/wave 2 and finish above both records to detect accidental persistence.
- Review caught and fixed Spot Quick legacy record IDs; true Flash completion testing caught and fixed the use of run-best rather than saved best, plus snapshot field names in Hub reporting.

## Final verification

PASS: `npm test` 75/75; `node tools/verify-shared-screens-browser.cjs` with the local URL/runtime configured: 36 standalone language/viewport cases, 9 practice isolation cases, and 9 iframe cases. All nine use identical generated title/result DOM; result card, stat grid, and button dimensions match across games for each viewport/language. Live language switching, actual score/wave sharing, retry and return-to-title passed. Source checks prohibit copied screen templates and per-game title-level presentation. Review found no remaining material issues. Browser screenshots were inspected. Physical iPad Safari was not tested.
