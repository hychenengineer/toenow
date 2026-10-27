# Mixed material recipes

User request: combine three or four different games' materials for construction and apply this to the other animal homes too. Keep existing saves and individual-game material rewards.

Implementation choices: first small decoration and stage 2 remain own-material to offer an immediate reward. Stages 3/4/5 use 3/4/4 materials, with quantities [12,8,4], [16,12,8,4], [24,16,12,8]. Collaboration decorations use [8,4,4,4]. A circular partner roster gives every material equal recipe participation; Rabbit combines carrots, timber, seeds and bamboo. Game discovery remains driven by normal gameplay, independent of construction, so unavailable sources cannot prevent opening their games.

Use one shared recipe function for spending, affordability, garden UI, generic home UI and result progress. Show every ingredient with a source shortcut. Existing stages/owned objects remain complete without retroactive charges. Keep source assets and all unrelated dirty files. Version shared modules/game entry URLs to refresh returning-browser caches. Publish only preview, verify Cloudflare skip.

Steps: failing ledger/model tests; shared recipes and all UI consumers; focused and full unit tests; rabbit/generic-home/result/lifecycle browser regressions and independent review; scoped preview snapshot/publication and live verification.
