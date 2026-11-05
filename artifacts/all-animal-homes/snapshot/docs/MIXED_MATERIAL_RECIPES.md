# Mixed material recipes

All ten explorer homes use mixed recipes. Each normal game still awards only its own material, 4–8 per valid run. No random drops or new currencies were added.

| Construction | Own item | First friend | Second friend | Third friend | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Stage 2 | 16 | — | — | — | 16 |
| Stage 3 | 12 | 8 | 4 | — | 24 |
| Stage 4 | 16 | 12 | 8 | 4 | 40 |
| Stage 5 | 24 | 16 | 12 | 8 | 60 |
| Welcome decoration | 4 | — | — | — | 4 |
| Collaboration decoration | 8 | 4 | 4 | 4 | 20 |

For Rabbit, the ingredient order is carrots, timber, seeds and bamboo. The shared circular roster is Rabbit → Beaver → Elephant → Panda → Cat → Fox → Owl → Otter → Seal → Squirrel → Rabbit. Each home uses itself followed by its next three friends. Every material therefore appears in exactly four collaboration recipes, preventing one universally required material from becoming the bottleneck. The total for four construction projects is 140 ingredients, compared with the former 192 own items.

The initial small decoration and first construction remain possible using only the home's own game. Later sources may need discovering through normal game progress; construction is not a prerequisite for discovery. Existing balances, stages and owned/placed decorations survive unchanged, with no retroactive charges.

`ToenowMaterials.upgradeRecipe` and `recipe` are the single pricing source for spending, affordability, Rabbit's scene, the other nine home panels and result receipts. `COSTS` now describes total ingredient quantities, not an own-item price. Every ingredient in a home recipe has a source shortcut. Shared modules and all ten game entries use `mixed-materials-20261027-1` to refresh returning-browser caches.

Validation: 206 unit tests; all-ten-home browser checks for missing-ingredient protection, source travel, exact three-item deductions and four-item next recipes; Rabbit desktop/mobile/landscape EN/ZH, construction/decor/reload; all-ten-game start/end/receipt lifecycle, duplicate protection and practice exclusion; generic material panel/standalone SDK regression; Number Pop shared screens (4 standalone, 1 iframe, 1 practice); four-material results at 320/390 EN/ZH. The browser end hooks/clock offsets are test fixtures. Physical iPad Safari is NOT VERIFIED. Preview publication/live evidence is under `artifacts/mixed-materials`, excluded from the source commit.
