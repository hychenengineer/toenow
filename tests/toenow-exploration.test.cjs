const { test } = require('node:test');
const assert = require('node:assert/strict');
const levels = require('../shared/toenow-levels.js');
const { create, STORAGE_KEY } = require('../shared/toenow-exploration.js');
const gameIds = Object.keys(levels.GAME_STORAGE_KEYS).filter(id => levels.GAME_STORAGE_KEYS[id].island !== 'carefree');
function store(initial = {}) {
  const values = { ...initial };
  return { getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = String(value); }, values };
}
const make = storage => create({ storage, levels, gameIds, random: () => 0.25 });

test('Leaderboard stays locked until every game clears Level 1, including the last discovered place', () => {
  const storage = store(), flow = make(storage);
  assert.equal(flow.isLeaderboardUnlocked(), false);
  const order = flow.snapshot().order;
  for (const gameId of order.slice(0, -1)) flow.complete({ gameId, wave: 6, completedLevel: 1 });
  assert.equal(flow.snapshot().unlocked.length, 10);
  assert.equal(flow.isLeaderboardUnlocked(), false, 'opening the last place is not completing it');
  flow.complete({ gameId: order.at(-1), wave: 1, completedLevel: 1, isPractice: true });
  assert.equal(flow.isLeaderboardUnlocked(), false, 'practice cannot unlock the leaderboard');
  flow.complete({ gameId: order.at(-1), wave: 1, completedLevel: 1 });
  assert.equal(flow.isLeaderboardUnlocked(), true);
  assert.equal(flow.shouldShowLeaderboardNotice(), true);
  flow.dismissLeaderboardNotice();
  assert.equal(make(storage).shouldShowLeaderboardNotice(), false, 'dismissed notice stays dismissed after reload');
  assert.equal(make(storage).isLeaderboardUnlocked(), true, 'earned access survives reload');
});

test('Leaderboard unlocks when all saved normal Level 1 milestones reconcile', () => {
  const storage = store({ toenow_game_milestones_v1: JSON.stringify(Object.fromEntries(gameIds.map(id => [id, 1]))) });
  const flow = make(storage); flow.reconcile();
  assert.equal(flow.isLeaderboardUnlocked(), true);
  assert.equal(create({ storage: store(), levels, gameIds: [] }).isLeaderboardUnlocked(), false);
});

test('Moving map landmarks preserves the existing route and earned discoveries', () => {
  const locations = require('../shared/toenow-island.js').LOCATIONS;
  const storage = store(), before = make(storage);
  before.chooseGuest(); before.complete({ gameId: 'number-pop', wave: 6 });
  const saved = before.snapshot();
  const coordinates = locations.map(location => [location.x, location.y]);
  try {
    locations.find(location => location.gameId === 'block-match').x = 19;
    locations.find(location => location.gameId === 'block-match').y = 75;
    const after = make(storage).snapshot();
    assert.deepEqual(after.order, saved.order);
    assert.deepEqual(after.opened, saved.opened);
    assert.deepEqual(after.completed, saved.completed);
    assert.equal(after.pending, saved.pending);
  } finally {
    locations.forEach((location, index) => { [location.x, location.y] = coordinates[index]; });
  }
});

test('The established route starts bottom-left with Rabbit and ends top-right with Panda', () => {
  const locations = require('../shared/toenow-island.js').LOCATIONS;
  const rabbit = locations.find(l => l.gameId === 'number-pop'), panda = locations.find(l => l.gameId === 'animal-rescue-train');
  assert(rabbit.x < 35 && rabbit.y > 60);
  assert(panda.x > 70 && panda.y < 30);
  assert.deepEqual(make(store()).snapshot().order, ['number-pop', 'space-scale', 'add-up', 'flash-brain', 'ball-track', 'tap-match', 'block-match', 'spot-quick', 'shadow-match', 'animal-rescue-train']);
});
test('Updating the old random route keeps completion credit and uses the earned fixed route', () => {
  const storage = store({ [STORAGE_KEY]: JSON.stringify({ version: 1, mode: 'explore', welcomed: true, order: ['number-pop','block-match',...gameIds.filter(id => !['number-pop','block-match'].includes(id))], completed: ['number-pop'], pending: 'block-match' }) });
  const flow = make(storage);
  assert(!flow.isUnlocked('block-match')); assert(flow.isUnlocked('number-pop')); assert(flow.isUnlocked('space-scale'));
  assert.equal(flow.snapshot().order[1], 'space-scale');
  assert.equal(flow.complete({ gameId: 'number-pop', wave: 6 }), null);
});
test('Saved normal milestones unlock one building even while the iframe remains active', () => {
  const storage = store(), flow = make(storage); flow.beginRun('number-pop');
  storage.setItem('toenow_game_milestones_v1', JSON.stringify({ 'number-pop': 1 }));
  flow.reconcile(); assert.deepEqual(flow.snapshot().unlocked, ['number-pop', 'space-scale']);
  flow.reconcile(); assert.equal(flow.snapshot().unlocked.length, 2);
});
test('The old delayed-result bug recovers a plausible saved Rabbit completion without opening every building', () => {
  const order = ['number-pop', ...gameIds.filter(id => id !== 'number-pop')];
  const initial = { [STORAGE_KEY]: JSON.stringify({ version: 1, mode: 'explore', order, completed: [], welcomed: true, pending: null, rejectedWaves: { 'number-pop': 6 } }), qcc_best_wave_v1: '6', qcc_high_score_v1: '3000' };
  const flow = make(store(initial));
  assert.deepEqual(flow.snapshot().unlocked, ['number-pop', 'space-scale']);
  assert.deepEqual(flow.snapshot().completed, ['number-pop']);
  const impossible = make(store({ ...initial, qcc_high_score_v1: '1000000000000' }));
  assert.deepEqual(impossible.snapshot().unlocked, ['number-pop']);
});
test('Malformed version-2 opened lists never leave a player with zero usable games', () => {
  const saved = make(store()).snapshot();
  for (const opened of [[], ['unknown']]) {
    const flow = make(store({ [STORAGE_KEY]: JSON.stringify({ ...saved, version: 2, opened, completed: ['space-scale'], pending: 'space-scale' }) }));
    assert.deepEqual(flow.snapshot().unlocked, ['number-pop']);
    assert.deepEqual(flow.snapshot().completed, []);
    assert.equal(flow.snapshot().pending, null);
  }
});

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
test('Existing score-only and zero-score attempts enter exploration without losing records', () => {
  for (const records of [
    { qcc_high_score_v1: '120' }, { flash_brain_best_wave_v1: '6' },
    { toenow_game_scores: JSON.stringify({ 'number-pop': { lastScore: 0, maxWave: 1 } }) }
  ]) {
    const storage = store(records), state = make(storage).snapshot();
    assert.equal(state.mode, 'explore'); assert.deepEqual(state.unlocked, ['number-pop']); assert(state.welcomed);
    for (const [key, value] of Object.entries(records)) assert.equal(storage.getItem(key), value);
  }
  assert.equal(make(store({ toenow_game_scores: '{bad', qcc_high_score_v1: 'NaN' })).snapshot().unlocked.length, 1);
});
test('Persisted legacy access migrates once to version 3 and cannot be restored by cloud sign-in', () => {
  for (const version of [1, 2]) {
    const storage = store({
      [STORAGE_KEY]: JSON.stringify({ version, mode: 'legacy', order: ['number-pop',...gameIds.filter(id => id !== 'number-pop')], opened: [...gameIds], completed: [], welcomed: true, pending: null }),
      qcc_best_wave_v1: '6', qcc_high_score_v1: '3000',
      animal_rescue_train_guest_v2: '{"saved":"keep"}'
    });
    const flow = make(storage);
    assert.equal(flow.snapshot().version, 3); assert.equal(flow.snapshot().mode, 'explore');
    assert.deepEqual(flow.snapshot().unlocked, ['number-pop','space-scale']);
    flow.adoptLegacy(); assert.deepEqual(flow.snapshot().unlocked, ['number-pop','space-scale']);
    assert.equal(storage.getItem('qcc_high_score_v1'), '3000');
    assert.equal(storage.getItem('animal_rescue_train_guest_v2'), '{"saved":"keep"}');
    assert.deepEqual(make(storage).snapshot().unlocked, ['number-pop','space-scale']);
  }
});
test('Returning players open only the contiguous cleared route while keeping later-game credit', () => {
  const storage = store({ qcc_best_wave_v1: '6', space_scale_best_wave: '6', flash_brain_best_wave_v1: '6' });
  const flow = make(storage);
  assert.deepEqual(flow.snapshot().unlocked, ['number-pop','space-scale','add-up']);
  assert(flow.snapshot().completed.includes('flash-brain'));
  flow.complete({ gameId: 'add-up', wave: 6 });
  assert.deepEqual(flow.snapshot().unlocked, ['number-pop','space-scale','add-up','flash-brain','ball-track']);
});
test('An older open tab cannot overwrite the migrated exploration policy', () => {
  const old = JSON.stringify({ version: 2, mode: 'legacy', order: ['number-pop',...gameIds.filter(id => id !== 'number-pop')], completed: [], opened: [...gameIds], welcomed: true });
  const storage = store({ toenow_exploration_v1: old, qcc_best_wave_v1: '6', qcc_high_score_v1: '3000' });
  const flow = make(storage);
  assert.deepEqual(flow.snapshot().unlocked, ['number-pop','space-scale']);
  assert.equal(storage.getItem('toenow_exploration_v1'), old, 'old save remains intact');
  storage.setItem('toenow_exploration_v1', old);
  assert.equal(flow.snapshot().mode, 'explore');
  assert.deepEqual(make(storage).snapshot().unlocked, ['number-pop','space-scale']);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).version, 3);
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

test('Older tabs still guard raw saves after the policy has migrated', () => {
  const storage = store(), flow = make(storage);
  const old = { ...flow.snapshot(), version: 2, mode: 'legacy', activeRuns: {
    older: { gameId: 'number-pop', ownerId: 'older-tab', startedAt: Date.now() }
  } };
  storage.setItem('toenow_exploration_v1', JSON.stringify(old));
  storage.setItem('qcc_best_wave_v1', '6');
  flow.reconcile(); assert.equal(flow.snapshot().unlocked.length, 1);
  old.rejectedWaves = { 'number-pop': 6 }; old.activeRuns = {};
  storage.setItem('toenow_exploration_v1', JSON.stringify(old));
  flow.reconcile(); assert.equal(flow.snapshot().unlocked.length, 1);
  assert(flow.complete({ gameId: 'number-pop', wave: 6 }));
});

test('Imported iframe guards settle when an older tab closes its run', () => {
  const storage = store(), old = { ...make(storage).snapshot(), version: 2, activeRuns: {
    older: { gameId: 'number-pop', ownerId: 'older-tab', startedAt: Date.now() }
  } };
  storage.setItem('toenow_exploration_v1', JSON.stringify(old));
  delete storage.values[STORAGE_KEY];
  const flow = make(storage);
  storage.setItem('qcc_best_wave_v1', '6');
  old.activeRuns = {}; old.rejectedWaves = { 'number-pop': 6 };
  storage.setItem('toenow_exploration_v1', JSON.stringify(old));
  flow.reconcile(); assert.equal(Object.keys(flow.snapshot().activeRuns).length, 0);
  assert.equal(flow.snapshot().unlocked.length, 1);
});

test('A validated older-tab result settles an imported guard and earns the next place', () => {
  const storage = store(), old = { ...make(storage).snapshot(), version: 2,
    rejectedWaves: { 'number-pop': 6 }, activeRuns: {
    older: { gameId: 'number-pop', ownerId: 'older-tab', startedAt: Date.now() }
  } };
  storage.setItem('toenow_exploration_v1', JSON.stringify(old));
  delete storage.values[STORAGE_KEY];
  const flow = make(storage);
  storage.setItem('qcc_best_wave_v1', '6');
  old.activeRuns = {}; old.completed = ['number-pop']; old.verifiedWaves = { 'number-pop': 6 };
  storage.setItem('toenow_exploration_v1', JSON.stringify(old));
  flow.reconcile(); assert.equal(flow.snapshot().unlocked.length, 2);
});
