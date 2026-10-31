# Horse, gentle four-leg motion and illustrated surprise receipts

User-requested update, 2026-10-31. Publication target: preview only.

- Replaced the pig with a grass-fed horse; favorite food is carrot. It brings back forage bundles (same value as the former truffles) and retains pumpkin surprise seeds. Shop, pasture, care copy and collection use Horse / 小馬.
- Read-only load migration converts existing pig species, truffle stocks/order requirements, and pig keepsake IDs. Growth, friendship, queued meals, pending gifts, coins, order payouts and ownership remain. Existing saves are not rewritten until a normal action saves. Invalid saves and practice isolation keep their safeguards.
- Replaced whole-image walking frames with a stable illustrated body and four independent limb groups: front-left/front-right/hind-left/hind-right. Each moves with a different phase, capped at 3.5 degrees. Animation stops when the animal stops moving, is selected via pointer/focus, the visit is paused, a dialog is open, the page is hidden, or reduced motion is requested.
- Surprise receipt shows the actual gift picture and quantity, a newly earned keepsake picture if applicable, and the friendship stamp. Closing the receipt does not grant rewards a second time. Both languages and narrow screens are covered; the dialog has an accessible name.
- Original art is preserved. Rig and collectible atlas sources are in assets/carefree-farm/rig-v1 and rewards. Portrait and cropped sprites derive from these sources.

Verification on the isolated publication tree:
- PASS npm test: 7 pretests + 240 main tests.
- PASS farm browser: 14 groups; living-farm browser: 9 groups; new reward/migration browser: 7 groups. No page errors.
- PASS four-leg regression: all 20 limb groups change independently within ±3.5 degrees; modal pause and reduced-motion checks pass.
- PASS both failed-storage/preview/cross-tab regressions.
- PASS shared visit screens: 8 standalone / 2 iframe / 2 practice.
- PASS desktop/mobile image inspection and independent code review. Physical iPad Safari not verified.
