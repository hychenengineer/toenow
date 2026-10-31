const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const out=path.join(__dirname,'../artifacts/carefree-farm');fs.mkdirSync(out,{recursive:true});
const KEY='toenow_carefree_farm_v1';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];let checks=0;
 try{
  const context=await browser.newContext({viewport:{width:1100,height:1000}});const p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  const click=async selector=>{await p.locator(selector).click();await p.waitForFunction(()=>document.getElementById('play').getAttribute('aria-busy')!=='true');};
  await p.addInitScript(()=>localStorage.setItem('toenow_language_v1','zh-Hant'));
  await p.clock.install({time:new Date('2026-10-30T12:00:00Z')});
  await p.goto(base+'/games/carefree-farm/');await click('#btn-start');
  assert.equal(await p.locator('.plot.empty').count(),3);assert.equal(await p.locator('.roaming-animal').count(),1);checks++;
  await p.screenshot({path:path.join(out,'desktop-fields.png'),fullPage:true});
  await click('#tab-pasture');await p.screenshot({path:path.join(out,'desktop-pasture.png'),fullPage:true});
  await click('[data-feed="grass"]');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).animals[0].due>Date.now(),KEY);await p.clock.fastForward(41000);await click('[data-action="gift"]');
  assert((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)).unlocked.includes('clover'));checks++;
  for(let n=0;n<2;n++){await click('[data-feed="grass"]');await p.clock.fastForward(41000);}
  assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)).animals[0].growth,2); // third meal is persisted as due; reload settles it
  await p.reload();await click('#btn-start');await click('#tab-pasture');
  assert.equal(await p.locator('[role="progressbar"]').getAttribute('aria-valuenow'),'3');checks++;
  await click('#tab-fields');
  for(let i=0;i<3;i++)await click(`[data-plot="${i}"]`);await p.clock.fastForward(31000);
  assert.match(await p.locator('.plot.ready').first().textContent(),/收成/);
  await p.screenshot({path:path.join(out,'current-game-fields.png'),fullPage:true});
  for(let i=0;i<3;i++)await click(`[data-plot="${i}"]`);
  await click('[data-crop="carrot"]');for(let i=0;i<3;i++)await click('[data-plot="'+i+'"]');await p.clock.fastForward(51000);for(let i=0;i<3;i++)await click('[data-plot="'+i+'"]');
  await click('#inventory-open');for(const id of ['grass','carrot']){await click('[data-sell="'+id+'"]');await click('[data-sale-all]');await click('[data-confirm-sale]');}await click('#panel-close');
  await click('#growth-open');assert.equal(await p.locator('[data-action="upgrade"]').isEnabled(),true);await click('[data-action="upgrade"]');
  assert.equal((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)).level,2);checks++;
  await p.screenshot({path:path.join(out,'milestones.png'),fullPage:true});await click('#panel-close');
  assert.equal(await p.locator('.plot.empty').count(),6);
  await click('#shop-open');assert.equal(await p.locator('[data-buy="cow"]').isEnabled(),false);await click('[data-shop-tab="crops"]');assert.equal(await p.locator('.crop-card').count(),12);await p.screenshot({path:path.join(out,'crop-collection.png'),fullPage:true});await click('#panel-close');checks++;
  // A completed growth cycle is never replayed by repeated reloads.
  await p.reload();await click('#btn-start');await p.reload();await click('#btn-start');
  const grown=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.equal(grown.animals[0].growth,3);checks++;
  // Full real UI visit lifecycle and preview isolation.
  await click('#rest');await click('#finish');await click('#btn-title');
  const before=await p.evaluate(()=>({...localStorage}));await click('#btn-farm-practice');await click('[data-plot="0"]');await click('#tab-pasture');await click('[data-feed="grass"]');await p.clock.fastForward(61000);await click('[data-action="gift"]');await click('#rest');await click('#finish');assert.deepEqual(await p.evaluate(()=>({...localStorage})),before);checks++;
  // Responsive layouts, bilingual UI and image loading.
  for(const width of [390,1100])for(const lang of ['en','zh-Hant']){
   const q=await browser.newPage({viewport:{width,height:900}});q.on('pageerror',e=>errors.push(e.message));await q.addInitScript(l=>localStorage.setItem('toenow_language_v1',l),lang);await q.goto(base+'/games/carefree-farm/');await q.locator('#btn-start').click();
   assert.equal(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.match(await q.locator('#farm-level').textContent(),lang==='en'?/Farm level/:/農場等級/);
   await q.screenshot({path:path.join(out,`${width}-${lang}-fields.png`),fullPage:true});await q.locator('#tab-pasture').click();
   await q.locator('.roaming-animal img').evaluate(img=>img.decode());await q.screenshot({path:path.join(out,`${width}-${lang}-pasture.png`),fullPage:true});checks++;await q.close();
  }
  // Malformed saves survive untouched. No reset or automatic overwrite.
  const bad=await browser.newPage();await bad.addInitScript(k=>localStorage.setItem(k,'{broken'),KEY);await bad.goto(base+'/games/carefree-farm/');await bad.locator('#btn-start').click();await bad.locator('[data-plot="0"]').click();assert.equal(await bad.evaluate(k=>localStorage.getItem(k),KEY),'{broken');assert(await bad.locator('#save-warning').isVisible());await bad.close();checks++;
  // Later-game layout fixture; purchases and planting still use the real UI.
  const F=require('../games/carefree-farm/model.js'),fixture=F.create(Date.now());fixture.level=5;fixture.coins=2000;fixture.plots=Array(15).fill(null);fixture.unlocked=Object.keys(F.CROPS);
  const mature=await browser.newPage({viewport:{width:1100,height:1000}});mature.on('pageerror',e=>errors.push(e.message));await mature.clock.install();await mature.addInitScript(({key,fixture})=>{localStorage.setItem(key,JSON.stringify(fixture));localStorage.setItem('toenow_language_v1','zh-Hant');},{key:KEY,fixture});await mature.goto(base+'/games/carefree-farm/');
  const mclick=async selector=>{await mature.locator(selector).click();await mature.waitForFunction(()=>document.getElementById('play').getAttribute('aria-busy')!=='true');};
  await mclick('#btn-start');await mclick('#shop-open');for(const species of ['pig','cow','alpaca','llama','sheep','sheep','sheep'])await mclick(`[data-buy="${species}"]`);
  assert.equal(await mature.locator('[data-buy]:enabled').count(),0);await mclick('#panel-close');assert.equal(await mature.locator('.roaming-animal').count(),8);assert.equal(await mature.locator('.animal-placeholder').count(),0);await mature.clock.fastForward(5000);await mature.screenshot({path:path.join(out,'expanded-pasture.png'),fullPage:true});
  await mclick('#tab-fields');for(let i=0;i<15;i++){await mclick(`[data-crop="${Object.keys(F.CROPS)[i%12]}"]`);await mclick(`[data-plot="${i}"]`);}await mature.clock.fastForward(151000);
  assert.equal(await mature.locator('.plot.ready').count(),15);await mature.screenshot({path:path.join(out,'expanded-fields.png'),fullPage:true});
  await mature.setViewportSize({width:390,height:900});assert(await mature.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mclick('#tab-pasture');assert(await mature.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mature.close();checks++;
  // Real Hub route, iframe, restart and return contract.
  const hub=await browser.newPage();hub.on('pageerror',e=>errors.push(e.message));await hub.goto(base+'/');
  if(await hub.locator('#islandWelcome').isVisible())await hub.locator('#welcomeGuestBtn').click();
  const order=await hub.evaluate(()=>{const spring=document.querySelector('[aria-labelledby="carefree-entry-title"]'),farm=document.querySelector('[aria-labelledby="carefree-farm-title"]');return {adjacent:spring.nextElementSibling===farm,springBottom:spring.getBoundingClientRect().bottom,farmTop:farm.getBoundingClientRect().top};});
  assert.equal(order.adjacent,true);assert(order.farmTop>=order.springBottom,'Farm entry is below the hot spring');
  await hub.locator('#open-carefree-farm').click();const farm=hub.frameLocator('#gameViewer');await farm.locator('#btn-start').click();await farm.locator('[data-plot="0"]').click();
  await hub.evaluate(()=>document.getElementById('gameViewer').contentWindow.postMessage({type:'GAME_RESTART'},location.origin));await farm.locator('#tab-pasture').click();assert.equal(await farm.locator('.roaming-animal').count(),1);await farm.locator('#back-hub').click();checks++;await hub.close();
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors,artifacts:out},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
