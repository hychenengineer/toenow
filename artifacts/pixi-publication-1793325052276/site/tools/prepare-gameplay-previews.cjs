// Derive Hub media from authentic browser recordings; preserve all source captures.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=path.join(root,'artifacts/hub-preview-sample'),out=path.join(root,'assets/gameplay-previews');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8778';
(async()=>{
 const recordings=JSON.parse(fs.readFileSync(path.join(source,'capture-evidence.json')));
 if(recordings.length!==10)throw Error('Expected ten actual game recordings');
 const entries=recordings.filter(e=>!process.env.PREPARE_GAMES||process.env.PREPARE_GAMES.split(',').includes(e.id));
 fs.mkdirSync(out,{recursive:true});const manifest=fs.existsSync(path.join(out,'provenance.json'))?JSON.parse(fs.readFileSync(path.join(out,'provenance.json'))):{};
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const e of entries){
  if(!e.actions||e.errors.length)throw Error('Recording was not verified: '+e.id);
  fs.copyFileSync(path.join(source,e.id+'.webm'),path.join(out,e.id+'.webm'));
  const page=await browser.newPage();
  await page.setContent(`<video muted playsinline preload="auto" src="${base}/assets/gameplay-previews/${e.id}.webm"></video>`);
  await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
  const posterTime=e.id==='flash-brain'?3.5:e.id==='number-pop'?2.5:e.id==='tap-match'?5:1;
  const media=await page.evaluate(async time=>{
   const video=document.querySelector('video');video.pause();
   await new Promise(resolve=>{video.onseeked=resolve;video.currentTime=time;});
   document.body.style.cssText='margin:0;background:#080b12';video.style.cssText='display:block;width:100vw;height:100vh;object-fit:contain';
   return{width:video.videoWidth,height:video.videoHeight,duration:video.duration};
  },posterTime);
  await page.setViewportSize({width:media.width,height:media.height});
  await page.locator('video').screenshot({path:path.join(out,e.id+'-poster.png')});
  manifest[e.id]={...media,posterTime,bytes:fs.statSync(path.join(out,e.id+'.webm')).size,sourceRaw:path.relative(root,e.raw).replaceAll('\\','/'),actualPointerActions:e.actions,finalScore:e.final.score??null,finalWave:e.final.wave??null};
  console.log(e.id,JSON.stringify(manifest[e.id]));await page.close();
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(manifest,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
