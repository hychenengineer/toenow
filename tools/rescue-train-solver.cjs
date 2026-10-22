// Exact DFS over real engine moves. Equivalent car permutations are memoized.
const { Game, advance, canBoard } = require('../games/animal-rescue-train/engine.js');
function solve(level, limit = 500000) {
  const seen = new Set();
  function visit(state) {
    if (state.status === 'won') return [];
    if (state.status === 'lost') return null;
    const key = JSON.stringify([state.queues, state.cars.map(car => [...car].sort().join(',')).sort(), state.rescued]);
    if (seen.has(key)) return null;
    if (seen.size >= limit) throw new Error(`Search budget exceeded (${limit}); no solvability claim`);
    seen.add(key);
    const choices = [];
    for (let queue = 0; queue < state.queues.length; queue++) {
      const animal = state.queues[queue][0];
      if (!animal) continue;
      const equivalent = new Set();
      for (let car = 0; car < state.cars.length; car++) {
        const passengers = state.cars[car];
        const signature = [...passengers].sort().join(',');
        if (!canBoard(state, queue, car) || equivalent.has(signature)) continue;
        equivalent.add(signature);
        choices.push({ queue, car, priority: passengers.length && passengers.every(a => a === animal) ? 0 : !passengers.length ? 1 : 2 });
      }
    }
    choices.sort((a, b) => a.priority - b.priority);
    for (const { queue, car } of choices) {
      const tail = visit(advance(state, level.goals, queue, car));
      if (tail) return [[queue, car], ...tail];
    }
    return null;
  }
  const path = visit(new Game(level).state);
  return { path, searched: seen.size };
}
module.exports = { solve };
