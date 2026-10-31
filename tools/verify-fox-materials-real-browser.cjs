// Read-only probe plus real keyboard answers. No clock/score/wave/end-state mutation.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765',out=path.resolve(__dirname,'../artifacts/fox-materials-fix');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  await page.route('**/games/space-scale/main.js*',async route=>{
   const response=await route.fetch();let source=await response.text(),at=source.lastIndexOf('})();');
   source=source.slice(0,at)+`window.__foxRead=()=>({state:gameState,wave,score,busy:!!collapseAnim,correct:currentPuzzle.bodies.findIndex(b=>b.id===currentPuzzle.targetBodyId)+1,wrong:currentPuzzle.bodies.findIndex(b=>b.id!==currentPuzzle.targetBodyId)+1});`+source.slice(at);
   await route.fulfill({response,body:source});
  });
  await page.goto(base+'/games/space-scale/');await page.locator('#btn-start').click();
  await page.locator('[data-tutorial-skip]').click();
  await page.waitForFunction(()=>!ToenowTutorials.isActive('space-scale')&&document.body.dataset.state==='playing');
  const began=Date.now();let answers=0;
  while(Date.now()-began<40000){
   const s=await page.evaluate(()=>__foxRead());if(s.state==='gameover')break;
   if(!s.busy){await page.keyboard.press(String(s.wave<20?s.correct:s.wrong));answers++;}
   await page.waitForTimeout(420);
  }
  await page.locator('.toenow-material-reward').waitFor();
  const result=await page.evaluate(()=>({run:__foxRead(),receipt:document.querySelector('.toenow-material-reward').innerText,status:document.querySelector('.toenow-material-reward').dataset.rewardStatus,balance:ToenowMaterials.create({storage:localStorage}).snapshot().balances['space-scale']}));
  result.wallSeconds=(Date.now()-began)/1000;result.answers=answers;result.errors=errors;
  fs.writeFileSync(path.join(out,'real-fox.json'),JSON.stringify(result,null,2));
  await page.screenshot({path:path.join(out,'real-fox-result.png')});console.log(JSON.stringify(result));
  assert.equal(result.run.wave,20);assert.equal(result.status,'collected');assert.equal(result.balance,3);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
