// data: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['tap-match'] = games['tap-match'] || {};
    game.data = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
const SHAPES = ['CIRCLE', 'DIAMOND', 'SQUARE', 'HEXAGON'];
        const GLYPHS = ['DOT', 'CROSS', 'DELTA', 'SLASH'];
        const COLORS = [
          { id: 'CYAN', hex: '#00f0ff', cssClass: 'hud-highlight-cyan' },
          { id: 'VOLT', hex: '#ffe600', cssClass: 'hud-highlight-volt' },
          { id: 'MAGENTA', hex: '#ff0055', cssClass: 'hud-highlight-magenta' },
          { id: 'LIME', hex: '#00ff66', cssClass: 'hud-highlight-lime' }
        ];

        const COLOR_MAP = {
          CYAN: '#00f0ff',
          VOLT: '#ffe600',
          MAGENTA: '#ff0055',
          LIME: '#00ff66'
        };

        
  return { SHAPES, GLYPHS, COLORS, COLOR_MAP };
});
