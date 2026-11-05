// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['block-match'] = games['block-match'] || {};
    game.rules = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
var PHASE_BRIEFINGS = {
          6: {
            targetWave: 6,
            phaseNumber: 2,
            mode: 'FLIP-H',
            title: 'LEVEL 2 · INTERMEDIATE: HORIZONTAL MIRROR',
            badge: '[ LEVEL 2 · FLIP-H / \u25C4\u25BA ]',
            briefing: 'Grid expanded to 4x4! The blueprint is flipped LEFT to RIGHT. Mentally invert columns!',
            buttonText: '[ ENGAGE LEVEL 2 · WAVE 6 ]',
            animType: 'flip-h'
          },
          11: {
            targetWave: 11,
            phaseNumber: 3,
            mode: 'FLIP-V',
            title: 'LEVEL 3 · ADVANCED: VERTICAL MIRROR',
            badge: '[ LEVEL 3 · FLIP-V / \u25B2\u25BC ]',
            briefing: 'Grid expanded to 5x5! Blueprint is flipped TOP to BOTTOM. Mentally invert rows!',
            buttonText: '[ ENGAGE LEVEL 3 · WAVE 11 ]',
            animType: 'flip-v'
          },
          16: {
            targetWave: 16,
            phaseNumber: 4,
            mode: 'FLIP-HV',
            title: 'LEVEL 4 · EXPERT: DUAL 180\u00B0 INVERSION',
            badge: '[ LEVEL 4 · FLIP-HV / 180\u00B0 ]',
            briefing: 'Grid expanded to 6x6! Total inversion: flipped BOTH horizontally and vertically.',
            buttonText: '[ ENGAGE LEVEL 4 · WAVE 16 ]',
            animType: 'flip-hv'
          },
          21: {
            targetWave: 21,
            phaseNumber: 5,
            mode: 'FLIP-HV',
            title: 'LEVEL 5 · MASTER: SINGULARITY 7x7 MATRIX',
            badge: '[ LEVEL 5 · MASTER / 7x7 ]',
            briefing: 'Maximum spatial deconstruction on a full 7x7 grid! Carve with zero hesitation.',
            buttonText: '[ ENGAGE LEVEL 5 · WAVE 21 ]',
            animType: 'flip-hv'
          }
        };

        // --- 60-Wave Multi-Phase Curriculum (3 Waves Per Grid Size 3x3..7x7) ---
        function getPhaseForWave(wave) {
          var w = Math.max(1, Math.floor(wave));
          if (w <= 5) return { phase: 1, name: 'BEGINNER', notch: 'N' };
          if (w <= 10) return { phase: 2, name: 'INTERMEDIATE', notch: 'FLIP-H' };
          if (w <= 15) return { phase: 3, name: 'ADVANCED', notch: 'FLIP-V' };
          if (w <= 20) return { phase: 4, name: 'EXPERT', notch: 'FLIP-HV' };
          return { phase: 5, name: 'MASTER', notch: 'FLIP-HV' };
        }

        function getGridSizeForWave(wave) {
          var w = Math.max(1, Math.floor(wave));
          if (w <= 5) return 3;  // Level 1: 3x3
          if (w <= 10) return 4; // Level 2: 4x4
          if (w <= 15) return 5; // Level 3: 5x5
          if (w <= 20) return 6; // Level 4: 6x6
          return 7;              // Level 5: 7x7
        }

        function getWaveConfig(wave) {
          var w = Math.max(1, Math.floor(wave));
          var pInfo = getPhaseForWave(w);
          var gridSize = getGridSizeForWave(w);
          var subStep = (w - 1) % 5;
          var baseExcess =
            gridSize === 3 ? 2 :
            gridSize === 4 ? 3 :
            gridSize === 5 ? 5 :
            gridSize === 6 ? 7 : 9;
          var excessCount = baseExcess + (subStep >= 3 ? 1 : 0);

          return {
            wave: w,
            phase: pInfo.phase,
            phaseName: pInfo.name,
            gridSize: gridSize,
            excessCount: excessCount,
            compassNotch: pInfo.notch
          };
        }

        function rotateMatrixCW(m, turns) {
          var n = m.length;
          var t = ((turns % 4) + 4) % 4;
          var curr = m.map(function (row) { return row.slice(); });
          for (var i = 0; i < t; i++) {
            var next = Array.from({ length: n }, function () { return Array(n).fill(0); });
            for (var r = 0; r < n; r++) {
              for (var c = 0; c < n; c++) {
                next[c][n - 1 - r] = curr[r][c];
              }
            }
            curr = next;
          }
          return curr;
        }

        function applySpatialTransform(matrix, mode) {
          var n = matrix.length;
          var out = Array.from({ length: n }, function () { return Array(n).fill(0); });
          for (var r = 0; r < n; r++) {
            for (var c = 0; c < n; c++) {
              if (mode === 'N') {
                out[r][c] = matrix[r][c];
              } else if (mode === 'FLIP-H') {
                out[r][c] = matrix[r][n - 1 - c];
              } else if (mode === 'FLIP-V') {
                out[r][c] = matrix[n - 1 - r][c];
              } else {
                out[r][c] = matrix[n - 1 - r][n - 1 - c];
              }
            }
          }
          return out;
        }

        function generateProceduralTemplate(gridSize) {
          var n = gridSize;
          var grid = Array.from({ length: n }, function () { return Array(n).fill(0); });
          var targetCells = Math.max(4, Math.floor(n * n * 0.48));
          var r = Math.floor(n / 2);
          var c = Math.floor(n / 2);
          grid[r][c] = 1;
          var count = 1;
          var attempts = 0;
          var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

          while (count < targetCells && attempts < 220) {
            attempts++;
            var d = dirs[Math.floor(Math.random() * dirs.length)];
            var nr = r + d[0];
            var nc = c + d[1];
            if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
              r = nr;
              c = nc;
              if (grid[r][c] === 0) {
                grid[r][c] = 1;
                count++;
              }
            }
          }

          if (grid[0][0] === grid[0][n - 1]) {
            grid[0][0] = 1;
            grid[0][n - 1] = 0;
          }
          if (grid[0][0] === grid[n - 1][0]) {
            grid[n - 1][0] = 0;
          }
          return grid;
        }

        function generateWaveBoard(wave, elapsed) {
          var config = getWaveConfig(wave);
          var basePattern = generateProceduralTemplate(config.gridSize);
          var carvingTargetGrid = rotateMatrixCW(basePattern, Math.floor(Math.random() * 4));
          var blueprintGrid = applySpatialTransform(carvingTargetGrid, config.compassNotch);
          var n = config.gridSize;

          var activeGrid = [];
          var emptyCoords = [];
          for (var r = 0; r < n; r++) {
            var row = [];
            for (var c = 0; c < n; c++) {
              if (carvingTargetGrid[r][c] === 1) {
                row.push(1);
              } else {
                row.push(0);
                emptyCoords.push([r, c]);
              }
            }
            activeGrid.push(row);
          }

          for (var i = emptyCoords.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = emptyCoords[i];
            emptyCoords[i] = emptyCoords[j];
            emptyCoords[j] = tmp;
          }

          var placedExcess = 0;
          var idx = 0;
          while (placedExcess < config.excessCount && idx < emptyCoords.length) {
            var coord = emptyCoords[idx++];
            activeGrid[coord[0]][coord[1]] = 2; // EXCESS
            placedExcess++;
          }

          config.excessCount = placedExcess;

          return {
            config: config,
            carvingTargetGrid: carvingTargetGrid,
            blueprintGrid: blueprintGrid,
            activeGrid: activeGrid,
            remainingExcess: placedExcess,
            blocksShatteredInWave: 0,
            waveStartTime: elapsed
          };
        }

        
  return { PHASE_BRIEFINGS, getPhaseForWave, getGridSizeForWave, getWaveConfig, rotateMatrixCW, applySpatialTransform, generateProceduralTemplate, generateWaveBoard };
});
