# All ten interactive animal homes

Every explorer location now opens a visitable home with its own environment, animal, conversation and game action. Rabbit retains its approved garden artwork; the other nine use new themed starter backgrounds and construction/decor atlases while preserving their canonical animal character assets.

| Home | Four visible additions |
| --- | --- |
| Rabbit Harvest Garden | Vegetable patch, greenhouse, harvest stall, pergola |
| Otter River Shelter | Stepping stones, reed shelter, raft dock, riverside gazebo |
| Beaver Timber Workshop | Work table, tool shed, lumber store, woodwork pavilion |
| Squirrel Supply Depot | Sorting table, nut storehouse, delivery counter, treetop canopy |
| Fox Parcel Weighhouse | Parcel sorting table, scale shed, parcel counter, ribbon arch |
| Penguin Matching Pool | Floating platform, ice bridge, pool hut, pool canopy |
| Owl Observation Station | Journal desk, lookout tower, stargazing platform, woodland gazebo |
| Raccoon Shadow Theater | Paper work table, puppet booth, shadow stage, festival arch |
| Elephant Memory Garden | Flowerbed, seed greenhouse, memory fountain, garden pergola |
| Panda Rescue Station | Waiting bench, ticket shelter, rescue storehouse, platform canopy |

Stage 1 remains a modest starter scene. Purchased additions appear at stages 2–5; browsing a project does not construct it. Each home has its existing welcome/collaboration decoration with fixed placement and put-away controls. Shared material prices and collection rules are unchanged. Existing balances, stages, collections, placements, challenge records and discovery policy are retained.

`shared/toenow-homes-config.js` contains per-home English/Traditional Chinese content, project identities and art paths. `shared/toenow-homes.js` owns the single scene renderer/model; `toenow-rabbit-home.js` is a compatibility adapter. Each animal has greeting/returning/game-tip/ready/completion dialogue plus four ambient lines and a live missing-material response. The Hub owns navigation, Web Lock serialization, game launch, focus and source travel. Image failures retain usable actions with canonical landmark/animal-emoji fallbacks. All games continue using their existing shared title/result flow.

Artwork: built-in OpenAI imagegen. New source PNGs and runtime WebPs are under `assets/animal-homes/<species>`; each manifest preserves the complete generation prompts, source filename, SHA-256, size and transparency evidence. Background prompt set: warm storybook 4:3 starter environments with a tiny themed home at upper left, animal space at lower left and open buildable terrain on the right; no animals, text, UI or future purchased buildings. Atlas prompt set: six isolated themed objects in a transparent 3x2 grid, the four listed additions plus existing welcome/together decorations, no characters/text/backdrop. Canonical character PNG/WebP sources were not replaced.

Verification evidence is kept under `artifacts/all-animal-homes`, outside the source commit. The browser matrix covers all ten homes, five construction states, two decorations, contextual/ambient chat, no-spend previews, ingredient source travel, save reload, keyboard focus and each real game launch; EN/ZH at 1440,390,320 and 844x390; missing-image and locked-home behavior. Game lifecycle regression uses explicit test-only end hooks/clock offsets and is not a natural-play or physical-device claim. Physical iPad Safari remains NOT VERIFIED.

Publication is restricted to `preview` GitHub Pages with `[CF-Pages-Skip]`, verifying main and Cloudflare production remain unchanged. No automatic main merge or unrelated workspace staging.
