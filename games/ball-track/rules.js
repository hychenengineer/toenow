// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['ball-track'] = games['ball-track'] || {};
    game.rules = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
const EARLY_WAVE_TABLE = {
          1: { shells: 3, targets: 1, basePts: 100, rotating: false },
          2: { shells: 4, targets: 1, basePts: 120, rotating: false },
          3: { shells: 4, targets: 2, basePts: 150, rotating: false },
          4: { shells: 5, targets: 2, basePts: 180, rotating: false },
          5: { shells: 5, targets: 3, basePts: 220, rotating: false },
          6: { shells: 6, targets: 3, basePts: 280, rotating: false },
          7: { shells: 6, targets: 3, basePts: 350, rotating: true },
          8: { shells: 7, targets: 3, basePts: 450, rotating: true },
          9: { shells: 7, targets: 4, basePts: 600, rotating: true },
          10: { shells: 7, targets: 4, basePts: 750, rotating: true },
        };

        function getWaveConfig(wave, bonusTimeBufferMs = 0, calmDriftCount = 0) {
          const safeWave = Math.max(1, Math.floor(wave));

          let tier = 1;
          let tierName = 'SINGLE ORBIT';
          let shellCount = 3;
          let targetCount = 1;
          let baseWavePoints = 100;
          let isDualRing = false;
          let innerRingCount = 0;
          let outerRingCount = 3;
          let hasBoardRotation = false;
          let boardRotationSpeedRad = 0;
          let innerRingSpeedRad = 0;
          let outerRingSpeedRad = 0;
          let radialHopChance = 0;

          if (safeWave <= 10) {
            const spec = EARLY_WAVE_TABLE[safeWave];
            shellCount = spec.shells;
            targetCount = spec.targets;
            baseWavePoints = spec.basePts;
            isDualRing = false;
            innerRingCount = 0;
            outerRingCount = shellCount;
            hasBoardRotation = spec.rotating;
            if (safeWave <= 5) {
              tier = 1;
              tierName = 'LEVEL 1 · BEGINNER (SINGLE RING)';
            } else {
              tier = 2;
              tierName = 'LEVEL 2 · INTERMEDIATE (ROTATING ORBIT)';
              const dir = safeWave % 2 === 0 ? 1 : -1;
              boardRotationSpeedRad = dir * (0.28 + (safeWave - 6) * 0.035);
            }
          } else if (safeWave <= 15) {
            // Level 3: Advanced (Waves 11-15) - Dual Concentric Rings (3+3 to 4+4)
            tier = 3;
            tierName = 'LEVEL 3 · ADVANCED (DUAL RINGS)';
            isDualRing = true;
            if (safeWave <= 12) {
              shellCount = 6;
              innerRingCount = 3;
              outerRingCount = 3;
              targetCount = 3;
            } else {
              shellCount = 8;
              innerRingCount = 4;
              outerRingCount = 4;
              targetCount = 4;
            }
            baseWavePoints = Math.round(1000 * Math.pow(1.22, safeWave - 10));
            innerRingSpeedRad = 0.32 + (safeWave - 10) * 0.02; // CW
            outerRingSpeedRad = -(0.26 + (safeWave - 10) * 0.02); // CCW
            radialHopChance = 0.35;
          } else if (safeWave <= 20) {
            // Level 4: Expert (Waves 16-20) - Dual Concentric 4+4 with High Radial Hop
            tier = 4;
            tierName = 'LEVEL 4 · EXPERT (DUAL 4+4 HOP)';
            shellCount = 8;
            targetCount = 4;
            isDualRing = true;
            innerRingCount = 4;
            outerRingCount = 4;
            baseWavePoints = Math.round(2000 * Math.pow(1.25, safeWave - 15));
            innerRingSpeedRad = 0.40 + (safeWave - 15) * 0.025; // CW
            outerRingSpeedRad = -(0.35 + (safeWave - 15) * 0.025); // CCW
            radialHopChance = 0.48;
          } else {
            // Level 5: Master (Waves 21+) - Grandmaster High-Density Dynamic System
            tier = 5;
            tierName = 'LEVEL 5 · MASTER (SINGULARITY)';
            shellCount = safeWave <= 23 ? 9 : 10;
            targetCount = safeWave <= 22 ? 4 : 5;
            isDualRing = false;
            innerRingCount = 0;
            outerRingCount = shellCount;
            baseWavePoints = Math.round(4000 * Math.pow(1.30, Math.min(10, safeWave - 20)));
            hasBoardRotation = true;
            const dir = safeWave % 2 === 0 ? 1 : -1;
            boardRotationSpeedRad = dir * Math.min(1.05, 0.52 + (safeWave - 20) * 0.035);
          }

          // Calm Drift perk slows shuffling speed by 15% per stack
          const calmSlowFactor = Math.pow(1 / 0.85, Math.max(0, calmDriftCount));
          boardRotationSpeedRad /= calmSlowFactor;
          innerRingSpeedRad /= calmSlowFactor;
          outerRingSpeedRad /= calmSlowFactor;

          const swapCount = Math.min(14, 4 + Math.floor(safeWave * 0.75));
          const rawSwapDurationMs = Math.max(540, 740 - safeWave * 11);
          const swapDurationMs = Math.round(rawSwapDurationMs * calmSlowFactor);

          const lineupDurationMs = 1200; // 1.2s top-right TARGET lineup
          const insertDurationMs = 750; // Smooth Bezier insertion into circular orbit
          const readyDurationMs = 600; // 0.6s "READY" staging beat
          const goDurationMs = 400; // 0.4s "GO!" launch beat

          const baseSelectMs = Math.max(
            4500,
            5400 - safeWave * 90 + (targetCount - 1) * 900 + Math.max(0, shellCount - 5) * 350
          );
          const selectDurationMs = baseSelectMs + Math.max(0, bonusTimeBufferMs);

          return {
            wave: safeWave,
            tier,
            tierName,
            shellCount,
            targetCount,
            baseWavePoints,
            isDualRing,
            innerRingCount,
            outerRingCount,
            swapCount,
            swapDurationMs,
            lineupDurationMs,
            insertDurationMs,
            readyDurationMs,
            goDurationMs,
            selectDurationMs,
            hasBoardRotation,
            boardRotationSpeedRad,
            innerRingSpeedRad,
            outerRingSpeedRad,
            radialHopChance,
          };
        }

        // Strict Early-Game Score Pacing: Waves 1-9 strictly < 4,800 cumulative cap; Wave 10+ 1,200+ exponential lift
        function calculateWaveClearScore(params) {
          const {
            wave,
            baseWavePoints,
            currentTotalScore,
            overdriveMultiplier,
            hasDoubleSurge,
            mistakesThisWave,
          } = params;

          const doubleSurgeTriggered = Boolean(hasDoubleSurge && mistakesThisWave === 0);
          const surgeMult = doubleSurgeTriggered ? 2.0 : 1.0;
          const odMult = Math.max(1.0, Math.min(3.5, overdriveMultiplier));

          if (wave <= 9) {
            const clampedCombinedMult = Math.min(1.9, odMult * surgeMult);
            const rawWaveScore = Math.round(baseWavePoints * clampedCombinedMult);
            const maxAllowedTotal = 4780;
            const cappedTotal = Math.min(maxAllowedTotal, currentTotalScore + rawWaveScore);
            const waveScore = Math.max(0, cappedTotal - currentTotalScore);
            return {
              waveScore,
              newTotalScore: cappedTotal,
              doubleSurgeTriggered,
            };
          }

          const waveScore = Math.round(baseWavePoints * odMult * surgeMult);
          return {
            waveScore,
            newTotalScore: currentTotalScore + waveScore,
            doubleSurgeTriggered,
          };
        }

        function calculateSpeedMultiplier(remainingMs, totalSelectMs, streak) {
          if (totalSelectMs <= 0) return 1;
          const ratio = Math.max(0, Math.min(1, remainingMs / totalSelectMs));
          const speedBonus = ratio >= 0.65 ? 1.5 : ratio >= 0.35 ? 1.2 : 1.0;
          const streakBonus = Math.min(1.5, Math.floor(Math.max(0, streak) / 2) * 0.25);
          return Math.round((speedBonus + streakBonus) * 10) / 10;
        }

        function calculateOverdriveMultiplier(overdriveHeldMs) {
          const safeMs = Math.max(0, overdriveHeldMs);
          const rawBonus = Math.min(2.5, (safeMs / 1000) * 0.65);
          return Math.round((1.0 + rawBonus) * 10) / 10;
        }

        function generateSwapSchedule(config) {
          const steps = [];
          const curvePool = ['bezier_cw', 'bezier_ccw', 'bezier_wide_cw', 'bezier_wide_ccw'];
          let lastPairKey = '';

          for (let i = 0; i < config.swapCount; i++) {
            let a = 0;
            let b = 1;
            let isRadialHop = false;

            if (config.isDualRing && config.innerRingCount > 0 && config.outerRingCount > 0) {
              const doRadialHop = Math.random() < config.radialHopChance;
              if (doRadialHop) {
                isRadialHop = true;
                a = Math.floor(Math.random() * config.innerRingCount);
                b = config.innerRingCount + Math.floor(Math.random() * config.outerRingCount);
              } else {
                const useInner = Math.random() < 0.45;
                if (useInner) {
                  a = Math.floor(Math.random() * config.innerRingCount);
                  b = Math.floor(Math.random() * config.innerRingCount);
                  if (b === a) b = (a + 1) % config.innerRingCount;
                } else {
                  const offset = config.innerRingCount;
                  const localA = Math.floor(Math.random() * config.outerRingCount);
                  let localB = Math.floor(Math.random() * config.outerRingCount);
                  if (localB === localA) localB = (localA + 1) % config.outerRingCount;
                  a = offset + localA;
                  b = offset + localB;
                }
              }
            } else {
              a = Math.floor(Math.random() * config.shellCount);
              b = Math.floor(Math.random() * config.shellCount);
              if (b === a) b = (a + 1) % config.shellCount;
            }

            const minIdx = Math.min(a, b);
            const maxIdx = Math.max(a, b);
            const key = `${minIdx}-${maxIdx}`;

            if (key === lastPairKey && config.shellCount >= 3) {
              b = (b + 1) % config.shellCount;
              if (b === a) b = (a + 2) % config.shellCount;
              isRadialHop =
                config.isDualRing &&
                ((a < config.innerRingCount && b >= config.innerRingCount) ||
                  (b < config.innerRingCount && a >= config.innerRingCount));
            }
            lastPairKey = `${Math.min(a, b)}-${Math.max(a, b)}`;

            const curve = curvePool[Math.floor(Math.random() * curvePool.length)];
            const jitter = (Math.random() - 0.5) * 40;
            const durationMs = Math.max(500, Math.round(config.swapDurationMs + jitter));

            steps.push({
              pairA: a,
              pairB: b,
              durationMs,
              curve,
              isDecelerationStep: false,
              isRadialHop,
            });
          }

          let tailAccumMs = 0;
          for (let i = steps.length - 1; i >= 0; i--) {
            steps[i].isDecelerationStep = true;
            steps[i].durationMs = Math.round(steps[i].durationMs * 1.25);
            tailAccumMs += steps[i].durationMs;
            if (tailAccumMs >= 800) break;
          }

          return steps;
        }

        
  return { EARLY_WAVE_TABLE, getWaveConfig, calculateWaveClearScore, calculateSpeedMultiplier, calculateOverdriveMultiplier, generateSwapSchedule };
});
