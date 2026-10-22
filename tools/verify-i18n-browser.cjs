const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const origin = process.env.RESCUE_TEST_ORIGIN || 'http://127.0.0.1:8765';
const out = path.resolve(__dirname, '../artifacts/i18n');
const games = [
  ['animal-rescue-train', '#btn-start-game'], ['number-pop', '#btn-start'],
  ['ball-track', '#btn-start-game'], ['spot-quick', '#startAnalysisBtn'],
  ['tap-match', '#btn-start-run'], ['add-up', '#btn-start-game'],
  ['block-match', '#btn-start'], ['space-scale', '#btn-start'],
  ['shadow-match', '#btn-init-optics'], ['flash-brain', '[data-start="true"]']
];
const checks = [], errors = [], missing = {};
function check(condition, label) { assert.ok(condition, label); checks.push(label); console.log(`PASS: ${label}`); }
async function untranslated(page, name) {
  missing[name] = await page.evaluate(() => {
    const result = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('script,style,code,pre,[data-i18n-ignore]')) continue;
      const text = node.textContent.trim().replace(/\s+/g, ' ');
      if (/[A-Za-z]{3}/.test(text) && !/[\u3400-\u9fff]/.test(text)) result.add(text);
    }
    return [...result];
  });
  const expected = name === 'hub' ? ['TOENOW', 'toenow.com', 'about:blank'] : [];
  const unknown = missing[name].filter(text => !expected.includes(text));
  check(unknown.length === 0, `${name}: no untranslated interface text (${unknown.join('; ')})`);
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const locale of ['zh-TW', 'zh-CN', 'en-US', 'ja-JP']) {
      const context = await browser.newContext({ locale });
      const page = await context.newPage();
      await page.goto(origin);
      await page.waitForSelector('.toenow-language-switch');
      check(await page.locator('html').getAttribute('lang') === (locale.startsWith('zh') ? 'zh-Hant' : 'en'), `automatic browser language: ${locale}`);
      await context.close();
    }
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 960 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.locator('.game-card').first().waitFor();
    await page.locator('.toenow-language-switch').click();
    check(await page.locator('html').getAttribute('lang') === 'zh-Hant', 'Hub manual switch');
    await page.waitForFunction(() => document.querySelector('[data-category="logic"]').innerText.includes('邏輯'));
    await untranslated(page, 'hub');
    await page.screenshot({ path: path.join(out, 'hub-zh-desktop.png'), fullPage: true });
    await page.reload();
    check(await page.locator('html').getAttribute('lang') === 'zh-Hant', 'preference survives Hub reload');
    await page.locator('[data-game-id="animal-rescue-train"]').click();
    const frame = page.frameLocator('#gameViewer');
    await frame.locator('.toenow-language-switch').waitFor();
    check(await frame.locator('html').getAttribute('lang') === 'zh-Hant', 'game iframe inherits Chinese');
    await frame.locator('.toenow-language-switch').click();
    check(await page.locator('html').getAttribute('lang') === 'en', 'iframe switch synchronizes parent');
    await page.locator('.toenow-language-switch').first().evaluate(button => button.click());
    check(await frame.locator('html').getAttribute('lang') === 'zh-Hant', 'parent switch synchronizes iframe');
    await page.locator('#closeTheaterBtn').click();
    for (const [id, start] of games) {
      await page.goto(`${origin}/games/${id}/`);
      await page.locator('.toenow-language-switch').waitFor();
      await page.locator(start).first().waitFor();
      check(await page.locator('html').getAttribute('lang') === 'zh-Hant', `${id}: shared preference`);
      await untranslated(page, `${id}-title`);
      const records = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => /best|high_score/.test(key))));
      const startNode = await page.locator(start).first().elementHandle();
      await page.locator('.toenow-language-switch').click();
      check(await page.locator('html').getAttribute('lang') === 'en', `${id}: English switch`);
      check(await startNode.evaluate(node => node.isConnected), `${id}: switching preserves game DOM`);
      await page.locator('.toenow-language-switch').click();
      check(JSON.stringify(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => /best|high_score/.test(key))))) === JSON.stringify(records), `${id}: records unaffected`);
      const initialState = await page.locator('body').getAttribute('data-state');
      await page.locator('.toenow-language-switch').focus();
      await page.keyboard.press('Enter');
      check(await page.locator('html').getAttribute('lang') === 'en' && await page.locator('body').getAttribute('data-state') === initialState, `${id}: keyboard Enter switches language without starting game`);
      await page.keyboard.press('Space');
      check(await page.locator('html').getAttribute('lang') === 'zh-Hant' && await page.locator('body').getAttribute('data-state') === initialState, `${id}: keyboard Space switches language without starting game`);
      const practice = page.locator('.unified-practice-btn');
      await practice.click();
      await page.locator('[data-level="1"]').waitFor();
      await untranslated(page, `${id}-practice`);
      check(/[\u3400-\u9fff]/.test(await page.locator('[data-level="1"]').innerText()), `${id}: practice translated`);
      await page.locator('[data-level="1"]').click();
      await page.waitForTimeout(200);
      await untranslated(page, `${id}-play`);
      const bodyState = await page.locator('body').getAttribute('data-state');
      await page.locator('.toenow-language-switch').click();
      check(await page.locator('body').getAttribute('data-state') === bodyState, `${id}: live language change preserves state`);
      await page.locator('.toenow-language-switch').click();
      const preserved = await page.evaluate(() => {
        const hook = [window.__TEST_HOOKS__, window.__QUANTUM_SHELL__, window.__CHIP_DEFRAG__, window.__overclockReactor, window.__ECLIPSE_DRIFT__].find(value => value?.getState);
        const snapshot = () => {
          if (hook) return JSON.stringify(hook.getState());
          const fields = document.querySelector('[data-testid="telemetry-hud"]')
            ? [...document.querySelectorAll('[data-testid="hud-score"],[data-testid="hud-combo"],[data-testid="hud-timer"],[data-testid="hud-level"],[data-testid="hud-wave"]')]
            : [...document.querySelectorAll('[id]')].filter(element => /score|wave|moves|timer|time|target|combo/i.test(element.id));
          if (!fields.length) throw new Error('Missing progress snapshot fields');
          const canvas = document.querySelector('[data-testid="matrix-canvas"]');
          return JSON.stringify({ fields: fields.map(element => [element.id || element.dataset.testid, element.textContent]), matrix: canvas ? canvas.toDataURL() : null });
        };
        const before = snapshot();
        ToenowI18n.setLanguage('en');
        ToenowI18n.setLanguage('zh-Hant');
        return before === snapshot();
      });
      check(preserved, `${id}: score, wave, timer and puzzle snapshot survive a language round trip`);
    }
    await page.goto(`${origin}/games/animal-rescue-train/`);
    await page.locator('.unified-practice-btn').click();
    await page.locator('[data-level="5"]').click();
    await page.locator('#last-animal-dialog').waitFor();
    check(/[\u3400-\u9fff]/.test(await page.locator('#last-animal-rule').innerText()), 'Level 5 rule translated');
    await page.locator('#last-animal-dialog .toenow-language-switch').click();
    check(/must be the last animal to depart/.test(await page.locator('#last-animal-rule').innerText()), 'modal switch restores English rule');
    await page.locator('#last-animal-dialog .toenow-language-switch').click();
    await page.locator('#acknowledge-last-animal').click();
    await page.locator('[data-queue="0"]').click();
    await page.locator('.car.boardable').first().click();
    const moves = await page.locator('#moves').innerText();
    await page.locator('.toenow-language-switch').click();
    await page.locator('.toenow-language-switch').click();
    check(await page.locator('#moves').innerText() === moves, 'live rescue move survives switching');
    const mobile = await browser.newContext({ locale: 'zh-TW', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const phone = await mobile.newPage();
    phone.on('pageerror', error => errors.push(error.message));
    await phone.goto(origin);
    await phone.locator('.toenow-language-switch').tap();
    check(await phone.locator('html').getAttribute('lang') === 'en', 'mobile touch language switch');
    await phone.locator('.toenow-language-switch').tap();
    await phone.screenshot({ path: path.join(out, 'hub-zh-mobile.png'), fullPage: true });
    await phone.goto(`${origin}/games/animal-rescue-train/`);
    await phone.locator('.unified-practice-btn').tap();
    await phone.locator('[data-level="5"]').tap();
    await phone.screenshot({ path: path.join(out, 'level5-zh-mobile.png') });
    check(await phone.locator('#last-animal-dialog .toenow-language-switch').isVisible(), 'mobile modal switch accessible');
    await mobile.close();
    await context.close();
    check(errors.length === 0, `no browser runtime errors: ${errors.join('; ')}`);
    console.log(JSON.stringify({ passed: checks.length, checks, missing }, null, 2));
  } finally {
    fs.writeFileSync(path.join(out, 'untranslated.json'), JSON.stringify(missing, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
