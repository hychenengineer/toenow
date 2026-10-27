const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const levels = require('../shared/toenow-levels.js');
const { create } = require('../shared/toenow-exploration.js');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/hub-discovery-layout');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  let checks = 0;
  try {
    for (const cleared of [0, 9, 10]) {
      const values = {};
      const flow = create({ storage: { getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = String(value); } }, levels, gameIds: Object.keys(levels.GAME_STORAGE_KEYS) });
      flow.chooseGuest();
      for (const gameId of flow.snapshot().order.slice(0, cleared)) flow.complete({ gameId, wave: 6, completedLevel: 1 });
      flow.dismissDiscovery();
      const context = await browser.newContext();
      await context.route('https://**', route => route.abort());
      await context.addInitScript(values => {
        if (!localStorage.getItem('toenow_exploration_v3')) {
          for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
        }
        // An older tab's list preference must not replace the discovery map.
        localStorage.setItem('toenow_island_view_v1', 'list');
      }, values);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.locator('.island-location').first().waitFor();
      assert.equal(await page.locator('#leaderboardUnlockNotice').isVisible(), cleared === 10);
      if (cleared === 10) {
        await page.evaluate(() => ToenowI18n.setLanguage('zh-Hant'));
        assert.equal(await page.locator('#leaderboardUnlockTitle').innerText(), '排行榜已解鎖！');
        await page.screenshot({ path: path.join(output, 'leaderboard-unlocked-notice.png') });
        await page.locator('#viewUnlockedLeaderboardBtn').click();
        assert.equal(await page.locator('#leaderboardModal').getAttribute('aria-hidden'), 'false');
        await page.locator('#closeLeaderboardBtn').click();
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.island-location').first().waitFor();
        assert.equal(await page.locator('#leaderboardUnlockNotice').isVisible(), false, 'notice is only shown until acknowledged');
      }
      for (const width of [1440, 390]) for (const language of ['en', 'zh-Hant']) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(lang => ToenowI18n.setLanguage(lang), language);
        for (const selector of ['.category-tabs', '.hub-theme-control', '.island-view-switch', '.island-preview-control', '.island-map-bottom', '.island-legend', '#hubListView']) {
          assert.equal(await page.locator(selector).isVisible(), false, `${selector}: ${cleared}/${width}/${language}`);
        }
        assert.equal(await page.locator('.island-map-panel').isVisible(), true);
        assert.equal(await page.locator('.island-guidance').isVisible(), true);
        assert.equal(await page.locator('#openLeaderboardBtn').isVisible(), cleared === 10);
        assert.equal(await page.locator('.island-location.is-locked').count(), cleared === 0 ? 9 : 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, `${cleared}-cleared-${width}-${language}.png`), fullPage: true });
        checks++;
      }
      if (cleared === 10) {
        await page.locator('#openLeaderboardBtn').click();
        assert.equal(await page.locator('#leaderboardModal').getAttribute('aria-hidden'), 'false');
        await page.locator('#closeLeaderboardBtn').click();
      } else {
        await page.evaluate(() => document.getElementById('openLeaderboardBtn').click());
        assert.equal(await page.locator('#leaderboardModal').getAttribute('aria-hidden'), 'true');
      }
      if (cleared === 9) {
        // Complete the last place through the real iframe progress contract.
        await page.locator('[data-island-game="animal-rescue-train"]').click();
        await page.locator('.island-play-button').click();
        await page.locator('#gameViewer').contentFrame().locator('#btn-start-game').waitFor();
        const frame = page.frames().find(frame => frame.url().includes('/games/animal-rescue-train/'));
        await frame.evaluate(() => parent.postMessage({ type: 'GAME_PROGRESS', gameId: 'animal-rescue-train', wave: 1, completedLevel: 1, isPractice: false }, location.origin));
        await page.waitForFunction(() => !document.getElementById('openLeaderboardBtn').hidden);
        assert.equal(await page.locator('#leaderboardUnlockNotice').isVisible(), false, 'do not interrupt the game');
        await page.locator('#closeTheaterBtn').click();
        await page.locator('#leaderboardUnlockNotice').waitFor({ state: 'visible' });
        await page.waitForFunction(() => getComputedStyle(document.getElementById('theaterModal')).opacity === '0');
        await page.screenshot({ path: path.join(output, 'leaderboard-unlocked-mobile-notice.png') });
        await page.locator('#dismissLeaderboardNoticeBtn').click();
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.island-location').first().waitFor();
        assert.equal(await page.locator('#leaderboardUnlockNotice').isVisible(), false);
        assert.equal(await page.locator('#openLeaderboardBtn').isVisible(), true);
      }
      if (cleared === 10) {
        // An unseen notice must not cover a game opened from a share link.
        await page.evaluate(() => {
          const state = JSON.parse(localStorage.getItem('toenow_exploration_v3'));
          delete state.leaderboardNoticeSeen;
          localStorage.setItem('toenow_exploration_v3', JSON.stringify(state));
        });
        await page.goto(base + '/?play=number-pop', { waitUntil: 'domcontentloaded' });
        await page.locator('#theaterModal.open').waitFor();
        assert.equal(await page.locator('#leaderboardUnlockNotice').isVisible(), false, 'deep link starts the game before announcing access');
        await page.locator('#closeTheaterBtn').click();
        await page.locator('#leaderboardUnlockNotice').waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('toenow_exploration_v3')).leaderboardNoticeSeen === true);
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
    console.log(`PASS: ${checks} discovery layouts; fresh / all places open / all Level 1 clears; leaderboard gating and modal; no page errors.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
