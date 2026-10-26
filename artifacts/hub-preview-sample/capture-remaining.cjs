const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const catalog=require('../../shared/toenow-screen-config.js');
const ids=(process.env.CAPTURE_GAMES||'ball-track,add-up,space-scale,tap-match,spot-quick,shadow-match,flash-brain').split(',');
const base='http://127.0.0.1:8776',out=__dirname;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function instrument(page,id){
 if(id==='flash-brain'){
  let js=fs.readFileSync(path.join(out,'../../games/flash-brain/assets/index-cr-6j3L1.js'),'utf8');
  const marker='},x=(e,t)=>{let n=p.current';if(!js.includes(marker))throw Error('Flash inspection location changed');
  js=js.replace(marker,'};window.__captureRead=()=>JSON.parse(JSON.stringify(p.current));let x=(e,t)=>{let n=p.current');
  await page.route('**/assets/index-cr-6j3L1.js',r=>r.fulfill({contentType:'text/javascript',body:js}));
 }else if(['space-scale','tap-match','spot-quick'].includes(id)){
  let html=fs.readFileSync(path.join(out,'../../games',id,'index.html'),'utf8');
  const extra=id==='space-scale'?'({mode:gameState,wave,score,puzzle:currentPuzzle,targets:renderedBodyTargets})':'state';
  const end=html.lastIndexOf('})();');if(end<0)throw Error('Inspection location changed');
  html=html.slice(0,end)+`window.__captureRead=()=>JSON.parse(JSON.stringify(${extra}));`+html.slice(end);
  await page.route('**/games/'+id+'/',r=>r.fulfill({contentType:'text/html',body:html}));
 }
}
function readState(id){
 if(window.__captureRead)return window.__captureRead();
 return (id==='ball-track'?window.__QUANTUM_SHELL__:id==='add-up'?window.__overclockReactor:window.__ECLIPSE_DRIFT__).getState();
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 let evidence=JSON.parse(fs.readFileSync(path.join(out,'capture-evidence.json')));
 try{for(const id of ids){
  const size={width:1280,height:800};
  const context=await browser.newContext({viewport:size,recordVideo:{dir:path.join(out,'raw'),size},locale:'en-US'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await instrument(page,id);await page.goto(base+'/games/'+id+'/');
  await page.evaluate(()=>window.ToenowI18n?.setLanguage('en'));
  await page.locator('#'+catalog[id].startId).click();
  if(id==='tap-match')await page.locator('#btn-begin-wave').click();
  const started=Date.now();let actions=0;let initial=await page.evaluate(readState,id);
  if(process.env.CAPTURE_INSPECT){console.log(id,JSON.stringify(initial));await page.screenshot({path:path.join(out,'raw',id+'-inspection.png')});await context.close();continue;}
  while(Date.now()-started<14000){
   const s=await page.evaluate(readState,id);let target=null;
   if(id==='ball-track'&&s.phase==='select')target=s.shells.filter(n=>n.hasCore&&!n.picked).sort((a,b)=>a.targetOrder-b.targetOrder)[0];
   if(id==='space-scale')target=s.targets.find(t=>t.bodyId===s.puzzle.targetBodyId);
   if(id==='add-up'){
    const nodes=s.nodes.filter(n=>!n.selected&&n.op==='add'),needed=s.target-s.selectedSum;
    for(let mask=1;mask<(1<<nodes.length);mask++){
     const chosen=nodes.filter((_,i)=>mask&(1<<i));
     if(chosen.reduce((sum,n)=>sum+n.value,0)===needed){target=chosen[0];break;}
    }
   }
   if(id==='flash-brain'&&['PHASE_RETENTION','PHASE_INPUT'].includes(s.phase)){
    const cell=s.waveState.cells.find(c=>!c.tapped&&c.type==='TARGET');
    const geo=cell&&s.cellScreenGeometries.find(g=>g.id===cell.id);
    if(geo)target={x:geo.centerX,y:geo.centerY};
   }
   if(id==='tap-match'&&s.phase==='PLAYING')target=s.nodes.find(n=>n.status==='ACTIVE'&&n.isTarget);
   if(id==='spot-quick'&&s.mode==='ACTIVE'&&s.elapsedInWave>1.8){
    const c=s.candidates.find(c=>c.correct);if(c?.rect)target={x:c.rect.x+c.rect.w/2,y:c.rect.y+c.rect.h/2};
   }
   if(id==='shadow-match'&&s.mode==='playing'){
    await sleep(800);
    await page.locator(`[data-card-index="${s.correctCardIndex}"]`).click();actions++;await sleep(1000);
   }
   if(target&&Number.isFinite(target.x)&&Number.isFinite(target.y)){
    if(id==='space-scale')await sleep(1200);
    const canvas=await page.locator('canvas').first().boundingBox();
    await page.mouse.click(target.x+(canvas?.x||0),target.y+(canvas?.y||0));actions++;await sleep(650);
   }
   await sleep(150);
  }
  const final=await page.evaluate(readState,id),raw=await page.video().path();await context.close();
  evidence=evidence.filter(e=>e.id!==id);evidence.push({id,raw,captureStart:2.5,duration:14,actions,errors,initial,final});
  fs.writeFileSync(path.join(out,'capture-evidence.json'),JSON.stringify(evidence,null,2));
  console.log(JSON.stringify({id,actions,errors,score:final.score,phase:final.phase,wave:final.wave}));
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
