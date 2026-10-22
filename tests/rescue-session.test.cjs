const { test } = require('node:test');
const assert = require('node:assert/strict');
const level = { carCount: 2, queues: [['cat', 'cat', 'cat'], ['dog', 'dog', 'dog']], goals: { cat: 3, dog: 3 } };
test('guest progress restores the selected difficulty, board and one-step undo', () => {
  const { saveProgress, restoreProgress } = require('../games/animal-rescue-train/session.js');
  const saved = saveProgress(1, level, [[0, 0], [0, 0], [0, 0]]);
  const restored = restoreProgress(saved, [level, level]);
  assert.equal(restored.index, 1);
  assert.equal(restored.game.state.rescued.cat, 3);
  assert.equal(restored.game.state.moves, 3);
  assert.equal(restored.game.undo(), true);
  assert.deepEqual(restored.game.state.cars[0], ['cat', 'cat']);
});
test('invalid or incompatible guest data is ignored instead of mutating a game', () => {
  const { saveProgress, restoreProgress } = require('../games/animal-rescue-train/session.js');
  const saved = saveProgress(0, level, [[0, 0]]);
  assert.equal(restoreProgress('not json', [level]), null);
  assert.equal(restoreProgress({ ...saved, actions: [[9, 9]] }, [level]), null);
  assert.equal(restoreProgress({ ...saved, index: 9 }, [level]), null);
  assert.equal(restoreProgress(saved, [{ ...level, carCount: 3 }]), null);
});
