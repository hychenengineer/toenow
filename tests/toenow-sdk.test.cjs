const { test } = require('node:test');
const assert = require('node:assert/strict');
const ToenowGameSDK = require('../shared/toenow-sdk.js');

test('SDK survives a browser denying access to localStorage itself', () => {
  const descriptor = Object.getOwnPropertyDescriptor(global, 'localStorage');
  Object.defineProperty(global, 'localStorage', { configurable: true, get() { throw new Error('Denied'); } });
  try {
    const sdk = new ToenowGameSDK({ gameId: 'animal-rescue-train' });
    assert.equal(sdk.loadBestScore(), 0);
    assert.equal(sdk.loadBestWave(), 1);
    assert.equal(sdk.saveBestRecords(6, 1).saved, false);
  } finally {
    if (descriptor) Object.defineProperty(global, 'localStorage', descriptor);
    else delete global.localStorage;
  }
});

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

test('SDK lifecycle methods invoke configured callbacks and retain practice state', () => {
  const calls = [];
  const sdk = new ToenowGameSDK({ onStart: options => calls.push(options.wave), onPause: () => calls.push('pause'), onResume: () => calls.push('resume'), onRestart: () => calls.push('restart') });
  sdk.start({ wave: 21, isPractice: true });
  sdk.pause(); sdk.resume(); sdk.restart();
  assert.deepEqual(calls, [21, 'pause', 'resume', 'restart']);
  assert.equal(sdk.isPractice, true);
});

test('handleGameOver rejects implausible normal scores and never writes practice records', () => {
  const previous = global.localStorage;
  const writes = [];
  global.localStorage = { getItem: () => null, setItem: (...args) => writes.push(args) };
  try {
    const sdk = new ToenowGameSDK({ gameId: 'animal-rescue-train', category: 'logic' });
    assert.equal(sdk.handleGameOver({ score: 999999, wave: 1, duration: 100 }).isValid, false);
    assert.equal(writes.length, 0);
    const practice = sdk.handleGameOver({ score: 30, wave: 21, duration: 100, isPractice: true });
    assert.equal(practice.isPractice, true);
    assert.equal(practice.levelName, 'Master');
    assert.equal(writes.length, 0);
    const normal = sdk.handleGameOver({ score: 6, wave: 1, duration: 2000, isPractice: false });
    assert.equal(normal.type, 'GAME_OVER');
    assert.ok(writes.some(([key, value]) => key === 'animal_rescue_train_best_score' && value === '6'));
  } finally { global.localStorage = previous; }
});

test('SDK practice bridge passes the actual selected wave to the game callback', () => {
  const levels = require('../shared/toenow-levels.js');
  const originalSetup = levels.setupPracticeMode;
  const previousDocument = global.document;
  global.document = {};
  levels.setupPracticeMode = options => options.onStartGame(21, true);
  try {
    const sdk = new ToenowGameSDK({ gameId: 'animal-rescue-train' });
    let selected;
    sdk.setupPractice((wave, practice) => { selected = [wave, practice]; });
    assert.deepEqual(selected, [21, true]);
    assert.equal(sdk.isPractice, true);
  } finally { levels.setupPracticeMode = originalSetup; global.document = previousDocument; }
});

test('SDK respects hasWaves configuration for level-only games', () => {
  const sdk = new ToenowGameSDK({
    gameId: 'animal-rescue-train',
    hasWaves: false,
    maxLevels: 5
  });
  assert.equal(sdk.hasWaves, false);
  assert.equal(sdk.maxLevels, 5);
});
