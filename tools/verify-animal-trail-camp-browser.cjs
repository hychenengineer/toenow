const {restartAnimalGame,startAnimalGame}=require('./lib/animal-journey-driver.cjs');
const {prepareJourneyAction}=require('./lib/animal-journey-driver.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chooseAction}=require('./lib/animal-siege-driver.cjs');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774',dir=path.resolve(__dirname,'../artifacts/animal-trail-camp');
async function run(){fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const [width,lang] of [[1280,'zh-Hant'],[390,'en'],[320,'zh-Hant']]){
 const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','skipped');localStorage.setItem('animal_siege_best_score_v1','17');localStorage.setItem('animal_siege_best_wave_v1','2');},lang);
 const source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace('},650);','},80);').replace(/\}\)\(\);\s*$/,'window.__trailCamp=()=>structuredClone({run,state,scene,campBuilding,isPractice});})();');
 await p.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:source}));await p.goto(base+'/games/animal-siege/?mode=expedition');await startAnimalGame(p);
 const snap=()=>p.evaluate(()=>window.__trailCamp()),click=async selector=>{if(await prepareJourneyAction(p,selector))return;
  if(selector==='[data-enter-camp]'&&await p.locator('#expedition').isVisible()&&!await p.locator('#location-dialog').isVisible())await p.locator('[data-location="home"]').click();
  if(selector==='[data-enter-trail="cache"]'&&!await p.locator('#location-dialog').isVisible())await p.locator('[data-location="cache"]').click();
  const el=p.locator(selector).filter({visible:true});return width<700?el.tap():el.click();};
 const idle=()=>p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');
 const act=async s=>{const a=chooseAction(s);if(!a){await click('#end-turn');await p.waitForFunction(()=>!window.__trailCamp().state||window.__trailCamp().state.phase!=='enemy');await idle();return;}
  await click('[data-unit="'+a.id+'"]');const u=s.units.find(u=>u.id===a.id);if(u.x!==a.x||u.y!==a.y){await click('[data-cell="'+a.x+','+a.y+'"]');await click('#confirm-move');await idle();}
  if(a.target){const t=s.units.find(u=>u.id===a.target);await click('[data-cell="'+t.x+','+t.y+'"]');await click('#confirm-attack');await idle();}else await click('#defend');};
 assert.equal(await p.locator('[data-enter-camp]').count(),1,'camp entry is explicit');await click('[data-enter-camp]');assert.equal(await p.locator('#camp').isVisible(),true);
 assert.equal(await p.locator('.camp-building').count(),3);await click('[data-building="beaver"]');await click('[data-recruit="beaver"][data-amount="3"]');assert.equal((await snap()).run.gold,30);assert.equal((await snap()).run.army.beaver,108);
 assert.equal(await p.locator('[data-upgrade="beaver"]').isDisabled(),true);await click('#unit-guide-open');await click('#unit-guide-close');assert.equal((await snap()).scene,'camp');assert.equal((await snap()).campBuilding,'beaver');
 await p.evaluate(async()=>{const i=new Image();i.src='../../assets/animal-siege/camp-interior-v1.webp';await i.decode();});await p.screenshot({path:path.join(dir,width+'-'+lang+'-camp.png'),fullPage:true});
 await click('#camp-exit');await click('[data-location="cache"]');await click('[data-explore="cache"]');assert.equal((await snap()).run.sites.cache.stage,'clues');assert.equal(await p.locator('[data-claim="cache"]').count(),0);
 await click('#trail-exit');await click('[data-enter-trail="cache"]');assert.equal((await snap()).run.sites.cache.stage,'clues');await click('[data-investigate="cache"]');assert.equal((await snap()).run.sites.cache.stage,'guards');
 const guards=structuredClone((await snap()).run.sites.cache.guardHP);await click('#trail-exit');await click('[data-enter-trail="cache"]');assert.deepEqual((await snap()).run.sites.cache.guardHP,guards);
 await p.evaluate(async()=>{const i=new Image();i.src='../../assets/animal-siege/forest-trail-v1.webp';await i.decode();});await p.screenshot({path:path.join(dir,width+'-'+lang+'-guards.png'),fullPage:true});
 await click('[data-trail-fight="cache"]');assert.equal(await p.locator('.tile.wall,.tile.gate').count(),0);assert.equal(await p.locator('.siege-flag').isVisible(),false);await p.screenshot({path:path.join(dir,width+'-'+lang+'-battle.png'),fullPage:true});
 await click('#end-turn');await p.waitForFunction(()=>window.__trailCamp().state.phase==='player');await idle();await act((await snap()).state);const beforeRetreat=(await snap()).state;
 const hp=team=>Object.fromEntries(beforeRetreat.units.filter(u=>u.team===team).map(u=>[u.kind,u.hp]));await click('#restart');await p.locator('#trail').waitFor({state:'visible'});
 assert.deepEqual((await snap()).run.army,hp('player'));assert.deepEqual((await snap()).run.sites.cache.guardHP,hp('enemy'));assert.equal((await snap()).run.gold,30);
 await click('[data-trail-fight="cache"]');for(let i=0;i<160&&(await snap()).state;i++)await act((await snap()).state);
 await p.locator('#trail').waitFor({state:'visible'});let r=(await snap()).run;assert.equal(r.sites.cache.stage,'loot');assert.equal(r.gold,30);assert.equal(Object.values(r.forts).filter(f=>f.captured).length,0);
 await click('[data-claim="cache"][data-choice="wood"]');r=(await snap()).run;assert.equal(r.wood,60);assert.equal(r.sites.cache.claimed,true);assert.equal(await p.locator('[data-claim="cache"]').count(),0);
 await click('[data-enter-camp]');await click('[data-building="beaver"]');await click('[data-upgrade="beaver"]');assert.equal((await snap()).run.upgrades.beaver,true);assert.equal((await snap()).run.wood,25);
 await p.evaluate(l=>ToenowI18n.setLanguage(l==='en'?'zh-Hant':'en'),lang);assert.equal((await snap()).campBuilding,'beaver');assert.match(await p.locator('#camp').innerText(),/已升級|Trained/);
 await click('#camp-exit');await click('[data-location="cache"]');await click('[data-enter-trail="cache"]');assert.equal(await p.locator('[data-claim="cache"]').count(),0);
 assert.deepEqual(await p.evaluate(()=>[localStorage.getItem('animal_siege_best_score_v1'),localStorage.getItem('animal_siege_best_wave_v1')]),['17','2']);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 await restartAnimalGame(p);assert.equal((await snap()).scene,'map');assert.equal((await snap()).run.gold,90);assert.equal((await snap()).run.sites.cache.stage,'hidden');assert.equal(await p.locator('#camp').isVisible(),false);assert.equal(await p.locator('#trail').isVisible(),false);
 console.log('PASS '+width+' '+lang+': camp buildings, real recruit/train, trail clues/guards, optional leave, persistent retreat, real victory, once-only loot, language and restart');await p.close();
}}finally{await browser.close();}}
run().catch(e=>{console.error(e);process.exitCode=1;});


