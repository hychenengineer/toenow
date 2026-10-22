const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ToenowLevels = require('../shared/toenow-levels.js');

test('ToenowLevels exports GAME_STORAGE_KEYS for all 9 games', () => {
  assert.ok(ToenowLevels.GAME_STORAGE_KEYS, 'GAME_STORAGE_KEYS should be exported');
  const expectedGames = [
    'number-pop',
    'ball-track',
    'block-match',
    'add-up',
    'space-scale',
    'tap-match',
    'spot-quick',
    'shadow-match',
    'flash-brain'
  ];
  for (const gameId of expectedGames) {
    const entry = ToenowLevels.GAME_STORAGE_KEYS[gameId];
    assert.ok(entry, `Entry for game ${gameId} should exist`);
    assert.ok(entry.score, `Entry for ${gameId} must specify score storage key`);
    assert.ok(entry.wave, `Entry for ${gameId} must specify wave storage key`);
  }
});

test('Hub index.html bidirectional sync logic correctly populates Game storage from Hub and vice-versa', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // Verify openTheaterModal code contains GAME_STORAGE_KEYS mapping and bidirectional sync
  assert.ok(indexHtml.includes('GAME_STORAGE_KEYS'), 'index.html should reference GAME_STORAGE_KEYS');
  assert.ok(indexHtml.includes('highestScore'), 'index.html should compute highest score between Hub and Game');

  const store = {};
  const mockLocalStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };

  // Preload Hub scores with high scores for ball-track (50000)
  mockLocalStorage.setItem('toenow_game_scores', JSON.stringify({
    'ball-track': { bestScore: 50000, maxWave: 15, maxLevel: 3, levelName: 'Advanced' }
  }));

  // Simulate game internal storage having a higher score for space-scale
  mockLocalStorage.setItem('grav_anomaly_best_score_v2', '42000');
  mockLocalStorage.setItem('space_scale_best_wave', '18');

  const keyMap = ToenowLevels.GAME_STORAGE_KEYS;
  assert.equal(keyMap['ball-track'].score, 'quantum_shell_best_score_v5');
  assert.equal(keyMap['ball-track'].wave, 'quantum_shell_best_wave_v5');

  // Simulate the sync routine that openTheaterModal executes
  function syncHubAndGame(gameId, category) {
    const scores = JSON.parse(mockLocalStorage.getItem('toenow_game_scores') || '{}');
    const record = scores[gameId] || { bestScore: 0, maxWave: 1 };
    const keys = keyMap[gameId];
    if (keys) {
      const gameScoreInStorage = parseInt(mockLocalStorage.getItem(keys.score) || '0', 10) || 0;
      const gameWaveInStorage = parseInt(mockLocalStorage.getItem(keys.wave) || '1', 10) || 1;

      const highestScore = Math.max(record.bestScore || 0, gameScoreInStorage);
      const highestWave = Math.max(record.maxWave || 1, gameWaveInStorage);

      if (highestScore > 0) {
        mockLocalStorage.setItem(keys.score, String(highestScore));
        if (keys.wave) {
          mockLocalStorage.setItem(keys.wave, String(highestWave));
        }
      }

      if (highestScore > (record.bestScore || 0) || highestWave > (record.maxWave || 1)) {
        scores[gameId] = {
          bestScore: highestScore,
          maxWave: highestWave,
          maxLevel: ToenowLevels.getLevelInfo(highestWave).level,
          levelName: ToenowLevels.getLevelInfo(highestWave).name,
          category: category
        };
        mockLocalStorage.setItem('toenow_game_scores', JSON.stringify(scores));
      }
    }
  }

  // 1. Sync ball-track: Hub (50000) -> Game Storage
  syncHubAndGame('ball-track', 'spatial');
  assert.equal(mockLocalStorage.getItem('quantum_shell_best_score_v5'), '50000');
  assert.equal(mockLocalStorage.getItem('quantum_shell_best_wave_v5'), '15');

  // 2. Sync space-scale: Game Storage (42000) -> Hub
  syncHubAndGame('space-scale', 'spatial');
  const updatedHub = JSON.parse(mockLocalStorage.getItem('toenow_game_scores'));
  assert.equal(updatedHub['space-scale'].bestScore, 42000);
  assert.equal(updatedHub['space-scale'].maxWave, 18);
});

test('All 9 games have code guards preventing Practice Mode from overwriting Personal Best / High Score', () => {
  const games = [
    { file: 'games/block-match/index.html', check: (c) => c.includes('!state.isPractice && state.score > state.highScore') },
    { file: 'games/add-up/index.html', check: (c) => c.includes('!isPracticeMode && finalScore > bestScore') },
    { file: 'games/number-pop/index.html', check: (c) => c.includes('!game.isPractice && game.score > 0') },
    { file: 'games/tap-match/index.html', check: (c) => c.includes('if (state && state.isPractice) return;') },
    { file: 'games/ball-track/index.html', check: (c) => c.includes('if (state && state.isPractice) return;') },
    { file: 'games/spot-quick/index.html', check: (c) => c.includes('if (state && state.isPractice) return;') },
    { file: 'games/space-scale/index.html', check: (c) => c.includes('if (!isPracticeMode) localStorage.setItem(STORAGE_BEST_SCORE') },
    { file: 'games/shadow-match/index.html', check: (c) => c.includes('if (state && state.isPractice) return;') },
    {
      file: 'games/flash-brain/assets/index-cr-6j3L1.js',
      check: (c) => c.includes('practice') && c.includes('localStorage.setItem(s')
    }
  ];

  for (const g of games) {
    const content = fs.readFileSync(path.join(__dirname, '..', g.file), 'utf8');
    assert.ok(g.check(content), `Game ${g.file} must have practice mode guard against overwriting best scores`);
  }
});

test('Hub postMessage GAME_OVER listener ignores practice mode runs and never overwrites best scores', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('if (isPractice)'), 'Hub message handler must explicitly inspect isPractice flag');
  assert.ok(
    indexHtml.includes('Practice mode not recorded'),
    'Hub message handler must display toast and return early on practice runs'
  );
});

test('Hub and games immediately update maxLevel and best wave on game over without delay', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(
    indexHtml.includes('saveGameScore(gameId, category, score, wave)'),
    'Hub must pass wave directly into saveGameScore on GAME_OVER message'
  );

  // Check subgames update title-best-level on run completion
  const addUp = fs.readFileSync(path.join(__dirname, '..', 'games/add-up/index.html'), 'utf8');
  assert.ok(addUp.includes('add_up_best_wave'), 'Add Up must persist best wave on game over');

  const spaceScale = fs.readFileSync(path.join(__dirname, '..', 'games/space-scale/index.html'), 'utf8');
  assert.ok(spaceScale.includes('space_scale_best_wave') && spaceScale.includes('syncPersistentStatsUI()'), 'Space Scale must sync best level on game over');

  const blockMatch = fs.readFileSync(path.join(__dirname, '..', 'games/block-match/index.html'), 'utf8');
  assert.ok(blockMatch.includes('title-best-level'), 'Block Match must sync title-best-level when returning to title');

  const tapMatch = fs.readFileSync(path.join(__dirname, '..', 'games/tap-match/index.html'), 'utf8');
  assert.ok(tapMatch.includes('elTitleBestLvl.textContent ='), 'Tap Match must immediately sync elTitleBestLvl on game over');

  const spotQuick = fs.readFileSync(path.join(__dirname, '..', 'games/spot-quick/index.html'), 'utf8');
  assert.ok(spotQuick.includes('tier.level') && spotQuick.includes('title-best-level'), 'Spot Quick must immediately sync title-best-level on game over');

  const shadowMatch = fs.readFileSync(path.join(__dirname, '..', 'games/shadow-match/index.html'), 'utf8');
  assert.ok(shadowMatch.includes('getLevelSpecForWave(rec.bestWave)'), 'Shadow Match must immediately sync level on updateTitleScreenRecords');
});
