# English and Traditional Chinese Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent translation catalogs; implement the shared runtime and integration in this thread.

**Goal:** Support English and Traditional Chinese throughout the Hub and all ten games, initially following browser/OS language preferences and remembering explicit choices.

**Architecture:** A shared local translation catalog and runtime localize existing text, accessible attributes, dynamic DOM output and canvas labels. The runtime tracks original English text to make live switching reversible without restarting games. Shared storage and same-origin events synchronize Hub, frames and other tabs. Each page provides an accessible language switch; native modal dialogs also provide an accessible switch while modal.

**Tech Stack:** Browser JavaScript, HTML/CSS, Node test runner, Playwright.

**Spec:** User requests in this conversation and root AGENTS.md.

## Global Constraints

- Preserve existing edits, saves, score storage keys, SDK load order, practice protections and gameplay rules.
- Chinese browser languages (including zh-CN) select Traditional Chinese; otherwise English. Explicit saved choice takes precedence. Do not infer country or request geolocation.
- No publication, commits, cloud changes or external translation services.
- Avoid rewriting generated Flash Brain bundles; localize their rendered interface through shared runtime.

## Review Focus

- Dynamic UI must translate after every update and restore correct English.
- Translating text must preserve markup, event handlers and React ownership.
- Mutation handling must settle, avoid animation-loop work and preserve numeric/symbolic puzzle content.
- Storage failure must not prevent switching; embedded contexts inherit choice.
- Mobile controls must not obscure gameplay; modal controls must remain operable.

## Tasks

- [x] Add failing tests for language resolution, persistence, interpolation and integration.
- [x] Implement shared runtime and catalogs, and integrate every entry page.
- [x] Translate Hub/shared UI and every game's instructions, dialogs, feedback and HUD labels.
- [x] Run npm test and browser checks for all games, live switching, practice, dialogs, reload, embedded and standalone operation.
- [x] Inspect mobile and desktop screenshots, review changes, fix findings and report evidence.

## Execution ledger

- Initial state: prior category edit and Level 5 rule popup are uncommitted; retain them.
- Ruling: support zh-Hant and en for this request; Chinese regional browser preferences use zh-Hant. Region-based behavior is unnecessary because user explicitly chose OS language detection.
- Implemented shared display-only catalogs, reversible DOM/attribute translation and canvas label translation. Native share text follows selected language. Game data and generated Flash Brain bundle remain intact.
- Added missing security/platform imports before SDK on nine game pages to comply with AGENTS dependency order.
- Review found a keyboard activation bug in Flash Brain; reproduced failing Enter test, stopped game shortcut propagation from the language button, and verified Enter/Space for all ten games.
- Review found translation audit only recorded unknown strings; now asserts every audited title/practice/play snapshot contains no unknown English UI beyond Hub brand/domain/about:blank. Source screenshots in card previews remain original images.
- Review requested stronger progress evidence; browser tests now compare exposed game state or HUD snapshots before/after a language round trip, and preserve an actual Level 5 rescue move.
- PASS: npm test, 69 tests, zero failures. PASS: tools/verify-i18n-browser.cjs, 136 checks, zero page errors. Evidence: artifacts/i18n/browser-verification.log and untranslated.json.
- Inspected hub-zh-desktop.png, hub-zh-mobile.png and level5-zh-mobile.png. Mobile touch is Chromium emulation; physical iOS Safari is NOT VERIFIED. Cloud sign-in flows, public deployment and every later gameplay seed are outside this local verification.
