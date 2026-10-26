const { test } = require('node:test');
const assert = require('node:assert/strict');
const levels = require('../shared/toenow-levels.js');
const { create, STORAGE_KEY } = require('../shared/toenow-exploration.js');
const gameIds = Object.keys(levels.GAME_STORAGE_KEYS);
function store(initial = {}) {
  const values = { ...initial };
  return { getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = String(value); }, values };
}
const make = storage => create({ storage, levels, gameIds, random: () => 0.25 });

test('Fresh and settings-only players start with one persisted rabbit garden', () => {
  for (const settings of [{}, { toenow_language_v1: 'zh-Hant', toenow_user_profile: '{}', toenow_hub_view_v1: 'list' }]) {
    const storage = store(settings), first = make(storage);
    assert.deepEqual(first.snapshot().unlocked, ['number-pop']);
    assert.equal(first.snapshot().welcomed, false);
    assert.deepEqual(make(storage).snapshot().order, first.snapshot().order);
    first.chooseGuest();
    assert.equal(make(storage).snapshot().welcomed, true);
  }
});
test('Actual legacy history retains all games, including zero-score attempts', () => {
  for (const records of [
    { qcc_high_score_v1: '120' }, { flash_brain_best_wave_v1: '6' },
    { toenow_game_scores: JSON.stringify({ 'number-pop': { lastScore: 0, maxWave: 1 } }) }
  ]) {
    const state = make(store(records)).snapshot();
    assert.equal(state.mode, 'legacy'); assert.equal(state.unlocked.length, 10); assert(state.welcomed);
  }
  assert.equal(make(store({ toenow_game_scores: '{bad', qcc_high_score_v1: 'NaN' })).snapshot().unlocked.length, 1);
});
test('Only an unlocked game reaching Wave 6 in normal play opens one new place once', () => {
  const storage = store(), flow = make(storage);
  for (const result of [
    { gameId: 'number-pop', wave: 5 }, { gameId: 'number-pop', wave: 21, isPractice: true },
    { gameId: 'flash-brain', wave: 6 }, { gameId: 'number-pop', wave: Infinity },
    { gameId: 'number-pop', wave: 6.5 }, { gameId: 'number-pop', wave: '6' }
  ]) assert.equal(flow.complete(result), null);
  const next = flow.complete({ gameId: 'number-pop', wave: 6 });
  assert(next && next !== 'number-pop');
  assert.equal(flow.snapshot().unlocked.length, 2);
  assert.equal(flow.complete({ gameId: 'number-pop', wave: 21 }), null);
  assert.equal(make(storage).snapshot().pending, next);
  flow.dismissDiscovery(); assert.equal(make(storage).snapshot().pending, null);
  const reloaded = make(storage);
  assert.equal(reloaded.complete({ gameId: 'number-pop', wave: 6 }), null);
  assert.equal(reloaded.snapshot().unlocked.length, 2);
});
test('Saved normal records reconcile after standalone/iframe exit without duplicate unlocks', () => {
  const storage = store(), flow = make(storage);
  storage.setItem('qcc_best_wave_v1', '5'); flow.reconcile();
  assert.equal(flow.snapshot().unlocked.length, 1);
  storage.setItem('qcc_best_wave_v1', '6'); flow.reconcile(); flow.reconcile();
  assert.equal(flow.snapshot().unlocked.length, 2);
  assert.equal(make(storage).snapshot().mode, 'explore', 'new score does not retroactively classify new player as legacy');
});
test('Every distinct completion opens at most one place and the final place finishes cleanly', () => {
  const flow = make(store());
  for (let i = 0; i < 10; i++) {
    const id = flow.snapshot().order[i];
    assert(flow.isUnlocked(id)); flow.complete({ gameId: id, wave: 6 });
    assert.equal(flow.snapshot().unlocked.length, Math.min(i + 2, 10));
  }
  assert.equal(flow.snapshot().completed.length, 10);
  assert.equal(flow.isUnlocked('unknown'), false);
});
test('Invalid state and unavailable storage stay playable; snapshots cannot mutate progress', () => {
  for (const raw of ['null', '[]', '{bad', '{"version":1,"order":["unknown"]}']) {
    assert.equal(make(store({ [STORAGE_KEY]: raw })).snapshot().unlocked.length, 1);
  }
  const flow = make({ getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  flow.chooseGuest(); assert(flow.snapshot().welcomed);
  flow.snapshot().unlocked.push('flash-brain'); assert(!flow.isUnlocked('flash-brain'));
  flow.complete({ gameId: 'number-pop', wave: 6 }); assert.equal(flow.snapshot().unlocked.length, 2);
});
test('A readable but unwritable existing save retains this session progress', () => {
  const storage = store(); make(storage);
  storage.setItem = () => { throw Error('quota'); };
  const flow = make(storage);
  flow.chooseGuest(); assert(flow.snapshot().welcomed);
  flow.complete({ gameId: 'number-pop', wave: 6 });
  assert.equal(flow.snapshot().unlocked.length, 2);
  assert.equal(flow.complete({ gameId: 'number-pop', wave: 11 }), null);
});
test('Rejected run records cannot bypass validation through reconciliation or reload', () => {
  const storage = store(), flow = make(storage);
  storage.setItem('qcc_best_wave_v1', '6');
  flow.reject({ gameId: 'number-pop', wave: 6 });
  flow.reconcile(); assert.equal(flow.snapshot().unlocked.length, 1);
  const reloaded = make(storage); reloaded.reconcile();
  assert.equal(reloaded.snapshot().unlocked.length, 1);
  assert(reloaded.complete({ gameId: 'number-pop', wave: 6 }), 'a later verified result can complete the same wave');
});
test('Another tab cannot reconcile an active iframe record before its result is validated', () => {
  const storage = store(), origin = make(storage), observer = make(storage);
  const runId = origin.beginRun('number-pop');
  storage.setItem('qcc_best_wave_v1', '6');
  observer.reconcile(); assert.equal(observer.snapshot().unlocked.length, 1);
  origin.reject({ gameId: 'number-pop', wave: 6, runId });
  observer.reconcile(); assert.equal(observer.snapshot().unlocked.length, 1);
  const nextRun = origin.beginRun('number-pop');
  assert(origin.complete({ gameId: 'number-pop', wave: 6, runId: nextRun }));
  observer.reconcile(); assert.equal(observer.snapshot().unlocked.length, 2);
});
test('Iframe validation guard survives replay and closing removes the marker safely', () => {
  const storage = store(), flow = make(storage), observer = make(storage);
  const runId = flow.beginRun('number-pop');
  flow.complete({ gameId: 'number-pop', wave: 5, runId });
  storage.setItem('qcc_best_wave_v1', '6');
  observer.reconcile(); assert.equal(observer.snapshot().unlocked.length, 1, 'replay still awaits validation');
  flow.endRun(runId); observer.reconcile();
  assert.equal(observer.snapshot().unlocked.length, 1, 'unfinished iframe record is not an accepted result');
  assert.equal(Object.keys(flow.snapshot().activeRuns).length, 0);
});
test('Reloading a tab recovers its orphan iframe and later standalone progress remains usable', () => {
  const storage = store();
  const options = { storage, levels, gameIds, ownerId: 'same-tab' };
  const first = create(options); first.beginRun('number-pop');
  storage.setItem('qcc_best_wave_v1', '6');
  const reloaded = create(options);
  assert.equal(Object.keys(reloaded.snapshot().activeRuns).length, 0);
  reloaded.reconcile(); assert.equal(reloaded.snapshot().unlocked.length, 1);
  storage.setItem('qcc_best_wave_v1', '7'); reloaded.reconcile();
  assert.equal(reloaded.snapshot().unlocked.length, 2);
});
test('Corrupt nested run metadata cannot crash the saved journey', () => {
  const storage = store(), saved = make(storage).snapshot();
  saved.activeRuns = { broken: null };
  storage.setItem(STORAGE_KEY, JSON.stringify(saved));
  assert.equal(make(storage).snapshot().unlocked.length, 1);
});
