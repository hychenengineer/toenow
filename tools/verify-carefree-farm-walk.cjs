const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('../games/carefree-farm/model.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774',out='artifacts/carefree-farm/walk-fix';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 const state=F.create();state.level=5;state.coins=10000;state.plots=Array(15).fill(null);state.unlocked=Object.keys(F.CROPS);for(const species of ['pig','cow','alpaca','llama'])assert(F.act(state,{type:'buyAnimal',species}).ok);state.animals.forEach(a=>a.growth=3);
 await page.goto(base+'/games/carefree-farm/');await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:F.KEY,state});await page.reload();await page.locator('#btn-start').click();await page.locator('#tab-pasture').click();await page.mouse.move(0,0);
 const seen=Object.fromEntries(Object.keys(F.ANIMALS).map(s=>[s,new Set()]));
 for(let step=0;step<85;step++){await page.clock.runFor(200);for(const src of await page.locator('.roaming-animal img').evaluateAll(imgs=>imgs.map(i=>i.src))){const match=src.match(/walk-v2\/(\w+)-([12])\.webp/);if(match)seen[match[1]].add(match[2]);}if(Object.values(seen).every(poses=>poses.size===2))break;}
 for(const [species,poses]of Object.entries(seen))assert.equal(poses.size,2,species+' must alternate both corrected walk poses');
 const images=await page.locator('.roaming-animal img').evaluateAll(imgs=>imgs.map(i=>i.src));for(const src of images)await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();},src);
 await page.screenshot({path:out+'/pasture.png',fullPage:true});await page.locator('[data-open="orders"]').click();const before=await page.locator('.roaming-animal img').evaluateAll(imgs=>imgs.map(i=>i.src));await page.clock.runFor(1000);assert.deepEqual(await page.locator('.roaming-animal img').evaluateAll(imgs=>imgs.map(i=>i.src)),before);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({species:Object.keys(seen).length,posesPerSpecies:2,modalPaused:true,errors},null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
