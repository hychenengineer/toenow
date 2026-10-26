const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../shared/toenow-tutorial-config.js');
const screens=require('../shared/toenow-screen-config.js');
const keys=require('../shared/toenow-levels.js').GAME_STORAGE_KEYS;
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8766';
const ids=Object.keys(catalog).filter(id=>!process.env.TOENOW_TEST_GAMES||process.env.TOENOW_TEST_GAMES.split(',').includes(id));
const startId=id=>screens[id]?.startId||'btn-start-game',titleId=id=>screens[id]?.titleId||'menu-screen';
const tutorialKey=id=>'toenow_tutorial_'+id+'_v2';
const shotDir=process.env.TOENOW_TUTORIAL_SHOTS||'artifacts/in-game-tutorials';
const widths=process.env.TOENOW_TEST_WIDTHS?process.env.TOENOW_TEST_WIDTHS.split(',').map(Number):[390,1100];
const languages=process.env.TOENOW_TEST_LANGS?process.env.TOENOW_TEST_LANGS.split(','):['en','zh-Hant'];
const height=Number(process.env.TOENOW_TEST_HEIGHT||850);
async function closeContext(context){let timer;await Promise.race([context.close(),new Promise(r=>timer=setTimeout(r,5000))]);clearTimeout(timer);}
async function storage(page){return page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('toenow_tutorial_')).sort().map(k=>[k,localStorage.getItem(k)])));}
async function ready(page,id,lang='en'){
  await page.goto(base+'/games/'+id+'/');
  await page.locator('#'+startId(id)).waitFor({state:'visible'});
  await page.evaluate(lang=>ToenowI18n.setLanguage(lang),lang);
  await page.evaluate(id=>{
    for(const name of ['startRun','handleGameOver','reportGameOver']){
      const proto=window.ToenowGameSDK?.prototype,original=proto?.[name];
      if(typeof original==='function')proto[name]=function(...args){if(window.ToenowTutorials?.isActive(id))window.__lessonReports?.push(name);return original.apply(this,args);};
    }
  },id);
}
async function setup(context,id){
  await context.addInitScript(()=>{
    window.__coachShifts=[];window.__coachSamples=0;let baseline;
    function sample(){
      const coach=document.getElementById('toenow-tutorial'),prompt=document.getElementById('tutorial-instruction');
      if(coach&&prompt){
        const values=[coach,prompt].flatMap(el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height];});
        if(!baseline)baseline=values;
        else if(values.some((n,i)=>Math.abs(n-baseline[i])>.5))window.__coachShifts.push(values);
        window.__coachSamples++;
      }else baseline=null;
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await context.addInitScript(({id,key})=>{
    if(key){if(localStorage.getItem(key.score)===null)localStorage.setItem(key.score,'17');if(localStorage.getItem(key.wave)===null)localStorage.setItem(key.wave,'2');}
    localStorage.setItem('tutorial-preserved-fixture','keep');
    window.__lessonWrites=[];window.__lessonReports=[];
    const write=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(window.ToenowTutorials?.isActive(id)&&!k.startsWith('toenow_tutorial_')&&k!=='toenow_language_v1')window.__lessonWrites.push(k);return write.call(this,k,v);};
    const post=window.postMessage.bind(window);
    window.addEventListener('message',e=>{if(window.ToenowTutorials?.isActive(id)&&['GAME_OVER','SCORE_UPDATE'].includes(e.data?.type))window.__lessonReports.push(e.data.type);});
  },{id,key:keys[id]});
}
async function assertLayout(page){
  const layout=await page.evaluate(()=>{
    const coach=document.getElementById('toenow-tutorial').getBoundingClientRect();
    const game=document.getElementById('toenow-tutorial-game');
    if(!game)return {missing:true};
    const r=game.getBoundingClientRect();
    const overlap=b=>Math.min(coach.right,b.right)-Math.max(coach.left,b.left)>1&&Math.min(coach.bottom,b.bottom)-Math.max(coach.top,b.top)>1;
    const controls=[...game.querySelectorAll('.island-hud-task,.bottom-hud,.overdrive-btn')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
    const blocked=controls.filter(n=>{const b=n.getBoundingClientRect();return overlap(b)||b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1;}).map(n=>n.className);
    return {missing:false,overlap:overlap(r),blocked,inBounds:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};
  });
  assert.equal(layout.missing,false,'game needs its own reserved tutorial region');
  assert.equal(layout.overlap,false,'coach overlaps game region');
  assert.equal(layout.inBounds,true,'game region outside viewport');
  assert.deepEqual(layout.blocked,[],'coach blocks instructions or acceleration controls');
}
async function assertProtected(page){
  await assertLayout(page);
  assert.ok(await page.evaluate(()=>__coachSamples)>0,'coach geometry sampled');
  assert.deepEqual(await page.evaluate(()=>__coachShifts),[],'tutorial card and message stay in one fixed position');
  assert.deepEqual(await page.evaluate(()=>__lessonWrites),[],'tutorial wrote game storage');
  assert.deepEqual(await page.evaluate(()=>__lessonReports),[],'tutorial reported game results');
  const score=page.locator('#hud-score,#hudScoreText,[data-testid="hud-score"]');
  if(await score.count())assert.equal(Number((await score.first().innerText()).replace(/[^\d.-]/g,'')),0,'tutorial score must stay zero');
}
async function complete(page,id,mobile=false){
  let taps=0;
  while(!(await page.evaluate(()=>ToenowTutorials.getState()?.complete))){
    await page.waitForFunction(()=>{const s=ToenowTutorials.getState();return s?.complete||s?.guide?.action||s?.guide?.rect&&!s.guide.waiting;},{},{timeout:20000});
    const state=await page.evaluate(()=>ToenowTutorials.getState());if(state.complete)break;
    if(await page.locator('[data-tutorial-advance]').isVisible()){
      await page.locator('[data-tutorial-advance]').click();
      if(id==='ball-track'){
        const boost=page.locator('#btn-overdrive');await boost.waitFor({state:'visible'});await assertProtected(page);
        const box=await boost.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
        await page.mouse.down();await page.waitForTimeout(200);await page.mouse.up();
      }
      continue;
    }
    const r=state.guide.rect;
    const x=r.x+r.width/2,y=r.y+r.height/2;
    assert.ok(x>=0&&x<page.viewportSize().width&&y>=0&&y<page.viewportSize().height,id+' real target outside viewport');
    const hit=await page.evaluate(({x,y})=>{const e=document.elementFromPoint(x,y);return {tag:e?.tagName,coach:!!e?.closest('#toenow-tutorial'),replica:!!e?.closest('.tutorial-choice')};},{x,y});
    assert.equal(hit.coach,false,id+' coach blocks real input');assert.equal(hit.replica,false);
    assert.ok(hit.tag,id+' target missing');
    if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
    await page.waitForTimeout(70);
    await assertProtected(page);
    assert.ok(++taps<=24,id+' real input did not progress');
  }
  await page.locator('[data-tutorial-finish]').waitFor({state:'visible'});return taps;
}
(async()=>{
  fs.mkdirSync(shotDir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});let count=0;
  try{
    for(const id of process.env.TOENOW_TUTORIAL_RESIZE_ONLY?[]:ids)for(const width of widths)for(const lang of languages){
      const context=await browser.newContext({viewport:{width,height},hasTouch:width<900});await setup(context,id);
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await ready(page,id,lang);const before=await storage(page);
      await page.locator('#'+startId(id)).click();await page.locator('#toenow-tutorial').waitFor({state:'visible'});
      assert.equal(await page.locator('.tutorial-choice').count(),0,id+' duplicate game demo');
      assert.equal(await page.locator('#'+titleId(id)).isVisible(),false,id+' tutorial must use actual play scene');
      await page.waitForTimeout(250);await assertProtected(page);
      await page.screenshot({path:`${shotDir}/${id}-${width}-${lang}.png`});
      const taps=await complete(page,id,width===390);
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),'completed');
      assert.deepEqual(await storage(page),before,id+' tutorial changed original records/save');
      const scoreBefore=await page.locator('#tutorial-instruction').innerText();
      await page.waitForTimeout(300);assert.equal(await page.locator('#tutorial-instruction').innerText(),scoreBefore);
      await page.locator('[data-tutorial-finish]').click();await page.waitForTimeout(100);
      if(id==='flash-brain'){await page.locator('[data-tutorial-finish]').waitFor({state:'visible'});await page.locator('[data-tutorial-finish]').click();}
      assert.equal(await page.locator('#toenow-tutorial').count(),0);
      assert.equal(await page.locator('#toenow-tutorial-game').count(),0,'closing restores original game roots');
      await ready(page,id,lang);await page.locator('#'+startId(id)).click();await page.waitForTimeout(100);
      if(id==='flash-brain'){await page.locator('[data-tutorial-finish]').waitFor({state:'visible'});await page.locator('[data-tutorial-finish]').click();}
      assert.equal(await page.locator('#toenow-tutorial').count(),0,id+' returning player repeated tutorial');
      await ready(page,id,lang);await page.locator('[data-tutorial-replay]').click();await page.locator('#toenow-tutorial').waitFor({state:'visible'});
      await page.keyboard.press('Escape');await page.locator('#'+startId(id)).waitFor({state:'visible'});
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),'completed');
      assert.deepEqual(errors,[],id+' runtime errors');count++;
      console.log(`PASS ${id} ${width} ${lang}: ${taps} real game taps, score0, records protected, normal start, replay/cancel`);await closeContext(context);
    }
    if(process.env.TOENOW_TUTORIAL_LAYOUT_ONLY){console.log(JSON.stringify({realGameLessons:count,height}));return;}
    for(const id of ids){
      const context=await browser.newContext({viewport:{width:390,height:850}}),page=await context.newPage();
      await ready(page,id);await page.locator('[data-tutorial-replay]').click();
      for(const viewport of [{width:667,height:375},{width:568,height:320},{width:844,height:390},{width:390,height:850}]){
        await page.setViewportSize(viewport);await page.waitForTimeout(200);await assertLayout(page);
        const sizes=await page.evaluate(()=>({engine:ToenowTutorials.getViewport(),region:{width:document.getElementById('toenow-tutorial-game').clientWidth,height:document.getElementById('toenow-tutorial-game').clientHeight}}));
        assert.deepEqual(sizes.engine,sizes.region,id+' engine viewport did not resize');
      }
      await page.keyboard.press('Escape');assert.equal(await page.locator('#toenow-tutorial-game').count(),0);
      assert.deepEqual(await page.evaluate(()=>ToenowTutorials.getViewport()),{width:390,height:850});
      await closeContext(context);console.log('PASS '+id+': live portrait/landscape resize and original viewport restored');
    }
    if(process.env.TOENOW_TUTORIAL_RESIZE_ONLY)return;
    for(const id of ids){
      const context=await browser.newContext({viewport:{width:390,height:850}});await setup(context,id);const page=await context.newPage();await ready(page,id);
      await page.locator('#'+startId(id)).click();await page.locator('#toenow-tutorial').waitFor({state:'visible'});await page.locator('[data-tutorial-cancel]').click();
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),null);
      await page.locator('#'+startId(id)).click();await page.locator('[data-tutorial-skip]').click();
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),'skipped');
      await page.waitForTimeout(100);assert.equal(await page.locator('#'+titleId(id)).isVisible(),false);
      await closeContext(context);console.log('PASS '+id+': incomplete cancel, explicit skip, normal game');
    }
    for(const id of ids){
      const context=await browser.newContext({viewport:{width:430,height:850}}),page=await context.newPage();
      await page.goto(base+'/');await page.setContent(`<iframe src="${base}/games/${id}/" style="width:100%;height:800px;border:0"></iframe>`);
      const frame=page.frameLocator('iframe');await frame.locator('#'+startId(id)).click();await frame.locator('#toenow-tutorial').waitFor({state:'visible'});
      await frame.locator('[data-tutorial-skip]').click();await page.waitForTimeout(100);assert.equal(await frame.locator('#'+titleId(id)).isVisible(),false);
      await closeContext(context);console.log('PASS '+id+': iframe actual game tutorial');
    }
    {
      const context=await browser.newContext(),page=await context.newPage();await ready(page,'number-pop');
      await page.locator('#btn-start').focus();await page.keyboard.press('Enter');await page.locator('#toenow-tutorial').waitFor({state:'visible'});
      // Games no longer render a language-switch button. Exercise the same
      // language event used by the Hub without depending on a removed control.
      await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));assert.match(await page.locator('#tutorial-instruction').innerText(),/[\u4e00-\u9fff]/);
      await page.keyboard.press('r');assert.equal(await page.evaluate(()=>ToenowTutorials.isActive('number-pop')),true);
      await page.keyboard.press('Escape');assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey('number-pop')),null);
      for(const key of ['Enter','Space']){await page.locator('[data-tutorial-replay]').focus();await page.keyboard.press(key);await page.locator('#toenow-tutorial').waitFor({state:'visible'});await page.keyboard.press('Escape');}
      await closeContext(context);console.log('PASS keyboard, language switching and protected restart shortcut');
    }
    {
      const context=await browser.newContext(),page=await context.newPage();await setup(context,'animal-rescue-train');await ready(page,'animal-rescue-train');
      const before=await storage(page);await page.locator('[data-tutorial-replay]').click();
      for(let i=0;i<6;i++){
        await page.evaluate(()=>{const r=ToenowTutorials.getState().guide.rect;document.elementFromPoint(r.x+r.width/2,r.y+r.height/2).closest('button').focus();});
        await page.keyboard.press(i%2?'Space':'Enter');
      }
      assert.equal(await page.evaluate(()=>ToenowTutorials.getState().complete),true,'actual train buttons must support keyboard');
      assert.deepEqual(await storage(page),before);await assertProtected(page);await closeContext(context);console.log('PASS train real queue/carriage buttons with Enter/Space');
    }
    {
      const context=await browser.newContext({viewport:{width:390,height:850}}),page=await context.newPage();await setup(context,'animal-rescue-train');await ready(page,'animal-rescue-train');
      await page.evaluate(k=>localStorage.setItem(k,'skipped'),tutorialKey('animal-rescue-train'));
      await page.locator('#btn-start-game').click();
      await page.locator('[data-queue]:not(:disabled)').first().click();await page.locator('[data-car]:not(:disabled)').first().click();
      await page.locator('#menu').click();
      await ready(page,'animal-rescue-train');
      const before=await storage(page),cars=await page.locator('#cars').innerHTML();
      assert.equal(await page.locator('#continue').isVisible(),true,'saved game fixture must be resumable');
      await page.locator('[data-tutorial-replay]').click();await complete(page,'animal-rescue-train');await page.locator('[data-tutorial-finish]').click();
      await page.locator('#btn-start-game').waitFor({state:'visible'});
      assert.deepEqual(await storage(page),before,'real saved train session/history overwritten');assert.equal(await page.locator('#cars').innerHTML(),cars,'original train state not restored');
      assert.equal(await page.locator('#continue').isVisible(),true);await closeContext(context);console.log('PASS existing train save, puzzle history and original carriage state survive tutorial');
    }
    console.log(JSON.stringify({realGameLessons:count,skipScenarios:ids.length,iframeScenarios:ids.length,keyboard:1}));
  }finally{let timer;await Promise.race([browser.close(),new Promise(r=>timer=setTimeout(r,5000))]);clearTimeout(timer);}
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
