// Real browser regression for touch compatibility events and deliberate toggles.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const embedded of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 850 }, hasTouch: true, isMobile: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + (embedded ? '/?play=add-up' : '/games/add-up/'));
      const host = embedded ? page.frameLocator('#gameViewer') : page;
      await host.locator('#btn-start-game').click();
      const canvas = host.locator('#reactor-canvas');
      const state = () => canvas.evaluate(() => window.__overclockReactor.getState());
      const bag = (await state()).nodes[0];
      const selected = async () => (await state()).nodes.find(n => n.id === bag.id).selected;
      const point = async () => {
        const n = (await state()).nodes.find(n => n.id === bag.id);
        const rect = await canvas.boundingBox();
        return { x: rect.x + n.x, y: rect.y + n.y };
      };
      const cdp = await context.newCDPSession(page);
      let p = await point();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
      assert.equal(await selected(), true, 'Touch down selects');
      await page.waitForTimeout(250);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(100);
      assert.equal(await selected(), true, 'Selection survives touch release after 250ms');
      p = await point();
      await page.touchscreen.tap(p.x, p.y);
      assert.equal(await selected(), false, 'Second deliberate tap deselects');
      for (const expected of [true, false, true, false]) {
        p = await point();
        await page.touchscreen.tap(p.x, p.y);
        assert.equal(await selected(), expected, 'Rapid intentional taps each toggle once');
      }
      p = await point();
      await page.mouse.click(p.x, p.y);
      assert.equal(await selected(), true, 'Mouse click selects once');
      // Deterministic compatibility delay, independent of browser timing policies.
      await page.waitForTimeout(250);
      await canvas.evaluate(el => {
        const n = window.__overclockReactor.getState().nodes.find(n => n.selected);
        const rect = el.getBoundingClientRect();
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: rect.left + n.x, clientY: rect.top + n.y }));
      });
      assert.equal(await selected(), true, 'Late compatibility mouse event is ignored');
      assert.deepEqual(errors, [], 'No browser errors');
      console.log(`PASS ${embedded ? 'Hub iframe' : 'standalone'}: held touch, release, deliberate deselect, rapid taps, mouse, delayed compatibility event`);
      await context.close();
    }
    const context = await browser.newContext();
    await context.addInitScript(() => { window.PointerEvent = undefined; });
    const page = await context.newPage();
    await page.goto(base + '/games/add-up/');
    await page.locator('#btn-start-game').click();
    const canvas = page.locator('#reactor-canvas');
    for (const expected of [true, false]) {
      const n = await page.evaluate(() => window.__overclockReactor.getState().nodes[0]);
      const rect = await canvas.boundingBox();
      await page.mouse.click(rect.x + n.x, rect.y + n.y);
      assert.equal(await page.evaluate(() => window.__overclockReactor.getState().nodes[0].selected), expected);
    }
    console.log('PASS legacy mouse fallback');
    await context.close();
  } finally {
    let timer;
    await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]);
    clearTimeout(timer);
  }
}
run().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
