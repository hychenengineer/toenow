const { readSource } = require('./lib/game-source.cjs');
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {LOCATIONS} = require('../shared/toenow-island.js');
const fixtureValues = {};
const fixtureJourney = require('../shared/toenow-exploration.js').create({
  storage: { getItem:key=>fixtureValues[key]??null, setItem:(key,value)=>{fixtureValues[key]=String(value);} },
  levels: require('../shared/toenow-levels.js'), gameIds: LOCATIONS.map(l=>l.gameId)
});
fixtureJourney.chooseGuest();
for (const id of fixtureJourney.snapshot().order.slice(0,-1)) fixtureJourney.complete({gameId:id,wave:6});
fixtureJourney.dismissDiscovery();
const completeJourney = fixtureJourney.snapshot();
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = process.env.TOENOW_ISLAND_OUTPUT_DIR || path.resolve(__dirname,'../artifacts/island-explorer');
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[],checks=[];
 try{
  const context=await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('toenow_tutorial_number-pop_v2','completed'));
  // This matrix covers players who discovered every place, using the map UI.
  // Fresh-player locking and the welcome are exercised by verify-onboarding-browser.
  await context.addInitScript(state => localStorage.setItem('toenow_exploration_v3', JSON.stringify(state)), completeJourney);
  await context.route('https://**',route=>route.abort());
  const page=await context.newPage();
  page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(30000);
  page.on('pageerror',error=>errors.push(error.message));
  async function readyArt(selector='.island-map-markers img[data-island-art]') {
   await page.locator(selector).evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  }
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('.island-location').first().waitFor();
  await readyArt();
  assert.equal(await page.locator('.island-map-markers img[data-island-art]').count(),10,'all ten map landmarks use illustrated art');
  assert.equal(await page.locator('.island-location').count(),10);
  assert.equal(await page.locator('#hubListView').isVisible(),false);
  assert.equal(await page.locator('.island-counter').innerText(),'10 / 10 places open');
  const initial=await page.evaluate(()=>JSON.stringify({...localStorage}));
  for(const selector of ['#islandStagePreview','#hubThemeSelect','#categoryTabs','.island-view-switch']) {
   assert.equal(await page.locator(selector).isVisible(),false,'discovery controls stay simple after all places open');
  }
  assert.equal(await page.locator('#openLeaderboardBtn').isVisible(),false,'the last place has not cleared Level 1');
  assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),initial,'view checks must never write saves');
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:1000});
   for(const language of ['en','zh-Hant']){
    await page.evaluate(lang=>ToenowI18n.setLanguage(lang),language);
    for(const theme of ['bright']){
     await readyArt();
     assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`page overflow: ${width}/${language}/${theme}`);
     assert.equal(await page.locator('.island-location').count(),10);
     const overlaps=await page.locator('.island-location').evaluateAll(nodes=>{
      const boxes=nodes.map(n=>({id:n.dataset.islandGame,box:n.getBoundingClientRect()}));
      return boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>Math.min(a.box.right,b.box.right)-Math.max(a.box.left,b.box.left)>2&&Math.min(a.box.bottom,b.box.bottom)-Math.max(a.box.top,b.box.top)>2).map(b=>[a.id,b.id]));
     });
     assert.deepEqual(overlaps,[],`overlapping map targets at ${width}/${language}/${theme}`);
     assert(await page.locator('.island-location').evaluateAll(nodes=>nodes.every(node=>{
      const r=node.getBoundingClientRect(),label=node.querySelector('.island-place-label');
      return r.width>=44&&r.height>=44&&label.scrollHeight<=label.clientHeight+1;
     })),'map touch targets stay large and full labels remain readable');
     if(width<=768)assert(await page.locator('.island-map-viewport').evaluate(node=>node.scrollWidth>node.clientWidth),'small viewports retain map scrolling');
     assert((await page.locator('.island-intro h1').innerText()).includes(language==='en'?'island':'小島'));
     if(width===1440&&language==='zh-Hant')await page.screenshot({path:path.join(output,`island-${theme}-desktop.png`),fullPage:true,animations:'disabled'});
     const rowClearance=await page.locator('.island-location').evaluateAll(nodes=>{
      const boxes=nodes.map(n=>n.getBoundingClientRect());
      return Math.min(...boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2).map(b=>Math.max(a.top,b.top)-Math.min(a.bottom,b.bottom))));
     });
     assert(rowClearance>=(width<=768?8:0),`map row clearance at ${width}/${language}/${theme}: ${rowClearance}`);
     checks.push({width,language,theme,minRowClearance:rowClearance,status:'PASS'});
    }
   }
   if(width===390)await page.screenshot({path:path.join(output,'island-mobile.png'),fullPage:true,animations:'disabled'});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));
  for(const place of LOCATIONS){
   await page.locator(`[data-island-game="${place.gameId}"]`).click();
   await page.locator('.island-location-dialog').waitFor({state:'visible'});
   await readyArt('.island-location-dialog img[data-island-art]');
   assert.equal(await page.locator('.island-stage-gallery .island-stage-card').count(),5);
   assert.equal(await page.locator('.island-location-dialog .landmark-stage-5').count(),1);
   assert((await page.locator('.island-real-progress').innerText()).includes('尚未探索'));
   await page.keyboard.press('Escape');
  }
  // Open a map button with the keyboard, then change language inside the native dialog.
  await page.locator('[data-island-game="flash-brain"]').focus();await page.keyboard.press('Enter');
  await page.locator('.island-location-dialog').waitFor({state:'visible'});
  await page.evaluate(()=>ToenowI18n.setLanguage('en'));
  assert.equal(await page.locator('#islandLocationTitle').innerText(),'Elephant Memory Garden');
  await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));
  assert.equal(await page.locator('#islandLocationTitle').innerText(),'大象記憶花園');
  await readyArt('.island-location-dialog img[data-island-art]');
  await page.screenshot({path:path.join(output,'location-five-stages.png'),animations:'disabled'});
  await page.setViewportSize({width:390,height:900});
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'mobile dialog stays within viewport');
  await page.screenshot({path:path.join(output,'location-mobile.png'),animations:'disabled'});
  await page.setViewportSize({width:1440,height:1000});
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.activeElement.dataset.islandGame==='flash-brain',null,{polling:100});
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.islandGame),'flash-brain','closing after a language refresh returns focus to its location');
  await page.evaluate(()=>ToenowI18n.setLanguage('en'));
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.islandGame),'flash-brain','focused marker survives a refresh outside a dialog');
  await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));
  await page.locator('[data-island-game="flash-brain"]').click();
  await page.locator('.island-location-dialog').waitFor({state:'visible'});
  await page.locator('.island-play-button').click();
  await page.locator('#theaterModal.open').waitFor({state:'visible'});
  await page.locator('#gameViewer').contentFrame().locator('[data-toenow-screen="title"]').waitFor({state:'visible'});
  assert((await page.locator('#gameViewer').getAttribute('src')).includes('flash-brain'));
  await page.locator('#closeTheaterBtn').click();
  await page.waitForFunction(()=>!document.getElementById('theaterModal').classList.contains('open'));
  // Real number-pop normal/practice starts and production game-over flow.
  await page.route(/\/games\/number-pop\/(?:index\.html)?(?:\?.*)?$/,route=>{
   let html=readSource(path.resolve(__dirname,'../games/number-pop/index.html'),'utf8');
   const end=html.lastIndexOf('})();');
   html=html.slice(0,end)+'window.__islandFinish=()=>{game.score=120;game.wave=11;game.runDuration=60;triggerGameOver();};'+html.slice(end);
   return route.fulfill({contentType:'text/html',body:html});
  });
  async function openNumber(){await page.locator('[data-island-game="number-pop"]').click();await page.locator('.island-play-button').click();return page.locator('#gameViewer').contentFrame();}
  const practice=await openNumber();
  await practice.locator('.unified-practice-btn').click();
  await practice.locator('.unified-practice-level-btn[data-level="3"]').click();
  await page.frames().find(f=>f.url().includes('/games/number-pop/')).evaluate(()=>window.__islandFinish());
  await practice.locator('[data-toenow-screen="gameover"]').waitFor({state:'visible'});
  await page.locator('#closeTheaterBtn').click();
  assert.equal(await page.locator('[data-island-game="number-pop"]').getAttribute('data-stage'),'1','practice must not grow island');
  assert(!(await page.locator('[data-island-game="number-pop"]').getAttribute('class')).includes('is-explored'));
  const normal=await openNumber();
  await normal.locator('#btn-start').click();
  assert(await page.frames().find(f=>f.url().includes('/games/number-pop/')).evaluate(()=>!!ToenowGameSDK.getInstance('number-pop')?.materialRun),'normal iframe start creates a material run');
  await page.frames().find(f=>f.url().includes('/games/number-pop/')).evaluate(()=>window.__islandFinish());
  await normal.locator('[data-toenow-screen="gameover"]').waitFor({state:'visible'});
  await page.locator('#closeTheaterBtn').click();
  await page.waitForFunction(()=>document.querySelector('[data-island-game="number-pop"]').classList.contains('is-explored'));
  assert.equal(await page.locator('[data-island-game="number-pop"]').getAttribute('data-stage'),'1','challenge records do not automatically build homes');
  assert.equal(await page.locator('.island-counter').innerText(),'10 / 10 個地點已開放');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('[data-island-game="number-pop"]').getAttribute('data-stage'),'1');
  // Standalone/canonical record updates also refresh the parent map via storage events.
  const other=await context.newPage();await other.goto(base,{waitUntil:'domcontentloaded'});
  await other.evaluate(()=>{localStorage.setItem('flash_brain_best_wave_v1','21');localStorage.setItem('flash_brain_best_score_v1','200');});
  // Edge throttles background-page polling; resume the map before observing its update.
  await page.bringToFront();
  try {
   await page.waitForFunction(()=>localStorage.getItem('flash_brain_best_wave_v1')==='21',null,{polling:100});
   assert.equal(await page.locator('[data-island-game="flash-brain"]').getAttribute('data-stage'),'1','cloud/canonical score changes do not spend building materials');
  } catch(error) {
   console.error('Storage refresh diagnostics:',await page.evaluate(()=>({wave:localStorage.getItem('flash_brain_best_wave_v1'),stage:document.querySelector('[data-island-game="flash-brain"]')?.dataset.stage,ready:document.readyState})),errors);
   throw error;
  }
  await other.close();
  await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('#hubListView').isVisible(),false,'landing opens the island');
  assert.equal(await page.locator('.island-location').count(),10);
  await readyArt();
  await page.screenshot({path:path.join(output,'island-earned-stages.png'),fullPage:true,animations:'disabled'});
  assert.equal(await page.locator('[data-island-game="number-pop"]').getAttribute('data-stage'),'1');
  const blockedContext=await browser.newContext();await blockedContext.route('https://**',route=>route.abort());
  // Disable storage after the existing Hub bootstraps; test island's read-only fallback separately.
  const blocked=await blockedContext.newPage();await blocked.goto(base,{waitUntil:'domcontentloaded'});
  await blocked.evaluate(()=>{
   const storage={getItem(){throw Error('blocked');}};
   window.__blockedIslandProgress=ToenowIsland.getProgress('number-pop',storage,ToenowLevels);
  });
  assert.deepEqual(await blocked.evaluate(()=>window.__blockedIslandProgress),{level:1,wave:1,bestScore:0,explored:false});
  // A missing image falls back without removing the location or its launcher.
  const fallbackContext=await browser.newContext();await fallbackContext.route('https://**',route=>route.abort());
  await fallbackContext.addInitScript(state => localStorage.setItem('toenow_exploration_v3', JSON.stringify(state)), completeJourney);
  await fallbackContext.route('**/assets/animal-island/panda-level1.webp',route=>route.abort());
  const fallback=await fallbackContext.newPage();await fallback.goto(base,{waitUntil:'domcontentloaded'});
  await fallback.locator('[data-island-game="animal-rescue-train"] [data-art-fallback="true"]').waitFor();
  await fallback.locator('[data-island-game="animal-rescue-train"]').click();
  await fallback.locator('.island-play-button').click();
  await fallback.locator('#theaterModal.open').waitFor();
  assert((await fallback.locator('#gameViewer').getAttribute('src')).includes('animal-rescue-train'));
  // Independently decode all fifty shipped assets, not just the default stage.
  const allAssets=require('../assets/animal-island/manifest.json').assets.map(asset=>asset.runtime);
  await page.evaluate(async assets=>{
   await Promise.all(assets.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=()=>reject(Error('Cannot decode '+src));img.src=src;})));
  },allAssets);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,locations:10,statesPerLocation:5,illustratedAssets:50,artFallback:'PASS',simpleMapLayout:'PASS',gameLaunch:'PASS',normalAndPractice:'PASS',storageAndReload:'PASS',keyboardAndLanguage:'PASS',errors},null,2));
  console.log('PASS: island 10 responsive/language combinations, all ten locations and five states, real game launch, normal/practice finish, storage/reload, simple map and keyboard/dialog.');
 }finally{let timer;await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);}
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});
