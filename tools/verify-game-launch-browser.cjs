const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const exploration = require('../shared/toenow-exploration.js');
const levels = require('../shared/toenow-levels.js');
const { LOCATIONS } = require('../shared/toenow-island.js');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const output = path.resolve(__dirname, '../artifacts/game-launch');
    fs.mkdirSync(output, { recursive: true });
    const values = {};
    const journey = exploration.create({ storage: {
      getItem: key => values[key] ?? null,
      setItem: (key, value) => { values[key] = String(value); }
    }, levels, gameIds: LOCATIONS.map(location => location.gameId) });
    journey.chooseGuest();
    for (const gameId of journey.snapshot().order.slice(0, -1)) journey.complete({ gameId, wave: 6 });
    journey.dismissDiscovery();
    for (const width of [1100, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(state => localStorage.setItem('toenow_exploration_v3', JSON.stringify(state)), journey.snapshot());
      await context.route('https://**', route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765');
      for (const location of LOCATIONS) {
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        const pattern = `**/games/${location.gameId}/index.html`;
        await page.route(pattern, async route => { await gate; await route.continue(); });
        await page.locator('#islandLocationSelect').selectOption(location.gameId);
        await page.evaluate(() => {
          window.__launchGaps = [];
          window.__watchLaunch = true;
          function sample() {
            if (!window.__watchLaunch) return;
            if (!document.querySelector('.island-location-dialog').open && Number(getComputedStyle(document.getElementById('theaterModal')).opacity) < 1) window.__launchGaps.push(performance.now());
            requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        });
        await page.locator('.island-play-button').click();
        try {
          await page.waitForTimeout(350);
          assert(await page.locator('.island-location-dialog').isVisible(), `${width}/${location.gameId}: keep location visible while game loads`);
          assert.equal(await page.locator('#theaterModal').evaluate(node => getComputedStyle(node).opacity), '1');
          if (location.gameId === 'flash-brain') await page.screenshot({ path: path.join(output, `${width}-loading.png`) });
        } finally { release(); }
        await page.locator('.island-location-dialog').waitFor({ state: 'hidden' });
        await page.locator('#gameViewer').contentFrame().locator(location.gameId === 'animal-rescue-train' ? 'body' : '[data-toenow-screen="title"]').waitFor({ state: 'visible' });
        assert.deepEqual(await page.evaluate(() => { window.__watchLaunch = false; return window.__launchGaps; }), [], 'no rendered frame exposes the Hub during launch');
        if (location.gameId === 'flash-brain') await page.screenshot({ path: path.join(output, `${width}-ready.png`) });
        await page.locator('#closeTheaterBtn').click();
        await page.waitForFunction(() => document.getElementById('gameViewer').contentDocument?.URL === 'about:blank');
        await page.unroute(pattern);
        console.log(`PASS: ${width}/${location.gameId} delayed launch and exit`);
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
