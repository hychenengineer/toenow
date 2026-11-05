# Capybara Drift playable prototype — 2026-10-26

Local preview: http://127.0.0.1:8771/games/capybara-drift/

Implemented endless fixed-speed drift; mouse, pointer/touch and arrow steering; bubbles +1, yuzu +5, petals +3, friends +10; forgiving rocks and missed items; four looping scenes (bamboo, petals, rain, stars); friend queue; optional synthesized sound; pause/resume; four purchasable/equippable float colors; durable local wallet and active journey checkpoints; shared title/result/practice/share; bilingual copy; standalone and Hub iframe entry. Wave progress tracks 45-second journey segments, without increasing difficulty. Maximum four friends are drawn while the total encounter count keeps growing.

Progress is browser-local. A single saved envelope holds both credited score and wallet to prevent duplicate credit on restore. Practice does not write checkpoint, wallet, cosmetics or best records. Local storage denial keeps play available without persistence. Refresh opens the title with Continue your drift. Starting a new normal drift replaces the previous active journey. Finish clears only the active journey; wallet, floats and best records remain.

Carefree uses separate registry metadata and is excluded from the Explorers discovery route. The Hub provides a permanent entry and list card. Relaxing scores do not affect cognitive ratings. Existing island terrain, landmark art, art manifest, saves and unrelated dirty changes are preserved.

## Verification

- PASS: `npm test` — 186 tests, 0 failures. Evidence: `artifacts/capybara-npm-test-final.log`.
- PASS: complete shared-screen Edge browser regression — 40 standalone, 10 iframe, 10 practice cases. Evidence: `artifacts/capybara-all-shared-screens.log`.
- PASS: gameplay Edge matrix, EN/ZH at 1100×850, 390×844, 320×568 and 844×390; mouse and synthetic touch drag, arrows, actual collection, friends, pause, float purchase/equip, reload continuation, practice isolation. Fresh-player Hub guest onboarding, entry, toolbar restart and exit also passed. Evidence: `artifacts/capybara-browser-verified.log`; screenshots in `artifacts/capybara-drift/`.
- PASS: long deterministic simulation (>900 seconds), bounded objects, non-decreasing score, stable speed, checkpoint idempotence, corrupted/blocked storage, purchase crediting and cognitive-rating isolation.
- PASS: independent static code review; cognitive-rating finding fixed and regression-tested.
- PASS: `git diff --check`.
- NOT VERIFIED: physical iPad Safari and physical touch hardware, subjective long-session engagement.

## Reproduce

Run `npm run serve` (default port 8765), set `TOENOW_TEST_URL` to that URL, then run `node tools/verify-capybara-browser.cjs` and `node tools/verify-shared-screens-browser.cjs`. Browser commands require the configured Playwright runtime; this session used Edge and NODE_PATH `C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`.

## Art and scope

Original editable SVG illustrations and generated WebP encodings live under `assets/animal-island/sources/capybara/` and `assets/animal-island/capybara-*.webp`. Generator: `tools/prepare-capybara-art.cjs`. Gameplay uses original canvas drawing. This is code-drawn prototype art, not Blender or AI painting. Existing generated watercolor source assets remain unchanged.

The complete Carefree Island map, hats, and habitat growth are not part of this prototype. No remote publication, push or commit was performed.
