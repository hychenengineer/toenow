const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {createPicker}=require('../games/animal-rescue-train/picker.js');
const {solve}=require('./rescue-train-solver.cjs');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8778';
const out=path.resolve(__dirname,'../artifacts/animal-rescue-train/success');fs.mkdirSync(out,{recursive:true});
const key='animal_rescue_train_guest_v2',checks=[],errors=[];
const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
async function win(page,touch=false){
 if(await page.locator('#last-animal-dialog').isVisible())await page.locator('#acknowledge-last-animal')[touch?'tap':'click']();
 const data=await saved(page),level=createPicker().resolve(data.wave,data.requiredLastAnimal,data.puzzleIndex);
 const moves=solve(level).path;assert.ok(moves);
 for(const [queue,car]of moves){await page.locator(`[data-queue="${queue}"]`)[touch?'tap':'click']();await page.locator(`[data-car="${car}"]`)[touch?'tap':'click']();}
 await page.locator('#success-dialog').waitFor({state:'visible',timeout:2000});
 const bounds=await page.locator('#success-dialog').evaluate(d=>{const r=d.getBoundingClientRect();return{cx:r.x+r.width/2,cy:r.y+r.height/2,width:innerWidth,height:innerHeight,inside:r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight};});
 check(Math.abs(bounds.cx-bounds.width/2)<2&&Math.abs(bounds.cy-bounds.height/2)<2&&bounds.inside,'success dialog centered and inside viewport');
 check(await page.locator('#success-dialog #result.won').isVisible(),'success text is in modal');
 check(await page.locator('#success-dialog #next').isVisible(),'next action is in modal');
 check(await page.locator('#success-dialog #btn-share-score').isVisible(),'share remains accessible');
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,lang]of [[1280,'en'],[390,'zh-Hant']]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/games/animal-rescue-train/');await page.evaluate(lang=>ToenowI18n.setLanguage(lang),lang);await page.locator('#btn-start-game').click();
  for(let tier=1;tier<=5;tier++){
   await win(page,width===390);
   check(await page.locator('#result h3').innerText()===(tier===5?(lang==='en'?'Game Complete!':'遊戲完成！'):(lang==='en'?'Level cleared!':'你已經過關了！')),'localized level-clear heading');
   if(tier<5)check(await page.locator('#next').innerText()===(lang==='en'?'Next level →':'下一關 →'),'localized next-level button');
   if(tier===1){
    await page.keyboard.press('Escape');check(await page.locator('#success-dialog').evaluate(d=>d.open),'Escape keeps next-level choice available');
    await page.screenshot({path:path.join(out,lang+'-'+width+'.png')});
    await page.reload();check(!await page.locator('#success-dialog').evaluate(d=>d.open),'saved victory does not cover title screen');
    await page.locator('#continue').click();await page.locator('#success-dialog').waitFor({state:'visible'});
   }
   await page.locator('#next').click();
   check(!await page.locator('#success-dialog').evaluate(d=>d.open),'next closes success dialog');
   check((await saved(page)).wave===(tier===5?1:tier*5+1),'next advances level or restarts completed run');
  }
  await page.locator('#menu').click();await page.locator('.unified-practice-btn').click();await page.locator('[data-level="2"]').click();
  const best=await page.evaluate(()=>[localStorage.getItem('animal_rescue_train_best_score'),localStorage.getItem('animal_rescue_train_best_wave')]);
  await win(page,width===390);const before=await saved(page);await page.locator('#next').click();
  check((await saved(page)).wave===before.wave&&(await saved(page)).puzzleIndex!==before.puzzleIndex,'practice next selects another puzzle at same level');
  check(JSON.stringify(best)===JSON.stringify(await page.evaluate(()=>[localStorage.getItem('animal_rescue_train_best_score'),localStorage.getItem('animal_rescue_train_best_wave')])),'practice completion protects best records');
  await win(page,width===390);await page.locator('#success-menu').click();
  check(await page.locator('#menu-screen').isVisible()&&!await page.locator('#success-dialog').evaluate(d=>d.open),'title option closes dialog and returns to menu');
  await context.close();console.log('PASS standalone '+lang+' '+width);
 }
 const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.locator('#islandListViewBtn').click();
 await page.locator('[data-game-id="animal-rescue-train"] .game-launch').click();await page.frameLocator('#gameViewer').locator('#btn-start-game').waitFor({state:'visible'});const frame=page.frames().find(f=>f.url().includes('/games/animal-rescue-train/'));
 await frame.locator('#btn-start-game').click();await win(frame);await frame.locator('#next').click();check((await saved(frame)).wave===6,'Hub iframe next advances level');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({checks:checks.length,passed:checks,errors,physicalIPadSafari:'NOT VERIFIED'},null,2));console.log(JSON.stringify({checks:checks.length,errors}));
}finally{let timer;await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);}})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
