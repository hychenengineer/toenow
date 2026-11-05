const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { analyze } = require('./rescue-train-difficulty.cjs');
const { Game, advance } = require('../games/animal-rescue-train/engine.js');
const bank = require('../games/animal-rescue-train/puzzles.js');
const origin = process.env.RESCUE_TEST_ORIGIN || 'http://127.0.0.1:8765';
const output = path.resolve(__dirname, '../artifacts/animal-rescue-train');
const checks = [], errors = [];
const check = (condition,label) => {assert.ok(condition,label);checks.push(label);};
const moves = async p => Number(await p.locator('#moves').innerText());
async function move(p,q,c,touch=false) {
  await p.locator(`[data-queue="${q}"]`)[touch?'tap':'click']();
  await p.locator(`[data-car="${c}"]`)[touch?'tap':'click']();
}
async function practice(p,tier) {
  if(await p.locator('#play-screen').isVisible()) await p.locator('#menu').click();
  await p.locator('.unified-practice-btn').click();
  await p.locator(`[data-level="${tier}"]`).click();
}
async function solve(p,puzzle,touch=false) {
  const certificate=analyze(puzzle).path;
  for(const [q,c] of certificate) await move(p,q,c,touch);
  return certificate;
}
async function records(p) {return p.evaluate(()=>[localStorage.getItem('animal_rescue_train_best_score'),localStorage.getItem('animal_rescue_train_best_wave')]);}
function blockedPath(puzzle) {
  const seen = new Set();
  function visit(state, history) {
    if (state.status === 'lost') return history;
    if (state.status !== 'playing') return null;
    const key = JSON.stringify([state.queues.map(q=>q.length), state.cars]);
    if (seen.has(key)) return null;
    seen.add(key);
    for (let q=0;q<state.queues.length;q++) for(let c=0;c<state.cars.length;c++) {
      const next = advance(state,puzzle.goals,q,c);
      if (next) { const found = visit(next,[...history,[q,c]]); if(found) return found; }
    }
    return null;
  }
  const result = visit(new Game(puzzle).state,[]);
  assert.ok(result, 'fixture must have a legal blocked path');
  return result;
}
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:process.env.RESCUE_BROWSER_CHANNEL||'chrome'});
  try {
    const context=await browser.newContext({viewport:{width:1280,height:1050}});
    const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${origin}/games/animal-rescue-train/`);
    check(await page.locator('#menu-screen').isVisible() && await page.locator('#play-screen').isHidden(),'separate instructions and game screens');
    check(await page.locator('html').getAttribute('lang')==='en' && !/[\u4e00-\u9fff]/u.test(await page.locator('body').innerText()),'English menu');
    await page.screenshot({path:path.join(output,'menu.png'),fullPage:true});
    await page.locator('#btn-start-game').click();
    check(await page.locator('#rules-list').isHidden(),'instructions hidden during play');
    await page.locator('#help').click(); check(await page.locator('#help-dialog').isVisible(),'help on demand'); await page.locator('#close-help').click();
    for(let i=0;i<5;i++) {
      await solve(page,bank[0][i]); check(await page.locator('#result.won').isVisible(),`normal wave ${i+1} completed`); await page.locator('#next').click();
    }
    check((await page.locator('#tier-label').innerText()).includes('INTERMEDIATE') && await page.locator('#level-number').innerText()==='WAVE 6','shared normal wave boundaries');
    const baseline=await records(page); check(Number(baseline[0])===30 && Number(baseline[1])===5,'SDK saves normal records');
    for(let tier=1;tier<=5;tier++) {
      await practice(page,tier);
      check(await page.locator('[data-queue]').count()===[2,3,3,4,5][tier-1] && await page.locator('[data-car]').count()===[2,2,3,3,4][tier-1],`level ${tier} board size`);
      const certificate=await solve(page,bank[tier-1][0]); check(await page.locator('#result.won').isVisible(),`practice ${tier} mouse win`);
      await page.locator('#undo').click(); check(await page.locator('#result').isHidden(),`level ${tier} undo winning departure`);
      await move(page,...certificate.at(-1)); check(await page.locator('#result.won').isVisible(),`level ${tier} replay departure`);
      assert.deepEqual(await records(page),baseline);
      await page.locator('#next').click(); check((await page.locator('#tier-label').innerText()).includes(`LVL ${tier}`),`practice stays at ${tier}`);
    }
    await practice(page,5); const certificate=analyze(bank[4][0]).path;
    await move(page,...certificate[0]); await move(page,...certificate[1]); const seats=await page.locator('#cars').innerText();
    await page.reload(); check((await page.locator('#continue').innerText()).includes('Wave 21 (practice)'),'guest retains Master practice');
    await page.locator('#continue').click(); check(await moves(page)===2 && await page.locator('#cars').innerText()===seats,'exact guest puzzle restoration');
    await page.locator('#undo').click(); await page.reload(); await page.locator('#continue').click();
    check(await moves(page)===1 && await page.locator('#undo').isDisabled(),'reload cannot replenish undo');
    await page.locator('#restart').click();
    await move(page,0,0);
    await page.locator('[data-queue="1"]').click();
    check(await page.locator('[data-car="0"]').isDisabled(), 'different species carriage is disabled');
    await page.locator('[data-car="0"]').dispatchEvent('click');
    check(await moves(page)===1, 'incompatible boarding consumes no move');
    check(await page.locator('[data-car="1"]').isEnabled(), 'empty carriage accepts selected species');
    await page.locator('#restart').click();
    const losingPath = blockedPath(bank[4][0]);
    for(const [q,c] of losingPath) await move(page,q,c);
    check(await page.locator('#result.lost').isVisible(),'no compatible queue/car pair fails even with free seats');
    await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});
    await page.locator('#undo').click(); check(await moves(page)===losingPath.length-1 && await page.locator('#result').isHidden(),'undo blocked station');
    await page.locator('#restart').click(); check(await moves(page)===0 && await page.locator('#level-number').innerText()==='WAVE 21','retry current difficulty');
    await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
    for(const [width,height] of [[320,568],[390,844],[650,500],[768,1024],[1024,768]]) {
      await page.setViewportSize({width,height});
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`no horizontal overflow ${width}x${height}`);
      check(await page.locator('.head').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().width>=44 && n.getBoundingClientRect().height>=44)),`touch targets ${width}x${height}`);
    }
    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const touch=await mobile.newPage(); touch.on('pageerror',e=>errors.push(e.message));
    await touch.goto(`${origin}/games/animal-rescue-train/`); await practice(touch,1); await solve(touch,bank[0][0],true);
    check(await touch.locator('#result.won').isVisible(),'touch complete rescue');
    await practice(touch,5); await touch.screenshot({path:path.join(output,'mobile.png'),fullPage:true});
    const blocked=await browser.newContext(); await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}}));
    const noSave=await blocked.newPage(); noSave.on('pageerror',e=>errors.push(e.message));
    await noSave.goto(`${origin}/games/animal-rescue-train/`); await noSave.locator('#btn-start-game').click(); await solve(noSave,bank[0][0]);
    check(await noSave.locator('#result.won').isVisible(),'storage unavailable remains playable');
    const hub=await context.newPage(); hub.on('pageerror',e=>errors.push(e.message));
    await hub.route('https://**/*',route=>route.fulfill({body:'',contentType:'application/javascript'})); await hub.goto(origin);
    await hub.evaluate(()=>{window.rescueReports=[];window.addEventListener('message',e=>{if(e.data?.gameId==='animal-rescue-train') window.rescueReports.push(e.data);});});
    await hub.locator('[data-game-id="animal-rescue-train"]').click(); const frame=hub.frameLocator('#gameViewer');
    await practice(frame,2); await move(frame,...analyze(bank[1][0]).path[0]); await frame.locator('#help').click(); await hub.locator('#restartGameBtn').click();
    await frame.locator('#moves').filter({hasText:'0'}).waitFor();
    check(await moves(frame)===0 && await frame.locator('#level-number').innerText()==='WAVE 6','Hub restart retains difficulty');
    check(await frame.locator('#help-dialog').isHidden(), 'Hub restart closes help');
    await solve(frame,bank[1][0]); await hub.waitForFunction(()=>window.rescueReports.some(x=>x.type==='GAME_OVER'));
    const report=await hub.evaluate(()=>window.rescueReports.find(x=>x.type==='GAME_OVER'));
    check(report.isPractice===true && report.wave===6 && report.level===2 && report.score===9,'iframe SDK game-over payload');
    assert.deepEqual(await records(page),baseline); await hub.screenshot({path:path.join(output,'hub-iframe.png'),fullPage:true});
    await frame.locator('#menu').click(); await frame.locator('#btn-start-game').click(); await solve(frame,bank[0][0]);
    await hub.waitForFunction(()=>JSON.parse(localStorage.getItem('toenow_game_scores')||'{}')['animal-rescue-train']?.lastScore===6);
    check(true,'normal iframe results reach Hub personal records without leaderboard');
    await frame.locator('#menu').click(); await frame.locator('#exit-title').click();
    await hub.waitForFunction(()=>document.getElementById('gameViewer').getAttribute('src')==='about:blank'); check(true,'Back to Hub closes iframe');
    check(errors.length===0,`no browser errors ${errors.join('; ')}`);
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({checks,errors,physicalIPadSafari:'NOT VERIFIED'},null,2)+'\n');
    console.log(`PASS ${checks.length} browser checks`);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
