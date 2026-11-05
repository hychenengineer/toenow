const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
const games = fs.readdirSync(path.join(__dirname, '../games')).filter(id =>
  fs.existsSync(path.join(__dirname, '../games', id, 'index.html')));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1100, 390]) {
      const context = await browser.newContext({ locale: 'zh-TW', viewport: { width, height: 850 } });
      // Keep this UI regression independent of remote authentication/CDN latency.
      await context.route('https://**', route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.locator('.toenow-language-switch').waitFor();
      // Exercise the actual location modal from the reported screenshot.
      await page.evaluate(() => {
        document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
        const select = document.querySelector('#islandLocationSelect');
        select.value = 'number-pop';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.locator('.island-location-dialog[open]').waitFor();
      assert.equal(await page.locator('dialog .toenow-language-switch').count(), 0, 'location modal has no language control');
      assert.equal(await page.locator('.site-header .toenow-language-switch').count(), 1, 'control stays in Hub header');
      await page.locator('.island-dialog-close').click();
      await page.locator('.site-header .toenow-language-switch').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      await page.locator('.site-header .toenow-language-switch').click();
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-Hant');
      for (const id of games) {
        const standalone = await context.newPage();
        standalone.on('pageerror', error => errors.push(error.message));
        await standalone.goto(`${base}/games/${id}/`, { waitUntil: 'domcontentloaded' });
        await standalone.waitForFunction(() => window.ToenowI18n && document.readyState !== 'loading');
        assert.equal(await standalone.locator('.toenow-language-switch').count(), 0, `${id}: standalone has no control`);
        assert.equal(await standalone.locator('html').getAttribute('lang'), 'zh-Hant', `${id}: saved preference`);
        await standalone.close();
        await page.evaluate(id => { document.querySelector('#gameViewer').src = `games/${id}/`; }, id);
        const frame = page.frameLocator('#gameViewer');
        await frame.locator('html[lang="zh-Hant"]').waitFor({ state: 'attached' });
        assert.equal(await frame.locator('.toenow-language-switch').count(), 0, `${id}: iframe has no control`);
        await page.locator('.site-header .toenow-language-switch').click();
        await frame.locator('html[lang="en"]').waitFor({ state: 'attached' });
        await page.locator('.site-header .toenow-language-switch').click();
        await frame.locator('html[lang="zh-Hant"]').waitFor({ state: 'attached' });
        console.log(`PASS ${width}px ${id}: standalone, iframe, inherited language, Hub synchronization`);
      }
      assert.deepEqual(errors, [], 'no runtime errors');
      await context.close();
    }
    console.log('PASS language controls: all 10 games and location modal, desktop/mobile');
  } finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
