const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path');
const materials=require('../shared/toenow-materials.js'),island=require('../shared/toenow-island.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765',out=process.env.TOENOW_MIXED_OUTPUT_DIR||path.resolve(__dirname,'../artifacts/mixed-materials');
const values={},journey=require('../shared/toenow-exploration.js').create({storage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},levels:require('../shared/toenow-levels.js'),gameIds:Object.keys(materials.ITEMS)});
journey.chooseGuest();for(const id of journey.snapshot().order)journey.complete({gameId:id,wave:6});journey.dismissDiscovery();journey.dismissLeaderboardNotice();
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];try{
 const context=await browser.newContext({viewport:{width:1100,height:900}});const origin=new URL(base).origin;
 await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await context.addInitScript(state=>{localStorage.setItem('toenow_exploration_v3',JSON.stringify(state));localStorage.setItem('toenow_tutorial_number-pop_v2','completed');},journey.snapshot());
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 const fixture=()=>({version:1,balances:Object.fromEntries(Object.keys(materials.ITEMS).map(id=>[id,100])),homes:Object.fromEntries(Object.keys(materials.ITEMS).map(id=>[id,{stage:2,owned:[],placed:[]}]))});
 for(const id of Object.keys(materials.ITEMS)){
  const state=fixture(),cost=materials.upgradeRecipe(id,3),missing=Object.keys(cost).at(-1);state.balances[missing]=0;
  await page.evaluate(s=>{localStorage.setItem('toenow_materials_v1',JSON.stringify(s));window.dispatchEvent(new Event('focus'));},state);
  await page.locator(`[data-island-game="${id}"]`).click();
  await page.locator('.rabbit-home-actions [data-rabbit-action="build"]').click();
  const price='.rabbit-project-price',confirm='[data-rabbit-confirm]';
  assert.equal(await page.locator(price+' [data-material-source]').count(),3);assert(await page.locator(confirm).isDisabled());
  await page.locator(price+` [data-material-source="${missing}"]`).click();assert.equal(await page.locator('#islandLocationTitle').innerText(),island.LOCATIONS.find(l=>l.gameId===missing).name);
  await page.keyboard.press('Escape');await page.locator(`[data-island-game="${id}"]`).click();await page.locator('.rabbit-home-actions [data-rabbit-action="build"]').click();
  state.balances[missing]=cost[missing];await page.evaluate(s=>{localStorage.setItem('toenow_materials_v1',JSON.stringify(s));window.dispatchEvent(new Event('focus'));},state);
  assert.equal(await page.locator(confirm).isDisabled(),false);await page.locator(confirm).click();await page.waitForFunction(id=>ToenowMaterials.create({storage:localStorage}).snapshot().homes[id].stage===3,id);
  const after=await page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot());for(const [source,n] of Object.entries(cost))assert.equal(after.balances[source],state.balances[source]-n);
  await page.locator('.rabbit-home-actions [data-rabbit-action="build"]').click();assert.equal(await page.locator(price+' [data-material-source]').count(),4);
  if(id==='number-pop'){await page.setViewportSize({width:390,height:844});await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));await page.screenshot({path:path.join(out,'rabbit-four-materials.png'),animations:'disabled'});await page.evaluate(()=>ToenowI18n.setLanguage('en'));await page.setViewportSize({width:1100,height:900});}
  await page.keyboard.press('Escape');checks.push(`${id}: missing source blocks spending, source travel, exact three-item deduction and four-item next recipe PASS`);
 }
 // Production start/end/result lifecycle with a test-only end hook and clock offset.
 await page.route('**/games/number-pop/main.js*',async r=>{const response=await r.fetch();let s=await response.text();const at=s.lastIndexOf('})();');assert(at>0);s=s.slice(0,at)+'window.__mixedFinish=()=>{game.score=10;game.wave=1;triggerGameOver();};'+s.slice(at);await r.fulfill({response,body:s});});
 await context.addInitScript(()=>{const old=Date.now;window.__mixedOffset=0;Date.now=()=>old()+window.__mixedOffset;});
 await page.goto(new URL('games/number-pop/',base).href);await page.evaluate(()=>{const state=ToenowMaterials.create({storage:localStorage}).snapshot();state.homes['number-pop'].stage=3;localStorage.setItem('toenow_materials_v1',JSON.stringify(state));});
 await page.locator('#btn-start').click();await page.waitForFunction(()=>!!ToenowGameSDK.getInstance('number-pop')?.materialRun);await page.evaluate(()=>{window.__mixedOffset=30000;window.__mixedFinish();});await page.locator('.toenow-material-reward').waitFor();
 for(const source of Object.keys(materials.upgradeRecipe('number-pop',4)))assert((await page.locator('.toenow-material-reward').innerText()).includes(materials.ITEMS[source].icon));checks.push('Actual result renderer shows all four next-stage ingredients PASS');
 for(const width of [390,320])for(const lang of ['en','zh-Hant']){await page.setViewportSize({width,height:844});await page.evaluate(l=>ToenowI18n.setLanguage(l),lang);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert(await page.locator('.toenow-material-reward').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:path.join(out,`result-${width}-${lang}.png`)});checks.push(`four-material result ${width} ${lang} PASS`);}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);}})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
