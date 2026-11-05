const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createPicker } = require('../games/animal-rescue-train/picker.js');
const { Game } = require('../games/animal-rescue-train/engine.js');
const { solve } = require('./rescue-train-solver.cjs');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8789';
const out = path.resolve(__dirname, '../artifacts/animal-rescue-train/simple-board', `run-${Date.now()}`);
fs.mkdirSync(out, { recursive: true });
const key = 'animal_rescue_train_guest_v2';
const checks = [], errors = [];
const check = (ok, message) => { assert.ok(ok, message); checks.push(message); };
const save = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const records = page => page.evaluate(() => [localStorage.getItem('animal_rescue_train_best_score'), localStorage.getItem('animal_rescue_train_best_wave')]);
async function acknowledge(page) {
  if (await page.locator('#last-animal-dialog').isVisible()) await page.locator('#acknowledge-last-animal').click();
}
async function board(page, queue, car) {
  await page.locator(`[data-queue="${queue}"]`).click();
  await page.locator(`[data-car="${car}"]`).click();
}
async function inspect(page, width, height, tier, language) {
  const geometry = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, y:r.y, right:r.right, bottom:r.bottom }; };
    return { cars:rect('#cars'), queues:rect('#queues'), scroll:document.documentElement.scrollWidth, width:innerWidth,
      headWidths:[...document.querySelectorAll('.head')].map(n => n.getBoundingClientRect().width) };
  });
  check(geometry.scroll <= geometry.width, `${width}/${language}/L${tier}: no horizontal overflow`);
  check(geometry.queues.bottom < geometry.cars.y, 'queues sit immediately above the train');
  if (tier === 1 || height >= 720) check(geometry.cars.bottom <= height - 45, `${width}/${language}/L${tier}: whole train fits above language control`);
  check(geometry.headWidths.every(w => w >= 44), 'queue heads retain touch target width');
  check(!await page.locator('.queue-header,.head-label,.preview-label,.car-title,.car-hint,#total,#board-size').count(), 'quantity and repetitive label elements removed');
  const text = await page.locator('#cars').innerText();
  check(!/\d/.test(text), 'train seats have no numeric text');
  check(!/\d/.test(await page.locator('#queues').innerText()), 'queues have no numeric text');
  check(await page.locator('#stationmaster #instruction').count() === 1, 'one panda instruction');
  await page.screenshot({ path:path.join(out, `${width}-${language}-level${tier}.png`), fullPage:true });
}
(async () => {
  console.log(`Evidence: ${out}`);
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    for (const [width,height] of [[320,568],[390,720],[1280,900]]) {
      for (const language of ['en','zh-Hant']) {
        const context = await browser.newContext({viewport:{width,height},hasTouch:width<600,isMobile:width<600});
        const page = await context.newPage();
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`${base}/games/animal-rescue-train/`);
        await page.evaluate(lang => ToenowI18n.setLanguage(lang), language);
        check(!await page.locator('#rules-list').isVisible(), 'menu instructions collapsed');
        await page.locator('#btn-start-game').click();
        await page.locator('#help').click();
        const contrast = await page.locator('#help-content .warning').evaluate(node => {
          const luminance = color => {
            const rgb = color.match(/[\d.]+/g).slice(0,3).map(n => Number(n)/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4);
            return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
          };
          const ink=luminance(getComputedStyle(node).color),paper=luminance(getComputedStyle(node.closest('dialog')).backgroundColor);
          return (Math.max(ink,paper)+.05)/(Math.min(ink,paper)+.05);
        });
        check(contrast>=4.5,'carriage rule remains readable in Help');
        await page.locator('#close-help').click();
        const initial = await save(page);
        const level = createPicker().resolve(initial.wave,initial.requiredLastAnimal,initial.puzzleIndex);
        const model = new Game(level);
        const moves = solve(level).path;
        assert.ok(moves);
        await inspect(page,width,height,1,language);
        // Preview position 1 must be nearest the head; do not reveal additional animals.
        const preview = page.locator('.queue').first().locator('.preview');
        check(await preview.count()===3,'only the next three animals are previewed');
        const positions = await preview.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().y));
        check(positions[0]<positions[1]&&positions[1]<positions[2],'preview order flows down toward the queue head');
        for (let i=0;i<2;i++) { await board(page,...moves[i]); model.move(...moves[i]); }
        const occupied = model.state.cars.findIndex(car=>car.length);
        if (occupied>=0) {
          check(await page.locator(`[data-car="${occupied}"] .seat-ghost`).count()===3-model.state.cars[occupied].length,'empty occupied-car seats show matching ghosts');
          const wrong = model.state.queues.findIndex(q=>q.length&&q[0]!==model.state.cars[occupied][0]);
          if (wrong>=0) {
            await page.locator(`[data-queue="${wrong}"]`).click();
            check(await page.locator(`[data-car="${occupied}"]`).isDisabled(),'incompatible animal cannot board');
          }
        }
        // Switching language updates the single hint without changing selection or DOM focus.
        const selectedHead = page.locator(`[data-queue="${moves[2][0]}"]`);
        if (await selectedHead.getAttribute('aria-pressed') !== 'true') await selectedHead.click();
        await page.evaluate(() => { window.__head=document.querySelector('[data-queue]'); ToenowI18n.setLanguage(ToenowI18n.language==='en'?'zh-Hant':'en'); });
        check(await page.evaluate(()=>window.__head===document.querySelector('[data-queue]')),'language switch preserves board nodes');
        await page.evaluate(lang=>ToenowI18n.setLanguage(lang),language);
        check((await page.locator('#instruction').innerText()) === (language==='en'?'Tap a glowing carriage':'點亮起的車廂'),'short hint switches in both languages');
        await page.screenshot({path:path.join(out,`${width}-${language}-selected.png`),fullPage:true});
        await page.locator('#undo').click();
        check((await save(page)).actions.length===1,'undo retains actual game behavior');
        const before=await save(page);
        await page.reload(); await page.locator('#continue').click();
        const restored=await save(page);
        check(JSON.stringify(before.actions)===JSON.stringify(restored.actions)&&before.puzzleIndex===restored.puzzleIndex,'reload restores exact saved puzzle and moves');
        // All tiers remain playable and retain the special last-animal rule.
        for (let tier=1;tier<=5;tier++) {
          if (await page.locator('#play-screen').isVisible()) await page.locator('#menu').click();
          await page.locator('.unified-practice-btn').click();
          await page.locator(`button[data-level="${tier}"]`).click();
          if (tier===5) check(await page.locator('#last-animal-dialog').isVisible(),'Level 5 rule is acknowledged before playing');
          await acknowledge(page);
          await inspect(page,width,height,tier,language);
          if(tier===5) check(await page.locator('.required-last-goal').isVisible(),'persistent last-animal badge remains');
          const recordBefore=await records(page), data=await save(page);
          const puzzle=createPicker().resolve(data.wave,data.requiredLastAnimal,data.puzzleIndex);
          const route=solve(puzzle).path;
          assert.ok(route);
          for (const move of route) await board(page,...move);
          check(await page.locator('#success-dialog').isVisible(),'actual puzzle reaches success');
          check(JSON.stringify(recordBefore)===JSON.stringify(await records(page)),'practice preserves best records');
          await page.locator('#success-menu').click();
        }
        await context.close();
        console.log(`PASS ${width}x${height} ${language}: layout, selection, save, undo, all tiers and practice`);
      }
    }
    check(errors.length===0,'no browser errors');
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks:checks.length,errors,physicalIPadSafari:'NOT VERIFIED'},null,2));
    console.log(`PASS ${checks.length} checks`);
  } finally { let timer; await Promise.race([browser.close(), new Promise(resolve=>{timer=setTimeout(resolve,5000);})]); clearTimeout(timer); }
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});
