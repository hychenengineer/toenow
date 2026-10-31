// Real pointer input and natural timeout. No score, clock, wave or end-state mutation.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const out=path.resolve(__dirname,'../artifacts/rabbit-high-score');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1100,height:850}});
  await context.route('https://**',r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/games/number-pop/');await page.locator('#btn-start').click();
  await page.locator('[data-tutorial-skip]').click();
  await page.waitForFunction(()=>document.body.dataset.state==='playing'&&!window.ToenowTutorials.isActive('number-pop'));
  let clicks=0;const began=Date.now();
  while(Date.now()-began<180000){
   const state=await page.evaluate(()=>{
    const s=window.__QUANTUM_GAME__.getState(),r=document.querySelector('#game-canvas').getBoundingClientRect();
    const c=s.cores.filter(c=>!c.popped).sort((a,b)=>a.value-b.value)[0];
    return {state:s.state,score:s.score,wave:s.wave,target:c?{x:r.left+c.x,y:r.top+c.y}:null};
   });
   if(state.state==='gameover')break;
   if(state.wave<=22&&state.target){await page.mouse.click(state.target.x,state.target.y);clicks++;}
   await page.waitForTimeout(state.wave<=22?550:500);
  }
  await page.locator('#gameover-screen.visible').waitFor();
  await page.locator('.toenow-material-reward').waitFor();
  const result=await page.evaluate(()=>({state:__QUANTUM_GAME__.getState(),successes:ToenowGameSDK.getInstance('number-pop').materialCorrectCount,receipt:document.querySelector('.toenow-material-reward').innerText,status:document.querySelector('.toenow-material-reward').dataset.rewardStatus,balance:ToenowMaterials.create({storage:localStorage}).snapshot().balances['number-pop']}));
  result.clicks=clicks;result.wallSeconds=(Date.now()-began)/1000;
  assert(result.state.score>100000,'exercise the high-score case, not a one-basket run');
  assert.equal(result.status,'collected');assert.equal(result.balance,Math.floor(result.successes/5));assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(out,'real-high-score-result.png')});
  fs.writeFileSync(path.join(out,'real-play.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({score:result.state.score,wave:result.state.wave,duration:result.wallSeconds,balance:result.balance,receipt:result.receipt,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
