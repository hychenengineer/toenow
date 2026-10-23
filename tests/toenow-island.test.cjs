const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const levels = require('../shared/toenow-levels.js');
const file = path.resolve(__dirname, '../shared/toenow-island.js');
const island = fs.existsSync(file) ? require(file) : {};
function storage(values = {}) {
  return { getItem: key => values[key] ?? null, setItem() { assert.fail('Island progress must be read-only'); }, removeItem() { assert.fail('Must preserve saves'); } };
}
function progress(gameId, store) {
  assert.equal(typeof island.getProgress, 'function', 'island progress API is implemented');
  return island.getProgress(gameId, store, levels);
}

test('Island has one distinct named location for every registered game', () => {
  assert(Array.isArray(island.LOCATIONS), 'island location registry is implemented');
  assert.equal(island.LOCATIONS.length, 10);
  assert.deepEqual(island.LOCATIONS.map(l => l.gameId).sort(), Object.keys(levels.GAME_STORAGE_KEYS).sort());
  assert.equal(new Set(island.LOCATIONS.map(l => l.name)).size, 10);
  for (const l of island.LOCATIONS) {
    assert(l.x >= 8 && l.x <= 92 && l.y >= 10 && l.y <= 86);
    assert(l.kind && l.name);
  }
});

test('Island stages follow the five shared wave ranges without claiming tier completion', () => {
  for (const [wave, expected] of [[1,1],[5,1],[6,2],[10,2],[11,3],[15,3],[16,4],[20,4],[21,5],[29,5]]) {
    const p = progress('number-pop', storage({ qcc_best_wave_v1: String(wave) }));
    assert.equal(p.level, expected);
    assert.equal(p.wave, wave);
    assert.equal(p.explored, wave > 1);
    assert(!('cleared' in p), 'reached level must not become a cleared-tier claim');
  }
});

test('Island reconciles canonical and aggregate records, preserving the highest valid normal record', () => {
  const p = progress('number-pop', storage({
    toenow_game_scores: JSON.stringify({ 'number-pop': { maxWave: 7, bestScore: 120 } }),
    qcc_best_wave_v1: '17', qcc_high_score_v1: '500'
  }));
  assert.equal(p.level, 4); assert.equal(p.wave, 17); assert.equal(p.bestScore, 500); assert(p.explored);
  const aggregate = progress('number-pop', storage({toenow_game_scores: JSON.stringify({'number-pop': {maxWave: 21,bestScore: 2000}}),qcc_best_wave_v1:'6'}));
  assert.equal(aggregate.level, 5); assert.equal(aggregate.wave, 21);
});

test('Missing, malformed and unavailable storage safely leaves locations unexplored', () => {
  for (const value of ['{broken','null','[]','"string"']) {
    const p = progress('number-pop', storage({toenow_game_scores:value,qcc_best_wave_v1:'Infinity',qcc_high_score_v1:'NaN'}));
    assert.deepEqual(p, {level:1,wave:1,bestScore:0,explored:false});
  }
  assert.deepEqual(progress('number-pop', {getItem(){throw Error('unavailable');}}), {level:1,wave:1,bestScore:0,explored:false});
  assert.deepEqual(progress('unknown', storage()), {level:1,wave:1,bestScore:0,explored:false});
});

test('Invalid negative/fractional/object records cannot manufacture a higher island stage', () => {
  for (const wave of [-10, 6.5, true, {}, null, '21oops', 'Infinity']) {
    const p = progress('number-pop', storage({toenow_game_scores:JSON.stringify({'number-pop':{maxWave:wave,bestScore:-1,maxLevel:5}})}));
    assert.equal(p.level,1);assert.equal(p.wave,1);assert.equal(p.bestScore,0);
  }
});

test('A formal zero-score attempt is explored without elevating its stage', () => {
  const p = progress('number-pop',storage({toenow_game_scores:JSON.stringify({'number-pop':{maxWave:1,bestScore:0,lastScore:0}})}));
  assert(p.explored);assert.equal(p.level,1);
});
