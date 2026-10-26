const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
const out = 'artifacts/number-pop-title-controls';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [320, 390, 1100]) for (const language of ['en', 'zh-Hant']) {
      console.log(`CHECK ${width}px ${language}`);
      const context = await browser.newContext({ viewport: { width, height: 850 } });
      await context.route('https://**', route => route.abort());
      await context.addInitScript(language => {
        localStorage.setItem('toenow_tutorial_number-pop_v2', 'completed');
        localStorage.setItem('toenow_language_v1', language);
      }, language);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
        openTheaterModal(GAMES_CONFIG.find(game => game.id === 'number-pop'));
      });
      const frame = page.frameLocator('#gameViewer');
      await frame.locator('#btn-start').click();
      const actions = page.locator('#theaterGameActions');
      await actions.waitFor({ state: 'visible' });
      assert.equal(await actions.locator('button').count(), 3);
      assert.equal(await frame.locator('.island-hud-controls').isVisible(), false);
      const title = await page.locator('#theaterTitle').boundingBox();
      for (const button of await actions.locator('button').all()) {
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44);
        assert.ok(box.x >= title.x + title.width && box.x + box.width <= width);
        assert.ok(box.y <= title.y + title.height && box.y + box.height >= title.y);
      }
      await page.screenshot({ path: `${out}/${width}-${language}.png` });
      const sound = actions.locator('button').nth(0);
      await sound.click();
      console.log('audio toggled');
      await page.waitForFunction(() => document.querySelector('#theaterGameActions button svg:nth-child(2)').style.display === 'block');
      await page.waitForTimeout(300);
      await sound.click();
      await actions.locator('button').nth(1).click();
      await frame.locator('#pause-screen.visible').waitFor();
      console.log('paused');
      await page.waitForTimeout(300);
      await actions.locator('button').nth(1).click();
      await frame.locator('#pause-screen.visible').waitFor({ state: 'hidden' });
      console.log('resumed');
      await page.waitForTimeout(300);
      await actions.locator('button').nth(2).click();
      await frame.locator('body[data-state="playing"][data-score="0"][data-wave="1"]').waitFor({ state: 'attached' });
      await page.locator('#fullscreenGameBtn').click();
      assert.equal(await page.evaluate(() => document.fullscreenElement?.id), 'theaterModal');
      await actions.waitFor({ state: 'visible' });
      await page.evaluate(() => document.exitFullscreen());
      await page.locator('#closeTheaterBtn').click();
      assert.equal(await actions.isVisible(), false);
      await page.evaluate(() => openTheaterModal(GAMES_CONFIG.find(game => game.id === 'number-pop')));
      await frame.locator('#btn-start').click();
      await actions.waitFor({ state: 'visible' });
      assert.equal(await actions.locator('button').count(), 3, 'reopening creates one set');
      const standalone = await context.newPage();
      await standalone.goto(`${base}/games/number-pop/`, { waitUntil: 'domcontentloaded' });
      await standalone.locator('#btn-start').click();
      await standalone.locator('.island-hud-controls').waitFor({ state: 'visible' });
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px ${language}: title alignment, audio, pause/resume, restart, fullscreen, reopen, standalone`);
      await context.close();
    }
  } catch (error) { console.error(error); throw error; }
  finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
