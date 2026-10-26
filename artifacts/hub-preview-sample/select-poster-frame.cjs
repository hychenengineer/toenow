const {chromium}=require('playwright');const path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const id of ['tap-match']){
  const page=await browser.newPage({viewport:{width:960,height:600}});await page.goto('http://127.0.0.1:8778');
  await page.setContent(`<video muted preload="auto" src="http://127.0.0.1:8778/assets/gameplay-previews/${id}.webm" style="display:block;width:960px;height:600px"></video>`);
  await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
  const best=await page.evaluate(async id=>{
   const v=document.querySelector('video'),canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;const c=canvas.getContext('2d',{willReadFrequently:true});
   let best={time:.5,count:0};
   for(const time of [.2,.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5]){
    await new Promise(resolve=>{v.onseeked=resolve;v.currentTime=time;});c.drawImage(v,0,0,960,600);
    const image=c.getImageData(id==='tap-match'?300:100,100,id==='tap-match'?360:760,440).data;let count=0;
    for(let i=0;i<image.length;i+=4)if(image[i+1]+image[i+2]>220&&Math.max(image[i],image[i+1],image[i+2])-Math.min(image[i],image[i+1],image[i+2])>65)count++;
    if(count>best.count)best={time,count};
   }return best;
  },id);
  await page.evaluate(async t=>{const v=document.querySelector('video');await new Promise(r=>{v.onseeked=r;v.currentTime=t;});document.body.style.margin='0';},best.time);
  await page.locator('video').screenshot({path:path.join(__dirname,'../../assets/gameplay-previews',id+'-poster.png')});
  console.log(id,best);await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
