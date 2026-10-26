// Exercise five actual rabbit waves, rather than forcing a game-over wave value.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/island-progression');
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext();
    await context.route('https://**', route => route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('#welcomeGuestBtn').click();
    await page.evaluate(() => localStorage.setItem('toenow_tutorial_number-pop_v2', 'completed'));
    await page.locator('[data-island-game="number-pop"]').click();
    await page.locator('.island-play-button').click();
    const frame = page.locator('#gameViewer').contentFrame();
    await frame.locator('#btn-start').click();
    const gameFrame = page.frames().find(f => f.url().includes('/games/number-pop/'));
    for (let wave = 1; wave <= 5; wave++) {
      await gameFrame.waitForFunction(w => __QUANTUM_GAME__.getState().wave === w, wave);
      await gameFrame.evaluate(() => {
        while (__QUANTUM_GAME__.getState().cores.some(core => !core.popped)) __QUANTUM_GAME__.popLowestCore();
      });
    }
    await gameFrame.waitForFunction(() => __QUANTUM_GAME__.getState().wave === 6);
    await page.waitForFunction(() => document.querySelectorAll('.island-location:not(.is-locked)').length === 2, null, { timeout: 5000 });
    assert.equal(await gameFrame.evaluate(() => __QUANTUM_GAME__.getState().state), 'playing');
    assert.equal(await page.locator('[data-island-game="space-scale"]').getAttribute('aria-disabled'), 'false');
    assert.equal(await page.locator('.island-location.is-locked').count(), 8);
    await page.locator('#closeTheaterBtn').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('.island-location:not(.is-locked)').count(), 2);
    assert.equal(await page.locator('[data-island-game="space-scale"]').getAttribute('aria-disabled'), 'false');
    await page.evaluate(async () => {
      const terrain = new Image(); terrain.src = 'assets/toenow-island-terrain.png'; await terrain.decode();
      await Promise.all([...document.querySelectorAll('img[data-island-art]')].map(image => image.decode()));
    });
    await page.screenshot({ path: path.join(output, 'rabbit-level1-fox-unlocked.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({ path: path.join(output, 'rabbit-level1-fox-unlocked-mobile.png'), fullPage: true });
    // Block Match must credit Wave 5 on the success card, before pressing Next.
    const levels = require('../shared/toenow-levels.js');
    const values = {}, storage = { getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = String(value); } };
    const journey = require('../shared/toenow-exploration.js').create({ storage, levels, gameIds: Object.keys(levels.GAME_STORAGE_KEYS) });
    journey.chooseGuest();
    for (const id of journey.snapshot().order) { if (id === 'block-match') break; journey.complete({ gameId: id, wave: 6 }); }
    journey.dismissDiscovery();
    const blockContext = await browser.newContext(); await blockContext.route('https://**', route => route.abort());
    await blockContext.addInitScript(values => {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem('toenow_tutorial_block-match_v2', 'completed');
    }, values);
    const blockPage = await blockContext.newPage(); await blockPage.goto(base + '/?play=block-match', { waitUntil: 'domcontentloaded' });
    await blockPage.locator('#gameViewer').contentFrame().locator('.unified-start-btn').click();
    const block = blockPage.frames().find(f => f.url().includes('/games/block-match/'));
    await block.evaluate(() => {
      __CHIP_DEFRAG__.engagePhaseBriefing(); __CHIP_DEFRAG__.jumpToWave(5);
      const grid = __CHIP_DEFRAG__.getState().board.activeGrid;
      grid.forEach((row, r) => row.forEach((value, c) => { if (value === 2) __CHIP_DEFRAG__.clickCell(r, c); }));
    });
    await blockPage.waitForFunction(() => JSON.parse(localStorage.getItem('toenow_exploration_v1')).completed.includes('block-match'), null, { timeout: 3000 });
    assert.equal(await block.evaluate(() => __CHIP_DEFRAG__.getState().wave), 5);
    assert.equal(await blockPage.locator('.island-location:not(.is-locked)').count(), 8);
    await blockContext.close();
    // A real v1 browser save repairs the missed Rabbit completion on load.
    const recoveryContext = await browser.newContext(); await recoveryContext.route('https://**', route => route.abort());
    await recoveryContext.addInitScript(ids => {
      localStorage.setItem('toenow_exploration_v1', JSON.stringify({ version: 1, mode: 'explore', order: ['number-pop', ...ids.filter(id => id !== 'number-pop')], completed: [], welcomed: true, rejectedWaves: { 'number-pop': 6 }, pending: null }));
      localStorage.setItem('qcc_best_wave_v1', '6'); localStorage.setItem('qcc_high_score_v1', '3000');
    }, Object.keys(levels.GAME_STORAGE_KEYS));
    const recovered = await recoveryContext.newPage(); await recovered.goto(base, { waitUntil: 'domcontentloaded' });
    assert.equal(await recovered.locator('.island-location:not(.is-locked)').count(), 2);
    assert.equal(await recovered.locator('[data-island-game="space-scale"]').getAttribute('aria-disabled'), 'false');
    await recoveryContext.close();
    // Rescue is a one-puzzle tier: actual legal boarding must report its clear.
    const trainContext = await browser.newContext(); await trainContext.route('https://**', route => route.abort());
    await trainContext.addInitScript(() => localStorage.setItem('toenow_tutorial_animal-rescue-train_v2', 'completed'));
    const train = await trainContext.newPage(); await train.goto(base + '/games/animal-rescue-train/', { waitUntil: 'domcontentloaded' });
    await train.locator('#btn-start-game').click();
    if (await train.locator('#last-animal-dialog').isVisible()) await train.locator('#acknowledge-last-animal').click();
    const savedTrain = await train.evaluate(() => JSON.parse(localStorage.getItem('animal_rescue_train_guest_v2')));
    const puzzle = require('../games/animal-rescue-train/picker.js').createPicker().resolve(savedTrain.wave, savedTrain.requiredLastAnimal, savedTrain.puzzleIndex);
    const moves = require('./rescue-train-solver.cjs').solve(puzzle).path; assert(moves);
    for (const [queue, car] of moves) { await train.locator(`[data-queue="${queue}"]`).click(); await train.locator(`[data-car="${car}"]`).click(); }
    await train.locator('#success-dialog').waitFor({ state: 'visible' });
    assert.equal(await train.evaluate(() => JSON.parse(localStorage.getItem('toenow_game_milestones_v1'))['animal-rescue-train']), 1);
    await trainContext.close();
    assert.deepEqual(errors, []);
    console.log('PASS: actual Rabbit 5 waves => only Fox, close/reload; Block Match Wave 5 success; v1 missed-clear recovery; actual Panda boarding => Level 1 milestone.');
  } finally { let timer; await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]); clearTimeout(timer); }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
