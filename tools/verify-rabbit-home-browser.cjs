const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const output=path.resolve(__dirname,'../artifacts/rabbit-home');
const values={};
const journey=require('../shared/toenow-exploration.js').create({storage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},levels:require('../shared/toenow-levels.js'),gameIds:Object.keys(require('../shared/toenow-materials.js').ITEMS)});
journey.chooseGuest();for(const id of journey.snapshot().order)journey.complete({gameId:id,wave:6});journey.dismissDiscovery();journey.dismissLeaderboardNotice();
(async()=>{fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[],errors=[];try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const origin=new URL(base).origin;
 await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await context.addInitScript(state=>{if(!localStorage.getItem('toenow_exploration_v3'))localStorage.setItem('toenow_exploration_v3',JSON.stringify(state));localStorage.setItem('toenow_tutorial_number-pop_v2','completed');},journey.snapshot());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.goto(base);await page.locator('[data-island-game="number-pop"]').click();await page.locator('.rabbit-yard').waitFor();
 await page.locator('.rabbit-home img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 assert.equal(await page.locator('[data-rabbit-built]').count(),0);assert.equal(await page.locator('[data-rabbit-preview]').count(),6);
 const dialogue=await page.locator('.rabbit-dialogue p').innerText();await page.locator('.rabbit-home-actions [data-rabbit-action="chat"]').click();assert.notEqual(await page.locator('.rabbit-dialogue p').innerText(),dialogue);
 await page.screenshot({path:path.join(output,'starter-desktop.png'),animations:'disabled'});
 await page.locator('[data-rabbit-project="vegetable-patch"]').click();assert(await page.locator('[data-rabbit-confirm]').isDisabled());
 assert.equal(await page.locator('[data-rabbit-preview]').count(),6);
 await page.locator('[data-rabbit-project="greenhouse"]').click();assert(await page.locator('[data-rabbit-project="greenhouse"]').evaluate(n=>n===document.activeElement));
 await page.locator('[data-rabbit-project="vegetable-patch"]').click();checks.push('Starter garden, contextual chat, keyboard picker and no-spend build preview PASS');
 // Test fixture earns materials through the ledger with a controlled clock; not a claim of real play.
 await page.evaluate(()=>{let now=1000;const api=ToenowMaterials.create({storage:localStorage,now:()=>now});for(const id of Object.keys(ToenowMaterials.ITEMS))for(let i=0;i<60;i++){const r=api.beginRun(id,{wave:1});for(let n=0;n<20;n++)api.recordSuccess(r);now+=30000;api.finishRun(r,{score:10,wave:1});}window.dispatchEvent(new Event('focus'));});
 for(const id of ['vegetable-patch','greenhouse','harvest-stall','pergola']){
  await page.locator(`[data-rabbit-project="${id}"]`).click();
  await page.locator(`[data-rabbit-confirm="${id}"]`).click();await page.locator(`[data-rabbit-built="${id}"]`).waitFor();
 }
 assert.equal(await page.locator('[data-rabbit-built]').count(),4);checks.push('All four sequential builds create real scene objects PASS');
 await page.locator('[data-rabbit-decor="welcome"]').click();
 for(const id of ['welcome','together']){await page.locator(`[data-rabbit-decor="${id}"]`).click();await page.locator(`[data-rabbit-craft="${id}"]`).click();await page.locator(`[data-rabbit-decoration="${id}"]`).waitFor();}
 await page.locator('[data-rabbit-decor="welcome"]').click();await page.locator('[data-rabbit-toggle="welcome"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-rabbit-decoration]').length===1);assert.equal(await page.locator('[data-rabbit-decoration]').count(),1);
 await page.reload();await page.locator('[data-island-game="number-pop"]').click();assert.equal(await page.locator('[data-rabbit-built]').count(),4);assert.equal(await page.locator('[data-rabbit-decoration]').count(),1);checks.push('Decoration craft/place/put-away and save reload PASS');
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  await page.setViewportSize(size);for(const lang of ['en','zh-Hant']){
   await page.evaluate(l=>ToenowI18n.setLanguage(l),lang);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert(await page.locator('.rabbit-home').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
   await page.screenshot({path:path.join(output,`built-${size.width}-${lang}.png`),animations:'disabled'});
   await page.locator('[data-rabbit-decor="welcome"]').click();
   assert(await page.locator('.rabbit-workbench').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
   await page.screenshot({path:path.join(output,`decorate-${size.width}-${lang}.png`),animations:'disabled'});
   await page.locator('[data-rabbit-action="visit"]').click();checks.push(`${size.width}x${size.height} ${lang} visit/decorate PASS`);
  }
 }
 await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.dataset.islandGame==='number-pop');assert.equal(await page.evaluate(()=>document.activeElement.dataset.islandGame),'number-pop');
 await page.setViewportSize({width:1100,height:900});await page.locator('[data-island-game="number-pop"]').click();await page.locator('.rabbit-home-actions [data-rabbit-action="play"]').click();await page.frameLocator('#gameViewer').locator('#btn-start').waitFor();checks.push('Keyboard close/focus and real Number Pop iframe launch PASS');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
