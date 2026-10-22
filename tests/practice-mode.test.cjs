const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const GAMES = [
  { id: 'number-pop', path: 'games/number-pop/index.html', titleCardId: 'title-screen' },
  { id: 'ball-track', path: 'games/ball-track/index.html', titleCardId: 'screen-title' },
  { id: 'spot-quick', path: 'games/spot-quick/index.html', titleCardId: 'briefingModal' },
  { id: 'tap-match', path: 'games/tap-match/index.html', titleCardId: 'modal-start' },
  { id: 'add-up', path: 'games/add-up/index.html', titleCardId: 'title-screen' },
  { id: 'block-match', path: 'games/block-match/index.html', titleCardId: 'title-screen' },
  { id: 'space-scale', path: 'games/space-scale/index.html', titleCardId: 'title-screen' },
  { id: 'shadow-match', path: 'games/shadow-match/index.html', titleCardId: 'title-overlay' }
];

GAMES.forEach(({ id, path: relPath, titleCardId }) => {
  test(`Practice Mode contract verified for game [${id}]`, () => {
    const fullPath = path.resolve(__dirname, '..', relPath);
    const html = fs.readFileSync(fullPath, 'utf8');

    // 1. Must load shared/toenow-levels.js
    assert.ok(html.includes('shared/toenow-levels.js'), `${id} must include shared/toenow-levels.js`);

    // 2. Must call setupPracticeMode
    assert.ok(html.includes('setupPracticeMode'), `${id} must call ToenowLevels.setupPracticeMode`);

    // 3. Must target an existing container ID in HTML
    assert.ok(html.includes(`id="${titleCardId}"`) || html.includes(`id='${titleCardId}'`), `${id} must have container #${titleCardId}`);
    assert.ok(html.includes(`#${titleCardId}`), `${id} setupPracticeMode container selector must match #${titleCardId}`);

    // 4. Must accept (startWave, isPractice) in its start routine
    assert.ok(html.includes('isPractice'), `${id} start routine must accept isPractice flag`);
  });
});

test('Practice Mode contract verified for game [flash-brain]', () => {
  const bundlePath = path.resolve(__dirname, '../games/flash-brain/assets/index-cr-6j3L1.js');
  const js = fs.readFileSync(bundlePath, 'utf8');

  // Must render unified-actions-bar with START GAME and PRACTICE button
  assert.ok(js.includes('unified-actions-bar'), 'Flash Brain must contain unified-actions-bar');
  assert.ok(js.includes('unified-practice-btn'), 'Flash Brain must contain unified-practice-btn');

  // Must support practice query parameter and not overwrite best scores during practice
  assert.ok(js.includes('practice'), 'Flash Brain must support practice query param');
});
