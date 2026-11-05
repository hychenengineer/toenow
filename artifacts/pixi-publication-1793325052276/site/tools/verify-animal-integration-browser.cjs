// End-to-end integration: actual common title/start controls and image decoding.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const themes=require('../shared/toenow-animals.js').THEMES;
const config=require('../shared/toenow-screen-config.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8765';
const out=path.resolve(__dirname,'../artifacts/animal-island');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
 try{
  for(const [id,t] of Object.entries(themes)){
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/games/'+id+'/');
   const start=config[id]?.startId||'btn-start-game';
   await page.locator('#'+start).waitFor();
   await page.evaluate(()=>ToenowI18n.setLanguage('zh-Hant'));
   if(config[id])assert.equal(await page.locator('.unified-game-desc').innerText(),t.taskZh);
   await page.evaluate(()=>ToenowI18n.setLanguage('en'));
   if(config[id]){
    const art=page.locator('[data-screen-animal-art]');
    assert((await art.getAttribute('src')).includes(t.species+'-level1.webp'));
    await art.evaluate(img=>img.decode());
   }
   await page.locator('#'+start).click();
   await page.waitForTimeout(450);
   assert(await page.locator('.animal-companion').isHidden(),id+': active touch area is free of companion overlay');
   assert.equal(await page.evaluate(()=>document.elementFromPoint(55,810)?.closest('.animal-companion')!==null),false);
   await page.evaluate(async species=>{const img=new Image();img.src='../../assets/animal-island/'+species+'-character.webp';await img.decode();},t.species);
   assert.deepEqual(errors,[],id+': no page exceptions');
   results.push({id,language:'PASS',character:'PASS',guideDoesNotBlockInput:'PASS',errors});
   await page.screenshot({path:path.join(out,id+'-integrated-mobile.png')});
   console.log('PASS integration '+id);
   await page.close();
  }
  fs.writeFileSync(path.join(out,'integration-browser-results.json'),JSON.stringify({count:results.length,results},null,2));
 }finally{let timer;await Promise.race([browser.close(),new Promise(resolve=>{timer=setTimeout(resolve,5000);})]);clearTimeout(timer);}
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
