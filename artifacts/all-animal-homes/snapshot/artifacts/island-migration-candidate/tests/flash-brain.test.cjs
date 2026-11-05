const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Flash garden progress adapter uses real SDK practice protection and normal milestones', () => {
  const vm = require('node:vm'), SDK = require('../shared/toenow-sdk.js');
  const previousWindow = global.window, previousStorage = global.localStorage;
  const values = {}, messages = [];
  global.localStorage = { getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = String(value); } };
  global.window = { parent: { postMessage: payload => messages.push(payload) } };
  try {
    const root = { document: { body: { dataset: { state: 'title' } } }, location: { search: '?practice=1' }, ToenowGameSDK: SDK };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../games/flash-brain/garden.js'), 'utf8'), { globalThis: root, URLSearchParams });
    root.FlashMemoryGarden.reportProgress(6); assert.equal(messages.length, 0);
    root.document.body.dataset.state = 'playing'; root.FlashMemoryGarden.reportProgress(6);
    assert.equal(messages.length, 0); assert.deepEqual(values, {});
    root.document.body.dataset.state = 'title'; root.FlashMemoryGarden.reportProgress(1);
    root.location.search = ''; root.document.body.dataset.state = 'playing'; root.FlashMemoryGarden.reportProgress(6);
    assert.equal(messages[0].type, 'GAME_PROGRESS'); assert.equal(messages[0].gameId, 'flash-brain');
    assert.equal(JSON.parse(values.toenow_game_milestones_v1)['flash-brain'], 1);
  } finally { global.window = previousWindow; global.localStorage = previousStorage; }
});

test('Game [flash-brain] bundle contains valid syntax, title records, start button, and game over contract', () => {
  const htmlPath = path.resolve(__dirname, '../games/flash-brain/index.html');
  const bundlePath = path.resolve(__dirname, '../games/flash-brain/assets/index-cr-6j3L1.js');

  assert.ok(fs.existsSync(htmlPath), 'games/flash-brain/index.html missing');
  assert.ok(fs.existsSync(bundlePath), 'games/flash-brain bundle missing');

  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="root"'), 'Root mount container missing in flash-brain/index.html');
  assert.ok(html.includes('unified-title-menu.css'), 'Unified title menu stylesheet missing in flash-brain/index.html');

  const bundle = fs.readFileSync(bundlePath, 'utf8');
  assert.ok(bundle.length > 50000, 'Flash Brain bundle appears truncated');

  // Verify bundle syntax parses cleanly
  try {
    new Function(bundle);
  } catch (err) {
    assert.fail(`Syntax error in Flash Brain JS bundle: ${err.message}`);
  }

  // React supplies host elements and callbacks; the shared library owns both templates.
  assert.ok(bundle.includes('ToenowScreens.renderTitle'));
  assert.ok(bundle.includes('ToenowScreens.renderGameOver'));
  assert.ok(html.includes('shared/toenow-screens.js'));
  assert.ok(!bundle.includes('className:`unified-title-card`'));

  // Verify Hub Game Over postMessage Contract
  assert.ok(bundle.includes('gameId:`flash-brain`'), 'Flash Brain missing postMessage gameId');
  assert.ok(bundle.includes('category:`memory`'), 'Flash Brain missing postMessage category');
});
