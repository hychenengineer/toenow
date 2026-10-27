# Returning-player material collection fix

The user reported reaching Number Pop's result screen without receiving carrots after the materials preview release.

## Evidence and root cause

GitHub Pages serves the HTML and JavaScript with `Cache-Control: max-age=600`. The initial materials release versioned the island renderer but reused the existing SDK and game-document URLs. A returning browser could therefore show the new collection UI while retaining the pre-materials SDK, which has no `finishMaterials` method.

`tools/verify-materials-warm-cache.cjs` reproduces this with a real browser HTTP cache: first cache the SDK from the pre-materials commit, then load the current game. Before the fix, the materials modules loaded but the SDK reward method remained undefined. After the fix, a second SDK request fetches the versioned implementation and the check passes. The exact user's browser cache was not inspected; this is a reproduced matching failure path.

A separate live-site check used an actual canvas click, unchanged score/time, and the natural result screen: Number Pop reached 144 points and awarded 4 carrots after approximately 64 seconds. This establishes that the new implementation works when loaded, and avoids relying solely on the earlier state-driven result tests.

## Change

- Version material-related shared dependencies and the changed game controllers with `materials-20261027-2`.
- Version iframe game-document URLs on both entry and restart, so old HTML cannot retain an obsolete script list.
- Keep existing material balances, challenge records and progression rules unchanged.
- Allow version-query URLs in source-reading utilities and browser instrumentation.

## Checks

- PASS: real HTTP warm-cache regression (failed before fix, passed afterward).
- PASS: `npm test`, 197/197.
- PASS: ten actual game-controller start/end paths, receipt visibility, duplicate protection, Flash normal/practice autostart, interruption protection and Hub return-to-home.
- PASS: Number Pop / Flash shared-screen matrix, 8 standalone, 2 iframe, 2 practice cases.
- NOT VERIFIED: physical iPad Safari.

Evidence is in `artifacts/material-collection-fix/` and the corresponding `artifacts/material-collection-*.log` files.
