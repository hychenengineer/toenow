# Guarded trail and forest camp

User-approved slice: one dangerous trail plus an enterable camp, completing exploration → supplies → army preparation.

- Old forest trail (`cache`) progresses from clues to a visible guard encounter, then loot after victory. Other two discoveries remain available as the existing prototype.
- The player can leave without fighting. Guard strength is visible before engagement. A small real battle uses the existing combat engine and forest terrain, with no fort walls, gates, flag or fort capture reward.
- Both armies retain exact HP on retreat/defeat. Returning never rerolls guards. Loot remains the existing choice of 80 gold or 35 wood, claimable once after victory.
- No-army recovery must consider whether remaining discoveries can actually be claimed; inaccessible guarded loot must not keep an unwinnable run alive.
- Forest Camp opens a separate illustrated interior. Three buildings contain recruitment and existing training for beaver, fox and squirrel. Costs and upgrade effects remain unchanged. Building levels are future work.
- Map, camp, trail and combat are mutually exclusive gameplay views. Pause, handbook, restart, title and language changes must preserve their appropriate view or reset cleanly.
- Shared ToenowScreens remain the only title/results renderer. SDK and practice-record protection remain authoritative.
- EN/Traditional Chinese, mouse/touch and desktop/mobile are required. No commits, publication, new branch or moving the active preview workspace.

Implementation calls: guards start at 4 foxes, 2 squirrels and 1 beaver, with one extra per kind per difficulty tier. Progress is held in the existing expedition run, matching current game persistence (no new cross-reload save system).
