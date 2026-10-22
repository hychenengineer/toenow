const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ToenowLevels = require('../shared/toenow-levels.js');

test('ToenowLevels exports shareScore API and formats share text with deep link in English', () => {
  assert.equal(typeof ToenowLevels.shareScore, 'function', 'shareScore must be exported');
  assert.equal(typeof ToenowLevels.generateScorePoster, 'function', 'generateScorePoster must be exported');

  // Test clipboard fallback capture
  let capturedClipboardText = null;
  let capturedToast = null;

  global.navigator = {
    clipboard: {
      writeText: async (text) => {
        capturedClipboardText = text;
      }
    }
  };

  const mockToast = { remove: () => {} };
  global.document = {
    querySelector: () => null,
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      classList: { add: () => {} },
      style: {},
      parentNode: { removeChild: () => {} }
    }),
    body: {
      appendChild: (el) => {
        capturedToast = el.innerHTML;
      }
    }
  };

  global.window = {
    location: {
      origin: 'https://toenow.matrix.io',
      pathname: '/'
    }
  };

  ToenowLevels.shareScore({
    gameId: 'flash-brain',
    gameTitle: 'Flash Brain',
    score: 12500,
    wave: 18,
    level: 4,
    badgeText: 'LVL 4 · EXPERT'
  });

  assert.ok(capturedClipboardText, 'Clipboard writeText should be triggered');
  assert.ok(capturedClipboardText.includes('I scored 12,500 pts'), 'Share text must include formatted score');
  assert.ok(capturedClipboardText.includes('LVL 4 · EXPERT'), 'Share text must include level badge');
  assert.ok(capturedClipboardText.includes('Flash Brain on Toenow Matrix!'), 'Share text must cite game in English');
  assert.ok(capturedClipboardText.includes('?play=flash-brain&challenge=12500'), 'Share text must include deep link challenge URL');
});

test('All game over screens provide unified SHARE SCORE button', () => {
  const games = [
    'animal-rescue-train',
    'number-pop',
    'ball-track',
    'spot-quick',
    'tap-match',
    'add-up',
    'block-match',
    'space-scale',
    'shadow-match'
  ];

  games.forEach(g => {
    const html = fs.readFileSync(path.resolve(__dirname, `../games/${g}/index.html`), 'utf8');
    assert.ok(html.includes('btn-share-score'), `${g} must contain btn-share-score`);
    assert.ok(html.includes('SHARE SCORE'), `${g} must display SHARE SCORE text in English`);
  });

  const flashBrainBundle = fs.readFileSync(path.resolve(__dirname, '../games/flash-brain/assets/index-cr-6j3L1.js'), 'utf8');
  assert.ok(flashBrainBundle.includes('SHARE SCORE'), 'Flash Brain Game Over screen must contain SHARE SCORE button in English');
});

test('Hub index.html provides Share button on game cards and deep link challenge support', () => {
  const hubHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  assert.ok(hubHtml.includes('card-share-btn'), 'Hub cards must contain card-share-btn');
  assert.ok(hubHtml.includes('data-share-game'), 'Hub cards must bind data-share-game');
  assert.ok(hubHtml.includes('?play=gameId&challenge=score') || hubHtml.includes('params.get(\'play\')'), 'Hub must handle ?play deep links');
});
