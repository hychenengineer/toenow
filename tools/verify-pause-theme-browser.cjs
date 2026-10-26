const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../shared/toenow-screen-config.js');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
const out = path.join(__dirname, '../artifacts/pause-theme');
async function run() {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let count = 0;
  try {
    for (const id of [...Object.keys(catalog), 'animal-rescue-train'].filter(id => !process.env.TOENOW_TEST_GAMES || process.env.TOENOW_TEST_GAMES.split(',').includes(id))) {
      for (const [width, height] of [[1100, 850], [390, 850], [844, 390]]) for (const lang of ['en', 'zh-Hant']) {
        const page = await browser.newPage({ viewport: { width, height } });
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.addInitScript(id => {
          localStorage.setItem('toenow_tutorial_' + id + '_v2', 'completed');
          for (const rule of ['thorns', 'priority']) localStorage.setItem('toenow_flash_lesson_' + rule + '_v1', 'completed');
        }, id);
        await page.goto(`${base}/games/${id}/`);
        await page.evaluate(lang => ToenowI18n.setLanguage(lang), lang);
        const expected = id === 'animal-rescue-train' ? null : await page.locator('[data-toenow-screen="title"]').evaluate(el => getComputedStyle(el).getPropertyValue('--island-accent').trim());
        if (id === 'animal-rescue-train') {
          await page.locator('#btn-start-game').click();
          await page.evaluate(() => ToenowGameSDK.getInstance('animal-rescue-train').pause());
        } else {
          await page.locator('#' + catalog[id].startId).click();
          if (id === 'flash-brain') await page.locator('[data-tutorial-finish]').click();
          if (id === 'tap-match') await page.locator('#btn-begin-wave').click();
          const pauseSelector = id === 'flash-brain' ? '.island-hud-controls button:last-child' :
            id === 'spot-quick' ? '#btnPauseHud' :
            ['tap-match', 'block-match'].includes(id) ? '#btn-pause-hud' : '#btn-pause';
          const pause = page.locator(pauseSelector);
          await pause.click();
        }
        const train = id === 'animal-rescue-train';
        const modal = page.locator(train ? '#pause-dialog' : '.unified-pause-screen');
        await modal.waitFor({ state: 'visible' });
        const card = train ? modal : modal.locator('.unified-pause-card');
        const appearance = await card.evaluate(el => {
          const c = getComputedStyle(el), r = el.getBoundingClientRect();
          return { bg: c.backgroundColor, ink: c.color, width: r.width, left: r.left, right: r.right, height: r.height };
        });
        const rgb = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
        assert.ok(rgb(appearance.bg).every(v => v > 210), id + ' light paper');
        assert.ok(rgb(appearance.ink).every(v => v < 130), id + ' readable ink');
        assert.ok(appearance.left >= 0 && appearance.right <= width + 1 && appearance.height <= height, id + ' card fits');
        if (!train) {
          const bg = await modal.evaluate(el => getComputedStyle(el).backgroundColor);
          assert.equal(bg, 'rgb(242, 239, 223)', 'opaque puzzle cover');
          const accent = await modal.locator('.unified-pause-resume-btn').evaluate(el => getComputedStyle(el).backgroundColor);
          const color = await page.evaluate(value => { const el = document.createElement('span'); el.style.color = value; document.body.append(el); const c = getComputedStyle(el).color; el.remove(); return c; }, expected);
          assert.equal(accent, color, id + ' matches game accent');
          await modal.locator('.unified-pause-action-btn').first().hover();
          assert.ok(rgb(await modal.locator('.unified-pause-action-btn').first().evaluate(el => getComputedStyle(el).color)).every(v => v < 130), 'hover ink');
        }
        if (lang === 'zh-Hant' && width !== 844) await page.screenshot({ path: path.join(out, `${id}-${width}.png`) });
        await modal.locator(train ? '#resume' : '.unified-pause-resume-btn').click();
        await modal.waitFor({ state: 'hidden' });
        assert.deepEqual(errors, []);
        console.log(`PASS ${id} ${width}x${height} ${lang}: themed pause, layout, resume`);
        count++;
        await page.close();
      }
    }
    console.log(`PASS ${count} pause cases`);
  } finally { await browser.close(); }
}
run().then(() => process.exit(0), e => { console.error(e); process.exit(1); });
