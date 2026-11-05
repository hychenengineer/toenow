const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const dir=path.resolve(__dirname,'../artifacts/animal-orders');
const key='animal_siege_hands_on_v2';
async function setup(browser,width,lang,mode,{first=false,motion='reduce'}={}){
  const p=await browser.newPage({viewport:{width,height:900},isMobile:width<781,hasTouch:width<781,reducedMotion:motion});
  p.setDefaultTimeout(15000);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({lang,first,key})=>{localStorage.setItem('toenow_language_v1',lang);if(!first)localStorage.setItem(key,'completed');localStorage.setItem('animal_siege_best_score_v1','17');localStorage.setItem('animal_siege_best_wave_v1','2');},{lang,first,key});
  const source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace(/\}\)\(\);\s*$/,
    'window.__orders=()=>structuredClone({state,run,plannedMove,targetId,lessonReturn:typeof lessonReturn==="undefined"?null:lessonReturn});window.__nearGate=()=>{byId("p-beaver").x=3;render();};window.__ordersEnd=()=>{state.result="defeat";state.phase="finished";finish();};})();');
  await p.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:source}));
  await p.goto(base+'/games/animal-siege/?mode='+mode);await p.locator('#btn-start').click();
  if(mode==='expedition'){await p.locator('[data-location="acorn"]').click();await p.locator('[data-attack="acorn"]').click();}
  const snap=()=>p.evaluate(()=>window.__orders());
  const idle=()=>p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')==='false');
  return {p,errors,snap,idle};
}
async function run(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const [width,lang,mode] of [[1280,'zh-Hant','battle'],[390,'en','battle'],[320,'zh-Hant','expedition'],[844,'en','battle']]){
      const {p,errors,snap,idle}=await setup(browser,width,lang,mode);
      await p.evaluate(()=>window.__nearGate());const original=await snap();
      await p.locator('[data-cell="5,1"]').click();
      assert.equal(await p.locator('[data-cell="6,1"]').getAttribute('class').then(c=>c.includes('target')),true,'preview must mark enemies attackable from the destination');
      await p.locator('[data-cell="6,1"]').click();
      assert.equal(await p.locator('#confirm-attack').isVisible(),true,'can select an enemy before committing the move');
      assert.match(await p.locator('#confirm-attack').innerText(),/Move.*attack|移動並攻擊/);
      assert.deepEqual((await snap()).state,original.state,'target preview is reversible');
      assert.equal(await p.locator('#preview').isVisible(),true);
      if(width>780){assert.equal(await p.locator('#confirm-attack').evaluate(el=>!!el.closest('#battle-order')),true);}
      else{await p.evaluate(()=>window.scrollTo(0,0));const r=await p.locator('#confirm-attack').boundingBox();assert.ok(r.y>=0&&r.y+r.height<=900,'mobile attack is visible without scrolling');}
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-combined.png'),fullPage:true});
      await p.locator('#order-cancel').click();await p.locator('#cancel-move').click();assert.deepEqual((await snap()).state,original.state);assert.equal((await snap()).targetId,null);
      await p.locator('[data-cell="5,1"]').click();await p.locator('[data-cell="6,1"]').click();
      await p.locator('#confirm-attack').click();await idle();
      const hit=await snap(),a=hit.state.units.find(u=>u.id==='p-beaver');
      assert.deepEqual([a.x,a.y,a.moved,a.acted],[5,1,true,true]);assert.equal(hit.state.log.length,1);assert.equal(hit.state.units.find(u=>u.id==='e-fox').hp,45);
      assert.equal(hit.plannedMove,null);assert.equal(hit.targetId,null);
      await p.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await p.locator('#battle-coach-replay').click();
      assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'select');
      if(width===390){
        await p.setViewportSize({width:844,height:390});await p.waitForTimeout(100);
        const rect=await p.locator('[data-coach-highlight]').boundingBox();
        assert.ok(rect.y>=0&&rect.y+rect.height<=390,'rotation must keep the required lesson target visible');
        await p.setViewportSize({width:390,height:900});
      }
      await p.locator('#battle-coach-skip').click();assert.deepEqual((await snap()).state,hit.state,'replay/skip restores a battle including casualties');
      // A move-only order leaves the attack available; pending move/end-turn explicitly commits before defending.
      await p.locator('[data-unit="p-fox"]').click();await p.locator('[data-cell="1,3"]').click();await p.locator('#confirm-move').click();await idle();
      assert.equal((await snap()).state.units.find(u=>u.id==='p-fox').acted,false);
      await p.locator('#defend').click();await p.locator('[data-unit="p-squirrel"]').click();await p.locator('[data-cell="2,4"]').click();
      assert.match(await p.locator('#end-turn').innerText(),/Move.*end|移動.*結束/);assert.equal(await p.locator('#end-turn').isEnabled(),true);
      await p.locator('#end-turn').click();await p.locator('#order-accept').click();await p.waitForFunction(()=>window.__orders().state.round===2);await idle();
      assert.deepEqual((await snap()).state.units.find(u=>u.id==='p-squirrel').x,2);
      if(width===390){
        await p.evaluate(()=>window.__ordersEnd());await p.locator('#gameover-screen').waitFor({state:'visible'});
        assert.equal(await p.locator('.battle-actions').isVisible(),false,'mobile dock cannot cover the shared result screen');
        await p.locator('#btn-title').click();await p.locator('#title-screen').waitFor({state:'visible'});
      }
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
      console.log('PASS orders '+width+' '+lang+' '+mode+': combined attack, cancel, mobile visibility, move only, move/end turn, replay restoration');await p.close();
    }
    for(const [width,lang,mode] of [[1280,'en','battle'],[390,'zh-Hant','expedition'],[320,'en','battle']]){
      const {p,errors,snap,idle}=await setup(browser,width,lang,mode,{first:true});
      const start=await snap(),saved=start.lessonReturn;assert.ok(saved,'first play uses an isolated rehearsal');
      assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'select');
      assert.equal(await p.locator('#end-turn').isDisabled(),true);
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-lesson-select.png'),fullPage:true});
      await p.locator('[data-cell="1,1"]').click();assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'move');
      await p.locator('[data-cell="3,1"]').click();assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'target');
      assert.equal(await p.locator('#confirm-move').isDisabled(),true,'lesson must demonstrate a combined attack');
      await p.locator('[data-cell="4,1"]').click();assert.equal(await p.locator('#battle-order').isVisible(),true);await p.locator('#order-cancel').click();assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'target');await p.locator('[data-cell="4,1"]').click();
      await p.screenshot({path:path.join(dir,width+'-'+lang+'-lesson-attack.png'),fullPage:true});
      await p.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await p.locator('#resume').click();
      await p.locator('#confirm-attack').click();await idle();assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'end-turn');
      await p.locator('#end-turn').click();await p.locator('#order-accept').click();await p.waitForFunction(()=>window.__orders().lessonReturn===null);
      assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),'completed');
      assert.deepEqual((await snap()).state,saved.state,'lesson completion restores the actual battle');assert.deepEqual((await snap()).run,start.run);
      assert.deepEqual(await p.evaluate(()=>[localStorage.getItem('animal_siege_best_score_v1'),localStorage.getItem('animal_siege_best_wave_v1')]),['17','2']);
      await p.reload();await p.locator('#btn-start').click();if(mode==='expedition'){await p.locator('[data-location="acorn"]').click();await p.locator('[data-attack="acorn"]').click();}
      assert.equal((await snap()).lessonReturn,null,'completed lesson does not repeat');assert.deepEqual(errors,[]);
      console.log('PASS lesson '+width+' '+lang+' '+mode+': gated five steps, real actions, safe enemy turn, restore without records or losses');await p.close();
    }
    {
      const {p,errors,snap,idle}=await setup(browser,1280,'en','battle',{motion:'no-preference'});
      await p.evaluate(()=>window.__nearGate());
      await p.locator('[data-cell="5,1"]').click();await p.locator('[data-cell="6,1"]').click();
      await p.evaluate(()=>{document.getElementById('confirm-attack').click();document.getElementById('confirm-attack').click();ToenowGameSDK.getInstance('animal-siege').pause();});
      await p.waitForFunction(()=>!document.querySelector('.combat-walker'));assert.equal((await snap()).state.log.length,0,'pausing a walk delays the queued attack');
      await p.locator('#resume').click();await idle();assert.equal((await snap()).state.log.length,1,'resume performs exactly one attack');
      await p.locator('#restart').click();await p.evaluate(()=>window.__nearGate());
      await p.locator('[data-cell="5,1"]').click();await p.locator('[data-cell="6,1"]').click();
      await p.evaluate(()=>{document.getElementById('confirm-attack').click();ToenowGameSDK.getInstance('animal-siege').restart();});
      await p.waitForTimeout(700);assert.equal((await snap()).state.log.length,0,'restart cancels the queued attack');
      assert.equal((await snap()).state.units.find(u=>u.id==='p-beaver').x,1);assert.deepEqual(errors,[]);
      console.log('PASS animation: duplicate click, pause/resume and restart cannot leak a queued attack');await p.close();
    }
    {
      const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
      p.setDefaultTimeout(15000);
      const source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace(/\}\)\(\);\s*$/,'window.__practiceOrders=()=>({wave:state.wave,realWave:lessonReturn?.state.wave});})();');
      await p.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:source}));
      await p.route(base+'/__orders_embed__',r=>r.fulfill({contentType:'text/html',body:'<iframe style="width:100%;height:790px;border:0" src="'+base+'/games/animal-siege/?mode=battle"></iframe>'}));
      await p.goto(base+'/__orders_embed__');const game=p.frameLocator('iframe');
      await game.locator('.unified-practice-btn').click();await game.locator('.unified-practice-level-btn[data-level="5"]').click();
      assert.equal(await game.locator('#board').evaluate(()=>window.__practiceOrders().realWave),21);
      await game.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());
      assert.equal(await game.locator('#board').evaluate(()=>window.__practiceOrders().realWave),21,'restarting during a rehearsal must keep the selected practice tier');
      await game.locator('#battle-coach-skip').click();
      assert.equal(await game.locator('#board').evaluate(()=>window.__practiceOrders().wave),21);
      assert.equal(await game.locator('#battle-coach').isVisible(),false);assert.equal(await game.locator('#board').evaluate(()=>localStorage.getItem('animal_siege_best_score_v1')),null);
      await game.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await game.locator('#battle-coach-replay').click();
      await game.locator('[data-cell="1,1"]').click();await game.locator('[data-cell="3,1"]').click();await game.locator('[data-cell="4,1"]').click();
      await game.locator('#order-cancel').click();await game.locator('#unit-guide-open').click();await game.locator('#unit-guide-close').click();
      await game.locator('#board').evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));
      assert.match(await game.locator('#battle-coach-prompt').innerText(),/紅色劍/);
      await game.locator('#battle-coach-skip').click();assert.equal(await game.locator('#board').evaluate(()=>localStorage.getItem('animal_siege_best_score_v1')),null);
      console.log('PASS iframe practice: first lesson skip/replay, handbook, language switch and no score writes');await p.close();
    }
  }finally{await browser.close();}
}
if(require.main===module)run().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
module.exports={run};
