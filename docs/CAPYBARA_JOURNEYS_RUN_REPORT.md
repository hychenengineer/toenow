# Capybara little journeys — implementation and verification

2026-10-27. Local preview: http://127.0.0.1:8782/games/capybara-drift/

Implemented 90 active-second trips with automatic landing, configuration-driven shared journey title/results (no levels, waves or competitive score panels), actual findings and travel sharing. Each new trip draws coherent combinations from 10 scenes, 6 times, 8 weather patterns, 12 friends, 24 collectible identities and 12 events, avoiding recent itinerary duplicates. Friends, special findings and optional building gifts enter at 15/35/55 seconds. Gift events offer a real pickup at 65 seconds; riding and lotus events have separate visuals.

Canvas presentation adds gently evolving light, scene-specific bank scenery, soft rain/mist/night/rainbow effects, subtle storm light and optional distant synthesized rumble, finger-following water rings and a trailing wake. Touch pointer capture, keyboard steering, pause/background freeze, mobile portrait/short landscape and sound toggle remain supported. Persistent collection book and existing float wardrobe use saved local progress.

At most one building resource is generated per trip; a collected resource enters the existing shared construction ledger. Atomic resource receipts and monotonic inventory receipts protect against reloads, repeated finish and interrupted writes. Practice performs no progression, wallet, wardrobe or material writes. Old wallet/cosmetics are preserved; legacy sessions migrate to finite trips. User specifically requested no levels for this game; shared cognitive screens remain unchanged.

PASS: npm test, 244/244, 0 failures — artifacts/capybara-journeys-tests.log.
PASS: full shared-screen Edge regression, 40 standalone + 10 iframe + 10 practice — artifacts/capybara-journeys-shared.log.
PASS: journey Edge matrix, EN/zh-Hant at 1100x850, 390x844, 320x568 and 844x390, synthetic touch ripples/steering, real pickups, pause/book/Escape, save/restore, material cap, automatic landing/retry, practice byte isolation, Hub launch/restart/pause/exit — artifacts/capybara-journeys-browser-final.log.
PASS: independent review; both findings fixed and rechecked (Escape behind collection book; advertised gift without actual pickup).
PASS: scoped git diff --check for tracked touched files.

Screenshots: artifacts/capybara-journeys/.
Reproduce: npm run serve; set TOENOW_TEST_URL to server URL and NODE_PATH to configured Playwright runtime; run node tools/verify-capybara-browser.cjs and node tools/verify-shared-screens-browser.cjs. Default journey test URL is 127.0.0.1:8782, shared regression accepts TOENOW_TEST_URL.

NOT VERIFIED: physical iPhone/iPad Safari, physical finger feel, subjective replayability and actual speaker audio quality. Browser checks use Edge and synthetic touch; scene screenshots use an injected itinerary/time hook while exercising the production canvas and UI. No production test hooks are shipped. Browser-local data only; no commit, push or publication. Existing unrelated modifications and source art preserved.
