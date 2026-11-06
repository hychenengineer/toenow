const {prepareJourneyAction,startAnimalPractice}=require('./lib/animal-journey-driver.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../games/animal-siege/engine.js');
const C=require('../games/animal-siege/campaign.js');
const {chooseAction}=require('./lib/animal-siege-driver.cjs');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const dir=path.resolve(__dirname,'../artifacts/animal-expedition');
async function instrument(p){
  let source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8');
  // Speed up only the enemy presentation delay. All rules, decisions and UI actions remain real.
  source=source.replace('},650);','},80);').replace(/\}\)\(\);\s*$/,'window.__expSnapshot=()=>structuredClone({run,state,paused,isPractice});window.__outcomeTest=result=>{run.result=result;endExpedition();};})();');
  await p.route('**/games/animal-siege/main.js*',route=>route.fulfill({contentType:'application/javascript',body:source}));
}
const snapshot=p=>p.evaluate(()=>window.__expSnapshot());
async function click(p,selector){if(await prepareJourneyAction(p,selector))return;if(selector.includes('data-location')&&await p.locator('#location-dialog').isVisible())await p.locator('#location-close').click();if(selector==='[data-enter-camp]'&&await p.locator('#expedition').isVisible()&&!await p.locator('#location-dialog').isVisible())await p.locator('[data-location="home"]').click();const l=p.locator(selector).filter({visible:true});if(p.viewportSize().width<700)await l.tap();else await l.click();}
async function map(p){await p.locator('#expedition').waitFor({state:'visible'});}
async function fight(p,id){await click(p,'[data-location="'+id+'"]');await click(p,'[data-attack="'+id+'"]');await p.locator('#battle').waitFor({state:'visible'});}
async function playerAction(p,s,a){
  await click(p,'[data-unit="'+a.id+'"]');const u=s.units.find(u=>u.id===a.id);
  if(u.x!==a.x||u.y!==a.y){await click(p,'[data-cell="'+a.x+','+a.y+'"]');await click(p,'#confirm-move');await p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');}
  if(a.target){const t=s.units.find(u=>u.id===a.target),selector='[data-cell="'+t.x+','+t.y+'"]';await click(p,selector);assert.match(await p.locator('#preview').innerText(),/damage|傷害/);await click(p,'#confirm-attack');await p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');}
  else await click(p,'#defend');
}
async function endTurn(p){await click(p,'#end-turn');await p.waitForFunction(()=>{const s=window.__expSnapshot();return (!s.state||s.state.phase!=='enemy')&&document.getElementById('board').getAttribute('aria-busy')!=='true';});}
async function autoBattle(p){
  for(let actions=0;actions<180;actions++){
    const {state:s,run}=await snapshot(p);if(!s||run.result)return;
    assert.equal(s.phase,'player');assert.ok(s.round<40,'battle must remain completable');
    const a=chooseAction(s);if(a)await playerAction(p,s,a);else await endTurn(p);
  }
  throw Error('too many player actions');
}
async function supplies(p){
  for(const [id,choice] of [['friends','fox'],['timber','wood'],['cache','gold']]){
    await click(p,'[data-location="'+id+'"]');await click(p,'[data-explore="'+id+'"]');if(id==='cache'){await click(p,'[data-investigate="cache"]');await click(p,'[data-trail-fight="cache"]');await autoBattle(p);}await click(p,'[data-claim="'+id+'"][data-choice="'+choice+'"]');
    assert.equal((await snapshot(p)).run.sites[id].claimed,true);if(id==='cache')await click(p,'#trail-exit');
    assert.equal(await p.locator('[data-claim="'+id+'"]').count(),0,'discovery cannot be claimed twice');
  }
  await click(p,'.map-node[data-location="home"]');
  const beforeRecruit=(await snapshot(p)).run.army.fox;await click(p,'[data-enter-camp]');
  for(const k of ['squirrel','beaver']){await click(p,'[data-building="'+k+'"]');await click(p,'[data-upgrade="'+k+'"]');}
  for(const [k,n] of [['squirrel',3],['beaver',3],['fox',1]]){await click(p,'[data-building="'+k+'"]');await click(p,'[data-recruit="'+k+'"][data-amount="'+n+'"]');}await click(p,'#camp-exit');
  const {run}=await snapshot(p);assert.equal(run.gold,31);assert.equal(run.wood,0);assert.equal(run.army.fox,beforeRecruit+8);
}
async function expedition(p,practice){
  await supplies(p);
  for(const id of ['acorn','river','tower']){
    const {run:before}=await snapshot(p);await fight(p,id);await autoBattle(p);const {run}=await snapshot(p);
    assert.equal(run.forts[id].captured,true,JSON.stringify({id,army:run.army,guards:run.forts[id].hp,gold:run.gold,wood:run.wood}));assert.equal(run.gold,before.gold+C.FORTS[id].gold);
    if(id!=='tower'){
      await map(p);assert.equal(await p.locator('#gameover-screen').isVisible(),false);
      assert.equal(run.battleReport.id,id);assert.equal(run.battleReport.outcome,'victory');assert.ok(run.battleReport.counterHits>0);
      if(!practice)await p.screenshot({path:path.join(dir,p.viewportSize().width+'-'+(await p.evaluate(()=>ToenowI18n.language))+'-'+id+'-report.png'),fullPage:true});
      assert.equal(await p.evaluate(()=>localStorage.getItem('animal_siege_best_score_v1')),'17','no score persistence between forts');
      await click(p,'[data-enter-camp]');await click(p,'[data-building="fox"]');
      if(await p.locator('[data-upgrade="fox"]').isEnabled())await click(p,'[data-upgrade="fox"]');
      for(const k of (id==='river'?['squirrel']:['squirrel','beaver','fox'])){await click(p,'[data-building="'+k+'"]');if(await p.locator('[data-recruit="'+k+'"][data-amount="3"]').isEnabled())await click(p,'[data-recruit="'+k+'"][data-amount="3"]');}await click(p,'#camp-exit');
    }
  }
  await p.locator('#gameover-screen').waitFor({state:'visible'});const {run}=await snapshot(p);
  assert.equal(run.result,'victory');const score=C.score(run);
  const language=await p.evaluate(()=>ToenowI18n.language);
  await p.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));assert.match(await p.locator('#outcome').innerText(),/遠征成功/);
  await p.evaluate(()=>ToenowI18n.setLanguage('en'));assert.match(await p.locator('#outcome').innerText(),/Expedition complete/);
  await p.evaluate(language=>ToenowI18n.setLanguage(language),language);
  assert.equal(await p.locator('[data-screen-field="score"]').innerText(),score.toLocaleString('en-US'));
  const saved=await p.evaluate(()=>[localStorage.getItem('animal_siege_best_score_v1'),localStorage.getItem('animal_siege_best_wave_v1')]);
  assert.deepEqual(saved,practice?['17','2']:[String(score),'3']);
  await p.evaluate(()=>{ToenowLevels.shareScore=data=>window.__sharedExpedition=data;});await click(p,'[data-screen-action="share"]');assert.equal(await p.evaluate(()=>window.__sharedExpedition.score),score);
  return run;
}
async function retreatCheck(p){
  await fight(p,'acorn');await endTurn(p);let {state:s}=await snapshot(p);assert.ok(s.units.find(u=>u.id==='p-beaver').hp<72);
  const a=chooseAction(s);await playerAction(p,s,a);s=(await snapshot(p)).state;
  const allyHP=Object.fromEntries(s.units.filter(u=>u.team==='player').map(u=>[u.kind,u.hp]));
  const enemyHP=Object.fromEntries(s.units.filter(u=>u.team==='enemy').map(u=>[u.kind,u.hp]));
  await click(p,'#restart');await map(p);const {run}=await snapshot(p);assert.deepEqual(run.army,allyHP);assert.deepEqual(run.forts.acorn.hp,enemyHP);assert.equal(run.gold,90);
  await fight(p,'acorn');const next=(await snapshot(p)).state;for(const u of next.units)assert.equal(u.hp,u.team==='player'?allyHP[u.kind]:enemyHP[u.kind]);await click(p,'#restart');await map(p);
}
async function recoveryCheck(p){
  await fight(p,'acorn');
  for(let turns=0;turns<35&&(await snapshot(p)).state;turns++)await endTurn(p);
  await map(p);const before=(await snapshot(p)).run;assert.equal(Object.values(before.army).reduce((a,b)=>a+b,0),0);assert.equal(before.result,null);
  await click(p,'[data-enter-camp]');await click(p,'[data-building="squirrel"]');await click(p,'[data-recruit="squirrel"][data-amount="1"]');await click(p,'#camp-exit');const after=(await snapshot(p)).run;assert.equal(after.army.squirrel,6);assert.equal(after.gold,before.gold-18);
}
async function resetFromMap(p){await click(p,'#menu');await click(p,'#title-button');await click(p,'#btn-start');await map(p);}
async function run(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const cases=[[1280,'zh-Hant'],[390,'zh-Hant'],[390,'en']].filter(([width])=>!process.env.TOENOW_EXPEDITION_WIDTH||Number(process.env.TOENOW_EXPEDITION_WIDTH)===width);
    for(const [width,lang] of cases){
      const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:process.env.TOENOW_TEST_REDUCED_MOTION==='1'?'reduce':'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.addInitScript(lang=>{localStorage.setItem('toenow_language_v1',lang);localStorage.setItem('animal_siege_hands_on_v2','completed');localStorage.setItem('animal_siege_best_score_v1','17');localStorage.setItem('animal_siege_best_wave_v1','2');},lang);
      await instrument(p);await p.goto(base+'/games/animal-siege/?mode=classic');await click(p,'#btn-start');await map(p);
      assert.equal(await p.locator('[data-enter-camp]').count(),1);
      await p.locator('#expedition img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));assert.equal(await p.locator('.map-node').count(),7);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-map.png'),fullPage:true});
      await p.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));assert.match(await p.locator('#expedition h1').innerText(),/迷霧/);await p.evaluate(lang=>ToenowI18n.setLanguage(lang),lang);
      if(width===1280){await retreatCheck(p);await resetFromMap(p);await recoveryCheck(p);await resetFromMap(p);}
      const completed=await expedition(p,false);await p.screenshot({path:path.join(dir,width+'-'+lang+'-complete.png'),fullPage:true});
      await click(p,'#btn-retry');await map(p);assert.equal((await snapshot(p)).run.gold,90);assert.equal((await snapshot(p)).run.army.beaver,72);
      await click(p,'#menu');await click(p,'#title-button');
      await p.evaluate(()=>{localStorage.setItem('animal_siege_best_score_v1','17');localStorage.setItem('animal_siege_best_wave_v1','2');});
      await startAnimalPractice(p);await map(p);assert.equal((await snapshot(p)).isPractice,true);
      await expedition(p,true);await click(p,'#btn-title');await p.locator('#title-screen').waitFor({state:'visible'});
      if(width===1280){
        // Isolate defeat-banner localization from battle balance; practice protects records.
        await startAnimalPractice(p);
        await p.evaluate(()=>window.__outcomeTest('defeat'));
        await p.evaluate(()=>ToenowI18n.setLanguage('en'));assert.match(await p.locator('#outcome').innerText(),/No troops/);
        await p.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));assert.match(await p.locator('#outcome').innerText(),/遠征結束/);
      }
      assert.deepEqual(errors,[]);
      console.log('PASS '+width+' '+lang+': map/discoveries, scouting, real recruitment/upgrades, three legal victories, final score '+C.score(completed)+', practice isolation, replay/title'+(width===1280?', persistent retreat and wipe/recruit recovery':''));await p.close();
    }
  }finally{await browser.close();}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});





