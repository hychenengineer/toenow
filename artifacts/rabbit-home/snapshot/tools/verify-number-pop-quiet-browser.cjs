const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8770';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1100, 390]) for (const lang of ['en', 'zh-Hant']) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        localStorage.setItem('toenow_tutorial_number-pop_v2', 'completed');
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });
      let js = fs.readFileSync(path.join(__dirname, '../games/number-pop/main.js'), 'utf8');
      const end = js.lastIndexOf('})();');
      js = js.slice(0, end) + `window.__quietPop={hold:()=>{game.state='paused';},release:()=>{game.state='playing';},harvests:()=>game.harvests?.map(c=>({elapsed:c.elapsed,x:c.x,y:c.y}))||[],advance:dt=>{updatePhysics(dt,0);renderArena();},effects:()=>({particles:typeof particlePool==='undefined'?0:particlePool.filter(p=>p.active).length,text:typeof floatingTexts==='undefined'?0:floatingTexts.filter(p=>p.active).length,pickup:typeof harvestPickup==='undefined'?false:!!harvestPickup}),wrong:()=>{const c=game.cores.filter(c=>!c.popped).sort((a,b)=>b.value-a.value)[0];handleCoreSelection(c);return c.errorFlash;}};` + js.slice(end);
      await page.route('**/games/number-pop/main.js*', r => r.fulfill({ contentType: 'application/javascript', body: js }));
      await page.goto(base + '/games/number-pop/');
      await page.evaluate(lang => ToenowI18n.setLanguage(lang), lang);
      await page.locator('#btn-start').click();
      const initial = await page.evaluate(() => __QUANTUM_GAME__.getState());
      for (let i = 0; i < 12; i++) {
        const before = await page.evaluate(() => __QUANTUM_GAME__.getState());
        await page.evaluate(() => __QUANTUM_GAME__.popLowestCore());
        const after = await page.evaluate(() => __QUANTUM_GAME__.getState());
        assert.ok(after.score > before.score, 'correct pop still scores');
        assert.ok(after.cores.filter(c => !c.popped).length < before.cores.filter(c => !c.popped).length, 'selected bubble disappears');
        assert.deepEqual(await page.evaluate(() => __quietPop.effects()), { particles: 0, text: 0, pickup: false }, 'correct pop has no extra effects');
        assert.equal(await page.evaluate(() => __quietPop.harvests().length), 1, 'one brief collection animation starts');
        if (i === 0 && width === 390 && lang === 'zh-Hant') {
          fs.mkdirSync(path.join(__dirname, '../artifacts/basket-harvest'), { recursive: true });
          await page.evaluate(() => { __quietPop.hold(); __quietPop.advance(0.04); });
          const frozen = await page.evaluate(() => __quietPop.harvests());
          await page.waitForTimeout(250);
          assert.deepEqual(await page.evaluate(() => __quietPop.harvests()), frozen, 'pause freezes collection');
          await page.screenshot({ path: path.join(__dirname, '../artifacts/basket-harvest/pressed.png') });
          await page.evaluate(() => __quietPop.advance(0.07));
          await page.screenshot({ path: path.join(__dirname, '../artifacts/basket-harvest/lifting.png') });
          await page.evaluate(() => { __quietPop.advance(0.1); __quietPop.release(); });
        }
        await page.waitForTimeout(220);
        await page.waitForFunction(() => __quietPop.harvests().length === 0, null, { timeout: 500 });
      }
      const final = await page.evaluate(() => __QUANTUM_GAME__.getState());
      assert.ok(final.combo >= 12 && final.maxCombo >= 12 && final.wave > initial.wave, 'combo and wave progression remain intact');
      assert.deepEqual(await page.evaluate(() => __quietPop.effects()), { particles: 0, text: 0, pickup: false }, 'high combo emits no trails');
      fs.mkdirSync(path.join(__dirname, '../artifacts/number-pop-quiet'), { recursive: true });
      await page.screenshot({ path: path.join(__dirname, `../artifacts/number-pop-quiet/${width}-${lang}.png`) });
      assert.ok(await page.evaluate(() => __quietPop.wrong()) > 0, 'mistake retains brief feedback');
      assert.equal((await page.evaluate(() => __QUANTUM_GAME__.getState())).combo, 0);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => __QUANTUM_GAME__.popLowestCore());
      assert.equal(await page.evaluate(() => __quietPop.harvests().length), 0, 'reduced motion collects immediately');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width} ${lang}: 12 basket collections, high combo, wave bonus, mistake feedback, reduced motion`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
