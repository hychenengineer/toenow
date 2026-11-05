const { readSource } = require('./lib/game-source.cjs');
// Real browser integration tests. Only a state-driving hook is injected; the
// production renderer, game-over lifecycle, storage, controls and DOM run intact.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../shared/toenow-screen-config.js');
const keys = require('../shared/toenow-levels.js').GAME_STORAGE_KEYS;
const root = path.resolve(__dirname, '..');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
const hooks = {
  'capybara-drift': `state.score=321;state.wave=13;state.elapsed=600;finishDrift();`,
  'number-pop': `game.score=321;game.wave=13;triggerGameOver();`,
  'ball-track': `state.score=321;state.wave=13;saveRecords(state.score,state.wave);state.frozenSnapshot={score:321,wave:13,best:bestScore};showGameOverModal();`,
  'block-match': `state.score=321;state.wave=13;state.wavesCleared=12;triggerGameOver();`,
  'add-up': `score=321;wave=13;triggerGameOver();`,
  'space-scale': `score=321;wave=13;triggerGameOver();`,
  'tap-match': `state.score=321;state.wave=13;endRun('TIME EXPIRED');`,
  'spot-quick': `state.score=321;state.wave=13;triggerGameOver('TIME EXPIRED');`,
  'shadow-match': `state.score=321;state.wave=13;triggerGameOver();`
};
async function instrument(page, id) {
  // This suite exercises title/result lifecycles for returning players.
  // First-play interception and lesson actions have their own browser matrix.
  await page.addInitScript(id=>localStorage.setItem('toenow_tutorial_'+id+'_v2','completed'),id);
  if(id==='flash-brain')await page.addInitScript(()=>{for(const rule of ['thorns','priority'])localStorage.setItem('toenow_flash_lesson_'+rule+'_v1','completed');});
  if (id === 'flash-brain') {
    let js = readSource(path.join(root,'games',id,'assets/index-cr-6j3L1.js'),'utf8');
    const marker = '},x=(e,t)=>{let n=p.current';
    assert.ok(js.includes(marker), 'Flash Brain hook location');
    js = js.replace(marker, `};window.__finishScreenTest=()=>{const e=p.current;if(!e)throw Error('Engine not initialized');e.score=321;e.waveState.config.wave=13;e.wavesCleared=12;e.highestLevel=3;e.peakCombo=2;b()};let x=(e,t)=>{let n=p.current`);
    await page.route('**/assets/index-cr-6j3L1.js*', route => route.fulfill({contentType:'application/javascript',body:js}));
  } else {
    // Instrument only the controller so the browser still loads every real
    // external dependency, stylesheet and renderer from the production page.
    let js = fs.readFileSync(path.join(root,'games',id,'main.js'),'utf8');
    const end = js.lastIndexOf('})();');
    assert.ok(end > 0, id + ' hook location');
    js = js.slice(0,end) + `window.__finishScreenTest=()=>{${hooks[id]}};` + js.slice(end);
    await page.route('**/games/' + id + '/main.js*', route => route.fulfill({contentType:'application/javascript',body:js}));
  }
}
function structure(el) {
  return [el.tagName, el.className, ...[...el.children].map(structure)];
}
async function confirmReady(host,id) {
  if(id==='flash-brain')assert.equal(await host.locator('#toenow-tutorial').count(),0,'no startup tutorial for returning players');
}
async function islandAppearance(host, cardSelector, species, stage) {
  const appearance = await host.locator(cardSelector).evaluate(card => {
    const css = getComputedStyle(card);
    return { background: css.backgroundColor, color: css.color };
  });
  const rgb = value => value.match(/[\d.]+/g).slice(0,3).map(Number);
  assert.ok(rgb(appearance.background).every(n => n > 210), 'Island card uses light paper');
  assert.ok(rgb(appearance.color).every(n => n < 130), 'Island card uses dark readable ink');
  const art = host.locator('[data-screen-animal-art]');
  assert.ok((await art.getAttribute('src')).endsWith(species+'-level'+stage+'.webp'), 'Artwork follows this game and level');
  await art.evaluate(img => img.decode());
}
async function run() {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const result = { standalone: 0, iframe: 0, practice: 0 };
  let titleStructure, endStructure;
  const dimensions = new Map();
  try {
    for (const [id,c] of Object.entries(catalog).filter(([id])=>!process.env.TOENOW_TEST_GAMES || process.env.TOENOW_TEST_GAMES.split(',').includes(id))) {
      if(c.presentation==='visit'){
        for(const width of [1100,390])for(const lang of ['en','zh-Hant']){
          const p=await browser.newPage({viewport:{width,height:850}});await p.addInitScript(l=>localStorage.setItem('toenow_language_v1',l),lang);await p.goto(base+'/games/'+id+'/');
          const title=p.locator('#'+c.titleId);assert.equal(await title.getAttribute('data-toenow-screen-owner'),'ToenowScreens');assert.equal(await title.locator('[data-screen-record]').count(),0);await p.locator('#'+c.startId).click();await p.locator('#rest').click();await p.locator('#finish').click();const end=p.locator('#'+c.endId);await end.waitFor({state:'visible'});assert.equal(await end.getAttribute('data-toenow-screen-owner'),'ToenowScreens');assert.equal(await end.locator('[data-screen-action]').count(),3);assert.equal(await end.locator('[data-screen-field]').count(),0);await p.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:d=>{window.__visitShare=d;return Promise.resolve();}}));await end.locator('[data-screen-action="share"]').click();assert(await p.evaluate(()=>!!window.__visitShare.text));await p.locator('#'+c.retryId).click();await p.locator('#rest').click();await p.locator('#finish').click();await p.locator('#'+c.returnId).click();await title.waitFor({state:'visible'});const before=await p.evaluate(()=>({...localStorage}));await p.locator('#'+c.practiceId).click();await p.locator('#rest').click();await p.locator('#finish').click();assert.deepEqual(await p.evaluate(()=>({...localStorage})),before);result.standalone++;await p.close();
        }
        result.practice++;const p=await browser.newPage();await p.goto(base+'/');await p.setContent(`<iframe src="${base}/games/${id}/" style="width:100%;height:800px"></iframe>`);const f=p.frameLocator('iframe');await f.locator('#'+c.startId).click();await f.locator('#rest').click();await f.locator('#finish').click();await f.locator('#'+c.endId).waitFor({state:'visible'});result.iframe++;await p.close();continue;
      }

      for (const width of [1100,390]) for (const lang of ['en','zh-Hant']) {
        const page = await browser.newPage({viewport:{width,height:850}});
        await page.addInitScript(k=>{localStorage.setItem(k.score,'900');localStorage.setItem(k.wave,'21');},keys[id]);
        const errors = []; page.on('pageerror',e=>errors.push(e.message));
        await instrument(page,id);
        await page.goto(base+'/games/'+id+'/');
        await page.evaluate(({lang,keys})=>{localStorage.setItem(keys.score,'900');localStorage.setItem(keys.wave,'21');ToenowI18n.setLanguage(lang);},{lang,keys:keys[id]});
        const title = page.locator('[data-toenow-screen="title"]');
        await title.waitFor({state:'visible'});
        await islandAppearance(title,'.unified-title-card',c.animalSpecies,5);
        if (process.env.TOENOW_SCREENSHOTS) {
          fs.mkdirSync(process.env.TOENOW_SCREENSHOTS,{recursive:true});
          await page.screenshot({path:path.join(process.env.TOENOW_SCREENSHOTS,`${id}-${width}-${lang}-title.png`)});
        }
        assert.equal(await title.getAttribute('data-toenow-screen-owner'),'ToenowScreens');
        assert.equal(await title.locator('[data-screen-record="score"]').innerText(),'900',id+' saved title score');
        assert.equal(await title.locator('[data-screen-record="level"]').innerText(),lang==='en'?'LVL 5 · MASTER':'第 5 級 · 大師',id+' saved title level');
        const titleShape = await title.locator('.unified-title-card').evaluate(structure);
        if (!titleStructure) titleStructure=titleShape;
        assert.deepEqual(titleShape,titleStructure,id+' title DOM differs');
        assert.equal(await title.locator('.unified-practice-btn').count(),1,id+' practice button');
        await page.locator('#'+c.startId).click();
        await confirmReady(page,id);
        await page.evaluate(()=>window.__finishScreenTest());
        const end=page.locator('[data-toenow-screen="gameover"]');
        await end.waitFor({state:'visible'});
        await islandAppearance(end,'.modal-card',c.animalSpecies,3);
        const buttons = await end.evaluate(el => {
          const retry = getComputedStyle(el.querySelector('[data-screen-action="retry"]'));
          const back = getComputedStyle(el.querySelector('[data-screen-action="title"]'));
          return { retryImage: retry.backgroundImage, back: back.backgroundColor };
        });
        assert.equal(buttons.retryImage,'none',id+' island replay button has no neon gradient');
        assert.ok(buttons.back.match(/[\d.]+/g).slice(0,3).every(n=>Number(n)>210),id+' paper title button');
        await page.waitForTimeout(400);
        if (process.env.TOENOW_SCREENSHOTS) await page.screenshot({path:path.join(process.env.TOENOW_SCREENSHOTS,`${id}-${width}-${lang}-end.png`)});
        assert.equal(await end.getAttribute('data-toenow-screen-owner'),'ToenowScreens');
        const endShape = await end.locator('.modal-card').evaluate(structure);
        if (!endStructure) endStructure=endShape;
        assert.deepEqual(endShape,endStructure,id+' result DOM differs');
        assert.equal(await end.locator('[data-screen-field="score"]').innerText(),'321');
        assert.equal(await end.locator('[data-screen-field="bestScore"]').innerText(),'900');
        assert.equal(await end.locator('[data-screen-field="wave"]').innerText(),'13');
        assert.equal(await end.locator('[data-screen-field="level"]').innerText(),lang==='en'?'LVL 3 · ADVANCED':'第 3 級 · 進階');
        await page.mouse.move(0,0); await page.waitForTimeout(400);
        const geometry=await end.evaluate(el=>{const card=el.querySelector('.modal-card');const r=card.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height,gridHeight:el.querySelector('.stat-grid').getBoundingClientRect().height,overflow:card.scrollWidth>card.clientWidth,buttons:[...el.querySelectorAll('.modal-actions button')].map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height]})};});
        assert.ok(geometry.left>=0&&geometry.right<=width+.1&&!geometry.overflow,id+' screen overflow');
        assert.equal(geometry.buttons.length,3);
        geometry.buttons.forEach(size=>assert.ok(Math.abs(size[0]-geometry.buttons[0][0])<.1&&Math.abs(size[1]-geometry.buttons[0][1])<.1,id+' unequal buttons'));
        const sizeKey=width+'/'+lang, actualSize=[geometry.right-geometry.left,geometry.height,geometry.gridHeight];
        if (!dimensions.has(sizeKey)) dimensions.set(sizeKey,actualSize);
        actualSize.forEach((value,index)=>assert.ok(Math.abs(value-dimensions.get(sizeKey)[index])<.1,id+' result dimensions differ from other games: '+actualSize));
        for (const liveLanguage of ['zh-Hant','en',lang]) {
          await page.evaluate(l=>ToenowI18n.setLanguage(l),liveLanguage);
          await page.waitForTimeout(30);
          assert.equal(await end.locator('[data-screen-field="level"]').innerText(),liveLanguage==='en'?'LVL 3 · ADVANCED':'第 3 級 · 進階',id+' live language switch');
        }
        if (process.env.TOENOW_SCREENSHOTS && width===1100 && lang==='en') {
          fs.mkdirSync(process.env.TOENOW_SCREENSHOTS,{recursive:true});
          await page.screenshot({path:path.join(process.env.TOENOW_SCREENSHOTS,id+'-shared-end.png')});
        }
        await page.evaluate(()=>{ToenowLevels.shareScore=data=>window.__sharedScreenScore=data;});
        await end.locator('[data-screen-action="share"]').click();
        const shared=await page.evaluate(()=>window.__sharedScreenScore);
        assert.equal(shared.score,321); assert.equal(shared.wave,13); assert.equal(shared.level,3);
        await end.locator('[data-screen-action="retry"]').click();
        await end.waitFor({state:'hidden'});
        await confirmReady(page,id);
        await page.evaluate(()=>window.__finishScreenTest());
        await end.locator('[data-screen-action="title"]').click();
        await end.waitFor({state:'hidden'}); await title.waitFor({state:'visible'});
        assert.deepEqual(errors,[],id+' browser errors');
        result.standalone++; await page.close();
      }
      // Start through the actual shared practice picker and verify record isolation.
      const page=await browser.newPage({viewport:{width:900,height:850}});
      await page.addInitScript(k=>{localStorage.setItem(k.score,'17');localStorage.setItem(k.wave,'2');},keys[id]);
      await instrument(page,id); await page.goto(base+'/games/'+id+'/');
      await page.evaluate(k=>{localStorage.setItem(k.score,'17');localStorage.setItem(k.wave,'2');},keys[id]);
      await page.locator('.unified-practice-btn').click();
      await page.locator('.unified-practice-level-btn[data-level="3"]').click();
      if(id==='flash-brain') await page.waitForURL(/autostart=1/);
      await confirmReady(page,id);
      await page.waitForFunction(()=>typeof window.__finishScreenTest==='function');
      await page.evaluate(()=>window.__finishScreenTest());
      await page.locator('[data-toenow-screen="gameover"]').waitFor({state:'visible'});
      const records=await page.evaluate(k=>[localStorage.getItem(k.score),localStorage.getItem(k.wave)],keys[id]);
      assert.deepEqual(records,['17','2'],id+' practice overwrote records');
      result.practice++; await page.close();
      // Same production markup rendered inside an iframe.
      const embedded=await browser.newPage({viewport:{width:1100,height:850}});
      await instrument(embedded,id);
      await embedded.goto(base+'/');
      await embedded.setContent(`<iframe src="${base}/games/${id}/" style="width:100%;height:800px"></iframe>`);
      const frame=embedded.frameLocator('iframe');
      await frame.locator('#'+c.startId).click();
      await confirmReady(frame,id);
      await embedded.frames()[1].evaluate(()=>window.__finishScreenTest());
      await frame.locator('[data-toenow-screen="gameover"]').waitFor({state:'visible'});
      result.iframe++; await embedded.close();
      console.log('PASS '+id+': shared title/end DOM, EN/ZH desktop/mobile, actions, practice, iframe');
    }
    console.log(JSON.stringify(result));
  } finally {
    // Windows Edge can exit while its close acknowledgement remains pending.
    // Bound cleanup after assertions; the test outcome still comes from run().
    let cleanupTimer;
    await Promise.race([browser.close(),new Promise(resolve=>{cleanupTimer=setTimeout(resolve,5000);})]);
    clearTimeout(cleanupTimer);
  }
}
if (require.main === module) run().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});
module.exports = { instrument };
