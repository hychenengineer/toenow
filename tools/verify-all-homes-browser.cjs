const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path');
const materials=require('../shared/toenow-materials.js'),config=require('../shared/toenow-homes-config.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765',out=process.env.TOENOW_HOMES_OUTPUT_DIR||path.resolve(__dirname,'../artifacts/all-animal-homes/browser');
const ids=process.env.TOENOW_TEST_HOME_IDS?.split(',')||Object.keys(materials.ITEMS),values={};
const journey=require('../shared/toenow-exploration.js').create({storage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},levels:require('../shared/toenow-levels.js'),gameIds:Object.keys(materials.ITEMS)});
journey.chooseGuest();for(const id of journey.snapshot().order)journey.complete({gameId:id,wave:6});journey.dismissDiscovery();journey.dismissLeaderboardNotice();
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const origin=new URL(base).origin;
 await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await context.addInitScript(s=>{if(!localStorage.getItem('toenow_exploration_v3'))localStorage.setItem('toenow_exploration_v3',JSON.stringify(s));},journey.snapshot());
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 async function open(id){await page.locator(`[data-island-game="${id}"]`).click();await page.locator(`.animal-home[data-home-id="${id}"]`).waitFor();}
 async function selectProject(index=0){await page.locator('[data-rabbit-project]').nth(index).click();}
 async function read(){return page.evaluate(()=>ToenowMaterials.create({storage:localStorage}).snapshot());}
 async function set(state){await page.evaluate(s=>{localStorage.setItem('toenow_materials_v1',JSON.stringify(s));window.dispatchEvent(new Event('focus'));},state);}
 for(const id of ids){
  const c=config.get(id);await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>ToenowI18n.setLanguage('en'));
  const state=await read();state.homes[id]={stage:1,owned:[],placed:[]};for(const key of Object.keys(state.balances))state.balances[key]=0;await set(state);await open(id);
  assert.equal(await page.locator('#islandLocationTitle').innerText(),c.place);assert.equal(await page.locator('[data-home-built]').count(),0);
  await page.locator('.animal-home img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  await page.evaluate(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=()=>reject(Error('Atlas failed '+src));i.src=src;}),c.atlas);
  const lines=new Set();for(let i=0;i<7;i++){lines.add(await page.locator('.rabbit-dialogue p').innerText());await page.locator('.rabbit-home-actions [data-rabbit-action="chat"]').click();}assert(lines.size>=6,id+' distinct chat');
  await page.screenshot({path:path.join(out,c.species+'-starter.png'),animations:'disabled'});
  await selectProject();if(id==='space-scale')await page.screenshot({path:path.join(out,'fox-recipe.png'),animations:'disabled'});const before=JSON.stringify(await read());assert(await page.locator('[data-rabbit-confirm]').isDisabled());
  await selectProject(2);assert.equal(JSON.stringify(await read()),before);assert.equal(await page.locator('[data-home-built]').count(),0);
  assert(await page.locator('[data-rabbit-project]').nth(2).evaluate(n=>n===document.activeElement));await selectProject();
  const rich=await read();for(const key of Object.keys(rich.balances))rich.balances[key]=1000;await set(rich);
  for(const p of c.projects){await page.locator(`[data-rabbit-project="${p.id}"]`).click();await page.locator(`[data-rabbit-confirm="${p.id}"]`).click();await page.locator(`[data-home-built="${p.id}"]`).waitFor();assert.equal((await read()).homes[id].stage,p.stage);if(p.stage===3)await page.screenshot({path:path.join(out,c.species+'-stage3.png'),animations:'disabled'});}
  assert.equal(await page.locator('[data-home-built]').count(),4);await page.locator('[data-rabbit-decor="welcome"]').click();
  for(const kind of ['welcome','together']){await page.locator(`[data-rabbit-decor="${kind}"]`).click();await page.locator(`[data-rabbit-craft="${kind}"]`).click();await page.locator(`[data-rabbit-decoration="${kind}"]`).waitFor();}
  await page.locator('[data-rabbit-decor="welcome"]').click();await page.locator('[data-rabbit-toggle="welcome"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-rabbit-decoration]').length===1);
  // Resource details never navigate or launch; all yard targets remain clickable.
  await selectProject(3);
  assert.equal(await page.locator('.rabbit-workbench button[data-material-source]').count(),0);
  for(const target of await page.locator('[data-rabbit-project], [data-rabbit-decor]').all()){
   await target.click();assert.equal(await page.locator('.rabbit-workbench').count(),1);
   assert.equal(await page.locator('#theaterModal.open').count(),0);
  }
  assert.equal(await page.locator('[data-rabbit-action="build"], [data-rabbit-tab]').count(),0);
  for(const size of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740},{width:844,height:390}])for(const lang of ['en','zh-Hant']){
   await page.setViewportSize(size);await page.evaluate(l=>ToenowI18n.setLanguage(l),lang);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert(await page.locator('.animal-home').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.locator('[data-rabbit-decor="welcome"]').click();assert(await page.locator('.rabbit-workbench').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
   assert(await page.locator('.rabbit-workbench').evaluate(n=>n.getBoundingClientRect().top>=document.querySelector('.rabbit-yard').getBoundingClientRect().bottom-1));
   for(const target of await page.locator('[data-rabbit-project], [data-rabbit-decor]').all())await target.click();
   assert.equal(await page.locator('#theaterModal.open').count(),0);
   if(size.width===390&&lang==='zh-Hant')await page.screenshot({path:path.join(out,c.species+'-complete-mobile.png'),animations:'disabled'});
   await page.locator('[data-rabbit-action="visit"]').click();
  }
  await page.reload();await open(id);assert.equal(await page.locator('[data-home-built]').count(),4);assert.equal(await page.locator('[data-rabbit-decoration]').count(),1);
  await page.keyboard.press('Escape');await page.waitForFunction(id=>document.activeElement.dataset.islandGame===id,id);await page.setViewportSize({width:1100,height:900});await open(id);
  await page.locator('.rabbit-home-actions [data-rabbit-action="play"]').click();await page.locator('#theaterModal.open').waitFor();assert((await page.locator('#gameViewer').getAttribute('src')).includes('/'+id+'/'));await page.frameLocator('#gameViewer').locator(id==='animal-rescue-train'?'#btn-start-game':'[data-toenow-screen="title"]').waitFor();await page.locator('#closeTheaterBtn').click();if(await page.locator('.island-location-dialog').isVisible())await page.keyboard.press('Escape');
  checks.push(`${id}: art, varied chat, four builds, two decorations, six direct plots, non-navigating materials, save reload, 8 responsive/language views, focus and real game launch PASS`);console.log(checks.at(-1));
 }
 // Missing image requests keep the scene actions and character accessible.
 await page.route('**/assets/rabbit-home/background.webp',r=>r.abort());await page.route('**/assets/rabbit-home/rabbit.webp',r=>r.abort());await page.reload();await open('number-pop');await page.locator('.home-background-fallback').waitFor();
 assert((await page.locator('.rabbit-character').innerText()).includes('🐰'));await page.locator('.rabbit-home-actions [data-rabbit-action="chat"]').click();assert(await page.locator('.rabbit-home-actions [data-rabbit-action="play"]').isEnabled());await page.keyboard.press('Escape');checks.push('Missing scene/character image fallback keeps actions usable PASS');
 // Locked homes never expose purchasing or game actions.
 await page.evaluate(()=>{localStorage.removeItem('toenow_exploration_v3');localStorage.removeItem('toenow_materials_v1');});
 const fresh=await browser.newContext();await fresh.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());const locked=await fresh.newPage();await locked.goto(base);await locked.evaluate(()=>document.querySelector('#islandWelcome')?.close());await locked.locator('[data-island-game="block-match"]').click();assert.equal(await locked.locator('.animal-home').count(),0);assert.equal(await locked.locator('[data-rabbit-confirm]').count(),0);assert.equal(await locked.locator('.island-play-button').isVisible(),false);await fresh.close();checks.push('Fresh-player locked homes stay locked PASS');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({homes:ids,checks,errors},null,2));
}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);}})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
