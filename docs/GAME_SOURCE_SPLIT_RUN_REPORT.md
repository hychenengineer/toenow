# Game source split — 2026-10-26

Completed Spot Quick first, then the seven other large inline games. Existing modular Animal Rescue Train and Flash Brain production files were left intact. No commit, push or deployment was performed.

## Result

Each refactored game has `index.html`, `style.css`, `main.js`, `rules.js`, `audio.js` and `renderer.js`. Spot Quick and Shadow Match also have `shapes.js`; Space Scale and Tap Match also have `data.js`. Each directory has a README; the editing map is in [GAME_MAINTENANCE.md](GAME_MAINTENANCE.md).

| Game | Original HTML lines | Refactored HTML lines |
| --- | ---: | ---: |
| spot-quick | 5,866 | 108 |
| number-pop | 3,606 | 194 |
| ball-track | 3,576 | 212 |
| shadow-match | 2,852 | 192 |
| space-scale | 2,842 | 166 |
| add-up | 2,484 | 182 |
| tap-match | 1,964 | 153 |
| block-match | 1,941 | 136 |

Counts include blank lines. Code was relocated by responsibility, not deleted to meet a size target. The controller still owns the game loop, input, records and lifecycle. Renderers read live values through explicit getters so resizing or replacing a board does not leave stale state. Existing shared screens, localization and SDK ownership are retained.

## Verification

- **PASS:** baseline `npm test`: 160 tests, zero failures.
- **PASS:** final `npm test`: 164 tests, zero failures; includes new module/source-reader, rule invariants and live-renderer dependency tests. Log: `artifacts/refactor-final-npm.log`.
- **PASS:** Spot Quick gate before remaining games: 33 focused tests and EN/ZH desktop/mobile shared-screen checks, plus iframe and practice.
- **PASS:** full real Edge shared-screen matrix, loading external production modules: 36 standalone language/size cases, 9 iframe cases, 9 practice cases; replay, sharing and return-to-title checked. Log: `artifacts/refactor-final-shared-browser.log`.
- **PASS:** real tutorial input on all 10 games at 390px/en, 10 skip/cancel scenarios, 10 iframe scenarios, keyboard controls, live language refresh and existing train save preservation. This was a focused tutorial run, not the full tutorial language/size matrix. Log: `artifacts/refactor-tutorial-final.log`.
- **PASS:** timing regression for Space Scale, Ball Track and Tap Match: 3 games × 2 widths × 2 languages, including rewards/penalties, pause, timeout, restart, iframe, tutorial and practice protection. Log: `artifacts/refactor-timing-final.log`.
- **PASS:** all eight stylesheets match their original inline CSS byte-for-byte. Spot Quick retains all 170 unique specimens and 50 categories; its original drawing-function digest is preserved in the tests.
- **PASS:** independent review found no significant issues. Original named function bodies were compared after normalizing renderer scene accesses; extracted dependencies and initialization boundaries were reviewed.
- **PASS:** visual inspection of the mobile title contact sheet and desktop active gameplay. Screenshots: `artifacts/refactor-final/`, `artifacts/total-time/`.
- **PASS:** `git diff --check`.
- **NOT VERIFIED:** physical iPad Safari. Desktop Edge/browser touch emulation does not prove physical-device behavior.

## Test harness corrections

Tests and browser instrumentation now follow game-local script files. The shared-screen suite injects its state hook into `main.js`, leaving real dependency loading intact. Two existing browser harness assumptions were corrected: the timing suite's frozen animation-frame environment needs direct button activation; the tutorial language check now invokes the production language API instead of querying a removed language button. Production gameplay behavior was not changed for these fixes.

## Maintenance implications

Styling, rule tuning and drawing changes can now be located and checked independently. `npm run test:modules` provides a fast focused check during iteration; required full completion checks still apply. No measured speedup claim is made for future work, image generation or full browser regressions.
