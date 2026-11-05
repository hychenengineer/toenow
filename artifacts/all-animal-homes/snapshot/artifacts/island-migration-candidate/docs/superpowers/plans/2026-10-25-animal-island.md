# Animal island implementation

Approved scope: the user's 2026-10-25 request and preceding ten-game proposal. Use watercolor storybook art, animals involved in actual activities, ten corresponding locations and five distinct building stages each. Spot Quick retains every existing specimen/category. Preserve gameplay rules, scores, SDK, practice isolation, language switching, shared title/result renderer, standalone and iframe support. Work in the existing checkout; preserve unrelated untracked artifacts. No commits, publishing or deployment requested.

## Interfaces and files

- `shared/toenow-animals.js`: UMD catalogue and browser helpers. `getTheme(id)`, `getBuildingAsset(id, level)`, `drawAnimal(ctx, species, x, y, size)`, `feedback(id, success)`, `setWave(id, wave)`. Methods tolerate an absent DOM. Drawing coordinates are center-based. English/Traditional Chinese/Simplified Chinese copy is supplied through the common catalogue.
- `assets/animal-island/`: fifty individually generated transparent watercolor landmark PNG sources, optimized WebP runtime textures and provenance manifest. Original assets under `assets/island-buildings/` remain untouched.
- `assets/toenow-animals.css`: shared watercolor gameplay framing and compact live animal companion.
- `shared/toenow-island.js`: same ten positions/kinds and record-based stage mapping, animal names and new artwork. Preview/practice never writes progress.
- `shared/toenow-screen-config.js`, i18n catalogues and Hub: actual themed descriptions and game links; keep IDs/storage keys stable.
- Owned game groups are disjoint: number-pop/add-up/space-scale; ball-track/block-match/shadow-match; animal-rescue-train/tap-match/spot-quick/flash-brain.

## Task 1: Shared themes and art

Write failing behavior tests for ten unique themes, stage bounds and asset selection; then implement catalogue/helpers. Generate one original image per building stage with consistent per-location architecture, a visible participating animal and transparent background. Copy originals into repo, encode runtime textures and record prompt/hash/size/provenance. Inspect every generated stage and check fifty distinct images. Map: panda/station, rabbit/harvest garden, otter/river shelter, beaver/workshop, squirrel/supply depot, fox/weighhouse, penguin/matching pool, owl/observation station, raccoon/shadow theater, elephant/memory garden.

## Task 2: Gameplay in three independent groups

Before edits, read actual render/input/state and existing tests. Add meaningful checks for preserved game semantics and new themed behavior. Modify rendered objects, task context and success feedback, beyond adding a mascot. Preserve all existing Spot Quick specimens and tier selection; owl observes all categories. Preserve Ball Track concealment, numeric visibility, geometric legibility and Flash Brain safe/danger distinctions. Add shared helper use with optional guards for current Node DOM harnesses. Avoid edits to shared files in game workers; return requested shared copy to root.

## Task 3: Hub and localization

Integrate scripts/styles in all ten games, themed shared title descriptions, translated instructions and Hub locations. Buildings follow normal-play saved highest wave through existing five-tier mapping. Active game companion follows current wave with no persistence. Provide an art gallery covering all fifty stages for review. Keep three hub themes compatible.

## Task 4: Verification and review

Run `npm test`, additional animal tests, shared-screen browser regression, island regression and animal gameplay browser checks. Inspect desktop/mobile English/Chinese screenshots, actual input, start/end/replay/return and iframe. Check all images load, no page exceptions, progress stage changes, preview/practice record protection. Review changes with a fresh reviewer, fix material issues, rerun relevant checks. Report PASS/FAIL/NOT VERIFIED, fifty-image coverage and any physical-device limitation. No automatic commit/push/deploy.

## Progress

- Planning and inspection: complete. Existing tracked checkout clean; unrelated untracked artifacts preserved.
- Shared interfaces: game workers consume the helpers above; root owns global files and image generation. Shared art-path interface must match Hub and companion renderer.
- Completed: all ten games have themed gameplay objects/context/reactions, fifty individually generated transparent landmark assets and ten generated character sprites. Six overbuilt beginner scenes were regenerated; the superseded original PNGs/provenance remain under `sources/superseded/`.
- Completed: Hub animal locations, shared title artwork/descriptions, bilingual catalogues and ten new authentic seven-second gameplay preview recordings/posters. Original landmark art and old previews remain preserved.
- Review fixes verified: companion guide never blocks active gameplay; repeated per-frame art requests eliminated; Train live language updates preserve puzzle DOM; beaver portrait fits between boards; singular basket wording localized; small map width increased to 1000px with original 3:2 terrain proportions and internal scrolling.
- Validation: final `npm test` 127/127 PASS. Shared screen browser regression: 36 standalone, 9 iframe, 9 practice PASS. Island: 30 width/language/theme combinations, five stages per ten locations, all fifty decodes, preview/normal/practice/storage/fallback PASS. Ten integration browser cases and all ten preview playbacks PASS. Numeric six, spatial twelve and recognition eight desktop/mobile actual-input cases PASS; scoped review fixes additionally verified.
- Evidence: `artifacts/animal-island/npm-final.log`, `shared-screens-final.log`, `integration-browser-results.json`, `hub/results.json`, `previews-final.log`, gameplay-specific result JSON and two final art-review sheets. Physical iPad Safari NOT VERIFIED. No commits, pushes or deployments performed.
