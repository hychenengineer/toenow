const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('source inspection follows local scripts and styles in page order without expanding shared dependencies', () => {
  const { readGamePage } = require('../tools/lib/game-source.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'toenow-modules-'));
  try {
    fs.writeFileSync(path.join(dir, 'style.css'), '.game { color: red; }');
    fs.writeFileSync(path.join(dir, 'rules.js'), 'const answer = 42;');
    fs.writeFileSync(path.join(dir, 'main.js'), 'window.result = answer;');
    const file = path.join(dir, 'index.html');
    fs.writeFileSync(file, '<link rel="stylesheet" href="./style.css"><script src="../../shared/sdk.js"></script><script src="./rules.js"></script><script>window.ready = true;</script><script src="main.js"></script>');
    const page = readGamePage(file);
    assert.match(page, /<style>\.game \{ color: red; \}<\/style>/);
    assert.match(page, /src="\.\.\/\.\.\/shared\/sdk.js"/);
    assert.ok(page.indexOf('const answer') < page.indexOf('window.ready'));
    assert.ok(page.indexOf('window.ready') < page.indexOf('window.result'));
    assert.ok(!readGamePage(file, { styles: false }).includes('<style>'));
    fs.unlinkSync(path.join(dir, 'main.js'));
    assert.throws(() => readGamePage(file), /main\.js/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('extracted rules preserve valid boards, unique numeric choices and matching criteria', () => {
  const numbers = require('../games/number-pop/rules.js');
  const shells = require('../games/ball-track/rules.js');
  const shadows = require('../games/shadow-match/rules.js');
  const scales = require('../games/space-scale/rules.js');
  const taps = require('../games/tap-match/rules.js');
  const blocks = require('../games/block-match/rules.js');
  for (let wave = 1; wave <= 30; wave++) {
    const used = new Set();
    for (let i = 0; i < numbers.getCoreCountForWave(wave); i++) {
      const item = numbers.generateWaveItem(wave, i, used);
      assert.ok(Number.isFinite(item.value));
      assert.ok(!used.has(item.value));
      used.add(item.value);
    }
    const config = shells.getWaveConfig(wave);
    for (const swap of shells.generateSwapSchedule(config)) {
      assert.notEqual(swap.pairA, swap.pairB);
      assert.ok(swap.pairA >= 0 && swap.pairA < config.shellCount);
      assert.ok(swap.pairB >= 0 && swap.pairB < config.shellCount);
    }
    const shadow = shadows.generateWaveSetup(wave);
    assert.equal(shadow.cards.length, 4);
    assert.equal(shadows.canonicalKey(shadow.cards[shadow.correctCardIndex].shapes), shadows.canonicalKey(shadow.targetShapes));
    const puzzle = scales.generateOverhauledPuzzle(wave, 12345);
    assert.ok(puzzle.bodies.some(body => body.id === puzzle.targetBodyId));
    assert.deepEqual(puzzle, scales.generateOverhauledPuzzle(wave, 12345));
    const target = taps.generateTargetCriteria(wave);
    assert.ok(taps.doesNodeMatchTarget({ shape: target.shape, color: target.color, glyph: target.glyph }, target));
    const board = blocks.generateWaveBoard(wave, 0);
    assert.equal(board.activeGrid.flat().filter(cell => cell === 2).length, board.remainingExcess);
    for (let r = 0; r < board.config.gridSize; r++) {
      for (let c = 0; c < board.config.gridSize; c++) {
        if (board.carvingTargetGrid[r][c] === 1) assert.equal(board.activeGrid[r][c], 1);
      }
    }
  }
});

test('Spot Quick rules produce four distinct choices including the target across all five tiers', () => {
  const rules = require('../games/spot-quick/rules.js');
  const { SPECIMEN_POOL } = require('../games/spot-quick/shapes.js');
  for (const wave of [1, 5, 6, 10, 11, 15, 16, 20, 21, 100]) {
    const tier = rules.getTierForWave(wave);
    assert.equal(tier.level, Math.min(5, Math.ceil(wave / 5)));
    for (const target of SPECIMEN_POOL) {
      const choices = rules.generateCandidatesForTier(target, tier);
      assert.equal(choices.length, 4);
      assert.equal(new Set(choices.map(c => c.id)).size, 4);
      assert.ok(choices.includes(target));
      // Small categories intentionally use the existing cross-category fallback.
      if (tier.level === 1 && SPECIMEN_POOL.filter(c => c.cluster === target.cluster).length >= 4) {
        assert.ok(choices.every(c => c.cluster === target.cluster));
      }
    }
  }
  assert.deepEqual([0, 2.5, 5, 7.5].map(t => rules.getCurrentScoreTier(t, 10)), [100, 60, 30, 10]);
});

test('renderers use current scene dependencies instead of capturing stale values', () => {
  const { createRenderer } = require('../games/block-match/renderer.js');
  let currentCtx;
  const seen = [];
  const ctx = new Proxy({}, { get: (_, key) => (...args) => seen.push([key, ...args]), set: () => true });
  const renderer = createRenderer({ get ctx() { return currentCtx; }, dustParticles: [] });
  assert.equal(typeof renderer.drawBackground, 'function');
  currentCtx = ctx;
  renderer.drawBackground(100, 200);
  currentCtx = new Proxy({}, { get: () => () => {}, set: () => true });
  renderer.drawBackground(300, 200);
  assert.ok(seen.some(([key, , , w]) => key === 'fillRect' && w === 100));
  assert.ok(!seen.some(([key, , , w]) => key === 'fillRect' && w === 300));
});
