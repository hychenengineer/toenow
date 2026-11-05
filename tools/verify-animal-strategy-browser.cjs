const {prepareJourneyAction}=require('./lib/animal-journey-driver.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
async function run(){
  const dir=path.resolve(__dirname,'../artifacts/animal-strategy');fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{for(const [width,lang] of [[1280,'zh-Hant'],[390,'en'],[320,'zh-Hant']]){
    const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce'}),errors=[];
    p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
    let source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8');
    source=source.replace(/\}\)\(\);\s*$/,'window.__strategySnapshot=()=>structuredClone({run,state});window.__strategyNearWin=()=>{for(const u of state.units.filter(u=>u.team==="enemy"))u.hp=0;const f=byId("e-fox");f.hp=1;f.x=2;f.y=1;byId("p-beaver").hp-=13;selected="p-beaver";render();};})();');
    await p.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:source}));
    const uiClick=async selector=>{if(!await prepareJourneyAction(p,selector))await p.locator(selector).click();};await p.goto(base+'/games/animal-siege/?mode=expedition');await uiClick('#btn-start');
    const snap=()=>p.evaluate(()=>window.__strategySnapshot());
    assert.equal(await p.locator('.preparation-card').count(),0);
    assert.equal(await p.locator('#unit-guide-open').isVisible(),true);
    if(await p.locator('#location-dialog').isVisible())await uiClick('#location-close');await uiClick('[data-location="acorn"]');assert.match(await p.locator('.scout-main').innerText(),/11 \/ 19/);
    assert.equal(await p.locator('[data-prepare]').count(),0);if(await p.locator('#location-dialog').isVisible())await uiClick('#location-close');await uiClick('.map-node[data-location="home"]');
    await uiClick('[data-enter-camp]');await uiClick('[data-building="beaver"]');await uiClick('[data-recruit="beaver"][data-amount="3"]');assert.equal((await snap()).run.gold,30);assert.equal((await snap()).run.army.beaver,108);
    await uiClick('[data-building="squirrel"]');assert.equal(await p.locator('[data-upgrade="squirrel"]').isDisabled(),true);
    await uiClick('#camp-exit');if(await p.locator('#location-dialog').isVisible())await uiClick('#location-close');await uiClick('[data-location="timber"]');await uiClick('[data-explore="timber"]');await uiClick('[data-claim="timber"][data-choice="wood"]');
    if(await p.locator('#location-dialog').isVisible())await uiClick('#location-close');await uiClick('.map-node[data-location="home"]');await uiClick('[data-enter-camp]');await uiClick('[data-building="squirrel"]');await uiClick('[data-upgrade="squirrel"]');assert.equal((await snap()).run.wood,35);await uiClick('#camp-exit');
    await p.locator('#expedition img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
    await p.screenshot({path:path.join(dir,width+'-'+lang+'-preparation.png'),fullPage:true});
    if(await p.locator('#location-dialog').isVisible())await uiClick('#location-close');await uiClick('[data-location="acorn"]');await uiClick('[data-attack="acorn"]');
    assert.equal((await snap()).state.units.find(u=>u.id==='p-squirrel').trained,true);
    await p.evaluate(()=>window.__strategyNearWin());await uiClick('[data-cell="2,1"]');await uiClick('#confirm-attack');
    await p.locator('#expedition').waitFor({state:'visible'});const won=(await snap()).run;
    assert.equal(won.gold,170);assert.equal(won.wood,75);assert.equal(won.planFort,'river');
    assert.equal(won.battleReport.player.beaver.deployed,9);assert.equal(won.battleReport.player.beaver.survived,8);assert.equal(won.battleReport.player.beaver.lost,1);
    assert.equal(won.battleReport.counterHits,1);assert.equal(won.battleReport.counterDamage,1);
    assert.equal(await p.locator('.battle-report').getAttribute('open'),'');
    assert.equal(await p.locator('[data-report-kind="beaver"] td').allTextContents().then(x=>x.join(',')),'9,1,8');
    assert.equal(await p.locator('[data-report-gold="140"][data-report-wood="40"]').count(),1);
    await p.screenshot({path:path.join(dir,width+'-'+lang+'-report.png'),fullPage:true});
    if(await p.locator('#location-dialog').isVisible())await uiClick('#location-close');await uiClick('[data-location="home"]');await uiClick('[data-enter-camp]');await uiClick('[data-building="beaver"]');await uiClick('[data-recruit="beaver"][data-amount="1"]');await uiClick('#camp-exit');assert.deepEqual((await snap()).run.battleReport,won.battleReport);
    assert.equal(await p.locator('.battle-report').getAttribute('open'),null,'camp decisions fold, but retain, the last report');
    await uiClick('.report-heading');assert.equal(await p.locator('.report-body').isVisible(),true);
    await p.evaluate(l=>ToenowI18n.setLanguage(l==='en'?'zh-Hant':'en'),lang);assert.match(await p.locator('.report-heading').innerText(),/Captured|攻城成功/);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
    await uiClick('#menu');await uiClick('#title-button');await uiClick('#btn-start');assert.equal((await snap()).run.battleReport,null);
    console.log('PASS '+width+' '+lang+': scouting, preparation budget, actual recruit/train, real attack reward, persistent exact report and restart');await p.close();
  }}finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
