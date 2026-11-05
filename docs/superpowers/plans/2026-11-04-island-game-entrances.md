# Island game entrances implementation plan

**Goal:** Put the existing hot spring, farm and Animal Siege games on the two selected island paintings.
**Architecture:** Keep the exploration island intact. Add a small archipelago navigation adapter and two illustrated panels using existing game launch buttons and the existing theater lifecycle.
**Tech:** Plain HTML/CSS/JavaScript, Node tests, Playwright.
**Spec:** User selected Carefree concept 3 (front hot spring/farm, vacant rear meadow) and the attached Expedition concept (misty frontier). No new games or destinations.

- [x] Add a browser regression for three-island navigation, actual game entry/return, bilingual labels and mobile hit areas; run it and observe missing navigation fail.
- [x] Preserve selected artwork, create optimized WebP maps with provenance, replace entry cards with painted map hotspots and island navigation.
- [x] Reuse existing game launch callbacks; retain the selected island when returning, and select the appropriate island for game deep links.
- [x] Update existing browser journeys to navigate to their island first; replace the obsolete stacked-card layout expectation.
- [x] Run npm test, new browser regression, exploration island regression and shared screen browser regression. Inspect desktop/mobile screenshots and diff.

Constraints: Preserve exploration gates, game SDKs, practice protection, saves and shared screens. Only existing games are interactive. English and Traditional Chinese. No publication requested.
Review focus: Touch/keyboard access; stale selected-panel state after return; deep links; language changes; map image loading and horizontal overflow.

## Verification

- `npm test`: PASS, 18 pretests plus 316 main tests, zero failures.
- `verify-island-entrances-browser.cjs`: PASS, 19 checks, zero page errors; 1440/768/390/320 widths, EN/ZH, touch entry, keyboard entry, real game Back to Hub buttons, correct iframe routes, deep links and protected game saves.
- `verify-island-browser.cjs`: PASS, existing ten-location exploration matrix and game/record regression.
- `verify-shared-screens-browser.cjs`: PASS, 48 standalone, 12 iframe and 12 practice cases.
- Visual inspection: Carefree mobile and Expedition desktop screenshots match selected art and readable destination overlays.
- Evidence: `artifacts/island-entrances/` (local, not intended for source control).
- Browser evidence is local Edge with simulated mobile sizes/touch; physical devices and live deployment are not verified.
- Branch: `feature/island-game-entrances`. User subsequently requested publication to GitHub `preview`; fresh `npm test` passed before committing. Generated evidence and attachments are excluded from the commit.
