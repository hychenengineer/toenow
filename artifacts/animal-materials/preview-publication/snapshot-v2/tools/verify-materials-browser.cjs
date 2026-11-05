const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const materials=require('../shared/toenow-materials.js');
const catalog=require('../shared/toenow-screen-config.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const output=path.resolve(__dirname,'../artifacts/animal-materials');
const values={};const journey=require('../shared/toenow-exploration.js').create({storage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},levels:require('../shared/toenow-levels.js'),gameIds:Object.keys(materials.ITEMS)});
journey.chooseGuest();for(const id of journey.snapshot().order)journey.complete({gameId:id,wave:6});journey.dismissDiscovery();journey.dismissLeaderboardNotice();
(async()=>{fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[],errors=[];try{
 const context=await browser.newContext();await context.route('https://**',r=>r.abort());await context.addInitScript(state=>{localStorage.setItem('toenow_exploration_v3',JSON.stringify(state));for(const id of ['number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain','animal-rescue-train'])localStorage.setItem('toenow_tutorial_'+id+'_v2','completed');},journey.snapshot());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[data-island-game="number-pop"]').click();
 await page.locator('.island-build-panel').waitFor({timeout:5000});
 assert.equal(await page.locator('[data-build-upgrade]').isDisabled(),true);
 await page.evaluate(()=>{let now=1000;const api=ToenowMaterials.create({storage:localStorage,now:()=>now});for(const id of Object.keys(ToenowMaterials.ITEMS)){for(let i=0;i<8;i++){const run=api.beginRun(id,{wave:1});now+=30000;api.finishRun(run,{score:10,wave:1});}}window.dispatchEvent(new Event('focus'));});
 await page.locator('[data-build-upgrade]').click();await page.waitForFunction(()=>document.querySelector('.island-location[data-island-game="number-pop"]').dataset.stage==='2');
 await page.locator('[data-build-craft="welcome"]').click();await page.locator('[data-build-toggle="welcome"]').waitFor();await page.locator('[data-build-craft="together"]').click();await page.locator('[data-build-toggle="together"]').waitFor();assert.equal(await page.locator('.island-detail-art [data-home-decoration]').count(),2);
 await page.locator('[data-build-toggle="welcome"]').click();await page.waitForFunction(()=>document.querySelectorAll('.island-detail-art [data-home-decoration]').length===1);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});for(const lang of ['en','zh-Hant']){await page.evaluate(l=>ToenowI18n.setLanguage(l),lang);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert(await page.locator('.island-build-panel').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:path.join(output,`home-${width}-${lang}.png`)});checks.push(`home ${width} ${lang} PASS`);}}
 await page.keyboard.press('Escape');await page.reload();await page.locator('[data-island-game="number-pop"]').click();assert.equal(await page.locator('.island-detail-art [data-home-decoration]').count(),1);checks.push('reload persistence PASS');
 for(const id of Object.keys(materials.ITEMS)){
  await page.goto(`${base}/games/${id}/index.html`);await page.waitForFunction(()=>typeof ToenowGameSDK==='function');
  const result=await page.evaluate(async id=>{
   let now=1000;const previous=Date.now;Date.now=()=>now;
   try{const before=ToenowMaterials.create({storage:localStorage}).snapshot().balances[id];const sdk=new ToenowGameSDK({gameId:id});sdk.startRun({wave:1});now+=30000;const reward=sdk.reportGameOver({score:10,wave:1,isPractice:false});const duplicate=await sdk.finishMaterials({score:10,wave:1});await new Promise(requestAnimationFrame);return {before,duplicate:duplicate.amount,balance:ToenowMaterials.create({storage:localStorage}).snapshot().balances[id],reward};}finally{Date.now=previous;}
  },id);
  assert.equal(result.duplicate,0);assert.equal(result.balance,result.before+4);checks.push(`${id} standalone SDK receipt PASS`);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
