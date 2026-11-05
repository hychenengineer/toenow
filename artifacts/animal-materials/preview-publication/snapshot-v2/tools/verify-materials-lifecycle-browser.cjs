// State-driving hooks only: production start controls, SDK, end renderer and saves run intact.
const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {ITEMS}=require('../shared/toenow-materials.js');const catalog=require('../shared/toenow-screen-config.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';const output=path.resolve(__dirname,'../artifacts/animal-materials');
const hooks={
 'number-pop':'game.score=10;game.wave=1;triggerGameOver();',
 'ball-track':'state.score=10;state.wave=1;state.frozenSnapshot={score:10,wave:1,best:10};showGameOverModal();',
 'block-match':'state.score=10;state.wave=1;triggerGameOver();',
 'add-up':'score=10;wave=1;triggerGameOver();',
 'space-scale':'score=10;wave=1;triggerGameOver();',
 'tap-match':"state.score=10;state.wave=1;endRun('TIME EXPIRED');",
 'spot-quick':"state.score=10;state.wave=1;triggerGameOver('TIME EXPIRED');",
 'shadow-match':'state.score=10;state.wave=1;triggerGameOver();',
 'animal-rescue-train':"scoreBefore=10;game.state.status='lost';reportResult();render();"
};
async function instrument(page,id){
 if(id==='flash-brain'){
  let source=fs.readFileSync(path.resolve(__dirname,'../games/flash-brain/assets/index-cr-6j3L1.js'),'utf8');const marker='},x=(e,t)=>{let n=p.current';assert(source.includes(marker));source=source.replace(marker,'};window.__finishMaterialGame=()=>{const e=p.current;e.score=10;e.waveState.config.wave=1;b()};let x=(e,t)=>{let n=p.current');
  await page.route('**/assets/index-cr-6j3L1.js',r=>r.fulfill({contentType:'application/javascript',body:source}));
 }else{const filename=id==='animal-rescue-train'?'game.js':'main.js';let source=fs.readFileSync(path.resolve(__dirname,'../games',id,filename),'utf8');const at=source.lastIndexOf('})();');assert(at>0,id);source=source.slice(0,at)+`window.__finishMaterialGame=()=>{${hooks[id]}};`+source.slice(at);await page.route(`**/games/${id}/${filename}`,r=>r.fulfill({contentType:'application/javascript',body:source}));}
}
(async()=>{fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[],errors=[];try{
 const context=await browser.newContext({viewport:{width:1100,height:900}});await context.route('https://**',r=>r.abort());
 await context.addInitScript(()=>{const realNow=Date.now.bind(Date);window.__materialOffset=0;Date.now=()=>realNow()+window.__materialOffset;for(const id of ['number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain','animal-rescue-train'])localStorage.setItem('toenow_tutorial_'+id+'_v2','completed');for(const lesson of ['thorns','priority'])localStorage.setItem('toenow_flash_lesson_'+lesson+'_v1','completed');});
 for(const id of Object.keys(ITEMS)){
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(`${id}: ${e.message}`));await instrument(page,id);await page.goto(`${base}/games/${id}/`);
  await page.locator('#'+(id==='animal-rescue-train'?'btn-start-game':catalog[id].startId)).click();
  await page.waitForFunction(id=>!!ToenowGameSDK.getInstance(id)?.materialRun,id);
  const before=await page.evaluate(id=>ToenowMaterials.create({storage:localStorage}).snapshot().balances[id],id);
  await page.evaluate(()=>{window.__materialOffset+=30000;window.__finishMaterialGame();});
  await page.waitForFunction(({id,before})=>ToenowMaterials.create({storage:localStorage}).snapshot().balances[id]===before+4,{id,before});
  await page.locator('.toenow-material-reward').waitFor();assert(await page.locator('.toenow-material-reward').isVisible(),id+' actual result receipt visible');
  await page.evaluate(()=>window.__finishMaterialGame());await page.waitForTimeout(60);assert.equal(await page.evaluate(id=>ToenowMaterials.create({storage:localStorage}).snapshot().balances[id],id),before+4);
  await page.screenshot({path:path.join(output,`result-${id}.png`)});
  if(id==='number-pop'){await page.setViewportSize({width:390,height:844});await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));assert((await page.locator('.toenow-material-reward').innerText()).includes('紅蘿蔔'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(output,'result-number-pop-390-zh-Hant.png')});}
  checks.push(`${id}: real start/end + visible receipt + duplicate guard PASS`);await page.close();
 }
 // Regression: initial React autostart must create a run; practice must not.
 for(const practice of [0,1]){const page=await context.newPage();await instrument(page,'flash-brain');await page.goto(`${base}/games/flash-brain/?autostart=1&practice=${practice}`);await page.waitForFunction(()=>document.body.dataset.state==='playing');if(!practice)await page.waitForFunction(()=>!!ToenowGameSDK.getInstance('flash-brain')?.materialRun);const before=await page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot().balances['flash-brain']);await page.evaluate(()=>{window.__materialOffset+=30000;window.__finishMaterialGame();});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot().balances['flash-brain']),before+(practice?0:4));checks.push(`Flash autostart practice=${practice} PASS`);await page.close();}
 // Real Hub iframe: receipt returns to the same home and newly earned material is usable.
 const interrupted=await context.newPage();await instrument(interrupted,'number-pop');await interrupted.goto(`${base}/games/number-pop/`);await interrupted.locator('#btn-start').click();await interrupted.waitForFunction(()=>!!ToenowGameSDK.getInstance('number-pop')?.materialRun);const beforeLeave=await interrupted.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot().balances['number-pop']);await interrupted.evaluate(()=>{window.__materialOffset+=30000;window.dispatchEvent(new PageTransitionEvent('pagehide'));window.__finishMaterialGame();});await interrupted.waitForTimeout(100);assert.equal(await interrupted.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot().balances['number-pop']),beforeLeave);await interrupted.close();checks.push('Interrupted run / partial score save does not award PASS');
 const page=await context.newPage();await instrument(page,'number-pop');await page.goto(base);await page.locator('#islandContinueGuest').count();
 await page.evaluate(()=>window.showIslandWelcome?.());const guest=page.locator('#welcomeGuestBtn');if(await guest.isVisible())await guest.click();
 await page.evaluate(()=>{document.querySelector('#islandWelcome')?.close();});
 await page.locator('[data-island-game="number-pop"]').click();await page.locator('.island-play-button').click();const frame=page.frameLocator('#gameViewer');await frame.locator('#'+catalog['number-pop'].startId).click();
 await frame.locator('body').evaluate(()=>{window.__materialOffset+=30000;window.__finishMaterialGame();});await frame.locator('.toenow-material-reward button').click();await page.locator('.island-build-panel').waitFor();checks.push('Hub iframe receipt → same home PASS');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'lifecycle-results.json'),JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
