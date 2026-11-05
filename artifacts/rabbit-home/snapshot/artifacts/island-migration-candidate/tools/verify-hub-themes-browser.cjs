const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const out = path.resolve(__dirname, '../artifacts/hub-themes');
const themes = ['bright', 'arena', 'calm'];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [], errors = [];
  try {
    const context = await browser.newContext();
    // Exercise the real local Hub without depending on CDN/auth availability.
    await context.route('https://**', route => route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(5000);
    page.setDefaultNavigationTimeout(30000);
    await page.goto(base, {waitUntil: 'domcontentloaded'});
    // Theme regression keeps exercising the full game-list view alongside the island.
    await page.locator('#islandListViewBtn').click();
    const picker = page.locator('#hubThemeSelect');
    await picker.waitFor();
    assert.deepEqual(await picker.locator('option').evaluateAll(options => options.map(o => o.value)), themes);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 950 });
      for (const language of ['en', 'zh-Hant']) {
        await page.evaluate(lang => ToenowI18n.setLanguage(lang), language);
        for (const theme of themes) {
          await picker.selectOption(theme);
          assert.equal(await page.locator('html').getAttribute('data-hub-theme'), theme);
          const copy = await page.locator('#hubChallengeHero').innerText();
          assert(language === 'en' ? copy.includes('challenge') : copy.includes('挑戰'));
          assert.equal(await page.locator('.game-card').count(), 10);
          assert.equal(await page.locator('.game-launch img').count(), 10);
          assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${theme}/${width}/${language}: overflow`);
          const pickerBox = await picker.boundingBox();
          assert(pickerBox.width >= 140 && pickerBox.height >= 44);
          const overlap = await page.locator('.header-inner').evaluate(header => {
            const boxes = [...header.children].map(el => el.getBoundingClientRect());
            return boxes.some((a, i) => boxes.slice(i + 1).some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
          });
          assert(!overlap, `${theme}/${width}/${language}: header overlap`);
          if (process.env.TOENOW_THEMES_SCREENSHOTS !== '0' && [1440,390].includes(width) && language === 'zh-Hant') await page.screenshot({ path: path.join(out, `${theme}-${width}.png`), fullPage: true, animations: 'disabled' });
          results.push({ width, language, theme, status: 'PASS' });
        }
      }
    }
    console.log('PASS: 30 theme/width/language combinations');
    for (const theme of themes) {
      await picker.selectOption(theme);
      await page.reload({waitUntil: 'domcontentloaded'});
      assert.equal(await picker.inputValue(), theme);
      assert.equal(await page.locator('html').getAttribute('data-hub-theme'), theme);
      await page.locator('[data-category="math"]').click();
      assert.equal(await page.locator('.game-card').count(), 2);
      await picker.selectOption(themes[(themes.indexOf(theme) + 1) % 3]);
      assert.equal(await page.locator('.game-card').count(), 2, 'theme preserves active category');
      await page.locator('[data-category="all"]').click();
      await page.locator('.game-preview-button').first().click();
      await page.locator('.game-preview-dialog').waitFor({ state: 'visible' });
      try { await page.locator('.game-preview-close').click(); } catch (error) {
        console.error('Preview diagnostics',await page.locator('.game-preview-dialog').evaluate(dialog=>({open:dialog.open,html:dialog.outerHTML,scroll:dialog.scrollTop,rect:dialog.getBoundingClientRect().toJSON(),button:dialog.querySelector('button').getBoundingClientRect().toJSON(),style:getComputedStyle(dialog.querySelector('button')).cssText})));
        await page.screenshot({path:path.join(out,'preview-failure.png'),fullPage:true});
        throw error;
      }
      await page.locator('#openProfileBtn').click();
      await page.locator('#profileDrawer.open').waitFor({ state: 'visible' });
      await page.locator('#closeProfileBtn').click();
      await page.locator('#hubChallengeStart').click();
      await page.locator('#theaterModal.open').waitFor({ state: 'visible' });
      assert((await page.locator('#gameViewer').getAttribute('src')).includes('flash-brain'));
      await page.locator('#gameViewer').contentFrame().locator('[data-toenow-screen="title"]').waitFor({state:'visible'});
      await page.locator('#closeTheaterBtn').click();
      // The existing theater closes through opacity/pointer-events, not display:none.
      await page.waitForFunction(() => document.getElementById('theaterModal').getAttribute('aria-hidden') === 'true' && getComputedStyle(document.getElementById('theaterModal')).opacity === '0');
      assert.equal(await page.locator('#gameViewer').getAttribute('src'), 'about:blank');
      console.log('PASS: ' + theme + ' persistence and Hub navigation');
    }
    await page.evaluate(() => {localStorage.setItem('toenow_hub_theme_v1', 'unknown');localStorage.setItem('number_pop_best_score', '4321');});
    await page.reload({waitUntil: 'domcontentloaded'});
    assert.equal(await picker.inputValue(), 'bright');
    assert.equal(await page.evaluate(() => localStorage.getItem('number_pop_best_score')), '4321');
    const blockedContext = await browser.newContext();
    await blockedContext.route('https://**', route => route.abort());
    await blockedContext.addInitScript(() => {Storage.prototype.getItem = () => {throw Error('blocked');};Storage.prototype.setItem = () => {throw Error('blocked');};});
    const blocked = await blockedContext.newPage();
    await blocked.goto(base, {waitUntil: 'domcontentloaded', timeout: 30000});
    await blocked.locator('#hubThemeSelect').selectOption('calm');
    assert.equal(await blocked.locator('html').getAttribute('data-hub-theme'), 'calm', 'theme works without storage');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, persistence: 'PASS', navigation: 'PASS', blockedStorage: 'PASS', errors }, null, 2));
    console.log(`PASS: ${results.length} theme/width/language combinations; persistence, filtering, previews, profile, iframe launch/close, invalid preference and blocked storage.`);
  } finally {
    // Edge can exit before acknowledging cleanup on Windows.
    let timer;
    await Promise.race([browser.close(),new Promise(resolve => {timer=setTimeout(resolve,5000);})]);
    clearTimeout(timer);
  }
})().then(() => process.exit(0), error => {console.error(error);process.exit(1);});
