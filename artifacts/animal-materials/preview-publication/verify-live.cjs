const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const dir=__dirname,publication=JSON.parse(fs.readFileSync(path.join(dir,'publication.json'))),prepared=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json')));
const base=publication.pagesUrl;
(async()=>{
 const files=['index.html','shared/toenow-materials.js','shared/toenow-materials-ui.js','shared/toenow-sdk.js','shared/toenow-island.js','assets/toenow-materials.css','games/number-pop/main.js','games/flash-brain/assets/index-cr-6j3L1.js','games/capybara-drift/index.html','assets/animal-island/capybara-level1.webp'];
 const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 const bytes=await Promise.all(files.map(async file=>{const res=await fetch(new URL(file,base),{cache:'no-store'});assert.equal(res.status,200,file);const live=Buffer.from(await res.arrayBuffer()),local=fs.readFileSync(path.join(prepared.snapshot,file));assert.equal(sha(live),sha(local),file+' published bytes match');return {file,sha256:sha(live)};}));
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1100,height:900}});
  await context.route('https://**',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  await context.addInitScript(()=>{localStorage.setItem('toenow_language','zh-Hant');localStorage.setItem('toenow_tutorial_number-pop_v2','completed');const actual=Date.now.bind(Date);window.__previewClock=0;Date.now=()=>actual()+window.__previewClock;});
  const main=fs.readFileSync(path.join(prepared.snapshot,'games/number-pop/main.js'),'utf8');const at=main.lastIndexOf('})();');assert(at>0);
  await context.route('**/games/number-pop/main.js',route=>route.fulfill({contentType:'application/javascript',body:main.slice(0,at)+'window.__previewFinish=()=>{game.score=10;game.wave=1;game.runDuration=30;triggerGameOver();};'+main.slice(at)}));
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.evaluate(()=>{ToenowI18n.setLanguage('zh-Hant');window.showIslandWelcome?.();});
  await page.locator('#welcomeGuestBtn').click();
  await page.locator('[data-island-game="number-pop"]').click();await page.locator('.island-build-panel').waitFor();assert.equal(await page.locator('[data-build-upgrade]').isDisabled(),true);
  await page.locator('.island-play-button').click();const iframe=page.frameLocator('#gameViewer');await iframe.locator('#btn-start').click();
  const frame=page.frames().find(f=>f.url().includes('/games/number-pop/'));await frame.waitForFunction(()=>!!ToenowGameSDK.getInstance('number-pop')?.materialRun);
  await frame.evaluate(()=>{window.__previewClock+=30000;window.__previewFinish();});await iframe.locator('.toenow-material-reward button').click();await page.locator('[data-build-craft="welcome"]:enabled').waitFor();
  await page.locator('[data-build-craft="welcome"]').click();await page.locator('[data-build-toggle="welcome"]').waitFor();assert.equal(await page.locator('.island-detail-art [data-home-decoration]').count(),1);
  await page.screenshot({path:path.join(dir,'live-home-desktop.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'live-home-mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.keyboard.press('Escape');await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-island-game="number-pop"]').click();await page.locator('[data-build-toggle="welcome"]').waitFor();
  assert.deepEqual(errors,[]);const result={url:base,commit:publication.sha,publishedFiles:bytes,checks:['Live Hub load','Standalone module paths under /toenow/','Real iframe start and state-driven end','Material receipt and return to home','Starter decoration purchase','Mobile layout','Save survives reload'],errors};
  fs.writeFileSync(path.join(dir,'live-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:'PASS',url:base,hashes:bytes.length,checks:result.checks.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
