const {restartAnimalGame,startAnimalGame}=require('./lib/animal-journey-driver.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
async function run(){
  const dir=path.resolve(__dirname,'../artifacts/animal-grounded');fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{for(const [width,lang,reduced] of [[1280,'zh-Hant',false],[390,'en',false],[320,'zh-Hant',true]]){
    const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:reduced?'reduce':'no-preference'}),errors=[];
    p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
    const source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace(/\}\)\(\);\s*$/,'window.__groundSnapshot=()=>structuredClone(state);})();');
    await p.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:source}));
    await p.goto(base+'/games/animal-siege/?mode=battle');await startAnimalGame(p);
    const snapshot=()=>p.evaluate(()=>window.__groundSnapshot());
    assert.equal(await p.locator('#board').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
    assert.equal(await p.locator('#board').evaluate(e=>getComputedStyle(e).boxShadow),'none');
    assert.equal(await p.locator('.tile.has-unit').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
    assert.equal(await p.locator('.tile.has-unit img').first().evaluate(e=>getComputedStyle(e).position),'absolute');
    await p.evaluate(async()=>{const i=new Image();i.src='../../assets/animal-siege/acorn-battle-v1.webp';await i.decode();await new Promise(requestAnimationFrame);});
    await p.screenshot({path:path.join(dir,width+'-'+lang+'-terrain.png'),fullPage:true});
    const before=await snapshot();await p.locator('[data-cell="2,1"]').click();assert.deepEqual(await snapshot(),before);
    await p.locator('#confirm-move').click();
    if(!reduced){
      await p.locator('.combat-walker').waitFor({state:'attached'});
      assert.ok(await p.locator('.combat-walker').evaluate(e=>e.getAnimations().length)>0);
      await p.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await p.waitForTimeout(450);await p.locator('#resume').click();
    }
    await p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');
    assert.equal(await p.locator('.combat-walker').count(),0);
    const moved=(await snapshot()).units.find(u=>u.id==='p-beaver');assert.deepEqual([moved.x,moved.y,moved.moved],[2,1,true]);
    await p.locator('#end-turn').click();
    if(!reduced){await p.locator('.combat-walker[data-team="enemy"]').first().waitFor({state:'attached'});await p.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await p.waitForTimeout(450);await p.locator('#resume').click();}
    await p.waitForFunction(()=>window.__groundSnapshot().phase==='player'&&document.getElementById('board').getAttribute('aria-busy')!=='true');
    assert.equal((await snapshot()).round,2);assert.equal(await p.locator('.combat-walker').count(),0);
    await restartAnimalGame(p);
    await p.locator('[data-cell="2,1"]').click();await p.locator('#confirm-move').click();
    await restartAnimalGame(p);await p.waitForTimeout(450);
    assert.equal((await snapshot()).round,1);assert.equal((await snapshot()).units.find(u=>u.id==='p-beaver').x,1);
    assert.equal(await p.locator('.combat-walker').count(),0);assert.deepEqual(errors,[]);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    console.log('PASS '+width+' '+lang+' reduced='+reduced+': transparent terrain, grounded units, reversible draft, walking, pause/resume, enemy turn and restart');await p.close();
  }}finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
