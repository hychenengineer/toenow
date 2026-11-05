// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root, require('./shapes.js'));
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['spot-quick'] = games['spot-quick'] || {};
    game.rules = factory(root, game.shapes);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window, shapes) {
  'use strict';
const { SPECIMEN_POOL } = shapes;
const TIERS = [
          { level: 1, name: "BEGINNER", focusWindow: 10.0 },
          { level: 2, name: "INTERMEDIATE", focusWindow: 20.0 },
          { level: 3, name: "ADVANCED", focusWindow: 30.0 },
          { level: 4, name: "EXPERT", focusWindow: 40.0 },
          { level: 5, name: "MASTER", focusWindow: 50.0 }
        ];

        function getTierForWave(waveNum) {
          if (waveNum <= 5) return TIERS[0]; // Level 1 (Beginner): Waves 1-5
          if (waveNum <= 10) return TIERS[1]; // Level 2 (Intermediate): Waves 6-10
          if (waveNum <= 15) return TIERS[2]; // Level 3 (Advanced): Waves 11-15
          if (waveNum <= 20) return TIERS[3]; // Level 4 (Expert): Waves 16-20
          return TIERS[4]; // Level 5 (Master): Waves 21+
        }

        function getCurrentScoreTier(elapsedSec, focusWindow) {
          const fraction = elapsedSec / (focusWindow || 10.0);
          if (fraction < 0.25) return 100;
          if (fraction < 0.50) return 60;
          if (fraction < 0.75) return 30;
          return 10;
        }

        function shuffleArray(arr) {
          const copy = arr.slice();
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
          }
          return copy;
        }

        function generateCandidatesForTier(target, tier) {
          const allClusters = Array.from(new Set(SPECIMEN_POOL.map(function (s) { return s.cluster; })));
          const otherClusters = shuffleArray(allClusters.filter(function (c) { return c !== target.cluster; }));
          const sameClusterPool = shuffleArray(
            SPECIMEN_POOL.filter(function (s) {
              return s.id !== target.id && s.cluster === target.cluster;
            })
          );

          let decoys = [];

          if (tier.level === 1) {
            // Level 1: All 4 options from the EXACT SAME category
            decoys = sameClusterPool.slice(0, 3);
          } else if (tier.level === 2) {
            // Level 2: 2 categories mixed (Target + 1 same cat + 2 from Cat B)
            const catB = otherClusters[0];
            const catBPool = shuffleArray(SPECIMEN_POOL.filter(function (s) { return s.cluster === catB; }));
            if (sameClusterPool.length > 0) decoys.push(sameClusterPool[0]);
            for (let i = 0; i < catBPool.length && decoys.length < 3; i++) {
              decoys.push(catBPool[i]);
            }
          } else if (tier.level === 3) {
            // Level 3: 3 categories mixed (Target + 1 same cat + 1 from Cat B + 1 from Cat C)
            if (sameClusterPool.length > 0) decoys.push(sameClusterPool[0]);
            const catB = otherClusters[0];
            const catC = otherClusters[1] || otherClusters[0];
            const poolB = shuffleArray(SPECIMEN_POOL.filter(function (s) { return s.cluster === catB; }));
            const poolC = shuffleArray(SPECIMEN_POOL.filter(function (s) { return s.cluster === catC && s.id !== (poolB[0] && poolB[0].id); }));
            if (poolB.length > 0) decoys.push(poolB[0]);
            if (poolC.length > 0) decoys.push(poolC[0]);
          } else if (tier.level === 4) {
            // Level 4: 4 categories mixed (Target + 1 from Cat B + 1 from Cat C + 1 from Cat D)
            const catB = otherClusters[0];
            const catC = otherClusters[1] || otherClusters[0];
            const catD = otherClusters[2] || otherClusters[0];
            const poolB = shuffleArray(SPECIMEN_POOL.filter(function (s) { return s.cluster === catB; }));
            const poolC = shuffleArray(SPECIMEN_POOL.filter(function (s) { return s.cluster === catC; }));
            const poolD = shuffleArray(SPECIMEN_POOL.filter(function (s) { return s.cluster === catD; }));
            if (poolB.length > 0) decoys.push(poolB[0]);
            if (poolC.length > 0) decoys.push(poolC[0]);
            if (poolD.length > 0) decoys.push(poolD[0]);
          } else {
            // Level 5: All 10 categories mixed completely
            const anyDecoys = shuffleArray(SPECIMEN_POOL.filter(function (s) { return s.id !== target.id; }));
            decoys = anyDecoys.slice(0, 3);
          }

          if (decoys.length < 3) {
            const fallback = shuffleArray(
              SPECIMEN_POOL.filter(function (s) {
                return s.id !== target.id && !decoys.some(function (d) { return d.id === s.id; });
              })
            );
            for (let i = 0; i < fallback.length && decoys.length < 3; i++) {
              decoys.push(fallback[i]);
            }
          }

          return shuffleArray([target].concat(decoys));
        }

        
  return { TIERS, getTierForWave, getCurrentScoreTier, shuffleArray, generateCandidatesForTier };
});
