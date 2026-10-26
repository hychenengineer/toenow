/* Technical image encoding only. Generated originals are never modified. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const SPECIES=['panda','rabbit','otter','beaver','squirrel','fox','penguin','owl','raccoon','elephant'];
function loadSharp(){
 try{return require('sharp');}catch(error){
  const bundled='C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp';
  if(fs.existsSync(bundled))return require(bundled);
  throw Error('sharp is required. Set NODE_PATH to the bundled workspace Node packages.');
 }
}
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function readProvenance(file,species,level){
 const p=JSON.parse(fs.readFileSync(file,'utf8'));
 if(p.method!=='built-in image_gen'||p.species!==species||p.level!==level||typeof p.prompt!=='string'||p.prompt.length<200||typeof p.original!=='string'||!p.original.length)throw Error(`Invalid image generation provenance: ${file}`);
 return p;
}
async function imageInfo(sharp,bytes,label){
 const meta=await sharp(bytes).metadata();
 if(!meta.hasAlpha)throw Error(`${label}: a true alpha channel is required`);
 const stats=await sharp(bytes).stats();
 const alpha=stats.channels[3];
 if(!alpha||alpha.min!==0||alpha.max!==255)throw Error(`${label}: alpha must contain fully transparent and fully opaque pixels`);
 return {size:[meta.width,meta.height],alpha:{min:alpha.min,max:alpha.max}};
}
async function prepare({root=path.resolve(__dirname,'..'),partial=false}={}){
 root=path.resolve(root);
 const folder=path.join(root,'assets/animal-island');
 const expected=SPECIES.flatMap(species=>Array.from({length:5},(_,i)=>({species,level:i+1,key:`${species}-level${i+1}`})));
 const missing=expected.filter(e=>!fs.existsSync(path.join(folder,'sources',e.key+'.png'))||!fs.existsSync(path.join(folder,'sources',e.key+'.provenance.json')));
 if(missing.length&&!partial)throw Error(`Missing ${missing.length} of 50 generated PNG/provenance pairs: ${missing.map(e=>e.key).join(', ')}`);
 const sharp=loadSharp();const assets=[];const sourceHashes=new Set(),pixelHashes=new Set(),runtimeHashes=new Set();
 for(const entry of expected){
  if(missing.includes(entry))continue;
  const source=`assets/animal-island/sources/${entry.key}.png`;
  const provenance=`assets/animal-island/sources/${entry.key}.provenance.json`;
  const runtime=`assets/animal-island/${entry.key}.webp`;
  readProvenance(path.join(root,provenance),entry.species,entry.level);
  const original=fs.readFileSync(path.join(root,source));
  const sourceSha256=sha(original);
  if(sourceHashes.has(sourceSha256))throw Error(`Duplicate generated source: ${entry.key}`);
  sourceHashes.add(sourceSha256);
  const sourceInfo=await imageInfo(sharp,original,source);
  const pixels=await sharp(original).ensureAlpha().raw().toBuffer();
  const pixelHash=sha(Buffer.concat([Buffer.from(sourceInfo.size.join('x')),pixels]));
  if(pixelHashes.has(pixelHash))throw Error(`Duplicate source pixels: ${entry.key}`);
  pixelHashes.add(pixelHash);
  const encoded=await sharp(original).resize({width:480,height:480,fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:100,effort:5}).toBuffer();
  const runtimeInfo=await imageInfo(sharp,encoded,runtime);
  const runtimeSha256=sha(encoded);
  if(runtimeHashes.has(runtimeSha256))throw Error(`Duplicate runtime texture: ${entry.key}`);
  runtimeHashes.add(runtimeSha256);
  fs.writeFileSync(path.join(root,runtime),encoded);
  // Verify the read-only source contract after encoding.
  if(sha(fs.readFileSync(path.join(root,source)))!==sourceSha256)throw Error(`Source changed during encoding: ${source}`);
  assets.push({species:entry.species,level:entry.level,source,runtime,provenance,sourceSha256,runtimeSha256,sourcePixelSha256:pixelHash,sourceSize:sourceInfo.size,runtimeSize:runtimeInfo.size,sourceAlpha:sourceInfo.alpha,runtimeAlpha:runtimeInfo.alpha,sourceBytes:original.length,runtimeBytes:encoded.length});
 }
 const manifest={schemaVersion:1,method:'built-in image_gen',encoding:'sharp WebP quality 88, alphaQuality 100, max 480px; original PNG bytes preserved',partial:assets.length!==50,count:assets.length,expectedCount:50,unique:sourceHashes.size,sourceBytes:assets.reduce((s,e)=>s+e.sourceBytes,0),runtimeBytes:assets.reduce((s,e)=>s+e.runtimeBytes,0),missing:missing.map(e=>e.key),assets};
 fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
if(require.main===module){
 const args=process.argv.slice(2);const invalid=args.filter(a=>a!=='--partial');
 if(invalid.length){console.error('Usage: node tools/prepare-animal-island-art.cjs [--partial]');process.exitCode=1;}
 else prepare({partial:args.includes('--partial')}).then(m=>console.log(`${m.partial?'PARTIAL':'PASS'}: ${m.count}/50 unique landmarks; ${m.sourceBytes} source bytes -> ${m.runtimeBytes} runtime bytes; originals preserved.`)).catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={prepare,loadSharp,SPECIES};
