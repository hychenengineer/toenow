const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});fs.mkdirSync('artifacts/ball-memory',{recursive:true});
  try{
    for(const width of [390,1100])for(const lang of ['en','zh-Hant']){
      const context=await browser.newContext({viewport:{width,height:900}});await context.route('https://**',route=>route.abort());
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/games/ball-track/');await page.evaluate(lang=>ToenowI18n.setLanguage(lang),lang);
      await page.locator('#btn-start-game').click();
      await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='lineup');
      await page.screenshot({path:`artifacts/ball-memory/${width}-${lang}-target.png`});
      await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='memorize',null,{timeout:12000});
      assert.equal(await page.locator('#toenow-tutorial').getAttribute('data-edge'),'bottom');
      assert.match(await page.locator('#tutorial-instruction').innerText(),/Shift/);
      await page.waitForTimeout(2200);assert.equal(await page.evaluate(()=>__QUANTUM_SHELL__.getState().phase),'memorize');
      await page.screenshot({path:`artifacts/ball-memory/${width}-${lang}-remember.png`});
      await page.locator('[data-tutorial-advance]').click();
      await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='shuffle');
      await page.keyboard.down('Shift');assert.equal(await page.evaluate(()=>__QUANTUM_SHELL__.getState().isOverdrive),true);await page.keyboard.up('Shift');
      const button=await page.locator('#btn-overdrive').boundingBox();await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();
      assert.equal(await page.evaluate(()=>__QUANTUM_SHELL__.getState().isOverdrive),true);await page.mouse.up();
      assert.match(await page.locator('#btn-overdrive').innerText(),lang==='en'?/ACCELERATE/:/加速/);
      assert.equal(await page.locator('#toenow-tutorial').getAttribute('data-edge'),'bottom');
      await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='select');
      const state=await page.evaluate(()=>ToenowTutorials.getState());const rect=state.guide.rect;
      const hit=await page.evaluate(rect=>document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.tagName,rect);assert.equal(hit,'CANVAS');
      await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
      await page.locator('[data-tutorial-finish]').click();
      await page.locator('#btn-confirm-memory').waitFor({state:'visible'});
      const time=await page.evaluate(()=>__QUANTUM_SHELL__.getState().runTimeSec);assert.equal(time,60);await page.waitForTimeout(1800);
      assert.equal(await page.evaluate(()=>__QUANTUM_SHELL__.getState().runTimeSec),time,'formal memory confirmation freezes timer');
      await page.locator('#btn-confirm-memory').click();await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='shuffle');
      await page.evaluate(()=>{__QUANTUM_SHELL__.forceSelectPhase();for(const shell of __QUANTUM_SHELL__.getState().shells.filter(shell=>shell.hasCore))__QUANTUM_SHELL__.pickShellById(shell.id);});
      await page.locator('#btn-confirm-memory').waitFor({state:'visible'});
      assert.equal(await page.evaluate(()=>__QUANTUM_SHELL__.getState().wave),2,'each wave requires a fresh memory confirmation');
      if(width===390&&lang==='zh-Hant'){
        await page.route(base+'/__ball-memory-frame',route=>route.fulfill({contentType:'text/html',body:`<iframe src="${base}/games/ball-track/" style="position:fixed;inset:0;width:100%;height:100%;border:0"></iframe>`}));
        await page.goto(base+'/__ball-memory-frame');
        const frame=page.frames().find(frame=>frame.parentFrame());
        await frame.locator('#btn-start-game').click();await frame.locator('#btn-confirm-memory').waitFor({state:'visible'});
        const time=await frame.evaluate(()=>__QUANTUM_SHELL__.getState().runTimeSec);await page.waitForTimeout(1200);
        assert.equal(await frame.evaluate(()=>__QUANTUM_SHELL__.getState().runTimeSec),time);
        await frame.locator('#btn-confirm-memory').click();await frame.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='shuffle');
      }
      assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}/${lang}: fixed tutorial, memory confirmation, Shift/button acceleration and formal timer`);
    }
  }finally{let timer;await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);}
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});
