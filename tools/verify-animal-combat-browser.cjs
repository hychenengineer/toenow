const {startAnimalGame}=require('./lib/animal-journey-driver.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../games/animal-siege/engine.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const dir=path.resolve(__dirname,'../artifacts/animal-combat');
async function instrument(page){
  const hooks=`window.__combatSnapshot=()=>structuredClone(state);window.__seedCombat=()=>{resetFeedback();state=E.createBattle();run=null;plannedMove=null;paused=false;settled=false;selected='p-squirrel';targetId=null;state.walls=[];state.trees=[];for(const u of state.units){if(u.id==='p-beaver'){u.x=0;u.y=1;}if(u.id==='p-squirrel'){u.x=1;u.y=1;}if(u.id==='e-beaver'){u.x=4;u.y=1;u.hp=13;}if(u.id==='e-fox'){u.x=5;u.y=3;}if(u.id==='e-squirrel'){u.x=7;u.y=5;}}render();};`;
  let source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace(/\}\)\(\);\s*$/,hooks+'})();');
  await page.route('**/games/animal-siege/main.js*',route=>route.fulfill({contentType:'application/javascript',body:source}));
}
async function run(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const [width,lang,reduced] of [[1280,'zh-Hant',false],[390,'en',false],[390,'zh-Hant',true]]){
      const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:reduced?'reduce':'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);await instrument(p);await p.goto(base+'/games/animal-siege/?mode=battle');await startAnimalGame(p);
      async function rangeMatches(){const s=await p.evaluate(()=>window.__combatSnapshot());const selected=s.units.find(u=>u.id==='p-squirrel');const actual=await p.locator('.attack-range').evaluateAll(nodes=>nodes.map(n=>n.dataset.cell).sort());const expected=E.attackRange(s,selected).map(p=>p.x+','+p.y).sort();assert.deepEqual(actual,expected);}
      await p.locator('[data-unit="p-squirrel"]').click();await rangeMatches();
      const before=await p.evaluate(()=>window.__combatSnapshot());await p.locator('.tile.reachable').first().click();
      assert.ok(await p.locator('.attack-range.range-preview').count()>0);assert.deepEqual(await p.evaluate(()=>window.__combatSnapshot()),before,'range preview never commits a move');await p.locator('#cancel-move').click();await rangeMatches();
      await p.evaluate(()=>window.__seedCombat());await rangeMatches();
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-'+reduced+'-range.png'),fullPage:true});
      await p.locator('[data-cell="4,1"]').click();assert.match(await p.locator('#preview').innerText(),/13/);assert.match(await p.locator('#preview').innerText(),/2/);await p.locator('#confirm-attack').click();
      const floating=p.locator('.combat-float');await floating.waitFor({state:'visible'});assert.equal(await floating.getAttribute('data-damage'),'13');assert.equal(await floating.getAttribute('data-loss'),'2');assert.equal(await floating.getAttribute('data-team'),'player');
      assert.match(await p.locator('#combat-announcement').innerText(),/13/);
      if(!reduced){assert.equal(await p.locator('.combat-actor').count(),1);assert.equal(await p.locator('.combat-victim').count(),1);assert.equal(await p.locator('.combat-projectile').count(),1);assert.ok(await p.locator('.combat-victim').evaluate(el=>el.getAnimations().length)>0,'victim has a real shake animation');}
      else assert.equal(await p.locator('.combat-projectile').count(),0,'reduced motion preserves text without motion');
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-'+reduced+'-hit.png'),fullPage:true});
      await p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')==='false');
      assert.equal((await p.evaluate(()=>window.__combatSnapshot())).units.find(u=>u.id==='e-beaver').hp,0);
      // Defenders use the same feedback; cleanup cancels any effect when restarting.
      await p.locator('#end-turn').click();await p.locator('.combat-float[data-team="enemy"]').waitFor({state:'visible',timeout:8000});
      assert.ok(Number(await p.locator('.combat-float').getAttribute('data-damage'))>0);
      await p.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());const paused=await p.evaluate(()=>window.__combatSnapshot());await p.waitForTimeout(700);assert.deepEqual(await p.evaluate(()=>window.__combatSnapshot()),paused,'enemy feedback pause cannot advance another action');await p.locator('#resume').click();
      await p.locator('#restart').click();await p.waitForTimeout(1100);assert.equal(await p.locator('#combat-effects > *').count(),0);assert.equal((await p.evaluate(()=>window.__combatSnapshot())).round,1);assert.deepEqual(errors,[]);
      console.log('PASS '+width+' '+lang+' reduced='+reduced+': exact range/LOS, reversible range preview, attack motion, actual HP/troops lost, enemy feedback, restart cleanup');await p.close();
    }
  }finally{await browser.close();}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
