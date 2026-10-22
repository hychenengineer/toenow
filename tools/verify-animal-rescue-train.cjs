const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const levels = require('../games/animal-rescue-train/levels.js');
const { Game } = require('../games/animal-rescue-train/engine.js');
const { analyze } = require('./rescue-train-difficulty.cjs');

// Independently replay each certificate without the engine or solver's state transition.
function replay(level, moves) {
  const queues = level.queues.map(queue => [...queue]);
  const cars = Array.from({ length: level.carCount ?? 3 }, () => []);
  const rescued = {};
  for (const [queue, car] of moves) {
    assert.ok(queues[queue].length > 0 && cars[car].length < 3, 'certificate must use legal queue heads and free seats');
    const animal = queues[queue].shift();
    assert.ok(cars[car].every(passenger => passenger === animal), 'certificate must never mix species');
    cars[car].push(animal);
    if (cars[car].length === 3 && new Set(cars[car]).size === 1) {
      rescued[animal] = (rescued[animal] || 0) + 3;
      cars[car] = [];
    }
  }
  for (const [animal, count] of Object.entries(level.goals)) assert.ok(rescued[animal] >= count, `unmet goal: ${animal}`);
  return rescued;
}

function verify() {
  assert.equal(levels.length, 5);
  return levels.map((level, index) => {
    assert.equal(level.queues.length, [2, 3, 3, 4, 5][index]);
    const inventory = {};
    level.queues.flat().forEach(animal => inventory[animal] = (inventory[animal] || 0) + 1);
    assert.deepEqual(inventory, level.goals, 'every target must have exactly enough passengers');
    const solution = analyze(level);
    assert.ok(solution.path, `level ${index + 1} has no solution`);
    const rescued = replay(level, solution.path);
    const game = new Game(level);
    solution.path.forEach(([queue, car]) => assert.ok(game.move(queue, car)));
    assert.equal(game.state.status, 'won');
    return { level: index + 1, name: level.name, animals: level.queues.flat().length, species: Object.keys(level.goals).length,
      moves: solution.path.length, searched: solution.searched, rescued, certificate: solution.path };
  });
}
if (require.main === module) {
  const results = verify();
  const output = path.resolve(__dirname, '../artifacts/animal-rescue-train');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'solutions.json'), JSON.stringify(results, null, 2) + '\n');
  results.forEach(({ level, moves, searched }) => console.log(`PASS level ${level}: ${moves} moves, ${searched} searched states; independent replay passed`));
}
module.exports = { verify, replay };
