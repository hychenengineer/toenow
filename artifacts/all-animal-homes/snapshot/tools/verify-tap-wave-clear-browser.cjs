const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = 'artifacts/tap-wave-clear';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const width of [390, 1100]) for (const lang of ['en', 'zh-Hant']) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route('https://**', route => route.abort());
      await context.addInitScript(lang => {
        localStorage.setItem('toenow_language_v1', lang);
        localStorage.setItem('toenow_tutorial_tap-match_v2', 'completed');
      }, lang);
      await context.route('**/games/tap-match/main.js*', route => {
        const source = fs.readFileSync('games/tap-match/main.js', 'utf8');
        const end = source.lastIndexOf('})();');
        const hook = `window.__clearTest={
          start:practice=>startNewRun(5,practice),
          snapshot:()=>({phase:state.phase,wave:state.wave,score:state.score,time:state.timeLeft,hits:state.waveHits}),
          finalHit:()=>{state.phase='PLAYING';state.waveHits=state.waveQuota-1;state.timeLeft=30;
            for(const node of state.nodes)node.status='INACTIVE';
            const node=state.nodes[0];Object.assign(node,{status:'ACTIVE',isTarget:true,elapsedMs:0});
            const box=canvas.getBoundingClientRect();return {x:box.left+node.x,y:box.top+node.y};}
        };`;
        return route.fulfill({ contentType: 'application/javascript', body: source.slice(0, end) + hook + source.slice(end) });
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const mode of ['normal', 'practice', 'iframe']) {
        let host = page;
        if (mode === 'iframe') {
          await page.route('**/__tap-clear-frame', route => route.fulfill({ contentType: 'text/html',
            body: '<iframe src="/games/tap-match/" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>' }));
          await page.goto(base + '/__tap-clear-frame');
          host = page.frames().find(frame => frame.parentFrame());
        } else await page.goto(base + '/games/tap-match/');
        await host.waitForFunction(() => !!window.__clearTest);
        await host.evaluate(practice => __clearTest.start(practice), mode === 'practice');
        await host.locator('#btn-begin-wave').click();
        const records = await host.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
        const point = await host.evaluate(() => __clearTest.finalHit());
        await page.mouse.click(point.x, point.y);
        await host.waitForFunction(() => __clearTest.snapshot().phase === 'WAVE_CLEAR', null, { timeout: 3000 });
        await host.locator('#modal-wave-clear').waitFor({ state: 'visible' });
        assert.equal(await host.locator('#wave-clear-title').innerText(), lang === 'en' ? 'Wave cleared!' : '過關了！');
        assert.match(await host.locator('#wave-clear-summary').innerText(), /5/);
        const cleared = await host.evaluate(() => __clearTest.snapshot());
        assert.equal(cleared.wave, 5);
        assert.ok(cleared.score > 0);
        await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(500);
        assert.deepEqual(await host.evaluate(() => __clearTest.snapshot()), cleared, 'notice freezes time and ignores extra taps');
        assert.deepEqual(await host.evaluate(() => Object.fromEntries(Object.entries(localStorage))), records, 'notice never persists practice or unfinished results');
        if (mode === 'normal') {
          await page.keyboard.press('p');
          await host.locator('#modal-pause').waitFor({ state: 'visible' });
          await page.waitForTimeout(300);
          await page.keyboard.press('Escape');
          assert.deepEqual(await host.evaluate(() => __clearTest.snapshot()), cleared, 'pause resumes the same clear notice');
        }
        if (mode === 'normal') {
          await host.waitForFunction(() => getComputedStyle(document.getElementById('modal-wave-clear')).opacity === '1');
          await page.screenshot({ path: `${output}/${width}-${lang}.png` });
        }
        assert.equal(await host.locator('#btn-next-wave').innerText(), lang === 'en' ? 'Next wave' : '下一關');
        if (mode === 'normal') await page.keyboard.press('Enter');
        else await host.locator('#btn-next-wave').click();
        await host.locator('#modal-wave-brief').waitFor({ state: 'visible' });
        const next = await host.evaluate(() => __clearTest.snapshot());
        assert.equal(next.wave, 6);
        assert.equal(next.phase, 'BRIEFING');
        assert.equal(next.time, cleared.time);
        assert.equal(next.score, cleared.score);
        assert.equal(await host.locator('#modal-wave-clear').getAttribute('aria-hidden'), 'true');
        await host.locator('#btn-begin-wave').click();
        await host.waitForFunction(() => __clearTest.snapshot().phase === 'PLAYING');
        if (mode === 'practice') {
          const last = await host.evaluate(() => __clearTest.finalHit());
          await page.mouse.click(last.x, last.y);
          await host.locator('#modal-wave-clear').waitFor({ state: 'visible' });
          await host.locator('#btn-reset').click();
          await host.locator('#modal-wave-brief').waitFor({ state: 'visible' });
          assert.equal((await host.evaluate(() => __clearTest.snapshot())).wave, 1);
          assert.equal(await host.locator('#modal-wave-clear').getAttribute('aria-hidden'), 'true', 'restart closes the notice');
        }
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${width}/${lang}: real final hit, persistent notice, timer/input/storage protection, next wave, practice and iframe`);
    }
  } finally {
    let timer;
    await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]);
    clearTimeout(timer);
  }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
