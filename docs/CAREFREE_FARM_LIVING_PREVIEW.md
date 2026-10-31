# Carefree Farm: living pasture preview

Local preview: http://127.0.0.1:8774/games/carefree-farm/

Implemented 2026-10-30. This version is local only; no commit, push or deployment was performed for this update.

## Player changes
- Five species appear as transparent illustrated animals directly on the grass, with idle, walking and grazing poses. Baby animals are smaller. Pointer/focus pauses a moving animal for selection. Reduced-motion, hidden tabs, paused visits and open dialogs suspend movement.
- Five friendship tiers earned from completed meals and petting (ten-minute reward cooldown), twenty permanent keepsakes, and three persistent untimed orders. Favorite food grants extra friendship. Gifts retain their inventory rewards and can add keepsakes and stamps.
- Four fixed pasture decorations earned with completed orders, stamps and coins.
- Clear Warehouse / Sell entry. Choose an item, type a positive integer or use minus/plus/All, see the total, then confirm. Background crop completion preserves the typed draft and focus.
- New milestone thresholds: 6 / 24 / 72 / 180 harvests, plus 0 / 2 / 6 / 15 orders for levels 2–5. Existing unlocked levels stay open.
- Free grass remains a recovery crop; other crops yield higher net profit per plot-minute. Seed buttons show yield; crop catalog shows whole-harvest net profit.

## Save protection
The existing `toenow_carefree_farm_v1` key is retained. Valid version 1 payloads migrate in memory to version 2 without writing on load. Coins, inventory, animals, pending meals/gifts, plots and unlocks remain. Practice, malformed-save, failed-write and concurrent-tab protections remain. Loading from another origin (including localhost versus GitHub Pages) uses that origin's own storage.

## Verification
PASS: npm test, 9 pretests + 278 main tests.
PASS: existing farm browser suite, 14 groups, zero page errors.
PASS: new living-farm browser suite, 9 groups, zero page errors: real v1 migration, typed sale across a harvest completion, invalid quantities, exact order consumption, collection, decorations, movement/modal pause/reduced motion, live language changes and eight actors at widths 320/390/550/650/844/1100.
PASS: two failed-storage/preview/concurrent-tab regressions.
PASS: shared farm + Capybara Garden screens, 8 standalone / 2 iframe / 2 practice cases.
PASS: independent code review; fixed narrow-width actor clipping/overlap and added browser geometry coverage.
PASS: inspected desktop and mobile screenshots; corrected unequal atlas row boundaries to eliminate clipped sprites.
NOT VERIFIED: physical iPad Safari, long-term player retention or exact hours to complete the new progression. Milestone pacing is an initial balance pass.

Screenshots and logs: `artifacts/carefree-farm/`, including `living-pasture.png`, `living-mobile.png`, `living-sale.png`, `living-orders.png`, `living-browser.log`, `full-living-tests.log`, `shared-living.log`.
