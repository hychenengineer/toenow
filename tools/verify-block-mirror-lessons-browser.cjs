const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8765';
const output = 'artifacts/block-mirror-lessons';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  fs.mkdirSync(output, { recursive: true });
  try {
    const viewports = process.env.TOENOW_MIRROR_VIEWPORTS ? JSON.parse(process.env.TOENOW_MIRROR_VIEWPORTS) : [{ width: 390, height: 900 }, { width: 1100, height: 900 }];
    for (const { width, height } of viewports) for (const lang of ['en', 'zh-Hant']) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.route('https://**', route => route.abort());
      await context.addInitScript(lang => {
        localStorage.setItem('toenow_language_v1', lang);
        localStorage.setItem('toenow_tutorial_block-match_v2', 'completed');
        localStorage.setItem('chip_defrag_high_score_v5', '9999');
        localStorage.setItem('block_match_best_wave', '25');
      }, lang);
      await context.route('**/games/block-match/main.js', route => {
        const source = fs.readFileSync('games/block-match/main.js', 'utf8');
        const end = source.lastIndexOf('})();');
        const hook = `window.__mirrorTest={
          beforeLevel:(wave,practice)=>{startNewGame(1,practice);state.wave=wave-1;board=generateWaveBoard(state.wave,state.elapsedTime);updateLayout();syncHud();},
          startAt:wave=>startNewGame(wave,true),
          clear:()=>{for(let r=0;r<board.activeGrid.length;r++)for(let c=0;c<board.activeGrid.length;c++)if(board.activeGrid[r][c]===2)handleSingleCellTap(r,c);},
          snapshot:()=>({mode:gameMode,wave:state.wave,score:state.score,time:state.timeLeft,combo:state.combo,shards:state.totalShards,isPractice:state.isPractice,board:board}),
          pause:()=>setGameMode('paused')
        };`;
        return route.fulfill({ contentType: 'application/javascript', body: source.slice(0, end) + hook + source.slice(end) });
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/games/block-match/');
      for (const [index, wave] of [6, 11, 16, 21].entries()) {
        await page.evaluate(({ wave, practice }) => __mirrorTest.beforeLevel(wave, practice), { wave, practice: index % 2 === 1 });
        await page.evaluate(() => __mirrorTest.clear());
        await page.locator('#briefing-screen').waitFor({ state: 'visible' });
        const before = await page.evaluate(() => __mirrorTest.snapshot());
        await page.locator('#btn-engage-phase').click();
        await page.locator('[data-tutorial-advance]').waitFor({ state: 'visible', timeout: 3000 });
        const demo = await page.evaluate(() => __mirrorTest.snapshot());
        assert.equal(demo.score, 0);
        assert.equal(demo.board.config.gridSize, 3);
        assert.equal(demo.board.config.compassNotch, index === 0 ? 'FLIP-H' : index === 1 ? 'FLIP-V' : 'FLIP-HV');
        const transform = require('../games/block-match/rules.js').applySpatialTransform;
        assert.deepEqual(demo.board.blueprintGrid, transform(demo.board.carvingTargetGrid, demo.board.config.compassNotch));
        await page.waitForTimeout(350);
        assert.equal((await page.evaluate(() => __mirrorTest.snapshot())).time, demo.time, 'lesson never consumes time');
        const fits = await page.evaluate(() => {
          const { layout } = __CHIP_DEFRAG__.getState(), canvas = document.querySelector('canvas').getBoundingClientRect();
          return [layout.leftBox, layout.rightBox].every(box => canvas.left + box.x >= 0 && canvas.top + box.y >= 0 && canvas.left + box.x + box.size <= innerWidth + 1 && canvas.top + box.y + box.size <= innerHeight + 1);
        });
        assert.equal(fits, true, 'both real boards remain within the viewport');
        await page.screenshot({ path: `${output}/${width}-${lang}-level${index + 2}.png` });
        await page.evaluate(() => __CHIP_DEFRAG__.clickCell(2, 2));
        assert.equal((await page.evaluate(() => __mirrorTest.snapshot())).board.remainingExcess, 1, 'reading step waits for Try it');
        await page.locator('[data-tutorial-advance]').click();
        // A wrong tile stays in place and does not change the real run.
        await page.evaluate(() => __CHIP_DEFRAG__.clickCell(0, 0));
        assert.equal((await page.evaluate(() => __mirrorTest.snapshot())).board.activeGrid[0][0], 1);
        const rect = await page.evaluate(() => ToenowTutorials.getState().guide.rect);
        await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
        await page.locator('[data-tutorial-finish]').waitFor({ state: 'visible' });
        assert.equal(await page.evaluate(key => localStorage.getItem(key), `toenow_block_lesson_level-${index + 2}_v1`), 'completed');
        await page.locator('[data-tutorial-finish]').click();
        await page.evaluate(() => __mirrorTest.pause());
        const after = await page.evaluate(() => __mirrorTest.snapshot());
        assert.deepEqual(after.board, before.board, 'the original generated puzzle survives the lesson');
        for (const field of ['wave', 'score', 'combo', 'shards', 'isPractice']) assert.equal(after[field], before[field], field);
        assert.ok(Math.abs(after.time - before.time) < .25, 'the real timer resumes without a reset');
        assert.equal(await page.locator('#toenow-tutorial').count(), 0);
      }
      await page.reload();
      for (const wave of [6, 11, 16, 21]) {
        await page.evaluate(wave => __mirrorTest.beforeLevel(wave, true), wave);
        await page.evaluate(() => __mirrorTest.clear());
        await page.waitForFunction(wave => __CHIP_DEFRAG__.getState().wave === wave, wave);
        assert.equal(await page.locator('#toenow-tutorial').count(), 0, 'completed lessons do not replay');
        assert.equal(await page.locator('#briefing-screen').isVisible(), false, 'learned levels continue directly');
      }
      assert.equal(await page.evaluate(() => localStorage.getItem('chip_defrag_high_score_v5')), '9999');
      assert.equal(await page.evaluate(() => localStorage.getItem('block_match_best_wave')), '25');
      if (width === 390 && lang === 'zh-Hant') {
        await page.evaluate(() => localStorage.removeItem('toenow_block_lesson_level-2_v1'));
        await page.route('**/__mirror-frame', route => route.fulfill({ contentType: 'text/html',
          body: '<iframe src="/games/block-match/" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>' }));
        await page.goto(base + '/__mirror-frame');
        let frame = page.frames().find(frame => frame.parentFrame());
        await frame.waitForFunction(() => !!window.__mirrorTest);
        await frame.evaluate(() => __mirrorTest.startAt(6));
        await frame.locator('#btn-engage-phase').click();
        await frame.locator('[data-tutorial-advance]').waitFor({ state: 'visible' });
        await frame.locator('[data-tutorial-cancel]').click();
        assert.equal((await frame.evaluate(() => __mirrorTest.snapshot())).wave, 6, 'practice really starts at the selected level');
        assert.equal(await frame.locator('#briefing-screen').isVisible(), true);
        assert.equal(await frame.evaluate(() => localStorage.getItem('toenow_block_lesson_level-2_v1')), null, 'cancel does not mark learned');
        await frame.locator('#btn-engage-phase').click();
        await frame.locator('[data-tutorial-skip]').click();
        assert.equal(await frame.evaluate(() => localStorage.getItem('toenow_block_lesson_level-2_v1')), 'skipped');
        assert.equal((await frame.evaluate(() => __mirrorTest.snapshot())).mode, 'playing');
        await page.reload();
        frame = page.frames().find(frame => frame.parentFrame());
        await frame.waitForFunction(() => !!window.__mirrorTest);
        await frame.evaluate(() => __mirrorTest.startAt(6));
        assert.equal(await frame.locator('#briefing-screen').isVisible(), false, 'skipped lesson remains skipped after reload');
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${width}/${lang}: natural level 2–5 transitions, interactive flips, timer/score/puzzle/practice protection, persistence and no repeat`);
    }
  } finally {
    let timer;
    await Promise.race([browser.close(), new Promise(resolve => { timer = setTimeout(resolve, 5000); })]);
    clearTimeout(timer);
  }
})().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
