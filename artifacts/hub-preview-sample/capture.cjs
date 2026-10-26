const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createPicker } = require('../../games/animal-rescue-train/picker.js');
const { solve } = require('../../tools/rescue-train-solver.cjs');
const base = 'http://127.0.0.1:8765';
const out = __dirname;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const evidence=process.env.CAPTURE_GAMES && fs.existsSync(path.join(out,'capture-evidence.json')) ? JSON.parse(fs.readFileSync(path.join(out,'capture-evidence.json'))) : [];
 try {
  for (const id of (process.env.CAPTURE_GAMES||'animal-rescue-train,number-pop,block-match').split(',')) {
   const size={width:1280,height:id==='animal-rescue-train'?1050:800};
   const context = await browser.newContext({viewport:size,recordVideo:{dir:path.join(out,'raw'),size},locale:'en-US'});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/games/${id}/`);
   await page.evaluate(()=>window.ToenowI18n?.setLanguage('en'));
   await page.locator(id==='animal-rescue-train'?'#btn-start-game':'#btn-start').click();
   if (id==='animal-rescue-train' && await page.locator('#last-animal-dialog').isVisible()) await page.locator('#acknowledge-last-animal').click();
   if(id==='block-match') { const btn=page.locator('#btn-engage-phase'); if(await btn.isVisible()) await btn.click(); }
   await sleep(500);
   const start=Date.now();
   await page.screenshot({path:path.join(out,id+'-poster.png')});
   const captureStart=await page.evaluate(()=>performance.now()/1000);
   let actions=0;
   if(id==='animal-rescue-train') {
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('animal_rescue_train_guest_v2')));
    const level=createPicker().resolve(saved.wave,saved.requiredLastAnimal,saved.puzzleIndex);
    const moves=solve(level).path;
    if(!moves) throw Error('No solution for recorded board');
    for(const [q,c] of moves) {
     await page.locator(`[data-queue="${q}"]`).click();await sleep(450);
     await page.locator(`[data-car="${c}"]`).click();await sleep(700);actions++;
     if(Date.now()-start>9000)break;
    }
   } else while(Date.now()-start<10000) {
    if(id==='number-pop') {
     const target=await page.evaluate(()=>{const s=window.__QUANTUM_GAME__.getState();const c=s.cores.filter(c=>!c.popped).sort((a,b)=>a.value-b.value)[0];return c?{x:c.x,y:c.y}:null;});
     if(target){await page.mouse.move(target.x,target.y,{steps:6});await page.mouse.click(target.x,target.y);actions++;}
    }else{
     const target=await page.evaluate(()=>{const s=window.__CHIP_DEFRAG__.getState();if(s.mode!=='playing')return {mode:s.mode};const b=s.layout.leftBox;for(let r=0;r<s.board.activeGrid.length;r++)for(let c=0;c<s.board.activeGrid[r].length;c++)if(s.board.activeGrid[r][c]===2)return {x:b.x+b.pad+c*(b.cellSize+b.gap)+b.cellSize/2,y:b.y+b.pad+r*(b.cellSize+b.gap)+b.cellSize/2};return null;});
     if(target?.mode==='briefing'){await page.keyboard.press('Enter');}
     else if(target?.x){await page.mouse.move(target.x,target.y,{steps:8});await page.mouse.click(target.x,target.y);actions++;}
    }
    await sleep(650);
   }
   await page.mouse.move(1250,770);
   await sleep(Math.max(500,10500-(Date.now()-start)));
   const final=await page.evaluate(id=>id==='number-pop'?window.__QUANTUM_GAME__.getState():id==='block-match'?window.__CHIP_DEFRAG__.getState():{moves:document.querySelector('#moves')?.textContent},id);
   const duration=(Date.now()-start)/1000;
   const raw=await page.video().path();
   await context.close();
   const previous=evidence.findIndex(e=>e.id===id);if(previous>=0)evidence.splice(previous,1);
   evidence.push({id,raw,captureStart,duration,actions,errors,final});
   fs.writeFileSync(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));
   console.log(JSON.stringify({id,raw,captureStart,duration,actions,errors,score:final.score,wave:final.wave,moves:final.moves}));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
