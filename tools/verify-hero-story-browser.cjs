const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('../games/animal-siege/hero.js');
const S=require('../games/animal-siege/story.js');
const {chooseAction}=require('./lib/animal-siege-driver.cjs');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8786';
const dir=path.resolve(__dirname,'../artifacts/hero-story');
async function instrument(page){
  let js=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8');
  // Observe state only. All game decisions are made through actual controls.
  js=js.replace('},650);','},25);').replace(/\}\)\(\);\s*$/,'window.__heroSnapshot=()=>structuredClone({run,state,paused,scene,isPractice,feedbackBusy,captureBusy,storyModal,lessonReturn:!!lessonReturn});})();');
  await page.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:js}));
}
const snap=p=>p.evaluate(()=>window.__heroSnapshot());
async function tap(p,selector){
  const modal=p.locator('#hero-dialog');let l=p.locator(selector).filter({visible:true});
  if(await modal.isVisible()&&await modal.locator(selector).count())l=modal.locator(selector).filter({visible:true});
  if(await p.evaluate(()=>matchMedia('(pointer: coarse)').matches))await l.tap();else await l.click();
}
async function ready(p){await p.waitForFunction(()=>{const s=window.__heroSnapshot();return !s.feedbackBusy&&!s.captureBusy&&(!s.state||s.state.phase!=='enemy');});}
async function closeModal(p){if(await p.locator('#hero-dialog').isVisible())await tap(p,'#hero-dialog-close');}
async function objective(p){await closeModal(p);await tap(p,'[data-story-objective]');}
async function screenshot(p,name){await (p.screenshot?p:p.page()).screenshot({path:path.join(dir,name+'.png'),fullPage:true});}
async function cast(p,b){
  for(const id of ['bolt','shield','heal']){
    const target=b.units.filter(u=>H.canCast(b,id,u.id)).sort((a,z)=>a.hp-z.hp)[0];
    if(!target)continue;
    await tap(p,'[data-story-spell="'+id+'"]');await tap(p,'[data-story-target="'+target.id+'"]');
    await tap(p,'[data-story-cast="'+id+'"]');return true;
  }return false;
}
async function battle(p){
  let spells=0;
  for(let step=0;step<200;step++){
    await ready(p);const {run,state:b}=await snap(p);if(!b)return spells;
    assert.equal(b.phase,'player');assert.ok(b.round<20,'battle must remain winnable');
    if(await cast(p,b)){spells++;continue;}
    const a=chooseAction(b);
    if(!a){await tap(p,'#end-turn');await tap(p,'#order-accept');continue;}
    await tap(p,'#board [data-unit="'+a.id+'"]');const u=b.units.find(u=>u.id===a.id);
    const moved=u.x!==a.x||u.y!==a.y;
    if(moved)await tap(p,'[data-cell="'+a.x+','+a.y+'"]');
    if(a.target){const target=b.units.find(u=>u.id===a.target);await tap(p,'[data-cell="'+target.x+','+target.y+'"]');await tap(p,'#confirm-attack');}
    else await tap(p,moved?'#confirm-move':'#defend');
  }throw Error('too many UI battle actions');
}
async function chapterSetup(p,n,talent){
  await objective(p);
  if(n===3){
    assert.equal(await p.locator('[data-story-battle]').isDisabled(),true);
    await tap(p,'[data-story-hero]');await tap(p,'[data-story-talent="'+talent+'"]');
    assert.equal((await snap(p)).run.hero.talent,talent);await objective(p);
  }
  await tap(p,'[data-story-supply="reinforcements"]');
  assert.equal((await snap(p)).run.story.supplies.includes(n),true);
  await tap(p,'[data-story-battle]');await p.locator('#battle').waitFor({state:'visible'});
}
async function complete(p,prefix,talent,{reload=true}={}){
  for(let n=1;n<=5;n++){
    assert.equal((await snap(p)).run.story.chapter,n);
    if(n===1)await screenshot(p,prefix+'-map');
    if(n===2&&reload){
      const before=(await snap(p)).run;await p.reload();await tap(p,'#story-continue');
      const after=(await snap(p)).run;assert.deepEqual(after.army,before.army);assert.deepEqual(after.hero,before.hero);assert.equal(after.story.chapter,2);
    }
    await chapterSetup(p,n,talent);
    if(n===2)await screenshot(p,prefix+'-magic-battle');
    const spells=await battle(p);const {run}=await snap(p);
    assert.equal(run.story.cleared.length,n,'UI victory for chapter '+n);
    if(n>1)assert.ok(spells>0,'hero casts real spells');
    if(n<5){
      assert.equal(await p.locator('#gameover-screen').isVisible(),false);
      await screenshot(p,prefix+'-chapter'+n+'-reward');
      if(n===3){
        await tap(p,'[data-story-hero]');await tap(p,'[data-story-equip="thornWand"]');
        assert.equal((await snap(p)).run.hero.equipment.weapon,'thornWand');
        await tap(p,'[data-story-loadout="heal"]');await tap(p,'[data-story-loadout="slow"]');
        assert.equal((await snap(p)).run.hero.loadout.length,3);assert.equal(await p.locator('[data-story-loadout="haste"]').isDisabled(),true);
        await tap(p,'[data-story-loadout="slow"]');await tap(p,'[data-story-loadout="heal"]');
        await screenshot(p,prefix+'-hero');await closeModal(p);await tap(p,'[data-story-objective]');
      }
      await tap(p,'[data-story-advance]');
    }
    console.log('PASS '+prefix+' chapter '+n+' ('+spells+' spells)');
  }
  await p.locator('#gameover-screen').waitFor({state:'visible'});assert.equal((await snap(p)).run.result,'victory');
  assert.equal(await p.locator('#gameover-screen [data-screen-action]').count(),3);
  if(await p.locator('#hero-dialog').isVisible()){await screenshot(p,prefix+'-epilogue');await tap(p,'[data-story-close]');}
  await screenshot(p,prefix+'-complete');
  await p.evaluate(()=>{ToenowLevels.shareScore=data=>window.__heroShared=data;});await tap(p,'[data-screen-action="share"]');
  assert.equal((await p.evaluate(()=>window.__heroShared)).score,S.score((await snap(p)).run));
  if(!(await snap(p)).isPractice){const saved=await p.evaluate(()=>[localStorage.getItem('animal_siege_best_score_v1'),localStorage.getItem('animal_siege_best_wave_v1')]);assert.deepEqual(saved,[String(S.score((await snap(p)).run)),'5'],'normal story persists shared records');}
}
async function newPage(browser,width,lang){
  const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce'});
  await p.addInitScript(lang=>{localStorage.setItem('toenow_language_v1',lang);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
  await instrument(p);return p;
}
async function lifecycle(browser){
  const p=await newPage(browser,320,'en'),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/games/animal-siege/');await tap(p,'#btn-start');
  await chapterSetup(p,1,'guardian');const checkpoint=(await snap(p)).run.story.checkpoint;
  await tap(p,'#end-turn');await tap(p,'#order-accept');await ready(p);
  await p.keyboard.press('Escape');assert.equal((await snap(p)).paused,true);
  await tap(p,'#resume');assert.equal((await snap(p)).paused,false);
  await tap(p,'#restart');assert.deepEqual((await snap(p)).run.army,checkpoint.army);
  assert.equal((await snap(p)).run.last.type,'story-retry');
  await objective(p);await tap(p,'[data-story-battle]');await tap(p,'#end-turn');await tap(p,'#order-accept');await ready(p);
  await p.reload();await tap(p,'#story-continue');assert.equal((await snap(p)).state,null);assert.deepEqual((await snap(p)).run.army,checkpoint.army);
  await objective(p);await tap(p,'[data-story-battle]');
  await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());assert.equal((await snap(p)).state,null);assert.equal(await p.locator('#hero-dialog').isVisible(),false);
  await objective(p);await tap(p,'[data-story-battle]');await battle(p);await tap(p,'[data-story-advance]');
  const chapterTwo=(await snap(p)).run;await tap(p,'[data-story-battle]');
  await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());
  assert.equal((await snap(p)).run.story.chapter,2,'Hub restart preserves completed chapters');
  assert.deepEqual((await snap(p)).run.army,chapterTwo.army);assert.deepEqual((await snap(p)).run.hero,chapterTwo.hero);
  await screenshot(p,'320-en-lifecycle');assert.deepEqual(errors,[]);await p.close();
  console.log('PASS 320px retreat/pause/reload-in-battle/restart checkpoints');
}
async function embeddedPractice(browser){
  const p=await newPage(browser,1280,'zh-Hant'),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const seed=S.create();seed.gold=123;let serialized;S.save({setItem(k,v){serialized=v;}},seed);
  await p.addInitScript(({key,value})=>{localStorage.setItem(key,value);localStorage.setItem('animal_siege_best_score_v1','17');localStorage.setItem('animal_siege_best_wave_v1','2');localStorage.setItem('toenow_island_story_v1','skipped');},{key:S.STORAGE_KEY,value:serialized});
  await p.route('https://**',r=>r.abort());await p.goto(base+'/');
  await tap(p,'[data-island-select="expedition"]');await tap(p,'#open-animal-siege');
  const frame=await (await p.locator('#gameViewer').elementHandle()).contentFrame();await frame.locator('#btn-start').waitFor({state:'visible'});
  await frame.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').start({wave:1,isPractice:true}));
  assert.equal((await snap(frame)).run.gold,90,'practice starts fresh, not saved adventure');
  await complete(frame,'iframe-zh-practice','sage',{reload:false});
  const after=await frame.evaluate(key=>[localStorage.getItem(key),localStorage.getItem('animal_siege_best_score_v1'),localStorage.getItem('animal_siege_best_wave_v1')],S.STORAGE_KEY);
  assert.deepEqual(after,[serialized,'17','2'],'practice cannot overwrite story or score/wave records');
  await tap(frame,'[data-screen-action="title"]');await tap(p,'#closeTheaterBtn');
  await p.waitForFunction(()=>document.getElementById('theaterModal').getAttribute('aria-hidden')==='true');
  await p.locator('#expeditionIsland').waitFor({state:'visible'});assert.equal(await p.locator('#gameViewer').getAttribute('src'),'about:blank');
  assert.deepEqual(errors,[]);await p.close();console.log('PASS actual Hub iframe five-chapter practice isolation and return to Expedition Island');
}
async function storageAndLesson(browser){
  const p=await browser.newPage({viewport:{width:390,height:900},hasTouch:true,isMobile:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await instrument(p);
  await p.addInitScript(key=>{localStorage.setItem(key,'{corrupt');const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw Error('storage blocked');return original.call(this,k,v);};},S.STORAGE_KEY);
  await p.goto(base+'/games/animal-siege/');assert.equal(await p.locator('#story-continue').isVisible(),false);await tap(p,'#btn-start');assert.equal(await p.locator('#story-storage-warning').isVisible(),true);
  await chapterSetup(p,1,'sage');assert.equal((await snap(p)).lessonReturn,true);assert.equal(await p.locator('#hero-battle-bar').isVisible(),false);
  await tap(p,'#battle-coach-skip');assert.equal((await snap(p)).lessonReturn,false);assert.equal((await snap(p)).state.storyChapter,1);
  await tap(p,'#hero-battle-bar [data-story-hero]');await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());assert.equal(await p.locator('#hero-dialog').isVisible(),false);await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').resume());assert.equal(await p.locator('#hero-dialog').isVisible(),true);
  await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());assert.equal(await p.locator('#hero-dialog').isVisible(),false);assert.equal((await snap(p)).state,null);
  assert.deepEqual(errors,[]);await p.close();console.log('PASS corrupt/blocked storage, first-play lesson, modal pause/resume/restart');
}
async function run(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const full=process.env.TOENOW_HERO_SMOKE!=='1';
    const cases=process.env.TOENOW_HERO_WIDTH?[[Number(process.env.TOENOW_HERO_WIDTH),process.env.TOENOW_HERO_LANG||'en']]:[[1280,'en'],[390,'zh-Hant']];
    for(const [width,lang] of process.env.TOENOW_HERO_EXTRA==='1'?[]:cases){
      const p=await newPage(browser,width,lang),errors=[];p.on('pageerror',e=>errors.push(e.message));
      try{
        await p.goto(base+'/games/animal-siege/');await tap(p,'#btn-start');await p.locator('.story-map').waitFor({state:'visible'});
        assert.equal(await p.locator('[data-story-chapter]').count(),5);assert.equal(await p.locator('[data-story-chapter="2"]').isDisabled(),true);
        await tap(p,'[data-story-hero]');await screenshot(p,width+'-'+lang+'-profile-initial');
        await p.keyboard.press('Escape');assert.equal(await p.locator('#hero-dialog').isVisible(),false);assert.equal((await snap(p)).paused,false);
        await p.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));assert.match(await p.locator('#expedition h1').innerText(),/森林/);
        await p.evaluate(l=>ToenowI18n.setLanguage(l),lang);
        assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
        if(full){
          await complete(p,width+'-'+lang,width<700?'sage':'guardian');
          const saved=await p.evaluate(k=>localStorage.getItem(k),S.STORAGE_KEY);
          await tap(p,'[data-screen-action="title"]');await p.locator('#title-screen').waitFor({state:'visible'});
          await tap(p,'#story-new');await tap(p,'[data-story-close]');assert.equal(await p.evaluate(k=>localStorage.getItem(k),S.STORAGE_KEY),saved);
          await tap(p,'#story-new');await tap(p,'[data-story-new-confirm]');assert.equal((await snap(p)).run.story.chapter,1);
        }else await screenshot(p,width+'-'+lang+'-map');
        assert.deepEqual(errors,[]);console.log('PASS '+width+' '+lang+' layout/modal/language'+(full?'/five chapters/reload/share/new-game':''));
      }catch(e){await screenshot(p,width+'-'+lang+'-failure');console.error('snapshot',JSON.stringify(await snap(p)).slice(0,2200));throw e;}finally{await p.close();}
    }
    if(process.env.TOENOW_HERO_EXTRA==='1'){await lifecycle(browser);await storageAndLesson(browser);await embeddedPractice(browser);}
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
