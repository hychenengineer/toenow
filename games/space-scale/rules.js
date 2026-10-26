// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root, require('./data.js'));
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['space-scale'] = games['space-scale'] || {};
    game.rules = factory(root, game.data);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window, data) {
  'use strict';
const { ARCHETYPES, GREEK_NAMES } = data;
function createRng(seed) {
          let a = seed >>> 0;
          return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          };
        }

        function shuffleArray(items, rng) {
          const arr = items.slice();
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
          }
          return arr;
        }

        function getWaveDurationSec(w) {
          const t = 3.5 + 4.5 * Math.exp(-0.07 * Math.max(0, w - 1));
          return Number(t.toFixed(1));
        }

        // 5-Level System Mapping
        function getLevelForWave(wave) {
          if (wave <= 5) return 1;  // Level 1 (Beginner): Waves 1-5
          if (wave <= 10) return 2; // Level 2 (Intermediate): Waves 6-10
          if (wave <= 15) return 3; // Level 3 (Advanced): Waves 11-15
          if (wave <= 20) return 4; // Level 4 (Expert): Waves 16-20
          return 5;                 // Level 5 (Master): Waves 21+
        }

        // Progressive Time Bonuses:
        // Level 1: Base duration (+0s)
        // Level 2: Level 1 + 1s (+1.0s)
        // Level 3: Level 2 + 2s (+3.0s)
        // Level 4: Level 3 + 3s (+6.0s)
        // Level 5: Level 4 + 4s (+10.0s)
        function getLevelTimeBonusSec(level) {
          if (level <= 1) return 0;
          if (level === 2) return 1.0;
          if (level === 3) return 3.0; // Level 2 time + 2s
          if (level === 4) return 6.0; // Level 3 time + 3s
          return 10.0; // Level 5 (Level 4 time + 4s)
        }

        function calculateWaveDuration(wave, level) {
          const base = getWaveDurationSec(wave);
          const bonus = getLevelTimeBonusSec(level);
          return Number((base + bonus).toFixed(1));
        }

        function computeTorqueTiltAngle(leftTorque, rightTorque) {
          const diff = rightTorque - leftTorque;
          if (Math.abs(diff) < 0.001) return 0;
          const maxTilt = 0.27;
          const minTilt = 0.14;
          const normalized = Math.min(1, Math.abs(diff) / 80);
          const magnitude = minTilt + (maxTilt - minTilt) * normalized;
          return diff > 0 ? magnitude : -magnitude;
        }

        // Overhauled Puzzle Generation Structured Across 5 Distinct Levels
        function generateOverhauledPuzzle(wave, seed) {
          const rng = createRng((seed || Date.now()) + wave * 9173);
          const level = getLevelForWave(wave);

          let scaleCount = 1;
          let bodyCount = 2;

          if (level === 1) {
            // Level 1: 1 or 2 comparisons (equal arms only)
            scaleCount = wave <= 2 ? 1 : 2;
            bodyCount = scaleCount === 1 ? 2 : 3;
          } else if (level === 2) {
            // Level 2: 2 comparisons with equal arms
            scaleCount = 2;
            bodyCount = 3;
          } else if (level === 3) {
            // Level 3: 3 comparisons with equal arms
            scaleCount = 3;
            bodyCount = 4;
          } else if (level === 4) {
            // Level 4: 4 comparisons with equal arms
            scaleCount = 4;
            bodyCount = 5;
          } else {
            // Level 5: 5 or 6 comparisons with equal arms
            scaleCount = wave <= 14 ? 5 : 6;
            bodyCount = 6;
          }

          const duration = calculateWaveDuration(wave, level);

          // Randomize Directive (middle weight / median ONLY allowed when bodyCount is an odd number)
          let directive = 'max';
          if (bodyCount % 2 === 0) {
            // Even number of bodies (2, 4, 6): No unique middle element -> only max or min
            directive = rng() < 0.5 ? 'max' : 'min';
          } else {
            // Odd number of bodies (3, 5): Has an exact unique middle element
            const roll = rng();
            if (roll < 0.34) directive = 'max';
            else if (roll < 0.67) directive = 'min';
            else directive = 'median';
          }

          let directiveTitle = 'IDENTIFY MAXIMUM MASS';
          let directiveSub = 'TAP THE HEAVIEST CELESTIAL ENTITY';
          if (directive === 'min') {
            directiveTitle = 'IDENTIFY MINIMUM MASS';
            directiveSub = 'TAP THE LIGHTEST CELESTIAL ENTITY';
          } else if (directive === 'median') {
            directiveTitle = 'IDENTIFY MEDIAN MASS';
            directiveSub = 'TAP THE BALANCED MIDDLE ENTITY';
          }

          let massesByRank = [];
          if (bodyCount === 2) {
            massesByRank = [100, 50];
          } else if (bodyCount === 3) {
            massesByRank = [160, 90, 35];
          } else if (bodyCount === 4) {
            massesByRank = [180, 110, 65, 25];
          } else if (bodyCount === 5) {
            massesByRank = [220, 150, 95, 55, 20];
          } else {
            massesByRank = [260, 190, 130, 85, 50, 20];
          }

          const shuffledArchetypes = shuffleArray(ARCHETYPES, rng);
          const stroopTrick = rng() < 0.55;
          const rankOrder = shuffleArray(Array.from({ length: bodyCount }, (_, i) => i), rng);

          const usedArchIds = new Set();
          const bodies = rankOrder.map((rank, desIdx) => {
            const des = GREEK_NAMES[desIdx];
            let arch = null;

            if (stroopTrick) {
              if (rank === 0) {
                const cand = rng() < 0.5 ? ARCHETYPES[0] : ARCHETYPES[1];
                if (!usedArchIds.has(cand.id)) arch = cand;
              } else if (rank === bodyCount - 1) {
                const cand = rng() < 0.5 ? ARCHETYPES[4] : ARCHETYPES[5];
                if (!usedArchIds.has(cand.id)) arch = cand;
              }
            }

            if (!arch) {
              arch =
                shuffledArchetypes.find((a) => !usedArchIds.has(a.id)) ||
                shuffledArchetypes[desIdx % shuffledArchetypes.length];
            }
            usedArchIds.add(arch.id);

            const radius =
              arch.minRadius + Math.floor(rng() * (arch.maxRadius - arch.minRadius + 1));

            return {
              id: des.id,
              label: des.label,
              symbol: des.symbol,
              keyIndex: desIdx + 1,
              archetype: arch.id,
              archetypeName: arch.name,
              densityDesc: arch.densityDesc,
              mass: massesByRank[rank],
              visualRadius: radius,
              primaryColor: arch.primaryColor,
              secondaryColor: arch.secondaryColor,
              coreColor: arch.coreColor,
            };
          });

          const getBodyByRank = (r) => bodies[rankOrder.indexOf(r)];

          let targetRank = 0;
          if (directive === 'max') targetRank = 0;
          else if (directive === 'min') targetRank = bodyCount - 1;
          else targetRank = Math.floor(bodyCount / 2);

          const targetBodyId = getBodyByRank(targetRank).id;

          const scales = [];
          const makeScaleObj = (id, type, leftItems, rightItems, equality) => {
            const lTorque = leftItems.reduce((s, it) => s + it.mass, 0);
            const rTorque = rightItems.reduce((s, it) => s + it.mass, 0);
            return {
              id,
              type,
              leftItems,
              rightItems,
              leftDistance: 1,
              rightDistance: 1,
              leftTorque: lTorque,
              rightTorque: rTorque,
              targetAngle: equality ? 0 : computeTorqueTiltAngle(lTorque, rTorque),
              currentAngle: 0,
              angularVel: 0,
              settled: false,
              equality,
            };
          };

          const makeSimple = (id, a, b) => {
            const flip = rng() < 0.5;
            const left = flip ? b : a;
            const right = flip ? a : b;
            return makeScaleObj(
              id,
              'simple',
              [{ type: 'body', id: left.id, bodyId: left.id, mass: left.mass }],
              [{ type: 'body', id: right.id, bodyId: right.id, mass: right.mass }],
              false
            );
          };

          const r0 = getBodyByRank(0);
          const r1 = getBodyByRank(1);
          const r2 = bodyCount >= 3 ? getBodyByRank(2) : null;
          const r3 = bodyCount >= 4 ? getBodyByRank(3) : null;
          const r4 = bodyCount >= 5 ? getBodyByRank(4) : null;
          const r5 = bodyCount >= 6 ? getBodyByRank(5) : null;

          if (level === 1) {
            // Level 1: 1 or 2 comparisons, equal arms ONLY (arm 一样)
            if (scaleCount === 1) {
              scales.push(makeSimple('scale-1', r0, r1));
            } else if (r2) {
              scales.push(makeSimple('scale-1', r0, r1), makeSimple('scale-2', r1, r2));
            }
          } else if (level === 2 && r2) {
            // Level 2: 2 comparisons with equal arms.
            scales.push(makeSimple('scale-1', r1, r2));
            scales.push(makeSimple('scale-2', r0, r1));
          } else if (level === 3 && r2 && r3) {
            // Level 3: 3 comparisons, with equal arms
            scales.push(makeSimple('scale-1', r2, r3));
            scales.push(makeSimple('scale-2', r0, r1));
            scales.push(makeSimple('scale-3', r1, r2));
          } else if (level === 4 && r2 && r3 && r4) {
            // Level 4: 4 comparisons, with equal arms
            scales.push(makeSimple('scale-1', r3, r4));
            scales.push(makeSimple('scale-2', r0, r1));
            scales.push(makeSimple('scale-3', r1, r2));
            scales.push(makeSimple('scale-4', r2, r3));
          } else if (level === 5 && r2 && r3 && r4 && r5) {
            // Level 5: 5 or 6 comparisons, with equal arms
            scales.push(makeSimple('scale-1', r4, r5));
            scales.push(makeSimple('scale-2', r0, r1));
            scales.push(makeSimple('scale-3', r1, r2));
            scales.push(makeSimple('scale-4', r2, r3));
            scales.push(makeSimple('scale-5', r3, r4));
            if (scaleCount >= 6) {
              scales.push(makeSimple('scale-6', r0, r2));
            }
          }

          let modeLabel = 'LEVEL 1 · BEGINNER (EQUAL ARMS)';
          if (level === 2) modeLabel = 'LEVEL 2 · INTERMEDIATE (2 SCALES)';
          else if (level === 3) modeLabel = 'LEVEL 3 · ADVANCED (3 SCALES)';
          else if (level === 4) modeLabel = 'LEVEL 4 · EXPERT (4 SCALES)';
          else if (level === 5) modeLabel = 'LEVEL 5 · MASTER (' + scaleCount + ' SCALES)';

          return {
            wave,
            level,
            modeLabel,
            directive,
            directiveTitle,
            directiveSub,
            waveDurationSec: duration,
            bodies,
            scales,
            targetBodyId,
          };
        }

        
  return { createRng, shuffleArray, getWaveDurationSec, getLevelForWave, getLevelTimeBonusSec, calculateWaveDuration, computeTorqueTiltAngle, generateOverhauledPuzzle };
});
