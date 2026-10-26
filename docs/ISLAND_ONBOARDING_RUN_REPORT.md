# Island onboarding verification — 2026-10-25

The Hub opens the island directly. New players choose Sign In, Create account or Continue as a guest, with English/Traditional Chinese copy. Guests do not see the welcome repeatedly. Existing local normal-play history, including zero-score attempts, retains access to every game. Existing cloud history is detected after account restoration.

New journeys begin at the existing `number-pop` rabbit garden. The other nine sites are covered in mist. Passing Wave 5 (reaching Wave 6) in each distinct open game unlocks one more site, once. The remaining order is randomized once and stored in `toenow_exploration_v1`. Practice and appearance previews do not advance discovery. Discovery banners, highlighted buildings and routes show the next destination.

## Verified

- **PASS** `npm test`: 145 tests, zero failures.
- **PASS** `tools/verify-onboarding-browser.cjs`: welcome EN/ZH at 1440/768/390/320 widths; sign-in/register/guest; returning guests; locked map/deep links; production number-pop practice, Wave 5, Wave 6, duplicate and rejected results; reload and discovery actions; real two-tab storage refresh; old zero-score players. Local provider stubs check restored/new accounts, cloud history and email account-creation options without contacting authentication providers.
- **PASS** `tools/verify-island-browser.cjs`: 30 size/theme/language combinations, ten locations, all five art stages, real game launching, normal/practice records, keyboard/dialog actions, reload/storage events and art fallback. Uses an explicit legacy-access fixture to exercise the complete island.
- **PASS** `tools/verify-shared-screens-browser.cjs`: 36 standalone combinations, 9 iframe and 9 practice checks.
- **PASS** Desktop/mobile screenshots inspected under `artifacts/island-onboarding/`; no horizontal page overflow in the welcome matrix.
- **PASS** Independent code review findings addressed with regression tests: readable-but-unwritable storage, rejected-record reconciliation, two-tab ordering, replay guard lifetime and iframe reload recovery.

## Boundaries

- **NOT VERIFIED** Real email delivery, Google OAuth and a real authenticated cloud session. Tests used a local provider stub and sent no authentication messages.
- **NOT VERIFIED** Physical iPad Safari. Responsive checks ran in Edge through Playwright.
- No deployment performed. GitHub publication was authorized separately after implementation verification.

## Progress storage and interrupted runs

Discovery state remains browser-local. Current cloud integration retains score synchronization; this change does not add a cloud unlock-order schema. When this browser has no journey yet, older cloud score rows preserve returning-account access to the complete island.

Active iframe writes are excluded from reconciliation until a validated result arrives. Run guards survive replay and are removed after the frame unloads. Tab ownership recovers guards on reload; pagehide marks closed runs for recovery and expired crashed-tab guards are also recoverable. An interrupted or rejected raw record above the last accepted wave is excluded from discovery without deleting its score/wave save. A later verified Hub result may complete the same wave; a later standalone record must exceed the excluded wave.

If localStorage writes fail, the session keeps its guest choice and discoveries in memory. It cannot promise persistence across browser closure when the browser refuses storage writes.

## Reproduction

Use the configured Playwright package through `NODE_PATH`, set `TOENOW_TEST_URL` to the local server, then run the scripts above. This run used `http://127.0.0.1:8765`. Logs: `artifacts/island-onboarding-unit.log`, `artifacts/island-onboarding-browser.log`, `artifacts/island-onboarding-island.log` and `artifacts/island-onboarding-shared-screens.log`.
