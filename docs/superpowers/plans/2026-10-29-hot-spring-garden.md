# Hot Spring Garden Implementation Plan

Goal: Replace the Capybara Drift runtime with a persistent, open-ended creative spring.

Approved design: Begin with a small populated spring. Six free materials grow a connected natural garden. Animals respond to the environment. No timers, scores, scarcity, or failure. The rich concept image represents a mature player-created garden.

Architecture: A pure Node-compatible garden model validates versioned profiles, derives connected features, manages reversible edits and compact postcards. A canvas renderer and browser controller provide play/build modes, accessible keyboard controls, collection and album dialogs. Shared ToenowScreens owns title and visit summary.

Constraints: Keep capybara-drift route and ID, relax category, existing Hub sound/rest IDs, legacy records byte-for-byte untouched. Preserve unrelated work. No commits or deployment.

- [x] Add failing pure model tests for defaults, malformed/blocked storage, bounded edits, undo/redo, import, preview isolation, visitors and postcards.
- [x] Implement garden-model.js with a separate capybara_hot_spring_garden_v1 key, bounded cells/history/postcards and read-only compatible legacy cosmetic import.
- [x] Replace page runtime with garden renderer and controller, retaining old engine/source art as legacy compatibility modules.
- [x] Integrate shared visit screens, bilingual text, Hub naming and preview.
- [x] Verify focused tests, npm test, actual standalone/iframe lifecycle, saved layout, preview isolation, keyboard, touch and responsive screenshots.

Implemented the playable foundation. Remaining aspirational art, toy physics and interaction systems are explicitly listed in `docs/CAPYBARA_HOT_SPRING_GARDEN_RUN_REPORT.md`.

Review focus: blocked storage must leave the visit playable; repeated undo must not mutate saved snapshots; preview must never import/write; disconnected water must not strand the capybara; narrow screens must keep tools reachable.
