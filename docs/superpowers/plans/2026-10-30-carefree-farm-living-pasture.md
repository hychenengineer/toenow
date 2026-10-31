# Carefree Farm Living Pasture Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline; verify behavior with test-driven-development and request a final fresh review.

**Goal:** Extend the approved farm with roaming animals, friendship, lasting surprise collections, endless untimed orders, explicit quantity selling and better progression/economy.
**Architecture:** Preserve the existing save key and migrate version 1 in memory to version 2. Keep persistent rules in the pure model; add a DOM sprite renderer with independent movement state and keyed animal nodes. The controller continues to own persistence locks and shared SDK/screens.
**Tech Stack:** Vanilla JavaScript, CSS, generated transparent animation sprites, Node tests, Playwright.
**Spec:** User approved friendship + surprises + untimed orders, requested real animals in the pasture instead of icons, and previously requested a visible warehouse/sell entry with typed sale quantities.

## Constraints
- Preserve existing inventory, coins, animals, gifts and unlocked plots/levels. Never retroactively relock a saved farm.
- No starvation, deadlines, streak loss or forced online play. Animal movement is cosmetic and does not accrue rewards.
- Each completed feeding grants friendship once; favorite meals give more. Petting has a ten-minute reward cooldown.
- Five friendship tiers; twenty permanent keepsakes across five species. Gifts retain their original inventory reward, plus eligible keepsake/stamp rewards.
- Three stable orders at once. Fulfillment consumes exact inventory atomically and replaces only that order. No expiring orders or rerolls on reload.
- Four fixed-position decorations cost earned stamps and coins, gated by completed orders. No free-placement building.
- New stage requirements include completed orders; existing stages remain owned. Free grass is a recovery crop; other crops have better net income per plot-minute.
- Only explicit integer quantities may be sold, bounded by current stock. Default one remains compatible with existing model callers.
- Preserve normal/preview isolation and failed-storage/cross-tab protections. Do not publish the new visual version in this implementation step.

## Review focus
- Loading old mature saves and pending meals does not duplicate rewards or reset ownership.
- Double fulfillment, stale sale quantities, zero/negative/fractional input cannot duplicate coins or consume unrelated items.
- Every generated order must be achievable using unlocked crops/owned species; all stages remain reachable.
- Modal typing survives background timer updates; focus, touch and reduced motion remain usable.
- Renderer uses real transparent sprites, maintains movement across controller renders, respects pause/visibility and leaves gameplay state untouched.

### Task 1: Model and migration
- [x] Save a genuine v1 fixture, add failing tests for migration, quantity selling, friendship, collection, order idempotence, decor and economic rates.
- [x] Extend `model.js` with additive migration, content, transaction validation and milestone requirements.
- [x] Update progression simulations to fulfill real orders; verify malformed saves, old gifts, and offline exactly-once behavior.

### Task 2: Living pasture and player UI
- [x] Generate/inspect/slice five species with idle, two walking poses and grazing; preserve original source.
- [x] Implement `pasture.js` with keyed DOM actors, bounded wandering, selection, grazing and reduced-motion support.
- [x] Extend `main.js`, `index.html`, `style.css` and the shared farm language catalog for quantity sales, friendship, album, orders and decorations.
- [x] Expose cost/yield/net profit clearly. Preserve typed values when background state settles.

### Task 3: Verify and report
- [x] Run Node suite and real browser regressions: v1 save migration, sales, repeated orders, gifts, decorations, moving/tappable animals, narrow screens, both languages and live language switching.
- [x] Run storage isolation and shared visit lifecycle checks; inspect screenshots and have a fresh reviewer audit the changes.
- [x] Fix significant findings, retest and deliver actual screenshots plus local preview, with publication and physical-device boundaries stated.
