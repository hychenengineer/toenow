// Exercise the existing train menu and result flow with a deterministic finish hook.
const {chromium}=require('playwright');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const out=path.resolve(__dirname,'../artifacts/island-screens');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    for(const width of [1100,390]) for(const lang of ['en','zh-Hant']) {
      const page=await browser.newPage({viewport:{width,height:850}}), errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      let source=fs.readFileSync(path.resolve(__dirname,'../games/animal-rescue-train/game.js'),'utf8');
      const end=source.lastIndexOf('})();');
      source=source.slice(0,end)+'window.__finishTrainScreen=()=>{game.state.status="won";render();};'+source.slice(end);
      await page.route('**/animal-rescue-train/game.js',route=>route.fulfill({contentType:'application/javascript',body:source}));
      await page.goto(base+'/games/animal-rescue-train/');
      await page.evaluate(l=>ToenowI18n.setLanguage(l),lang);
      await page.locator('#menu-screen').waitFor({state:'visible'});
      for(const [phase,selector] of [['title','#menu-screen .unified-title-card'],['end','#success-dialog']]) {
        if(phase==='end') {
          await page.locator('#btn-start-game').click();
          await page.evaluate(()=>__finishTrainScreen());
          await page.locator(selector).waitFor({state:'visible'});
        }
        const card=page.locator(selector);
        const color=await card.evaluate(el=>getComputedStyle(el).backgroundColor);
        assert.ok(color.match(/[\d.]+/g).slice(0,3).every(n=>Number(n)>210),phase+' uses paper');
        await card.locator('.unified-animal-art').evaluate(img=>img.decode());
        assert.equal(await card.evaluate(el=>el.scrollWidth>el.clientWidth),false,'no horizontal card overflow');
        await page.waitForTimeout(400);
        await page.screenshot({path:path.join(out,`animal-rescue-train-${width}-${lang}-${phase}.png`)});
      }
      await page.locator('#success-menu').click();
      await page.locator('#success-dialog').waitFor({state:'hidden'});
      await page.locator('#menu-screen').waitFor({state:'visible'});
      assert.deepEqual(errors,[]);
      console.log('PASS train island title/result/replay-to-title',width,lang);
      await page.close();
    }
  } finally {
    let timer;
    await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);
    clearTimeout(timer);
  }
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
