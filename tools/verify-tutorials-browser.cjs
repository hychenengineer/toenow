const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../shared/toenow-tutorial-config.js');
const screens=require('../shared/toenow-screen-config.js');
const keys=require('../shared/toenow-levels.js').GAME_STORAGE_KEYS;
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8766';
const ids=Object.keys(catalog).filter(id=>!process.env.TOENOW_TEST_GAMES||process.env.TOENOW_TEST_GAMES.split(',').includes(id));
const startId=id=>screens[id]?.startId||'btn-start-game';
const titleId=id=>screens[id]?.titleId||'menu-screen';
const tutorialKey=id=>'toenow_tutorial_'+id+'_v1';
const shotDir='artifacts/tutorials';
async function closeContext(context){
  // Windows Edge sometimes closes the context but leaves its acknowledgement pending.
  let timer;
  await Promise.race([context.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);
  clearTimeout(timer);
}
async function tap(page,selector,mobile=false){
  const node=page.locator(selector);await node.waitFor({state:'visible'});
  if(mobile){const b=await node.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}else await node.click();
}
async function complete(page,id,mobile=false){
  for(const step of catalog[id].steps){
    if(step.kind==='otter-follow'){
      await page.waitForFunction(()=>{const n=document.querySelector('[data-tutorial-action="leaf2"]');return n&&!n.disabled;});continue;
    }
    for(const answer of step.answers)await tap(page,`#toenow-tutorial [data-tutorial-action="${answer}"]`,mobile);
  }
  await page.locator('[data-tutorial-finish]').waitFor({state:'visible'});
}
async function ready(page,id,lang='en'){
  await page.goto(base+'/games/'+id+'/');
  await page.locator('#'+startId(id)).waitFor({state:'visible'});
  await page.evaluate(lang=>{
    ToenowI18n.setLanguage(lang);
    window.__tutorialRuns=0;
    const proto=window.ToenowGameSDK?.prototype;
    if(proto?.startRun){const original=proto.startRun;proto.startRun=function(...args){window.__tutorialRuns++;return original.apply(this,args);};}
  },lang);
}
async function state(page){return page.evaluate(()=>({body:document.body.dataset.state,runs:__tutorialRuns,records:Object.fromEntries(Object.keys(localStorage).filter(k=>/best|high|save|session|progress/.test(k)&&!k.startsWith('toenow_tutorial_')).map(k=>[k,localStorage.getItem(k)]))}));}
(async()=>{
  fs.mkdirSync(shotDir,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});let count=0;
  try{
    for(const id of ids)for(const width of [390,1100])for(const lang of ['en','zh-Hant']){
      const context=await browser.newContext({viewport:{width,height:850},hasTouch:width===390});
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await ready(page,id,lang);const before=await state(page);
      await tap(page,'#'+startId(id),width===390);
      await page.locator('#toenow-tutorial').waitFor({state:'visible'});
      assert.equal(await page.locator('#toenow-tutorial').evaluate(n=>n.matches(':modal')),true);
      assert.ok((await page.locator('#tutorial-instruction').innerText()).includes(lang==='en'?catalog[id].steps[0].prompt:ToenowExpectedChinese(id)));
      await page.waitForTimeout(200);assert.deepEqual(await state(page),before,id+' teaching started the game or changed records');
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),null);
      await page.screenshot({path:`${shotDir}/${id}-${width}-${lang}.png`});
      const bounds=await page.locator('#toenow-tutorial').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y>=0&&bounds.y+bounds.height<=850);
      await complete(page,id,width===390);
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),'completed');
      assert.deepEqual(await state(page),before,id+' practice example changed game data');
      await tap(page,'[data-tutorial-finish]',width===390);
      assert.equal(await page.locator('#toenow-tutorial').count(),0);
      await ready(page,id,lang);
      await tap(page,'#'+startId(id));await page.waitForTimeout(150);
      assert.equal(await page.locator('#toenow-tutorial').count(),0,id+' returning player saw automatic tutorial');
      await ready(page,id,lang);
      await tap(page,'[data-tutorial-replay]');await page.locator('#toenow-tutorial').waitFor({state:'visible'});
      await page.keyboard.press('Escape');assert.equal(await page.locator('#toenow-tutorial').count(),0);
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),'completed');
      assert.deepEqual(errors,[],id+' runtime errors');
      count++;console.log(`PASS ${id} ${width} ${lang}: first/returning/replay, real actions, frozen engine, records, layout`);
      await closeContext(context);
    }
    // Each game has independent skip/cancel state. Skip resumes the exact Start action.
    for(const id of ids){
      const context=await browser.newContext();const page=await context.newPage();await ready(page,id);
      await tap(page,'#'+startId(id));await page.locator('#toenow-tutorial').waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),null);
      await tap(page,'#'+startId(id));await tap(page,'[data-tutorial-skip]');
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),tutorialKey(id)),'skipped');
      assert.equal(await page.locator('#toenow-tutorial').count(),0);
      assert.equal(await page.locator('#'+titleId(id)).isVisible(),false,id+' skip did not start the game');
      await closeContext(context);console.log('PASS '+id+': cancel remains new, explicit skip persists and starts');
    }
    for(const id of ids){
      const context=await browser.newContext({viewport:{width:390,height:850}});const page=await context.newPage();
      await page.goto(base+'/');
      await page.setContent(`<iframe src="${base}/games/${id}/" style="width:100%;height:780px;border:0"></iframe>`);
      const frame=page.frameLocator('iframe');await frame.locator('#'+startId(id)).click();
      await frame.locator('#toenow-tutorial').waitFor({state:'visible'});
      await frame.locator('[data-tutorial-skip]').click();
      assert.equal(await frame.locator('#'+titleId(id)).isVisible(),false,id+' iframe skip did not start');
      await closeContext(context);console.log('PASS '+id+': iframe first play and skip');
    }
    // Keyboard, language switching mid-lesson, and inaccessible storage.
    {
      const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await ready(page,'number-pop');await page.locator('#'+startId('number-pop')).focus();await page.keyboard.press('Enter');
      await page.locator('#toenow-tutorial').waitFor({state:'visible'});
      await page.locator('[data-tutorial-action="one"]').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('[data-tutorial-action="one"]').isDisabled(),true);
      await page.locator('#toenow-tutorial .toenow-language-switch').click();
      assert.ok((await page.locator('#tutorial-instruction').innerText()).includes('從最小'));
      assert.equal(await page.locator('[data-tutorial-action="one"]').isDisabled(),true);
      await page.locator('[data-tutorial-action="two"]').focus();await page.keyboard.press('Space');
      await page.locator('[data-tutorial-action="three"]').focus();await page.keyboard.press('Enter');
      await page.locator('[data-tutorial-finish]').waitFor({state:'visible'});
      assert.equal(await page.locator('#toenow-tutorial .toenow-language-switch').count(),1);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('body > .toenow-language-switch').count(),1);
      for(const key of ['Enter','Space']){
        await page.locator('[data-tutorial-replay]').focus();await page.keyboard.press(key);
        await page.locator('#toenow-tutorial').waitFor({state:'visible'});
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#'+titleId('number-pop')).isVisible(),true);
      }
      await ready(page,'number-pop');
      await page.evaluate(k=>localStorage.removeItem(k),tutorialKey('number-pop'));
      await page.locator('#'+startId('number-pop')).focus();await page.keyboard.press('Space');
      await page.locator('#toenow-tutorial').waitFor({state:'visible'});await page.keyboard.press('Escape');
      assert.deepEqual(errors,[]);await closeContext(context);console.log('PASS keyboard, mid-lesson language switch and shared switch restoration');
    }
    {
      const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await ready(page,'block-match');
      await page.evaluate(()=>{window.__originalGet=Storage.prototype.getItem;window.__originalSet=Storage.prototype.setItem;Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw Error('blocked');};});
      await tap(page,'#btn-start');await complete(page,'block-match');
      await page.keyboard.press('Escape');
      await page.evaluate(()=>{Storage.prototype.getItem=window.__originalGet;Storage.prototype.setItem=window.__originalSet;});
      await tap(page,'#btn-start');assert.equal(await page.locator('#toenow-tutorial').count(),0);
      assert.deepEqual(errors,[]);await closeContext(context);console.log('PASS blocked storage: completion stays in memory and play is available');
    }
    console.log(JSON.stringify({lessonScenarios:count,skipScenarios:ids.length,iframeScenarios:ids.length,edgeCases:2}));
  }finally{let timer;await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);}
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});
function ToenowExpectedChinese(id){return {'number-pop':'從最小','ball-track':'記住水獺','block-match':'點掉多餘','add-up':'加起來','space-scale':'較低','tap-match':'相同形狀','spot-quick':'模糊圖片','shadow-match':'形狀組合','flash-brain':'黃色 1','animal-rescue-train':'先點隊伍'}[id];}
