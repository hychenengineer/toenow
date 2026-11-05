# Animal Siege battle orders and first-play rehearsal

Implemented locally on 2026-11-04; no commit, push or deployment. Existing branch `codex/island-explorer` and unrelated changes preserved.

- Desktop orders now live in the right command panel; narrow screens use a fixed bottom dock.
- A proposed destination exposes attackable enemies. Selecting one shows damage and a single Move & attack order; selecting/cancelling does not mutate the battle.
- Move only preserves the attack opportunity. Move & end turn explicitly commits the selected move before ending the whole player turn. Remaining squads and automatic defense are explained.
- First play uses a separate, gated five-step rehearsal with adjacent spotlight guidance. Skip and pause-menu replay are supported. Completing/skipping restores the exact saved real battle; lesson losses do not enter the expedition or records.
- Rotation keeps the required lesson target visible. Queued attacks respect pause/resume and are cancelled on restart. Practice-tier restart preserves the chosen real wave. The mobile dock is hidden at game over.

## Verification

- `npm test`: pretest 9/9 and main suite 315/315 PASS.
- `verify-animal-orders-browser.cjs`: PASS at desktop/mobile sizes and EN/Traditional Chinese, including expedition, rotation, combined attack/cancel, move only/end turn, rehearsal completion/replay/skip, animation duplicate click/pause/restart, iframe practice tier 5, handbook and record isolation.
- `verify-animal-move-confirmation-browser.cjs`: 3 configurations PASS.
- `verify-animal-attack-guidance-browser.cjs`: 3 configurations PASS.
- `verify-animal-unit-guide-browser.cjs`: desktop/mobile, standalone/expedition and iframe PASS.
- Full shared-screen browser suite: 48 standalone, 12 iframe, 12 practice PASS. Final Animal Siege rerun: 4 standalone, 1 iframe, 1 practice PASS.
- Real skirmish victory/retry/pause/practice/title: 1280 Traditional Chinese, 390 Traditional Chinese, 390 English PASS. Its running Hub check initially expected the six real squads while first-play rehearsal correctly showed two; returning-player setup was updated, and `TOENOW_SIEGE_HUB_ONLY=1` rerun PASS for opening and exiting the real Hub iframe.
- Independent review verified the rotation fix and found no remaining concrete issues in the focused review.
- `git diff --check` and scoped controller whitespace check PASS. No physical-device acceptance claimed.

Browser logs/screenshots: `artifacts/animal-orders*`. Original changed game files retained under `artifacts/animal-orders-before/` because Animal Siege files were already untracked at task start.

Preview: http://127.0.0.1:8774/games/animal-siege/?mode=battle
