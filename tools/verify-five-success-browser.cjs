// Test-only drivers select valid targets through production input controllers.
// No fake scores, waves, successes or clocks. End hooks only shorten timeout waits.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const catalog=require('../shared/toenow-screen-config.js'),materials=require('../shared/toenow-materials.js');
const {analyze}=require('./rescue-train-difficulty.cjs');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765',out=path.resolve(__dirname,'../artifacts/five-success');
const drivers={
 'number-pop':{step:`if(game.state==='playing'&&game.waveTransitionTimer<=0)handleCoreSelection(getLowestUnpoppedCore());`,end:`triggerGameOver();`},
 'ball-track':{step:`if(state.phase==='memorize')confirmMemory();if(state.phase==='select')handleShellSelection(state.shells.find(s=>s.hasCore&&!s.picked));`,end:`endTimedRun();`},
 'block-match':{step:`for(let r=0;r<board.config.gridSize;r++){const c=board.activeGrid[r].indexOf(2);if(c>=0){handleSingleCellTap(r,c);break;}}`,end:`triggerGameOver();`},
 'add-up':{step:`if(state==='playing'&&selectedNodes.length===0){for(let mask=1;mask<(1<<nodes.length);mask++){const chosen=nodes.filter((_,i)=>mask&(1<<i));if(chosen.length>=2&&evaluateSelection(chosen)===target){for(const node of chosen)toggleNodeSelection(node);break;}}}`,end:`triggerGameOver();`},
 'space-scale':{step:`if(gameState==='playing'&&!collapseAnim)handleBodySelection(currentPuzzle.targetBodyId);`,end:`triggerGameOver();`},
 'tap-match':{step:`if(state.phase==='BRIEFING')btnBeginWave.click();else if(state.phase==='WAVE_CLEAR')btnNextWave.click();else if(state.phase==='STAGING')handlePointerDown(0,0);else if(state.phase==='PLAYING'){const n=state.nodes.find(n=>n.status==='ACTIVE'&&n.isTarget);if(n){const r=canvas.getBoundingClientRect();handlePointerDown(r.left+n.x,r.top+n.y);}}`,end:`endRun('TIME EXPIRED');`},
 'spot-quick':{step:`handleCandidateSelection(state.candidates.findIndex(c=>c.correct&&!c.depleted));`,end:`triggerGameOver('TIME EXPIRED');`},
 'shadow-match':{step:`if(state.setup)handleCardSelection(state.setup.correctCardIndex);`,end:`triggerGameOver();`}
};
async function instrument(page,id){
 if(id==='flash-brain'){
  await page.route('**/assets/index-cr-6j3L1.js*',async r=>{
   const response=await r.fetch();let s=await response.text();const marker='const releaseTutorial=window.FlashBrainTutorial';assert(s.includes(marker));
   s=s.replace(marker,`window.__materialEnd=()=>b();window.__materialStep=()=>{const n=p.current;if(!n||!['PHASE_RETENTION','PHASE_INPUT'].includes(n.phase))return;const cell=n.waveState.cells.find(c=>!c.tapped&&c.type==='PRIORITY')||n.waveState.cells.find(c=>!c.tapped&&c.type==='TARGET');const rect=n.cellScreenGeometries.find(r=>r.id===cell?.id);if(rect)x(rect.centerX,rect.centerY);};`+marker);
   await r.fulfill({response,body:s});
  });
 }else{
  const filename=id==='animal-rescue-train'?'game.js':'main.js';
  await page.route(`**/games/${id}/${filename}*`,async r=>{
   const response=await r.fetch();let s=await response.text(),at=s.lastIndexOf('})();');assert(at>0);
   const hook=id==='animal-rescue-train'?`window.__materialLevel=()=>game.level;`:`window.__materialStep=()=>{${drivers[id].step}};window.__materialEnd=()=>{${drivers[id].end}};${id==='space-scale'?`window.__materialReady=()=>!collapseAnim;window.__materialWrong=()=>{if(!collapseAnim)handleBodySelection(currentPuzzle.bodies.find(b=>b.id!==currentPuzzle.targetBodyId).id);};`:''}`;
   s=s.slice(0,at)+hook+s.slice(at);await r.fulfill({response,body:s});
  });
 }
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
 try{
  for(const id of Object.keys(materials.ITEMS).filter(id=>!process.env.TOENOW_TEST_GAMES||process.env.TOENOW_TEST_GAMES.split(',').includes(id))){
   const context=await browser.newContext({viewport:{width:1100,height:850}});await context.route('https://**',r=>r.abort());
   await context.addInitScript(()=>{for(const id of ['number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain','animal-rescue-train'])localStorage.setItem('toenow_tutorial_'+id+'_v2','completed');for(const lesson of ['thorns','priority'])localStorage.setItem('toenow_flash_lesson_'+lesson+'_v1','completed');});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(id+': '+e.message));page.setDefaultTimeout(10000);await instrument(page,id);
   await page.goto(base+`/games/${id}/`);await page.locator('#'+(id==='animal-rescue-train'?'btn-start-game':catalog[id].startId)).click();
   await page.waitForFunction(id=>!!ToenowGameSDK.getInstance(id)?.materialRun,id);
   if(id==='animal-rescue-train'){
    const level=await page.evaluate(()=>__materialLevel()),moves=analyze(level).path;assert(moves);
    let undone=false;
    for(const [queue,car] of moves){
     await page.locator(`[data-queue="${queue}"]`).click();await page.locator(`[data-car="${car}"]`).click();
     const count=await page.evaluate(()=>ToenowGameSDK.getInstance('animal-rescue-train').materialCorrectCount);
     if(count===3&&!undone){
      await page.locator('#undo').click();await page.locator(`[data-queue="${queue}"]`).click();await page.locator(`[data-car="${car}"]`).click();
      assert.equal(await page.evaluate(()=>ToenowGameSDK.getInstance('animal-rescue-train').materialCorrectCount),3);await page.locator('#menu').click();await page.locator('#continue').click();assert.equal(await page.evaluate(()=>ToenowGameSDK.getInstance('animal-rescue-train').materialCorrectCount),3);undone=true;
     }
    }
    assert(undone,'exercise undo after departure');
   }else{
    const began=Date.now();while(Date.now()-began<150000){
     if(await page.evaluate(id=>ToenowGameSDK.getInstance(id).materialCorrectCount>=5,id))break;
     await page.evaluate(()=>window.__materialStep());await page.waitForTimeout(120);
    }
    assert.equal(await page.evaluate(id=>ToenowGameSDK.getInstance(id).materialCorrectCount,id),5,id+' actual success callbacks');
    await page.evaluate(()=>window.__materialEnd());
   }
   await page.locator('.toenow-material-reward').waitFor();
   const state=await page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot());
   assert.equal(state.balances[id],1,id+' earned one item');assert.equal(state.progress[id],id==='animal-rescue-train'?1:0);
   if(id!=='animal-rescue-train'){await page.evaluate(()=>window.__materialEnd());await page.waitForTimeout(60);assert.equal(await page.evaluate(id=>ToenowMaterials.create({storage:localStorage}).snapshot().balances[id],id),1);}
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));
   assert((await page.locator('.toenow-material-reward').innerText()).includes('再成功'));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({animations:'disabled',path:path.join(out,id+'-result.png')});
   if(id==='space-scale'){
    // Actual partial runs carry forward, and deliberate wrong clicks cannot
    // mint a minimum reward or subtract earlier successful answers.
    for(const n of [1,4,12,50]){
     await page.locator('#'+catalog[id].retryId).click();
     const began=Date.now();while(Date.now()-began<60000&&await page.evaluate(()=>ToenowGameSDK.getInstance('space-scale').materialCorrectCount)<n){await page.evaluate(()=>__materialStep());await page.waitForTimeout(310);}
     assert.equal(await page.evaluate(()=>ToenowGameSDK.getInstance('space-scale').materialCorrectCount),n);
     if(n===1){await page.waitForFunction(()=>__materialReady());for(let i=0;i<15;i++)await page.evaluate(()=>__materialWrong());}
     else await page.evaluate(()=>__materialEnd());
     await page.locator('.toenow-material-reward').waitFor();
     const save=await page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot());
     const expected={1:[1,1],4:[2,0],12:[4,2],50:[14,2]}[n];
     assert.deepEqual([save.balances[id],save.progress[id]],expected);
     await page.screenshot({animations:'disabled',path:path.join(out,'fox-'+n+'-successes.png')});
    }
    await page.locator('#'+catalog[id].returnId).click();
    await page.locator('.unified-practice-btn').click();await page.locator('[data-level="1"]').click();
    for(let i=0;i<5;i++){await page.evaluate(()=>__materialStep());await page.waitForTimeout(340);}
    await page.evaluate(()=>__materialEnd());await page.locator('.toenow-material-reward[data-reward-status="practice"]').waitFor();
    assert.deepEqual(await page.evaluate(()=>{const s=ToenowMaterials.create({storage:localStorage}).snapshot();return [s.balances['space-scale'],s.progress['space-scale']];}),[14,2]);
    checks.push('Fox: 1 success + wrong spam, 4/12/50 successes, carry, no cap, and practice isolation PASS');console.log(checks.at(-1));
   }
   checks.push(id+': actual accepted actions, one item, remainder, duplicate and mobile ZH receipt PASS');console.log(checks.at(-1));
   await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
