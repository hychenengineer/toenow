const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1100]) for (const lang of ['en', 'zh-Hant']) {
      const page = await browser.newPage({ viewport: { width, height: 850 }, hasTouch: true });
      await page.addInitScript(()=>{localStorage.setItem('toenow_tutorial_flash-brain_v2','completed');for(const rule of ['thorns','priority'])localStorage.setItem('toenow_flash_lesson_'+rule+'_v1','completed');});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/games/flash-brain/?wave=21');
      await page.evaluate(lang => window.ToenowI18n.setLanguage(lang), lang);
      await page.locator('.unified-start-btn').click();
      await page.locator('[data-tutorial-finish]').click();
      const notice = page.getByTestId('priority-notice');
      await notice.waitFor({ state: 'visible', timeout: 2000 });
      const expected = lang === 'en' ? 'Tap Yellow 1 first, then the other elephant bed.' : '先點黃色 1，再點其他大象花圃。';
      assert.equal(await notice.getAttribute('role'), 'status');
      const bounds = await notice.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, 'Notice fits viewport');
      assert.equal(await notice.evaluate(el => el.scrollWidth <= el.clientWidth), true, 'Notice text fits');
      await page.waitForFunction(() => window.__SYNAPSE_STATE?.phase === 'PHASE_FLASH');
      assert.equal(await notice.isVisible(), true, 'Notice remains during memorization');
      assert.match(await notice.innerText(), lang==='en'?/Remember/:/記住/);
      await page.waitForFunction(() => window.__SYNAPSE_STATE?.phase === 'PHASE_INPUT');
      assert.equal(await notice.isVisible(), true, 'Notice remains until priority is tapped');
      assert.equal(await notice.innerText(), expected);
      await page.screenshot({ path: `artifacts/flash-priority-notice-${width}-${lang}.png` });
      const target = await page.evaluate(() => window.__SYNAPSE_STATE.cells.find(c => c.type === 'PRIORITY'));
      const canvas = await page.getByTestId('matrix-canvas').boundingBox();
      await page.touchscreen.tap(canvas.x + target.screenX, canvas.y + target.screenY);
      await page.getByTestId('phase-notice').waitFor({state:'visible'});
      assert.equal(await page.evaluate(() => window.__SYNAPSE_STATE.cells.find(c => c.type === 'PRIORITY').tapped), true);
      await page.screenshot({ path: `artifacts/flash-priority-after-${width}-${lang}.png` });
      // Restart restores the reminder; pause hides it together with the arena.
      await page.getByTestId('telemetry-hud').locator('button').nth(1).click();
      await page.locator('[data-tutorial-finish]').click();
      await notice.waitFor({ state: 'visible' });
      await page.getByTestId('telemetry-hud').locator('button').nth(2).click();
      assert.equal(await notice.isVisible(), false, 'Pause hides notice');
      assert.deepEqual(errors, []);
      await page.goto(base + '/games/flash-brain/?wave=20&autostart=1');
      await page.getByTestId('matrix-canvas').waitFor();
      assert.equal(await notice.count(), 0, 'No priority notice in ordinary waves');
      console.log(`PASS ${width} ${lang}: priority notice lifecycle, translation, layout, restart, pause, ordinary wave`);
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 850 }, hasTouch: true });
    const values={},journey=require('../shared/toenow-exploration.js').create({storage:{getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=String(value);}},levels:require('../shared/toenow-levels.js'),gameIds:require('../shared/toenow-island.js').LOCATIONS.map(location=>location.gameId)});
    journey.chooseGuest();for(const id of journey.snapshot().order.slice(0,-1))journey.complete({gameId:id,wave:6});journey.dismissDiscovery();
    await page.addInitScript(state=>localStorage.setItem('toenow_exploration_v3',JSON.stringify(state)),journey.snapshot());
    await page.addInitScript(()=>{localStorage.setItem('toenow_tutorial_flash-brain_v2','completed');for(const rule of ['thorns','priority'])localStorage.setItem('toenow_flash_lesson_'+rule+'_v1','completed');});
    await page.goto(base + '/?play=flash-brain');
    await page.frameLocator('#gameViewer').locator('.unified-start-btn').waitFor();
    const frame = page.frames().find(f => f.url().includes('/games/flash-brain/'));
    await frame.goto(base + '/games/flash-brain/?wave=21');
    await frame.evaluate(() => window.ToenowI18n.setLanguage('en'));
    await frame.locator('.unified-start-btn').click();
    await frame.locator('[data-tutorial-finish]').click();
    await frame.waitForFunction(()=>window.__SYNAPSE_STATE?.phase==='PHASE_INPUT');
    const notice = frame.getByTestId('priority-notice');
    await notice.waitFor({ state: 'visible' });
    assert.equal(await notice.innerText(), 'Tap Yellow 1 first, then the other elephant bed.');
    await frame.evaluate(() => window.ToenowI18n.setLanguage('zh-Hant'));
    await page.waitForTimeout(100);
    assert.equal(await notice.innerText(), '先點黃色 1，再點其他大象花圃。');
    await frame.evaluate(() => window.ToenowI18n.setLanguage('en'));
    await page.waitForTimeout(100);
    assert.equal(await notice.innerText(), 'Tap Yellow 1 first, then the other elephant bed.');
    console.log('PASS Hub iframe: priority notice and live EN/ZH switching');
    await page.close();
  } finally {
    let timer;
    await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]);
    clearTimeout(timer);
  }
}
run().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
