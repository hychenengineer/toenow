# Island route and immediate progression fix — 2026-10-26

The final requested layout puts Rabbit at the lower-left dock `(18,78)` and Panda Rescue at the upper-right `(81,18)`. Fox moves to Rabbit's previous clearing `(40,78)`. Other map positions and all source artwork are preserved.

The fixed route chooses the nearest remaining location at each step, reserving Panda Rescue as the final destination:

Rabbit → Fox → Squirrel → Elephant → Otter → Penguin → Beaver → Owl → Raccoon → Panda Rescue.

Only one new location opens for the first Level 1 completion in each open game. Replaying an already credited game does not open additional locations. The mission now names the next destination in English/Traditional Chinese.

## Root cause and changes

The previous browser test forced a final wave and triggered game over, so it missed real play: Rabbit could clear five actual waves while the island never received a completion message. The old integration only reported progress at game over. Closing the iframe before that message arrived could also quarantine the reached wave.

`ToenowGameSDK.reportProgress` now records normal-play level milestones independently of game-over scores and analytics. Shared animal wave updates connect the existing games; Rabbit and Block Match also report from their real wave-clear branches. Flash Brain's existing garden adapter handles its React run lifecycle and practice URL. Panda Rescue reports its actual winning puzzle because its tiers use one puzzle rather than five rounds.

The Hub validates the frame, origin, game ID, normal mode and level boundary. It updates discovery immediately without waiting for a score result. Milestone saves let standalone play and other tabs reconcile the same completion. Practice/tutorial runs remain excluded.

Version-1 state migrates to a fixed route while preserving previously opened buildings and completion credit. Previously open games with a plausible saved normal Wave 6+ record recover missed Level 1 credit; records exceeding the shared score-per-wave bound are excluded. Recovery grants one next destination per credited game and does not convert the journey to all-access legacy mode. Canonical scores and guest saves are retained. Malformed opened lists recover Rabbit instead of stranding the player.

## Verification

- PASS: `npm test` — 152 tests.
- PASS: `tools/verify-island-progression-browser.cjs` — five actual Rabbit waves open only Fox before game over, eight buildings stay locked, close/reload retains access, Block Match credits Wave 5 on its success card, a v1 missed-clear save repairs only the next opening, and actual Panda boarding records a Level 1 milestone.
- PASS: `tools/verify-onboarding-browser.cjs` — English/Traditional Chinese at four widths, account/guest entry, practice and duplicate protection, rejected scores, two tabs, reload and legacy/cloud account fixtures.
- PASS: `tools/verify-island-browser.cjs` — 30 size/theme/language combinations, location spacing, all growth stages and existing map actions after the position changes.
- PASS: `tools/verify-shared-screens-browser.cjs` — 36 standalone combinations, 9 iframe checks and 9 practice checks.
- PASS: independent review; malformed-opened-list finding reproduced and repaired with a regression test.
- PASS: desktop/mobile screenshots inspected in `artifacts/island-progression/`.
- NOT VERIFIED: physical iPad Safari and real authentication delivery. No website deployment performed.

Logs remain local under `artifacts/island-route-*.log`; no test-generated saves, logs or screenshots are intended for GitHub publication.
