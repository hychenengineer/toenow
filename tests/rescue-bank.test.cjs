const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyze } = require('../tools/rescue-train-difficulty.cjs');
const { replay } = require('../tools/verify-animal-rescue-train.cjs');
test('each shared difficulty has five genuinely distinct playable puzzles', () => {
  const bank = require('../games/animal-rescue-train/puzzles.js');
  assert.equal(bank.length, 5);
  bank.forEach((puzzles, index) => {
    assert.equal(puzzles.length, 5);
    assert.equal(new Set(puzzles.map(puzzle => JSON.stringify(puzzle.queues.map(queue => queue.join(',')).sort()))).size, 5);
    for (const puzzle of puzzles) {
      assert.equal(puzzle.queues.length, [2, 3, 3, 4, 5][index]);
      assert.equal(puzzle.carCount, [2, 2, 3, 3, 5][index]);
      const result = analyze(puzzle);
      assert.ok(result.path);
      const [minimum, maximum] = [[1, 1], [.65, .9], [.25, .5], [.06, .16], [.005, .50]][index];
      assert.ok(result.winProbability >= minimum && result.winProbability <= maximum, 'puzzle stays in its calibrated difficulty band');
      if (index >= 2 && index < 4) assert.equal(result.greedyWins, 0);
      replay(puzzle, result.path);
    }
  });
});
