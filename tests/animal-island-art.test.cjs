const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const species=['panda','rabbit','otter','beaver','squirrel','fox','penguin','owl','raccoon','elephant'];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('Animal island has fifty distinct transparent source/runtime images and authentic provenance',async()=>{
 const manifestPath=path.join(root,'assets/animal-island/manifest.json');
 assert.ok(fs.existsSync(manifestPath),'Run node tools/prepare-animal-island-art.cjs after all fifty images are generated');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 assert.equal(manifest.count,50);assert.equal(manifest.assets.length,50);assert.equal(manifest.partial,false);
 const {loadSharp}=require('../tools/prepare-animal-island-art.cjs');const sharp=loadSharp();
 const sourceHashes=new Set(),runtimeHashes=new Set(),keys=new Set();let sourceBytes=0,runtimeBytes=0;
 for(const entry of manifest.assets){
  assert.ok(species.includes(entry.species));assert.ok(Number.isInteger(entry.level)&&entry.level>=1&&entry.level<=5);
  const key=`${entry.species}-level${entry.level}`;assert.ok(!keys.has(key));keys.add(key);
  assert.equal(entry.source,`assets/animal-island/sources/${key}.png`);assert.equal(entry.runtime,`assets/animal-island/${key}.webp`);
  const source=fs.readFileSync(path.join(root,entry.source)),runtime=fs.readFileSync(path.join(root,entry.runtime));
  assert.equal(hash(source),entry.sourceSha256,'Source matches preserved generation bytes');assert.equal(hash(runtime),entry.runtimeSha256);
  sourceHashes.add(hash(source));runtimeHashes.add(hash(runtime));sourceBytes+=source.length;runtimeBytes+=runtime.length;
  assert.equal(source.length,entry.sourceBytes);assert.equal(runtime.length,entry.runtimeBytes);
  for(const [bytes,size,alpha] of [[source,entry.sourceSize,entry.sourceAlpha],[runtime,entry.runtimeSize,entry.runtimeAlpha]]){
   const meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
   assert.equal(meta.hasAlpha,true,`${key} has real alpha`);assert.deepEqual([meta.width,meta.height],size);
   assert.equal(stats.channels[3].min,0,`${key} includes fully transparent pixels`);assert.equal(stats.channels[3].max,255,`${key} includes opaque painting`);
   assert.deepEqual(alpha,{min:0,max:255});
  }
  assert.ok(entry.runtimeSize.every(n=>n<=480));assert.ok(entry.sourceSize.every(n=>n>=800));
  const provenance=JSON.parse(fs.readFileSync(path.join(root,entry.provenance),'utf8'));
  assert.equal(provenance.method,'built-in image_gen');assert.equal(provenance.species,entry.species);assert.equal(provenance.level,entry.level);
  assert.ok(provenance.prompt.length>200);assert.ok(typeof provenance.original==='string'&&provenance.original.length>5);
 }
 assert.equal(sourceHashes.size,50);assert.equal(runtimeHashes.size,50);assert.equal(manifest.unique,50);
 assert.equal(manifest.sourceBytes,sourceBytes);assert.equal(manifest.runtimeBytes,runtimeBytes);assert.ok(runtimeBytes<sourceBytes);
});
test('Animal art preparation rejects missing generations without creating a manifest',async()=>{
 const os=require('node:os');const temp=fs.mkdtempSync(path.join(os.tmpdir(),'animal-art-test-'));
 try{const {prepare}=require('../tools/prepare-animal-island-art.cjs');await assert.rejects(prepare({root:temp}),/Missing 50/);assert.equal(fs.existsSync(path.join(temp,'assets/animal-island/manifest.json')),false);}finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('Partial preparation preserves source bytes and refuses reused generation pixels',async()=>{
 const os=require('node:os');const temp=fs.mkdtempSync(path.join(os.tmpdir(),'animal-art-encode-'));
 const {prepare,loadSharp}=require('../tools/prepare-animal-island-art.cjs');const sharp=loadSharp();
 try{
  const dir=path.join(temp,'assets/animal-island/sources');fs.mkdirSync(dir,{recursive:true});
  const rgba=Buffer.alloc(32*32*4);for(let y=8;y<24;y++)for(let x=8;x<24;x++){const i=(y*32+x)*4;rgba[i]=75;rgba[i+1]=120;rgba[i+2]=80;rgba[i+3]=255;}
  const source=await sharp(rgba,{raw:{width:32,height:32,channels:4}}).png().toBuffer();
  const file=path.join(dir,'panda-level1.png');fs.writeFileSync(file,source);
  const p={method:'built-in image_gen',species:'panda',level:1,prompt:'Technical encoding fixture. '.repeat(12),original:'fixture.png'};
  fs.writeFileSync(path.join(dir,'panda-level1.provenance.json'),JSON.stringify(p));
  const result=await prepare({root:temp,partial:true});assert.equal(result.count,1);assert.equal(result.partial,true);assert.equal(result.missing.length,49);assert.equal(hash(fs.readFileSync(file)),hash(source));
  assert.deepEqual(result.assets[0].runtimeAlpha,{min:0,max:255});
  fs.writeFileSync(path.join(dir,'panda-level2.png'),source);fs.writeFileSync(path.join(dir,'panda-level2.provenance.json'),JSON.stringify({...p,level:2}));
  await assert.rejects(prepare({root:temp,partial:true}),/Duplicate generated source/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
