const fs=require('node:fs');const path=require('node:path');const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'capture-evidence.json'))).filter(e=>!process.env.PREPARE_GAMES||process.env.PREPARE_GAMES.split(',').includes(e.id));
 try{
  for(const entry of entries){
   const page=await browser.newPage();
   await page.goto('http://127.0.0.1:8776/artifacts/hub-preview-sample/');
   const raw='http://127.0.0.1:8776/artifacts/hub-preview-sample/raw/'+path.basename(entry.raw);
   await page.setContent(`<video src="${raw}" muted playsinline preload="auto"></video>`);
   await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
   const encoded=await page.evaluate(async()=>{
    const video=document.querySelector('video');video.pause();
    await new Promise(resolve=>{video.onseeked=resolve;video.currentTime=2.5;});
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=Math.round(video.videoHeight/video.videoWidth*960);
    const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const stream=canvas.captureStream(25);const chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:1600000});
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    const stopped=new Promise(resolve=>recorder.onstop=resolve);
    let draw=true;function frame(){if(!draw)return;ctx.drawImage(video,0,0,canvas.width,canvas.height);requestAnimationFrame(frame);}
    recorder.start();await video.play();frame();await new Promise(r=>setTimeout(r,8000));
    draw=false;video.pause();recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:'video/webm'});
    return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);});
   });
   const encodedPath=path.join(__dirname,'raw',entry.id+'-encoded.webm');
   fs.writeFileSync(encodedPath,Buffer.from(encoded,'base64'));
   require('node:child_process').execFileSync(path.join(process.env.LOCALAPPDATA,'ms-playwright/ffmpeg-1013/ffmpeg-win64.exe'),['-y','-hide_banner','-loglevel','error','-i',encodedPath,'-an','-c:v','copy',path.join(__dirname,entry.id+'.webm')]);
   console.log(entry.id,fs.statSync(path.join(__dirname,entry.id+'.webm')).size,'bytes');await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
