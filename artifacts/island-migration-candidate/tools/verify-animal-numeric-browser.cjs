/* Real numeric gameplay checks. Space Scale receives only a read-only state hook. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const output=process.env.TOENOW_SCREENSHOT_DIR||path.join(require('node:os').tmpdir(),'toenow-animal-numeric');
async function run(){
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const width of [1100,390])for(const id of ['number-pop','add-up','space-scale']){
   const page=await browser.newPage({viewport:{width,height:850}});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(id==='space-scale'){
    let html=fs.readFileSync(path.join(root,'games',id,'index.html'),'utf8');const index=html.lastIndexOf('})();');
    assert.ok(index>0);html=html.slice(0,index)+`window.__numericScale={state:()=>({wave,score,shields,target:currentPuzzle.targetBodyId,bodies:currentPuzzle.bodies})};`+html.slice(index);
    await page.route('**/games/space-scale/',r=>r.fulfill({contentType:'text/html',body:html}));
   }
   await page.goto(base+'/games/'+id+'/');
   await page.locator(id==='add-up'?'#btn-start-game':'#btn-start').click();
   await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>typeof window.ToenowAnimals?.drawAnimal),'function','Production animal helper loaded');
   if(id==='number-pop'){
    const s=await page.evaluate(()=>__QUANTUM_GAME__.getState());
    await page.evaluate(()=>__QUANTUM_GAME__.clickHighestCoreForMistake());
    assert.equal((await page.evaluate(()=>__QUANTUM_GAME__.getState())).combo,0);
    await page.evaluate(()=>__QUANTUM_GAME__.popLowestCore());
    assert.ok((await page.evaluate(()=>__QUANTUM_GAME__.getState())).score>s.score);
   }
   if(id==='add-up'){
    let s=await page.evaluate(()=>__overclockReactor.getState());let ids;
    for(let mask=1;mask<1<<s.nodes.length;mask++){
     const ns=s.nodes.filter((_,i)=>mask&(1<<i));
     if(ns.length>=2&&ns.reduce((a,n)=>a+n.value,0)===s.target){ids=ns.map(n=>n.id);break;}
    }
    assert.ok(ids,'A valid supply order exists');for(const n of ids)await page.keyboard.press('Digit'+n);
    assert.equal((await page.evaluate(()=>__overclockReactor.getState())).wave,s.wave+1);
    s=await page.evaluate(()=>__overclockReactor.getState());
    let sum=0;for(const n of [...s.nodes].sort((a,b)=>b.value-a.value)){
     if(sum+n.value===s.target)continue;
     await page.keyboard.press('Digit'+n.id);sum+=n.value;if(sum>s.target)break;
    }
    assert.ok(sum>s.target,'Deliberate overshoot was entered');
    const wrong=await page.evaluate(()=>__overclockReactor.getState());
    assert.equal(wrong.selectedSum,0,'Overshoot clears chosen bags');assert.equal(wrong.wave,s.wave,'Overshoot does not advance the order');
   }
   if(id==='space-scale'){
    const s=await page.evaluate(()=>__numericScale.state());
    await page.keyboard.press(String(s.bodies.findIndex(b=>b.id!==s.target)+1));
    assert.equal((await page.evaluate(()=>__numericScale.state())).shields,s.shields-1);
    await page.keyboard.press(String(s.bodies.findIndex(b=>b.id===s.target)+1));
    assert.ok((await page.evaluate(()=>__numericScale.state())).score>s.score);
   }
   await page.waitForTimeout(50);assert.deepEqual(errors,[]);
   await page.screenshot({path:path.join(output,`animal-${id}-${width}.png`)});
   console.log('PASS',id,width,'correct/wrong input, render, no page errors');await page.close();
  }
 }finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}
 console.log('Screenshots:',output);
}
run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
