const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path'), os = require('node:os');
const base = process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8877';
async function introductionLayout(host) {
  assert.equal(await host.locator('dialog[open]').count(),0,'explanations never share a building dialog');
  assert.equal(await host.locator('#camp-dialog #opening-story').count(),0);
  const geometry=await host.evaluate(()=>{
    const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
    const card=document.querySelector('.story-card').getBoundingClientRect();
    return {heading:rect('story-heading'),body:document.querySelector('.story-body').getBoundingClientRect().toJSON(),actions:document.querySelector('.story-actions').getBoundingClientRect().toJSON(),card:card.toJSON(),w:innerWidth,h:innerHeight};
  });
  assert.ok(geometry.card.left>=0&&geometry.card.right<=geometry.w+.5&&geometry.card.top>=0&&geometry.card.bottom<=geometry.h+.5,'dialogue fits actual iframe viewport');
  assert.ok(geometry.heading.bottom<=geometry.body.top+.5&&geometry.body.bottom<=geometry.actions.top+.5,'narrative text and controls do not overlap');
  for(const selector of ['#story-next','#story-skip'])assert.equal(await host.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el===top||el.contains(top);}),true,'narrative controls remain unobstructed');
}
async function buildingLayout(host) {
  assert.equal(await host.locator('#opening-story').isVisible(),false,'normal building contains no introduction');
  const positions=await host.locator('#camp-dialog').evaluate(el=>['h2','.camp-unit','.recruit-actions','.camp-training'].map(s=>{const r=el.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
  for(let i=1;i<positions.length;i++)assert.ok(positions[i-1].bottom<=positions[i].top+.5,'building heading, army, recruitment and training retain natural order');
}
async function run(){
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{for(const [width,height,language,embedded] of [[1280,900,'en',false],[390,664,'zh-Hant',false],[320,480,'en',false],[844,390,'en',false],[393,664,'en',true],[390,664,'zh-Hant',true],[320,480,'zh-Hant',true],[844,390,'zh-Hant',true]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(lang=>{localStorage.setItem('toenow_language_v1',lang);localStorage.setItem('animal_siege_best_score_v1','17');localStorage.setItem('animal_siege_best_wave_v1','2');},language);
    let host;
    async function open(){if(embedded){await page.goto(base+'/');if(await page.locator('#islandWelcome').isVisible())await page.locator('#welcomeGuestBtn').click();await page.locator('[data-island-select="expedition"]').click();await page.locator('#open-animal-siege').click();await page.locator('#gameViewer').waitFor({state:'visible'});host=await (await page.locator('#gameViewer').elementHandle()).contentFrame();}else{await page.goto(base+'/games/animal-siege/');host=page;}await host.locator('#btn-start').waitFor({state:'visible'});await host.locator('#btn-start').click();}
    await open();assert.equal(await host.locator('#expedition').isVisible(),true);
    if(embedded){const frame=await page.locator('#gameViewer').boundingBox(),toolbar=await page.locator('.theater-toolbar').boundingBox();assert.ok(frame.y>=toolbar.y+toolbar.height-.5&&frame.y+frame.height<=height+.5,'game iframe stays below the real Hub controls and inside the phone viewport');}
    assert.equal(await host.locator('#title-screen [data-screen-record]').count(),0);
    for(let step=0;step<6;step++){await introductionLayout(host);assert.equal(await host.locator('#story-progress').innerText(),`${step+1} / 6`);await host.locator('#story-next').click();}
    assert.equal(await host.locator('#camp').isVisible(),true);
    for(let step=0;step<3;step++){
      await introductionLayout(host);assert.equal(await host.locator('#story-progress').innerText(),`${step+1} / 3`);
      assert.equal(await host.locator('#camp-gold').innerText(),'90','explanation never purchases troops');
      if(step===1){const old=await host.locator('#story-dialogue').innerText();await host.evaluate(lang=>ToenowI18n.setLanguage(lang==='en'?'zh-Hant':'en'),language);assert.notEqual(await host.locator('#story-dialogue').innerText(),old);await host.evaluate(lang=>ToenowI18n.setLanguage(lang),language);await host.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());await host.locator('#resume').click();assert.equal(await host.locator('#story-progress').innerText(),'2 / 3');}
      if(step===1)await page.screenshot({path:path.join(os.tmpdir(),`toenow-clear-guide-${width}-${height}-${language}-${embedded}.png`)});
      await host.locator('#story-next').click();
    }
    assert.equal(await host.locator('#opening-story').isVisible(),false);assert.equal(await host.locator('#camp').isVisible(),true);assert.equal(await host.locator('dialog[open]').count(),0);
    for(const kind of ['beaver','fox','squirrel']){await host.locator(`[data-building="${kind}"]`).click();await buildingLayout(host);if(kind==='beaver'){await host.locator('[data-recruit="beaver"][data-amount="1"]').click();assert.equal(await host.locator('#camp-gold').innerText(),'70');assert.equal(await host.locator('[data-upgrade="beaver"]').isDisabled(),true);}await host.locator('#camp-dialog-close').click();}
    if(width===1280){await host.locator('#camp-exit').click();await host.locator('[data-location="timber"]').click();await host.locator('[data-explore="timber"]').click();await host.locator('[data-claim="timber"][data-choice="wood"]').click();await host.locator('#location-close').click();await host.locator('[data-location="home"]').click();await host.locator('[data-enter-camp]').click();await host.locator('[data-building="beaver"]').click();await host.locator('[data-upgrade="beaver"]').click();assert.equal(await host.locator('#camp-wood').innerText(),'35','normal training spends real wood after supplies are gathered');await buildingLayout(host);await host.locator('#camp-dialog-close').click();}
    await host.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());assert.equal(await host.locator('#opening-story').isVisible(),false,'completed introduction does not repeat on restart');
    await open();assert.equal(await host.locator('#opening-story').isVisible(),false,'completion survives reload and actual Hub re-entry');
    // Skip is remembered, and interrupted sessions resume rather than restart.
    await host.evaluate(()=>{localStorage.removeItem(AnimalOpeningStory.KEY);ToenowGameSDK.getInstance('animal-siege').restart();});await host.locator('#story-skip').click();
    await open();assert.equal(await host.locator('#opening-story').isVisible(),false,'skipped introduction stays skipped');
    await host.evaluate(()=>{localStorage.removeItem(AnimalOpeningStory.KEY);ToenowGameSDK.getInstance('animal-siege').restart();});
    for(let step=0;step<7;step++)await host.locator('#story-next').click();
    await open();assert.equal(await host.locator('#camp').isVisible(),true);assert.equal(await host.locator('#story-progress').innerText(),'2 / 3','interrupted tour resumes at the last camp explanation');await introductionLayout(host);await host.locator('#story-skip').click();
    await host.locator('#camp-exit').click();await host.locator('[data-location="acorn"]').click();await host.locator('[data-attack="acorn"]').click();assert.equal(await host.locator('#battle').getAttribute('data-lesson'),'true','battle instruction remains first-time only');await host.locator('#battle-coach-skip').click();
    await host.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').restart());assert.equal(await host.locator('#opening-story').isVisible(),false);await host.locator('[data-location="acorn"]').click();await host.locator('[data-attack="acorn"]').click();assert.equal(await host.locator('#battle').getAttribute('data-lesson'),'false');
    assert.deepEqual(await host.evaluate(()=>[localStorage.getItem('animal_siege_best_score_v1'),localStorage.getItem('animal_siege_best_wave_v1')]),['17','2']);assert.deepEqual(errors,[]);
    console.log(`PASS clear guide ${width}x${height} ${language} ${embedded?'actual Hub':'standalone'}: separate explanation/buildings, three building layouts, persistent completion/skip/resume, battle instructions`);await page.close();
  }}finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
