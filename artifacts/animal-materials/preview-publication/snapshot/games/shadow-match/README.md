# shadow-match

See [the maintenance guide](../../docs/GAME_MAINTENANCE.md) for module contracts, shared UI ownership and verification commands.

- `audio.js`: Game-specific sound synthesis.
- `index.html`: Containers and ordered dependencies.
- `main.js`: Live state, lifecycle, input, storage, SDK and renderer scene getters.
- `renderer.js`: Canvas drawing via createRenderer(scene).
- `rules.js`: Game-specific question generation, difficulty and scoring calculations.
- `shapes.js`: Original specimen/silhouette definitions.
- `style.css`: Game-specific styling and responsive layout.

Load order is declared in `index.html`. Browser APIs are under `window.ToenowGameModules['shadow-match']`; rules and renderer factories can also be required directly by Node tests.
