# Carefree Farm illustrated assets

Generated specifically for this game with the built-in image generation tool on 2026-10-30.

- `reference.png`: approved two-tab concept with 無憂農場 / Carefree Farm title.
- `animal-atlas-source.png`: original 3×2 atlas; five baby animal illustrations and a harvest bundle. Retained unchanged.
- `meadow-source.png`: original illustrated empty meadow. Retained unchanged.
- `crop-atlas-source.png`: original transparent 4×3 atlas of twelve crops. Retained unchanged.
- Individual `.webp` sprites are extracted atlas cells; `meadow.webp` is an optimized background.
- `../carefree-farm-preview.png`: resized reference used as a Hub preview.

Original generated files are also preserved under the Codex generated_images folder. No existing game art was replaced.

- Living pasture update: `motion/source.png` preserves the transparent five-species/four-pose generated atlas. `motion/<species>-0..3.webp` are idle, two walking poses, and grazing. Atlas rows are visually bounded at y=0,260,495,745,1040,1402 (1122px wide); columns at x=0,280,560,840,1122. Cells are contained on transparent 280px squares, bottom aligned. The illustrated grass, original reference, and original shop portraits remain unchanged.

- 2026-10-31 front-leg fix: `motion/walk-v2/source.png` contains corrected extended-stride / bent-knee passing poses. `tools/prepare-carefree-walk.cjs` extracts the ten disjoint sprites and aligns each pair on its head, preventing neighboring-row fragments and size shifts. The renderer uses these two walking poses; original idle/grazing images and source atlases are preserved. `tools/verify-carefree-farm-walk.cjs` verifies all five species switch both new assets and freeze while a dialog is open; front-leg silhouettes were also inspected visually.

- 2026-10-31 horse and subtle four-leg update: `rig-v1/source.png` is the new generated cutout atlas (sheep, horse, cow, alpaca, llama; body/front/hind). `tools/prepare-carefree-rig.cjs` extracts the fifteen parts. The SVG renderer duplicates front/hind sprites into four independently phased limbs, capped at 3.5 degrees, with neutral standing poses when stopped. `horse.webp` is the same rig rendered into a transparent shop portrait. Earlier atlases remain as source history.
- `rewards/source.png` is the generated 4-column by 6-row collectible atlas. Cropped items use row boundaries 0,295,530,765,1020,1255,1536 and 256px columns. First row: bouquet, rainbow yarn, ribbon keepsake, stamp; following rows contain each species' four keepsakes. Crop gifts reuse their original crop artwork.
