const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

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

  // Verify Title Screen, Start Button, and Level Elements are baked into React components
  assert.ok(bundle.includes('unified-title-screen'), 'Flash Brain bundle missing unified-title-screen');
  assert.ok(bundle.includes('unified-title-card'), 'Flash Brain bundle missing unified-title-card');
  assert.ok(bundle.includes('title-best-score'), 'Flash Brain bundle missing title-best-score');
  assert.ok(bundle.includes('title-best-level'), 'Flash Brain bundle missing title-best-level');
  assert.ok(bundle.includes('unified-start-btn'), 'Flash Brain bundle missing unified-start-btn');
  assert.ok(bundle.includes('START GAME'), 'Flash Brain bundle missing START GAME button text');

  // Verify 5-Level standard is encoded
  assert.ok(bundle.includes('LVL 1 · BEGINNER'), 'Flash Brain missing LVL 1 · BEGINNER mapping');
  assert.ok(bundle.includes('LVL 2 · INTERMEDIATE'), 'Flash Brain missing LVL 2 · INTERMEDIATE mapping');
  assert.ok(bundle.includes('LVL 3 · ADVANCED'), 'Flash Brain missing LVL 3 · ADVANCED mapping');
  assert.ok(bundle.includes('LVL 4 · EXPERT'), 'Flash Brain missing LVL 4 · EXPERT mapping');
  assert.ok(bundle.includes('LVL 5 · MASTER'), 'Flash Brain missing LVL 5 · MASTER mapping');

  // Verify Hub Game Over postMessage Contract
  assert.ok(bundle.includes('gameId:`flash-brain`'), 'Flash Brain missing postMessage gameId');
  assert.ok(bundle.includes('category:`memory`'), 'Flash Brain missing postMessage category');
});
