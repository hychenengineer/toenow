const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const dir=path.resolve(__dirname,'../artifacts/animal-move-confirmation');
async function run(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const [width,lang,mode] of [[1280,'zh-Hant','battle'],[390,'zh-Hant','expedition'],[390,'en','battle']]){
      const p=await browser.newPage({viewport:{width,height:900},isMobile:width<700,hasTouch:width<700});const errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
      const source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace(/\}\)\(\);\s*$/,'window.__moveSnapshot=()=>structuredClone(state);})();');
      await p.route('**/games/animal-siege/main.js*',route=>route.fulfill({contentType:'application/javascript',body:source}));
      await p.goto(base+'/games/animal-siege/?mode='+mode);await p.locator('#btn-start').click();
      if(mode==='expedition'){await p.locator('.map-node[data-location="acorn"]').click();await p.locator('[data-attack="acorn"]').click();}
      const click=async selector=>width<700?p.locator(selector).tap():p.locator(selector).click();
      const snap=()=>p.evaluate(()=>window.__moveSnapshot());const original=await snap();
      await click('[data-cell="2,1"]');
      assert.equal(await p.locator('#confirm-move').count(),1,'movement must offer an explicit confirmation button');
      await p.locator('#move-confirmation').waitFor({state:'visible'});assert.deepEqual(await snap(),original,'preview must not spend movement or mutate the battle');
      assert.equal(await p.locator('#end-turn').isEnabled(),true);assert.equal(await p.locator('#defend').isDisabled(),true);
      assert.match(await p.locator('#end-turn').innerText(),/Move.*end|移動.*結束/);
      await click('[data-cell="3,1"]');assert.deepEqual(await snap(),original,'retargeting remains reversible');
      await click('#cancel-move');assert.deepEqual(await snap(),original);assert.equal(await p.locator('#move-confirmation').isVisible(),false);
      await click('[data-cell="2,1"]');await click('[data-cell="1,1"]');assert.equal(await p.locator('#move-confirmation').isVisible(),false,'clicking original position cancels');
      await click('[data-cell="2,1"]');await click('[data-unit="p-fox"]');assert.equal(await p.locator('#move-confirmation').isVisible(),false,'changing squads discards the old preview');
      await click('[data-unit="p-beaver"]');await click('[data-cell="2,1"]');await p.locator('#confirm-move').focus();await p.keyboard.press('Escape');assert.equal(await p.locator('#move-confirmation').isVisible(),false);assert.equal(await p.locator('#pause-layer').isVisible(),false);
      await click('[data-cell="2,1"]');await click('#menu');await click('#resume');assert.deepEqual(await snap(),original,'pausing cannot commit the preview');
      await p.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));assert.equal(await p.locator('#confirm-move').innerText(),'只移動');
      await p.evaluate(()=>ToenowI18n.setLanguage('en'));assert.equal(await p.locator('#confirm-move').innerText(),'Move only');await p.evaluate(l=>ToenowI18n.setLanguage(l),lang);
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-preview.png'),fullPage:true});
      await click('#confirm-move');const committed=await snap();const beaver=committed.units.find(u=>u.id==='p-beaver');
      assert.deepEqual([beaver.x,beaver.y,beaver.moved,beaver.acted],[2,1,true,false]);assert.equal(committed.round,1);assert.deepEqual(committed.units.filter(u=>u.team==='enemy'),original.units.filter(u=>u.team==='enemy'));
      assert.equal(await p.locator('#move-confirmation').isVisible(),false);
      await click('[data-cell="3,1"]');assert.deepEqual(await snap(),committed,'a confirmed move cannot move twice');
      await click('#end-turn');await p.waitForFunction(()=>window.__moveSnapshot().phase!=='enemy');assert.equal((await snap()).round,2);
      await click('[data-unit="p-beaver"]');const legal=p.locator('.tile.reachable').first();await legal.click();await p.locator('#move-confirmation').waitFor({state:'visible'});
      await click('#restart');
      if(mode==='expedition'){await p.locator('#expedition').waitFor({state:'visible'});await p.locator('.map-node[data-location="acorn"]').click();await p.locator('[data-attack="acorn"]').click();}
      assert.equal(await p.locator('#move-confirmation').isVisible(),false,'restart/retreat clears pending moves');assert.deepEqual(errors,[]);
      console.log('PASS '+width+' '+lang+' '+mode+': reversible preview, retarget/cancel/origin/squad/Escape, pause/language, explicit commit, one move, lifecycle reset');await p.close();
    }
  }finally{await browser.close();}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
