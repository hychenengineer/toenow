const { readSource } = require('./lib/game-source.cjs');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
const keys = require('../shared/toenow-levels.js').GAME_STORAGE_KEYS;
const out = 'artifacts/total-time'; fs.mkdirSync(out, { recursive: true });
const hooks = {
  'space-scale': `
    snapshot:()=>({time:globalTimeSec,wave,state:gameState}),
    start:(practice=false)=>startNewGame(1,practice),
    setTime:t=>{globalTimeSec=t;syncHudDOM()},
    wrong:()=>{collapseAnim=null;handleBodySelection(currentPuzzle.bodies.find(b=>b.id!==currentPuzzle.targetBodyId).id)},
    correct:()=>{collapseAnim=null;handleBodySelection(currentPuzzle.targetBodyId)},
    next:()=>{loadWave(wave+1)},
    advance:seconds=>{for(let i=0;i<Math.round(seconds*20);i++)tick(lastFrameTime+50)},
    render:()=>tick(lastFrameTime+1),
    pause:()=>setGameState('paused'),
    resume:()=>setGameState('playing')`,
  'ball-track': `
    snapshot:()=>({time:state.runTimeSec,wave:state.wave,state:state.mode,phase:state.phase}),
    start:(practice=false)=>startNewGame(1,practice),
    setTime:t=>{state.runTimeSec=t;syncRunTime()},
    wrong:()=>{initWave(state.wave,false);window.__QUANTUM_SHELL__.forceSelectPhase();handleShellSelection(state.shells.find(s=>!s.hasCore))},
    correct:()=>{initWave(state.wave,false);window.__QUANTUM_SHELL__.forceSelectPhase();handleShellSelection(state.shells.find(s=>s.hasCore))},
    next:()=>initWave(state.wave+1,false),
    prepare:()=>window.__QUANTUM_SHELL__.forceSelectPhase(),
    advance:seconds=>{for(let i=0;i<Math.round(seconds*20);i++)updateSimulation(.05)},
    render:()=>renderScene(0),
    pause:()=>setBodyState('paused',state.phase),
    resume:()=>setBodyState('playing',state.phase)`,
  'tap-match': `
    snapshot:()=>({time:state.timeLeft,wave:state.wave,state:state.phase}),
    start:(practice=false)=>{startNewRun(1,practice);launchCurrentWaveFromBriefing();state.phase='PLAYING'},
    setTime:t=>{state.timeLeft=t;syncHud()},
    wrong:()=>triggerPenalty(null,'WRONG','MISS'),
    correct:()=>{state.phase='PLAYING';const node=state.nodes[0];node.status='ACTIVE';node.isTarget=true;node.x=100;node.y=100;node.elapsedMs=0;state.waveQuota=state.waveHits+2;const r=canvas.getBoundingClientRect();handlePointerDown(r.left+100,r.top+100)},
    next:()=>prepareWaveBriefing(state.wave+1),
    prepare:()=>{state.phase='PLAYING';modalWaveBrief.classList.add('hidden');state.spawnCooldown=1e9;state.nodes.forEach(node=>node.status='INACTIVE')},
    advance:seconds=>{for(let i=0;i<Math.round(seconds*20);i++)updateGame(50)},
    render:()=>renderGame(),pause:()=>togglePause(),resume:()=>togglePause()`
};
async function instrument(page, id) {
  await page.addInitScript(id => {
    localStorage.setItem('toenow_tutorial_'+id+'_v2','completed');
    // Advance the production loop deterministically, without waiting 60 real seconds.
    window.requestAnimationFrame = () => 1;
  }, id);
  let html = readSource(path.join(__dirname,'../games',id,'index.html'),'utf8');
  const end = html.lastIndexOf('})();'); assert.ok(end > 0);
  html = html.slice(0,end)+`window.__timedTest={${hooks[id]}};`+html.slice(end);
  await page.route(`**/games/${id}/`, route => route.fulfill({ contentType:'text/html', body:html }));
}
(async () => {
  const browser = await chromium.launch({ channel:'msedge',headless:true });
  try {
    for (const id of Object.keys(hooks)) for (const width of [390,1100]) for (const lang of ['en','zh-Hant']) {
      console.log(`CHECK ${id} ${width} ${lang}`);
      const context = await browser.newContext({viewport:{width,height:850}});
      await context.route('https://**',r=>r.abort());
      await context.addInitScript(lang=>localStorage.setItem('toenow_language_v1',lang),lang);
      const page = await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
      await instrument(page,id);
      await page.goto(`${base}/games/${id}/`,{waitUntil:'domcontentloaded'});
      assert.deepEqual(errors,[], 'initialization errors: '+JSON.stringify(errors));
      await page.evaluate(()=>__timedTest.start());
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),60);
      await page.evaluate(()=>__timedTest.setTime(40));
      await page.evaluate(()=>__timedTest.correct());
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),id==='tap-match'?40.2:43,'game-specific correct-answer bonus');
      await page.evaluate(()=>{__timedTest.setTime(59);__timedTest.correct()});
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),id==='tap-match'?59.2:60,'game-specific bonus near cap');
      await page.evaluate(()=>{__timedTest.setTime(59.9);__timedTest.correct()});
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),60,'reward capped at sixty');
      await page.evaluate(()=>__timedTest.setTime(60));
      for(let i=0;i<6;i++) await page.evaluate(()=>__timedTest.wrong());
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),30,'six errors cost time without shield/fault defeat');
      assert.ok(['playing','PLAYING'].includes(await page.evaluate(()=>__timedTest.snapshot().state)));
      await page.evaluate(()=>__timedTest.next());
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),30,'wave never refills total time');
      {
        await page.evaluate(()=>{__timedTest.prepare?.();__timedTest.advance(12)});
        const snap = await page.evaluate(()=>__timedTest.snapshot());
        assert.ok(Math.abs(snap.time-18)<.001,'one global countdown');
        assert.equal(snap.wave,2,'no wave timeout, automatic error or wave advancement');
        if (id==='ball-track') assert.equal(snap.phase,'select');
        await page.evaluate(()=>{__timedTest.pause();__timedTest.advance(3)});
        assert.ok(Math.abs(await page.evaluate(()=>__timedTest.snapshot().time)-18)<.001,'pause freezes total time');
        await page.evaluate(()=>{__timedTest.resume();__timedTest.render()});
        if(id==='space-scale') assert.equal(await page.locator('#level-up-banner').count(),0);
        const hud = page.locator('.island-live-hud');
        const geometry = await hud.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
        assert.ok(geometry.scroll<=geometry.width&&geometry.left>=0&&geometry.right<=width+.5);
        await page.screenshot({path:`${out}/${id}-${width}-${lang}.png`});
      }
      const before = await page.evaluate(k=>[localStorage.getItem(k.score),localStorage.getItem(k.wave)],keys[id]);
      await page.evaluate(()=>{__timedTest.start(true);__timedTest.setTime(2);__timedTest.wrong()});
      await page.locator('[data-toenow-screen="gameover"]').waitFor({state:'visible'});
      const after = await page.evaluate(k=>[localStorage.getItem(k.score),localStorage.getItem(k.wave)],keys[id]);
      assert.deepEqual(after,before,'practice cannot overwrite records');
      await page.evaluate(()=>__timedTest.start());
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),60,'restart restores sixty seconds');
      await page.evaluate(()=>{__timedTest.prepare?.();__timedTest.setTime(.1);__timedTest.advance(.2)});
      await page.locator('[data-toenow-screen="gameover"]').waitFor({state:'visible'});
      assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),0,'natural countdown ends run');

      assert.deepEqual(errors,[]);
      const embedded = await context.newPage();
      await instrument(embedded,id);
      await embedded.goto(base,{waitUntil:'domcontentloaded'});
      await embedded.setContent(`<iframe id="timed-game" src="${base}/games/${id}/" style="width:100%;height:800px"></iframe>`);
      const frame = embedded.frameLocator('#timed-game');
      await frame.locator('.island-live-hud').waitFor({state:'attached'});
      await frame.locator('body').evaluate(()=>{__timedTest.start(true);__timedTest.setTime(2);__timedTest.wrong()});
      await frame.locator('[data-toenow-screen="gameover"]').waitFor({state:'visible'});
      if (width===390 && lang==='en') {
        await page.reload({waitUntil:'domcontentloaded'});
        const records = await page.evaluate(k=>[localStorage.getItem(k.score),localStorage.getItem(k.wave)],keys[id]);
        // This deterministic suite disables requestAnimationFrame. Dispatch the
        // button action directly; a real pointer click waits on browser frames.
        // Pointer/keyboard interactions are covered by verify-tutorials-browser.
        await page.evaluate(()=>{
          const button=document.querySelector('[data-tutorial-replay]');
          assertReplayButton(button);
          function assertReplayButton(node){if(!node)throw Error('Tutorial replay button missing after reload');}
          button.click();
        });
        await page.locator('#toenow-tutorial').waitFor({state:'visible'});
        const tutorialTime = await page.evaluate(()=>__timedTest.snapshot().time);
        await page.evaluate(()=>{__timedTest.advance(65);__timedTest.wrong()});
        assert.equal(await page.evaluate(id=>ToenowTutorials.isActive(id),id),true);
        assert.equal(await page.evaluate(()=>__timedTest.snapshot().time),tutorialTime,'tutorial never consumes time or loses seconds');
        assert.deepEqual(await page.evaluate(k=>[localStorage.getItem(k.score),localStorage.getItem(k.wave)],keys[id]),records,'tutorial does not write records');
      }
      await context.close();console.log(`PASS ${id} ${width} ${lang}`);
    }
    console.log('PASS total-time browser regression');
  } catch(error) {console.error(error);throw error;}
  finally {await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1)});
