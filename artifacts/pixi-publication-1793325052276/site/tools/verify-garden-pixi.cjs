// Regression: a renderer migration must retain real interaction, freeze on pause,
// and render albums without allocating a WebGL context for every postcard.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const out = path.resolve(__dirname, '../artifacts/garden-pixi');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Expose the real renderer only in this test, without production test hooks.
    await page.route('**/garden-main.js', async route => {
      const response = await route.fetch();
      const source = (await response.text()).replace('view=new window.GardenRenderer(canvas);await view.ready;', 'view=new window.GardenRenderer(canvas);window.__gardenView=view;await view.ready;');
      await route.fulfill({ response, body: source });
    });
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      window.gpuCanvases = new Set();
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const result = original.call(this, type, ...args);
        if (result && /webgl/.test(type)) window.gpuCanvases.add(this);
        return result;
      };
    });
    await page.goto(base + '/games/capybara-drift/');
    assert.equal(await page.evaluate(() => typeof window.PIXI), 'object', 'PixiJS must be loaded locally');
    await page.waitForFunction(() => document.querySelector('#garden').dataset.renderer === 'pixi-webgl');
    await page.locator('#btn-start').click();
    await page.locator('#garden-tools').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => !!document.querySelector('#garden').getContext('webgl2')), true);
    await page.locator('[data-tool="wood"]').click();
    await page.locator('#garden').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => JSON.parse(localStorage.getItem(CapybaraGarden.KEY)).cells.some(c => c.q === 2 && c.r === 0 && c.type === 'wood')));
    await page.locator('#undo').click();
    await page.locator('#redo').click();
    await page.locator('[data-tool="swim"]').click();
    await page.screenshot({ path: path.join(out, 'desktop.png') });
    await page.locator('#rest').click();
    const paused = await page.locator('#garden').screenshot();
    await page.waitForTimeout(400);
    assert.deepEqual(await page.locator('#garden').screenshot(), paused, 'Pause must freeze the garden');
    await page.locator('#resume').click();
    for (let i = 0; i < 4; i++) {
      await page.locator('#postcard').click();
      await page.waitForTimeout(700);
    }
    const contexts = await page.evaluate(() => gpuCanvases.size);
    for (let i = 0; i < 3; i++) {
      await page.locator('#album-open').click();
      assert.equal(await page.locator('.book-card canvas').count(), 4);
      assert(await page.locator('.book-card canvas').first().evaluate(c => {
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let painted = 0;
        for(let i=0;i<data.length;i+=4)if(Math.abs(data[i]-220)+Math.abs(data[i+1]-229)+Math.abs(data[i+2]-201)>35)painted++;
        return painted > c.width*c.height*.1;
      }), 'A postcard must contain the rendered garden, not just its background');
      await page.locator('#book-close').click();
    }
    assert.equal(await page.evaluate(() => gpuCanvases.size), contexts, 'Albums must reuse the existing renderer');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    assert.deepEqual(await page.locator('#garden').evaluate(c => ({ width: c.getBoundingClientRect().width, height: c.getBoundingClientRect().height })), { width: 390, height: 844 }, 'Pixi canvas must follow the CSS viewport');
    await page.screenshot({ path: path.join(out, 'phone.png') });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, 'landscape.png') });
    assert.deepEqual(errors, []);
    assert(await page.evaluate(() => {
      const view = window.__gardenView;
      for (const zoom of [.5, 1, 2]) {
        view.zoom = zoom;
        const profile = CapybaraGarden.defaults();
        profile.cells.push({q:12,r:12,type:'flowers'});
        view.draw(profile, 0, 0, false, true, null);
        for (const [q,r] of [[0,0],[12,12],[-12,-12],[2,-1]]) {
          const p=view.point(q,r), back=view.input(p.x,p.y);
          if(back.q!==q||back.r!==r)return false;
        }
      }
      view.zoom=1;return true;
    }), 'Pointer coordinates must agree with resized and zoomed model coordinates');
    console.log('PASS Pixi WebGL, building, pause, album context reuse, responsive resize');
    await page.close();
    const failure = await browser.newPage();
    await failure.route('**/illustrated-atlas.png', route => route.abort());
    await failure.goto(base + '/games/capybara-drift/');
    await failure.locator('#garden-reload').waitFor({ state: 'visible' });
    assert.match(await failure.locator('#garden-loading-message').innerText(), /could not load/);
    assert.equal(await failure.evaluate(() => localStorage.getItem(CapybaraGarden.KEY)), null);
    await failure.unroute('**/illustrated-atlas.png');
    await failure.locator('#garden-reload').click();
    await failure.locator('#garden-loading').waitFor({ state: 'hidden' });
    await failure.locator('#btn-start').click();
    await failure.locator('#garden-tools').waitFor({ state: 'visible' });
    console.log('PASS failed texture load exposes retry and preserves storage');
    await failure.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
