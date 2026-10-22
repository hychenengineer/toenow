const { test } = require('node:test');
const assert = require('node:assert/strict');
const ToenowLevels = require('../shared/toenow-levels.js');

test('ToenowLevels exports standard 5 levels with 5 waves each', () => {
  assert.equal(ToenowLevels.LEVELS.length, 5);
  
  // Level 1: Beginner (Waves 1-5)
  for (let w = 1; w <= 5; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 1);
    assert.equal(info.name, 'Beginner');
    assert.equal(info.badgeText, 'LVL 1 · BEGINNER');
  }

  // Level 2: Intermediate (Waves 6-10)
  for (let w = 6; w <= 10; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 2);
    assert.equal(info.name, 'Intermediate');
    assert.equal(info.badgeText, 'LVL 2 · INTERMEDIATE');
  }

  // Level 3: Advanced (Waves 11-15)
  for (let w = 11; w <= 15; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 3);
    assert.equal(info.name, 'Advanced');
    assert.equal(info.badgeText, 'LVL 3 · ADVANCED');
  }

  // Level 4: Expert (Waves 16-20)
  for (let w = 16; w <= 20; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 4);
    assert.equal(info.name, 'Expert');
    assert.equal(info.badgeText, 'LVL 4 · EXPERT');
  }

  // Level 5: Master (Waves 21+)
  [21, 25, 50, 100].forEach((w) => {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 5);
    assert.equal(info.name, 'Master');
    assert.equal(info.badgeText, 'LVL 5 · MASTER');
  });
});

test('ToenowLevels handles edge case inputs gracefully', () => {
  assert.equal(ToenowLevels.getLevelInfo(0).level, 1);
  assert.equal(ToenowLevels.getLevelInfo(-10).level, 1);
  assert.equal(ToenowLevels.getLevelInfo(null).level, 1);
  assert.equal(ToenowLevels.getLevelInfo(undefined).level, 1);
  assert.equal(ToenowLevels.getLevelInfo('12').level, 3);
});

test('ToenowLevels creates standard game-over payload', () => {
  const payload = ToenowLevels.createGameOverPayload({
    gameId: 'number-pop',
    category: 'math',
    score: 1250,
    wave: 7,
    duration: 45000
  });

  assert.equal(payload.type, 'GAME_OVER');
  assert.equal(payload.gameId, 'number-pop');
  assert.equal(payload.category, 'math');
  assert.equal(payload.score, 1250);
  assert.equal(payload.wave, 7);
  assert.equal(payload.level, 2);
  assert.equal(payload.levelName, 'Intermediate');
  assert.equal(payload.duration, 45000);
});
