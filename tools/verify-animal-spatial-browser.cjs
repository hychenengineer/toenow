// Reproducible real Edge input and visual checks for the animal spatial games.
const {chromium}=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const out=path.resolve('artifacts/animal-island');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
 try{
 for(const viewport of [{width:1100,height:850},{width:390,height:844}])for(const lang of ['en','zh-Hant'])for(const id of (process.env.TOENOW_TEST_GAMES||'ball-track,block-match,shadow-match').split(',')){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<500});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/games/${id}/`);await page.evaluate(l=>ToenowI18n.setLanguage(l),lang);
  if(!await page.evaluate(()=>!!window.ToenowAnimals))await page.addScriptTag({url:base+'/shared/toenow-animals.js'});
  const shot=async phase=>page.screenshot({path:path.join(out,`${id}-${viewport.width}-${lang}-${phase}.png`)});
  await page.locator(id==='ball-track'?'#btn-start-game':id==='block-match'?'#btn-start':'#btn-init-optics').click();
  await page.waitForTimeout(350);
  if(id==='ball-track'){
   await shot('reveal');
   await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='select',null,{timeout:30000});
   await shot('concealed');
   let before=await page.evaluate(()=>__QUANTUM_SHELL__.getState());
   const wrong=before.shells.find(s=>!s.hasCore);assert.ok(wrong);
   await page.mouse.click(wrong.x,wrong.y);
   let after=await page.evaluate(()=>__QUANTUM_SHELL__.getState());assert.equal(after.shields,before.shields-1,'wrong leaf consumes one shield');
   // Wrong choices resolve this round; start a fresh normal run and select an otter.
   await page.evaluate(()=>__QUANTUM_SHELL__.startNewGame());
   await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='select',null,{timeout:30000});
   before=await page.evaluate(()=>__QUANTUM_SHELL__.getState());
   const correct=before.shells.find(s=>s.hasCore);await page.mouse.click(correct.x,correct.y);
   after=await page.evaluate(()=>__QUANTUM_SHELL__.getState());assert.ok(after.score>before.score,'correct otter awards score');
  }else if(id==='block-match'){
   await shot('playing');
   const cell=async value=>page.evaluate(v=>{const s=__CHIP_DEFRAG__.getState(),b=s.layout.leftBox;for(let r=0;r<s.board.activeGrid.length;r++)for(let c=0;c<s.board.activeGrid.length;c++)if(s.board.activeGrid[r][c]===v)return{x:b.x+b.pad+c*(b.cellSize+b.gap)+b.cellSize/2,y:b.y+b.pad+r*(b.cellSize+b.gap)+b.cellSize/2,r,c};},value);
   let before=await page.evaluate(()=>__CHIP_DEFRAG__.getState());let target=await cell(2);await page.mouse.click(target.x,target.y);
   let after=await page.evaluate(()=>__CHIP_DEFRAG__.getState());assert.ok(after.score>before.score);assert.equal(after.board.activeGrid[target.r][target.c],0);
   before=after;target=await cell(1);await page.mouse.click(target.x,target.y);
   after=await page.evaluate(()=>__CHIP_DEFRAG__.getState());assert.equal(after.board.activeGrid[target.r][target.c],1);assert.ok(after.timeLeft<before.timeLeft-1);assert.ok(after.freezeTimer>0);
  }else{
   const banner=await page.evaluate(()=>{
    const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {left:r.left,right:r.right};};
    return {host:rect('hud-banner-wrap'),status:rect('hud-status-text'),feedback:rect('hud-feedback-tag')};
   });
   assert.ok(banner.status.right+5<=banner.feedback.left,'shadow status and progress need separate space');
   assert.ok(banner.feedback.right<=banner.host.right+1,'shadow progress must remain inside the HUD');
   await shot('playing');let before=await page.evaluate(()=>__ECLIPSE_DRIFT__.getState());
   await page.locator('.dock-card-btn').nth((before.correctCardIndex+1)%await page.locator('.dock-card-btn').count()).click();
   let after=await page.evaluate(()=>__ECLIPSE_DRIFT__.getState());assert.ok(after.timeRemaining<before.timeRemaining-2.5);assert.equal(after.combo,1);
   await page.waitForTimeout(550);before=await page.evaluate(()=>__ECLIPSE_DRIFT__.getState());
   await page.locator('.dock-card-btn').nth(before.correctCardIndex).click();after=await page.evaluate(()=>__ECLIPSE_DRIFT__.getState());assert.ok(after.score>before.score);
  }
  await shot('feedback');assert.deepEqual(errors,[],`${id} page errors`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  results.push({game:id,...viewport,lang,status:'PASS',pageErrors:errors});fs.writeFileSync(path.join(out,process.env.TOENOW_SPATIAL_REPORT||'spatial-browser-results.json'),JSON.stringify(results,null,2));console.log('PASS',id,viewport.width,lang);
  await Promise.race([context.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
 }
 }finally{fs.writeFileSync(path.join(out,'spatial-browser-results.json'),JSON.stringify(results,null,2));await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,8000))]);}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
