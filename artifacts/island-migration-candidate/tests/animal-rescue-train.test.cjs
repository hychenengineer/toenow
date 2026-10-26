const { test } = require('node:test');
const assert = require('node:assert/strict');
let engine;
try { engine = require('../games/animal-rescue-train/engine.js'); } catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

test('rescue train engine is available', () => assert.ok(engine, 'missing rescue train state engine'));

// These fixtures catch premature failure, incompatible boarding and incomplete undo.
test('a third matching animal departs before a full-station failure check', () => {
  const game = new engine.Game({ queues: [['cat'], [], []], goals: { cat: 3 } });
  game.state.cars = [['cat', 'cat'], ['dog', 'dog'], ['rabbit', 'rabbit']];
  game.move(0, 0);
  assert.equal(game.state.status, 'won');
  assert.deepEqual(game.state.cars[0], []);
  assert.equal(game.state.rescued.cat, 3);
});

test('different species cannot board an occupied carriage or consume undo', () => {
  const game = new engine.Game({ carCount: 2, queues: [['cat', 'cat', 'cat'], ['dog', 'dog', 'dog']], goals: { cat: 3, dog: 3 } });
  assert.equal(game.move(0, 0), true);
  const before = structuredClone(game.state);
  assert.equal(game.move(1, 0), false);
  assert.deepEqual(game.state, before);
  assert.equal(game.move(0, 0), true);
  assert.deepEqual(game.state.cars[0], ['cat', 'cat']);
  assert.equal(game.undo(), true);
  assert.deepEqual(game.state, before);
  assert.equal(game.move(1, 0), false);
  assert.equal(game.canUndo, false);
  assert.equal(game.move(1, 1), true);
});

test('station loses with empty seats when no queue head matches any carriage', () => {
  const game = new engine.Game({ carCount: 2, queues: [['cat', 'rabbit', 'cat', 'cat'], ['dog', 'rabbit', 'dog', 'dog']], goals: { cat: 3, dog: 3 } });
  game.move(0, 0);
  game.move(1, 1);
  assert.equal(game.state.status, 'lost');
  assert.deepEqual(game.state.cars, [['cat'], ['dog']]);
  assert.equal(game.undo(), true);
  assert.equal(game.state.status, 'playing');
});

test('invalid moves do not consume an animal or replace undo; undo is one step only', () => {
  const game = new engine.Game({ queues: [['cat', 'dog'], ['dog'], []], goals: { cat: 3 } });
  const before = structuredClone(game.state);
  assert.equal(game.move(2, 0), false);
  assert.equal(game.move(0, 9), false);
  assert.equal(game.move(0.5, 0), false);
  assert.equal(game.move(0, 0), true);
  assert.equal(game.move(2, 0), false);
  assert.equal(game.undo(), true);
  assert.deepEqual(game.state, before);
  assert.equal(game.undo(), false);
});

test('undo restores departure and victory, restart resets counters and undo', () => {
  const game = new engine.Game({ queues: [['cat', 'cat', 'cat'], [], []], goals: { cat: 3 } });
  game.move(0, 0); game.move(0, 0);
  const before = structuredClone(game.state);
  game.move(0, 0);
  assert.equal(game.state.status, 'won');
  assert.equal(game.move(0, 1), false);
  game.undo();
  assert.deepEqual(game.state, before);
  game.move(0, 0); game.restart();
  assert.equal(game.state.moves, 0);
  assert.deepEqual(game.state.rescued, {});
  assert.equal(game.canUndo, false);
});

test('queue exhaustion loses only if targets are unmet; victory needs every species', () => {
  const game = new engine.Game({ queues: [['cat', 'cat', 'cat', 'dog'], [], []], goals: { cat: 3, dog: 3 } });
  for (let i = 0; i < 3; i++) game.move(0, 0);
  assert.equal(game.state.status, 'playing');
  game.move(0, 0);
  assert.equal(game.state.status, 'lost');
  game.undo();
  assert.equal(game.state.status, 'playing');
});

test('departure frees a usable car even if other cars are blocked and goals remain', () => {
  const game = new engine.Game({ queues: [['cat', 'dog'], [], []], goals: { cat: 6 } });
  game.state.cars = [['cat', 'cat'], ['dog', 'dog'], ['rabbit', 'rabbit']];
  game.move(0, 0);
  assert.equal(game.state.status, 'playing');
  assert.equal(game.move(0, 0), true);
  assert.deepEqual(game.state.cars[0], ['dog']);
});

test('all five fixed levels have independently replayed winning paths', () => {
  const { verify } = require('../tools/verify-animal-rescue-train.cjs');
  assert.equal(verify().length, 5);
});

test('DFS solver skips incompatible cars and supports growing station sizes', () => {
  const { solve } = require('../tools/rescue-train-solver.cjs');
  const level = { queues: [['cat', 'fox', 'dog', 'cat'], ['dog', 'fox', 'rabbit', 'dog'], ['rabbit', 'fox', 'cat', 'rabbit']], goals: { cat: 3, dog: 3, rabbit: 3, fox: 3 } };
  assert.equal(solve(level).path, null);
  assert.ok(solve({ ...level, carCount: 4 }).path);
  assert.ok(solve({ carCount: 2, queues: [['cat', 'cat', 'cat'], ['dog', 'dog', 'dog']], goals: { cat: 3, dog: 3 } }).path);
});

test('solver rejects solutions that send the required last animal too early', () => {
  const { solve } = require('../tools/rescue-train-solver.cjs');
  const level = { carCount: 1, queues: [['cat', 'cat', 'cat', 'dog', 'dog', 'dog']], goals: { cat: 3, dog: 3 } };
  assert.ok(solve(level).path);
  assert.equal(solve({ ...level, requiredLastAnimal: 'cat' }).path, null);
});
