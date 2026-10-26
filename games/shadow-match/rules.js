// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root, require('./shapes.js'));
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['shadow-match'] = games['shadow-match'] || {};
    game.rules = factory(root, game.shapes);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window, shapes) {
  'use strict';
const { SHAPE_VOCABULARY, ALL_SHAPE_IDS } = shapes;
function randomFloat() {
          if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const arr = new Uint32Array(1);
            window.crypto.getRandomValues(arr);
            return arr[0] / 4294967296;
          }
          return Math.random();
        }

        function traceShapePath(ctx, shapeId, radius) {
          const def = SHAPE_VOCABULARY[shapeId];
          if (!def) return;
          const verts = def.vertices;
          ctx.beginPath();
          for (let i = 0; i < verts.length; i++) {
            const px = verts[i][0] * radius;
            const py = verts[i][1] * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }

        // ============================================================================
        // 3. 5-TIER DIFFICULTY MATRIX & WAVE GENERATOR (ALWAYS 4 CARDS IN 2x2 GRID)
        // ============================================================================
        function getLevelSpecForWave(wave) {
          const w = Math.max(1, Math.floor(wave));
          const clears = w - 1;
          const levelNames = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER'];

          if (w <= 5) {
            // Level 1: Waves 1-5 (5 waves to clear)
            return {
              level: 1,
              levelName: 'BEGINNER',
              clearsInLevel: clears,
              requiredClears: 5,
              targetCount: 2,
              hasPhantom: false,
              cardCount: 4,
              gridCols: 2,
              gridRows: 2,
              speedPxPerSec: 45,
              spinRadPerSec: 0,
              scaleMin: 1.0,
              scaleMax: 1.0,
              parSeconds: 5.0,
              motionPattern: 'linear_bounce',
              statusBanner: 'LEVEL 1 · BEGINNER · TRACKING SILHOUETTES'
            };
          }
          if (w <= 10) {
            // Level 2: Waves 6-10 (5 waves to clear)
            const inLvl = w - 6;
            return {
              level: 2,
              levelName: 'INTERMEDIATE',
              clearsInLevel: inLvl,
              requiredClears: 5,
              targetCount: inLvl < 3 ? 2 : 3,
              hasPhantom: false,
              cardCount: 4,
              gridCols: 2,
              gridRows: 2,
              speedPxPerSec: 75,
              spinRadPerSec: 0.8,
              scaleMin: 1.0,
              scaleMax: 1.0,
              parSeconds: 4.5,
              motionPattern: 'center_cross',
              statusBanner: 'LEVEL 2 · INTERMEDIATE · TRACKING SILHOUETTES'
            };
          }
          if (w <= 15) {
            // Level 3: Waves 11-15 (5 waves to clear)
            const inLvl = w - 11;
            return {
              level: 3,
              levelName: 'ADVANCED',
              clearsInLevel: inLvl,
              requiredClears: 5,
              targetCount: 3,
              hasPhantom: false,
              cardCount: 4,
              gridCols: 2,
              gridRows: 2,
              speedPxPerSec: 110,
              spinRadPerSec: 1.5,
              scaleMin: 0.75,
              scaleMax: 1.25,
              parSeconds: 4.0,
              motionPattern: 'scale_breathing',
              statusBanner: 'LEVEL 3 · ADVANCED · ORBITAL OCCLUSION'
            };
          }
          if (w <= 20) {
            // Level 4: Waves 16-20 (5 waves to clear)
            const inLvl = w - 16;
            return {
              level: 4,
              levelName: 'EXPERT',
              clearsInLevel: inLvl,
              requiredClears: 5,
              targetCount: inLvl < 3 ? 3 : 4,
              hasPhantom: false,
              cardCount: 4,
              gridCols: 2,
              gridRows: 2,
              speedPxPerSec: 125,
              spinRadPerSec: 2.2,
              scaleMin: 0.88,
              scaleMax: 1.12,
              parSeconds: 3.5,
              motionPattern: 'orbital_vortex',
              statusBanner: 'LEVEL 4 · EXPERT · ORBITAL OCCLUSION'
            };
          }
          // Level 5: Waves 21+ (Master)
          return {
            level: 5,
            levelName: 'MASTER',
            clearsInLevel: w - 21,
            requiredClears: null,
            targetCount: 4,
            hasPhantom: true,
            cardCount: 4,
            gridCols: 2,
            gridRows: 2,
            speedPxPerSec: 145,
            spinRadPerSec: 2.8,
            scaleMin: 0.85,
            scaleMax: 1.15,
            parSeconds: 3.0,
            motionPattern: 'lissajous_strobe',
            statusBanner: 'LEVEL 5 · MASTER · TRACK & EXCLUDE CRIMSON PHANTOM!'
          };
        }

        function shuffleArray(items) {
          const arr = items.slice();
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(randomFloat() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
          }
          return arr;
        }

        function canonicalKey(shapes) {
          return shapes.slice().sort().join('|');
        }

        let lastWaveTargetKey = '';

        function generateWaveSetup(wave) {
          const spec = getLevelSpecForWave(wave);
          let targetShapes = [];

          for (let tTry = 0; tTry < 12; tTry++) {
            const pool = shuffleArray(ALL_SHAPE_IDS);
            targetShapes = pool.slice(0, spec.targetCount);
            if (!lastWaveTargetKey || canonicalKey(targetShapes) !== lastWaveTargetKey) {
              break;
            }
          }
          lastWaveTargetKey = canonicalKey(targetShapes);

          let phantomShape = null;
          if (spec.hasPhantom) {
            const cousins = [];
            targetShapes.forEach(function (t) {
              SHAPE_VOCABULARY[t].cousins.forEach(function (c) {
                if (targetShapes.indexOf(c) === -1 && cousins.indexOf(c) === -1) {
                  cousins.push(c);
                }
              });
            });
            if (cousins.length > 0) {
              phantomShape = cousins[Math.floor(randomFloat() * cousins.length)];
            } else {
              const rem = ALL_SHAPE_IDS.filter(function (s) {
                return targetShapes.indexOf(s) === -1;
              });
              phantomShape = rem[Math.floor(randomFloat() * rem.length)] || 'STAR_6';
            }
          }

          const usedKeys = new Set();
          usedKeys.add(canonicalKey(targetShapes));

          const decoySets = [];
          const neededDecoys = spec.cardCount - 1; // Always 3 decoys for 4 total cards

          // In Level 5, include a decoy that swaps a target shape for the Phantom Decoy shape
          if (phantomShape) {
            const indices = shuffleArray(
              targetShapes.map(function (_, idx) {
                return idx;
              })
            );
            for (let r = 0; r < indices.length && decoySets.length < 1; r++) {
              const decoy = targetShapes.slice();
              decoy[indices[r]] = phantomShape;
              const k = canonicalKey(decoy);
              if (!usedKeys.has(k)) {
                usedKeys.add(k);
                decoySets.push(shuffleArray(decoy));
              }
            }
          }

          let attempts = 0;
          while (decoySets.length < neededDecoys && attempts < 140) {
            attempts++;
            const replaceIdx = Math.floor(randomFloat() * targetShapes.length);
            const orig = targetShapes[replaceIdx];
            const cousins = SHAPE_VOCABULARY[orig].cousins.filter(function (c) {
              return targetShapes.indexOf(c) === -1;
            });
            const fallback = ALL_SHAPE_IDS.filter(function (s) {
              return targetShapes.indexOf(s) === -1;
            });
            const candidates = cousins.length > 0 && attempts < 65 ? cousins : fallback;
            const replacement = candidates[Math.floor(randomFloat() * candidates.length)];
            if (!replacement) continue;

            const decoy = targetShapes.slice();
            decoy[replaceIdx] = replacement;

            if (attempts > 45 && targetShapes.length >= 3) {
              const secondIdx = (replaceIdx + 1) % targetShapes.length;
              const secondPool = ALL_SHAPE_IDS.filter(function (s) {
                return decoy.indexOf(s) === -1;
              });
              if (secondPool.length > 0) {
                decoy[secondIdx] = secondPool[Math.floor(randomFloat() * secondPool.length)];
              }
            }

            const k = canonicalKey(decoy);
            if (!usedKeys.has(k)) {
              usedKeys.add(k);
              decoySets.push(shuffleArray(decoy));
            }
          }

          const correctCardIndex = Math.floor(randomFloat() * spec.cardCount);
          const cards = [];
          let dIdx = 0;
          for (let i = 0; i < spec.cardCount; i++) {
            if (i === correctCardIndex) {
              cards.push({
                index: i,
                shapes: shuffleArray(targetShapes),
                isCorrect: true
              });
            } else {
              cards.push({
                index: i,
                shapes: decoySets[dIdx++] || shuffleArray(targetShapes),
                isCorrect: false
              });
            }
          }

          return {
            wave: wave,
            spec: spec,
            targetShapes: targetShapes,
            phantomShape: phantomShape,
            cards: cards,
            correctCardIndex: correctCardIndex
          };
        }

        function resolveCapacitiveCardHit(px, py, cardRects, paddingPx) {
          const pad = typeof paddingPx === 'number' ? paddingPx : 15;
          for (let i = 0; i < cardRects.length; i++) {
            const r = cardRects[i];
            if (px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height) {
              return i;
            }
          }
          let bestIdx = -1;
          let bestDistSq = Infinity;
          for (let i = 0; i < cardRects.length; i++) {
            const r = cardRects[i];
            if (
              px >= r.x - pad &&
              px <= r.x + r.width + pad &&
              py >= r.y - pad &&
              py <= r.y + r.height + pad
            ) {
              const cx = Math.max(r.x, Math.min(px, r.x + r.width));
              const cy = Math.max(r.y, Math.min(py, r.y + r.height));
              const dx = px - cx;
              const dy = py - cy;
              const dSq = dx * dx + dy * dy;
              if (dSq < bestDistSq) {
                bestDistSq = dSq;
                bestIdx = i;
              }
            }
          }
          return bestIdx;
        }

        function getCognitiveTierBadge(score, accuracyPct, wavesResolved) {
          if (score >= 28000 || (wavesResolved >= 18 && accuracyPct >= 88)) {
            return {
              tier: 'ECLIPSE SAVANT',
              subtitle: 'Supreme spatial deconstruction under high-velocity occlusion'
            };
          }
          if (score >= 16000 || (wavesResolved >= 12 && accuracyPct >= 80)) {
            return {
              tier: 'PHANTOM INTERCEPTOR',
              subtitle: 'High-precision orbital silhouette separation & chiral lock'
            };
          }
          if (score >= 8000 || wavesResolved >= 7) {
            return {
              tier: 'KINETIC ANALYST',
              subtitle: 'Reliable vector contour recognition across multi-body drift'
            };
          }
          return {
            tier: 'OPTICAL INITIATE',
            subtitle: 'Baseline silhouette calibration established'
          };
        }

        // ============================================================================
        // 4. DOM REFERENCES & OFFSCREEN COMPOSITING BUFFERS
        // ============================================================================
        
  return { randomFloat, traceShapePath, getLevelSpecForWave, shuffleArray, canonicalKey, generateWaveSetup, resolveCapacitiveCardHit, getCognitiveTierBadge };
});
