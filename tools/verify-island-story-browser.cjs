const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/island-story');
const key = 'toenow_island_story_v1';

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], checks = [];
  async function fixture({ seed, url = base, auth = false } = {}) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    await context.route('https://**', route => route.abort());
    if (seed) await context.addInitScript(seed);
    if (auth) await context.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, route => route.fulfill({ contentType: 'application/javascript', body: `
      window.supabase={createClient(){return {
        auth:{getSession:async()=>({data:{session:null}}),
          onAuthStateChange(listener){window.__storySignIn=()=>listener('SIGNED_IN',{user:{id:'story-test',email:'story@example.invalid'}});},
          signInWithOtp:async()=>({error:null}),signInWithOAuth:async()=>({error:null})},
        from(table){return {select(){return this},eq(){return this},
          single:async()=>({data:table==='user_profiles'?{display_name:'Story visitor'}:null}),
          then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}}}
      }}};` }));
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return { page, context };
  }
  const stored = page => page.evaluate(key => localStorage.getItem(key), key);
  const saves = page => page.evaluate(() => {
    const journey = JSON.parse(localStorage.getItem('toenow_exploration_v3'));
    return {
      records: Object.fromEntries(Object.entries(localStorage).filter(([name]) => /best_score|best_wave|high_score|toenow_game_scores|toenow_materials|toenow_homes/.test(name))),
      opened: journey.opened, completed: journey.completed
    };
  });
  async function replay(page) {
    await page.locator('#openProfileBtn').click();
    await page.locator('#replayIslandStoryBtn').click();
    await page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await page.locator('#profileDrawer').getAttribute('aria-hidden'), 'true', 'replay closes the profile drawer');
  }
  async function chooseStep(page) {
    await page.locator('#islandStoryNext').click();
    await page.locator('#islandStoryNext').click();
    assert.equal(await page.locator('[data-story-island]').count(), 3);
  }
  async function assertLayout(page) {
    await page.locator('#islandWelcome img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    const layout = await page.locator('#islandWelcome').evaluate(dialog => {
      const rect = dialog.getBoundingClientRect();
      return {
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        dialogOverflow: dialog.scrollWidth > dialog.clientWidth + 1,
        fitsViewport: rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
        focusInside: dialog.contains(document.activeElement)
      };
    });
    assert.deepEqual(layout, { pageOverflow: false, dialogOverflow: false, fitsViewport: true, focusInside: true });
  }
  try {
    const authLink = await fixture({ auth: true, url: base + '/?auth=register' });
    await authLink.page.locator('#authModal.open').waitFor();
    await authLink.page.waitForFunction(() => typeof window.__storySignIn === 'function');
    await authLink.page.evaluate(() => window.__storySignIn());
    await authLink.page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await stored(authLink.page), null, 'a new account entered from an auth link still sees the incomplete story');
    await authLink.context.close();
    checks.push('direct registration link enters story after new account sign-in');

    const { page } = await fixture();
    await page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await page.locator('#islandStoryNext').count(), 1, 'first-time welcome must offer the Rabbit story');
    const initialSaves = await saves(page);
    assert.equal(await stored(page), null, 'opening the story does not complete it');
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      for (const language of ['en', 'zh-Hant']) {
        await page.evaluate(language => ToenowI18n.setLanguage(language), language);
        assert.equal(await page.locator('#welcomeGuestBtn').innerText(), language === 'en' ? 'Skip story' : '跳過故事');
        for (let step = 0; step < 3; step++) {
          await assertLayout(page);
          assert((await page.locator('#welcomeHeading').innerText()).trim().length > 0);
          if (step === 2) {
            for (const [island, name] of [['explore', '探索島'], ['carefree', '無憂島'], ['expedition', '遠征島']]) {
              assert(await page.locator(`[data-story-island="${island}"]`).isVisible());
              if (language === 'zh-Hant') assert((await page.locator(`[data-story-island="${island}"]`).innerText()).includes(name));
            }
          }
          if ([1440, 390, 320].includes(viewport.width)) {
            await page.screenshot({ path: path.join(output, `${viewport.width}-${language}-step-${step + 1}.png`), fullPage: true });
          }
          if (step < 2) await page.locator('#islandStoryNext').click();
        }
        await page.locator('#islandStoryBack').click();
        await page.locator('#islandStoryBack').click();
        checks.push(`layout ${viewport.width}x${viewport.height}/${language}/3 steps`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#islandStoryNext').focus();
    await page.keyboard.press('Enter');
    const secondHeading = await page.locator('#welcomeHeading').innerText();
    await page.locator('#welcomeSigninBtn').click();
    assert.equal(await page.locator('#islandWelcome[open]').count(), 0);
    assert(await page.locator('#authModal.open').isVisible());
    assert.equal(await stored(page), null, 'account entry does not finish story');
    await page.locator('#closeAuthBtn').click();
    await page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await page.locator('#welcomeHeading').innerText(), secondHeading, 'cancelled authentication resumes the current chapter');
    await page.locator('#welcomeSigninBtn').click();
    await page.keyboard.press('Escape');
    await page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await page.locator('#welcomeHeading').innerText(), secondHeading, 'Escape closes account entry and resumes the same chapter');
    assert.equal(await stored(page), null, 'Escape from account entry must not also skip the resumed story');
    await page.keyboard.press('Escape');
    assert.equal(await stored(page), 'skipped');
    assert.deepEqual(await saves(page), initialSaves, 'reading and skipping preserve game progress');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.showIslandWelcome?.());
    assert.equal(await page.locator('#islandWelcome[open]').count(), 0);
    await replay(page);
    assert.equal(await page.locator('[data-story-island]').count(), 0, 'replay starts at arrival');
    await page.locator('#welcomeGuestBtn').click();
    checks.push('keyboard, auth cancel/resume, Escape skip, reload and replay');

    for (const island of ['explore', 'carefree', 'expedition']) {
      const { page: choice, context } = await fixture();
      await choice.locator('#islandWelcome[open]').waitFor();
      const before = await saves(choice);
      await chooseStep(choice);
      await choice.locator(`[data-story-island="${island}"]`).tap();
      assert.equal(await choice.locator('#islandWelcome[open]').count(), 0);
      assert.equal(await stored(choice), 'completed');
      assert.equal(await choice.locator(`[data-island-select="${island}"]`).getAttribute('aria-pressed'), 'true');
      if (island === 'explore') {
        assert(await choice.locator('.island-location-dialog[open]').isVisible());
        assert(await choice.locator('.animal-home').isVisible(), 'Explore choice enters the animal home');
        await choice.keyboard.press('Escape');
      } else {
        assert(await choice.locator(`[data-island-panel="${island}"]`).isVisible());
        assert.equal(await choice.evaluate(() => document.activeElement.id), island === 'carefree' ? 'open-capybara' : 'open-animal-siege');
      }
      assert.deepEqual(await saves(choice), before, 'choosing an island cannot award progress');
      await choice.reload({ waitUntil: 'domcontentloaded' });
      await choice.evaluate(() => window.showIslandWelcome?.());
      assert.equal(await choice.locator('#islandWelcome[open]').count(), 0);
      await context.close();
      checks.push(`touch choice ${island}/destination/reload/protected saves`);
    }

    const returning = await fixture({ seed: () => localStorage.setItem('toenow_game_scores', JSON.stringify({ 'flash-brain': { lastScore: 0, maxWave: 1 } })) });
    await returning.page.evaluate(() => window.showIslandWelcome?.());
    assert.equal(await returning.page.locator('#islandWelcome[open]').count(), 0);
    await replay(returning.page);
    await returning.page.locator('#welcomeGuestBtn').click();
    checks.push('returning player remains uninterrupted and can replay');

    for (const route of ['?play=carefree-farm', '?home=number-pop']) {
      const link = await fixture({ url: base + '/' + route });
      await link.page.evaluate(() => window.showIslandWelcome?.());
      assert.equal(await link.page.locator('#islandWelcome[open]').count(), 0);
      if (route.includes('play')) {
        await link.page.frameLocator('#gameViewer').locator('#btn-start').waitFor({ state: 'visible' });
        assert(await link.page.locator('#carefreeIsland').isVisible());
      } else assert(await link.page.locator('.island-location-dialog[open]').isVisible());
      assert.equal(await stored(link.page), null, 'deep link does not mark the story complete');
      await link.context.close();
      checks.push(`deep link ${route}`);
    }

    const signedIn = await fixture({ auth: true });
    await signedIn.page.locator('#islandWelcome[open]').waitFor();
    await signedIn.page.locator('#welcomeSigninBtn').click();
    await signedIn.page.evaluate(() => window.__storySignIn());
    await signedIn.page.waitForFunction(() => ToenowAccount.signedIn);
    await signedIn.page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await stored(signedIn.page), null, 'signing in must not complete the story');
    assert.equal(await signedIn.page.locator('#authModal.open').count(), 0);
    await signedIn.page.reload({ waitUntil: 'domcontentloaded' });
    await signedIn.page.locator('#islandWelcome[open]').waitFor();
    assert.equal(await stored(signedIn.page), null, 'an unfinished story remains eligible after signing in and reloading');
    await signedIn.context.close();
    checks.push('local auth stub resumes new player story without completing it');

    const unavailable = await fixture({ seed: () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === 'toenow_island_story_v1') throw new DOMException('Storage unavailable', 'QuotaExceededError');
        return set.call(this, name, value);
      };
    } });
    await unavailable.page.locator('#islandWelcome[open]').waitFor();
    await unavailable.page.locator('#welcomeGuestBtn').click();
    await unavailable.page.evaluate(() => window.showIslandWelcome?.());
    assert.equal(await unavailable.page.locator('#islandWelcome[open]').count(), 0, 'storage failure must not trap player in repeated story during this visit');
    await replay(unavailable.page);
    await chooseStep(unavailable.page);
    await unavailable.page.locator('[data-story-island="carefree"]').click();
    assert(await unavailable.page.locator('#carefreeIsland').isVisible());
    await unavailable.context.close();
    checks.push('unavailable story storage still allows skip, replay and island selection');

    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, errors, liveAuth: 'NOT VERIFIED' }, null, 2));
    console.log(JSON.stringify({ status: 'PASS', checks: checks.length, errors, output }));
  } finally {
    let timer;
    await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]);
    clearTimeout(timer);
  }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
