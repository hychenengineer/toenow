// Extend the HTTP-cache fixture with real clicks and a natural timeout; game state stays untouched.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.resolve(__dirname,'../../tools/verify-materials-warm-cache.cjs');
let source=fs.readFileSync(filename,'utf8');
const marker="console.log('PASS: pre-materials cached SDK cannot suppress collection');";
if(!source.includes(marker))throw Error('Warm-cache fixture marker missing');
source=source.replace(marker,`
await page.locator('#btn-start').click();
const skip=page.locator('[data-tutorial-skip]');if(await skip.isVisible())await skip.click();
await page.waitForFunction(()=>__QUANTUM_GAME__.getState().state==='playing'&&!ToenowTutorials.isActive('number-pop'));
const start=Date.now();const target=await page.evaluate(()=>{const state=__QUANTUM_GAME__.getState(),c=state.cores.filter(c=>!c.popped).sort((a,b)=>a.value-b.value)[0],r=document.getElementById('game-canvas').getBoundingClientRect();return {x:r.left+c.x*r.width/innerWidth,y:r.top+c.y*r.height/innerHeight};});
await page.mouse.click(target.x,target.y);assert((await page.evaluate(()=>__QUANTUM_GAME__.getState().score))>0);
await page.waitForFunction(()=>__QUANTUM_GAME__.getState().state==='gameover',null,{timeout:90000});
await page.waitForFunction(()=>ToenowMaterials.create({storage:localStorage}).snapshot().balances['number-pop']===4);
const collected=await page.evaluate(()=>({score:__QUANTUM_GAME__.getState().score,balance:ToenowMaterials.create({storage:localStorage}).snapshot().balances['number-pop'],receipt:document.querySelector('.toenow-material-reward').innerText}));
collected.elapsedMs=Date.now()-start;collected.cachedOldSdkFirst=true;fs.writeFileSync(path.join(output,'warm-real-collection.json'),JSON.stringify(collected,null,2));await page.screenshot({path:path.join(output,'warm-real-collection.png')});console.log('PASS '+JSON.stringify(collected));
`);
const loaded=new Module(filename,module);loaded.filename=filename;loaded.paths=Module._nodeModulePaths(path.dirname(filename));loaded._compile(source,filename);
