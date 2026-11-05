const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('../shared/toenow-screen-config.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
const out=`artifacts/light-hud/run-${Date.now()}`;fs.mkdirSync(out,{recursive:true});
console.log('Screenshots: '+out);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 let checks=0;
 try {
  for(const width of [390,1100,320]) for(const lang of ['en','zh-Hant']) for(const [id,c] of Object.entries(catalog).filter(([id])=>!process.env.TOENOW_TEST_GAMES||process.env.TOENOW_TEST_GAMES.split(',').includes(id))) {
   console.log(`CHECK ${id} ${width} ${lang}`);
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.route('https://**',route=>route.abort());
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(({id,lang})=>{
    localStorage.setItem('toenow_tutorial_'+id+'_v2','completed');
    localStorage.setItem('toenow_language_v1',lang);
   },{id,lang});
   await page.goto(base+'/games/'+id+'/',{waitUntil:'domcontentloaded'});
   await page.locator('#'+c.startId).click();
   if(id==='tap-match') await page.locator('#btn-begin-wave').click();
   const hud=page.locator('.island-live-hud');await hud.waitFor({state:'visible'});
   await page.waitForTimeout(180);
   assert.equal(await hud.locator('.island-hud-metric').count(),['add-up','ball-track'].includes(id)?2:3,id+' metrics');
   const geometry=await hud.evaluate(el=>{
    const r=el.getBoundingClientRect(),css=getComputedStyle(el);
    return {left:r.left,right:r.right,scroll:el.scrollWidth,client:el.clientWidth,bg:css.backgroundColor,
     boxes:[...el.querySelectorAll('.island-hud-value,.island-hud-controls button')].map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};})};
   });
   assert.ok(geometry.left>=0&&geometry.right<=width+.5&&geometry.scroll<=geometry.client,id+' overflow '+JSON.stringify(geometry));
   assert.ok(geometry.bg.match(/\d+/g).slice(0,3).every(n=>Number(n)>210),id+' light paper');
   const controls=hud.locator('.island-hud-controls button');
   assert.ok(await controls.count()>=3,id+' controls preserved');
   for(const b of await controls.all()) {const box=await b.boundingBox();assert.ok(box.width>=44&&box.height>=44,id+' touch controls');}
   for(let i=0;i<geometry.boxes.length;i++) for(let j=i+1;j<geometry.boxes.length;j++) {
    const a=geometry.boxes[i],b=geometry.boxes[j];assert.ok(Math.min(a.right,b.right)-Math.max(a.left,b.left)<=1||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<=1,id+' overlapping values/controls');
   }
   const labels=await hud.locator('.island-hud-label').allTextContents();
   assert.deepEqual(labels,lang==='en'?(['add-up','ball-track'].includes(id)?['TIME','SCORE']:['TIME','SCORE','COMBO']):(['add-up','ball-track'].includes(id)?['時間','分數']:['時間','分數','連擊']),id+' labels');
   if(width!==320) await page.screenshot({path:`${out}/${id}-${width}-${lang}.png`});
   if(width===390&&lang==='en') {
    const audio=hud.getByRole('button',{name:/audio|mute/i});
    const before=await audio.evaluate(e=>e.outerHTML);await audio.click();
    console.log(id+' audio clicked');
    assert.notEqual(await audio.evaluate(e=>e.outerHTML),before,id+' audio toggle');
    const pause=hud.getByRole('button',{name:/pause/i});await pause.click();
    console.log(id+' pause clicked');
    await page.locator('.unified-pause-screen:visible').waitFor();
    const resume=page.locator('.unified-pause-screen:visible').getByRole('button',{name:/resume|繼續/i});await resume.click();
    console.log(id+' resume clicked');
    await page.locator('.unified-pause-screen:visible').waitFor({state:'hidden'});
    const restart=hud.getByRole('button',{name:/restart/i});await restart.click();
   }
   assert.deepEqual(errors,[],id+' browser errors');
   console.log(`PASS ${id} ${width} ${lang}: clear light HUD, labels, controls and bounds`);checks++;await page.close();
  }
  console.log(JSON.stringify({checks,errors:0}));
 } catch(e) { console.error(e);throw e; } finally {await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
