const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const file='../shared/toenow-materials.js';
const materials=fs.existsSync(require('node:path').join(__dirname,file))?require(file):{};
function fixture(values={}){let now=1000;const storage={getItem:k=>values[k]??null,setItem:(k,v)=>{values[k]=v;}};assert.equal(typeof materials.create,'function','materials ledger exists');return {api:materials.create({storage,now:()=>now}),values,storage,advance:()=>{now+=30000;}};}
function earn(f,id='number-pop',wave=1){const run=f.api.beginRun(id,{wave:1,isPractice:false});for(let i=0;i<20;i++)f.api.recordSuccess(run);f.advance();return f.api.finishRun(run,{score:10,wave,isPractice:false});}

test('five real successes earn one item for every material game, with no base reward or per-run ceiling',()=>{
 for(const id of Object.keys(materials.ITEMS)){
  const f=fixture();let token=f.api.beginRun(id);
  assert.equal(typeof f.api.recordSuccess,'function');
  f.api.recordSuccess(token);f.advance();
  let result=f.api.finishRun(token,{score:100,wave:1});
  assert.equal(result.amount,0,id);assert.equal(result.progress,1,id);
  token=f.api.beginRun(id);for(let n=0;n<12;n++)f.api.recordSuccess(token);f.advance();
  result=f.api.finishRun(token,{score:500,wave:1});
  assert.equal(result.amount,2,id);assert.equal(result.progress,3,id);
  token=f.api.beginRun(id);for(let n=0;n<50;n++)f.api.recordSuccess(token);f.advance();
  result=f.api.finishRun(token,{score:1000,wave:1});
  assert.equal(result.amount,10,id);assert.equal(result.progress,3,id);
  assert.equal(f.api.snapshot().balances[id],12,id);
  assert.equal(materials.create({storage:f.storage}).snapshot().progress[id],3,id);
  assert.equal(f.api.finishRun(token,{score:1000,wave:1}).amount,0,id);
 }
});

test('wrong-answer score penalties never remove successful work; retries cannot repeat keyed successes',()=>{
 const f=fixture(),token=f.api.beginRun('space-scale');
 for(let n=0;n<12;n++){f.api.recordSuccess(token,'answer-'+n);f.api.recordSuccess(token,'answer-'+n);}
 f.advance();const result=f.api.finishRun(token,{score:0,wave:1});
 assert.equal(result.amount,2);assert.equal(result.progress,2);
});

test('old saves keep balances and homes and start remainder progress at zero',()=>{
 const f=fixture({toenow_materials_v1:JSON.stringify({version:1,balances:{'space-scale':8},homes:{'space-scale':{stage:3,owned:['welcome'],placed:['welcome']}}})});
 assert.equal(f.api.snapshot().progress['space-scale'],0);
 assert.equal(f.api.snapshot().balances['space-scale'],8);
 assert.equal(f.api.snapshot().homes['space-scale'].stage,3);
});

test('cancelled, practice and preview attempts cannot add to saved remainders',()=>{
 const f=fixture();
 for(const options of [{isPractice:true},{isPreview:true}]){
  const token=f.api.beginRun('space-scale',options);
  for(let n=0;n<50;n++)assert.equal(f.api.recordSuccess(token),0);
  assert.equal(f.api.finishRun(token,{score:10,wave:1,...options}).amount,0);
 }
 const token=f.api.beginRun('space-scale');for(let n=0;n<12;n++)f.api.recordSuccess(token);
 f.api.cancelRun(token);assert.equal(f.api.finishRun(token,{score:100,wave:1}).amount,0);
 assert.equal(f.api.snapshot().progress['space-scale'],0);
 assert.equal(f.api.snapshot().balances['space-scale'],0);
});

test('malformed remainders never mint materials and one game cannot spend another game progress',()=>{
 for(const value of [-1,5,50,'4',1.5]){
  const f=fixture({toenow_materials_v1:JSON.stringify({version:1,balances:{},homes:{},progress:{'space-scale':value}})});
  assert.equal(f.api.snapshot().progress['space-scale'],0);
 }
 const f=fixture(),token=f.api.beginRun('space-scale');for(let n=0;n<4;n++)f.api.recordSuccess(token);
 f.api.finishRun(token,{score:100,wave:1});const other=f.api.beginRun('number-pop');f.api.recordSuccess(other);
 assert.equal(f.api.finishRun(other,{score:100,wave:1}).amount,0);
 assert.equal(f.api.snapshot().progress['space-scale'],4);assert.equal(f.api.snapshot().progress['number-pop'],1);
});

test('all ten homes progress from one to three to four material recipes with balanced collaboration',()=>{
 const demand=Object.fromEntries(Object.keys(materials.ITEMS).map(id=>[id,0]));
 for(const id of Object.keys(materials.ITEMS)){
  for(const [stage,count] of [[2,1],[3,3],[4,4],[5,4]]){const cost=materials.upgradeRecipe(id,stage);assert.equal(Object.keys(cost).length,count);assert.equal(Object.values(cost).reduce((a,b)=>a+b,0),materials.COSTS[stage]);assert(cost[id]>0);}
  const cost=materials.recipe(id,'together');assert.equal(Object.keys(cost).length,4);for(const source of Object.keys(cost))demand[source]++;
 }
 assert.deepEqual(Object.values(demand),Array(10).fill(4));
 assert.deepEqual(materials.upgradeRecipe('number-pop',3),{'number-pop':12,'block-match':8,'flash-brain':4});
 assert.equal(materials.upgradeRecipe('number-pop',6),null);assert.equal(materials.upgradeRecipe('unknown',3),null);
});

test('a missing collaboration material prevents all spending; success deducts every ingredient once',()=>{
 const f=fixture();for(let i=0;i<7;i++)earn(f);assert(f.api.upgrade('number-pop').ok);
 const before=JSON.stringify(f.api.snapshot());assert.equal(f.api.upgrade('number-pop').ok,false);assert.equal(JSON.stringify(f.api.snapshot()),before);
 for(let i=0;i<2;i++)earn(f,'block-match');earn(f,'flash-brain');
 assert(f.api.upgrade('number-pop').ok);const state=f.api.snapshot();assert.equal(state.homes['number-pop'].stage,3);
 for(const id of ['number-pop','block-match','flash-brain'])assert.equal(state.balances[id],0);
 assert.equal(f.api.upgrade('number-pop').ok,false);
});

test('existing built stages and owned decorations survive the recipe change without retroactive costs',()=>{
 const f=fixture({toenow_materials_v1:JSON.stringify({version:1,balances:{'number-pop':7},homes:{'number-pop':{stage:4,owned:['welcome','together'],placed:['together']}}})});
 assert.deepEqual(f.api.snapshot().homes['number-pop'],{stage:4,owned:['welcome','together'],placed:['together']});assert.equal(f.api.snapshot().balances['number-pop'],7);assert.equal(f.api.craft('number-pop','together').ok,false);assert.equal(f.api.snapshot().balances['number-pop'],7);
});
test('exactly ten explorer games own distinct materials; carefree is excluded',()=>{assert.equal(Object.keys(materials.ITEMS||{}).length,10);assert.equal(new Set(Object.values(materials.ITEMS).map(i=>i.key)).size,10);assert.equal(materials.ITEMS['capybara-drift'],undefined);});
test('normal play credits only its own item, survives reload, and cannot repeat a receipt',()=>{const f=fixture();const run=f.api.beginRun('number-pop',{wave:1});for(let i=0;i<20;i++)f.api.recordSuccess(run);f.advance();assert.equal(f.api.finishRun(run,{score:10,wave:1}).amount,4);assert.equal(f.api.finishRun(run,{score:10,wave:1}).amount,0);const copy=materials.create({storage:f.storage});assert.equal(copy.snapshot().balances['number-pop'],4);assert.equal(copy.snapshot().balances['block-match'],0);});
test('practice, preview, zero work, unknown and implausible attempts do not award',()=>{const f=fixture();for(const options of [{isPractice:true},{isPreview:true}]){const run=f.api.beginRun('number-pop',options);f.advance();assert.equal(f.api.finishRun(run,{score:10,wave:1}).amount,0);}assert.equal(f.api.finishRun('unknown',{score:10,wave:1}).amount,0);const short=f.api.beginRun('number-pop',{});assert.equal(f.api.finishRun(short,{score:10,wave:1}).amount,0);const bad=f.api.beginRun('number-pop',{});f.advance();assert.equal(f.api.finishRun(bad,{score:99999999,wave:1}).amount,0);const zero=f.api.beginRun('number-pop',{});f.advance();assert.equal(f.api.finishRun(zero,{score:0,wave:1}).amount,0);assert.equal(f.api.snapshot().balances['number-pop'],0);});
test('own material upgrades are affordable, atomic and separate from challenge records',()=>{const f=fixture({qcc_best_wave_v1:'1'});assert.equal(f.api.upgrade('number-pop').ok,false);for(let i=0;i<4;i++)earn(f);assert.equal(f.api.upgrade('number-pop').ok,true);assert.equal(f.api.snapshot().homes['number-pop'].stage,2);assert.equal(f.api.snapshot().balances['number-pop'],0);assert.equal(f.values.qcc_best_wave_v1,'1');assert.equal(f.api.upgrade('number-pop').ok,false);});
test('starter and collaboration decorations spend exact recipes once and can be toggled',()=>{const f=fixture();earn(f);assert.equal(f.api.craft('number-pop','welcome').ok,true);assert.equal(f.api.craft('number-pop','welcome').ok,false);assert.equal(f.api.toggle('number-pop','welcome').ok,true);assert.equal(f.api.snapshot().homes['number-pop'].placed.includes('welcome'),false);for(let i=0;i<2;i++)earn(f);assert.equal(f.api.craft('number-pop','together').ok,false);for(const id of ['block-match','flash-brain','animal-rescue-train'])earn(f,id);assert.equal(f.api.craft('number-pop','together').ok,true);assert.equal(f.api.snapshot().balances['number-pop'],0);assert.equal(f.api.snapshot().balances['block-match'],0);});
test('legacy challenge stage is preserved once and later high scores do not build houses',()=>{const f=fixture({qcc_best_wave_v1:'16'});assert.equal(f.api.snapshot().homes['number-pop'].stage,4);earn(f);f.values.qcc_best_wave_v1='21';assert.equal(materials.create({storage:f.storage}).snapshot().homes['number-pop'].stage,4);});
test('latest balance is read for sequential clients and storage errors never report success',()=>{const f=fixture();const other=materials.create({storage:f.storage});earn(f);assert.equal(other.craft('number-pop','welcome').ok,true);assert.equal(f.api.craft('number-pop','welcome').ok,false);const denied=materials.create({storage:{getItem(){return null;},setItem(){throw Error('Denied');}},now:()=>30000});const run=denied.beginRun('number-pop',{});assert.equal(denied.finishRun(run,{score:10,wave:1}).amount,0);assert.equal(denied.upgrade('number-pop').ok,false);});
test('malformed balances cannot create spendable resources',()=>{for(const balance of [-2,1.5,'100',Infinity]){const f=fixture({toenow_materials_v1:JSON.stringify({balances:{'number-pop':balance},homes:{},version:1})});assert.equal(f.api.snapshot().balances['number-pop'],0);assert.equal(f.api.craft('number-pop','welcome').ok,false);}});
test('SDK lifecycle awards once, clears on replay and never awards a practice result',()=>{const SDK=require('../shared/toenow-sdk.js');const previous=global.localStorage,clock=Date.now;const values={};let now=1000;global.localStorage={getItem:k=>values[k]??null,setItem:(k,v)=>{values[k]=v;}};Date.now=()=>now;try{const sdk=new SDK({gameId:'number-pop'});sdk.startRun({wave:1});for(let i=0;i<20;i++)sdk.recordCorrectAnswer();now+=30000;assert.equal(sdk.finishMaterials({score:10,wave:1}).amount,4);assert.equal(sdk.finishMaterials({score:10,wave:1}).amount,0);sdk.startRun({wave:1,isPractice:true});now+=30000;assert.equal(sdk.finishMaterials({score:10,wave:1,isPractice:true}).amount,0);assert.equal(JSON.parse(values.toenow_materials_v1).balances['number-pop'],4);}finally{global.localStorage=previous;Date.now=clock;}});
test('Number Pop accepts an immediate first start and deduplicates its compatibility click',()=>{const vm=require('node:vm');const source=fs.readFileSync(require('node:path').join(__dirname,'../games/number-pop/main.js'),'utf8');const start=source.indexOf('function bindFastButton('),end=source.indexOf('function handleQuitOrRestartRun',start);const listeners={};let calls=0,now=100;const context={document:{getElementById:()=>({addEventListener:(name,fn)=>listeners[name]=fn,blur(){}})},performance:{now:()=>now}};vm.createContext(context);vm.runInContext(source.slice(start,end)+';this.bind=bindFastButton;',context);context.bind('btn-start',()=>calls++);listeners.pointerdown({type:'pointerdown',preventDefault(){},stopPropagation(){}});now=101;listeners.click({type:'click'});assert.equal(calls,1);});
test('interrupted runs lose their reward token',()=>{const f=fixture();const token=f.api.beginRun('number-pop',{wave:1});f.advance();assert.equal(typeof f.api.cancelRun,'function');f.api.cancelRun(token);assert.equal(f.api.finishRun(token,{score:10,wave:1}).amount,0);});

test('fox wave-20 result earns ribbons even when wrong answers end the run early',()=>{
 const values={};let now=1000;
 const api=materials.create({storage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},now:()=>now});
 const token=api.beginRun('space-scale',{wave:1});now+=20000;for(let n=0;n<40;n++)api.recordSuccess(token);
 assert.equal(api.finishRun(token,{score:7868,wave:19}).amount,8);
 assert.equal(api.snapshot().balances['space-scale'],8);
 assert.equal(api.finishRun(token,{score:7868,wave:19}).amount,0);
});

test('a legitimate six figure rabbit result is credited once rather than silently rejected',()=>{
 const values={};let now=1000;
 const api=materials.create({storage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},now:()=>now});
 const token=api.beginRun('number-pop',{wave:1});now+=90000;for(let n=0;n<40;n++)api.recordSuccess(token);
 assert.equal(api.finishRun(token,{score:133514,wave:22}).amount,8);
 assert.equal(api.snapshot().balances['number-pop'],8);
 assert.equal(api.finishRun(token,{score:133514,wave:22}).amount,0);
});

test('a finished run with no reward explains why to the result UI',()=>{
 const f=fixture(),token=f.api.beginRun('number-pop');f.advance();
 assert.equal(f.api.finishRun(token,{score:0,wave:1}).reason,'no-successes');
 const bad=f.api.beginRun('number-pop');f.advance();
 assert.equal(f.api.finishRun(bad,{score:NaN,wave:1}).reason,'unverified');
});

test('a short legitimate scored run earns materials without a ten second cutoff',()=>{
 for(const id of Object.keys(materials.ITEMS)){
  const values={};let now=1000;
  const api=materials.create({storage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},now:()=>now});
  const token=api.beginRun(id,{wave:1});now+=2500;for(let n=0;n<5;n++)api.recordSuccess(token);
  assert.equal(api.finishRun(token,{score:10,wave:1}).amount,1,id);
  assert.equal(api.finishRun(token,{score:10,wave:1}).amount,0,id+' duplicate');
 }
});
test('drift receipt caps a trip across resource identity changes and ledger reloads',()=>{
 const f=fixture();assert.equal(f.api.claimDrift('trip-test-123','block-match').amount,1);
 const reload=materials.create({storage:f.storage});assert.equal(reload.claimDrift('trip-test-123','number-pop').amount,0);
 assert.equal(reload.snapshot().balances['block-match'],1);assert.equal(reload.snapshot().balances['number-pop'],0);
 const run=reload.beginRun('block-match');for(let i=0;i<5;i++)reload.recordSuccess(run);reload.finishRun(run,{score:1,wave:1});
 assert.equal(materials.create({storage:f.storage}).claimDrift('trip-test-123','block-match').amount,0);assert.equal(reload.snapshot().balances['block-match'],2);
});
test('practice and invalid drift receipts never save and a failed save can retry',()=>{
 const f=fixture(),before=JSON.stringify(f.values);
 assert.equal(f.api.claimDrift('trip-test-456','block-match',{isPractice:true}).ok,false);
 assert.equal(f.api.claimDrift('trip-test-456','unknown').ok,false);assert.equal(f.api.claimDrift('__proto__','block-match').ok,false);assert.equal(JSON.stringify(f.values),before);
 const original=f.storage.setItem;f.storage.setItem=()=>{throw Error('full');};assert.equal(f.api.claimDrift('trip-test-456','block-match').ok,false);f.storage.setItem=original;
 assert.equal(f.api.claimDrift('trip-test-456','block-match').amount,1);assert.equal(f.api.claimDrift('trip-test-456','block-match').amount,0);
});
