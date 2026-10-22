const { test } = require('node:test');
const assert = require('node:assert/strict');
const ToenowGameSDK = require('../shared/toenow-sdk.js');

test('ToenowGameSDK handles lifecycle, storage, and title records cleanly', () => {
  const sdk = new ToenowGameSDK({
    gameId: 'number-pop',
    category: 'math'
  });

  assert.equal(sdk.gameId, 'number-pop');
  assert.equal(sdk.category, 'math');
  assert.equal(sdk.keys.score, 'qcc_high_score_v1');
  assert.equal(sdk.keys.wave, 'qcc_best_wave_v1');

  // Test reportGameOver creates unified payload
  const payload = sdk.reportGameOver({
    score: 12500,
    wave: 8
  });

  assert.equal(payload.type, 'GAME_OVER');
  assert.equal(payload.gameId, 'number-pop');
  assert.equal(payload.score, 12500);
  assert.equal(payload.wave, 8);
  assert.equal(payload.level, 2);
  assert.equal(payload.levelName, 'Intermediate');
  assert.equal(payload.isPractice, false);
});

test('ToenowGameSDK guards practice mode from mutating records', () => {
  const sdk = new ToenowGameSDK({
    gameId: 'space-scale',
    category: 'logic'
  });

  sdk.setPracticeMode(true);
  const result = sdk.saveBestRecords(99999, 25);
  assert.equal(result.saved, false);
  assert.equal(result.reason, 'practice_mode');

  const payload = sdk.reportGameOver({
    score: 8888,
    wave: 10
  });
  assert.equal(payload.isPractice, true);
});
