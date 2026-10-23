const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1100,height:850}});
  const page=await context.newPage();
  // UI integration is local and must not depend on third-party SDK/font availability.
  await page.context().route('https://**',route=>route.abort());
  let html=fs.readFileSync('games/number-pop/index.html','utf8');
  const pos=html.lastIndexOf('})();');
  html=html.slice(0,pos)+'window.__finishMembershipTest=()=>{game.score=321;game.wave=13;triggerGameOver();};'+html.slice(pos);
  await context.route(/\/games\/number-pop\/(?:index\.html)?$/,route=>route.fulfill({contentType:'text/html',body:html}));
  await page.goto(base+'/?play=number-pop',{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#gameViewer');
  await frame.locator('#btn-start').click();
  await frame.locator('body').evaluate(()=>window.__finishMembershipTest());
  const invite=frame.locator('[data-membership-invite]');
  await invite.waitFor({state:'visible'});
  for(const lang of ['en','zh-Hant']) {
   await page.evaluate(l=>ToenowI18n.setLanguage(l),lang);
   await page.waitForTimeout(150);
   assert.equal(await invite.locator('[data-account-action="register"]').innerText(),lang==='en'?'Create Free Account':'免費註冊帳號');
   await frame.locator('.modal-card').screenshot({path:'artifacts/membership-result-'+lang+'.png'});
  }
  for(const action of ['register','signin']) {
   await invite.locator('[data-account-action="'+action+'"]').click();
   assert.equal(await page.locator('#authModal').getAttribute('aria-hidden'),'false');
   assert.ok(await page.locator('#authModal').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.width/2,r.height/2));}),'auth must appear above iframe');
   await page.locator('#closeAuthBtn').click();
   assert.equal(await frame.locator('[data-screen-field="score"]').innerText(),'321');
  }
  // Simulate account changes solely to verify presentation; no real sign-in is performed.
  await page.evaluate(()=>{window.__originalAccount=ToenowAccount;window.ToenowAccount={signedIn:true};window.dispatchEvent(new Event('toenow-auth-change'));});
  assert.equal(await invite.isVisible(),false);
  await page.evaluate(()=>{window.ToenowAccount=window.__originalAccount;window.dispatchEvent(new Event('toenow-auth-change'));});
  assert.equal(await invite.isVisible(),true);
  await page.setViewportSize({width:390,height:700});
  const card=frame.locator('.modal-card');
  const box=await card.boundingBox();assert.ok(box.x>=0&&box.width<=390);
  await invite.locator('[data-account-action="signin"]').click();
  await page.locator('#closeAuthBtn').click();
  await frame.locator('[data-screen-action="title"]').click();
  await frame.locator('#title-screen').waitFor({state:'visible'});
  // Standalone links open the existing Hub authentication screen.
  const standalone=await page.context().newPage();
  await standalone.goto(base+'/games/number-pop/',{waitUntil:'domcontentloaded'});
  await standalone.locator('#btn-start').click();
  await standalone.evaluate(()=>window.__finishMembershipTest());
  const popupPromise=standalone.waitForEvent('popup');
  await standalone.locator('[data-account-action="register"]').click({noWaitAfter:true});
  const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
  await popup.locator('#authModal.open').waitFor({state:'visible'});
  console.log('PASS: real Number Pop completion; bilingual invitation; both auth entries; modal stacking; preserved results; simulated signed-in/out visibility; mobile; return to title; standalone auth popup.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
