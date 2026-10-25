// Lossy WebP runtime encoding only; generated PNG originals remain byte-for-byte intact.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadSharp}=require('./prepare-animal-island-art.cjs');
const {THEMES}=require('../shared/toenow-animals.js');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
(async()=>{
 const sharp=loadSharp(),root=path.resolve(__dirname,'..'),assets=[];
 for(const t of Object.values(THEMES)){
  const source=`assets/animal-island/sources/${t.species}-character.png`,runtime=`assets/animal-island/${t.species}-character.webp`;
  const sourceBytes=fs.readFileSync(path.join(root,source)),meta=await sharp(sourceBytes).metadata(),stats=await sharp(sourceBytes).stats();
  if(!meta.hasAlpha||stats.channels[3].min!==0||stats.channels[3].max!==255)throw Error('Character requires true alpha: '+t.species);
  const bytes=await sharp(sourceBytes).resize({width:320,height:320,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer();
  fs.writeFileSync(path.join(root,runtime),bytes);
  if(sha(fs.readFileSync(path.join(root,source)))!==sha(sourceBytes))throw Error('Source changed');
  assets.push({species:t.species,source,runtime,sourceSize:[meta.width,meta.height],sourceSha256:sha(sourceBytes),runtimeSha256:sha(bytes),sourceBytes:sourceBytes.length,runtimeBytes:bytes.length,provenance:source.replace('.png','.provenance.json')});
 }
 fs.writeFileSync(path.join(root,'assets/animal-island/characters.json'),JSON.stringify({method:'built-in image_gen',count:assets.length,assets},null,2)+'\n');
 console.log('PASS: ten alpha-preserving character sprites encoded; original PNGs preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
