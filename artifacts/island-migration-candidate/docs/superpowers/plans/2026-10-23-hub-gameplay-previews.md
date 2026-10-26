# Hub Gameplay Previews Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Preserve all pre-existing uncommitted changes. Commit or push only when explicitly requested by the user; deployment requires a separate request.

**Goal:** Extend the approved three-game sample to all ten games and integrate authentic screenshot tiles and hover videos into the Hub.

**Architecture:** Keep existing iframe launch and localization. Store derived posters and silent clips in assets/gameplay-previews. A separate preview controller handles delayed playback, cancellation, focus, touch preview, and cleanup. Recording scripts observe game state for coordinates and use real mouse input; they never advance game state through test hooks.

**Tech Stack:** Existing HTML/CSS/JS, Node test runner, bundled Playwright, browser MediaRecorder.

**Spec:** User-approved sample at artifacts/hub-preview-sample/index.html and current AGENTS.md.

## Constraints and review focus
- Capture real gameplay and derive every poster from its corresponding video. Preserve complete gameplay bounds.
- Only one tile plays, after 400ms; cancelled or late play promises must not restart a discarded video.
- Filtering, opening a game, leaving the page, and replacing tiles must stop playback.
- Preserve Hub iframe lifecycle, sharing access, localization, keyboard activation and saved records.
- Test 390px touch behavior in a browser; physical iPad remains NOT VERIFIED.

## Tasks
- [x] Record seven remaining games through real input; inspect the clips and choose representative posters. Reuse approved three clips.
- [x] Add failing controller tests to tests/hub-runtime.test.cjs; implement shared controller with lazy loading, one-player policy, cleanup and playback fallback.
- [x] Replace verbose Hub card content with authentic image/video, small name and preview action. Preserve existing game launch and compact sharing access.
- [x] Add video MIME and byte-range support to the local server; verify 206 and 416 responses.
- [x] Run npm test, browser tests for all ten tiles in both languages, filtering, focus, touch, playback failure, iframe launching and closing. Visually inspect desktop/mobile screenshots and clips; fix and retest.

## Execution ledger
- Working in the existing checkout because the approved sample and current game revisions are uncommitted here. Changes stay additive and scoped; no reset, clean, commit or deployment.
- PASS: npm test 84/84. New controller and server tests were observed failing before implementation and passing afterwards.
- PASS: Hub browser regression 168 checks, no page errors. Shared-screen regression: 36 standalone cases, 9 iframe cases, 9 practice cases.
- Review found no important functional bugs. Corrected the theater closure assertion to check its actual `open` class and iframe `about:blank`; independently retested all ten open/close/unload cycles.
- All clips are about eight seconds, muted and captured through real pointer input. Source mappings and poster times are in assets/gameplay-previews/provenance.json. Source artwork and game implementation were not modified for recording; read-only inspection hooks were injected into isolated recording pages.
- Physical iPad Safari: NOT VERIFIED. Browser touch emulation at 390px passed; desktop and mobile captures were visually inspected.
- Follow-up: user requested tile area reduced by half. Width and height scale by sqrt(0.5), reflowing into rows; measured area ratios at 1440/1100/768/390px were approximately 0.5. Later user explicitly requested a GitHub push; source changes and final media are included, raw recordings and local validation artifacts remain local.
