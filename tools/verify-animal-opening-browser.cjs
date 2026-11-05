const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path'), os = require('node:os');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8877';
async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const [width, height, language, embedded] of [[1280,900,'en',false],[390,844,'zh-Hant',false],[320,568,'zh-Hant',false],[844,390,'en',false],[1100,850,'zh-Hant',true],[390,844,'en',true]]) {
      const page = await browser.newPage({ viewport:{width,height}, isMobile:width<700, hasTouch:width<700, reducedMotion:'reduce' });
      const errors=[]; page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(lang=>{localStorage.setItem('toenow_language_v1',lang);localStorage.setItem('animal_siege_best_score_v1','17');localStorage.setItem('animal_siege_best_wave_v1','2');},language);
      let host=page;
      if(embedded){await page.goto(base+'/');await page.setContent(`<iframe src="${base}/games/animal-siege/" style="border:0;width:100%;height:${height-30}px"></iframe>`);host=page.frames().find(frame=>frame.parentFrame());}
      else await page.goto(base+'/games/animal-siege/');
      await host.locator('#btn-start').waitFor({state:'visible'});
      assert.equal(await host.locator('.unified-practice-btn,[data-screen-practice]').count(),0);
      assert.equal(await host.locator('#title-screen [data-screen-record]').count(),0,'menu has no scores or Beginner rank');
      const records=()=>host.evaluate(()=>[localStorage.getItem('animal_siege_best_score_v1'),localStorage.getItem('animal_siege_best_wave_v1')]);
      const before=await records();await host.locator('#btn-start').click();
      assert.equal(await host.locator('#expedition').isVisible(),true,'story plays on the real map');
      assert.equal(await host.locator('#opening-story').isVisible(),true);
      assert.equal(await host.locator('[data-story-character]:visible').count(),1,'one animal at a time');
      assert.equal(await host.locator('#battle').isVisible(),false);
      const speakers=new Set();
      for(let step=0;step<6;step++){
        speakers.add(await host.locator('[data-story-character]').getAttribute('data-story-character'));
        assert.equal(await host.locator('#story-progress').innerText(),`${step+1} / 6`);
        if(step===1){const old=await host.locator('#story-dialogue').innerText();await host.evaluate(lang=>ToenowI18n.setLanguage(lang==='en'?'zh-Hant':'en'),language);assert.notEqual(await host.locator('#story-dialogue').innerText(),old);assert.equal(await host.locator('#story-progress').innerText(),'2 / 6');await host.evaluate(lang=>ToenowI18n.setLanguage(lang),language);}
        if(step===0&&!embedded)await page.screenshot({path:path.join(os.tmpdir(),`toenow-map-story-${width}-${language}.png`),fullPage:true});
        await host.locator('#story-next').click();
      }
      assert.equal(speakers.size,3);await host.locator('#camp').waitFor({state:'visible'});
      assert.equal(await host.locator('#story-progress').innerText(),'1 / 3');assert.equal(await host.locator('.camp-building').count(),3);
      assert.equal(await host.locator('#camp-gold').innerText(),'90','guide does not spend resources');
      await host.locator('#story-next').click();await host.locator('#camp-dialog').waitFor({state:'visible'});
      assert.equal(await host.locator('#camp-dialog #opening-story').count(),1,'guide works inside actual building dialog');
      assert.equal(await host.locator('#story-progress').innerText(),'2 / 3');assert.equal(await host.locator('.recruit-actions.camp-tour-focus').count(),1);
      await host.locator('[data-recruit="beaver"][data-amount="1"]').click();
      assert.equal(await host.locator('#camp-gold').innerText(),'70','player purchase spends actual 20 gold');
      assert.equal(await host.locator('#story-progress').innerText(),'2 / 3','purchase rerender preserves guide');
      await host.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());
      assert.equal(await host.locator('#opening-story').isVisible(),false,'pause hides the guide');
      await host.locator('#resume').click();
      assert.equal(await host.locator('#story-progress').innerText(),'2 / 3','resume restores the same camp step');
      await host.locator('#story-next').click();assert.equal(await host.locator('#story-progress').innerText(),'3 / 3');
      assert.equal(await host.locator('.camp-training.camp-tour-focus').count(),1);
      assert.equal(await host.locator('[data-upgrade="beaver"]').isDisabled(),true,'25 wood cannot pay 35 wood training');
      if(!embedded)await page.screenshot({path:path.join(os.tmpdir(),`toenow-camp-tour-${width}-${language}.png`),fullPage:true});
      const targetBox=await host.locator('[data-upgrade="beaver"]').boundingBox();
      assert.ok(targetBox&&targetBox.y+targetBox.height<height,'training button remains visible with the explanation');
      await host.evaluate(lang=>ToenowI18n.setLanguage(lang==='en'?'zh-Hant':'en'),language);assert.equal(await host.locator('#story-progress').innerText(),'3 / 3');await host.evaluate(lang=>ToenowI18n.setLanguage(lang),language);
      if(!embedded)await page.screenshot({path:path.join(os.tmpdir(),`toenow-camp-tour-${width}-${language}.png`),fullPage:true});
      await host.locator('#story-next').click();assert.equal(await host.locator('#opening-story').isVisible(),false);
      assert.equal(await host.locator('#camp').isVisible(),true,'guide ends in camp without forcing combat');
      await host.locator('#camp-dialog-close').click();await host.locator('#camp-exit').click();await host.locator('[data-location="acorn"]').click();await host.locator('[data-attack="acorn"]').click();
      assert.equal(await host.locator('#battle').getAttribute('data-lesson'),'true','fresh player gets instructions at battle entry');
      await host.locator('#battle-coach-skip').click();assert.equal(await host.locator('#battle').getAttribute('data-lesson'),'false');
      await host.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());await host.locator('#opening-story').waitFor({state:'visible'});assert.equal(await host.locator('#expedition').isVisible(),true);await host.locator('#story-skip').click();
      await host.locator('[data-location="acorn"]').click();await host.locator('[data-attack="acorn"]').click();
      assert.equal(await host.locator('#battle').getAttribute('data-lesson'),'false','returning player does not repeat instruction');
      assert.equal(await host.locator('#battle-coach').isVisible(),false);assert.deepEqual(await records(),before);
      if(width===1280){
        for(const dismiss of ['escape','close']){
          await host.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());
          for(let step=0;step<7;step++)await host.locator('#story-next').click();
          await host.locator('[data-recruit="beaver"][data-amount="1"]').click();
          if(dismiss==='escape')await host.locator('#story-next').press('Escape');
          else await host.locator('#camp-dialog-close').click();
          assert.equal(await host.locator('#camp').isVisible(),true,dismiss+' keeps the expedition in camp');
          assert.equal(await host.locator('#camp-gold').innerText(),'70',dismiss+' preserves the actual purchase');
          assert.equal(await host.locator('#opening-story').isVisible(),false);
          assert.equal(await host.locator('#unit-guide-open').isVisible(),true,dismiss+' restores handbook access');
        }
      }
      assert.equal(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
      console.log(`PASS map/camp ${width}x${height} ${language} ${embedded?'iframe':'standalone'}: map story, real recruitment, training, camp finish, first-battle instruction`);await page.close();
    }
  }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
