const { test } = require('node:test');
const assert = require('node:assert/strict');
const levels = require('../games/animal-rescue-train/levels.js');

test('difficulty analysis measures queue decisions rather than interchangeable car positions', () => {
  const { analyze } = require('../tools/rescue-train-difficulty.cjs');
  const easy = analyze({ queues: [['cat', 'cat', 'cat'], ['dog', 'dog', 'dog'], []], goals: { cat: 3, dog: 3 } });
  assert.equal(easy.winProbability, 1);
  assert.equal(easy.criticalDecisions, 0);
  assert.equal(easy.path.length, 6);
});

test('TOENOW tiers 1–5 have progressively narrower winning queue choices', () => {
  const { analyze } = require('../tools/rescue-train-difficulty.cjs');
  const bands = [[1, 1], [.65, .9], [.25, .5], [.06, .16], [.005, .035]];
  let previous = 2;
  levels.forEach((level, index) => {
    assert.equal(level.tier, index + 1);
    assert.equal(level.queues.length, [2, 3, 3, 4, 5][index]);
    assert.equal(level.carCount, [2, 2, 3, 3, 4][index]);
    const result = analyze(level);
    assert.ok(result.path, `Tier ${index + 1} must remain solvable`);
    const [min, max] = bands[index];
    assert.ok(result.winProbability >= min && result.winProbability <= max,
      `Tier ${index + 1}: ${result.winProbability} is outside ${min}..${max}`);
    assert.ok(result.winProbability < previous, 'difficulty must increase after symmetric car choices are removed');
    if (index >= 2) {
      assert.equal(result.greedyWins, 0, 'advanced tiers must defeat the measured one-step greedy policies');
      assert.ok(result.criticalDecisions >= index - 1, 'advanced tiers need genuine critical queue decisions');
      assert.equal(result.visibleCriticalDecisions, result.criticalDecisions, 'certificate critical traps must be demonstrable within the visible head + next three');
      assert.ok(result.maxTrapDepth >= (index - 1) * 2, 'advanced tiers have progressively longer maximum doomed continuations');
    }
    previous = result.winProbability;
  });
});

test('analysis identifies an impossible four-species queue dependency', () => {
  const { analyze } = require('../tools/rescue-train-difficulty.cjs');
  const level = { queues: [
    ['cat', 'fox', 'dog', 'cat'], ['dog', 'fox', 'rabbit', 'dog'], ['rabbit', 'fox', 'cat', 'rabbit']
  ], goals: { cat: 3, dog: 3, rabbit: 3, fox: 3 } };
  const result = analyze(level);
  assert.equal(result.winProbability, 0);
  assert.equal(result.path, null);
  assert.equal(result.greedyWins, 0);
  assert.equal(analyze({ ...level, carCount: 4 }).winProbability, 1, 'a fourth car opens the blocked fourth species');
});
