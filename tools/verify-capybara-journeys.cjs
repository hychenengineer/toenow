const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8782';
const out=path.resolve(__dirname,'../artifacts/capybara-journeys');fs.mkdirSync(out,{recursive:true});
async function instrument(page){
 let js=fs.readFileSync(path.resolve(__dirname,'../games/capybara-drift/main.js'),'utf8');
 js=js.replace(/\}\)\(\);\s*$/,`window.__journey={get:()=>({mode,x:state.x,elapsed:state.elapsed,trip:state.trip,inventory:state.inventory,isPractice:state.isPractice,materialCollected:state.materialCollected,materialRewarded:state.materialRewarded}),point:()=>{const p=E.position(state);return screenPoint(p.x,p.y);},flow:()=>{state.items=[{id:7777,type:'yuzu',x:.5,y:.12}];},flowPoint:()=>{const p=state.items.find(i=>i.id===7777);return p?screenPoint(p.x,p.y):null;},collect:()=>{state.items=[{id:999,type:'collectible',collectibleId:state.trip.collectible,x:state.x,y:.72}];},material:()=>{state.trip.materialId=state.trip.materialId||'block-match';state.items=[{id:998,type:'material',materialId:state.trip.materialId,x:state.x,y:.72}];},end:()=>{state.elapsed=89.95;},look:(scene,time,weather,event,elapsed)=>{Object.assign(state.trip,{scene,time,weather,event});state.elapsed=elapsed;syncHUD();},save:checkpoint};})();`);
 await page.route('**/games/capybara-drift/main.js',r=>r.fulfill({body:js,contentType:'application/javascript'}));
}
async function run(){
 const browser=await chromium.launch({channel:'msedge',headless:true});let checks=0;
 try{
  for(const [width,height] of (process.env.TOENOW_HUB_ONLY?[]:process.env.TOENOW_JOURNEY_SMOKE?[[390,844]]:[[1100,850],[390,844],[320,568],[844,390]]))for(const lang of ['en','zh-Hant']){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(r.status()+' '+r.url());});
   await instrument(page);await page.addInitScript(lang=>localStorage.setItem('toenow_language_v1',lang),lang);
   await page.goto(base+'/games/capybara-drift/');await page.locator('#btn-start').click();await page.waitForFunction(()=>window.__journey.get().mode==='playing');
   await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
   const initial=await page.evaluate(()=>window.__journey.get());
   const cdp=await page.context().newCDPSession(page);
   const capy=await page.evaluate(()=>window.__journey.point());assert(Math.abs(capy.x/width-.28)<.015,'capybara stays toward the left of the horizontal river');
   await page.evaluate(()=>window.__journey.flow());const flowBefore=await page.evaluate(()=>window.__journey.flowPoint());await page.waitForTimeout(240);const flowAfter=await page.evaluate(()=>window.__journey.flowPoint());assert(flowBefore&&flowAfter&&flowAfter.x<flowBefore.x,'pickups flow from screen right to left');
   const x=Math.round(width*.28);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:height*.3}]});
   for(let i=0;i<9;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:height*(.3+i*.045)}]});await page.waitForTimeout(55);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(120);assert((await page.evaluate(()=>window.__journey.get())).x>initial.x);
   await page.evaluate(()=>window.__journey.collect());await page.waitForFunction(()=>Object.keys(window.__journey.get().inventory).length>0);
   await page.locator('#rest').click();const paused=(await page.evaluate(()=>window.__journey.get())).elapsed;await page.waitForTimeout(180);assert.equal((await page.evaluate(()=>window.__journey.get())).elapsed,paused);
   await page.locator('#collection-open').click();assert(await page.locator('.collection-cell.found').count()>0);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#collection-panel').isVisible(),false);assert.equal((await page.evaluate(()=>window.__journey.get())).mode,'rest');
   await page.locator('#resume').click();
   await page.evaluate(()=>window.__journey.material());await page.waitForFunction(()=>window.__journey.get().materialRewarded);
   const saved=await page.evaluate(()=>{window.__journey.save();return {state:window.__journey.get(),materials:JSON.parse(localStorage.getItem('toenow_materials_v1'))};});
   await page.reload();await page.locator('#continue').click();await page.waitForFunction(()=>window.__journey.get().mode==='playing');
   const restored=await page.evaluate(()=>window.__journey.get());assert.deepEqual(restored.trip,saved.state.trip);assert.deepEqual(restored.inventory,saved.state.inventory);
   await page.evaluate(()=>window.__journey.material());await page.waitForTimeout(120);
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('toenow_materials_v1')).balances),saved.materials.balances);
   // Screenshots use the actual renderer at known itinerary stages.
   for(const look of [['bamboo','morning','breeze','birds',10],['lotus','sunset','rain','lotus',44],['forest','night','mist','fireflies',73],['maple','afternoon','rainbow','leaves',78],['bridge','twilight','storm','fish',48]]){
    await page.evaluate(args=>window.__journey.look(...args),look);await page.waitForTimeout(80);
    if(width===390&&lang==='zh-Hant'||width===1100&&lang==='en')await page.screenshot({path:path.join(out,`${width}-${lang}-${look[0]}.png`)});
   }
   await page.evaluate(()=>window.__journey.end());await page.waitForFunction(()=>window.__journey.get().mode==='result');
   assert(await page.locator('#gameover-screen').isVisible());assert.equal(await page.locator('[data-screen-field="level"]').count(),0);assert(await page.locator('.journey-find').count()>0);
   assert.equal(await page.locator('#gameover-screen .journey-details,#gameover-screen .toenow-result-heading,#gameover-screen .modal-subtitle,#gameover-screen [data-membership-invite]').count(),0);
   await page.locator('#rest').click();assert(await page.locator('#rest-panel').isVisible());assert.equal(await page.locator('#gameover-screen').isVisible(),false);
   await page.locator('#resume').click();assert.equal((await page.evaluate(()=>window.__journey.get())).mode,'result');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('capybara_drift_progress_v1')).session),null);
   await page.waitForTimeout(450);await page.screenshot({path:path.join(out,`${width}-${lang}-result.png`)});
   await page.locator('#btn-retry').click();assert.notEqual((await page.evaluate(()=>window.__journey.get())).trip.id,restored.trip.id);
   await page.locator('#rest').click();await page.locator('#finish').click();await page.locator('#btn-title').click();
   const before=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort()));
   await page.locator('#btn-journey-practice').click();assert((await page.evaluate(()=>window.__journey.get())).isPractice);
   await page.evaluate(()=>{window.__journey.collect();window.__journey.material();});await page.waitForTimeout(120);await page.evaluate(()=>window.__journey.end());await page.waitForFunction(()=>window.__journey.get().mode==='result');
   assert.equal(await page.evaluate(()=>JSON.stringify(Object.entries(localStorage).sort())),before);
   assert.deepEqual(errors,[]);checks++;console.log(`PASS ${width}x${height} ${lang}: horizontal right-to-left flow, vertical touch steering, pickups, pause/book, material cap/reload, finite landing, retry, practice`);await page.close();
  }
  const hub=await browser.newPage({viewport:{width:1100,height:850}});await instrument(hub);hub.setDefaultTimeout(15000);console.log('Hub: opening');await hub.goto(base+'/',{waitUntil:'domcontentloaded',timeout:20000});console.log('Hub: ready');await hub.locator('#welcomeGuestBtn').click();await hub.locator('#open-capybara').click();const frame=hub.frameLocator('#gameViewer');await frame.locator('#btn-start').click();await hub.locator('#theaterGameActions').getByRole('button',{name:'Restart Run'}).click();await frame.locator('#play-hud').waitFor({state:'visible'});await hub.locator('#theaterGameActions').getByRole('button',{name:'Pause Game'}).click();await frame.locator('#resume').click();await frame.locator('body').evaluate(()=>window.__journey.end());await frame.locator('#gameover-screen').waitFor({state:'visible'});await hub.locator('#theaterGameActions').getByRole('button',{name:'Pause Game'}).click();assert(await frame.locator('#rest-panel').isVisible());await frame.locator('#resume').click();assert(await frame.locator('#gameover-screen').isVisible());await hub.locator('#theaterGameActions').getByRole('button',{name:'Pause Game'}).click();await frame.locator('#rest-hub').click();await hub.waitForFunction(()=>document.getElementById('theaterModal').getAttribute('aria-hidden')==='true');await hub.close();
  console.log(`PASS ${checks} journey combinations and Hub launch/restart/exit`);
 }finally{let timer;await Promise.race([browser.close(),new Promise(r=>timer=setTimeout(r,5000))]);clearTimeout(timer);}
}
run().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
