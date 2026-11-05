const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8771';
const output=path.resolve(__dirname,'../artifacts/capybara-drift');fs.mkdirSync(output,{recursive:true});
async function instrument(page){
 const file=path.resolve(__dirname,'../games/capybara-drift/main.js');let js=fs.readFileSync(file,'utf8');const pos=js.lastIndexOf('})();');
 js=js.slice(0,pos)+`window.__drift={get:()=>({mode,x:state.x,elapsed:state.elapsed,score:state.score,wave:state.wave,speed:state.speed,friends:state.friends,isPractice:state.isPractice}),place:(type,x)=>{state.items=[{id:999,type,x:x??state.x,y:.72}]},scene:n=>{state.elapsed=n*60;state.friends=4;state.yuzu=3;syncHUD()},reward:()=>{state.score=300;checkpoint()},save:checkpoint};`+js.slice(pos);
 await page.route('**/games/capybara-drift/main.js',route=>route.fulfill({contentType:'application/javascript',body:js}));
}
async function run(){
 const browser=await chromium.launch({channel:'msedge',headless:true});let checks=0;
 try{
  for(const [width,height] of [[1100,850],[390,844],[320,568],[844,390]])for(const lang of ['en','zh-Hant']){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===base)errors.push(r.status()+' '+r.url());});
   await instrument(page);await page.addInitScript(lang=>localStorage.setItem('toenow_language_v1',lang),lang);await page.goto(base+'/games/capybara-drift/');
   await page.locator('#btn-start').click();await page.waitForFunction(()=>window.__drift.get().mode==='playing');
   assert.equal(await page.locator('#title-screen').isVisible(),false);assert.equal(await page.locator('#gameover-screen').isVisible(),false);
   await page.evaluate(()=>window.__drift.place('yuzu'));await page.waitForFunction(()=>window.__drift.get().score===5);
   await page.evaluate(()=>window.__drift.place('friend'));await page.waitForFunction(()=>window.__drift.get().friends===1);
   const before=(await page.evaluate(()=>window.__drift.get())).x;await page.keyboard.down('ArrowRight');await page.waitForTimeout(220);await page.keyboard.up('ArrowRight');assert((await page.evaluate(()=>window.__drift.get())).x>before);
   await page.mouse.move(width*.6,height*.72);await page.mouse.down();await page.mouse.move(width*.3,height*.72,{steps:6});await page.mouse.up();await page.waitForTimeout(350);assert((await page.evaluate(()=>window.__drift.get())).x<.45);
   const touch=await page.context().newCDPSession(page);
   for(const [type,x] of [['touchStart',width*.5],['touchMove',width*.7],['touchEnd',0]])await touch.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y:height*.72,id:1}]});
   await page.waitForTimeout(300);assert((await page.evaluate(()=>window.__drift.get())).x>.55,'synthetic touch drag steers');await touch.detach();
   await page.evaluate(()=>window.__drift.scene(1));await page.screenshot({path:path.join(output,`${width}-${height}-${lang}-play.png`)});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('#rest').click();const frozen=await page.evaluate(()=>window.__drift.get().elapsed);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__drift.get().elapsed),frozen);
   await page.evaluate(()=>window.__drift.reward());await page.locator('#wardrobe').click();await page.locator('[data-float="flower"]').click();
   assert.equal(await page.evaluate(()=>CapybaraDrift.readProfile(localStorage).equipped),'flower');assert.equal(await page.evaluate(()=>CapybaraDrift.readProfile(localStorage).wallet),180);
   await page.screenshot({path:path.join(output,`${width}-${height}-${lang}-rest.png`)});
   await page.reload();await page.locator('#continue').click();assert.equal(await page.evaluate(()=>window.__drift.get().score),300);assert.equal(await page.evaluate(()=>CapybaraDrift.readProfile(localStorage).wallet),180);
   await page.locator('#rest').click();await page.locator('#finish').click();await page.locator('#gameover-screen').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>CapybaraDrift.restore(localStorage)),null);
   await page.locator('#btn-title').click();await page.locator('#title-screen').waitFor({state:'visible'});
   const progress=await page.evaluate(()=>localStorage.getItem(CapybaraDrift.SESSION));
   await page.locator('.unified-practice-btn').click();await page.locator('.unified-practice-level-btn[data-level="3"]').click();assert.equal(await page.evaluate(()=>window.__drift.get().isPractice),true);
   await page.evaluate(()=>window.__drift.place('yuzu'));await page.waitForFunction(()=>window.__drift.get().score===5);await page.locator('#rest').click();await page.locator('#finish').click();assert.equal(await page.evaluate(()=>localStorage.getItem(CapybaraDrift.SESSION)),progress);
   assert.deepEqual(errors,[]);await page.close();checks++;console.log(`PASS ${width}x${height} ${lang}: steering, collection, friends, pause, cosmetics, resume, practice`);
  }
  const hub=await browser.newPage({viewport:{width:1100,height:850}});hub.setDefaultTimeout(10000);const errors=[];hub.on('pageerror',e=>errors.push(e.message));await hub.route('https://**',r=>r.abort());
  console.log('Hub: load fresh player');await hub.goto(base+'/',{waitUntil:'domcontentloaded',timeout:15000});
  await hub.locator('#welcomeGuestBtn').click();console.log('Hub: guest welcomed');await hub.locator('#open-capybara').click();console.log('Hub: Capybara opened');
  const frame=hub.frameLocator('#gameViewer');await frame.locator('#btn-start').click();await hub.locator('#restartGameBtn').click();await frame.locator('#play-hud').waitFor({state:'visible'});
  await frame.locator('#rest').click();console.log('Hub: game resting');await frame.locator('#rest-hub').click();await hub.waitForFunction(()=>document.getElementById('theaterModal').getAttribute('aria-hidden')==='true');assert.equal(await hub.locator('#theaterModal').evaluate(el=>getComputedStyle(el).pointerEvents),'none');assert.deepEqual(errors,[]);await hub.close();
  console.log(`PASS ${checks} gameplay combinations and fresh-player Hub launch/exit`);
 }finally{let timer;await Promise.race([browser.close(),new Promise(r=>timer=setTimeout(r,5000))]);clearTimeout(timer);}
}
run().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
