const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = 'artifacts/island-entrances';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const failures = [], checks = [], errors = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    await p.route('https://**', route => new URL(base).hostname === new URL(route.request().url()).hostname ? route.continue() : route.abort());
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(base, { waitUntil: 'domcontentloaded' });
    await p.locator('#islandWelcome[open]').waitFor();
    await p.locator('#welcomeGuestBtn').click();
    async function check(name, run) { try { await run(); checks.push(name); } catch (e) { failures.push({ name, error: e.message }); } }
    await check('full game names in English and Chinese', async () => {
      for (const [language, spring, farm, siege] of [
        ['en', 'Capybara Hot Spring Garden', 'Carefree Farm', 'Animal Siege'],
        ['zh-Hant', '水豚溫泉花園', '無憂農場', '動物攻城戰']
      ]) {
        await p.evaluate(lang => ToenowI18n.setLanguage(lang), language);
        await p.locator('[data-island-select="carefree"]').click();
        assert.equal(await p.locator('#open-capybara').innerText(), spring);
        assert.equal(await p.locator('#open-carefree-farm').innerText(), farm);
        await p.locator('[data-island-select="expedition"]').click();
        assert.equal(await p.locator('#open-animal-siege').innerText(), siege);
      }
    });
    await check('hover glows without a box or movement', async () => {
      await p.locator('[data-island-select="carefree"]').click();
      const spring = p.locator('#open-capybara');
      await spring.hover();
      const style = await spring.evaluate(n => ({ border: getComputedStyle(n).borderTopWidth, background: getComputedStyle(n).backgroundImage, transform: getComputedStyle(n.firstElementChild).transform }));
      assert.equal(style.border, '0px');
      assert.match(style.background, /radial-gradient/);
      assert.equal(style.transform, 'none');
      await p.screenshot({ path: `${output}/hover-carefree.png`, fullPage: true });
    });
    await p.locator('[data-island-select="explore"]').click();
    const viewport = p.locator('.island-map-viewport');
    async function wheel(dx, dy, shift = false) {
      const box = await viewport.boundingBox();
      await p.mouse.move(box.x + box.width / 2, Math.max(100, Math.min(750, box.y + box.height / 2)));
      if (shift) await p.keyboard.down('Shift');
      await p.mouse.wheel(dx, dy);
      if (shift) await p.keyboard.up('Shift');
      await p.waitForTimeout(200);
    }
    await check('mouse wheel moves vertically inside the exploration map', async () => {
      for (const width of [1440, 1024, 390]) {
        await p.setViewportSize({ width, height: 900 });
        await viewport.scrollIntoViewIfNeeded();
        await viewport.evaluate(n => { n.scrollTop = 0; });
        await wheel(0, 180);
        assert(await viewport.evaluate(n => n.scrollTop > 0), `wheel must move map down at ${width}`);
        await wheel(0, -180);
        assert.equal(await viewport.evaluate(n => n.scrollTop), 0, `wheel moves map up at ${width}`);
      }
      await p.setViewportSize({ width: 1024, height: 900 });
    });
    await check('horizontal wheel and shift-wheel pan left and right', async () => {
      await viewport.scrollIntoViewIfNeeded();
      await viewport.evaluate(n => { n.scrollLeft = 0; });
      await wheel(150, 0);
      assert(await viewport.evaluate(n => n.scrollLeft > 0), 'trackpad pans right');
      await wheel(-150, 0);
      assert.equal(await viewport.evaluate(n => n.scrollLeft), 0);
      await wheel(0, 150, true);
      assert(await viewport.evaluate(n => n.scrollLeft > 0), 'Shift + mouse wheel pans right');
      await wheel(0, -150, true);
      assert.equal(await viewport.evaluate(n => n.scrollLeft), 0);
    });
    await check('wheel leaves the map at its vertical edge', async () => {
      await p.evaluate(() => scrollTo(0, 0));
      await viewport.evaluate(n => { n.scrollTop = n.scrollHeight; });
      const before = await p.evaluate(() => scrollY);
      await wheel(0, 350);
      assert(await p.evaluate(y => scrollY > y, before), 'page scroll must not be trapped');
    });
    await check('exploration landmarks brighten without lifting', async () => {
      const marker = p.locator('.island-location:not(.is-locked)').first();
      await marker.hover();
      const style = await marker.locator('.island-landmark').evaluate(n => ({ filter: getComputedStyle(n).filter, transform: getComputedStyle(n).transform }));
      assert.equal(style.transform, 'none');
      assert.match(style.filter, /brightness/);
    });
    await check('full labels remain within mobile viewport', async () => {
      await p.setViewportSize({ width: 320, height: 800 });
      for (const language of ['en', 'zh-Hant']) {
        await p.evaluate(lang => ToenowI18n.setLanguage(lang), language);
        await p.locator('[data-island-select="carefree"]').click();
        assert(await p.locator('#open-capybara span, #open-carefree-farm span').evaluateAll(nodes => nodes.every(n => {
          const r = n.getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth && n.scrollWidth <= n.clientWidth + 1;
        })));
        await p.screenshot({ path: `${output}/full-names-${language}-320.png`, fullPage: true });
      }
    });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ checks, failures, errors }, null, 2));
    fs.writeFileSync(`${output}/interaction-results.json`, JSON.stringify({ checks, failures, errors }, null, 2));
    assert.deepEqual(failures, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
