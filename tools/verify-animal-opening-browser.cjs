const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8877';

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const [width, height, language, embedded] of [
      [1280, 900, 'en', false], [390, 844, 'zh-Hant', false],
      [320, 568, 'zh-Hant', false], [844, 390, 'en', false],
      [1100, 850, 'zh-Hant', true], [390, 844, 'en', true]
    ]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(lang => {
        localStorage.setItem('toenow_language_v1', lang);
        localStorage.setItem('animal_siege_best_score_v1', '17');
        localStorage.setItem('animal_siege_best_wave_v1', '2');
        // No onboarding-completed flag: this must work for new players.
      }, language);
      let host = page;
      if (embedded) {
        await page.goto(base + '/');
        await page.setContent(`<iframe src="${base}/games/animal-siege/" style="border:0;width:100%;height:${height - 30}px"></iframe>`);
        host = page.frames().find(frame => frame.parentFrame());
        if (!host) { await page.locator('iframe').waitFor(); host = await page.locator('iframe').contentFrame(); }
      } else await page.goto(base + '/games/animal-siege/');
      await host.locator('#btn-start').waitFor({ state: 'visible' });
      assert.equal(await host.locator('.unified-practice-btn,[data-screen-practice]').count(), 0);
      const records = () => host.evaluate(() => [localStorage.getItem('animal_siege_best_score_v1'), localStorage.getItem('animal_siege_best_wave_v1')]);
      const before = await records();
      await host.locator('#btn-start').click();
      assert.equal(await host.locator('#opening-story').isVisible(), true, 'Start opens the story');
      assert.equal(await host.locator('#expedition').isVisible(), false, 'map waits for story');
      assert.equal(await host.evaluate(() => ToenowGameSDK.getInstance('animal-siege').runActive), false, 'reading does not start a scored run');
      assert.equal(await host.locator('[data-story-character]').count(), 3);
      const speakers = new Set();
      for (let step = 0; step < 6; step++) {
        const active = host.locator('[data-story-character][aria-current="true"]');
        speakers.add(await active.getAttribute('data-story-character'));
        assert.equal(await host.locator('#story-progress').innerText(), `${step + 1} / 6`);
        if (step === 1) {
          const old = await host.locator('#story-dialogue').innerText();
          await host.evaluate(lang => ToenowI18n.setLanguage(lang === 'en' ? 'zh-Hant' : 'en'), language);
          assert.notEqual(await host.locator('#story-dialogue').innerText(), old);
          assert.equal(await host.locator('#story-progress').innerText(), '2 / 6');
          await host.evaluate(lang => ToenowI18n.setLanguage(lang), language);
        }
        if (step === 0 && !embedded) {
          assert.equal(await host.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow');
          await page.screenshot({ path: path.join(os.tmpdir(), `toenow-opening-${width}-${language}.png`), fullPage: true });
        }
        await host.locator('#story-next').click();
      }
      assert.equal(speakers.size, 3);
      await host.locator('#expedition').waitFor({ state: 'visible' });
      assert.equal(await host.locator('#opening-story').isVisible(), false);
      await host.locator('[data-location="acorn"]').click();
      await host.locator('[data-attack="acorn"]').click();
      await host.locator('#battle').waitFor({ state: 'visible' });
      assert.equal(await host.locator('#battle').getAttribute('data-lesson'), 'false', 'first real battle has no automatic rehearsal');
      assert.equal(await host.locator('#battle-coach').isVisible(), false);
      await host.locator('#unit-guide-open').click();
      await host.locator('#unit-guide').waitFor({ state: 'visible' });
      await host.locator('#unit-guide-close').click();
      await host.evaluate(() => ToenowGameSDK.getInstance('animal-siege').pause());
      await host.locator('#battle-coach-replay').click();
      assert.equal(await host.locator('#battle').getAttribute('data-lesson'), 'true', 'manual rehearsal still opens');
      await host.locator('#battle-coach-skip').click();
      assert.equal(await host.locator('#battle').getAttribute('data-lesson'), 'false', 'manual rehearsal restores the real battle');
      await host.evaluate(() => ToenowGameSDK.getInstance('animal-siege').restart());
      await host.locator('#opening-story').waitFor({ state: 'visible' });
      assert.equal(await host.locator('#story-progress').innerText(), '1 / 6');
      await host.locator('#story-skip').click();
      await host.locator('#expedition').waitFor({ state: 'visible' });
      assert.deepEqual(await records(), before, 'story, restart and skip preserve records');
      await host.evaluate(() => ToenowGameSDK.getInstance('animal-siege').pause());
      await host.locator('#battle-coach-replay').click();
      await host.locator('[data-location="acorn"]').click();
      await host.locator('[data-attack="acorn"]').click();
      assert.equal(await host.locator('#battle').getAttribute('data-lesson'), 'true', 'map tips are opt-in for the next battle');
      await host.locator('#battle-coach-skip').click();
      // Existing isolated runs stay supported without offering Practice at entry.
      await host.evaluate(() => ToenowGameSDK.getInstance('animal-siege').start({ wave: 11, isPractice: true }));
      await host.locator('#expedition').waitFor({ state: 'visible' });
      assert.equal(await host.evaluate(() => ToenowGameSDK.getInstance('animal-siege').isPractice), true);
      assert.deepEqual(await records(), before);
      assert.deepEqual(errors, []);
      console.log(`PASS opening ${width}x${height} ${language} ${embedded ? 'iframe' : 'standalone'}: story, translations, real battle, restart, skip, records`);
      await page.close();
    }
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
