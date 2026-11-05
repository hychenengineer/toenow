// Reproducible offline candidate search. Prints candidates; never modifies levels.js.
const { analyze } = require('./rescue-train-difficulty.cjs');
let seed = 221026;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const names = ['cat', 'dog', 'rabbit', 'fox', 'panda', 'pig', 'owl', 'bear'];
const specifications = [
  { tier: 2, queueCount: 3, carCount: 2, counts: [3, 3, 3], min: .65, max: .9, critical: 0 },
  { tier: 3, queueCount: 3, carCount: 3, counts: [6, 3, 3, 3, 3], min: .25, max: .5, critical: 1 },
  { tier: 4, queueCount: 4, carCount: 3, counts: [6, 6, 3, 3, 3, 3], min: .06, max: .16, critical: 2 },
  { tier: 5, queueCount: 5, carCount: 4, counts: [6, 6, 3, 3, 3, 3, 3, 3], min: .005, max: .035, critical: 3 }
];
for (const spec of specifications) {
  if (process.argv[2] && Number(process.argv[2]) !== spec.tier) continue;
  let found = false;
  for (let attempt = 0; attempt < 30000; attempt++) {
    const animals = spec.counts.flatMap((count, index) => Array(count).fill(names[index]));
    for (let i = animals.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [animals[i], animals[j]] = [animals[j], animals[i]];
    }
    const queues = Array.from({ length: spec.queueCount }, () => []); animals.forEach((animal, i) => queues[i % spec.queueCount].push(animal));
    const level = { tier: spec.tier, carCount: spec.carCount, queues, goals: Object.fromEntries(spec.counts.map((count, i) => [names[i], count])) };
    const result = analyze(level, { stopOnGreedyWin: spec.tier >= 3 });
    if (!result) continue;
    if (result.winProbability < spec.min || result.winProbability > spec.max ||
        (spec.tier >= 3 && result.greedyWins > 0) || result.criticalDecisions < spec.critical ||
        result.visibleCriticalDecisions !== result.criticalDecisions ||
        (spec.tier >= 3 && result.maxTrapDepth < (spec.tier - 2) * 2)) continue;
    const { path, ...metrics } = result;
    console.log(JSON.stringify({ ...level, metrics, attempt }));
    found = true; break;
  }
  if (!found) throw new Error(`No candidate for Tier ${spec.tier}; do not silently relax difficulty checks`);
}
