# Illustrated hot spring assets

Generated with the built-in imagegen tool on 2026-10-29 for the user's approved smooth illustrated PixiJS direction. No image-generation API key or fallback CLI was used.

- `sources/approved-reference.png`: user-approved concept; source `exec-f44a7549-cf27-4475-8e75-29001f3845ea.png`.
- `illustrated-atlas.png`: generated RGBA art; source `exec-aa8e4699-93d2-4cc0-a8a8-d6ef6bd0ab80.png`. Runtime texture frames and alpha-bound trimming select sprites without modifying the source image. Contains capybara, stones, bamboo, flowers, lantern, bridge, duck, frog, turtle, otter, rabbit and butterfly.
- `water.png`: generated water texture; source `exec-c4bc3fe8-a184-4593-a022-b2b496b08f02.png`.

Original generated files remain under `C:/Users/HsinYuChen/.codex/generated_images/01a18a5b-b8e5-73a0-b305-e85558de5f7f/`. Existing canonical capybara art is untouched. Runtime assets live in the repository and do not depend on that original directory.

## Atlas prompt

Use the supplied approved hot spring concept as STYLE REFERENCE ONLY. Generate a production sprite atlas with a truly TRANSPARENT background, 1536 by 1024 landscape, evenly spaced EXACTLY FOUR COLUMNS and THREE ROWS (12 equal cells). No grid lines, no labels, no text, no background. Each sprite fully isolated, centered in its cell, generous transparent margins, never touches another cell. Smooth detailed hand-painted cozy 2D game art matching reference, slightly elevated three-quarter view, warm natural palette, rounded organic outlines, no pixel art. Row 1 left to right: (1) one cute caramel capybara with broad muzzle facing right, side three-quarter view, full body with short legs, tiny ears, serene eyes, NO water or platform; (2) compact cluster of three rounded mossy warm-gray boulders; (3) cluster of leafy bamboo stalks with bamboo water spout extending right, no water stream; (4) compact lush cluster of white daisies and small pink flowers with green foliage. Row 2 left to right: (1) warm glowing Japanese stone lantern; (2) short arched wooden footbridge with railings; (3) one adorable small yellow duck facing right, full body; (4) one cute green frog full body. Row 3 left to right: (1) one small turtle with moss-green shell full body; (2) one small brown otter full body; (3) one cream bunny with long ears full body; (4) one orange butterfly with spread wings. Every item is separate on actual transparency, no baked ground or white rectangles. Consistent lighting from upper left. Sprite objects occupy roughly 70-80 percent of their cells, all centered. Art quality like the reference with delicately painted highlights and natural texture. This is a sprite atlas, not a garden scene.

Input: `sources/approved-reference.png`; `transparent_background: true`.

## Water prompt

Create a seamless tileable 1024x1024 texture for the surface of clear shallow turquoise hot spring water in a beautiful smooth hand-painted 2D cozy garden game. Entire frame is water, viewed directly from above. Soft luminous aqua and pale teal, delicate irregular interconnecting sunlight caustic patterns, subtle pale mint gradients, small natural wavy distortions. A painterly illustration with smooth soft edges and restrained detail, not pixel art and not photoreal. Calm and inviting. Consistent even lighting across frame so edges tile seamlessly. No pool borders, no ground, no stones, no plants, no animals, no floating objects, no text, no foam, no large waves, no horizon, no shadows of objects. Water is gentle and clear, low contrast enough for game characters and ripples to remain readable.

No input image; `transparent_background: false`. Actual output is 1254 by 1254, used at its original size.
