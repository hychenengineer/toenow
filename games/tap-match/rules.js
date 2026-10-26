// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root, require('./data.js'));
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['tap-match'] = games['tap-match'] || {};
    game.rules = factory(root, game.data);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window, data) {
  'use strict';
const { SHAPES, GLYPHS, COLORS } = data;
function getWaveConfig(wave) {
          // 5 Structured Levels (5 Waves each = 25 waves curriculum):
          // Level 1: Beginner (Waves 1-5, 3x3 Matrix, 20 hits)
          // Level 2: Intermediate (Waves 6-10, 4x4 Matrix, 22-24 hits)
          // Level 3: Advanced (Waves 11-15, 5x5 Matrix, 25-27 hits)
          // Level 4: Expert (Waves 16-20, 5x5 Matrix, 28-30 hits, rapid pacing)
          // Level 5: Master (Waves 21+, 5x5 Matrix, 32+ hits, 400ms reflex window)
          const tierPresets = [
            // Level 1: Beginner (Waves 1-5, 3x3)
            { level: 1, levelName: 'BEGINNER', gridSize: 3, speedLabel: 'SLOW', activeWindowMs: 2400, spawnIntervalMs: 850, maxConcurrentNodes: 3, waveQuota: 20 },
            { level: 1, levelName: 'BEGINNER', gridSize: 3, speedLabel: 'SLOW', activeWindowMs: 2200, spawnIntervalMs: 800, maxConcurrentNodes: 3, waveQuota: 20 },
            { level: 1, levelName: 'BEGINNER', gridSize: 3, speedLabel: 'MEDIUM', activeWindowMs: 1900, spawnIntervalMs: 720, maxConcurrentNodes: 3, waveQuota: 21 },
            { level: 1, levelName: 'BEGINNER', gridSize: 3, speedLabel: 'MEDIUM', activeWindowMs: 1650, spawnIntervalMs: 640, maxConcurrentNodes: 3, waveQuota: 21 },
            { level: 1, levelName: 'BEGINNER', gridSize: 3, speedLabel: 'FAST', activeWindowMs: 1400, spawnIntervalMs: 560, maxConcurrentNodes: 3, waveQuota: 22 },

            // Level 2: Intermediate (Waves 6-10, 4x4)
            { level: 2, levelName: 'INTERMEDIATE', gridSize: 4, speedLabel: 'SLOW', activeWindowMs: 2000, spawnIntervalMs: 720, maxConcurrentNodes: 4, waveQuota: 22 },
            { level: 2, levelName: 'INTERMEDIATE', gridSize: 4, speedLabel: 'SLOW', activeWindowMs: 1800, spawnIntervalMs: 650, maxConcurrentNodes: 4, waveQuota: 23 },
            { level: 2, levelName: 'INTERMEDIATE', gridSize: 4, speedLabel: 'MEDIUM', activeWindowMs: 1600, spawnIntervalMs: 580, maxConcurrentNodes: 4, waveQuota: 24 },
            { level: 2, levelName: 'INTERMEDIATE', gridSize: 4, speedLabel: 'MEDIUM', activeWindowMs: 1450, spawnIntervalMs: 520, maxConcurrentNodes: 4, waveQuota: 24 },
            { level: 2, levelName: 'INTERMEDIATE', gridSize: 4, speedLabel: 'FAST', activeWindowMs: 1280, spawnIntervalMs: 460, maxConcurrentNodes: 4, waveQuota: 25 },

            // Level 3: Advanced (Waves 11-15, 5x5)
            { level: 3, levelName: 'ADVANCED', gridSize: 5, speedLabel: 'SLOW', activeWindowMs: 1850, spawnIntervalMs: 650, maxConcurrentNodes: 5, waveQuota: 25 },
            { level: 3, levelName: 'ADVANCED', gridSize: 5, speedLabel: 'SLOW', activeWindowMs: 1650, spawnIntervalMs: 580, maxConcurrentNodes: 5, waveQuota: 26 },
            { level: 3, levelName: 'ADVANCED', gridSize: 5, speedLabel: 'MEDIUM', activeWindowMs: 1450, spawnIntervalMs: 520, maxConcurrentNodes: 5, waveQuota: 27 },
            { level: 3, levelName: 'ADVANCED', gridSize: 5, speedLabel: 'MEDIUM', activeWindowMs: 1300, spawnIntervalMs: 470, maxConcurrentNodes: 5, waveQuota: 27 },
            { level: 3, levelName: 'ADVANCED', gridSize: 5, speedLabel: 'FAST', activeWindowMs: 1150, spawnIntervalMs: 420, maxConcurrentNodes: 5, waveQuota: 28 },

            // Level 4: Expert (Waves 16-20, 5x5 Rapid)
            { level: 4, levelName: 'EXPERT', gridSize: 5, speedLabel: 'RAPID', activeWindowMs: 1050, spawnIntervalMs: 390, maxConcurrentNodes: 5, waveQuota: 28 },
            { level: 4, levelName: 'EXPERT', gridSize: 5, speedLabel: 'RAPID', activeWindowMs: 980, spawnIntervalMs: 360, maxConcurrentNodes: 6, waveQuota: 29 },
            { level: 4, levelName: 'EXPERT', gridSize: 5, speedLabel: 'INTENSE', activeWindowMs: 900, spawnIntervalMs: 330, maxConcurrentNodes: 6, waveQuota: 30 },
            { level: 4, levelName: 'EXPERT', gridSize: 5, speedLabel: 'INTENSE', activeWindowMs: 820, spawnIntervalMs: 300, maxConcurrentNodes: 6, waveQuota: 30 },
            { level: 4, levelName: 'EXPERT', gridSize: 5, speedLabel: 'HYPER', activeWindowMs: 750, spawnIntervalMs: 280, maxConcurrentNodes: 6, waveQuota: 32 }
          ];

          if (wave <= tierPresets.length) {
            return tierPresets[wave - 1];
          }

          // Level 5: Master (Wave 21+): 5x5 Matrix scaling down to 400ms floor
          const overWave = wave - 20;
          return {
            level: 5,
            levelName: 'MASTER',
            gridSize: 5,
            speedLabel: `MASTER ${overWave}`,
            activeWindowMs: Math.max(400, 700 - overWave * 40),
            spawnIntervalMs: Math.max(220, 260 - overWave * 10),
            maxConcurrentNodes: 6,
            waveQuota: Math.min(50, 32 + overWave * 2),

          };
        }

        function generateTargetCriteria(wave) {
          const randShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          const randGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          const randColorObj = COLORS[Math.floor(Math.random() * COLORS.length)];

          let mode = 'SHAPE';
          if (wave === 1) {
            mode = 'SHAPE';
          } else if (wave === 2) {
            mode = 'COLOR';
          } else if (wave === 3) {
            mode = 'GLYPH';
          } else if (wave === 4) {
            mode = 'SHAPE';
          } else if (wave === 5) {
            mode = 'COLOR_SHAPE';
          } else if (wave === 6) {
            mode = 'SHAPE_GLYPH';
          } else if (wave === 7) {
            mode = 'COLOR_SHAPE';
          } else if (wave === 8) {
            mode = 'COLOR_GLYPH';
          } else {
            const modes = ['COLOR_SHAPE', 'SHAPE_GLYPH', 'COLOR_GLYPH'];
            mode = modes[Math.floor(Math.random() * modes.length)];
          }

          let shape = null;
          let color = null;
          let glyph = null;
          let label = '';
          let rulePrimary = '';
          let ruleSecondary = '';
          let accentHex = '#00f0ff';
          let cssClass = 'hud-highlight-cyan';

          if (mode === 'SHAPE') {
            shape = randShape;
            label = `${shape}`;
            accentHex = '#f1f5f9';
            cssClass = 'hud-highlight-white';
            rulePrimary = `Tap any node with an outer <strong>${shape}</strong> shape.`;
            ruleSecondary = 'Color and inner symbol do not matter (any color / symbol).';
          } else if (mode === 'COLOR') {
            color = randColorObj.id;
            label = `${color} NODE`;
            accentHex = randColorObj.hex;
            cssClass = randColorObj.cssClass;
            rulePrimary = `Tap any node glowing in <strong>${color}</strong>.`;
            ruleSecondary = 'Outer shape and inner symbol do not matter (any shape / symbol).';
          } else if (mode === 'GLYPH') {
            glyph = randGlyph;
            label = `INNER ${glyph}`;
            accentHex = '#f1f5f9';
            cssClass = 'hud-highlight-white';
            rulePrimary = `Tap any node containing an inner <strong>${glyph}</strong> symbol.`;
            ruleSecondary = 'Color and outer shape do not matter (any color / shape).';
          } else if (mode === 'COLOR_SHAPE') {
            color = randColorObj.id;
            shape = randShape;
            label = `${color} ${shape}`;
            accentHex = randColorObj.hex;
            cssClass = randColorObj.cssClass;
            rulePrimary = `Tap only nodes that are both <strong>${color}</strong> and <strong>${shape}</strong>.`;
            ruleSecondary = 'Inner symbol does not matter (any symbol).';
          } else if (mode === 'SHAPE_GLYPH') {
            shape = randShape;
            glyph = randGlyph;
            label = `${shape} + ${glyph}`;
            accentHex = '#f1f5f9';
            cssClass = 'hud-highlight-white';
            rulePrimary = `Tap only <strong>${shape}</strong> nodes with an inner <strong>${glyph}</strong>.`;
            ruleSecondary = 'Node color does not matter (any color).';
          } else if (mode === 'COLOR_GLYPH') {
            color = randColorObj.id;
            glyph = randGlyph;
            label = `${color} ${glyph}`;
            accentHex = randColorObj.hex;
            cssClass = randColorObj.cssClass;
            rulePrimary = `Tap only <strong>${color}</strong> nodes with an inner <strong>${glyph}</strong>.`;
            ruleSecondary = 'Outer shape does not matter (any shape).';
          }

          return { mode, shape, color, glyph, label, rulePrimary, ruleSecondary, accentHex, cssClass };
        }

        function doesNodeMatchTarget(node, target) {
          if (target.shape && node.shape !== target.shape) return false;
          if (target.color && node.color !== target.color) return false;
          if (target.glyph && node.glyph !== target.glyph) return false;
          return true;
        }

        // Calibrated Score Curve:
        // Scaled for 20+ hits per wave. Cumulative score strictly below 5,000 pts prior to Wave 10.
        // Master tiers (Wave 10+) scale exponentially via hit streaks.
        function computeHitPoints(wave, streak) {
          if (wave < 10) {
            const base = 16 + Math.round(wave * 1.1);
            const streakBonus = Math.min(6, Math.floor(streak * 0.4));
            return Math.min(30, base + streakBonus);
          } else {
            const masterBase = 80 + (wave - 10) * 15;
            const expMultiplier = Math.pow(1.15, Math.min(streak, 18));
            return Math.round(masterBase * expMultiplier);
          }
        }

        // ==================================================
        // 5. SPATIAL MATRIX & SAFE BOUNDS CALCULATION
        // ==================================================
        
  return { getWaveConfig, generateTargetCriteria, doesNodeMatchTarget, computeHitPoints };
});
