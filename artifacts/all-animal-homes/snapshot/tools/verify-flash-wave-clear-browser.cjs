const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const output=path.resolve(__dirname,'../artifacts/flash-wave-clear');fs.mkdirSync(output,{recursive:true});
  try{
    for(const width of [390,1100])for(const lang of ['en','zh-Hant']){
      const context=await browser.newContext({viewport:{width,height:900}});
      await context.route('https://**',route=>route.abort());
      await context.addInitScript(lang=>{localStorage.setItem('toenow_language_v1',lang);localStorage.setItem('toenow_tutorial_flash-brain_v2','completed');},lang);
      await context.route('**/games/flash-brain/tutorial.js',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.resolve(__dirname,'../games/flash-brain/tutorial.js'),'utf8')+'\nconst step=FlashBrainTutorial.beforeStep;FlashBrainTutorial.beforeStep=(state,shell)=>{window.__clearState=state;step(state,shell);};'}));
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      async function clearWave(host=page){
        assert.equal(await host.locator('#toenow-tutorial').count(),0);
        await host.waitForFunction(()=>__clearState.phase==='PHASE_INPUT');
        const points=await host.evaluate(()=>{
          const state=__clearState,box=document.querySelector('canvas').getBoundingClientRect();
          return state.waveState.cells.filter(cell=>cell.type==='TARGET').map(cell=>{
            const geometry=state.cellScreenGeometries.find(item=>item.id===cell.id);return{x:box.left+geometry.centerX,y:box.top+geometry.centerY};
          });
        });
        for(const point of points)await page.mouse.click(point.x,point.y);
        await host.locator('.flash-wave-clear').waitFor({state:'visible'});
      }
      await page.goto(base+'/games/flash-brain/?wave=5&practice=1&autostart=1');
      await clearWave();
      assert.equal(await page.locator('.flash-wave-clear h2').innerText(),lang==='en'?'Wave cleared!':'過關了！');
      assert.match(await page.locator('.flash-wave-clear p').first().innerText(),/5/);
      const before=await page.evaluate(()=>({wave:__clearState.waveState.config.wave,time:__clearState.globalTimeRemaining,score:__clearState.score}));
      await page.mouse.click(width/2,450);
      await page.waitForTimeout(350);
      assert.deepEqual(await page.evaluate(()=>({wave:__clearState.waveState.config.wave,time:__clearState.globalTimeRemaining,score:__clearState.score})),before,'clear notice freezes timer and ignores extra taps');
      await page.screenshot({path:path.join(output,`${width}-${lang}.png`)});
      await page.getByTestId('telemetry-hud').locator('button').nth(2).click();
      await page.locator('.flash-wave-clear').waitFor({state:'hidden'});
      await page.waitForTimeout(1500);
      assert.equal(await page.evaluate(()=>__clearState.waveState.config.wave),5,'pause must suspend transition');
      await page.locator('.unified-pause-resume-btn').click();
      await page.waitForFunction(()=>__clearState.waveState.config.wave===6);
      await page.locator('.flash-wave-clear').waitFor({state:'hidden'});
      await page.goto(base+'/games/flash-brain/?wave=10&practice=1&autostart=1');
      await clearWave();
      assert.equal(await page.evaluate(()=>ToenowTutorials.isActive('flash-brain')),false,'new-rule lesson must wait for completion notice');
      await page.locator('[data-tutorial-advance]').waitFor({state:'visible'});
      assert.match(await page.locator('#tutorial-instruction').innerText(),/Red|紅色/);
      await page.route(base+'/__flash-clear-frame',route=>route.fulfill({contentType:'text/html',body:`<iframe src="${base}/games/flash-brain/?wave=5&practice=1&autostart=1" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`}));
      await page.goto(base+'/__flash-clear-frame');
      const frame=page.frames().find(frame=>frame.parentFrame());
      await clearWave(frame);
      await frame.getByTestId('telemetry-hud').locator('button').nth(1).click();
      await frame.locator('.flash-wave-clear').waitFor({state:'hidden'});
      await frame.waitForFunction(()=>__clearState.phase==='PHASE_FLASH');
      assert.equal(await frame.locator('#toenow-tutorial').count(),0);
      assert.deepEqual(errors,[]);
      await context.close();console.log(`PASS ${width}/${lang}: clear notice, timer/input protection, pause/resume, next wave, rule transition and iframe restart`);
    }
  }finally{let timer;await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);}
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});
