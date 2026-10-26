// shapes: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['shadow-match'] = games['shadow-match'] || {};
    game.shapes = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
function buildStarVertices(points, outerR, innerR) {
          const verts = [];
          const total = points * 2;
          for (let i = 0; i < total; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = -Math.PI / 2 + (i * Math.PI) / points;
            verts.push([Math.cos(angle) * r, Math.sin(angle) * r]);
          }
          return verts;
        }

        function buildCrescentVertices() {
          const verts = [];
          const steps = 20;
          const maxAngle = Math.PI * 0.72;
          const tipX = Math.cos(maxAngle) * 0.9 - 0.06;
          const tipY = Math.sin(maxAngle) * 0.9;
          for (let i = 0; i <= steps; i++) {
            const a = -maxAngle + (i / steps) * (maxAngle * 2);
            verts.push([Math.cos(a) * 0.9 - 0.06, Math.sin(a) * 0.9]);
          }
          for (let i = steps - 1; i >= 1; i--) {
            const u = (i / steps) * 2 - 1;
            const ix = tipX + (1 - u * u) * 0.56;
            const iy = u * tipY;
            verts.push([ix, iy]);
          }
          return verts;
        }

        function buildGear6Vertices() {
          const verts = [];
          const teeth = 6;
          const rInner = 0.64;
          const rOuter = 0.95;
          for (let i = 0; i < teeth; i++) {
            const base = (i * 2 * Math.PI) / teeth - Math.PI / 2;
            const step = (2 * Math.PI) / teeth;
            verts.push(
              [Math.cos(base) * rInner, Math.sin(base) * rInner],
              [Math.cos(base + step * 0.18) * rInner, Math.sin(base + step * 0.18) * rInner],
              [Math.cos(base + step * 0.30) * rOuter, Math.sin(base + step * 0.30) * rOuter],
              [Math.cos(base + step * 0.70) * rOuter, Math.sin(base + step * 0.70) * rOuter],
              [Math.cos(base + step * 0.82) * rInner, Math.sin(base + step * 0.82) * rInner]
            );
          }
          return verts;
        }

        function buildHexNutVertices() {
          const verts = [];
          for (let i = 0; i < 6; i++) {
            const a = -Math.PI / 2 + (i * Math.PI) / 3;
            verts.push([Math.cos(a) * 0.92, Math.sin(a) * 0.92]);
          }
          return verts;
        }

        const LIGHTNING_VERTS = [
          [0.18, -0.96],
          [-0.58, -0.04],
          [-0.04, -0.04],
          [-0.42, 0.96],
          [0.62, 0.08],
          [0.06, 0.08]
        ];

        const WRENCH_VERTS = [
          [-0.58, -0.92],
          [-0.22, -0.92],
          [-0.22, -0.52],
          [0.14, -0.52],
          [0.14, -0.84],
          [0.52, -0.62],
          [0.56, -0.22],
          [0.24, 0.04],
          [0.24, 0.78],
          [0.36, 0.94],
          [-0.36, 0.94],
          [-0.24, 0.78],
          [-0.24, 0.04],
          [-0.64, -0.26],
          [-0.68, -0.64]
        ];

        const SHAPE_VOCABULARY = {
          STAR_5: {
            id: 'STAR_5',
            label: '5-Point Star',
            cousins: ['STAR_6', 'ANCHOR_CROSS', 'CROWN_SPIRE'],
            vertices: buildStarVertices(5, 0.96, 0.42)
          },
          STAR_6: {
            id: 'STAR_6',
            label: '6-Point Star',
            cousins: ['STAR_5', 'GEAR_6', 'ANCHOR_CROSS'],
            vertices: buildStarVertices(6, 0.96, 0.48)
          },
          CRESCENT: {
            id: 'CRESCENT',
            label: 'Crescent',
            cousins: ['KEY_SILHOUETTE', 'WRENCH', 'BELL_DOME'],
            vertices: buildCrescentVertices()
          },
          LIGHTNING: {
            id: 'LIGHTNING',
            label: 'Lightning',
            cousins: ['ARROW_CHEVRON', 'DIAMOND_SPIRE', 'WRENCH'],
            vertices: LIGHTNING_VERTS
          },
          GEAR_6: {
            id: 'GEAR_6',
            label: '6-Tooth Gear',
            cousins: ['HEX_NUT', 'STAR_6', 'ANCHOR_CROSS'],
            vertices: buildGear6Vertices()
          },
          HEX_NUT: {
            id: 'HEX_NUT',
            label: 'Hex Nut',
            cousins: ['GEAR_6', 'DIAMOND_SPIRE', 'BELL_DOME'],
            vertices: buildHexNutVertices()
          },
          ARROW_CHEVRON: {
            id: 'ARROW_CHEVRON',
            label: 'Arrow Chevron',
            cousins: ['CROWN_SPIRE', 'LIGHTNING', 'DIAMOND_SPIRE'],
            vertices: [
              [0.0, -0.96],
              [0.86, -0.02],
              [0.42, -0.02],
              [0.42, 0.92],
              [0.0, 0.58],
              [-0.42, 0.92],
              [-0.42, -0.02],
              [-0.86, -0.02]
            ]
          },
          ANCHOR_CROSS: {
            id: 'ANCHOR_CROSS',
            label: 'Anchor Cross',
            cousins: ['STAR_5', 'STAR_6', 'GEAR_6'],
            vertices: [
              [-0.36, -0.94],
              [0.0, -0.74],
              [0.36, -0.94],
              [0.22, -0.22],
              [0.94, -0.36],
              [0.74, 0.0],
              [0.94, 0.36],
              [0.22, 0.22],
              [0.36, 0.94],
              [0.0, 0.74],
              [-0.36, 0.94],
              [-0.22, 0.22],
              [-0.94, 0.36],
              [-0.74, 0.0],
              [-0.94, -0.36],
              [-0.22, -0.22]
            ]
          },
          KEY_SILHOUETTE: {
            id: 'KEY_SILHOUETTE',
            label: 'Key',
            cousins: ['WRENCH', 'CRESCENT', 'BELL_DOME'],
            vertices: [
              [-0.42, -0.94],
              [0.42, -0.94],
              [0.64, -0.68],
              [0.64, -0.28],
              [0.22, -0.08],
              [0.22, 0.26],
              [0.58, 0.26],
              [0.58, 0.48],
              [0.22, 0.48],
              [0.22, 0.66],
              [0.66, 0.66],
              [0.66, 0.92],
              [-0.22, 0.92],
              [-0.22, -0.08],
              [-0.64, -0.28],
              [-0.64, -0.68]
            ]
          },
          WRENCH: {
            id: 'WRENCH',
            label: 'Wrench',
            cousins: ['KEY_SILHOUETTE', 'LIGHTNING', 'HOURGLASS'],
            vertices: WRENCH_VERTS
          },
          HOURGLASS: {
            id: 'HOURGLASS',
            label: 'Hourglass',
            cousins: ['ANCHOR_CROSS', 'BELL_DOME', 'CROWN_SPIRE'],
            vertices: [
              [-0.78, -0.92],
              [0.78, -0.92],
              [0.78, -0.68],
              [0.22, 0.0],
              [0.78, 0.68],
              [0.78, 0.92],
              [-0.78, 0.92],
              [-0.78, 0.68],
              [-0.22, 0.0],
              [-0.78, -0.68]
            ]
          },
          CROWN_SPIRE: {
            id: 'CROWN_SPIRE',
            label: 'Crown Spire',
            cousins: ['ARROW_CHEVRON', 'STAR_5', 'HOURGLASS'],
            vertices: [
              [-0.88, -0.48],
              [-0.42, 0.14],
              [0.0, -0.94],
              [0.42, 0.14],
              [0.88, -0.48],
              [0.68, 0.84],
              [-0.68, 0.84]
            ]
          },
          DIAMOND_SPIRE: {
            id: 'DIAMOND_SPIRE',
            label: 'Diamond',
            cousins: ['HEX_NUT', 'ARROW_CHEVRON', 'LIGHTNING'],
            vertices: [
              [0.0, -0.96],
              [0.68, 0.0],
              [0.0, 0.96],
              [-0.68, 0.0]
            ]
          },
          BELL_DOME: {
            id: 'BELL_DOME',
            label: 'Bell Dome',
            cousins: ['HOURGLASS', 'KEY_SILHOUETTE', 'HEX_NUT'],
            vertices: [
              [-0.18, -0.94],
              [0.18, -0.94],
              [0.22, -0.74],
              [0.56, -0.42],
              [0.68, 0.34],
              [0.92, 0.62],
              [0.92, 0.76],
              [0.26, 0.76],
              [0.18, 0.96],
              [-0.18, 0.96],
              [-0.26, 0.76],
              [-0.92, 0.76],
              [-0.92, 0.62],
              [-0.68, 0.34],
              [-0.56, -0.42],
              [-0.22, -0.74]
            ]
          }
        };

        const ALL_SHAPE_IDS = Object.keys(SHAPE_VOCABULARY);

        
  return { SHAPE_VOCABULARY, ALL_SHAPE_IDS };
});
