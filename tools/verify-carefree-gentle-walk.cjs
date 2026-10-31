const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const F = require('../games/carefree-farm/model.js');
const out = 'artifacts/carefree-farm/gentle-walk';
fs.mkdirSync(out, { recursive: true });
(async () => {
 const browser = await chromium.launch({channel:'msedge'});
 try {
  const page = await browser.newPage({viewport:{width:575,height:1100},deviceScaleFactor:2});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  await page.goto((process.env.TOENOW_TEST_URL || 'http://127.0.0.1:8774')+'/games/carefree-farm/');
  const state=F.create(); state.level=5; state.coins=10000; state.plots=Array(15).fill(null); state.unlocked=Object.keys(F.CROPS);
  for(const species of ['horse','cow','alpaca','llama']) assert(F.act(state,{type:'buyAnimal',species}).ok);
  state.animals.forEach(a=>a.growth=3);
  await page.evaluate(({state,key})=>localStorage.setItem(key,JSON.stringify(state)),{state,key:F.KEY});
  await page.reload(); await page.locator('#btn-start').click(); await page.locator('#tab-pasture').click();
  await page.evaluate(()=>CarefreePasture.ready); await page.mouse.move(0,0);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  let previous=await page.evaluate(()=>CarefreePasture.inspect()); let maxSpeed=0; assert.equal(previous.animals.length,5);
  for(let frame=0;frame<12;frame++) {
   await page.clock.runFor(1000);
   const current=await page.evaluate(()=>CarefreePasture.inspect());
   current.animals.forEach((a,i)=>{maxSpeed=Math.max(maxSpeed,Math.abs(a.x-previous.animals[i].x)/1);});
   previous=current;
   for(let index=0;index<5;index++) {
    const components=await page.evaluate(index=>{const canvas=document.querySelector('.pasture-canvas'),a=document.querySelector(`[data-animal="${index}"]`).getBoundingClientRect(),c=canvas.getBoundingClientRect(),scale=canvas.width/c.width,w=Math.round(130*scale),h=Math.round(110*scale),off=document.createElement('canvas');off.width=w;off.height=h;const ctx=off.getContext('2d');ctx.drawImage(canvas,(a.left-c.left)*scale,(a.top-c.top)*scale,w,h,0,0,w,h);const data=ctx.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),parts=[];for(let i=0;i<seen.length;i++){if(seen[i]||data[i*4+3]<100)continue;let q=[i],n=0;seen[i]=1;while(n<q.length){const k=q[n++],x=k%w,y=Math.floor(k/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(x+dx<0||x+dx>=w||y+dy<0||y+dy>=h)continue;const next=(y+dy)*w+x+dx;if(!seen[next]&&data[next*4+3]>=100){seen[next]=1;q.push(next);}}}if(q.length>25)parts.push(q.length);}return parts.sort((a,b)=>b-a);},index);
    assert.equal(components.length,1,current.animals[index].species+' disconnected at frame '+frame+': '+components);
   }
   if(frame===1) await page.locator('#animals').screenshot({path:out+'/pasture.png'});
  }
  assert(maxSpeed>0,'Animals must still stroll');
  assert(maxSpeed<=3.1,'Gentle stroll must stay below 3.1 CSS pixels/sec, got '+maxSpeed);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({maxSpeed,errors}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
