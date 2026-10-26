const { readSource } = require('../tools/lib/game-source.cjs');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=readSource('games/ball-track/index.html','utf8');
function render(phase,hasCore,revealedState=null,shieldOpen=0){
 const log=[];
 const ctx=new Proxy({}, {get:(_,key)=>(...args)=>{log.push([key,...args]);if(String(key).startsWith('create'))return {addColorStop:(...stops)=>log.push(['stop',...stops])};},set:(_,key,value)=>{log.push([key,value]);return true;}});
 const animals=[];
 const env={ctx,Math,getCapsuleRadius:()=>30,state:{phase,mode:'playing'},window:{ToenowAnimals:{drawAnimal:(...args)=>animals.push(args.slice(1))}}};
 const code=html.slice(html.indexOf('function drawShellCapsule('),html.indexOf('function drawParticlesAndPopups('));
 env.scene=env;
 vm.runInNewContext(code,env);
 env.drawShellCapsule({x:20,y:30,scaleX:1,scaleY:1,hasCore,revealedState,shieldOpen,id:1},0);
 return {log,animals};
}
test('otter leaves conceal target identity throughout shuffle and selection, even with residual opening',()=>{
 for(const phase of ['shuffle','select','ready_banner','go_banner']){
   const target=render(phase,true,null,0.12),empty=render(phase,false,null,0.12);
   assert.deepEqual(target.log,empty.log);
   assert.equal(target.animals.length,0);
 }
});
test('otter stays visible while awaiting memory confirmation and hides during movement',()=>{
 for(const phase of ['lineup','wave_ready','insert','memorize']){
   assert.equal(render(phase,true,null,1).animals[0]?.[0],'otter');
   assert.equal(render(phase,false,null,1).animals.length,0);
 }
 assert.equal(render('select',true,'correct',1).animals[0]?.[0],'otter');
 assert.equal(render('resolve',true,'missed',1).animals[0]?.[0],'otter');
 assert.equal(render('select',false,'wrong',1).animals.length,0);
});

test('otter target panel uses the pond paper palette',()=>{
 const colors=[],labels=[];
 const ctx=new Proxy({}, {get:(_,key)=>key==='fillText'?(label)=>labels.push(label):()=>{},set:(_,key,value)=>{if(key==='fillStyle')colors.push(value);return true;}});
 const env={Math,ctx,state:{mode:'playing',phase:'lineup',config:{targetCount:1},shells:[]},viewportWidth:390,
  getPlayboardGeometry:()=>({queueX:250,panelW:86,isMobile:false}),computeTargetLineupPositions:()=>[{x:250,y:100}],getCapsuleRadius:()=>24};
 const paint=loadFunction('ball-track','drawTargetLineupPanel','function drawTrajectoryArcs(',env);paint();
 assert.ok(colors.includes('#fffaf0'));assert.ok(colors.includes('#355f53'));assert.deepEqual(labels,['Find the otter']);
});

function loadFunction(game,name,next,env){
 const src=readSource(`games/${game}/index.html`,'utf8');
 env.scene=env;
 vm.runInNewContext(src.slice(src.indexOf(`function ${name}(`),src.indexOf(next,src.indexOf(`function ${name}(`))),env);
 return env[name];
}
test('timber carving removes only excess cells and preserves required cells with original penalty',()=>{
 const feedback=[];const noop=()=>{};
 const env={Math,gameMode:'playing',mirrorLesson:null,mirrorReady:false,state:{freezeTimer:0,score:0,combo:1,peakCombo:1,timeLeft:40,totalShards:0,highScore:99999,mistakesInWave:0},
 board:{config:{gridSize:2},activeGrid:[[2,1],[2,0]],remainingExcess:2,blocksShatteredInWave:0},layout:{leftBox:{}},
 window:{ToenowAnimals:{feedback:(...args)=>feedback.push(args)}},getCellCenter:()=>({x:0,y:0}),CORRECT_TAP_TIME_BONUS:.8,MAX_TIME_CAP_SECONDS:100,
 WRONG_TAP_TIME_PENALTY:1.5,MISTAKE_FREEZE_SECONDS:.35,shakeTrauma:0,redGlitchTimer:0,
 spawnShards:noop,spawnPopup:noop,playSiliconTap:noop,saveStorage:noop,syncHud:noop,playGlitchBuzz:noop,STORAGE_KEY_SHARDS:'shards'};
 const tap=loadFunction('block-match','handleSingleCellTap',"// --- Deliberate Single-Cell",env);
 env.mirrorLesson='level-2';tap(0,0);
 assert.equal(env.board.activeGrid[0][0],2,'mirror instructions wait for the player to choose Try it');
 assert.equal(env.state.score,0);assert.equal(env.state.timeLeft,40);
 env.mirrorLesson=null;
 tap(0,0);assert.equal(env.board.activeGrid[0][0],0);assert.equal(env.state.score,50);assert.equal(env.state.timeLeft,40.8);
 tap(0,1);assert.equal(env.board.activeGrid[0][1],1);assert.equal(env.state.combo,1);assert.equal(env.state.timeLeft,39.3);assert.equal(env.state.freezeTimer,.35);
 assert.deepEqual(feedback,[['block-match',true],['block-match',false]]);
});
test('raccoon theater keeps correct-card award and wrong-card time penalty',()=>{
 for(const isCorrect of [true,false]){
  const feedback=[];const noop=()=>{};
  const env={Math,state:{mode:'playing',transitionType:'none',setup:{cards:[{isCorrect}],spec:{level:2,parSeconds:3}},waveElapsed:5,totalAttempts:0,correctAttempts:0,wavesResolved:0,score:0,combo:2,peakCombo:2,timeRemaining:40},
  window:{ToenowAnimals:{feedback:(...args)=>feedback.push(args)}},sound:{playLockSuccess:noop,playFaultBuzz:noop},syncHUD:noop};
  const pick=loadFunction('shadow-match','handleCardSelection','// ============================================================================',env);
  pick(0);assert.equal(env.state.score,isCorrect?1600:0);assert.equal(env.state.timeRemaining,isCorrect?40:37);
  assert.equal(env.state.transitionType,isCorrect?'correct':'fault');assert.deepEqual(feedback,[['shadow-match',isCorrect]]);
 }
});
test('timber blueprints invert their axes without changing required/excess cell identity',()=>{
 const env=require('../games/block-match/rules.js');
 for(const wave of [1,6,11,16,21,60]){
  const b=env.generateWaveBoard(wave,0),n=b.config.gridSize;
  let extras=0;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
   const v=b.activeGrid[r][c];if(v===2)extras++;
   assert.equal(v===1,b.carvingTargetGrid[r][c]===1);
   const rr=wave>=11?n-1-r:r,cc=(wave>=6&&wave<=10)||wave>=16?n-1-c:c;
   assert.equal(b.blueprintGrid[r][c],b.carvingTargetGrid[rr][cc]);
  }
  assert.equal(extras,b.remainingExcess);
 }
});
test('raccoon puppeteer stays above the stage instruction band',()=>{
 const animals=[];const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 const env={ctx,Math,state:{chamberRect:{x:10,y:127,width:370,height:350}},window:{ToenowAnimals:{drawAnimal:(...args)=>animals.push(args)}}};
 const paint=loadFunction('shadow-match','renderForestTheater','function renderOpticalChamber(',env);
 paint();const [,species,x,y,size]=animals[0];assert.equal(species,'raccoon');assert.ok(y+size/2<=env.state.chamberRect.y-28,'puppeteer must not overlap the stage text');
});
test('beaver portrait fits between stacked boards without blueprint clipping',()=>{
 for(const [left,right] of [
  [{x:30,y:475,size:330},{x:30,y:115,size:330}],
  [{x:150,y:294,size:370},{x:570,y:294,size:370}]
 ]){
  const calls=[];const noop=()=>{};
  const ctx=new Proxy({}, {get:(_,key)=>String(key).startsWith('create')?()=>({addColorStop:noop}):noop,set:()=>true});
  const box=b=>({...b,pad:10,cellSize:20,gap:3});
  const env={ctx,Math,layout:{leftBox:box(left),rightBox:box(right)},board:{config:{gridSize:1},activeGrid:[[1]],blueprintGrid:[[1]]},electricArcTimer:0,drawRoundedRect:noop,
   window:{ToenowAnimals:{drawAnimal:(...args)=>calls.push(args)}}};
  const paint=loadFunction('block-match','drawBoards','function updateAndDrawParticles(',env);paint();
  const [,species,x,y,size]=calls[0];assert.equal(species,'beaver');
  for(const b of [left,right])assert.ok(x+size/2<=b.x||x-size/2>=b.x+b.size||y+size*1.35/2<=b.y-4||y-size*1.35/2>=b.y+b.size+4,'portrait must remain clear of both board surfaces');
 }
});
