const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8766';
async function clearBoard(page) {
  const cells = await page.evaluate(() => {
    const s = __CHIP_DEFRAG__.getState();
    return s.board.activeGrid.flatMap((row,r) => row.flatMap((v,c) => v === 2 ? [{r,c}] : []));
  });
  for (const cell of cells) {
    const point = await page.evaluate(({r,c}) => {
      const b = __CHIP_DEFRAG__.getState().layout.leftBox;
      return {x:b.x+b.pad+c*(b.cellSize+b.gap)+b.cellSize/2,y:b.y+b.pad+r*(b.cellSize+b.gap)+b.cellSize/2};
    }, cell);
    await page.mouse.click(point.x,point.y);
  }
}
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    fs.mkdirSync('artifacts/block-match-success',{recursive:true});
    for (const width of [390,1100]) for (const lang of ['zh-Hant','en']) {
      const page = await browser.newPage({viewport:{width,height:850}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'/games/block-match/?autostart=1');
      await page.evaluate(lang=>ToenowI18n.setLanguage(lang),lang);
      assert.equal(await page.locator('#match-success').isVisible(),false);
      await clearBoard(page);
      await page.locator('#match-success').waitFor({state:'visible'});
      assert.ok((await page.locator('#match-success').innerText()).includes(lang==='en'?'Match complete!':'配對成功！'));
      const before=await page.evaluate(()=>__CHIP_DEFRAG__.getState());
      assert.equal(before.wave,1);assert.equal(before.board.remainingExcess,0);
      await page.evaluate(()=>__CHIP_DEFRAG__.clickCell(0,0));
      await page.waitForTimeout(180);
      const after=await page.evaluate(()=>__CHIP_DEFRAG__.getState());
      assert.equal(after.timeLeft,before.timeLeft);assert.equal(after.score,before.score);
      const box=await page.locator('.match-success-card').boundingBox();
      assert.ok(box.x>=0 && box.x+box.width<=width);
      await page.screenshot({path:`artifacts/block-match-success/${width}-${lang}.png`});
      await page.waitForFunction(()=>__CHIP_DEFRAG__.getState().wave===2);
      assert.equal(await page.locator('#match-success').isVisible(),false);
      await page.evaluate(()=>__CHIP_DEFRAG__.jumpToWave(15));
      await clearBoard(page);
      await page.locator('#match-success').waitFor({state:'visible'});
      await page.waitForFunction(()=>__CHIP_DEFRAG__.getState().mode==='briefing');
      assert.equal((await page.evaluate(()=>__CHIP_DEFRAG__.getState())).wave,16);
      await page.evaluate(()=>__CHIP_DEFRAG__.engagePhaseBriefing());
      await clearBoard(page);
      await page.locator('#match-success').waitFor({state:'visible'});
      await page.locator('#btn-restart-hud').click();
      await page.waitForTimeout(1400);
      assert.equal((await page.evaluate(()=>__CHIP_DEFRAG__.getState())).wave,1);
      assert.equal(await page.locator('#match-success').isVisible(),false);
      assert.deepEqual(errors,[]);
      console.log(`PASS ${width} ${lang}: success, frozen timer/input, next wave, phase briefing, restart`);
      await page.close();
    }
  } finally {
    let cleanupTimer;
    await Promise.race([browser.close(),new Promise(resolve=>{cleanupTimer=setTimeout(resolve,5000);})]);
    clearTimeout(cleanupTimer);
  }
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
