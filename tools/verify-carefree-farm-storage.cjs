const {chromium}=require('playwright'),assert=require('node:assert/strict');
const url=(process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774')+'/games/carefree-farm/',key='toenow_carefree_farm_v1';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let failures=0;try{
 for(const scenario of ['preview','conflict']){
  const context=await browser.newContext(),a=await context.newPage();await a.goto(url);await a.locator('#btn-start').click();
  await a.evaluate(()=>{window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='toenow_carefree_farm_v1')throw Error('quota');return window.realSet.call(this,k,v);};});
  await a.locator('[data-plot="0"]').click();await a.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-busy')==='false');assert(await a.locator('#save-warning').isVisible());
  if(scenario==='preview'){
   for(const id of ['rest','finish','btn-title','btn-farm-practice','rest','finish','btn-title','btn-start'])await a.locator('#'+id).click();
   try{assert.equal(await a.locator('.plot.empty').count(),2);console.log('PASS retained unsaved normal state through preview');}catch(e){failures++;console.error('FAIL preview discarded unsaved progress');}
  }else{
   const b=await context.newPage();await b.goto(url);await b.locator('#btn-start').click();await b.locator('[data-plot="1"]').click();await b.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-busy')==='false');
   await a.evaluate(()=>Storage.prototype.setItem=window.realSet);await a.locator('[data-plot="2"]').click();await a.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-busy')==='false');
   const saved=await b.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
   try{assert(saved.plots[1]);console.log('PASS failed-write recovery preserves other tab progress');}catch(e){failures++;console.error('FAIL recovery overwrote other tab progress');}
  }
  await context.close();
 }
}finally{await browser.close();}if(failures)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
