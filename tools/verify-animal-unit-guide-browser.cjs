const {restartAnimalGame,startAnimalGame}=require('./lib/animal-journey-driver.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../games/animal-siege/engine.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
async function run(){
  const dir=path.resolve(__dirname,'../artifacts/animal-unit-guide');fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{for(const [width,lang,mode] of [[1280,'zh-Hant','expedition'],[390,'en','battle'],[320,'zh-Hant','expedition']]){
    const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce'}),errors=[];
    p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
    const source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace(/\}\)\(\);\s*$/,'window.__guideState=()=>structuredClone({run,state,paused,plannedMove});window.__trainGuideBeaver=()=>{if(run)run.upgrades.beaver=true;else state.units.find(u=>u.id==="p-beaver").trained=true;labels();};})();');
    await p.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:source}));
    await p.goto(base+'/games/animal-siege/?mode='+mode);await startAnimalGame(p);
    assert.equal(await p.locator('.preparation-card').count(),0,'the attached preparation panel is removed');
    assert.equal(await p.locator('#unit-guide-open').isVisible(),true,'the handbook has a dedicated visible button');
    if(mode==='expedition')await p.screenshot({path:path.join(dir,width+'-'+lang+'-map.png'),fullPage:true});
    const before=await p.evaluate(()=>window.__guideState());await p.locator('#unit-guide-open').click();
    await p.locator('#unit-guide').waitFor({state:'visible'});assert.equal((await p.evaluate(()=>window.__guideState())).paused,true);
    assert.equal(await p.locator('#unit-guide').evaluate(e=>e.matches(':modal')),true);
    assert.ok(await p.locator('#unit-guide-content').evaluate(e=>e.scrollWidth<=e.clientWidth),'handbook content fits the viewport');
    assert.equal(await p.locator('.guide-unit').count(),3);assert.equal(await p.locator('.guide-counter-link').count(),3);
    for(const [kind,type] of Object.entries(E.TYPES)){
      for(const field of ['hp','attack','move','range'])assert.equal(await p.locator('[data-guide-kind="'+kind+'"] [data-stat="'+field+'"]').innerText(),String(type[field]));
      assert.equal(await p.locator('[data-guide-kind="'+kind+'"] [data-stat="defense"]').innerText(),'0%');
      assert.equal(await p.locator('[data-guide-counter="'+kind+'"]').getAttribute('data-counter-target'),type.counters);
    }
    assert.match(await p.locator('#unit-guide-content').innerText(),/45%/);assert.match(await p.locator('#unit-guide-content').innerText(),/20%/);assert.match(await p.locator('#unit-guide-content').innerText(),/1.8/);
    await p.locator('#unit-guide img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
    await p.screenshot({path:path.join(dir,width+'-'+lang+'-guide.png')});
    await p.keyboard.press('Escape');assert.equal(await p.locator('#unit-guide').isVisible(),false);assert.equal((await p.evaluate(()=>window.__guideState())).paused,false);
    assert.deepEqual((await p.evaluate(()=>window.__guideState())).state,before.state);assert.deepEqual((await p.evaluate(()=>window.__guideState())).run,before.run);
    assert.equal(await p.locator('#unit-guide-open').evaluate(e=>e===document.activeElement),true);
    await p.evaluate(()=>window.__trainGuideBeaver());await p.locator('#unit-guide-open').click();assert.equal(await p.locator('[data-guide-kind="beaver"] [data-stat="defense"]').innerText(),'20%');
    await p.evaluate(l=>ToenowI18n.setLanguage(l==='en'?'zh-Hant':'en'),lang);assert.match(await p.locator('#unit-guide-title').innerText(),/兵種圖鑑|Unit Handbook/);
    await p.locator('#unit-guide-close').click();
    if(mode==='expedition'){await p.locator('[data-location="acorn"]').click();await p.locator('[data-attack="acorn"]').click();}
    await p.locator('[data-cell="2,1"]').click();const draft=await p.evaluate(()=>window.__guideState());await p.locator('#unit-guide-open').click();await p.locator('#unit-guide-close').click();
    assert.deepEqual((await p.evaluate(()=>window.__guideState())).plannedMove,draft.plannedMove);
    await p.locator('#cancel-move').click();await p.locator('#end-turn').click();await p.locator('#unit-guide-open').click();
    const frozen=await p.evaluate(()=>window.__guideState());await p.waitForTimeout(850);assert.deepEqual(await p.evaluate(()=>window.__guideState()),frozen,'reading never advances an enemy turn');
    await p.locator('#unit-guide-close').click();await p.waitForFunction(()=>window.__guideState().state.phase==='player'&&document.getElementById('board').getAttribute('aria-busy')!=='true');
    await p.locator('#unit-guide-open').click();await restartAnimalGame(p);assert.equal(await p.locator('#unit-guide').isVisible(),false);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
    console.log('PASS '+width+' '+lang+' '+mode+': removed panel, full chain, real stats, upgrades, language, modal focus, draft and enemy pause, restart');await p.close();
  }
    const p=await browser.newPage({viewport:{width:390,height:950},reducedMotion:'reduce'});
    await p.setContent('<iframe title="Embedded Animal Siege" style="border:0;width:100%;height:880px" src="'+base+'/games/animal-siege/?mode=battle"></iframe>');
    const game=p.frameLocator('iframe');await startAnimalGame(game);await game.locator('#unit-guide-open').click();
    assert.equal(await game.locator('#unit-guide').evaluate(e=>e.matches(':modal')),true);assert.equal(await game.locator('.guide-unit').count(),3);
    await game.locator('#unit-guide-close').click();assert.equal(await game.locator('#unit-guide').isVisible(),false);
    console.log('PASS iframe: handbook opens modally and closes inside the embedded game');await p.close();
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
