// Run with Playwright available in NODE_PATH. Start tools/serve-local.cjs first.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { verify } = require('./verify-animal-rescue-train.cjs');
const origin = process.env.RESCUE_TEST_ORIGIN || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/animal-rescue-train');
fs.mkdirSync(output, { recursive: true });
const checks = [];
const errors = [];
const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
const board = async page => page.locator('#cars').innerText();
const moves = async page => Number(await page.locator('#moves').innerText());
async function move(page, queue, car, touch = false) {
  const action = touch ? 'tap' : 'click';
  await page.locator(`[data-queue="${queue}"]`)[action]();
  await page.locator(`[data-car="${car}"]`)[action]();
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.RESCUE_BROWSER_CHANNEL ? { channel: process.env.RESCUE_BROWSER_CHANNEL } : {}) });
  try {
    const solutions = verify();
    const context = await browser.newContext({ viewport: { width: 1280, height: 1050 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const gameRequests = [];
    page.on('request', request => gameRequests.push(request.url()));
    await page.goto(`${origin}/games/animal-rescue-train/`);
    await page.locator('[data-queue="0"]').waitFor();
    check(await page.locator('.level').count() === 5, 'five selectable stations');
    check(await page.locator('.tutorial').getAttribute('open') !== null, 'tutorial visible on first visit');
    check(await page.locator('.preview').count() === 9, 'three upcoming preview slots for each queue');
    await page.locator('.preview').first().click();
    check(await moves(page) === 0, 'preview cannot board or select an animal');
    check(await page.locator('.head[aria-pressed="true"]').count() === 0, 'preview never selects a queue');
    await page.locator('[data-queue="0"]').click();
    check(await moves(page) === 0 && await page.locator('.car.boardable').count() === 3, 'queue selection consumes nothing and enables all empty cars');
    await page.locator('[data-queue="0"]').click();
    check(await page.locator('.car.boardable').count() === 0, 'tap selected queue to cancel selection');
    const initialBoard = await board(page);
    await move(page, 0, 0);
    check(await moves(page) === 1, 'mouse boarding advances exactly one move');
    await page.locator('#undo').click();
    check(await moves(page) === 0 && await board(page) === initialBoard, 'undo restores pre-move seats and counter');
    check(await page.locator('#undo').isDisabled(), 'only one previous snapshot is available');
    await move(page, 0, 0);
    await page.locator('#restart').click();
    check(await moves(page) === 0 && await page.locator('#undo').isDisabled(), 'restart resets game and clears undo');
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });

    for (let level = 0; level < solutions.length; level++) {
      if (level) await page.locator('#next').click();
      check((await page.locator('#level-number').innerText()).includes(`0${level + 1} / 05`), `station ${level + 1} loaded through route progression`);
      const solution = solutions[level];
      for (const [queue, car] of solution.certificate) await move(page, queue, car);
      check(await page.locator('#result.won').isVisible(), `station ${level + 1} wins through actual mouse clicks`);
      check(await moves(page) === solution.moves, `station ${level + 1} uses ${solution.moves} valid moves`);
      check(await page.locator('.goal:not(.done)').count() === 0, `station ${level + 1} meets every rescue target`);
      check(await page.locator('.car .seat:not(.free)').count() === 0, `station ${level + 1} departure leaves three empty cars`);
      // Undo the winning departure and play that same final move again.
      await page.locator('#undo').click();
      check(await page.locator('#result').isHidden() && await page.locator('#next').isHidden(), `station ${level + 1} undo restores a playable terminal transition`);
      const [queue, car] = solution.certificate.at(-1);
      await move(page, queue, car);
      check(await page.locator('#result.won').isVisible(), `station ${level + 1} wins again after undo`);
    }
    await page.screenshot({ path: path.join(output, 'all-stations-won.png'), fullPage: true });
    check(await page.locator('#replay').isVisible() && await page.locator('#next').isHidden(), 'last station offers replay instead of an invalid sixth station');
    await page.locator('#replay').click();
    check(await moves(page) === 0 && (await page.locator('#level-number').innerText()).includes('01 / 05'), 'replay returns to station one');

    // Intentionally fill three mixed cars, using only real queue heads.
    await page.locator('[data-level="1"]').click();
    for (let car = 0; car < 3; car++) for (let queue = 0; queue < 3; queue++) await move(page, queue, car);
    check(await page.locator('#result.lost').isVisible(), 'three full mixed cars trigger failure after boarding');
    check(await page.locator('.car.full.mixed').count() === 3, 'mixed cars retain passengers');
    check(await page.locator('#total').innerText() === '0 / 9 隻已救援', 'mixed cars never award rescues');
    await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
    await page.locator('#undo').click();
    check(await page.locator('#result').isHidden() && await moves(page) === 8, 'failure can be undone');
    await page.locator('#restart').click();
    check(await moves(page) === 0 && await page.locator('.seat.free').count() === 9, 'restart after failure restores all seats');
    check(gameRequests.every(url => url.startsWith(origin)), 'standalone game makes only local requests');
    check(await page.evaluate(() => localStorage.length === 0), 'standalone game writes no storage or scores');

    // Touch emulation: real tap events, not dispatchEvent or direct state modification.
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const phone = await mobile.newPage();
    phone.on('pageerror', error => errors.push(error.message));
    await phone.goto(`${origin}/games/animal-rescue-train/`);
    for (const [queue, car] of solutions[0].certificate) await move(phone, queue, car, true);
    check(await phone.locator('#result.won').isVisible() && await moves(phone) === 6, 'touch taps complete station one without duplicate boarding');
    await phone.locator('#undo').tap();
    check(await moves(phone) === 5 && await phone.locator('#result').isHidden(), 'touch undo restores a departed winning car');
    await phone.locator('#restart').tap();
    check(await moves(phone) === 0, 'touch restart resets the station');
    await phone.locator('[data-level="4"]').tap();
    await phone.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    for (const [width, height] of [[320, 568], [390, 844], [650, 500], [768, 1024], [1024, 768]]) {
      await phone.setViewportSize({ width, height });
      const bounds = await phone.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
        controls: [...document.querySelectorAll('.head, .car, #restart, #undo')].map(el => { const box = el.getBoundingClientRect(); return { left: box.left, right: box.right, height: box.height }; }) }));
      check(bounds.scroll <= bounds.width, `no horizontal overflow at ${width}×${height}`);
      check(bounds.controls.every(box => box.left >= 0 && box.right <= bounds.width && box.height >= 44), `tap controls stay on-screen and at least 44px tall at ${width}×${height}`);
    }
    await mobile.close();

    // Keyboard-only queue selection and boarding.
    await page.locator('[data-level="0"]').click();
    await page.locator('[data-queue="0"]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-car="0"]').focus();
    await page.keyboard.press('Space');
    check(await moves(page) === 1, 'native buttons support keyboard selection and boarding');

    // The hub itself already depends on a CDN; isolate that dependency during local integration checks.
    const hub = await context.newPage();
    hub.on('pageerror', error => errors.push(error.message));
    await hub.route('https://**/*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* offline integration test */' }));
    await hub.goto(`${origin}/`);
    const card = hub.locator('[data-game-id="animal-rescue-train"]');
    await card.waitFor();
    check((await card.innerText()).includes('Prototype'), 'hub card shows prototype mode');
    const imageLoaded = await card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0);
    check(imageLoaded, 'original SVG hub preview loads');
    await card.click();
    const frame = hub.frameLocator('#gameViewer');
    await frame.locator('#level-name').waitFor();
    check(await frame.locator('#level-name').innerText() === '初次發車', 'hub opens the actual game in its existing iframe theater');
    check(await hub.locator('#leaderboardGameSelect option[value="animal-rescue-train"]').count() === 0, 'prototype is excluded from leaderboard choices');
    await hub.evaluate(() => window.postMessage({ type: 'GAME_OVER', gameId: 'animal-rescue-train', category: 'logic', score: 999 }, location.origin));
    await hub.waitForTimeout(100);
    check(await hub.evaluate(() => !JSON.parse(localStorage.getItem('toenow_game_scores') || '{}')['animal-rescue-train']), 'hub rejects prototype score ingestion');
    await hub.locator('#theaterModal').evaluate(async element => {
      await Promise.all(element.getAnimations().map(animation => animation.finished));
    });
    await hub.screenshot({ path: path.join(output, 'hub-iframe.png') });
    check(errors.length === 0, `no browser JavaScript errors: ${errors.join('; ')}`);
    const result = { status: 'PASS', browser: `Playwright Chromium ${browser.version()}${process.env.RESCUE_BROWSER_CHANNEL ? ` (${process.env.RESCUE_BROWSER_CHANNEL})` : ''}`, checks: checks.length, assertions: checks,
      limitations: ['Touch is Chromium emulation; physical iPad Safari has not been tested.', 'Hub CDN disabled for isolated local integration verification.'], errors };
    fs.writeFileSync(path.join(output, 'browser-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(`PASS ${checks.length} browser checks. Screenshots and results: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
