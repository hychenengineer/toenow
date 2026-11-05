// Offline generation only: runtime chooses from certified puzzles, never blind shuffles.
const fs = require('node:fs');
const path = require('node:path');
const levels = require('../games/animal-rescue-train/levels.js');
const { analyze } = require('./rescue-train-difficulty.cjs');
let seed = 20261022;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const bands = [[1, 1], [.65, .9], [.25, .5], [.06, .16], [.005, .035]];
const bank = levels.map((level, index) => {
  const puzzles = [{ queues: level.queues, goals: level.goals, carCount: level.carCount }];
  const signature = queues => JSON.stringify(queues.map(queue => queue.join(',')).sort());
  const seen = new Set([signature(level.queues)]);
  for (let attempt = 0; puzzles.length < 5 && attempt < 30000; attempt++) {
    const animals = level.queues.flat();
    for (let i = animals.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [animals[i], animals[j]] = [animals[j], animals[i]]; }
    const queues = level.queues.map(() => []);
    animals.forEach((animal, i) => queues[i % queues.length].push(animal));
    const key = signature(queues);
    if (seen.has(key)) continue;
    const candidate = { queues, goals: level.goals, carCount: level.carCount };
    const result = analyze(candidate, { stopOnGreedyWin: index >= 2 });
    if (!result?.path || result.winProbability < bands[index][0] || result.winProbability > bands[index][1]) continue;
    if (index >= 2 && (result.criticalDecisions < index - 1 || result.visibleCriticalDecisions !== result.criticalDecisions || result.maxTrapDepth < (index - 1) * 2)) continue;
    seen.add(key); puzzles.push(candidate);
  }
  if (puzzles.length !== 5) throw new Error(`Level ${index + 1}: only ${puzzles.length} candidates; keep previous bank`);
  console.log(`Level ${index + 1}: five distinct verified puzzles`);
  return puzzles;
});
const output = '(function(root,factory){if(typeof module === "object" && module.exports)module.exports=factory();else root.RescuePuzzles=factory();})(globalThis,function(){return ' + JSON.stringify(bank, null, 2) + ';});\n';
fs.writeFileSync(path.resolve(__dirname, '../games/animal-rescue-train/puzzles.js'), output);
