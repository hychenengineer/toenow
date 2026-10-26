const { readSource } = require('./lib/game-source.cjs');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
const games = {
  'block-match': { modal: '#briefing-screen', button: '#btn-engage-phase', waves: [6, 11, 16, 21], hook: 'startNewGame(wave,true);window.__CHIP_DEFRAG__.jumpToWave(wave);openPhaseBriefing(PHASE_BRIEFINGS[wave]);', active: 'gameMode', timer: 'state.timeLeft' },
  'tap-match': { modal: '#modal-wave-brief', button: '#btn-begin-wave', waves: [1, 6, 11, 16, 21], hook: 'startNewRun(wave,true);', active: 'state.phase', timer: 'state.timeLeft' }
};
async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const screenshots = path.join(__dirname, '..', 'artifacts', `island-briefings-${Date.now()}`);
  fs.mkdirSync(screenshots, { recursive: true });
  let cases = 0;
  try {
    for (const [id, config] of Object.entries(games)) {
      for (const [width, height] of [[390, 850], [1100, 850], [320, 640], [844, 390]]) for (const lang of ['en', 'zh-Hant']) {
        const page = await browser.newPage({ viewport: { width, height }, hasTouch: true });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        let html = readSource(path.join(__dirname, '..', 'games', id, 'index.html'), 'utf8');
        const marker = html.lastIndexOf('})();');
        assert.ok(marker > 0);
        html = html.slice(0, marker) + `window.__briefStyleTest=wave=>{${config.hook}};window.__briefState=()=>({active:${config.active},time:${config.timer}});` + html.slice(marker);
        await page.route(`**/games/${id}/`, route => route.fulfill({ contentType: 'text/html', body: html }));
        await page.goto(`${base}/games/${id}/`);
        await page.evaluate(lang => window.ToenowI18n.setLanguage(lang), lang);
        const modal = page.locator(config.modal);
        for (const wave of config.waves) {
          await page.evaluate(wave => window.__briefStyleTest(wave), wave);
          await modal.waitFor({ state: 'visible' });
          await page.waitForTimeout(100);
          const appearance = await modal.locator('.modal-card').evaluate(el => {
            const css = getComputedStyle(el), r = el.getBoundingClientRect();
            const heading = el.querySelector('h2');
            return { background: css.backgroundColor, color: getComputedStyle(heading).color, radius: parseFloat(css.borderRadius), overflow: el.scrollWidth > el.clientWidth, x: r.x, y: r.y, right: r.right, bottom: r.bottom };
          });
          const rgb = text => text.match(/[\d.]+/g).slice(0, 3).map(Number);
          assert.ok(rgb(appearance.background).every(n => n > 210), `${id} paper card`);
          assert.ok(rgb(appearance.color).every(n => n < 130), `${id} readable dark heading`);
          assert.ok(appearance.radius >= 20, 'Soft island corners');
          assert.equal(appearance.overflow, false, `${id} no horizontal overflow at ${width}`);
          assert.ok(appearance.x >= 0 && appearance.right <= width && appearance.y >= 0 && appearance.bottom <= height, `${id} card fits ${width}x${height}`);
          const before = await page.evaluate(() => window.__briefState().time);
          await page.waitForTimeout(120);
          assert.equal(await page.evaluate(() => window.__briefState().time), before, 'Briefing keeps timer frozen');
          if ([390, 1100].includes(width) && [config.waves[0], 21].includes(wave)) await page.screenshot({ path: path.join(screenshots, `${id}-${width}-${lang}-${wave}.png`) });
          const button = modal.locator(config.button);
          await button.scrollIntoViewIfNeeded();
          assert.ok((await button.boundingBox()).height >= 44, 'Touch-sized button');
          await page.keyboard.press('Tab');
          await button.focus();
          const focused = await button.evaluate(el => getComputedStyle(el).backgroundColor);
          assert.ok(rgb(focused).every(n => n < 160), 'Keyboard focus keeps a dark readable button');
          await button.click();
          assert.equal(await modal.evaluate(el => el.hidden || el.classList.contains('hidden')), true, 'Begin closes briefing');
          assert.ok(['playing', 'STAGING'].includes(await page.evaluate(() => window.__briefState().active)), 'Begin resumes game');
          cases++;
        }
        assert.deepEqual(errors, []);
        console.log(`PASS ${id} ${width}x${height} ${lang}: all briefing tiers, paper styling, layout, frozen timer, begin`);
        await page.close();
      }
    }
    console.log(`PASS ${cases} briefing cases`);
  } finally {
    let timer;
    await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]);
    clearTimeout(timer);
  }
}
run().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
