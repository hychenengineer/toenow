// data: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['space-scale'] = games['space-scale'] || {};
    game.data = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
const ARCHETYPES = [
          {
            id: 'micro_hole',
            name: 'Violet striped parcel',
            densityDesc: 'Sealed mystery parcel',
            minRadius: 22,
            maxRadius: 26,
            primaryColor: '#a855f7',
            secondaryColor: '#e879f9',
            coreColor: '#000000',
          },
          {
            id: 'neutron_star',
            name: 'Blue dotted parcel',
            densityDesc: 'Sealed mystery parcel',
            minRadius: 24,
            maxRadius: 28,
            primaryColor: '#22d3ee',
            secondaryColor: '#e0f2fe',
            coreColor: '#ffffff',
          },
          {
            id: 'blue_dwarf',
            name: 'Green checked parcel',
            densityDesc: 'Sealed mystery parcel',
            minRadius: 30,
            maxRadius: 36,
            primaryColor: '#10b981',
            secondaryColor: '#6ee7b7',
            coreColor: '#ecfdf5',
          },
          {
            id: 'yellow_sun',
            name: 'Amber striped parcel',
            densityDesc: 'Sealed mystery parcel',
            minRadius: 34,
            maxRadius: 40,
            primaryColor: '#facc15',
            secondaryColor: '#f97316',
            coreColor: '#fef9c3',
          },
          {
            id: 'gas_giant',
            name: 'Amber checked parcel',
            densityDesc: 'Sealed mystery parcel',
            minRadius: 38,
            maxRadius: 44,
            primaryColor: '#f59e0b',
            secondaryColor: '#dc2626',
            coreColor: '#ffedd5',
          },
          {
            id: 'nebula_bubble',
            name: 'Rose dotted parcel',
            densityDesc: 'Sealed mystery parcel',
            minRadius: 42,
            maxRadius: 48,
            primaryColor: '#f43f5e',
            secondaryColor: '#fda4af',
            coreColor: '#fff1f2',
          },
        ];

        const GREEK_NAMES = [
          { id: 'alpha', label: 'ALPHA', symbol: 'α' },
          { id: 'beta', label: 'BETA', symbol: 'β' },
          { id: 'gamma', label: 'GAMMA', symbol: 'γ' },
          { id: 'delta', label: 'DELTA', symbol: 'δ' },
          { id: 'epsilon', label: 'EPSILON', symbol: 'ε' },
          { id: 'zeta', label: 'ZETA', symbol: 'ζ' },
        ];

        
  return { ARCHETYPES, GREEK_NAMES };
});
