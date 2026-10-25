/* Captures real browser rendering and input. No game state or saved records are mutated by hooks. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const out=path.join(root,'assets/animal-gameplay-previews'),rawDir=path.join(out,'recordings');
const config=require('../shared/toenow-screen-config.js');
const games=['animal-rescue-train','number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain'];
const selected=process.env.TOENOW_TEST_GAMES?process.env.TOENOW_TEST_GAMES.split(','):games;
const viewport={width:768,height:576};
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bounded=(p,ms,label)=>Promise.race([p,new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error(label+' timed out')),ms);t.unref()})]);
function ffmpegPath(){
 if(process.env.TOENOW_FFMPEG)return process.env.TOENOW_FFMPEG;
 const cache=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData/Local'),'ms-playwright');
 for(const dir of fs.readdirSync(cache).filter(d=>d.startsWith('ffmpeg-')).sort().reverse()){const exe=path.join(cache,dir,'ffmpeg-win64.exe');if(fs.existsSync(exe)){const decoders=execFileSync(exe,['-decoders'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],windowsHide:true});if(decoders.includes('codec vp8'))return exe;}}
 throw Error('Playwright bundled FFmpeg was not found. Set TOENOW_FFMPEG.');
}
async function act(page,id,log){
 const record=text=>log.push({action:text,atMs:Date.now()});
 if(id==='animal-rescue-train'){
  if(await page.locator('#acknowledge-last-animal').isVisible())await page.locator('#acknowledge-last-animal').click();
  await page.locator('[data-queue]:not(:disabled)').first().click();await page.locator('[data-car]:not(:disabled)').first().click();record('Selected queue head and boarded a legal carriage');
 }else if(id==='number-pop'){
  for(let i=0;i<1;i++){const c=await page.evaluate(()=>__QUANTUM_GAME__.getState().cores.filter(c=>!c.popped).sort((a,b)=>a.value-b.value)[0]);await page.mouse.click(c.x,c.y);record('Clicked lowest-value harvest basket '+c.label);await page.waitForTimeout(240);}
 }else if(id==='ball-track'){
  await page.waitForFunction(()=>__QUANTUM_SHELL__.getState().phase==='select',null,{timeout:22000});
  const c=await page.evaluate(()=>__QUANTUM_SHELL__.getState().shells.find(s=>s.hasCore));await page.mouse.click(c.x,c.y);record('Followed leaves and selected a remembered otter');
 }else if(id==='block-match'){
  const cells=await page.evaluate(()=>{const s=__CHIP_DEFRAG__.getState(),b=s.layout.leftBox,points=[];for(let r=0;r<s.board.activeGrid.length;r++)for(let c=0;c<s.board.activeGrid.length;c++)if(s.board.activeGrid[r][c]===2)points.push({x:b.x+b.pad+c*(b.cellSize+b.gap)+b.cellSize/2,y:b.y+b.pad+r*(b.cellSize+b.gap)+b.cellSize/2});return points;});
  for(const c of cells.slice(0,3)){await page.mouse.click(c.x,c.y);record('Removed an extra timber tile');await page.waitForTimeout(200);}
 }else if(id==='add-up'){
  const s=await page.evaluate(()=>__overclockReactor.getState());let ids=[];
  for(let mask=1;mask<1<<s.nodes.length;mask++){const nodes=s.nodes.filter((_,i)=>mask&(1<<i));if(nodes.length>=2&&nodes.reduce((sum,n)=>sum+n.value,0)===s.target){ids=nodes.map(n=>n.id);break;}}
  for(const n of ids){await page.keyboard.press('Digit'+n);record('Selected nut bag '+n+' for exact supply total '+s.target);await page.waitForTimeout(250);}
 }else if(id==='space-scale'){
  const key=await page.evaluate(()=>__captureScale.bodies.findIndex(b=>b.id===__captureScale.target)+1);await page.keyboard.press(String(key));record('Selected correct parcel by scale clues');
 }else if(id==='tap-match'){
  await page.locator('#btn-begin-wave').click();await page.waitForFunction(()=>__PENGUIN_POOL_STATE.phase==='PLAYING');
  await page.waitForFunction(()=>__PENGUIN_POOL_STATE.nodes.some(n=>n.status==='ACTIVE'&&n.isTarget),null,{timeout:12000});
  await page.screenshot({path:path.join(out,id+'-poster.png')});
  const c=await page.evaluate(()=>__PENGUIN_POOL_STATE.nodes.find(n=>n.status==='ACTIVE'&&n.isTarget));const b=await page.locator('#game-canvas').boundingBox();await page.mouse.click(b.x+c.x,b.y+c.y);record('Collected a matching picture card for Penguin');return true;
 }else if(id==='spot-quick'){
  await page.waitForFunction(()=>__OWL_OBSERVATION_STATE.mode==='ACTIVE');const n=await page.evaluate(()=>__OWL_OBSERVATION_STATE.candidates.findIndex(c=>c.correct));await page.locator('#candBtn'+n).click();record('Identified the correct specimen photo');
 }else if(id==='shadow-match'){
  const n=await page.evaluate(()=>__ECLIPSE_DRIFT__.getState().correctCardIndex);await page.locator('.dock-card-btn').nth(n).click();record('Selected the matching moving paper silhouette');
 }else if(id==='flash-brain'){
  await page.waitForFunction(()=>__SYNAPSE_STATE.phase==='PHASE_FLASH',null,{timeout:16000});
  await page.screenshot({path:path.join(out,id+'-poster.png')});
  await page.waitForFunction(()=>__SYNAPSE_STATE.phase==='PHASE_INPUT',null,{timeout:16000});
  const c=await page.evaluate(()=>__SYNAPSE_STATE.cells.find(c=>c.type==='TARGET'&&!c.tapped)),b=await page.locator('[data-testid="matrix-canvas"]').boundingBox();await page.mouse.click(b.x+c.screenX,b.y+c.screenY);record('Recalled a safe animal flowerbed');return true;
 }
}
async function run(){
 fs.mkdirSync(rawDir,{recursive:true});const ffmpeg=ffmpegPath();
 const reportPath=path.join(out,'verification.json');let report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):{method:'Playwright Edge recordVideo with actual production Start controls and input',viewport,results:[]};
 const server=await chromium.launchServer({channel:'msedge',headless:true});const browser=await chromium.connect(server.wsEndpoint());
 try{
 for(const id of selected){
  assert.ok(games.includes(id));console.log('CAPTURE',id);
  const context=await browser.newContext({viewport,recordVideo:{dir:path.join(os.tmpdir(),'toenow-animal-preview-recordings'),size:viewport},locale:'en-US'});
  const page=await context.newPage();page.setDefaultTimeout(15000);const video=page.video(),errors=[],actions=[];page.on('pageerror',e=>errors.push(e.message));
  if(id==='space-scale'){
   let html=fs.readFileSync(path.join(root,'games',id,'index.html'),'utf8'),i=html.lastIndexOf('})();');
   html=html.slice(0,i)+`Object.defineProperty(window,'__captureScale',{get:()=>({target:currentPuzzle.targetBodyId,bodies:currentPuzzle.bodies})});`+html.slice(i);
   await page.route('**/games/space-scale/',r=>r.fulfill({contentType:'text/html',body:html}));
  }
  const began=Date.now();await page.goto(base+'/games/'+id+'/',{waitUntil:'domcontentloaded'});
  if(id==='animal-rescue-train')await page.evaluate(()=>{document.documentElement.style.zoom='.6'});
  await page.locator('#'+(config[id]?.startId||'btn-start-game')).click();const started=Date.now();actions.push({action:'Clicked production Start control',atMs:started});
  await page.waitForTimeout(500);const posterTaken=await act(page,id,actions);const acted=Date.now();
  if(id==='animal-rescue-train')await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(200);if(!posterTaken)await page.screenshot({path:path.join(out,id+'-poster.png')});
  await page.waitForTimeout(Math.max(1200,7500-(Date.now()-started)));
  assert.deepEqual(errors,[],id+' page errors');
  await bounded(context.close(),20000,'recorded context close');const raw=path.join(rawDir,id+'.webm');await video.saveAs(raw);
  // Keep seven actual recorded seconds surrounding the input. No composited frames.
  const start=Math.max(0,(started-began)/1000,(acted-began)/1000-4.8);
  const file=path.join(out,id+'.webm');execFileSync(ffmpeg,['-y','-ss',String(start),'-i',raw,'-t','7','-an','-c:v','libvpx','-b:v','600k','-crf','22',file],{stdio:'pipe',timeout:45000,windowsHide:true});
  assert.ok(fs.statSync(file).size>1000);assert.ok(fs.statSync(path.join(out,id+'-poster.png')).size>1000);
  // A separate unrecorded browser decodes and seeks the final WebM file.
  const verify=await browser.newPage({viewport});await verify.goto(base+'/tools/animal-island-gallery.html',{waitUntil:'domcontentloaded'});
  const media=await verify.evaluate(async url=>{const v=document.createElement('video');v.muted=true;v.src=url;document.body.replaceChildren(v);await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(Error('Video decode error'));});if(!Number.isFinite(v.duration)){v.currentTime=1e10;await new Promise(res=>v.onseeked=res);}const duration=v.duration;v.currentTime=2;await new Promise((res,rej)=>{v.onseeked=res;v.onerror=()=>rej(Error('Video seek error'));});await v.play();await new Promise(r=>setTimeout(r,200));v.pause();return{duration,width:v.videoWidth,height:v.videoHeight,decodedTime:v.currentTime,readyState:v.readyState};},base+'/assets/animal-gameplay-previews/'+id+'.webm');
  await bounded(verify.close(),5000,'verification page close');assert.ok(media.duration>=5&&media.duration<=8.1);assert.equal(media.width,viewport.width);assert.equal(media.height,viewport.height);assert.ok(media.decodedTime>0.05);assert.ok(media.readyState>=2);
  const entry={id,status:'PASS',url:base+'/games/'+id+'/',startedAt:new Date(began).toISOString(),viewport,presentationZoom:id==='animal-rescue-train'?.6:1,actions:actions.map(a=>({...a,atSeconds:Number(((a.atMs-began)/1000).toFixed(3))})),trimStartSeconds:start,videoBytes:fs.statSync(file).size,posterBytes:fs.statSync(path.join(out,id+'-poster.png')).size,videoSha256:hash(file),posterSha256:hash(path.join(out,id+'-poster.png')),originalRecording:'recordings/'+id+'.webm',originalRecordingSha256:hash(raw),media,errors,storageIsolation:'new nonpersistent browser context; no production browser profile'};
  fs.writeFileSync(path.join(out,id+'.provenance.json'),JSON.stringify(entry,null,2)+'\n');report.results=report.results.filter(e=>e.id!==id).concat(entry);report.count=report.results.length;fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log('PASS',id,media.duration.toFixed(2)+'s',entry.videoBytes+' bytes');
 }
 }finally{
  try{await bounded(browser.close(),6000,'browser close');}catch{}
  if(server.process()?.exitCode===null){try{execFileSync('taskkill',['/PID',String(server.process().pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{}}
 }
}
run().then(()=>process.exit(0),e=>{console.error(e);process.exit(1)});
