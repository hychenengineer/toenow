const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../games/carefree-farm/model.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8801';
const out='artifacts/farm-ground-fields';
const key='toenow_carefree_farm_v1';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try{
  for(const width of [1100,390,320]){
   const page=await browser.newPage({viewport:{width,height:950},hasTouch:width<500});
   page.on('pageerror',e=>errors.push(e.message));
   await page.clock.install();
   await page.addInitScript(()=>localStorage.setItem('toenow_language_v1','zh-Hant'));
   await page.goto(base+'/games/carefree-farm/');
   const click=async s=>{await page.locator(s).click();await page.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-busy')!=='true');};
   await click('#btn-start');
   await page.screenshot({path:`${out}/${width}-empty.png`,fullPage:true});
   await click('[data-plot="0"]');
   await click('[data-crop="carrot"]');await click('[data-plot="1"]');
   await click('[data-crop="grass"]');await click('[data-plot="2"]');
   await page.screenshot({path:`${out}/${width}-growing.png`,fullPage:true});
   await page.clock.fastForward(61000);
   assert.equal(await page.locator('.plot.ready').count(),3);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   for(const plot of await page.locator('[data-plot]').all()){const r=await plot.boundingBox();assert(r.width>=44&&r.height>=44);}
   await page.screenshot({path:`${out}/${width}-ready.png`,fullPage:true});
   const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
   await click('[data-plot="0"]');
   const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
   assert.equal(after.inventory.grass,before.inventory.grass+3);
   assert.equal(after.plots[0],null);
   await page.reload();await click('#btn-start');
   assert.equal(await page.locator('.plot.ready').count(),2);
   const fixture=F.create(Date.now());fixture.level=5;fixture.plots=Array.from({length:15},(_,i)=>({crop:Object.keys(F.CROPS)[i%12],due:Date.now()-1000}));fixture.unlocked=Object.keys(F.CROPS);
   await page.evaluate(({key,fixture})=>localStorage.setItem(key,JSON.stringify(fixture)),{key,fixture});
   await page.reload();await click('#btn-start');
   assert.equal(await page.locator('.plot.ready').count(),15);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`${out}/${width}-expanded.png`,fullPage:true});
   await click('[data-plot="14"]');assert.equal(await page.locator('.plot.ready').count(),14);
   await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS ground fields: desktop/390/320, planting, growth, harvesting, reload, 15 beds, hit targets and no overflow');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
