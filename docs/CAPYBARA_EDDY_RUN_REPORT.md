# Capybara winding river and eddy — 2026-10-27

Local playable preview: http://127.0.0.1:8782/games/capybara-drift/

The river now uses a stronger curved centerline, shared by banks, scenery, water, swimmers, pickups and touch inversion. A small eddy becomes available during travel seconds20–45, on a side determined by the saved trip. Sliding into it requires deliberate steering and actual proximity. The swimmer orbits automatically; route elapsed/countdown freezes while flowTime, ordinary item spawning, pickup motion, ripples and playful animations continue. Pickups briefly orbit and then pass downstream. Swipe toward the marked main-channel outlet, use Keep exploring, or press ArrowUp to leave; travel countdown resumes. Tap the swimmer, use Make a splash, or focus the canvas and press Space for a playful turn and water droplets. Turning follows the projected tangent with a smoothed angle.

Pause/background stop both clocks. Resume and reload preserve the trip, orbital state, pickup state and single-material flags; old saves default missing flow/eddy fields safely. Building gifts retain the one-per-trip receipt. Practice remains nonpersistent. SDK results use total active flow duration so time spent enjoying the eddy is reported correctly. Shared title/result and other games retain their existing flow. The initial implementation provides one optional eddy per trip; more types of stopping places can build on this state model.

PASS npm test:251/251 — artifacts/capybara-eddy-tests.log.
PASS dedicated actual-browser touch matrix:8 cases, EN/zh-Hant at390x844,320x568,844x390,1100x850. Entry/orbit/frozen clock/flow, button and swimmer-tap play, pause, reload, swipe and button exit — artifacts/capybara-eddy-browser-final.log.
PASS original journey browser matrix:8 cases plus Hub launch/restart/pause/exit, collection, material receipt cap/restore and practice byte isolation — artifacts/capybara-eddy-journey-regression.log.
PASS shared screens:40 standalone,10 iframe,10 practice — artifacts/capybara-eddy-shared.log.
PASS independent read-only review; small tangent-orientation finding fixed and re-reviewed; no remaining P1/P2 findings.
PASS scoped tracked diff whitespace check. Geometry module is covered by two new Node tests in npm test. Long deterministic eddy simulation checks entity bounds and continued collection for1200 seconds.

Screenshots:artifacts/capybara-eddy/.
Reproduce:npm run serve, set TOENOW_TEST_URL and configured Playwright NODE_PATH, run node tools/verify-capybara-eddy.cjs and existing browser commands.

NOT VERIFIED:physical iPhone/iPad Safari and physical finger comfort. Browser uses Edge and synthetic touch; a test-only injected hook positions the journey at the eddy stage, while entry/exit, simulation, drawing, controls and storage run production code. No test hooks shipped in production. No commit, push or publication. Existing source art, unrelated edits and saved progress preserved.

2026-10-27 visual follow-up: removed accumulated swimmer wake rings, finger-drag ripple rings and the three fixed swimmer rings after user reported visual clutter. Reduced eddy spiral to one quiet curve. Kept eddy mechanics, touch steering and tap splash. npm test251/251 PASS; browser eddy matrix rerun (artifacts/capybara-clean-water-browser.log). Horizontal side scrolling remains a proposed direction pending user's choice, not implemented in this cleanup.

2026-10-27 icon summary follow-up: shared journey results now contain only actual item/material icons, friend icons and quantity badges in the summary. Removed the heading/subheading, four prose detail cards, empty-state prose, decorative hero and account promotion from this journey variant; cognitive games retain their original screens. Names remain in accessible labels/tooltips and sharing. Header has a visible pause icon during gameplay and results, opening the existing rest/collection/wardrobe menu. Hub mirrors the same control and keeps it available on results. Returning from result pause restores the same result and never resurrects a completed checkpoint. PASS251 unit tests, shared browser40standalone/10iframe/10practice,8eddy cases,8journey cases, plus dedicated Hub result-pause/resume. Evidence artifacts/capybara-icons-*.log. No publication.
