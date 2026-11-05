// rules: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['add-up'] = games['add-up'] || {};
    game.rules = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
function evaluateSelection(selectedList) {
          if (!selectedList || selectedList.length === 0) return 0;
          let total = 0;
          for (let i = 0; i < selectedList.length; i++) {
            total += selectedList[i].value;
          }
          return total;
        }

        function randInt(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        // Time Reward Rules:
        // - 2 nodes: +0s
        // - 3 nodes: +5s
        // - 4+ nodes: +10s
        function calculateTimeRefund(nodeCount) {
          if (nodeCount <= 2) return 0;
          if (nodeCount === 3) return 5.0;
          return 10.0;
        }

        // Score Multiplier Rules:
        // - 2 nodes: 1x
        // - 3 nodes: 2x
        // - 4+ nodes: 3x
        function getChainMultiplier(nodeCount) {
          if (nodeCount <= 2) return 1.0;
          if (nodeCount === 3) return 2.0;
          return 3.0;
        }

        // Pure Addition Wave Generator:
        // Guarantees EVERY wave has 2-node, 3-node, AND 4-node solutions!
        // Uses hierarchical decomposition:
        //   c1 + c2 = target (2 nodes)
        //   (c1a + c1b) + c2 = target AND c1 + (c2a + c2b) = target (3 nodes)
        //   c1a + c1b + c2a + c2b = target (4 nodes)
        function getLevelInfoForWave(waveNum) {
          if (waveNum <= 5) return { level: 1, name: 'BEGINNER' };
          if (waveNum <= 10) return { level: 2, name: 'INTERMEDIATE' };
          if (waveNum <= 15) return { level: 3, name: 'ADVANCED' };
          if (waveNum <= 20) return { level: 4, name: 'EXPERT' };
          return { level: 5, name: 'MASTER' };
        }

        function generateWaveData(waveNum) {
          const lvlInfo = getLevelInfoForWave(waveNum);
          let targetVal = 20;

          // 5-Level Progressive Math Tuning (5 waves each):
          // Level 1: Beginner (Waves 1-5) -> target 16-30
          // Level 2: Intermediate (Waves 6-10) -> target 28-48
          // Level 3: Advanced (Waves 11-15) -> target 40-65, +1 extra decoy
          // Level 4: Expert (Waves 16-20) -> target 55-85, +2 extra decoys
          // Level 5: Master (Waves 21+) -> target 70-120, +2 extra decoys, fast reflex
          if (waveNum === 1) {
            targetVal = 20;
          } else if (waveNum <= 5) {
            targetVal = randInt(16, 30);
          } else if (waveNum <= 10) {
            targetVal = randInt(28, 48);
          } else if (waveNum <= 15) {
            targetVal = randInt(40, 65);
          } else if (waveNum <= 20) {
            targetVal = randInt(55, 85);
          } else {
            targetVal = randInt(70, 120);
          }

          const c1 = randInt(Math.max(4, Math.floor(targetVal * 0.35)), Math.floor(targetVal * 0.65));
          const c2 = targetVal - c1;

          const c1a = randInt(2, Math.max(2, c1 - 2));
          const c1b = c1 - c1a;

          const c2a = randInt(2, Math.max(2, c2 - 2));
          const c2b = c2 - c2a;

          const values = [c1, c2, c1a, c1b, c2a, c2b];

          const extra1 = randInt(2, Math.max(3, Math.floor(targetVal * 0.3)));
          values.push(extra1);

          if (waveNum >= 6) {
            const extra2 = Math.max(2, targetVal - c1a - extra1);
            values.push(extra2);
          }
          if (waveNum >= 16) {
            values.push(randInt(3, Math.max(4, Math.floor(targetVal * 0.4))));
          }

          const items = values.map(function (v) {
            return {
              op: 'add',
              value: v,
              label: String(v),
            };
          });

          if (waveNum > 1) {
            for (let i = items.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              const temp = items[i];
              items[i] = items[j];
              items[j] = temp;
            }
          }

          return {
            wave: waveNum,
            level: lvlInfo.level,
            levelName: lvlInfo.name,
            target: targetVal,
            items: items,
          };
        }

        
  return { evaluateSelection, randInt, calculateTimeRefund, getChainMultiplier, getLevelInfoForWave, generateWaveData };
});
