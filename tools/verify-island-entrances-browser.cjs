const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/island-entrances');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], checks = [];
  try {
    const context = await browser.newContext({ hasTouch: true });
    const values = {};
    const journey = require('../shared/toenow-exploration.js').create({ storage: {
      getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = String(value); }
    }, levels: require('../shared/toenow-levels.js'), gameIds: require('../shared/toenow-island.js').LOCATIONS.map(place => place.gameId) });
    journey.chooseGuest();
    await context.addInitScript(state => localStorage.setItem('toenow_exploration_v3', JSON.stringify(state)), journey.snapshot());
    await context.route('https://**', route => route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('[data-island-select]').count(), 3, 'three island navigation buttons');
    assert(await page.locator('#islandExplorer').isVisible());
    const savedRecords = () => {
      const values = Object.fromEntries(Object.entries(localStorage).filter(([key]) =>
        /best_score|best_wave|high_score|toenow_game_scores|carefree_farm|capybara/.test(key)));
      const journey = JSON.parse(localStorage.getItem('toenow_exploration_v3'));
      values.exploration = { opened: journey.opened, completed: journey.completed };
      return values;
    };
    const before = await page.evaluate(savedRecords);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 950 });
      for (const language of ['en', 'zh-Hant']) {
        await page.evaluate(lang => ToenowI18n.setLanguage(lang), language);
        for (const island of ['carefree', 'expedition']) {
          await page.locator(`[data-island-select="${island}"]`).click();
          const panel = page.locator(`[data-island-panel="${island}"]`);
          assert(await panel.isVisible());
          assert.equal(await page.locator('#islandExplorer').isVisible(), false);
          assert.equal(await page.locator('[data-island-select][aria-pressed="true"]').count(), 1);
          const image = panel.locator('.archipelago-art');
          await image.evaluate(image => image.decode());
          const buttons = panel.locator('.island-game-entry');
          assert.equal(await buttons.count(), island === 'carefree' ? 2 : 1);
          assert(await buttons.evaluateAll(nodes => nodes.every(node => {
            const r = node.getBoundingClientRect();
            return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth;
          })), 'hotspots stay visible and touch-sized');
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow');
          if (language === 'zh-Hant') {
            assert.equal(await page.locator('[data-island-select="carefree"]').innerText(), '無憂島');
            assert.equal(await page.locator('[data-island-select="expedition"]').innerText(), '遠征島');
          }
          if ([1440, 390].includes(width) && language === 'zh-Hant')
            await page.screenshot({ path: path.join(output, `${island}-${width}.png`), fullPage: true });
          checks.push(`${width}/${language}/${island}`);
        }
      }
    }
    await page.evaluate(() => ToenowI18n.setLanguage('en'));
    const after = await page.evaluate(savedRecords);
    assert.deepEqual(after, before, 'navigation must not change game saves or progression');
    for (const [island, button, game] of [
      ['carefree', 'open-capybara', 'capybara-drift'],
      ['carefree', 'open-carefree-farm', 'carefree-farm'],
      ['expedition', 'open-animal-siege', 'animal-siege']
    ]) {
      await page.locator(`[data-island-select="${island}"]`).click();
      const hotspot = await page.locator(`#${button}`).boundingBox();
      await page.touchscreen.tap(hotspot.x + hotspot.width / 2, hotspot.y + hotspot.height / 2);
      await page.frameLocator('#gameViewer').locator('#btn-start').waitFor({ state: 'visible' });
      assert((await page.locator('#gameViewer').getAttribute('src')).includes(`games/${game}/`));
      await page.frameLocator('#gameViewer').locator('#btn-start').click();
      await page.frameLocator('#gameViewer').locator(game === 'animal-siege' ? '#back' : '#back-hub').click();
      await page.waitForFunction(() => document.getElementById('theaterModal').getAttribute('aria-hidden') === 'true');
      assert(await page.locator(`[data-island-panel="${island}"]`).isVisible());
      await page.locator(`#${button}`).focus();
      await page.keyboard.press('Enter');
      await page.frameLocator('#gameViewer').locator('#btn-start').waitFor({ state: 'visible' });
      await page.locator('#closeTheaterBtn').click();
      checks.push(`${game}/entry-return-keyboard`);
    }
    await page.locator('[data-island-select="explore"]').click();
    assert(await page.locator('#islandExplorer').isVisible());
    assert.equal(await page.locator('.island-location').count(), 10);
    for (const game of ['carefree-farm', 'animal-siege']) {
      await page.goto(`${base}/?play=${game}`, { waitUntil: 'domcontentloaded' });
      await page.frameLocator('#gameViewer').locator('#btn-start').waitFor({ state: 'visible' });
      await page.locator('#closeTheaterBtn').click();
      assert(await page.locator(`[data-island-panel="${game === 'animal-siege' ? 'expedition' : 'carefree'}"]`).isVisible());
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, errors, output }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
