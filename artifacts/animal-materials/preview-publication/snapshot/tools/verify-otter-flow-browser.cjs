const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { readSource } = require('./lib/game-source.cjs');
const keys = require('../shared/toenow-levels.js').GAME_STORAGE_KEYS['ball-track'];
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1100]) for (const lang of ['en', 'zh-Hant']) {
      const context = await browser.newContext({ viewport: { width, height: 850 } });
      await context.addInitScript(({ lang, keys }) => {
        localStorage.setItem('toenow_language_v1', lang);
        localStorage.setItem('toenow_tutorial_ball-track_v2', 'completed');
        localStorage.setItem(keys.score, '26352');
        localStorage.setItem(keys.wave, '13');
        window.requestAnimationFrame = () => 1;
      }, { lang, keys });
      await context.route('https://**', r => r.abort());
      const source = readSource('games/ball-track/index.html', 'utf8');
      const end = source.lastIndexOf('})();');
      assert.ok(end > 0);
      const html = source.slice(0, end) + 'window.__renderOtter=()=>renderScene(0);window.__otterFeedback=()=>({popups:floatingPopups.length,particles:particlePool.filter(p=>p.active).length});window.__advanceOtter=()=>{for(let i=0;i<20;i++)updateSimulation(.05)};' + source.slice(end);
      await context.route('**/games/ball-track/', r => r.fulfill({ contentType: 'text/html', body: html }));
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const name = lang === 'en' ? 'TARGET TRACK' : '目標追蹤';
      await page.goto(base + '/games/ball-track/');
      assert.equal(await page.locator('#screen-perk').count(), 0, 'perk selection is removed');
      assert.equal(await page.locator('#title-heading').innerText(), name);
      assert.equal(await page.locator('[data-screen-record="score"]').innerText(), '26,352');
      fs.mkdirSync('artifacts/otter-flow', { recursive: true });
      await page.screenshot({ path: `artifacts/otter-flow/${width}-${lang}-title.png` });
      await page.locator('#btn-start-game').click();
      await page.evaluate(() => { for(let i=0;i<6;i++)window.__advanceOtter(); });
      const reminder = page.locator('#btn-confirm-memory');
      assert.equal(await reminder.isVisible(), true);
      const animation = await reminder.evaluate(el => {
        const style = getComputedStyle(el);
        return { name: style.animationName, delay: style.animationDelay };
      });
      assert.equal(animation.name, 'memory-reminder');
      assert.equal(animation.delay, '5s');
      await reminder.evaluate(el => { for(const animation of el.getAnimations()) animation.currentTime=6200; });
      await page.evaluate(()=>window.__renderOtter());
      await page.screenshot({ path: `artifacts/otter-flow/${width}-${lang}-reminder.png` });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await reminder.evaluate(el=>getComputedStyle(el).animationName), 'none');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await reminder.click();
      assert.equal(await reminder.isVisible(), false);
      for (const wave of [3, 6, 9, 12]) {
        const result = await page.evaluate(wave => {
          const game = window.__QUANTUM_SHELL__;
          game.jumpToWave(wave);
          game.forceSelectPhase();
          const before = game.getState();
          for (const shell of game.getState().shells.filter(s => s.hasCore)) game.pickShellById(shell.id);
          const cleared = game.getState();
          const feedback = window.__otterFeedback();
          window.__renderOtter();
          window.__advanceOtter();
          return { before, cleared, feedback, next: game.getState() };
        }, wave);
        assert.equal(result.cleared.phase, 'wave_clear');
        assert.ok(result.cleared.score > result.before.score, 'score reward still applies');
        assert.ok(result.cleared.runTimeSec >= result.before.runTimeSec, 'time reward still applies');
        assert.equal(result.feedback.popups, 0, 'found otters show no floating reward text');
        assert.ok(result.feedback.particles > 0, 'found otters have a small visual effect');
        if (wave===3) await page.screenshot({ path: `artifacts/otter-flow/${width}-${lang}-found.png` });
        assert.equal(result.next.wave, wave + 1, 'milestone advances without a choice');
        assert.equal(result.next.mode, 'playing');
        assert.ok(result.next.runTimeSec <= result.cleared.runTimeSec, 'no milestone time refill');
      }
      const hub = await context.newPage();
      await hub.goto(base);
      const card = hub.locator('[data-game-id="ball-track"]');
      const cardText = await card.innerText();
      assert.ok(cardText.includes(lang === 'en' ? 'Target Track' : name), cardText);
      assert.deepEqual(errors, []);
      console.log(`PASS otter name, saved records and milestones: ${width} ${lang}`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
