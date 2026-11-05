const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const catalog=require('../shared/toenow-screen-config.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8778';
const out=process.env.TOENOW_PREVIEW_OUTPUT_DIR||path.resolve(__dirname,'../artifacts/hub-gameplay-previews');fs.mkdirSync(out,{recursive:true});
const checkLog=[],errors=[];const check=(value,label)=>{assert.ok(value,label);checkLog.push(label);};
const allIds=['animal-rescue-train',...Object.keys(catalog)];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  const mediaRequests=[];page.on('request',r=>{if(r.url().endsWith('.webm'))mediaRequests.push(r.url());});
  await page.goto(base);await page.locator('#islandListViewBtn').click();await page.locator('.game-card').last().waitFor();await page.waitForTimeout(400);
  check(await page.locator('.game-card').count()===10,'all ten registered games render');
  check(mediaRequests.length===0,'no videos downloaded before interaction');
  const scoreBefore=await page.evaluate(()=>localStorage.getItem('toenow_game_scores'));
  await page.evaluate(()=>ToenowI18n.setLanguage('en'));
  for(const id of allIds){
   const card=page.locator(`[data-game-id="${id}"]`),launch=card.locator('.game-launch');
   await launch.scrollIntoViewIfNeeded();await page.mouse.move(5,5);await launch.hover();await page.waitForTimeout(1200);
   check(await card.evaluate(c=>c.classList.contains('preview-playing')&&!c.querySelector('video').paused),id+' hover starts playback');
   check(await page.locator('.game-card.preview-playing').count()===1,id+' one preview at a time');
   const first=await card.locator('video').screenshot();
   await page.waitForTimeout(1800);
   const second=await card.locator('video').screenshot();
   check(!first.equals(second),id+' rendered gameplay changes');
   const duration=await card.locator('video').evaluate(v=>v.duration);
   check(duration>6.8&&duration<7.2,id+' seven second recorded clip');
   check(await card.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0),id+' actual poster loads');
   await page.mouse.move(5,5);await page.waitForTimeout(100);
   check(await card.locator('video').evaluate(v=>v.paused),id+' pointer exit stops');
   console.log('PASS media '+id);
  }
  check(await page.evaluate(()=>localStorage.getItem('toenow_game_scores'))===scoreBefore,'watching previews preserves saved scores');
  for(const lang of ['zh-Hant','en']){
   await page.evaluate(lang=>ToenowI18n.setLanguage(lang),lang);await page.waitForTimeout(120);
   check(await page.locator('.game-preview-button').first().innerText()===(lang==='en'?'Preview':'預覽'),lang+' preview label');
   for(const id of allIds){
    const card=page.locator(`[data-game-id="${id}"]`);
    await card.locator('.game-preview-button').click();await page.waitForTimeout(450);
    const dialog=page.locator('.game-preview-dialog');
    check(await dialog.evaluate(d=>d.open&&!d.querySelector('video').paused),lang+' modal plays '+id);
    check(await dialog.locator('h2').innerText()===await card.locator('h2').innerText(),lang+' modal title '+id);
    await page.keyboard.press('Escape');await page.waitForTimeout(40);
    check(await dialog.locator('video').evaluate(v=>v.paused),lang+' modal closes '+id);
   }
  }
  const firstLaunch=page.locator('.game-launch').first();await firstLaunch.focus();await page.waitForTimeout(800);
  check(await page.locator('.game-card.preview-playing').count()===1,'keyboard focus previews');
  await page.locator('[data-category="math"]').click();
  check(await page.locator('.game-card').count()===2,'category filters keep both math games');
  check(await page.locator('.game-card.preview-playing').count()===0,'filter destroys previous playback');
  check(await page.locator('.game-preview-dialog').count()===1,'filter retains one modal and no duplicates');
  await page.locator('[data-category="all"]').click();
  for(const id of allIds){
   await page.locator(`[data-game-id="${id}"] .game-launch`).click();
   const frame=page.frameLocator('#gameViewer');
   await frame.locator('#'+(catalog[id]?.startId||'btn-start-game')).waitFor({state:'visible'});
   check(await page.locator('.game-card.preview-playing').count()===0,'launch stops tile '+id);
   await page.locator('#closeTheaterBtn').click();
  }
  check(await page.locator('#theaterModal').evaluate(m=>!m.classList.contains('open')),'all ten iframe launches close cleanly');
  check(await page.locator('#gameViewer').getAttribute('src')==='about:blank','closing the theater unloads the game iframe');
  let shared=null;await page.evaluate(()=>{window.__previewShare=null;ToenowLevels.shareScore=data=>window.__previewShare=data;});
  await page.locator('.card-share-btn').first().click();shared=await page.evaluate(()=>window.__previewShare);
  check(shared?.gameId==='animal-rescue-train','share remains available without opening game');
  await page.locator('[data-category="all"]').click();await page.mouse.move(5,5);await page.locator('[data-category="all"]').focus();await page.evaluate(()=>scrollTo(0,0));
  console.log('PASS bilingual dialogs, filters, sharing and all ten iframe launches');
  await page.screenshot({path:path.join(out,'hub-desktop.png'),fullPage:true});
  const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const phone=await phoneContext.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base);await phone.locator('#islandListViewBtn').tap();
  for(const lang of ['en','zh-Hant']){
   await phone.evaluate(lang=>ToenowI18n.setLanguage(lang),lang);
   check(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+' 390px no horizontal overflow');
   for(const id of allIds){
    await phone.locator(`[data-game-id="${id}"] .game-preview-button`).tap();await phone.waitForTimeout(300);
    check(await phone.locator('.game-preview-dialog').evaluate(d=>d.open&&!d.querySelector('video').paused),lang+' touch preview '+id);
    await phone.locator('.game-preview-close').tap();
   }
  }
  await phone.screenshot({path:path.join(out,'hub-mobile.png'),fullPage:true});await phoneContext.close();
  const failPage=await browser.newPage();await failPage.route('**/assets/animal-gameplay-previews/*.webm',r=>r.abort());await failPage.goto(base);await failPage.locator('#islandListViewBtn').click();
  await failPage.locator('.game-launch').first().hover();await failPage.waitForTimeout(1000);
  check(await failPage.locator('.game-card.preview-playing').count()===0,'failed tile media preserves poster');
  check(await failPage.locator('.game-preview-dialog').evaluate(d=>!d.open),'hover failure does not open a modal');
  await failPage.locator('.game-preview-button').first().click();await failPage.waitForTimeout(700);
  check((await failPage.locator('.game-preview-status').innerText()).length>0,'explicit preview failure gives fallback text');
  const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(base);await reduced.locator('#islandListViewBtn').click();await reduced.locator('.game-launch').first().hover();await reduced.waitForTimeout(600);
  check(await reduced.locator('.game-card.preview-playing').count()===0,'reduced motion disables automatic previews');
  await reduced.locator('.game-preview-button').first().click();await reduced.waitForTimeout(600);
  check(await reduced.locator('.game-preview-dialog video').evaluate(v=>!v.paused),'reduced motion allows explicit preview');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({checks:checkLog.length,passed:checkLog,errors,physicalIPad:'NOT VERIFIED'},null,2));
  console.log(JSON.stringify({checks:checkLog.length,errors}));
 }finally{let timer;await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);}
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});
