// Test-only result inputs; real Start/Practice controls, SDK, storage and result UI.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765',out=path.resolve(__dirname,'../artifacts/rabbit-high-score');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const checks=[];
  for(const test of [{score:0,successes:0,reason:'no-successes',amount:0,progress:0},{score:100,successes:1,reason:'progress',amount:0,progress:1},{score:1000,successes:12,reason:'collected',amount:2,progress:2},{score:133514,wave:22,successes:50,reason:'collected',amount:10,progress:0},{score:10,successes:12,practice:true,reason:'practice',amount:0,progress:0}]){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   await page.route('https://**',r=>r.abort());
   await page.addInitScript(()=>{localStorage.setItem('toenow_tutorial_number-pop_v2','completed');const clock=Date.now;window.__receiptOffset=0;Date.now=()=>clock()+window.__receiptOffset;});
   await page.route('**/games/number-pop/main.js*',async r=>{
    const response=await r.fetch();let source=await response.text(),at=source.lastIndexOf('})();');
    source=source.slice(0,at)+'window.__finishReceiptCase=(score,wave)=>{game.score=score;game.wave=wave;triggerGameOver();};'+source.slice(at);
    await r.fulfill({response,body:source});
   });
   await page.goto(base+'/games/number-pop/');await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));
   if(test.practice){await page.locator('.unified-practice-btn').click();await page.locator('.unified-practice-level-btn[data-level="1"]').click();}
   else await page.locator('#btn-start').click();
   await page.evaluate(t=>{window.__receiptOffset+=90000;for(let n=0;n<t.successes;n++)ToenowGameSDK.getInstance('number-pop').recordCorrectAnswer();window.__finishReceiptCase(t.score,t.wave||1);},test);
   const receipt=page.locator('.toenow-material-reward');await receipt.waitFor();
   assert.equal(await receipt.getAttribute('data-reward-status'),test.reason);
   assert.equal(await page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot().balances['number-pop']),test.amount);
   assert.equal(await page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot().progress['number-pop']),test.progress);
   assert.equal(await receipt.locator('button').count(),test.amount?1:0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({animations:'disabled',path:path.join(out,'receipt-'+test.reason+'-mobile.png')});
   checks.push(test.reason+' visible with correct balance PASS');await page.close();
  }
  console.log(checks.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
