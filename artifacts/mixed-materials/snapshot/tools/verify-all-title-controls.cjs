const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../shared/toenow-screen-config.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8778';
const out=`artifacts/title-controls/run-${Date.now()}`;fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let checks=0;
 try {
 const games='number-pop,ball-track,block-match,add-up,space-scale,tap-match,spot-quick,shadow-match,flash-brain,animal-rescue-train'+(catalog['capybara-drift']?',capybara-drift':'');
 for(const width of [320,390,1100]) for(const lang of ['en','zh-Hant']) for(const id of (process.env.TOENOW_TEST_GAMES||games).split(',')) {
  console.log(`CHECK ${id} ${width} ${lang}`);
  const context=await browser.newContext({viewport:{width,height:850}});
  await context.route('https://**',r=>r.abort());
  await context.addInitScript(({id,lang})=>{
   localStorage.setItem('toenow_tutorial_'+id+'_v2','completed');localStorage.setItem('toenow_language_v1',lang);
   for(const rule of ['thorns','priority'])localStorage.setItem('toenow_flash_lesson_'+rule+'_v1','completed');
  },{id,lang});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.evaluate(id=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());exploration.isUnlocked=()=>true;openTheaterModal(GAMES_CONFIG.find(g=>g.id===id));},id);
  const frame=page.frameLocator('#gameViewer');
  await frame.locator('#'+(catalog[id]?.startId||'btn-start-game')).waitFor();
  // Number Pop's existing fast-button handler rejects events in its first 250ms.
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#theaterGameActions').isVisible(),false,'title hides gameplay controls');
  await frame.locator('#'+(catalog[id]?.startId||'btn-start-game')).click();
  if(id==='tap-match')await frame.locator('#btn-begin-wave').click();
  const actions=page.locator('#theaterGameActions');await actions.waitFor({state:'visible',timeout:7000}).catch(async e=>{
   console.log(await page.evaluate(()=>{const d=document.getElementById('gameViewer').contentDocument,l=d.querySelector('.island-live-hud');return {body:d.body.outerHTML.slice(0,250),visibility:l&&d.defaultView.getComputedStyle(l).visibility,rect:l?.getBoundingClientRect().toJSON()};}));throw e;
  });
  assert.equal(await actions.locator('button').count(),id==='animal-rescue-train'?2:3);
  const title=await page.locator('#theaterTitle').boundingBox();
  for(const button of await actions.locator('button').all()) {
   const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44);
   assert.ok(box.x>=title.x+title.width-1&&box.x+box.width<=width+.5,JSON.stringify({id,title,box}));
   assert.ok(box.y<=title.y+title.height&&box.y+box.height>=title.y,'same row');
   assert.ok(await button.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'unobstructed button');
  }
  if(!['animal-rescue-train','capybara-drift'].includes(id)) {
   for(const button of await frame.locator('.island-hud-controls button:not(#btn-clear-selection)').all())assert.equal(await button.isVisible(),false);
   if(id==='add-up')assert.equal(await frame.locator('#btn-clear-selection').isVisible(),true);
  }
  if(width===390&&lang==='en') {
   if(id!=='animal-rescue-train') {
    const sound=actions.locator('button').nth(0),before=await sound.evaluate(e=>e.outerHTML);await sound.click();
    await page.waitForFunction(before=>document.querySelector('#theaterGameActions button').outerHTML!==before,before,{timeout:5000}).catch(async e=>{console.log({before,after:await sound.evaluate(e=>e.outerHTML),original:await frame.locator('#sound').evaluate(e=>e.outerHTML).catch(()=>null)});throw e;});console.log('sound OK');
   }
   const pause=actions.getByRole('button',{name:/pause|暫停/i});await pause.click({timeout:5000});
   console.log('pause clicked');
   const paused=frame.locator(id==='animal-rescue-train'?'#pause-dialog[open]':id==='capybara-drift'?'#rest-panel:visible':'.unified-pause-screen:visible');await paused.waitFor();
   // Resume through the game's existing button, including games whose pause button is one-way.
   await paused.locator('button').first().click();await paused.waitFor({state:'hidden'});
   console.log('resume OK');
   await actions.getByRole('button',{name:/restart|重新/i}).click();
   console.log('restart clicked');
   await page.locator('#fullscreenGameBtn').click();assert.equal(await page.evaluate(()=>document.fullscreenElement?.id),'theaterModal');
   await actions.waitFor({state:'visible'});await page.evaluate(()=>document.exitFullscreen());
  }
  await page.screenshot({path:`${out}/${id}-${width}-${lang}.png`});
  await page.locator('#closeTheaterBtn').click();assert.equal(await actions.isVisible(),false);
  assert.deepEqual(errors,[]);checks++;console.log(`PASS ${id} ${width} ${lang}`);await context.close();
 }
 console.log(JSON.stringify({checks,errors:0,out}));
 } finally {await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);}
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
