// Offline calibration, not a player success prediction. Cars with identical contents
// are interchangeable. All passengers are required, so any mixed car is a dead end.
const { Game } = require('../games/animal-rescue-train/engine.js');

function analyze(level, { stopOnGreedyWin = false } = {}) {
  const names = Object.keys(level.goals);
  const queues = level.queues.map(queue => queue.map(animal => names.indexOf(animal)));
  const carCount = level.carCount ?? 3;
  const start = queues.map(() => 0);
  const counts = names.map(() => 0);
  queues.flat().forEach(animal => { if (animal < 0) throw new Error('Unknown animal'); counts[animal]++; });
  if (queues.length < 2 || !Number.isInteger(carCount) || carCount < 1 || names.some((animal, index) => counts[index] !== level.goals[animal] || counts[index] % 3)) {
    throw new Error('Calibration requires at least two queues, positive car count and exact complete-triple rescue goals');
  }
  const prefixes = queues.map(queue => {
    const result = [names.map(() => 0)];
    for (const animal of queue) { const next = [...result.at(-1)]; next[animal] = (next[animal] + 1) % 3; result.push(next); }
    return result;
  });
  const descriptions = new Map();
  function describe(position) {
    const key = position.join(',');
    if (descriptions.has(key)) return descriptions.get(key);
    const aboard = names.map((_, animal) => position.reduce((sum, index, queue) => sum + prefixes[queue][index][animal], 0) % 3);
    const active = aboard.filter(Boolean).length;
    const options = [];
    for (let queue = 0; queue < queues.length; queue++) {
      const animal = queues[queue][position[queue]];
      if (animal !== undefined && (aboard[animal] || active < carCount)) {
        const next = [...position]; next[queue]++;
        options.push({ queue, next, count: aboard[animal] });
      }
    }
    const description = { aboard, options, finished: position.every((index, queue) => index === queues[queue].length) };
    descriptions.set(key, description);
    return description;
  }
  const memo = new Map();
  function visit(position) {
    const key = position.join(',');
    if (memo.has(key)) return memo.get(key);
    const state = describe(position);
    const children = state.options.map(option => ({ ...option, result: visit(option.next) }));
    const probability = state.finished ? 1 : children.length ? children.reduce((sum, child) => sum + child.result.probability, 0) / children.length : 0;
    const result = { probability, children, survival: children.length ? 1 + Math.max(...children.map(child => child.result.survival)) : 0 };
    memo.set(key, result);
    return result;
  }
  // Optimistically treat any unrevealed queue head as an escape. A loss established
  // even with that optimism is demonstrable using only the current head + next 3.
  function visibleTrap(position, ends, seen = new Map()) {
    const key = position.join(',');
    if (seen.has(key)) return seen.get(key);
    if (position.some((index, queue) => index < queues[queue].length && index >= ends[queue])) return false;
    const state = describe(position);
    const trapped = !state.finished && state.options.every(option => visibleTrap(option.next, ends, seen));
    seen.set(key, trapped);
    return trapped;
  }
  let greedyWins = 0;
  const permute = values => values.length ? values.flatMap((value, index) => permute(values.filter((_, i) => i !== index)).map(tail => [value, ...tail])) : [[]];
  const orders = permute(queues.map((_, index) => index));
  for (const order of orders) for (const policy of ['complete', 'match', 'lane']) {
    let position = [...start];
    while (true) {
      const state = describe(position);
      if (state.finished) { if (stopOnGreedyWin) return null; greedyWins++; break; }
      if (!state.options.length) break;
      const priority = option => policy === 'complete' ? -option.count : policy === 'match' ? -Number(option.count > 0) : 0;
      const choices = [...state.options].sort((a, b) => priority(a) - priority(b) || order.indexOf(a.queue) - order.indexOf(b.queue));
      position = choices[0].next;
    }
  }
  const root = visit(start);
  let position = [...start], current = root;
  let criticalDecisions = 0, visibleCriticalDecisions = 0, maxTrapDepth = 0;
  const queuePath = [];
  while (current.probability > 0 && current.children.length) {
    const losing = current.children.filter(child => child.result.probability === 0);
    if (losing.length) {
      criticalDecisions++;
      const ends = position.map((index, queue) => Math.min(index + 4, queues[queue].length));
      if (losing.every(child => visibleTrap(child.next, ends))) visibleCriticalDecisions++;
      maxTrapDepth = Math.max(maxTrapDepth, ...losing.map(child => 1 + child.result.survival));
    }
    // Follow the safest continuation for the certificate; player decisions remain unrestricted.
    const next = current.children.filter(child => child.result.probability > 0).sort((a, b) => b.result.probability - a.result.probability)[0];
    queuePath.push(next.queue); position = next.next; current = next.result;
  }
  let path = null;
  if (root.probability > 0) {
    const game = new Game(level);
    path = queuePath.map(queue => {
      const animal = game.state.queues[queue][0];
      let car = game.state.cars.findIndex(passengers => passengers.length && passengers.every(a => a === animal));
      if (car < 0) car = game.state.cars.findIndex(passengers => !passengers.length);
      if (!game.move(queue, car)) throw new Error('Calibration certificate is not an actual engine move');
      return [queue, car];
    });
    if (game.state.status !== 'won') throw new Error('Calibration certificate failed to win');
  }
  return { winProbability: root.probability, greedyWins, greedyPolicies: orders.length * 3, criticalDecisions, visibleCriticalDecisions, maxTrapDepth, searched: memo.size, path };
}
module.exports = { analyze };

if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const levels = require('../games/animal-rescue-train/levels.js');
  const results = levels.map(level => ({ tier: level.tier, tierName: level.tierName, queues: level.queues.length, cars: level.carCount, animals: level.queues.flat().length, ...analyze(level) }));
  const directory = path.resolve(__dirname, '../artifacts/animal-rescue-train');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'difficulty.json'), JSON.stringify({
    model: 'Exact probability when choosing uniformly among legal non-mixing queue moves, with one car per active species. Not a measured human success rate.',
    fairness: 'Visible critical decisions refer to the reported certificate path, not every possible player history.',
    results
  }, null, 2) + '\n');
  results.forEach(result => console.log(`Tier ${result.tier} ${result.tierName}: ${result.queues} queues/${result.cars} cars, ${(result.winProbability * 100).toFixed(2)}% model success, ${result.greedyWins}/${result.greedyPolicies} greedy policies win, ${result.visibleCriticalDecisions}/${result.criticalDecisions} critical decisions visible, trap depth ${result.maxTrapDepth}`));
}
