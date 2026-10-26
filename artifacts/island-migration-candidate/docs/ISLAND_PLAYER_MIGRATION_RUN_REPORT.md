# Existing-player island migration — 2026-10-26

All players use progressive island discovery, including returning guests and restored accounts. A zero-score attempt or cloud score alone no longer grants every location. Normal scores and game saves are retained without rewriting their storage keys.

`toenow_exploration_v3` imports older v1/v2 exploration state once, credits plausible normal Level 1 records and saved milestones, then derives the contiguous Rabbit-to-Panda route. Later-game completion credit is retained until the earlier route reaches it. Rabbit starts open; Rabbit Level 1 opens Fox; unearned locations stay locked. Old opened flags alone do not preserve access.

The separate discovery key prevents still-open old tabs from restoring the previous all-access policy. Old-key active-run and rejected-result metadata remains consulted, and imported guards settle when an older run ends. A validated older-tab completion is credited even after a previously rejected attempt. Practice and interrupted/unvalidated raw saves do not unlock locations.

The Hub versions its island CSS, island renderer and exploration script with `v=island-20261026-3`. Once the browser receives the new HTML, these URLs fetch the new resources. An already-open old document needs navigation/reload; this does not force an immediate refresh of already-cached HTML. No player data clearing is required.

Full-route map previews now earn the route through completions. The complete state restores category/list/appearance controls without using legacy access.

## Verification

- PASS: 23 exploration unit tests, including old-player migration, score preservation, contiguous unlock credit, old-tab policy isolation and accepted/rejected cross-version runs.
- PASS: real-play browser progression — five Rabbit waves open only Fox before game over; close/reload, Block Match success, missed-clear recovery and Panda win milestone.
- PASS: island browser matrix — 30 responsive/theme/language combinations using earned full-route progress.
- PASS: onboarding migration browser coverage before the final run-guard refinements — old local/cloud fixtures, retained scores, welcome and sequential unlocks. Subsequent retries encountered local execution/navigation timeouts; final verification is recorded below when complete.
- NOT VERIFIED: physical iPad Safari, real OAuth/email delivery and cloud unlock synchronization. Unlock progress remains browser-local.
