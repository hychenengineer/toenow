const fs=require('node:fs'),path=require('node:path');
const {loadSharp}=require('./prepare-animal-island-art.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/animal-island');
(async()=>{
 const sharp=loadSharp(),manifest=require('../assets/animal-island/manifest.json');
 const species=require('./prepare-animal-island-art.cjs').SPECIES;
 for(let page=0;page<2;page++){
  const items=[];
  for(let row=0;row<5;row++){
   const animal=species[page*5+row];
   const label=Buffer.from(`<svg width="1100" height="35"><text x="15" y="24" font-family="sans-serif" font-size="18" fill="#345244">${animal.toUpperCase()} — LEVEL 1 / 2 / 3 / 4 / 5</text></svg>`);
   items.push({input:label,top:row*240,left:0});
   for(let level=1;level<=5;level++){
    const entry=manifest.assets.find(e=>e.species===animal&&e.level===level);
    const thumb=await sharp(path.join(root,entry.runtime)).resize(204,204,{fit:'contain',background:'#fffaf0'}).png().toBuffer();
    items.push({input:thumb,top:row*240+35,left:(level-1)*220+8});
   }
  }
  await sharp({create:{width:1100,height:1200,channels:4,background:'#fffaf0'}}).composite(items).png().toFile(path.join(out,`art-review-${page+1}.png`));
 }
 console.log('PASS: all fifty illustrations laid out in two inspection sheets.');
})().catch(e=>{console.error(e);process.exitCode=1;});
