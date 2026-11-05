const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base='http://127.0.0.1:8776/artifacts/hub-preview-sample/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[],checks=[],media=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  for(const id of ['animal-rescue-train','number-pop','block-match']){
   await page.goto(base);
   await page.setContent(`<video src="${base+id}.webm" muted playsinline preload="auto"></video>`);
   await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
   const dimensions=await page.evaluate(async time=>{const v=document.querySelector('video');v.pause();await new Promise(r=>{v.onseeked=r;v.currentTime=time;});return{width:v.videoWidth,height:v.videoHeight,duration:v.duration};},id==='number-pop'?2.5:.8);
   assert.ok(dimensions.duration>=7&&dimensions.duration<=10,id+' clip duration');
   media.push({id,...dimensions,bytes:fs.statSync(path.join(__dirname,id+'.webm')).size});
   await page.setViewportSize({width:dimensions.width,height:dimensions.height});
   await page.evaluate(()=>{document.body.style.cssText='margin:0;background:#080b12';document.querySelector('video').style.cssText='display:block;width:100vw;height:100vh;object-fit:contain';document.querySelector('video').removeAttribute('controls');});
   await page.locator('video').screenshot({path:path.join(__dirname,id+'-poster.png')});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base);
  assert.equal(await page.locator('.tile').count(),3);checks.push('three authentic game tiles');
  assert.equal(await page.locator('.tile video[src]').count(),0);checks.push('no video sources loaded before interaction');
  for(let i=0;i<3;i++){
   const tile=page.locator('.tile').nth(i);
   await tile.hover();await page.waitForTimeout(1200);
   assert.ok(await tile.evaluate(el=>el.classList.contains('playing')&&!el.querySelector('video').paused&&el.querySelector('video').currentTime>0));
   assert.equal(await page.locator('.tile.playing').count(),1);
   const frame=await tile.screenshot();
   const first=await tile.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(1800);
   assert.ok(await tile.locator('video').evaluate((v,t)=>v.currentTime>t,first));
   assert.ok(!frame.equals(await tile.screenshot()),'rendered video frames change: '+i);
   await page.mouse.move(10,10);await page.waitForTimeout(100);
   assert.ok(await tile.locator('video').evaluate(v=>v.paused));
   checks.push('hover plays, time advances, exit pauses: '+i);
  }
  await page.locator('.tile').first().focus();await page.waitForTimeout(900);
  assert.equal(await page.locator('.tile.playing').count(),1);checks.push('keyboard focus previews');
  await page.locator('.preview').first().click();await page.waitForTimeout(700);
  assert.ok(await page.locator('dialog').evaluate(d=>d.open));
  assert.ok(await page.locator('dialog video').evaluate(v=>!v.paused));
  await page.keyboard.press('Escape');assert.ok(await page.locator('dialog video').evaluate(v=>v.paused));checks.push('enlarged preview plays and Escape stops');
  await page.locator('h1').click();await page.mouse.move(10,10);
  await page.screenshot({path:path.join(__dirname,'desktop-preview.png'),fullPage:true});
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const phone=await touch.newPage();await phone.goto(base);
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await phone.locator('.preview').first().tap();await phone.waitForTimeout(700);
  assert.ok(await phone.locator('dialog video').evaluate(v=>!v.paused));
  await phone.locator('#close').tap();checks.push('390px no overflow and touch preview plays');
  await phone.screenshot({path:path.join(__dirname,'mobile-preview.png'),fullPage:true});
  for(const [index,id]of ['animal-rescue-train','number-pop','block-match'].entries())assert.equal(await page.locator('.tile').nth(index).getAttribute('href'),'../../games/'+id+'/');
  checks.push('all tiles link to actual standalone game');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify({checks,errors,media,physicalIPad:'NOT VERIFIED'},null,2));
  console.log(JSON.stringify({checks,errors,media},null,2));
  await touch.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
