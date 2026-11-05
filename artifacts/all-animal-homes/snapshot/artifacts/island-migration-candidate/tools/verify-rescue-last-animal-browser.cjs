const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const origin = process.env.RESCUE_TEST_ORIGIN || 'http://127.0.0.1:8765';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext(mobile
        ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
        : { viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${origin}/games/animal-rescue-train/`);
      const click = locator => locator[mobile ? 'tap' : 'click']();
      await click(page.locator('#btn-start-game'));
      assert.equal(await page.locator('#last-animal-dialog').count(), 1, 'rule dialog exists');
      assert.equal(await page.locator('#last-animal-dialog').isVisible(), false, 'no rule popup in Level 1');
      await click(page.locator('#menu'));
      await click(page.locator('.unified-practice-btn'));
      await click(page.locator('[data-level="5"]'));
      async function checkRule() {
        const dialog = page.locator('#last-animal-dialog');
        assert.equal(await dialog.isVisible(), true, 'Level 5 shows rule before play');
        assert.equal(await dialog.evaluate(el => el.matches(':modal')), true, 'popup blocks background');
        const name = await page.locator('.required-last-goal .label').innerText();
        const animal = name.replace('LAST', '').trim();
        assert.match(await dialog.innerText(), new RegExp(`${animal} must be the last animal to depart`));
        assert.equal(await dialog.locator('svg').count(), 1, 'shows the selected animal graphic');
        assert.equal(await dialog.locator('svg').innerHTML(), await page.locator('.required-last-goal svg').innerHTML());
        assert.equal(await page.locator('#moves').innerText(), '0');
        assert.equal(await dialog.evaluate(el => el.getBoundingClientRect().width <= innerWidth), true);
      }
      await checkRule();
      if (mobile && process.env.RESCUE_POPUP_SCREENSHOT) {
        await page.screenshot({ path: process.env.RESCUE_POPUP_SCREENSHOT });
      }
      // A host resume cannot bypass the required acknowledgement.
      await page.evaluate(() => window.postMessage({ type: 'GAME_RESUME' }, location.origin));
      await checkRule();
      await page.keyboard.press('Escape');
      await checkRule();
      await click(page.locator('#acknowledge-last-animal'));
      assert.equal(await page.locator('#last-animal-dialog').isVisible(), false);
      await click(page.locator('[data-queue="0"]'));
      await click(page.locator('.car.boardable').first());
      assert.equal(await page.locator('#moves').innerText(), '1', 'acknowledgement enables play');
      await click(page.locator('#restart'));
      await checkRule();
      await click(page.locator('#acknowledge-last-animal'));
      await page.reload();
      await click(page.locator('#continue'));
      await checkRule();
      await page.goto(origin);
      await page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.id = 'rule-test-frame';
        frame.src = '/games/animal-rescue-train/';
        frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:99999;background:white';
        document.body.append(frame);
      });
      const embedded = page.frameLocator('#rule-test-frame');
      await click(embedded.locator('.unified-practice-btn'));
      await click(embedded.locator('[data-level="5"]'));
      assert.equal(await embedded.locator('#last-animal-dialog').isVisible(), true, 'popup works in Hub iframe');
      await page.evaluate(() => document.querySelector('#rule-test-frame').contentWindow.postMessage({ type: 'GAME_RESUME' }, location.origin));
      assert.equal(await embedded.locator('#last-animal-dialog').isVisible(), true, 'host resume preserves rule');
      await click(embedded.locator('#acknowledge-last-animal'));
      assert.equal(await embedded.locator('#last-animal-dialog').isVisible(), false);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS: Level 5 popup, animal match, acknowledgement, retry, continue (${mobile ? 'mobile touch' : 'desktop'})`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
