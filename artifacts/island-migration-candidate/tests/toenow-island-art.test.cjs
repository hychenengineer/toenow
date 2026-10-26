const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const island=require('../shared/toenow-island.js');
const animals=require('../shared/toenow-animals.js');
const root=path.resolve(__dirname,'..');

test('Every island location selects five distinct real illustrated growth assets',()=>{
 assert.equal(typeof island.getBuildingAsset,'function','illustrated building asset selection exists');
 const sources=new Set();
 for(const location of island.LOCATIONS)for(let level=1;level<=5;level++){
  const asset=island.getBuildingAsset(location.kind,level);
  assert.equal(asset,animals.getBuildingAsset(location.gameId,level));
  const bytes=fs.readFileSync(path.join(root,asset));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  sources.add(crypto.createHash('sha256').update(bytes).digest('hex'));
 }
 assert.equal(sources.size,50,'fifty actual illustrations, not reused files');
 assert.equal(island.getBuildingAsset('unknown',2),null);
 assert(island.getBuildingAsset('station',99).endsWith('panda-level5.webp'));
 assert(island.getBuildingAsset('station',NaN).endsWith('panda-level1.webp'));
});

test('Illustrated landmarks use the actual stage texture and preserve a recoverable vector fallback',()=>{
 const html=island.landmark('observatory',4,'#626ca0');
 assert(html.includes('<img'),'actual image is rendered');
 assert(html.includes('fox-level4.webp'));
 assert(!html.includes('<svg'),'normal rendering uses illustrated artwork');
 assert.equal(typeof island.landmarkVector,'function');
 assert(island.landmarkVector('observatory',4,'#626ca0').includes('<svg'));
});

test('Art manifest covers fifty alpha-preserving source/runtime pairs with provenance',()=>{
 const manifestPath=path.join(root,'assets/island-buildings/manifest.json');
 assert(fs.existsSync(manifestPath),'validated art manifest exists');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 assert.equal(manifest.count,50);assert.equal(manifest.assets.length,50);
 for(const entry of manifest.assets){
  assert(entry.sourceSize[0]>=800&&entry.sourceSize[1]>=800);
  assert(entry.runtimeSize[0]<=640&&entry.runtimeSize[1]<=640);
  assert(fs.existsSync(path.join(root,entry.source)));
  const provenance=JSON.parse(fs.readFileSync(path.join(root,entry.provenance),'utf8'));
  assert.equal(provenance.method,'built-in image_gen');assert(provenance.prompt.length>200);
  assert.equal(provenance.kind,entry.kind);assert.equal(provenance.level,entry.level);
 }
 assert(manifest.runtimeBytes<manifest.sourceBytes,'runtime textures reduce download size');
});
