const { readSource } = require('../tools/lib/game-source.cjs');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const read=p=>readSource(path.join(__dirname,'..',p),'utf8');
test('Spot Quick preserves all 170 specimens, 50 categories and candidate difficulty',()=>{
 const { SPECIMEN_POOL }=require('../games/spot-quick/shapes.js');
 assert.equal(SPECIMEN_POOL.length,170);
 assert.equal(new Set(SPECIMEN_POOL.map(s=>s.id)).size,170);
 assert.equal(new Set(SPECIMEN_POOL.map(s=>s.cluster)).size,50);
 assert.ok(SPECIMEN_POOL.every(s=>typeof s.render==='function'));
 const artHash=crypto.createHash('sha256').update(JSON.stringify(SPECIMEN_POOL.map(s=>[s.id,s.cluster,s.render.toString()]))).digest('hex');
 assert.equal(artHash,'66aae6abbaed7d99c1b197e3cf6332843ec6ef8164840972a0365ed6f5d3544d','all original specimen drawing functions are preserved');
});
test('Memory garden never reveals animals in hidden or paused cells',()=>{
 const garden=require('../games/flash-brain/garden.js');
 for(const phase of ['PHASE_PRE_FLASH','PHASE_RETENTION','PHASE_INPUT']){
  assert.equal(garden.isAnimalVisible({type:'TARGET',tapped:false},phase,'playing'),false);
  assert.equal(garden.isAnimalVisible({type:'PRIORITY',tapped:false},phase,'playing'),false);
 }
 assert.equal(garden.isAnimalVisible({type:'TARGET'},'PHASE_FLASH','paused'),false);
 assert.equal(garden.isAnimalVisible({type:'TARGET'},'PHASE_FLASH','playing'),true);
 assert.equal(garden.isAnimalVisible({type:'PRIORITY'},'PHASE_FLASH','playing'),true);
 assert.equal(garden.isAnimalVisible({type:'DECOY'},'PHASE_FLASH','playing'),false);
 assert.equal(garden.isAnimalVisible({type:'TARGET',tapped:true},'PHASE_INPUT','playing'),true);
});
test('Themed interaction hooks are wired to actual correct and wrong actions',()=>{
 const tap=read('games/tap-match/index.html'),spot=read('games/spot-quick/index.html'),train=read('games/animal-rescue-train/game.js'),flash=read('games/flash-brain/assets/index-cr-6j3L1.js');
 assert.match(tap,/penguinCollection\.push/);assert.match(tap,/feedback\('tap-match', false\)/);
 assert.match(spot,/drawObservationArchive/);assert.match(spot,/feedback\('spot-quick', true\)/);
 assert.match(train,/stationmaster/);assert.match(train,/feedback\('animal-rescue-train', game.state.status !== 'lost'\)/);
 assert.match(flash,/FlashMemoryGarden\?\.drawCell/);assert.match(flash,/FlashMemoryGarden\?\.feedback/);
});

test('Garden draw operations are identical for all hidden bed types',()=>{
 const garden=require('../games/flash-brain/garden.js');
 const animals=globalThis.ToenowAnimals;let calls=0;globalThis.ToenowAnimals={drawAnimal(){calls++}};
 try {
  const render=(type,phase)=>{const ops=[];const ctx=new Proxy({}, {get:(_,key)=>(...args)=>ops.push([key,...args]),set:(_,key,value)=>{ops.push([key,value]);return true}});garden.drawCell(ctx,{type,tapped:false},phase,'playing',20,20,40);return ops};
  const hidden=render('EMPTY','PHASE_INPUT');
  assert.deepEqual(render('TARGET','PHASE_INPUT'),hidden);
  assert.deepEqual(render('DECOY','PHASE_INPUT'),hidden);
  assert.deepEqual(render('PRIORITY','PHASE_RETENTION'),hidden);
  assert.equal(calls,0);
  render('TARGET','PHASE_FLASH');assert.equal(calls,1);
  render('DECOY','PHASE_FLASH');assert.equal(calls,1);
 } finally {globalThis.ToenowAnimals=animals}
});
test('Flash Brain still enforces priority order, hazards, combo and clear bonuses',()=>{
 const vm=require('node:vm');const s=read('games/flash-brain/assets/index-cr-6j3L1.js');
 const start=s.indexOf('function te(',210000),end=s.indexOf('function C(',start);
 const evaluate=vm.runInNewContext('('+s.slice(start,end)+')');
 const state=()=>({cells:[{type:'PRIORITY'},{type:'TARGET'},{type:'DECOY'},{type:'EMPTY'}],prioritySatisfied:false,tappedTargetsCount:0,totalTargetsRequired:2,config:{level:2,parTime:5}});
 let wave=state();assert.equal(evaluate(wave,1,2,1).breachReason,'PRIORITY_VIOLATION');assert.equal(wave.tappedTargetsCount,0);
 wave=state();assert.equal(evaluate(wave,2,2,1).timeDelta,-3);assert.equal(evaluate(wave,3,2,1).breachReason,'EMPTY_NODE');
 wave=state();let hit=evaluate(wave,0,2,1);assert.equal(hit.status,'CORRECT');assert.equal(hit.pointsAwarded,200);assert.equal(wave.prioritySatisfied,true);
 assert.equal(evaluate(wave,0,2,1).status,'IGNORED');
 hit=evaluate(wave,1,2,4);assert.equal(hit.status,'WAVE_CLEARED');assert.equal(hit.pointsAwarded,2200);assert.equal(hit.clearBonus,2000);assert.equal(hit.timeDelta,1.5);assert.equal(hit.newCombo,3);
});

test('Train stationmaster switches language immediately without resetting its puzzle or mascot',()=>{
 const s=read('games/animal-rescue-train/game.js');const start=s.indexOf('function renderStationmaster()');assert.ok(start>=0,'stationmaster has a targeted refresh function');
 const end=s.indexOf('\n  function render(',start),vm=require('node:vm'),label={textContent:''},svg={};
 const board={dataset:{},querySelector:selector=>selector==='svg'?svg:label};
 Object.defineProperty(board,'innerHTML',{set(){throw Error('Existing mascot must not be replaced on language changes')}});
 const callbacks={},state={status:'playing',moves:3};
 const context={window:{ToenowI18n:{language:'en'},addEventListener:(name,callback)=>{callbacks[name]=callback}},game:{state},selected:0,$:()=>board};
 vm.runInNewContext(s.slice(start,end)+"\nwindow.addEventListener('toenow:languagechange', renderStationmaster);",context);
 const refresh=callbacks['toenow:languagechange'];refresh();assert.equal(label.textContent,'Tap a glowing carriage');
 context.window.ToenowI18n.language='zh-Hant';refresh();assert.equal(label.textContent,'點亮起的車廂');
 context.window.ToenowI18n.language='en';refresh();assert.equal(label.textContent,'Tap a glowing carriage');
 assert.deepEqual(state,{status:'playing',moves:3});assert.equal(context.selected,0);
 assert.ok(s.includes("window.addEventListener('toenow:languagechange', renderStationmaster)"));
});
