const { chromium } = require('playwright');
const a = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const out = path.resolve(__dirname, '../artifacts/garden-touch-postcards');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const [width,height,lang] of [[1024,768,'en'],[390,844,'zh-Hant'],[320,568,'en'],[844,390,'en']]){
   const p=await browser.newPage({viewport:{width,height},hasTouch:true}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(lang=>localStorage.setItem('toenow_language_v1',lang),lang);
   await p.route('**/garden-main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('view=new window.GardenRenderer(canvas);await view.ready;','view=new window.GardenRenderer(canvas);window.__gardenView=view;await view.ready;')});});
   await p.goto(base+'/games/capybara-drift/');await p.locator('#btn-start').click();
   await p.locator('[data-tool="flowers"]').click();
   const cells=()=>p.evaluate(()=>JSON.parse(localStorage.getItem(CapybaraGarden.KEY)).cells);
   const original=await cells(),client=await p.context().newCDPSession(p),x=width/2,y=height*.44;
   const touch=(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id,radiusX:5,radiusY:5}))});
   // First finger lands before second: it must not build an accidental tile.
   await touch('touchStart',[[x-35,y,1]]);await touch('touchStart',[[x-35,y,1],[x+35,y,2]]);
   await touch('touchMove',[[x-65,y,1],[x+65,y,2]]);await p.waitForTimeout(60);
   const zoom=await p.evaluate(()=>__gardenView.zoom);a(zoom>1.4,'Pinch must enlarge the garden');
   await touch('touchEnd',[[x+65,y,2]]);await touch('touchMove',[[x+70,y+5,2]]);await touch('touchEnd',[]);
   a.deepEqual(await cells(),original,'Pinch and remaining finger must not build');
   await touch('touchStart',[[x-65,y,1],[x+65,y,2]]);
   await touch('touchMove',[[x-35,y,1],[x+35,y,2]]);await touch('touchEnd',[]);
   a((await p.evaluate(()=>__gardenView.zoom))<zoom,'Pinch inward shrinks the garden');
   await touch('touchStart',[[x,y,1]]);await touch('touchCancel',[]);a.deepEqual(await cells(),original,'Cancelled touch must not build');
   await p.locator('#pan-toggle').click();
   const before=await p.evaluate(()=>({x:__gardenView.ox,y:__gardenView.oy}));
   await touch('touchStart',[[x,y,1]]);await touch('touchMove',[[x+45,y+20,1]]);await touch('touchEnd',[]);await p.waitForTimeout(60);
   const after=await p.evaluate(()=>({x:__gardenView.ox,y:__gardenView.oy}));a(Math.abs(after.x-before.x-45)<1);a(Math.abs(after.y-before.y-20)<1);
   a.deepEqual(await cells(),original,'Pan must not build');
   await p.locator('#recenter').click();await p.locator('#pan-toggle').click();
   const at=await p.evaluate(()=>__gardenView.point(2,0));await p.touchscreen.tap(at.x,at.y);a((await cells()).some(c=>c.q===2&&c.r===0&&c.type==='flowers'));
   await p.locator('#postcard').click();await p.waitForTimeout(700);
   const saved=await cells();
   await p.locator('#garden').focus();await p.keyboard.press('ArrowLeft');await p.keyboard.press('Enter');
   const edited=await cells();a.notDeepEqual(edited,saved);
   await p.reload();await p.locator('#btn-start').click();await p.locator('#album-open').click();
   await p.locator('.postcard-open').first().click();await p.locator('#postcard-detail').waitFor({state:'visible'});
   a(await p.locator('#postcard-detail canvas').evaluate(c=>c.width>=800));
   await p.locator('#postcard-back').click();await p.locator('.postcard-open').first().click();
   // A failed restore write must leave both the saved and active gardens intact.
   const stored=await p.evaluate(()=>localStorage.getItem(CapybaraGarden.KEY));
   await p.evaluate(()=>{window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('quota');};});
   await p.locator('#postcard-continue').click();a.equal(await p.locator('#book').evaluate(d=>d.open),true);
   a.equal(await p.evaluate(()=>localStorage.getItem(CapybaraGarden.KEY)),stored);
   await p.evaluate(()=>{Storage.prototype.setItem=window.__setItem;});
   await p.locator('#book-close').click();await p.locator('#rest').click();await p.locator('#resume').click();
   a.deepEqual(await cells(),edited,'Failed restore must roll back the active garden');
   await p.locator('#album-open').click();await p.locator('.postcard-open').first().click();
   await p.screenshot({path:path.join(out,`${width}-${lang}-postcard.png`)});
   await p.locator('#postcard-continue').click();
   a.deepEqual(await cells(),saved,'Continue restores saved layout');
   a(await p.evaluate(old=>JSON.parse(localStorage.getItem(CapybaraGarden.KEY)).postcards.some(c=>JSON.stringify(c.cells)===JSON.stringify(old)),edited),'Previous garden is backed up');
   await p.reload();await p.locator('#btn-start').click();a.deepEqual(await cells(),saved);
   await p.screenshot({path:path.join(out,`${width}-${lang}-garden.png`)});
   // Preview can view/restore its own postcards without overwriting durable progress.
   await p.locator('#rest').click();await p.locator('#finish').click();await p.locator('#btn-title').click();
   const baseline=await p.evaluate(()=>({...localStorage}));
   await p.locator('#btn-journey-practice').click();await p.locator('#postcard').click();await p.waitForTimeout(700);
   await p.locator('#album-open').click();await p.locator('.postcard-open').first().click();await p.locator('#postcard-continue').click();
   a.deepEqual(await p.evaluate(()=>({...localStorage})),baseline);a.deepEqual(errors,[]);
   console.log('PASS',width,height,lang,'pinch, cancel, pan, tap, reopen, restore, backup, quota rollback, preview');await p.close();
  }
  const hub=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true}),errors=[];hub.on('pageerror',e=>errors.push(e.message));
  await hub.goto(base+'/');if(await hub.locator('#welcomeGuestBtn').isVisible())await hub.locator('#welcomeGuestBtn').click();
  await hub.locator('#open-capybara').click();const f=hub.frameLocator('#gameViewer');await f.locator('#btn-start').click();
  await f.locator('#pan-toggle').click();a.equal(await f.locator('#pan-toggle').getAttribute('aria-pressed'),'true');
  await f.locator('#postcard').click();await hub.waitForTimeout(700);await f.locator('#album-open').click();
  await f.locator('.postcard-open').first().click();await f.locator('#postcard-continue').click();
  await f.locator('#back-hub').click();await hub.waitForFunction(()=>document.querySelector('#gameViewer').getAttribute('src')==='about:blank');
  a.deepEqual(errors,[]);await hub.close();console.log('PASS Hub iframe postcard restore and exit');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
