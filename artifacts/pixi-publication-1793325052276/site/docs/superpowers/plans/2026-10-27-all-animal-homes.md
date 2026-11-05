# All ten interactive animal homes

User-approved expansion: complete the other nine homes with environments, character conversation, game launch, visible construction and decoration just like Rabbit. Preserve material recipes, balances, built stages, owned/placed objects, scores and discovery rules. Publish only preview, never production.

Use one shared scene renderer driven by per-home configuration. Keep Rabbit's module API as a compatibility adapter and its existing artwork. The other nine homes use their existing canonical animal characters plus new themed starter backgrounds and six-object construction/decor atlases. Stage 1 is visibly modest with open building space; four purchased additions appear at stages 2–5. Two craftable decorations use the existing welcome/together keys. Keep source PNGs and imagegen prompt/provenance manifests.

Configuration contract: keyed by gameId with species/place, playLabel, starter description, unique welcome/return/ready/complete/game-tip lines plus ambient chat lines; projects [{id,name,stage,sprite,position}], background/character/atlas paths. English and Traditional Chinese. Conversations include state-aware missing materials without becoming a gate to playing. All homes share play/chat/build actions, fixed placement and recipe/source links.

Tasks:
1. Content/config tests then all-ten bilingual configurations (separate content owner).
2. Model/markup tests then shared renderer and Rabbit adapter (separate renderer owner).
3. Parent owns artwork generation/inspection, island event integration, browser regressions and preview publication. No other agent edits these files.
4. Test fresh/returning saves, no-spend preview, all stages and decorations for every home, dialogue changes, source travel, actual game launches/receipts, EN/ZH 1440/390/320/landscape, keyboard focus, missing art and blocked/locked states. Run npm test and independent review.
5. Publish explicit source snapshot to preview, verify live bytes/interactions, remote main unchanged and Cloudflare skipped. Physical iPad Safari remains NOT VERIFIED.
