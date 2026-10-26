const { readSource } = require('./lib/game-source.cjs');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/island-onboarding');
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], checks = [];
  const context = await browser.newContext();
  await context.route('https://**', route => route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(30000);
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const terrain = new Image(); terrain.src = 'assets/toenow-island-terrain.png'; await terrain.decode();
    });
    await page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 1);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const lang of ['en', 'zh-Hant']) {
        await page.evaluate(lang => ToenowI18n.setLanguage(lang), lang);
        assert.equal(await page.locator('#welcomeGuestBtn').innerText(), lang === 'en' ? 'Continue as a guest' : '以訪客繼續');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(output, `welcome-${width}-${lang}.png`), fullPage: true });
        checks.push(`welcome ${width}/${lang}`);
      }
    }
    await page.locator('#welcomeRegisterBtn').click();
    assert.equal(await page.locator('#authModal.open').count(), 1);
    assert.equal(await page.locator('#authHeading').innerText(), '建立帳號');
    await page.locator('#closeAuthBtn').click();
    await page.locator('#islandWelcome[open]').waitFor();
    await page.locator('#welcomeSigninBtn').click();
    assert.equal(await page.locator('#authHeading').innerText(), '登入');
    await page.locator('#closeAuthBtn').click();
    await page.locator('#welcomeGuestBtn').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('authModal')).opacity === '0');
    await page.screenshot({ path: path.join(output, 'first-game-mobile.png'), fullPage: true });
    // Locked map/list/deep-link launch all share the same guard.
    await page.locator('[data-island-game="flash-brain"]').click();
    assert.equal(await page.locator('.island-play-button').isVisible(), false);
    assert((await page.locator('.island-dialog-content').innerText()).includes('Level 1'));
    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#islandWelcome[open]').count(), 0);
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 1);
    await page.goto(base + '/?play=flash-brain', { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#theaterModal.open').count(), 0);
    await page.keyboard.press('Escape');
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { const terrain = new Image(); terrain.src = 'assets/toenow-island-terrain.png'; await terrain.decode(); });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => ToenowI18n.setLanguage('en'));
    await page.screenshot({ path: path.join(output, 'first-game-desktop.png'), fullPage: true });
    // Instrument only game state setup; execute the production start and game-over lifecycle.
    await page.evaluate(() => localStorage.setItem('toenow_tutorial_number-pop_v2', 'completed'));
    await page.route(/\/games\/number-pop\/(?:index\.html)?(?:\?.*)?$/, route => {
      let html = readSource(path.resolve(__dirname, '../games/number-pop/index.html'), 'utf8');
      const end = html.lastIndexOf('})();');
      html = html.slice(0, end) + 'window.__onboardingFinish=(wave,score)=>{game.score=score;game.wave=wave;game.runDuration=60;triggerGameOver();};' + html.slice(end);
      return route.fulfill({ contentType: 'text/html', body: html });
    });
    async function finish(wave, practice = false, score = 120) {
      await page.locator('[data-island-game="number-pop"]').click();
      await page.locator('.island-play-button').click();
      const frame = page.locator('#gameViewer').contentFrame();
      if (practice) {
        await frame.locator('.unified-practice-btn').click();
        await frame.locator('.unified-practice-level-btn[data-level="3"]').click();
      } else await frame.locator('#btn-start').click();
      await page.frames().find(f => f.url().includes('/games/number-pop/')).evaluate(({ wave, score }) => window.__onboardingFinish(wave, score), { wave, score });
      await frame.locator('[data-toenow-screen="gameover"]').waitFor({ state: 'visible' });
      // Allow postMessage processing before closing the actual iframe.
      await page.waitForFunction(() => !document.getElementById('gamesBentoGrid').innerHTML.includes('undefined'));
      await page.locator('#closeTheaterBtn').click();
      await page.waitForFunction(() => getComputedStyle(document.getElementById('theaterModal')).opacity === '0');
    }
    // A same-origin message from outside the mounted game cannot progress the island.
    await page.evaluate(() => window.postMessage({ type: 'GAME_OVER', gameId: 'number-pop', score: 120, wave: 6, duration: 60000 }, location.origin));
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 1);
    await finish(11, true);
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 1);
    const observer = await context.newPage();
    observer.on('pageerror', error => errors.push(error.message));
    await observer.goto(base, { waitUntil: 'domcontentloaded' });
    await page.bringToFront();
    await finish(6, false, 1e12);
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 1, 'rejected result cannot unlock through saved wave');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 1, 'rejected result remains excluded after reload');
    await observer.bringToFront();
    await observer.waitForFunction(() => JSON.parse(localStorage.getItem('toenow_exploration_v3')).rejectedWaves['number-pop'] === 6);
    assert.equal(await observer.locator('.island-location:not(.is-locked)').count(), 1, 'second tab must not unlock rejected result');
    await page.bringToFront();
    await finish(5);
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 1);
    await finish(6);
    await page.waitForFunction(() => document.querySelectorAll('.island-location:not(.is-locked)').length === 2);
    await observer.bringToFront();
    await observer.waitForFunction(() => document.querySelectorAll('.island-location:not(.is-locked)').length === 2);
    await observer.close(); await page.bringToFront();
    assert.equal(await page.locator('.island-discovery').isVisible(), true);
    const unlocked = await page.evaluate(() => JSON.parse(localStorage.getItem('toenow_exploration_v3')).pending);
    await page.waitForFunction(() => document.querySelectorAll('#toastContainer .toast-msg').length === 0);
    await page.screenshot({ path: path.join(output, 'discovery-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({ path: path.join(output, 'discovery-mobile.png'), fullPage: true });
    await page.locator('.island-discovery-go').click();
    assert.equal(await page.locator('.island-location-dialog').getAttribute('open'), '');
    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 2);
    assert.equal(await page.locator(`[data-island-game="${unlocked}"]`).getAttribute('aria-disabled'), 'false');
    await finish(11);
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 2);
    // Returning players automatically use exploration without losing saved scores.
    const legacy = await browser.newContext();
    await legacy.route('https://**', route => route.abort());
    await legacy.addInitScript(() => localStorage.setItem('toenow_game_scores', JSON.stringify({ 'flash-brain': { lastScore: 0, maxWave: 1 } })));
    const old = await legacy.newPage(); await old.goto(base, { waitUntil: 'domcontentloaded' });
    assert.equal(await old.locator('#islandWelcome[open]').count(), 0);
    assert.equal(await old.locator('.island-location:not(.is-locked)').count(), 1);
    await old.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('toenow_exploration_v3'));
      saved.version = 2; saved.mode = 'legacy'; saved.opened = saved.order.slice(); saved.completed = [];
      localStorage.setItem('toenow_exploration_v1', JSON.stringify(saved));
      localStorage.removeItem('toenow_exploration_v3');
      localStorage.setItem('qcc_best_wave_v1', '6'); localStorage.setItem('qcc_high_score_v1', '3000');
    });
    await old.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await old.locator('.island-location:not(.is-locked)').count(), 2);
    assert.equal(await old.locator('[data-island-game="space-scale"]').getAttribute('aria-disabled'), 'false');
    assert.equal(await old.evaluate(() => JSON.parse(localStorage.getItem('toenow_exploration_v3')).mode), 'explore');
    assert.equal(await old.evaluate(() => localStorage.getItem('qcc_high_score_v1')), '3000');
    assert.equal(await old.evaluate(() => JSON.parse(localStorage.getItem('toenow_game_scores'))['flash-brain'].lastScore), 0);
    await old.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await old.locator('.island-location:not(.is-locked)').count(), 2);
    await legacy.close();
    // Local provider stub verifies restored sessions and request options without
    // signing in, creating an account or sending any mail to the real service.
    async function authFixture({ user = null, rows = [] } = {}) {
      const ctx = await browser.newContext();
      await ctx.route('https://**', route => route.abort());
      await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, route => route.fulfill({ contentType: 'application/javascript', body: `
        window.__authCalls=[];
        window.supabase={createClient(){return {
          auth:{getSession:async()=>({data:{session:${JSON.stringify(user ? { user } : null)}}}),onAuthStateChange(){},
            signInWithOtp:async options=>(window.__authCalls.push(options),{error:null}),
            signInWithOAuth:async()=>({error:null})},
          from(table){const query={select(){return this},eq(){return this},
            single:async()=>({data:table==='user_profiles'?{display_name:'Explorer'}:null}),
            then(resolve,reject){return Promise.resolve({data:table==='leaderboard_view'?${JSON.stringify(rows)}:[],error:null}).then(resolve,reject)}};return query;}
        }}};` }));
      const tab = await ctx.newPage(); await tab.goto(base, { waitUntil: 'domcontentloaded' });
      return { ctx, tab };
    }
    const restored = await authFixture({ user: { id: 'test-only', email: 'explorer@example.invalid' } });
    await restored.tab.waitForFunction(() => ToenowAccount.signedIn);
    assert.equal(await restored.tab.locator('#islandWelcome[open]').count(), 0);
    assert.equal(await restored.tab.locator('.island-location:not(.is-locked)').count(), 1, 'new signed-in account still explores');
    await restored.ctx.close();
    const cloud = await authFixture({ user: { id: 'test-only', email: 'explorer@example.invalid' }, rows: [{ game_id: 'flash-brain', score: 100, created_at: '2026-01-01T00:00:00Z' }] });
    await cloud.tab.waitForFunction(() => JSON.parse(localStorage.getItem('toenow_game_scores') || '{}')['flash-brain']?.bestScore === 100);
    assert.equal(await cloud.tab.locator('.island-location:not(.is-locked)').count(), 1, 'cloud scores alone do not bypass the route');
    assert.equal(await cloud.tab.locator('#islandWelcome[open]').count(), 0);
    await cloud.ctx.close();
    const choices = await authFixture();
    await choices.tab.locator('#welcomeSigninBtn').click();
    await choices.tab.locator('#authEmailInput').fill('explorer@example.invalid');
    await choices.tab.locator('#emailSubmitBtn').click();
    assert.equal(await choices.tab.evaluate(() => __authCalls[0].options.shouldCreateUser), false);
    await choices.tab.locator('#closeAuthBtn').click();
    await choices.tab.locator('#welcomeRegisterBtn').click();
    await choices.tab.locator('#authEmailInput').fill('explorer@example.invalid');
    await choices.tab.locator('#emailSubmitBtn').click();
    assert.equal(await choices.tab.evaluate(() => __authCalls[1].options.shouldCreateUser), true);
    await choices.ctx.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ status: 'PASS', checks, practice: 'PASS', normalWaveBoundary: 'PASS', duplicate: 'PASS', legacy: 'PASS', reload: 'PASS', messageSource: 'PASS', rejectedResult: 'PASS', authWithLocalStub: 'PASS', liveAuth: 'NOT VERIFIED', errors }, null, 2));
    console.log('PASS: welcome EN/ZH at 4 widths; sign-in/register/guest; real practice/Wave5/Wave6/duplicate/rejected results; discovery/reload; automatic legacy-to-exploration migration retaining scores; restored/cloud accounts cannot bypass the route.');
  } finally { let timer; await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]); clearTimeout(timer); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
