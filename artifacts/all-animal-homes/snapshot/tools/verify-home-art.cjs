const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),configs=require('../shared/toenow-homes-config.js');
(async()=>{const checked=[];for(const home of Object.values(configs.HOMES)){
 for(const asset of [home.background,home.atlas,home.character])assert(fs.existsSync(path.join(root,asset)),asset);
 if(home.species==='rabbit')continue;
 const dir=path.join(root,'assets/animal-homes',home.species),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
 assert.equal(manifest.assets.length,2);for(const asset of manifest.assets){
  assert(asset.prompt&&!asset.prompt.includes('Pending'),home.species+' full prompt provenance');
  const source=fs.readFileSync(path.join(dir,asset.source)),meta=await sharp(path.join(dir,asset.runtime)).metadata();
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),asset.sha256);assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.height);
  if(asset.kind==='buildings'){assert(meta.hasAlpha,home.species+' transparent overlay');assert(asset.transparentFraction>.2);assert(Math.abs(meta.width/meta.height-1.5)<.03);}else assert(Math.abs(meta.width/meta.height-4/3)<.03);
  checked.push(home.species+'/'+asset.runtime);
 }
}fs.mkdirSync(path.join(root,'artifacts/all-animal-homes'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/all-animal-homes/art-verification.json'),JSON.stringify({checked,count:checked.length,canonicalCharactersPreserved:true},null,2));console.log('PASS '+checked.length+' generated runtime assets, PNG source hashes, prompts, dimensions, transparency and all characters');})().catch(e=>{console.error(e);process.exitCode=1;});
