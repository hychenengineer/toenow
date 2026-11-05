const {startAnimalGame,startAnimalPractice}=require('./lib/animal-journey-driver.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const plan=require('../tests/fixtures/animal-siege-plan.json');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const dir=path.resolve(__dirname,'../artifacts/animal-siege');
async function instrument(page){
  const file=path.resolve(__dirname,'../games/animal-siege/main.js');
  const js=fs.readFileSync(file,'utf8').replace(/\}\)\(\);\s*$/, 'window.__siegeSnapshot=()=>structuredClone(state);})();');
  assert.ok(js.includes('__siegeSnapshot'));
  await page.route('**/games/animal-siege/main.js*',route=>route.fulfill({contentType:'application/javascript',body:js}));
}
async function snapshot(page){return page.evaluate(()=>window.__siegeSnapshot());}
async function play(page){
  for(const [round,id,x,y,target] of plan){
    let s=await snapshot(page);
    while(s.round<round){await page.locator('#end-turn').click();await page.waitForFunction(()=>window.__siegeSnapshot()?.phase!=='enemy');s=await snapshot(page);}
    assert.equal(s.phase,'player');assert.equal(s.round,round);
    await page.locator('[data-unit="'+id+'"]').click();
    const u=s.units.find(u=>u.id===id);
    if(u.x!==x||u.y!==y){await page.locator('[data-cell="'+x+','+y+'"]').click();await page.locator('#confirm-move').click();await page.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');}
    if(target){const t=(await snapshot(page)).units.find(u=>u.id===target);const tile=page.locator('[data-cell="'+t.x+','+t.y+'"]');await tile.click();assert.match(await page.locator('#preview').innerText(),/damage|傷害/);await page.locator('#confirm-attack').click();await page.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');}
    else await page.locator('#defend').click();
  }
  await page.locator('#gameover-screen').waitFor({state:'visible'});
  const s=await snapshot(page);assert.equal(s.result,'victory');assert.equal(s.round,8);
  assert.match(await page.locator('#outcome').innerText(),/140/);
  assert.equal(await page.locator('[data-screen-field="combo"]').innerText(),'—');
}
async function run(){
  fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const [width,lang] of (process.env.TOENOW_SIEGE_HUB_ONLY?[]:[[1280,'zh-Hant'],[390,'zh-Hant'],[390,'en']])){
      const page=await browser.newPage({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(lang=>{localStorage.setItem('toenow_language_v1',lang);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);await instrument(page);await page.goto(base+'/games/animal-siege/?mode=battle');
      await startAnimalGame(page);await page.locator('#board img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
      assert.equal(await page.locator('#board img').count(),6);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:path.join(dir,width+'-'+lang+'-battle.png'),fullPage:true});
      // Real move/attack clicks complete the battle with the production AI and timers.
      await play(page);
      assert.equal(await page.evaluate(()=>localStorage.getItem('animal_siege_best_score_v1')),'370');
      await page.screenshot({path:path.join(dir,width+'-'+lang+'-victory.png'),fullPage:true});
      await startAnimalGame(page,'#btn-retry');assert.equal((await snapshot(page)).round,1);await page.locator('#gameover-screen').waitFor({state:'hidden'});
      // Pausing an enemy turn must stop its pending actions.
      await page.locator('#end-turn').click();await page.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());const before=await snapshot(page);await page.waitForTimeout(900);assert.deepEqual(await snapshot(page),before);
      await page.locator('#resume').click();await page.waitForFunction(()=>window.__siegeSnapshot()?.round===2);
      // A restart cancels old callbacks and restores the complete army.
      await page.locator('#end-turn').click();await page.locator('#restart').click();await page.waitForTimeout(2100);const fresh=await snapshot(page);assert.equal(fresh.round,1);assert.equal(fresh.units[0].hp,72);
      await page.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await page.locator('#title-button').click();await page.locator('#title-screen').waitFor({state:'visible'});
      await startAnimalPractice(page,1);
      await play(page);assert.equal(await page.evaluate(()=>localStorage.getItem('animal_siege_best_score_v1')),'370');
      await page.locator('#btn-title').click();await page.locator('#title-screen').waitFor({state:'visible'});assert.deepEqual(errors,[]);
      await page.close();console.log('PASS '+width+' '+lang+': legal 15 vs 19 victory, touch/click, restart, pause, practice, title');
    }
    // The actual Hub entry must open the game without extending the locked route.
    const p=await browser.newPage({viewport:{width:1280,height:950}});await p.addInitScript(()=>localStorage.setItem('animal_siege_hands_on_v2','completed'));await p.goto(base+'/');
    await p.locator('#welcomeGuestBtn').click();
    await p.locator('[data-island-select="expedition"]').click();await p.locator('#open-animal-siege').click();const frame=p.frameLocator('#gameViewer');await startAnimalGame(frame);await frame.locator('[data-location="acorn"]').click();await frame.locator('[data-attack="acorn"]').click();await frame.locator('#board').waitFor({state:'visible'});assert.equal(await frame.locator('#board img').count(),6);
    await frame.locator('#back').click();await p.locator('#theaterModal[aria-hidden="true"]').waitFor({state:'attached'});assert.equal(await p.locator('#gameViewer').getAttribute('src'),'about:blank');await p.close();
    console.log('PASS Hub: independent Expedition entry, iframe start, exit to Hub');
  }finally{await browser.close();}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
