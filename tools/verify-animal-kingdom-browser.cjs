const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const dir=path.resolve(__dirname,'../artifacts/animal-kingdom');
async function run(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const [width,height,lang] of [[1280,950,'zh-Hant'],[390,844,'zh-Hant'],[390,844,'en'],[320,740,'en'],[844,390,'zh-Hant']]){
      const page=await browser.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700});const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
      await page.goto(base+'/games/animal-siege/?mode=expedition');await page.locator('#btn-start').click();
      assert.match(await page.locator('.exp-map').evaluate(el=>getComputedStyle(el).backgroundImage),/kingdom-map-v1.webp/);
      const mapAsset=await page.request.get(base+'/assets/animal-siege/kingdom-map-v1.webp');assert.equal(mapAsset.status(),200);
      await page.locator('#expedition img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
      assert.equal(await page.locator('.map-node').count(),7);assert.equal(await page.locator('.kingdom-party img').count(),3);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
      assert.ok(await page.evaluate(()=>document.body.getBoundingClientRect().height>=document.getElementById('expedition').getBoundingClientRect().bottom),'forest background covers complete scrolling content');
      await page.screenshot({path:path.join(dir,width+'-'+height+'-'+lang+'-map.png'),fullPage:true});
      // Every painted place has a real, unobstructed, independently usable control.
      for(const id of ['home','acorn','river','tower','cache','timber','friends']){
        const node=page.locator('.map-node[data-location="'+id+'"]');await node.scrollIntoViewIfNeeded();
        assert.ok(await node.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-location]')===el;}),id+' hotspot has no overlay obstruction');
        if(width<700)await node.tap();else await node.click();
        assert.equal(await node.getAttribute('class').then(s=>s.includes('chosen')),true);
      }
      await page.locator('[data-explore="friends"]').click();await page.locator('[data-claim="friends"][data-choice="fox"]').click();
      assert.equal(await page.locator('.map-node[data-location="friends"] .trail-find').innerText(),'✓');
      assert.equal(await page.locator('[data-claim="friends"]').count(),0);
      await page.locator('.map-node[data-location="home"]').click();await page.locator('[data-recruit="squirrel"][data-amount="1"]').click();assert.equal(await page.locator('#exp-gold').innerText(),'72');
      await page.locator('.map-node[data-location="acorn"]').click();await page.screenshot({path:path.join(dir,width+'-'+height+'-'+lang+'-scout.png'),fullPage:true});
      await page.locator('[data-attack="acorn"]').click();await page.locator('#board').waitFor({state:'visible'});assert.equal(await page.locator('#board img').count(),6);
      await page.locator('#restart').click();await page.locator('#expedition').waitFor({state:'visible'});assert.equal(await page.locator('#exp-gold').innerText(),'72');
      await page.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await page.locator('#title-button').click();await page.locator('#title-screen').waitFor({state:'visible'});
      assert.deepEqual(errors,[]);console.log('PASS '+width+'x'+height+' '+lang+': scene loaded, seven clickable hotspots, responsive layout, one-time discovery, recruitment, scouting, battle and retreat');await page.close();
    }
  }finally{await browser.close();}
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
