const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const dir=path.resolve(__dirname,'../artifacts/animal-siege-scene');
async function run(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const [width,lang,reduced] of [[1280,'zh-Hant',false],[390,'en',false],[320,'zh-Hant',true]]){
      const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:reduced?'reduce':'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
      let source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8');
      source=source.replace(/\}\)\(\);\s*$/,`window.__siegeSceneSnapshot=()=>structuredClone({state,run});window.__nearSiegeVictory=()=>{for(const u of state.units.filter(u=>u.team==='enemy'))u.hp=0;const fox=byId('e-fox');fox.hp=1;fox.x=2;fox.y=1;selected='p-beaver';render();};window.__repeatFinish=()=>finish();})();`);
      await p.route('**/games/animal-siege/main.js*',route=>route.fulfill({contentType:'application/javascript',body:source}));
      await p.goto(base+'/games/animal-siege/?mode=expedition');await p.locator('#btn-start').click();await p.locator('.map-node[data-location="acorn"]').click();await p.locator('[data-attack="acorn"]').click();
      assert.equal(await p.locator('.siege-flag').count(),1,'the fort has a live flag instead of a painted status');
      assert.equal(await p.locator('.wood-wall').count(),4);assert.equal(await p.locator('.tile.wall:disabled').count(),4);assert.equal(await p.locator('.tile.gate:not(:disabled)').count(),2);
      assert.match(await p.locator('.gate-lane').first().evaluate(el=>getComputedStyle(el).backgroundImage),/acorn-gate-side-v1.webp/);
      assert.match(await p.locator('.board-surround').evaluate(el=>getComputedStyle(el).backgroundImage),/acorn-battle-v1.webp/);
      await p.evaluate(async()=>{await Promise.all(['battle','gate'].map(async kind=>{const image=new Image();image.src='../../assets/animal-siege/acorn-'+kind+(kind==='gate'?'-side-v1.webp':'-v1.webp');await image.decode();}));await new Promise(requestAnimationFrame);});
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-battle.png'),fullPage:true});
      await p.evaluate(()=>window.__nearSiegeVictory());await p.locator('[data-cell="2,1"]').click();await p.locator('#confirm-attack').click();
      await p.locator('#siege-victory').waitFor({state:'visible'});assert.equal(await p.locator('.siege-flag').getAttribute('data-owner'),'player');
      assert.equal(await p.locator('#siege-victory').getAttribute('data-gold'),'140');assert.equal(await p.locator('#siege-victory').getAttribute('data-wood'),'40');
      await p.evaluate(()=>window.__repeatFinish());assert.equal(await p.locator('#siege-victory').isVisible(),true,'duplicate finish cannot skip the capture feedback');assert.equal((await p.evaluate(()=>window.__siegeSceneSnapshot())).run.gold,90);
      assert.equal(await p.locator('#gameover-screen').isVisible(),false,'fort celebration is in-battle feedback, not another result template');
      if(!reduced)assert.ok(await p.locator('.siege-flag .flag-cloth').evaluate(el=>el.getAnimations().length)>0);
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-capture.png'),fullPage:true});
      await p.locator('#expedition').waitFor({state:'visible'});const before=await p.evaluate(()=>window.__siegeSceneSnapshot());assert.equal(before.run.gold,230);assert.equal(before.run.wood,65);assert.equal(before.run.forts.acorn.captured,true);
      await p.evaluate(()=>window.__repeatFinish());assert.deepEqual(await p.evaluate(()=>window.__siegeSceneSnapshot()),before,'reward settles once');
      await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());
      await p.locator('.map-node[data-location="acorn"]').click();await p.locator('[data-attack="acorn"]').click();await p.evaluate(()=>window.__nearSiegeVictory());
      await p.locator('[data-cell="2,1"]').click();await p.locator('#confirm-attack').click();await p.locator('#siege-victory').waitFor({state:'visible'});
      await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());
      await p.locator('#expedition').waitFor({state:'visible'});await p.waitForTimeout(1400);assert.equal(await p.locator('#siege-victory').isVisible(),false);assert.equal(await p.locator('#exp-gold').innerText(),'90');assert.equal((await p.evaluate(()=>window.__siegeSceneSnapshot())).run.forts.acorn.captured,false,'old celebration cannot settle into restarted run');assert.deepEqual(errors,[]);
      console.log('PASS '+width+' '+lang+' reduced='+reduced+': illustrated fort, legal wood walls/gates, live capture flag, reward cue, one-time settlement and restart');await p.close();
    }
  }finally{await browser.close();}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
