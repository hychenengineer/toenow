const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture(blockStorage=false) {
  let adapter, active = false, completed = false;
  const values = {}, calls = [];let stopped=0;
  const state = { score: 123, combo: 3, globalTimeRemaining: 42, phase: 'PHASE_PRE_FLASH', phaseElapsed: 0,
    waveState: { config: { wave: 1, level: 1, gridSize: 3, priorityAnchorCount: 0, decoyCount: 0, preFlashDuration: .65, flashDuration: 1.5 }, cells: [] }, cellScreenGeometries: [] };
  const win = { localStorage: { getItem: key => {if(blockStorage)throw Error('blocked');return values[key] ?? null;}, setItem: (key, value) => {if(blockStorage)throw Error('blocked');values[key] = value; } },
    ToenowTutorials: { isActive: () => active, register: (id, value) => { adapter = value; },
      complete: () => { completed = true; }, showLesson: (id, lesson) => { calls.push(lesson); active = true; adapter.start({ lesson }); return true; } } };
  vm.runInNewContext(fs.readFileSync('games/flash-brain/tutorial.js', 'utf8'), { window: win });
  win.FlashBrainTutorial.bindEngine({ getState: () => state, sync() {}, canvas: { getBoundingClientRect: () => ({ left: 0, top: 0 }) } });
  win.FlashBrainTutorial.bindShell({ start: () => win.FlashBrainTutorial.prepare(state), stop() {stopped++;} });
  return { api: win.FlashBrainTutorial, state, values, calls, adapter: () => adapter, begin(options = {}) { active = true; adapter.start(options); },
    end(confirmed=true) { adapter.stop(confirmed); active = false; }, get completed() { return completed; },get stopped(){return stopped;} };
}

test('basic memory holds until confirmation and never introduces thorns or priority', () => {
  const run = fixture(); run.begin();
  assert.equal(run.state.waveState.config.priorityAnchorCount, 0);
  assert.equal(run.state.waveState.config.decoyCount, 0);
  assert.equal(run.state.phase, 'PHASE_FLASH');
  assert.equal(run.state.waveState.config.flashDuration, Infinity);
  run.adapter().getGuide().action.run();
  assert.equal(run.state.phase, 'PHASE_INPUT');
  run.api.handleResult({ status: 'MISTAKE' }, run.state);
  assert.equal(run.state.phase, 'PHASE_FLASH');
  assert.equal(run.state.score, 0);
  assert.equal(run.state.waveState.tappedTargetsCount, 0);
});

test('formal starts and restarts do not open a ready tutorial or change the run', () => {
  const run = fixture(); run.api.prepare(run.state); run.api.beforeStep(run.state, 'playing');
  assert.deepEqual(run.calls, []);
  assert.equal(run.state.globalTimeRemaining, 42);
  assert.equal(run.state.phase, 'PHASE_PRE_FLASH');
  run.api.prepare(run.state);
  assert.equal(run.state.waveState.config.preFlashDuration, .65);
  run.api.beforeStep(run.state, 'playing');
  assert.deepEqual(run.calls, []);
});

test('new rules use actual configuration, restore the run and remember completion independently', () => {
  const run = fixture(), original = run.state.waveState;
  Object.assign(original.config, { wave: 21, level: 5, decoyCount: 4, priorityAnchorCount: 1 });
  run.api.prepare(run.state); run.api.beforeStep(run.state, 'playing');
  assert.equal(run.calls[0], 'thorns');
  assert.equal(run.state.waveState.config.priorityAnchorCount, 0);
  run.adapter().markLesson('thorns', 'completed'); run.end();
  assert.equal(run.state.waveState, original);
  assert.equal(run.state.score, 123); assert.equal(run.state.combo, 3); assert.equal(run.state.globalTimeRemaining, 42);
  run.api.beforeStep(run.state, 'playing');
  assert.equal(run.calls[1], 'priority');
  assert.equal(run.state.waveState.config.priorityAnchorCount, 1);
  run.adapter().getGuide().action.run();
  assert.match(run.adapter().getGuide().prompt, /Yellow 1/);
  run.state.waveState.prioritySatisfied = true;
  assert.doesNotMatch(run.adapter().getGuide().prompt, /Yellow 1/);
  run.api.handleResult({ status: 'WAVE_CLEARED' }, run.state);
  assert.equal(run.completed, true);
  run.adapter().markLesson('priority', 'completed'); run.end();
  run.api.beforeStep(run.state, 'playing'); assert.equal(run.calls.length, 2);
  original.config.wave = 22; run.api.beforeStep(run.state, 'playing'); assert.equal(run.calls.length, 2);
  assert.equal(Object.keys(run.values).some(key => /best|score|wave/.test(key)), false);
});

test('canceling an explicitly opened basic tutorial returns to title',()=>{
  const run=fixture();run.begin({replay:true});run.end(false);
  assert.equal(run.stopped,1);
  assert.match(run.api.phasePrompt('PHASE_BREACH',false),/Missed/);
});

test('blocked storage keeps completed rules remembered in memory',()=>{
  const run=fixture(true);
  Object.assign(run.state.waveState.config,{wave:11,decoyCount:2});
  run.api.beforeStep(run.state,'playing');
  assert.deepEqual(run.calls,['thorns']);
  run.adapter().markLesson('thorns','completed');run.end();
  run.api.beforeStep(run.state,'playing');assert.equal(run.calls.length,1);
});
