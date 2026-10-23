const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyze } = require('../tools/rescue-train-difficulty.cjs');
const { replay } = require('../tools/verify-animal-rescue-train.cjs');

test('new puzzles use the whole tier before repeating, including across reloads', () => {
  const { createPicker } = require('../games/animal-rescue-train/picker.js');
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  for (const wave of [1, 6, 11, 16, 21]) {
    let previous;
    for (let cycle = 0; cycle < 3; cycle++) {
      const boards = new Set();
      for (let i = 0; i < 5; i++) {
        const level = createPicker({ storage, key: 'history', random: () => 0 }).pick(wave);
        const board = JSON.stringify(level.queues);
        assert.notEqual(board, previous, 'new starts must not repeat the preceding board');
        boards.add(board);
        previous = board;
      }
      assert.equal(boards.size, 5, 'all five puzzles should be used before recycling');
    }
  }
});

test('picker keeps working with unavailable or malformed storage', () => {
  const { createPicker } = require('../games/animal-rescue-train/picker.js');
  for (const storage of [
    { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } },
    { getItem: () => '{broken', setItem() {} },
    { getItem: () => JSON.stringify({ 0: { remaining: [99, 99], last: -1 } }), setItem() {} }
  ]) {
    const picker = createPicker({ storage, key: 'history', random: () => 0 });
    const boards = Array.from({ length: 5 }, () => JSON.stringify(picker.pick(1).queues));
    assert.equal(new Set(boards).size, 5);
  }
});

test('already-open tabs read the latest selection history before starting another puzzle', () => {
  const { createPicker } = require('../games/animal-rescue-train/picker.js');
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const firstTab = createPicker({ storage, key: 'history', random: () => 0 });
  const secondTab = createPicker({ storage, key: 'history', random: () => 0 });
  const boards = [firstTab.pick(1), secondTab.pick(1), firstTab.pick(1), secondTab.pick(1), firstTab.pick(1)];
  assert.equal(new Set(boards.map(board => JSON.stringify(board.queues))).size, 5);
});

test('saved random puzzle restores its exact board and rule without selecting a new one', () => {
  const { createPicker } = require('../games/animal-rescue-train/picker.js');
  const { saveProgress, restoreProgress } = require('../games/animal-rescue-train/session.js');
  const levels = require('../games/animal-rescue-train/levels.js');
  const picker = createPicker({ random: () => 0 });
  for (const wave of [1, 6, 11, 16, 21]) {
    picker.pick(wave);
    const level = picker.pick(wave);
    const data = saveProgress(Math.floor((wave - 1) / 5), level, [[0, 0]], true, { wave, isPractice: true });
    picker.pick(wave);
    const restored = restoreProgress(JSON.stringify(data), levels, picker.resolve);
    assert.ok(restored);
    assert.deepEqual(restored.game.level, level);
    assert.equal(restored.game.state.moves, 1);
    assert.equal(restored.isPractice, true);
    assert.equal(restoreProgress({ ...data, puzzleIndex: 99 }, levels, picker.resolve), null);
  }
  const legacy = { ...saveProgress(0, picker.resolve(1), []), wave: 1 };
  delete legacy.puzzleIndex;
  assert.ok(restoreProgress(legacy, levels, picker.resolve), 'existing v2 saves remain readable');
});

test('every selectable board and last-animal rule has an independently replayed winning path', () => {
  const { createPicker, validLastAnimals } = require('../games/animal-rescue-train/picker.js');
  const { solve } = require('../tools/rescue-train-solver.cjs');
  const { Game } = require('../games/animal-rescue-train/engine.js');
  const picker = createPicker();
  for (let tier = 0; tier < 5; tier++) for (let index = 0; index < 5; index++) {
    const rules = tier === 4 ? validLastAnimals[index] : [null];
    assert.ok(rules.length, 'each board must offer a solvable rule');
    for (const rule of rules) {
      const level = picker.resolve(tier * 5 + 1, rule, index);
      const { path } = solve(level);
      assert.ok(path, `tier ${tier + 1}, puzzle ${index}, last ${rule} must be solvable`);
      replay(level, path);
      const game = new Game(level);
      for (const action of path) assert.ok(game.move(...action));
      assert.equal(game.state.status, 'won');
      if (rule) assert.equal(game.state.departure.animal, rule);
    }
  }
});
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
