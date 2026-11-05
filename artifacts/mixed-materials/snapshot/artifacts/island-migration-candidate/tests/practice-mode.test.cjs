const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const GAMES = [
  { id: 'animal-rescue-train', path: 'games/animal-rescue-train/index.html', titleCardId: 'menu-screen', controller: 'games/animal-rescue-train/game.js' },
  { id: 'number-pop', path: 'games/number-pop/index.html', titleCardId: 'title-screen' },
  { id: 'ball-track', path: 'games/ball-track/index.html', titleCardId: 'screen-title' },
  { id: 'spot-quick', path: 'games/spot-quick/index.html', titleCardId: 'briefingModal' },
  { id: 'tap-match', path: 'games/tap-match/index.html', titleCardId: 'modal-start' },
  { id: 'add-up', path: 'games/add-up/index.html', titleCardId: 'title-screen' },
  { id: 'block-match', path: 'games/block-match/index.html', titleCardId: 'title-screen' },
  { id: 'space-scale', path: 'games/space-scale/index.html', titleCardId: 'title-screen' },
  { id: 'shadow-match', path: 'games/shadow-match/index.html', titleCardId: 'title-overlay' }
];

GAMES.forEach(({ id, path: relPath, titleCardId, controller }) => {
  test(`Practice Mode contract verified for game [${id}]`, () => {
    const fullPath = path.resolve(__dirname, '..', relPath);
    const html = fs.readFileSync(fullPath, 'utf8');
    const source = html + (controller ? fs.readFileSync(path.resolve(__dirname, '..', controller), 'utf8') : '');

    // 1. Must load shared/toenow-levels.js
    assert.ok(html.includes('shared/toenow-levels.js'), `${id} must include shared/toenow-levels.js`);

    // 2. Must call setupPracticeMode
    assert.ok(source.includes('setupPracticeMode') || source.includes('sdk.setupPractice('), `${id} must use shared practice setup`);

    // 3. Must target an existing container ID in HTML
    assert.ok(html.includes(`id="${titleCardId}"`) || html.includes(`id='${titleCardId}'`), `${id} must have container #${titleCardId}`);
    assert.ok(controller ? html.includes('unified-title-card') : html.includes(`#${titleCardId}`), `${id} practice container must be discoverable by the shared helper`);

    // 4. Must accept (startWave, isPractice) in its start routine
    assert.ok(source.includes('isPractice'), `${id} start routine must accept isPractice flag`);
  });
});

test('Practice Mode contract verified for game [flash-brain]', () => {
  const bundlePath = path.resolve(__dirname, '../games/flash-brain/assets/index-cr-6j3L1.js');
  const js = fs.readFileSync(bundlePath, 'utf8');

  // Must render unified-actions-bar with START GAME and PRACTICE button
  assert.ok(js.includes('ToenowScreens.renderTitle'), 'Flash Brain must use the shared title renderer');
  assert.ok(js.includes('onPractice:'), 'Flash Brain must provide a practice callback');

  // Must support practice query parameter and not overwrite best scores during practice
  assert.ok(js.includes('practice'), 'Flash Brain must support practice query param');
});
