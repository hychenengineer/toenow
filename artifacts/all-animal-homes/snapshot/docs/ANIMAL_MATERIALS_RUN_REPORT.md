# Animal materials — first playable version

Implemented locally on 2026-10-26. No commit, push or deployment. Existing uncommitted work was preserved.

## Player loop

The ten explorer games each award their own material. Carefree Capybara retains its separate economy. Normal results award 4 items, plus up to 4 for additional waves (one extra per three waves beyond the starting wave). Positive score and at least 10 seconds elapsed are required; Train permits one-second completed attempts because each puzzle is a short independent result. Plausibility guards still apply. Practice, tutorial, preview, duplicate reports and interrupted/pagehide partial-save reports do not award.

Each animal home has five construction stages, independent of challenge level. Existing homes inherit their previous highest-record appearance once. New best records never automatically spend materials or upgrade a home afterward. Stage upgrades cost 16, 32, 56 and 88 own items. Each home has a 4-item starter decoration and a collaboration decoration costing 12 own items plus 4 partner items. Decorations are small icon ornaments with place/put-away controls; they are not animated furniture scenes.

Open an animal home on the island to build. The collection drawer shows all ten balances. Recipe ingredients link to their source locations, including the existing discovery explanation for locked destinations. Result receipts show the earned amount, next construction cost and a return-to-home action. Standalone results link back to the Hub with `?home=game-id`.

Balances, construction stages and decorations use the separate `toenow_materials_v1` browser-local ledger. No existing score/save key is replaced. This first version does not synchronize materials between devices or accounts. Web Locks serialize reward/build writes across same-origin tabs when the browser supports them; older browsers fall back to synchronous read-modify-write.

## Verification

- PASS: `npm test`, 197/197 tests, including 11 materials/input regression tests.
- PASS: `tools/verify-materials-browser.cjs`: construction, exact recipe spending, placement toggles, save/reload, all ten standalone SDK receipts, EN/Traditional Chinese at 1440/390/320 widths.
- PASS: `tools/verify-materials-lifecycle-browser.cjs`: actual production start/end controller paths for all ten games, visible receipts including Train loss, duplicate guard, Flash initial autostart and practice, interruption, Hub iframe receipt returning to the correct home. End conditions are driven by test-only injected controller hooks; no production debug entry points or free-material controls were added.
- PASS: `tools/verify-island-browser.cjs`: ten responsive/language combinations, all locations, art fallback, practice/normal flow, keyboard/dialog focus, reload and score/construction separation. The regression's old automatic-building assertions were updated for the intentional new behavior.
- PASS: full shared-screen regression: 40 standalone, 10 iframe and 10 practice cases. Final Number Pop/Flash retest: 8 standalone, 2 iframe and 2 practice cases.
- PASS: independent code review; Train receipt placement and Flash autostart findings fixed and verified.
- PASS: `git diff --check`.
- NOT VERIFIED: physical iPad Safari; real-device long-term economy pacing and retention.

Browser tests used installed Edge through Playwright with `NODE_PATH=C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules` and `TOENOW_TEST_URL=http://127.0.0.1:8765`.

Evidence: `artifacts/animal-materials/`, `artifacts/animal-materials-tests.log`, `artifacts/animal-materials-browser.log`, `artifacts/animal-materials-lifecycle.log`, `artifacts/animal-materials-island.log`, `artifacts/animal-materials-screens.log`, and `artifacts/animal-materials-screens-final.log`.

## Related fix

Number Pop initialized its click-deduplication timestamp to zero, which ignored the first start within 250ms of iframe loading. Initializing it to negative infinity accepts that first start while still suppressing the following compatibility click. A failing-first regression and real iframe flow cover this.
