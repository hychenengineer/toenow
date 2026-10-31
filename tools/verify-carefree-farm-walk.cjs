const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),F=require('../games/carefree-farm/model.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774',out='artifacts/carefree-farm/walk-fix';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 const state=F.create();state.level=5;state.coins=10000;state.plots=Array(15).fill(null);state.unlocked=Object.keys(F.CROPS);for(const species of ['horse','cow','alpaca','llama'])assert(F.act(state,{type:'buyAnimal',species}).ok);state.animals.forEach(a=>a.growth=3);
 await page.goto(base+'/games/carefree-farm/');await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:F.KEY,state});await page.reload();await page.locator('#btn-start').click();await page.locator('#tab-pasture').click();await page.mouse.move(0,0);
 const seen=Array.from({length:20},()=>new Set()),transforms=()=>page.locator('[data-leg]').evaluateAll(legs=>legs.map(l=>l.getAttribute('transform')));
 assert.equal(await page.locator('[data-leg]').count(),20);
 for(let step=0;step<100;step++){await page.clock.runFor(100);const values=await transforms();values.forEach((v,i)=>{const angle=Number(v.match(/rotate\(([-\d.]+)/)[1]);assert(Math.abs(angle)<=3.5);seen[i].add(angle);});if(seen.every(s=>s.size>3))break;}
 seen.forEach((s,i)=>assert(s.size>3,'leg '+i+' must move independently'));for(let i=0;i<5;i++){const legs=await page.locator('[data-animal="'+i+'"] [data-leg]').evaluateAll(ls=>ls.map(l=>l.dataset.leg));assert.deepEqual(legs.sort(),['front-left','front-right','hind-left','hind-right']);}
 await page.screenshot({path:out+'/pasture.png',fullPage:true});await page.locator('[data-open="orders"]').click();const before=await transforms();await page.clock.runFor(1000);assert.deepEqual(await transforms(),before);await page.locator('#panel-close').click();await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(100);assert((await transforms()).every(t=>t.startsWith('rotate(0.000 ')));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({species:5,independentlyMovingLegs:20,maxAngle:3.5,modalPaused:true,reducedMotionStill:true,errors},null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
