const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/flash-progressive');

async function tapCell(page, type, wrong = false) {
  const point = await page.evaluate(({ type, wrong }) => {
    const state = window.__lessonEngineState;
    const cell = state.waveState.cells.find(cell => !cell.tapped && cell.type === (wrong ? 'EMPTY' : type));
    const geometry = state.cellScreenGeometries.find(geometry => geometry.id === cell.id);
    const box = document.querySelector('canvas').getBoundingClientRect();
    return { x: box.left + geometry.centerX, y: box.top + geometry.centerY };
  }, { type, wrong });
  await page.mouse.click(point.x, point.y);
}
async function lesson(page, kind, lang, finish=true) {
  await page.locator('[data-tutorial-advance]').waitFor({ state: 'visible' });
  const expected = kind === 'thorns' ? /Red|紅色/ : kind === 'priority' ? /Yellow|黃色/ : /elephants|大象/;
  assert.match(await page.locator('#tutorial-instruction').innerText(), expected);
  const before = await page.evaluate(() => ({ time: __lessonEngineState.globalTimeRemaining, phase: __lessonEngineState.phase }));
  await page.waitForTimeout(2400);
  assert.deepEqual(await page.evaluate(() => ({ time: __lessonEngineState.globalTimeRemaining, phase: __lessonEngineState.phase })), before, 'lesson must wait indefinitely for the player');
  assert.equal(before.phase, 'PHASE_FLASH');
  if (kind === 'basic') assert(await page.evaluate(() => __lessonEngineState.waveState.cells.every(cell => !['DECOY', 'PRIORITY'].includes(cell.type))));
  await page.locator('[data-tutorial-advance]').click();
  assert.equal(await page.evaluate(() => __lessonEngineState.phase), 'PHASE_INPUT');
  await tapCell(page, kind==='thorns'?'DECOY':'TARGET', kind!=='thorns');
  await page.locator('[data-tutorial-advance]').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => __lessonEngineState.waveState.tappedTargetsCount), 0);
  assert.equal(await page.evaluate(() => __lessonEngineState.globalTimeRemaining), before.time);
  await page.locator('[data-tutorial-advance]').click();
  if (kind === 'priority') {
    await tapCell(page, 'TARGET');
    await page.locator('[data-tutorial-advance]').waitFor({ state: 'visible' });
    await page.locator('[data-tutorial-advance]').click();
    await tapCell(page, 'PRIORITY');
    await page.waitForFunction(() => __lessonEngineState.waveState.prioritySatisfied && !/Yellow|黃色/.test(document.getElementById('tutorial-instruction').textContent));
    assert.doesNotMatch(await page.locator('#tutorial-instruction').innerText(), /Yellow|黃色/);
  } else await tapCell(page, 'TARGET');
  await tapCell(page, 'TARGET');
  if(!finish){await page.locator('[data-tutorial-advance]').waitFor({state:'visible'});return;}
  await page.locator('[data-tutorial-finish]').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => __lessonEngineState.score), 0);
  assert.match(await page.locator('#tutorial-instruction').innerText(), lang === 'en' ? /remembered/ : /學會/);
  await page.locator('[data-tutorial-finish]').click();
}
async function ready(page) {
  await page.locator('[data-tutorial-finish]').waitFor({ state: 'visible' });
  assert.match(await page.locator('#tutorial-instruction').innerText(), /Ready to begin|準備好了嗎/);
  const time = await page.evaluate(() => __lessonEngineState.globalTimeRemaining);
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(() => __lessonEngineState.globalTimeRemaining), time);
  await page.locator('[data-tutorial-finish]').click();
  await page.waitForFunction(() => __lessonEngineState.phase === 'PHASE_FLASH');
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1100]) for (const lang of ['en', 'zh-Hant']) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route('https://**', route => route.abort());
      await context.route('**/games/flash-brain/tutorial.js', route => route.fulfill({ contentType: 'application/javascript', body:
        fs.readFileSync(path.resolve(__dirname, '../games/flash-brain/tutorial.js'), 'utf8') + '\nconst step=FlashBrainTutorial.beforeStep;FlashBrainTutorial.beforeStep=(state,shell)=>{window.__lessonEngineState=state;step(state,shell);};' }));
      await context.addInitScript(lang => {
        localStorage.setItem('toenow_language_v1', lang);
        localStorage.setItem('flash_brain_best_score_v1', '777');
        localStorage.setItem('flash_brain_best_wave_v1', '2');
        window.__protectedWrites = [];
        const write = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          if (window.ToenowTutorials?.isActive('flash-brain') && /best|milestone|game_scores/.test(key)) window.__protectedWrites.push(key);
          return write.call(this, key, value);
        };
      }, lang);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/games/flash-brain/');
      await page.locator('.unified-start-btn').click();
      await lesson(page, 'basic', lang);
      await ready(page);
      assert.equal(await page.getByTestId('priority-notice').count(), 0);
      await page.screenshot({ path: path.join(output, `${width}-${lang}-basic.png`) });
      await page.goto(base + '/games/flash-brain/?wave=11&practice=1&autostart=1');
      await lesson(page, 'thorns', lang);
      await ready(page);
      await page.goto(base + '/games/flash-brain/?wave=21&practice=1&autostart=1');
      await page.locator('[data-tutorial-advance]').waitFor({ state: 'visible' });
      await page.screenshot({ path: path.join(output, `${width}-${lang}-priority.png`) });
      await lesson(page, 'priority', lang);
      await ready(page);
      await page.waitForFunction(() => __lessonEngineState.phase === 'PHASE_INPUT');
      await tapCell(page, 'PRIORITY');
      assert.equal(await page.getByTestId('priority-notice').count(), 0);
      assert.match(await page.getByTestId('phase-notice').innerText(), /Tap where|點回/);
      assert.equal(await page.evaluate(() => localStorage.getItem('flash_brain_best_score_v1')), '777');
      assert.equal(await page.evaluate(() => localStorage.getItem('flash_brain_best_wave_v1')), '2');
      assert.deepEqual(await page.evaluate(() => __protectedWrites), []);
      await page.goto(base + '/games/flash-brain/?wave=21&autostart=1');
      await ready(page);
      assert.equal(await page.locator('[data-tutorial-advance]').isVisible(), false, 'learned rules must not interrupt again');
      await page.goto(base+'/games/flash-brain/');
      await page.locator('.unified-start-btn').click();
      await page.locator('[data-tutorial-finish]').waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      await page.locator('.unified-start-btn').waitFor({state:'visible'});
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(()=>document.body.dataset.state),'title','cancel ready must return to title');
      await page.locator('[data-tutorial-replay]').click();
      await lesson(page,'basic',lang,false);
      await lesson(page,'thorns',lang,false);
      await lesson(page,'priority',lang);
      await page.locator('.unified-start-btn').waitFor({state:'visible'});
      if(width===390&&lang==='en'){
        for(const [wave,kind] of [[10,'thorns'],[20,'priority']]){
          await page.evaluate(kind=>localStorage.removeItem('toenow_flash_lesson_'+kind+'_v1'),kind);
          await page.goto(base+`/games/flash-brain/?wave=${wave}&practice=1&autostart=1`);
          await ready(page);
          await page.waitForFunction(()=>__lessonEngineState.phase==='PHASE_INPUT');
          while(await page.evaluate(()=>__lessonEngineState.phase==='PHASE_INPUT'))await tapCell(page,'TARGET');
          await page.locator('[data-tutorial-advance]').waitFor({state:'visible'});
          assert.equal(await page.evaluate(()=>__lessonEngineState.waveState.config.wave),wave+1,'new-rule lesson starts on the real next wave');
          await lesson(page,kind,lang);
          await page.locator('#toenow-tutorial').waitFor({state:'detached'});
        }
      }
      if(width===390&&lang==='zh-Hant'){
        await page.evaluate(()=>{localStorage.removeItem('toenow_flash_lesson_thorns_v1');localStorage.removeItem('toenow_flash_lesson_priority_v1');});
        await page.route(base+'/__flash-lesson-frame',route=>route.fulfill({contentType:'text/html',body:`<iframe src="${base}/games/flash-brain/?wave=21&practice=1&autostart=1" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`}));
        await page.goto(base+'/__flash-lesson-frame');
        const frame=page.frames().find(frame=>frame.parentFrame());
        frame.mouse=page.mouse;
        await lesson(frame,'thorns',lang);
        await lesson(frame,'priority',lang);
        await ready(frame);
        await frame.evaluate(()=>ToenowI18n.setLanguage('en'));
        await frame.waitForFunction(()=>/Remember|Tap|Get ready/.test(document.querySelector('.island-hud-task')?.textContent||''));
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${width}/${lang}: basic, retry, ready, thorn/priority lessons, practice, progress and phase prompts`);
    }
  } finally {
    let cleanupTimer;
    await Promise.race([browser.close(),new Promise(resolve=>{cleanupTimer=setTimeout(resolve,5000);})]);
    clearTimeout(cleanupTimer);
  }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
