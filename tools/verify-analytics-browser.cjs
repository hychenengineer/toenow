// Runs local files under a simulated production origin. Google requests are
// intercepted: tests inspect the real gtag queue without polluting live reports.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalog = require('../shared/toenow-screen-config.js');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
const production = 'https://toenow.pages.dev';
const hooks = {
  'number-pop': 'game.score=321;game.wave=13;triggerGameOver();',
  'ball-track': 'state.score=321;state.wave=13;saveRecords(state.score,state.wave);state.frozenSnapshot={score:321,wave:13,best:bestScore};showGameOverModal();',
  'block-match': 'state.score=321;state.wave=13;state.wavesCleared=12;triggerGameOver();',
  'add-up': 'score=321;wave=13;triggerGameOver();',
  'space-scale': 'score=321;wave=13;triggerGameOver();',
  'tap-match': "state.score=321;state.wave=13;endRun('TIME EXPIRED');",
  'spot-quick': "state.score=321;state.wave=13;triggerGameOver('TIME EXPIRED');",
  'shadow-match': 'state.score=321;state.wave=13;triggerGameOver();'
};
const events = page => page.evaluate(() => Array.from(window.dataLayer || [], x => Array.from(x)).filter(x => x[0] === 'event'));
async function contextFor(browser, id, blocked = false) {
  const context = await browser.newContext();
  context.setDefaultTimeout(10000);
  context.setDefaultNavigationTimeout(15000);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.googletagmanager.com') {
      return blocked ? route.abort() : route.fulfill({ contentType: 'application/javascript', body: '// test transport stub' });
    }
    if (url.hostname !== 'toenow.pages.dev' && url.hostname !== '127.0.0.1') return route.abort();
    if (url.pathname.endsWith('.webm')) return route.abort();
    const response = await context.request.get(base + url.pathname + url.search);
    let body = await response.body();
    if (url.pathname === '/games/' + id + '/main.js' && hooks[id]) {
      let js = body.toString(); const end = js.lastIndexOf('})();');
      assert.ok(end > 0);
      body = Buffer.from(js.slice(0, end) + 'window.__finishAnalytics=()=>{' + hooks[id] + '};' + js.slice(end));
    }
    if (id === 'flash-brain' && url.pathname.endsWith('index-cr-6j3L1.js')) {
      const marker = '},x=(e,t)=>{let n=p.current';
      assert.ok(body.toString().includes(marker));
      body = Buffer.from(body.toString().replace(marker, '};window.__finishAnalytics=()=>{const e=p.current;if(!e)throw Error("Engine not initialized");e.score=321;e.waveState.config.wave=13;e.wavesCleared=12;e.highestLevel=3;e.peakCombo=2;b()};let x=(e,t)=>{let n=p.current'));
    }
    await route.fulfill({ response, body });
  });
  return context;
}
async function finish(frame, id) {
  if (id === 'animal-rescue-train') {
    // Complete one real puzzle through the production controls.
    const saved = await frame.evaluate(() => JSON.parse(localStorage.getItem('animal_rescue_train_guest_v2')));
    const level = require('../games/animal-rescue-train/picker.js').createPicker().resolve(saved.wave, saved.requiredLastAnimal, saved.puzzleIndex);
    const moves = require('./rescue-train-solver.cjs').solve(level).path;
    assert.ok(moves);
    for (const [queue, car] of moves) {
      await frame.locator('[data-queue="' + queue + '"]').click();
      await frame.locator('[data-car="' + car + '"]').click();
    }
    await frame.locator('#success-dialog').waitFor({ state: 'visible' });
  } else {
    await frame.waitForFunction(() => typeof window.__finishAnalytics === 'function');
    await frame.evaluate(() => window.__finishAnalytics());
    await frame.locator('[data-toenow-screen="gameover"]').waitFor({ state: 'visible' });
  }
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const result = { standalone: [], embedded: [], practice: [], blocked: false, localDisabled: false };
  try {
    for (const id of [...Object.keys(catalog), 'animal-rescue-train'].filter(id => !process.env.TOENOW_TEST_GAMES || process.env.TOENOW_TEST_GAMES.split(',').includes(id))) {
      const c = catalog[id] || { startId: 'btn-start-game' };
      for (const embedded of [false, true]) {
        console.log('CHECK', id, embedded ? 'embedded' : 'standalone');
        const context = await contextFor(browser, id);
        const page = await context.newPage(); const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        let game = page;
        if (embedded) {
          await page.goto(production + '/', { waitUntil: 'domcontentloaded' });
          await page.evaluate(id => { const frame = document.createElement('iframe'); frame.id = 'analytics-test-game'; frame.style = 'position:fixed;inset:0;width:100%;height:100%;z-index:99999;background:white'; frame.src = '/games/' + id + '/'; document.body.appendChild(frame); }, id);
          await page.locator('#analytics-test-game').waitFor();
          game = await (await page.locator('#analytics-test-game').elementHandle()).contentFrame();
        } else await page.goto(production + '/games/' + id + '/');
        await game.locator('#' + c.startId).waitFor({ state: 'visible' });
        // Number Pop's existing fast-button debounce ignores events in the
        // first 250ms after navigation, so wait for its input window to open.
        await game.waitForFunction(() => performance.now() >= 300);
        assert.equal((await events(page)).filter(x => x[1] === 'game_open').length, 1, id + ' open');
        assert.equal((await events(page)).filter(x => x[1] === 'game_start').length, 0, id + ' title is not play');
        await game.locator('#' + c.startId).click();
        try {
          await page.waitForFunction(() => window.dataLayer.some(x => x[1] === 'game_start'));
        } catch (error) {
          console.error(JSON.stringify({id, embedded, errors, events:await events(page), state:await game.locator('body').getAttribute('data-state')}));
          await page.screenshot({path:path.join(root,'artifacts/analytics-failure.png')});
          throw error;
        }
        await finish(game, id);
        let ev = await events(page);
        assert.equal(ev.filter(x => x[1] === 'game_start').length, 1, id + ' start');
        assert.equal(ev.filter(x => x[1] === 'game_end').length, 1, id + ' end');
        assert.equal(ev.find(x => x[1] === 'game_start')[2].play_mode, 'normal');
        assert.ok(ev.every(x => x[2].game_id === id));
        assert.equal(await page.evaluate(() => dataLayer.filter(x => x[0] === 'config').length), 1, id + ' one tag');
        if (id !== 'animal-rescue-train') {
          await game.locator('#' + c.retryId).click();
          await page.waitForFunction(() => dataLayer.filter(x => x[1] === 'game_start').length === 2);
          await finish(game, id);
          assert.equal((await events(page)).filter(x => x[1] === 'game_end').length, 2);
        }
        assert.deepEqual(errors, [], id + ' browser errors');
        result[embedded ? 'embedded' : 'standalone'].push(id);
        await context.close();
      }
      const context = await contextFor(browser, id); const page = await context.newPage();
      await page.goto(production + '/games/' + id + '/');
      await page.locator('.unified-practice-btn').click();
      await page.locator('.unified-practice-level-btn[data-level="2"]').click();
      await page.waitForFunction(() => window.dataLayer && dataLayer.some(x => x[1] === 'game_start'));
      const start = (await events(page)).find(x => x[1] === 'game_start');
      assert.equal(start[2].play_mode, 'practice', id + ' practice');
      assert.equal(start[2].wave, 6);
      result.practice.push(id); await context.close();
    }
    const blocked = await contextFor(browser, 'number-pop', true); const page = await blocked.newPage();
    await page.goto(production + '/games/number-pop/'); await page.locator('#btn-start').click();
    await finish(page, 'number-pop'); result.blocked = true; await blocked.close();
    const local = await browser.newPage();
    await local.goto(base + '/games/number-pop/'); await local.locator('#btn-start').click();
    assert.equal(await local.evaluate(() => window.ToenowAnalytics.enabled), false);
    assert.equal(await local.evaluate(() => !!window.dataLayer), false); result.localDisabled = true;
    fs.writeFileSync(path.join(root, 'artifacts/analytics-browser-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
