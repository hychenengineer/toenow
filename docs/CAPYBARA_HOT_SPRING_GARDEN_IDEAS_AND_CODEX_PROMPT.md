# Carefree Island Capybara Game Ideas

## Intent

Replace the current Capybara Drift experience with a soothing, playful Carefree Island game. The game must not be a brain-training game and must not use levels, ranks, difficulty escalation, countdown pressure, failure, penalties, or competitive scoring. It should work well with touch or mouse input and be enjoyable in short visits without forcing the player to stop.

The strongest direction is **Capybara Hot Spring Garden**, combining free-form decoration, gentle water play, animal visitors, collectible discoveries, and postcard creation.

## Concept Ideas

### 1. Capybara Hot Spring Garden — recommended

The capybara has a small natural hot spring that the player gradually decorates.

The player can:

- Swim, float, splash, and make ripples by dragging or tapping.
- Place stones, flowers, lanterns, bamboo, floating fruit, bath toys, and tiny waterfalls.
- Rub against plants, shake branches, nudge floating objects, and rest in sunny places.
- Attract animal friends by making the spring welcoming.
- Capture beautiful or funny moments as collectible postcards.

Collections can include animal visitors, plants, decorations, fruit-bath themes, hats, towels, weather scenes, and postcards. There is no correct arrangement and nothing can fail. Every interaction should produce a pleasant animation, sound, or animal reaction.

### 2. Puddle Painter

The capybara walks through shallow water and acts like a paintbrush. Dragging creates colorful ripples, flower patterns, floating leaves, sparkles, and soft trails. Each creation can be saved as a postcard. Players gradually discover additional colors, ripple styles, flowers, and weather effects.

This is the most creative option, although it may feel more like an interactive art toy than a complete game.

### 3. Capybara Garden Helper

The capybara gently brings a small garden to life. Moving near dry plants waters them, rolling through grass spreads seeds, resting under trees attracts birds, and entering ponds wakes frogs and fish. The garden transforms during play without chores or required objectives.

Collections can include flowers, butterflies, birds, frogs, garden themes, and seasonal scenes.

### 4. Capybara Friend Parade

The capybara wanders through Carefree Island and gathers animal friends. Touching a friendly animal invites it to follow. Every friend adds a musical sound, movement, or visual effect: ducks add percussion, birds whistle, frogs add bass notes, and rabbits carry flowers. The player can arrange the parade naturally and take a group photograph.

This concept is cute, musical, and collectible, but it requires a broad set of expressive animal animations.

### 5. Cozy Mud Spa

The capybara runs a playful mud spa for animal friends. Players freely combine mud colors, flowers, fruit, bubbles, and leaves. Animals enter, roll around, shake themselves dry, and leave funny patterns. There are no recipes to solve; every combination works.

Collections can include mud colors, spa ingredients, animal reactions, towels, hats, bath toys, and decoration sets.

### 6. Capybara Postcard Walk

The capybara explores a compact island filled with small ambient moments. The player chooses where it walks, rests, eats, or watches the scenery. Events happen naturally: fireflies appear, ducks cross the path, rain fills puddles, or a butterfly lands on the capybara. Players photograph these moments and decorate the pictures with collected stickers.

This concept combines exploration and collection, but it needs enough event variety to avoid repetition.

### 7. Floating Fruit Orchestra

The capybara relaxes in a hot spring surrounded by fruit and bath toys. Players tap, drag, spin, and bump objects together. Each object creates a soft musical sound: watermelon provides a drum tone, oranges make bells, leaves make shakers, and droplets create melody notes. There is no target song and no score.

Players collect new instruments, fruit, toys, and spring environments. This is the simplest and most tactile option.

## Recommended Combined Direction

Build **Capybara Hot Spring Garden** with:

- Free decoration from Hot Spring Garden.
- Animal discovery from Friend Parade.
- Musical water interaction from Floating Fruit Orchestra.
- Postcard creation from Puddle Painter and Postcard Walk.

The emotional loop is:

> Enter the spring → play with water and decorations → attract a surprise friend → create a beautiful or funny moment → save a postcard → stay or leave whenever desired.

This gives players a gentle reason to return without turning the experience into a task list or progression grind.

---

# Copy-Ready Codex Prompt

```text
You are working in:
C:\Users\HsinYuChen\source\repos\toenow

Read and obey the repository AGENTS.md instructions supplied with the task. Inspect the actual repository, Git status, existing Capybara game, shared SDK, screen library, localization catalog, Hub integration, tests, assets, and current uncommitted changes before editing. The worktree contains extensive user-owned changes: preserve them, do not reset, clean, discard, overwrite, or broadly reformat unrelated files. Do not commit, push, deploy, or publish unless separately requested.

Goal
====

Recreate the existing Carefree Island Capybara game as **Capybara Hot Spring Garden**: an open-ended, soothing, touch-friendly creative and collectible game. Replace the current timed river-drift gameplay. The main character remains the capybara.

This is not a cognitive game. Do not introduce brain challenges, puzzles, levels, wave progression, ranks, difficulty, leaderboards, countdown pressure, failure states, penalties, lives, energy, streaks, daily chores, required recipes, resource scarcity, or competitive scoring.

Player fantasy
==============

The player shares a peaceful hot spring with a capybara. They can swim and splash, arrange decorations, play with floating objects, attract animal friends, discover gentle ambient moments, and save postcard-like memories. There is no correct arrangement and nothing can fail.

The desired emotional loop is:

Enter the spring → play with water and decorations → attract a surprise animal friend → create a beautiful or funny moment → save a postcard → stay or leave whenever desired.

Core interaction
================

Create a responsive hot-spring play space that works with pointer, mouse, touch, and keyboard accessibility:

1. The player can tap a location or gently drag to guide the capybara through the spring.
2. Movement creates layered ripples, wakes, bubbles, floating leaves, and soft audio feedback.
3. The capybara can nudge and play with floating fruit, flowers, leaves, balls, and bath toys.
4. The player can open a compact decoration tray and drag items into the garden.
5. Decorations can be repositioned without cost or punishment. Provide an obvious, forgiving way to return an item to the tray.
6. Nearby objects react: plants sway, lanterns glow, chimes ring, fruit bobs, frogs hop, birds land, and friends respond.
7. The capybara occasionally rests, rolls, shakes off water, balances fruit, or interacts with nearby objects. Do not interrupt player control with long animations.
8. Provide a postcard button that briefly hides UI, frames the current scene, and saves a small in-game postcard record. Do not require downloading a file or granting permissions.
9. The player can finish a visit or return to the Hub whenever they want. There is no forced ending and no timer.

Creative and collection systems
===============================

Use light, non-pressuring persistence:

- Decorations: stones, bamboo, flowers, lanterns, bridges, tiny waterfalls, floating fruit, bath toys, and resting mats.
- Visitors: ducks, ducklings, frogs, turtles, otters, rabbits, butterflies, fireflies, and other suitable Carefree Island animals already supported by project art or rendering patterns.
- Atmosphere: morning, golden afternoon, sunset, moonlight, light rain, mist, drifting petals, and fireflies.
- Cosmetics: capybara towels, hats, and the existing owned float cosmetics where they can be reused naturally.
- Postcard album: store a compact description of the scene, timestamp, visitor IDs, equipped cosmetic, palette/weather, and decoration arrangement. Avoid storing canvas image blobs in localStorage.

Unlock discoveries through ordinary interaction and repeat visits, not through skill, scores, or grinding. The player should receive something pleasant on most short visits, but duplicate visitors are allowed and should have varied reactions. The system should arrange the weather and visiting friends automatically and avoid recently repeated combinations. Do not add configuration menus that make the player plan a visit.

The garden should feel pleasant on the first play. Seed a welcoming default layout, several floating objects, at least one immediate interaction, and an early friendly visitor. Never begin with an empty scene.

Recommended session behavior
============================

- Open-ended visit with no countdown.
- Players can stay for seconds or many minutes.
- Autosave normal-play garden changes at safe interaction boundaries and on pause/exit.
- Offer a clear pause/rest menu, collection book, decoration tray, postcard album, sound control, restart/restore-default-layout action, and Back to Hub action.
- Restarting the current visit must not erase durable collections or the postcard album.
- If a user requests restoring the garden layout, confirm the specific layout reset in the UI and do not erase collections or legacy data.

Architecture and compatibility
==============================

Use the current game location and integration unless inspection proves a safer compatible approach:

- Keep the route `games/capybara-drift/index.html` and internal game ID `capybara-drift` so existing Hub links and integration continue to work.
- Change the player-facing name to `Capybara Hot Spring Garden` in the shared screen configuration, Hub card/entry, title, description, localization, and accessible labels.
- Keep category `relax`, Carefree Island placement, `leaderboard: false`, and all existing standalone/iframe behavior.
- Keep using `ToenowGameSDK` for lifecycle and Hub communication.
- Keep using `ToenowScreens` for the shared title and visit-summary/result screen. Do not copy title or result HTML into the game. If the existing shared `journey` presentation needs a generic, reusable extension for open-ended relaxing visits, implement that in `shared/toenow-screen-config.js`, `shared/toenow-screens.js`, and shared CSS rather than creating a game-only result template.
- Preserve the required shared script order and unified title-menu stylesheet.
- Keep iframe close/restart/pause/title-control mirroring compatible with the Hub. Inspect the special `capybara-drift` handling in root `index.html` before changing control IDs.
- Use data-only entries in `shared/toenow-screen-config.js` and proper English and Traditional Chinese localization catalog entries. Do not hard-code player-facing English-only strings in gameplay code.
- Preserve reduced-motion support, keyboard access, focus management, ARIA names, safe-area insets, and responsive layouts for desktop, mobile portrait, and short landscape screens.
- Keep source modules testable in Node.js where practical. Separate durable garden/collection logic from canvas presentation.

Persistence and data safety
===========================

The existing game has user progress and may have an active journey. Do not delete, rename, overwrite, or silently reinterpret existing storage values, including:

- `capybara_drift_progress_v1`
- `capybara_drift_best_score_v1`
- `capybara_drift_best_wave_v1`
- Existing collection, wallet, cosmetic, receipt, material, or journey data discovered during inspection

Create a new versioned, game-specific profile key for the Hot Spring Garden, such as `capybara_hot_spring_garden_v1`, after confirming it does not collide with current keys. Implement a defensive one-time import that can carry forward compatible owned cosmetics or discoveries without modifying the legacy record. If import is unsafe or ambiguous, leave the old data untouched and start the garden with a welcoming default state.

Validate and sanitize every stored structure. Handle malformed JSON, unavailable localStorage, partial profiles, duplicate receipts, storage quota failures, and old schema versions without crashing. Do not store unbounded history. Cap postcard count and decoration count, and document the limits in code.

Practice/preview isolation
==========================

The current shared journey screen exposes a practice entry. Preserve compatibility unless the shared architecture provides a cleaner relax-game preview mode. In practice/preview mode, the complete experience must be playable but must not persist or modify:

- Garden layout
- Collections or discoveries
- Visitors
- Postcards
- Cosmetics or wallet
- Materials or receipts
- Best-score/best-wave records
- Imported legacy state

The Hub and SDK must receive `isPractice: true` for such sessions.

Visual direction
================

Create a warm, polished Carefree Island illustration style:

- Rounded natural hot spring with clear turquoise water
- Warm stone edges, bamboo, moss, flowers, lanterns, and soft foliage
- Expressive capybara with readable silhouette and gentle idle motion
- Soft daylight and dusk palettes with restrained highlights
- Layered ripple rings, bubbles, reflections, floating petals, steam, and subtle parallax
- Light UI that feels part of the garden rather than a cognitive-game HUD
- No large score display, urgency colors, progress bars, flashing rewards, confetti bursts, or dense menus

Inspect and reuse appropriate existing canonical assets, including the capybara source assets and Carefree Island art, before generating replacements. Preserve all source art. If an asset does not fit, add a new clearly named source and runtime asset without overwriting the original.

Audio
=====

Sound must default to the repository's established preference behavior. Use gentle, short Web Audio or existing audio assets for water, chimes, leaves, friendly animal sounds, and object interaction. Avoid constant loud music, reward stingers, or sounds that layer uncontrollably. Respect pause, sound-off, browser autoplay rules, and `prefers-reduced-motion` where relevant.

Implementation approach
=======================

Follow test-driven development:

1. Inspect current behavior, saves, architecture, tests, and dirty-worktree overlap.
2. Write failing tests for the new pure garden engine and persistence rules before implementation.
3. Replace river-specific engine/presentation code with maintainable garden modules. Remove obsolete runtime references only after tests prove the replacement and without deleting legacy save data or source assets.
4. Integrate shared screens, SDK lifecycle, localization, Hub controls, collection book, decoration tray, postcard album, pause/exit, practice isolation, and legacy import.
5. Test the actual game through its title → normal visit → decorate/interact → postcard → pause/resume → finish visit → replay → return title flow.
6. Test standalone and Hub iframe modes.
7. Inspect screenshots and interaction behavior, fix issues, and rerun all relevant tests.

Do not merely reskin the river or retain automatic horizontal travel. This must feel like a new free-form hot-spring garden experience.

Tests and verification
======================

Update or replace Capybara-specific tests and browser tools so their names and assertions describe Hot Spring Garden instead of river travel. Preserve unrelated coverage.

At minimum verify:

- New profile defaults and schema migration
- Legacy data remains byte-for-byte untouched
- Malformed and unavailable storage fallback
- Decoration placement, movement, bounds, capacity, and serialization
- Visitor selection variety and recent-repeat avoidance
- Discovery idempotency
- Postcard metadata and capped history
- Normal autosave and safe resume
- Practice/preview writes nothing
- Restart does not erase durable progress
- Shared title and visit-summary screens are generated by `ToenowScreens`
- English and Traditional Chinese strings
- Keyboard, pointer, touch, focus, and reduced-motion behavior
- Standalone and Hub iframe lifecycle/postMessage behavior
- Pause, resume, restart, finish visit, return title, and Back to Hub
- Responsive desktop, 390px portrait, 320px portrait, tablet landscape, and short landscape layouts
- No timer, level/rank language, difficulty, leaderboard, cognitive score HUD, or failure state is shown
- First play is populated and immediately interactive

Run:

- Focused Capybara unit tests while developing
- `npm test`
- The shared-screen browser regression with `TOENOW_TEST_URL`
- A dedicated Hot Spring Garden browser verification covering actual interactions and screenshots
- Existing Hub/island browser verification affected by the renamed card and mirrored controls

Use the repository's configured Node 20/npm environment and available Edge/Playwright runtime. Browser emulation can verify responsive behavior, but report physical iPad Safari as NOT VERIFIED unless it was actually tested on that device.

Completion report
=================

Report:

- What changed
- Exact files changed
- How legacy progress was protected
- Unit/browser commands executed and their results
- PASS, FAIL, or NOT VERIFIED for standalone, Hub iframe, practice isolation, persistence, localization, responsive layouts, and physical iPad Safari
- Any remaining limitations or asset placeholders

Do not claim completion until the new game has been played through and visually inspected in both standalone and Hub iframe modes after all relevant automated tests pass.
```
