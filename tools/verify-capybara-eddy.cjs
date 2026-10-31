const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8782',output=path.resolve(__dirname,'../artifacts/capybara-eddy');fs.mkdirSync(output,{recursive:true});
async function instrument(page){
 const file=path.resolve(__dirname,'../games/capybara-drift/main.js');let js=fs.readFileSync(file,'utf8');
 js=js.replace(/\}\)\(\);\s*$/,`window.__eddy={get:()=>({mode,elapsed:state.elapsed,flowTime:state.flowTime,active:state.eddy.active,x:state.x,y:state.y,playCount:state.playCount,items:state.items.map(i=>({...i})),eddy:E.eddyInfo(state),trip:state.trip,isPractice:state.isPractice}),stage:()=>{state.elapsed=25;state.flowTime=25;syncHUD();},point:(kind)=>{const p=kind==='entry'?E.eddyInfo(state):kind==='exit'?{x:.5,y:.56}:E.position(state);return screenPoint(p.x,p.y);},collect:()=>{state.items=[{id:8888,type:'yuzu',x:state.x,y:state.y}];},save:checkpoint};})();`);
 await page.route('**/games/capybara-drift/main.js',r=>r.fulfill({body:js,contentType:'application/javascript'}));
}
async function swipe(page,cdp,from,to){
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
 for(let i=1;i<=8;i++){const f=i/8;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*f,y:from.y+(to.y-from.y)*f}]});await page.waitForTimeout(40);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
async function run(){const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height] of [[390,844],[320,568],[844,390],[1100,850]])for(const lang of ['en','zh-Hant']){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await instrument(page);
  await page.addInitScript(lang=>localStorage.setItem('toenow_language_v1',lang),lang);await page.goto(base+'/games/capybara-drift/',{waitUntil:'domcontentloaded'});await page.locator('#btn-start').click();await page.evaluate(()=>window.__eddy.stage());
  const cdp=await page.context().newCDPSession(page);const entry=await page.evaluate(()=>window.__eddy.point('entry')),capy=await page.evaluate(()=>window.__eddy.point('capy'));
  await swipe(page,cdp,capy,entry);await page.waitForFunction(()=>window.__eddy.get().active);
  const before=await page.evaluate(()=>window.__eddy.get());await page.waitForTimeout(1100);const after=await page.evaluate(()=>window.__eddy.get());assert.equal(after.elapsed,before.elapsed);assert(after.flowTime>before.flowTime+.9);assert(Math.hypot(after.x-before.x,after.y-before.y)>.01);assert(await page.locator('#eddy-controls').isVisible());
  const positions=after.items.map(i=>i.y);assert.notDeepEqual(positions,before.items.map(i=>i.y));
  const count=after.playCount||0;await page.locator('#eddy-play').click();assert.equal((await page.evaluate(()=>window.__eddy.get())).playCount,count+1);
  const swimmer=await page.evaluate(()=>window.__eddy.point('capy'));await page.touchscreen.tap(swimmer.x,swimmer.y);assert.equal((await page.evaluate(()=>window.__eddy.get())).playCount,count+2);
  await page.evaluate(()=>window.__eddy.collect());await page.waitForFunction(()=>document.getElementById('score').textContent!=='0');
  await page.locator('#rest').click();const paused=await page.evaluate(()=>window.__eddy.get());await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>window.__eddy.get())).flowTime,paused.flowTime);await page.locator('#resume').click();
  await page.evaluate(()=>window.__eddy.save());await page.reload({waitUntil:'domcontentloaded'});await page.locator('#continue').click();await page.waitForFunction(()=>window.__eddy.get().active);assert.equal((await page.evaluate(()=>window.__eddy.get())).trip.id,before.trip.id);
  await page.screenshot({path:path.join(output,`${width}-${lang}-orbit.png`)});
  const from=await page.evaluate(()=>window.__eddy.point('capy')),exit=await page.evaluate(()=>window.__eddy.point('exit'));await swipe(page,cdp,from,exit);await page.waitForFunction(()=>!window.__eddy.get().active);const elapsed=(await page.evaluate(()=>window.__eddy.get())).elapsed;await page.waitForTimeout(160);assert((await page.evaluate(()=>window.__eddy.get())).elapsed>elapsed);
  // Accessible exit and no forced entry: untouched main-channel travel keeps advancing.
  const e=await page.evaluate(()=>window.__eddy.point('entry'));await page.touchscreen.tap(e.x,e.y);await page.waitForFunction(()=>window.__eddy.get().active);await page.locator('#eddy-leave').click();assert.equal((await page.evaluate(()=>window.__eddy.get())).active,false);
  await page.screenshot({path:path.join(output,`${width}-${lang}-river.png`)});
  assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height} ${lang}: touch entry/orbit/clock/flow, splash/tap, pause, restore, swipe and button exit`);await page.close();
 }
 }finally{let timer;await Promise.race([browser.close(),new Promise(r=>timer=setTimeout(r,5000))]);clearTimeout(timer);}}
run().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
