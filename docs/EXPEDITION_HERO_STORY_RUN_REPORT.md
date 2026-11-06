# Forest Guardian: five-chapter hero expedition

Implemented 2026-11-06 on `codex/expedition-hero-story`, based on `8852f8e`.

## Delivered behavior

- Normal Animal Siege entry opens the fixed-hero five-chapter story. Hazel commands from behind the lines; the hero is not a board unit.
- Forest, Rock and Moon factions; Rock reduces damage and Moon moves farther. The final enemy commander casts under the same mana/turn restrictions.
- Four growing stats, one passive, a permanent Guardian/Sage talent, six unlockable spells (three carried), six rewards and two equipment slots.
- Each chapter offers a supply choice, existing camp recruitment/training, a distinct encounter and a story/reward transition. The ending appears before the existing shared results are revealed.
- One local adventure save with Continue and confirmed New Adventure. Defeat, retreat, reload during battle and Hub restart preserve the departure checkpoint. Practice reads a fresh run and never writes story or record saves.
- `?mode=classic` and existing `?mode=expedition` retain the original three-fort campaign; `?mode=battle` retains the original skirmish.
- New title copy remains in shared screen configuration; all title/result templates remain owned by ToenowScreens.

## Verification

- `npm test`: 18 pretests + 342 main tests, **360 passing**, zero failures.
- Hero/story core: 21 tests including real legal five-chapter simulations with both talents, status expiry, no resurrection, one-time rewards, corrupt/blocked storage, and checkpoints.
- `tools/verify-hero-story-browser.cjs`: real UI five-chapter completion at 1280/English and 390/Traditional Chinese. Casts, talent selection, equipment, loadout limit, reload continuation, shared record persistence, epilogue, sharing and confirmed new game verified.
- Same runner with `TOENOW_HERO_EXTRA=1`: 320px pause/retreat/reload/Chapter-2 restart; blocked/corrupt storage; first-play lesson isolation; hero-modal pause/resume/restart; actual Hub iframe five-chapter practice run and return to Expedition Island. Story and best-score/wave values stayed unchanged in practice.
- `tools/verify-shared-screens-browser.cjs`: 48 standalone cases, 12 iframe cases, 12 practice cases across the complete shared catalog. Final Animal Siege rerun: 4 standalone, 1 iframe, 1 practice.
- `tools/verify-animal-field-orders-browser.cjs`: original battle controls passed at 1280/ZH, 1024/EN, 390/EN and 320/ZH.
- Fresh independent code review found a Hub restart progress-loss bug; fixed and checked with an actual Chapter-2 spell followed by GAME_RESTART. Scoped re-review found no remaining actionable issue.
- Screenshots inspected for map, hero panel, phone battle and ending. `git diff --check` clean.

## Reproduction

Use installed Playwright via `NODE_PATH=C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`, start the local server with `PORT=8786`, and set `TOENOW_TEST_URL=http://127.0.0.1:8786` for browser tools. Evidence is in `artifacts/hero-story/` (not committed).

## Design decisions and limits

Existing fox/army/terrain art is reused; the two other factions have functional army traits but do not yet have distinct species art or playable heroes. Full mana restoration happens after chapter victory, after reward equipment is applied; ordinary equipment swapping cannot refill mana. The existing phone battlefield retains horizontal panning for readable unit controls.

These are Edge browser tests with simulated viewport/touch settings, not physical iPad or Safari validation. Work is local only; no push or deployment.
