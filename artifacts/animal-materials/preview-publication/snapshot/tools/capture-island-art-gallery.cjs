const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1100}});
  await page.goto('http://127.0.0.1:8765/artifacts/island-building-art/gallery.html'+(process.argv.includes('--masters')?'?level=5':''));
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  await page.screenshot({path:path.resolve(__dirname,'../artifacts/island-building-art/'+(process.argv.includes('--masters')?'masters.png':'all-stages.png')),fullPage:true});
 }finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}
})().then(()=>process.exit(0),error=>{console.error(error);process.exit(1)});
