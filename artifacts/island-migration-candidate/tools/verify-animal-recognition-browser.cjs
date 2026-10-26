// Real pointer input against production code. Only missing integration includes are
// supplied for an in-progress checkout; no game state or answers are mutated.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const out=path.resolve(__dirname,'../artifacts/animal-island');
fs.mkdirSync(out,{recursive:true});
async function run(){
 const server=await chromium.launchServer({channel:'msedge',headless:true});
 const browser=await chromium.connect(server.wsEndpoint());
 const bounded=(promise,ms)=>Promise.race([promise,new Promise(resolve=>{const timer=setTimeout(resolve,ms);timer.unref()})]);
 const results=[];const resultName='recognition-browser-results'+(process.env.ANIMAL_BROWSER_GAME?'-'+process.env.ANIMAL_BROWSER_GAME:'')+(process.env.ANIMAL_BROWSER_SIZE?'-'+process.env.ANIMAL_BROWSER_SIZE:'')+'.json';
 try{
  for(const [size,viewport] of [['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]){
   if(process.env.ANIMAL_BROWSER_SIZE && size!==process.env.ANIMAL_BROWSER_SIZE)continue;
   for(const id of ['animal-rescue-train','tap-match','spot-quick','flash-brain']){
    if(process.env.ANIMAL_BROWSER_GAME && id!==process.env.ANIMAL_BROWSER_GAME)continue;
    console.log('START',id,size);
    const page=await browser.newPage({viewport});page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);const errors=[];const supplied=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/games/'+id+'/**',async route=>{
     const request=route.request();if(request.resourceType()!=='document')return route.continue();
     const response=await route.fetch();let html=await response.text();let additions='';
     if(!html.includes('shared/toenow-animals.js')){additions+='<script src="../../shared/toenow-animals.js"></script>';supplied.push('shared/toenow-animals.js');}
     if(id==='flash-brain'&&!html.includes('garden.js')){additions+='<script src="./garden.js"></script>';supplied.push('games/flash-brain/garden.js');}
     html=html.replace('</head>',additions+'</head>');
     await route.fulfill({response,body:html});
    });
    console.log('NAVIGATE',id,size);
    await page.goto(base+'/games/'+id+'/'+(id==='flash-brain'?'?wave=16&practice=1&autostart=1':''));
    await page.waitForFunction(()=>!!window.ToenowAnimals);
    await page.evaluate(()=>{window.__animalFeedback=[];const feedback=ToenowAnimals.feedback;ToenowAnimals.feedback=(id,success)=>{window.__animalFeedback.push({id,success});return feedback(id,success)}});
    if(id==='animal-rescue-train'){
     await page.locator('#btn-start-game').click();
     if(await page.locator('#acknowledge-last-animal').isVisible())await page.locator('#acknowledge-last-animal').click();
     await page.locator('[data-queue]:not(:disabled)').first().click();
     const legal=page.locator('[data-car]:not(:disabled)').first();await legal.click();
     await page.waitForFunction(()=>document.querySelector('#stationmaster').classList.contains('boarding-cheer'));
     assert.equal(await page.evaluate(()=>__animalFeedback.some(x=>x.success)),true);
     await page.evaluate(()=>{window.__stationLanguageRef={svg:document.querySelector('#stationmaster svg'),head:document.querySelector('[data-queue]'),moves:document.querySelector('#moves').textContent}});
     const chinese=await page.evaluate(()=>{ToenowI18n.setLanguage('zh-Hant');return document.querySelector('#stationmaster span').textContent});
     assert.equal(chinese,'點隊伍最前面的動物','Chinese stationmaster text updates synchronously');
     await page.screenshot({path:path.join(out,`${id}-${size}-language-zh.png`),fullPage:true});
     const english=await page.evaluate(()=>{ToenowI18n.setLanguage('en');return document.querySelector('#stationmaster span').textContent});
     assert.equal(english,'Tap an animal at the front','English stationmaster text restores synchronously');
     assert.equal(await page.evaluate(()=>__stationLanguageRef.svg===document.querySelector('#stationmaster svg')&&__stationLanguageRef.head===document.querySelector('[data-queue]')&&__stationLanguageRef.moves===document.querySelector('#moves').textContent),true,'Language changes preserve mascot, queue nodes and move count');
     await page.screenshot({path:path.join(out,`${id}-${size}-boarding.png`),fullPage:true});
     // Illegal boarding remains disabled; it cannot change the puzzle.
     await page.locator('[data-queue]:not(:disabled)').first().click();
     let disabled=await page.locator('[data-car]:disabled').count();
     if(!disabled){await page.locator('[data-queue][aria-pressed="true"]').click();disabled=await page.locator('[data-car]:disabled').count();}
     assert.ok(disabled>0,'Boarding without a valid selection is blocked');
     const moves=await page.locator('#moves').textContent();
     const blockedBox=await page.locator('[data-car]:disabled').first().boundingBox();
     await page.mouse.click(blockedBox.x+blockedBox.width/2,blockedBox.y+blockedBox.height/2);
     assert.equal(await page.locator('#moves').textContent(),moves);
     results.push({id,size,boarding:true,liveLanguageSwitch:true,illegalBoardingBlocked:true,disabledCarriages:disabled,errors,supplied});
    }else if(id==='tap-match'){
     await page.locator('#btn-start-run').click();await page.locator('#btn-begin-wave').click();
     await page.waitForFunction(()=>__PENGUIN_POOL_STATE.phase==='PLAYING');
     const clickNode=async target=>{
      await page.waitForFunction(target=>__PENGUIN_POOL_STATE.nodes.some(n=>n.status==='ACTIVE'&&n.isTarget===target),target,{timeout:15000});
      const point=await page.evaluate(target=>__PENGUIN_POOL_STATE.nodes.find(n=>n.status==='ACTIVE'&&n.isTarget===target),target);
      const box=await page.locator('#game-canvas').boundingBox();await page.mouse.click(box.x+point.x,box.y+point.y);
     };
     await clickNode(true);await page.waitForFunction(()=>__PENGUIN_POOL_STATE.cardsInFlight>0);
     await page.screenshot({path:path.join(out,`${id}-${size}-collected.png`)});
     await clickNode(false);assert.equal(await page.evaluate(()=>__animalFeedback.some(x=>!x.success)),true);
     results.push({id,size,collection:true,wrongInput:true,errors,supplied});
    }else if(id==='spot-quick'){
     await page.locator('#startAnalysisBtn').click();await page.waitForFunction(()=>__OWL_OBSERVATION_STATE.mode==='ACTIVE');
     const wrong=await page.evaluate(()=>__OWL_OBSERVATION_STATE.candidates.findIndex(c=>!c.correct));
     await page.locator('#candBtn'+wrong).click();
     await page.waitForFunction(i=>__OWL_OBSERVATION_STATE.candidates[i].depleted,wrong);
     await page.waitForTimeout(330);
     const correct=await page.evaluate(()=>__OWL_OBSERVATION_STATE.candidates.findIndex(c=>c.correct));
     await page.locator('#candBtn'+correct).click();await page.waitForFunction(()=>__OWL_OBSERVATION_STATE.mode==='LOCKED_CORRECT');
     await page.screenshot({path:path.join(out,`${id}-${size}-archive.png`)});
     const state=await page.evaluate(()=>__OWL_OBSERVATION_STATE);
     assert.equal(state.specimenCount,170);assert.equal(state.categories.length,50);
     assert.equal(await page.evaluate(()=>__animalFeedback.some(x=>x.success)&&__animalFeedback.some(x=>!x.success)),true);
     results.push({id,size,archived:true,wrongInput:true,specimens:170,categories:50,errors,supplied});
    }else{
     await page.waitForFunction(()=>!!window.FlashMemoryGarden&&!!window.__SYNAPSE_STATE);
     await page.evaluate(()=>{
      window.__gardenRenderPrivacy={leaks:0,revealed:0};const draw=FlashMemoryGarden.drawCell;
      FlashMemoryGarden.drawCell=(ctx,cell,phase,shell,...args)=>{
       const old=ToenowAnimals.drawAnimal;ToenowAnimals.drawAnimal=(...params)=>{
        if(!cell.tapped&&(phase==='PHASE_RETENTION'||phase==='PHASE_INPUT'))__gardenRenderPrivacy.leaks++;
        if(phase==='PHASE_FLASH')__gardenRenderPrivacy.revealed++;
        return old(...params);
       };
       try{return draw(ctx,cell,phase,shell,...args)}finally{ToenowAnimals.drawAnimal=old}
      };
     });
     await page.waitForFunction(()=>__SYNAPSE_STATE.phase==='PHASE_FLASH');
     const hud=await page.evaluate(()=>({timerRight:document.querySelector('[data-testid="hud-timer"]').getBoundingClientRect().right,levelLeft:document.querySelector('[data-testid="hud-level"]').getBoundingClientRect().left}));
     assert.ok(hud.timerRight+4<hud.levelLeft,'Timer and level must not overlap');
     await page.screenshot({path:path.join(out,`${id}-${size}-reveal.png`)});
     await page.waitForFunction(()=>['PHASE_RETENTION','PHASE_INPUT'].includes(__SYNAPSE_STATE.phase));
     await page.screenshot({path:path.join(out,`${id}-${size}-recall.png`)});
     const cells=await page.evaluate(()=>__SYNAPSE_STATE.cells),box=await page.locator('[data-testid="matrix-canvas"]').boundingBox();
     const safe=cells.find(c=>c.type==='TARGET'),hazard=cells.find(c=>c.type==='DECOY');assert.ok(safe&&hazard);
     await page.mouse.click(box.x+safe.screenX,box.y+safe.screenY);
     await page.waitForFunction(()=>__animalFeedback.some(x=>x.success));
     await page.mouse.click(box.x+hazard.screenX,box.y+hazard.screenY);
     await page.waitForFunction(()=>__SYNAPSE_STATE.phase==='PHASE_BREACH');
     await page.screenshot({path:path.join(out,`${id}-${size}-hazard.png`)});
     const privacy=await page.evaluate(()=>__gardenRenderPrivacy);assert.equal(privacy.leaks,0);assert.ok(privacy.revealed>0);
     assert.equal(await page.evaluate(()=>__animalFeedback.some(x=>!x.success)),true);
     results.push({id,size,correctInput:true,hazardInput:true,hudNoOverlap:true,privacy,errors,supplied});
    }
    assert.deepEqual(errors,[],id+' '+size+' page errors');
    console.log('PASS',id,size);await bounded(page.close(),3000);
   }
  }
 }finally{await bounded(browser.close(),5000);if(server.process()?.exitCode===null){try{require('node:child_process').execFileSync('taskkill',['/PID',String(server.process().pid),'/T','/F'],{stdio:'ignore'})}catch{}}fs.writeFileSync(path.join(out,resultName),JSON.stringify(results,null,2));}
 console.log(`PASS ${results.length} game/viewport combinations`);
}
run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
