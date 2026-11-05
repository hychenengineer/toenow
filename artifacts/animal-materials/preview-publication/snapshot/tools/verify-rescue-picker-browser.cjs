const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createPicker } = require('../games/animal-rescue-train/picker.js');
const { solve } = require('./rescue-train-solver.cjs');
const origin = process.env.RESCUE_TEST_ORIGIN || 'http://127.0.0.1:8765';
const sessionKey = 'animal_rescue_train_guest_v2';
const checks = [], errors = [];
const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), sessionKey);
async function acknowledge(page) {
  if (await page.locator('#last-animal-dialog').isVisible()) await page.locator('#acknowledge-last-animal').click();
}
async function practice(page, tier) {
  if (await page.locator('#success-dialog').isVisible()) await page.locator('#success-menu').click();
  else if (await page.locator('#play-screen').isVisible()) await page.locator('#menu').click();
  await page.locator('.unified-practice-btn').click();
  await page.locator(`[data-level="${tier}"]`).click();
  await acknowledge(page);
}
async function win(page, touch = false) {
  const data = await saved(page);
  const level = createPicker().resolve(data.wave, data.requiredLastAnimal, data.puzzleIndex);
  const { path: moves } = solve(level);
  assert.ok(moves, 'actual selected board and special rule must have a solution');
  for (const [queue, car] of moves) {
    await page.locator(`[data-queue="${queue}"]`)[touch ? 'tap' : 'click']();
    await page.locator(`[data-car="${car}"]`)[touch ? 'tap' : 'click']();
  }
  check(await page.locator('#result.won').isVisible(), `UI win: wave ${data.wave}, puzzle ${data.puzzleIndex}, last ${data.requiredLastAnimal}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.RESCUE_BROWSER_CHANNEL || 'chrome' });
  try {
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1050 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/games/animal-rescue-train/`);
    for (let tier = 1; tier <= 5; tier++) {
      const seen = new Set();
      let previous;
      for (let i = 0; i < 6; i++) {
        await practice(page, tier);
        const data = await saved(page);
        const board = JSON.stringify(JSON.parse(data.fingerprint)[0]);
        check(board !== previous, `tier ${tier}: open ${i + 1} differs from previous, across reload`);
        previous = board;
        if (i < 5) seen.add(board);
        await win(page);
        await page.reload();
      }
      check(seen.size === 5, `tier ${tier}: all five boards used before recycling`);
      console.log(`PASS tier ${tier}: rotation across reloads and six UI wins`);
    }
    check(await page.evaluate(() => localStorage.getItem('animal_rescue_train_best_score') === null && localStorage.getItem('animal_rescue_train_best_wave') === null),
      'practice wins do not write best records');

    await practice(page, 5);
    const before = await saved(page);
    const level = createPicker().resolve(before.wave, before.requiredLastAnimal, before.puzzleIndex);
    const [queue, car] = solve(level).path[0];
    await page.locator(`[data-queue="${queue}"]`).click();
    await page.locator(`[data-car="${car}"]`).click();
    const seats = await page.locator('#cars').innerText();
    await page.reload();
    await page.locator('#continue').click();
    await acknowledge(page);
    const continued = await saved(page);
    check(continued.fingerprint === before.fingerprint && await page.locator('#moves').innerText() === '1' && await page.locator('#cars').innerText() === seats,
      'continue restores exact random board, special rule and move');
    await page.locator('#undo').click();
    await page.reload();
    await page.locator('#continue').click();
    await acknowledge(page);
    check(await page.locator('#undo').isDisabled(), 'reload preserves consumed undo');
    await page.locator('#restart').click();
    await acknowledge(page);
    check((await saved(page)).puzzleIndex !== before.puzzleIndex, 'restart selects a different board in the same tier');

    await page.locator('#menu').click();
    await page.locator('#btn-start-game').click();
    const first = await saved(page);
    for (let tier = 1; tier <= 5; tier++) {
      await acknowledge(page);
      check((await saved(page)).wave === (tier - 1) * 5 + 1, `normal run reaches tier ${tier}`);
      await win(page);
      await page.locator('#next').click();
    }
    check((await saved(page)).puzzleIndex !== first.puzzleIndex, 'completed run starts with a different first puzzle');

    const hub = await context.newPage();
    hub.on('pageerror', error => errors.push(error.message));
    await hub.route('https://**/*', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await hub.goto(origin);
    await hub.locator('[data-game-id="animal-rescue-train"]').click();
    const frame = hub.frameLocator('#gameViewer');
    await frame.locator('#btn-start-game').click();
    const embedded = await saved(hub);
    await hub.locator('#restartGameBtn').click();
    await hub.waitForFunction(({ key, previous }) => JSON.parse(localStorage.getItem(key)).puzzleIndex !== previous,
      { key: sessionKey, previous: embedded.puzzleIndex });
    check((await saved(hub)).puzzleIndex !== embedded.puzzleIndex, 'Hub restart also rotates the selected puzzle');
    // Evaluate through the iframe so the actual saved puzzle drives the UI solution.
    const gameFrame = hub.frames().find(item => item.url().includes('/games/animal-rescue-train/'));
    await win(gameFrame);

    const mobile = await browser.newContext({ locale: 'en-US', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touch = await mobile.newPage();
    touch.on('pageerror', error => errors.push(error.message));
    await touch.goto(`${origin}/games/animal-rescue-train/`);
    await touch.locator('#btn-start-game').tap();
    await win(touch, true);
    check(await touch.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile puzzle has no horizontal overflow');
    check(errors.length === 0, `no browser errors: ${errors.join('; ')}`);
    const output = path.resolve(__dirname, '../artifacts/animal-rescue-train/picker-browser-results.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify({ checks, errors, physicalIPadSafari: 'NOT VERIFIED' }, null, 2) + '\n');
    console.log(`PASS ${checks.length} browser checks`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
