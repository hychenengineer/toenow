// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['number-pop'] = games['number-pop'] || {};
    game.rules = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
function shouldTriggerPerkDraft() {
          return false;
        }

        function getWaveType(wave) {
          // Level 1: Beginner (Waves 1-5) -> Single & Double digit integers
          if (wave <= 2) return 'SINGLE_DIGIT';
          if (wave <= 5) return 'DOUBLE_DIGIT';
          // Level 2: Intermediate (Waves 6-10) -> Triple digit & Positive/Negative
          if (wave <= 8) return 'TRIPLE_DIGIT';
          if (wave <= 10) return 'POS_NEG_INT';
          // Level 3: Advanced (Waves 11-15) -> Decimals & Same Numerator Fractions
          if (wave <= 13) return 'DECIMALS_INT';
          if (wave <= 15) return 'FRACTIONS_SAME_NUMERATOR';
          // Level 4: Expert (Waves 16-20) -> Same Denominator & Mixed Fractions
          if (wave <= 18) return 'FRACTIONS_SAME_DENOMINATOR';
          if (wave <= 20) return 'PURE_FRACTIONS';
          // Level 5: Master (Waves 21+) -> Tri-System & Ultimate Singularity
          if (wave <= 25) return 'TRI_SYSTEM_POS';
          return 'ULTIMATE_SINGULARITY';
        }

        function isBreatherWave() {
          return false;
        }

        // 1. Dynamic Time Decay Multiplier (Accelerated Countdown)
        function getTimerDecayMultiplier(runDuration) {
          if (runDuration < 180) return 1.0;  // 00:00 - 03:00 (Stage 1 - Normal)
          if (runDuration < 360) return 1.35; // 03:00 - 06:00 (Stage 2 - Accelerated)
          if (runDuration < 480) return 1.8;  // 06:00 - 08:00 (Stage 3 - Overheat)
          return 2.8;                         // 08:00 - 10:00+ (Stage 4 - CRITICAL OVERLOAD)
        }

        // 2. Shrinking Time Bank Ceiling
        function getMaxBankableTime(runDuration) {
          if (runDuration < 300) return 60.0; // Minute 0-5: Max 60s
          if (runDuration < 360) return 45.0; // Minute 6: Max 45s
          if (runDuration < 420) return 35.0; // Minute 7: Max 35s
          if (runDuration < 480) return 25.0; // Minute 8: Max 25s
          return 15.0;                        // Minute 9+: Max 15s (High-stress emergency state)
        }

        function getTimerStageInfo(runDuration) {
          const maxBank = getMaxBankableTime(runDuration);
          if (runDuration < 180) {
            return {
              stage: 1,
              name: 'STAGE 1 · STABLE (1.0x)',
              multiplier: 1.0,
              isCritical: false,
              maxBank,
            };
          }
          if (runDuration < 360) {
            return {
              stage: 2,
              name: 'STAGE 2 · ACCELERATED (1.35x)',
              multiplier: 1.35,
              isCritical: false,
              maxBank,
            };
          }
          if (runDuration < 480) {
            return {
              stage: 3,
              name: 'STAGE 3 · OVERHEAT (1.8x)',
              multiplier: 1.8,
              isCritical: false,
              maxBank,
            };
          }
          return {
            stage: 4,
            name: 'STAGE 4 · CRITICAL OVERLOAD (2.8x)',
            multiplier: 2.8,
            isCritical: true,
            maxBank,
          };
        }

        function formatSurvivalTime(seconds) {
          const totalSec = Math.max(0, Math.floor(seconds));
          const m = Math.floor(totalSec / 60);
          const s = totalSec % 60;
          return (m < 10 ? '0' : '') + m + 'm ' + (s < 10 ? '0' : '') + s + 's';
        }

        // 3. Deep Late-Game Board Entropy: 8 to 9 floating cores at 8+ minutes
        function getCoreCountForWave(wave, runDuration = 0) {
          if (runDuration >= 480) {
            // Stage 4 Deep Late-Game Board Entropy: Spawn 8 to 9 floating cores simultaneously
            return 8 + (wave % 2);
          }
          if (wave <= 5) return 4;               // Level 1: 4 numbers
          if (wave <= 10) return 5;              // Level 2: 5 numbers
          if (wave <= 15) return 5 + (wave % 2); // Level 3: 5-6 numbers
          if (wave <= 20) return 6;              // Level 4: 6 numbers
          return 7;                              // Level 5: 7 numbers
        }

        function getWaveTierName(wave, runDuration = 0) {
          const type = getWaveType(wave);
          const lvlName = wave <= 5 ? 'LEVEL 1 · BEGINNER' :
                                wave <= 10 ? 'LEVEL 2 · INTERMEDIATE' :
                                wave <= 15 ? 'LEVEL 3 · ADVANCED' :
                                wave <= 20 ? 'LEVEL 4 · EXPERT' : 'LEVEL 5 · MASTER';
          const prefix = (runDuration >= 480 ? 'OVERLOAD · ' : '') + lvlName + ' · ';
          switch (type) {
            case 'SINGLE_DIGIT':
              return prefix + 'SINGLE-DIGIT INTEGERS';
            case 'DOUBLE_DIGIT':
              return prefix + 'DOUBLE-DIGIT INTEGERS';
            case 'TRIPLE_DIGIT':
              return prefix + 'TRIPLE-DIGIT SCALE';
            case 'POS_NEG_INT':
              return prefix + 'POSITIVE & NEGATIVE INTEGERS';
            case 'DECIMALS_INT':
              return prefix + 'DECIMALS & INTEGERS';
            case 'FRACTIONS_SAME_NUMERATOR':
              return prefix + 'FRACTIONS · SAME NUMERATOR';
            case 'FRACTIONS_SAME_DENOMINATOR':
              return prefix + 'FRACTIONS · SAME DENOMINATOR';
            case 'PURE_FRACTIONS':
              return prefix + 'FRACTIONS · MIXED';
            case 'TRI_SYSTEM_POS':
              return prefix + 'FRACTIONS + DECIMALS + INTEGERS';
            case 'ULTIMATE_SINGULARITY':
              return prefix + 'ULTIMATE SINGULARITY';
          }
        }

        function parseFractionLabel(label) {
          if (!label || typeof label !== 'string' || !label.includes('/')) return null;
          const trimmed = label.trim();
          const isSignedNegative = trimmed.startsWith('-');
          const unsigned = isSignedNegative ? trimmed.slice(1) : trimmed;
          const parts = unsigned.split('/');
          if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
          return {
            isSignedNegative,
            numerator: parts[0],
            denominator: parts[1],
          };
        }

        const FRACTIONS_POOL = [
          { label: '1/10', value: 0.1, fill: 0.1 },
          { label: '1/8', value: 0.125, fill: 0.125 },
          { label: '1/5', value: 0.2, fill: 0.2 },
          { label: '1/4', value: 0.25, fill: 0.25 },
          { label: '1/3', value: 1 / 3, fill: 1 / 3 },
          { label: '2/5', value: 0.4, fill: 0.4 },
          { label: '1/2', value: 0.5, fill: 0.5 },
          { label: '3/5', value: 0.6, fill: 0.6 },
          { label: '2/3', value: 2 / 3, fill: 2 / 3 },
          { label: '3/4', value: 0.75, fill: 0.75 },
          { label: '4/5', value: 0.8, fill: 0.8 },
          { label: '9/10', value: 0.9, fill: 0.9 },
        ];

        const NEGATIVE_FRACTIONS_POOL = [
          { label: '-3/4', value: -0.75, fill: 0.75 },
          { label: '-2/3', value: -2 / 3, fill: 2 / 3 },
          { label: '-1/2', value: -0.5, fill: 0.5 },
          { label: '-2/5', value: -0.4, fill: 0.4 },
          { label: '-1/3', value: -1 / 3, fill: 1 / 3 },
          { label: '-1/4', value: -0.25, fill: 0.25 },
        ];

        const DECIMALS_POOL = [
          0.1, 0.2, 0.25, 0.35, 0.4, 0.5, 0.6, 0.75, 0.85, 1.2, 1.5, 2.5, 3.5, 4.5,
        ];

        const NEGATIVE_DECIMALS_POOL = [
          -3.5, -2.5, -1.5, -1.2, -0.75, -0.5, -0.35, -0.25, -0.2, -0.1,
        ];

        function hasValueCollision(usedValues, candidate) {
          let collision = false;
          usedValues.forEach((v) => {
            if (Math.abs(v - candidate) < 1e-4) collision = true;
          });
          return collision;
        }

        function pickUniqueFromList(list, getValue, usedValues) {
          const start = Math.floor(Math.random() * list.length);
          for (let i = 0; i < list.length; i++) {
            const item = list[(start + i) % list.length];
            if (!hasValueCollision(usedValues, getValue(item))) {
              return item;
            }
          }
          return null;
        }

        function generateWaveItem(wave, index, usedValues, _runDuration = 0) {
          const waveType = getWaveType(wave);

          for (let attempt = 0; attempt < 250; attempt++) {
            if (waveType === 'SINGLE_DIGIT') {
              // Waves 1-3: Clean positive single-digit numbers (1 to 9)
              const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
              const picked = pickUniqueFromList(candidates, (n) => n, usedValues);
              if (picked !== null) {
                return { value: picked, label: String(picked) };
              }
            } else if (waveType === 'DOUBLE_DIGIT') {
              // Waves 4-6: Mix of single and double digits (e.g., 6, 23, 58, 89)
              const wantSingle = index === 0 || (index > 2 && Math.random() < 0.3);
              const val = wantSingle
                ? Math.floor(Math.random() * 9) + 1
                : Math.floor(Math.random() * 90) + 10;
              if (!hasValueCollision(usedValues, val)) {
                return { value: val, label: String(val) };
              }
            } else if (waveType === 'TRIPLE_DIGIT') {
              // Waves 7-9: Incorporate three-digit integers alongside double-digit integers
              const wantTriple = index <= 1 || (index > 2 && Math.random() < 0.65);
              const val = wantTriple
                ? Math.floor(Math.random() * 900) + 100
                : Math.floor(Math.random() * 90) + 10;
              if (!hasValueCollision(usedValues, val)) {
                return { value: val, label: String(val) };
              }
            } else if (waveType === 'POS_NEG_INT') {
              // Waves 10-12: Introduce negative integers alongside positive numbers (e.g., -45, -12, 0, 18, 150)
              const wantNeg = index <= 1 || (index >= 4 && Math.random() < 0.5);
              const val = wantNeg
                ? -(Math.floor(Math.random() * 95) + 1)
                : Math.floor(Math.random() * 180);
              if (!hasValueCollision(usedValues, val)) {
                return { value: val, label: String(val) };
              }
            } else if (waveType === 'DECIMALS_INT') {
              // Waves 13-15: Incorporate simple decimals alongside integers (e.g., -6, 0.25, 0.75, 2, 4.5)
              const wantDecimal = index <= 1 || (index >= 4 && Math.random() < 0.5);
              if (wantDecimal) {
                const d = pickUniqueFromList(DECIMALS_POOL, (n) => n, usedValues);
                if (d !== null) {
                  return { value: d, label: String(d) };
                }
              } else {
                const isNeg = index === 2 || (index > 3 && Math.random() < 0.45);
                const val = isNeg
                  ? -(Math.floor(Math.random() * 15) + 1)
                  : Math.floor(Math.random() * 20) + 1;
                if (!hasValueCollision(usedValues, val)) {
                  return { value: val, label: String(val) };
                }
              }
            } else if (waveType === 'FRACTIONS_SAME_NUMERATOR') {
              // Same Numerator, Different Denominators (e.g. Wave 14 -> 1, Wave 15 -> 2)
              const fixedNumerator = Math.max(1, ((wave - 14 + 100) % 3) + 1);
              const denominators = [
                fixedNumerator + 1,
                fixedNumerator + 2,
                fixedNumerator + 3,
                fixedNumerator + 4,
                fixedNumerator + 5,
                fixedNumerator + 6,
                fixedNumerator + 7,
                fixedNumerator + 8,
                fixedNumerator + 9,
              ];
              const den = pickUniqueFromList(
                denominators,
                (d) => fixedNumerator / d,
                usedValues
              );
              if (den !== null) {
                const val = fixedNumerator / den;
                return {
                  value: val,
                  label: fixedNumerator + '/' + den,
                  fractionGauge: val,
                };
              }
            } else if (waveType === 'FRACTIONS_SAME_DENOMINATOR') {
              // Same Denominator, Different Numerators (e.g. Wave 16 -> 10, Wave 17 -> 11)
              const fixedDenominator = Math.max(2, 10 + ((wave - 16 + 100) % 3));
              const numerators = [];
              for (let n = 1; n < fixedDenominator; n++) {
                numerators.push(n);
              }
              const num = pickUniqueFromList(
                numerators,
                (n) => n / fixedDenominator,
                usedValues
              );
              if (num !== null) {
                const val = num / fixedDenominator;
                return {
                  value: val,
                  label: num + '/' + fixedDenominator,
                  fractionGauge: val,
                };
              }
            } else if (waveType === 'PURE_FRACTIONS') {
              // Waves 22-24: Mixed Numerators & Denominators with radial pie-slice indicator
              const f = pickUniqueFromList(FRACTIONS_POOL, (item) => item.value, usedValues);
              if (f !== null) {
                return { value: f.value, label: f.label, fractionGauge: f.fill };
              }
            } else if (waveType === 'TRI_SYSTEM_POS') {
              // Waves 25-27: Fractions + Decimals + Integers without negative values
              const category = index < 3 ? index : Math.floor(Math.random() * 3);
              if (category === 0) {
                const f = pickUniqueFromList(FRACTIONS_POOL, (item) => item.value, usedValues);
                if (f !== null) {
                  return { value: f.value, label: f.label, fractionGauge: f.fill };
                }
              } else if (category === 1) {
                const d = pickUniqueFromList(DECIMALS_POOL, (n) => n, usedValues);
                if (d !== null) {
                  return { value: d, label: String(d) };
                }
              } else {
                const val = Math.floor(Math.random() * 18) + 1;
                if (!hasValueCollision(usedValues, val)) {
                  return { value: val, label: String(val) };
                }
              }
            } else {
              // Waves 28+: The Ultimate Singularity - All Systems + Negatives
              const bucket = index < 6 ? index : Math.floor(Math.random() * 6);
              if (bucket === 0) {
                const nf = pickUniqueFromList(NEGATIVE_FRACTIONS_POOL, (item) => item.value, usedValues);
                if (nf !== null) {
                  return { value: nf.value, label: nf.label, fractionGauge: nf.fill };
                }
              } else if (bucket === 1) {
                const nd = pickUniqueFromList(NEGATIVE_DECIMALS_POOL, (n) => n, usedValues);
                if (nd !== null) {
                  return { value: nd, label: String(nd) };
                }
              } else if (bucket === 2) {
                const nInt = -(Math.floor(Math.random() * 20) + 1);
                if (!hasValueCollision(usedValues, nInt)) {
                  return { value: nInt, label: String(nInt) };
                }
              } else if (bucket === 3) {
                const pf = pickUniqueFromList(FRACTIONS_POOL, (item) => item.value, usedValues);
                if (pf !== null) {
                  return { value: pf.value, label: pf.label, fractionGauge: pf.fill };
                }
              } else if (bucket === 4) {
                const pd = pickUniqueFromList(DECIMALS_POOL, (n) => n, usedValues);
                if (pd !== null) {
                  return { value: pd, label: String(pd) };
                }
              } else {
                const pInt = Math.floor(Math.random() * 24);
                if (!hasValueCollision(usedValues, pInt)) {
                  return { value: pInt, label: String(pInt) };
                }
              }
            }
          }

          let fallback = index + 1;
          while (hasValueCollision(usedValues, fallback)) fallback += 1;
          return { value: fallback, label: String(fallback) };
        }

        function formatNearMissMessage(score, previousBest) {
          if (score > previousBest || previousBest <= 0) {
            return 'NEW PERSONAL BEST RECORD!';
          }
          if (score === previousBest) {
            return 'TIED YOUR PERSONAL BEST RECORD!';
          }
          const diff = previousBest - score;
          return 'Only ' + diff.toLocaleString() + ' pts away from your Personal Best!';
        }

        // ============================================================================
        // ZERO-GC POOLED PARTICLE & FLOATING TEXT MANAGERS
        // ============================================================================
        
  return { shouldTriggerPerkDraft, getWaveType, isBreatherWave, getTimerDecayMultiplier, getMaxBankableTime, getTimerStageInfo, formatSurvivalTime, getCoreCountForWave, getWaveTierName, parseFractionLabel, hasValueCollision, pickUniqueFromList, generateWaveItem, formatNearMissMessage };
});
