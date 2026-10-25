const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'../shared/toenow-animals.js');
const animals=fs.existsSync(file)?require(file):{};
const levels=require('../shared/toenow-levels.js');

test('Animal island provides one distinct partner and habitat for each existing game',()=>{
 assert.equal(typeof animals.getTheme,'function','animal theme API exists');
 const themes=Object.keys(levels.GAME_STORAGE_KEYS).map(id=>animals.getTheme(id));
 assert(themes.every(Boolean));
 assert.equal(new Set(themes.map(t=>t.species)).size,10);
 assert.equal(new Set(themes.map(t=>t.place)).size,10);
 assert(themes.every(t=>t.task&&t.taskZh&&t.placeZh));
 assert.equal(animals.getTheme('unknown'),null);
});
test('Animal building stages are bounded and follow the shared five-tier wave mapping',()=>{
 assert.equal(typeof animals.getBuildingAsset,'function');
 for(const id of Object.keys(levels.GAME_STORAGE_KEYS)){
  const textures=new Set();
  for(let n=1;n<=5;n++)textures.add(animals.getBuildingAsset(id,n));
  assert.equal(textures.size,5);
  assert(animals.getBuildingAsset(id,99).endsWith('-level5.webp'));
  assert(animals.getBuildingAsset(id,NaN).endsWith('-level1.webp'));
 }
 assert.equal(animals.getBuildingAsset('unknown',2),null);
 for(const [wave,stage] of [[1,1],[5,1],[6,2],[11,3],[16,4],[21,5]])assert.equal(animals.levelForWave(wave),stage);
});
test('Theme helpers work without DOM and never alter scores or practice records',()=>{
 assert.equal(typeof animals.feedback,'function');
 assert.doesNotThrow(()=>{animals.feedback('spot-quick',true);animals.setWave('spot-quick',21);});
 assert.match(animals.getTheme('spot-quick').task,/every category/i);
 assert.equal(animals.getTheme('ball-track').species,'otter');
});
test('Watercolor characters have one reusable asset per species',()=>{
 assert.equal(typeof animals.getCharacterAsset,'function');
 for(const theme of Object.values(animals.THEMES))assert.equal(animals.getCharacterAsset(theme.species),`assets/animal-island/${theme.species}-character.webp`);
 assert.equal(animals.getCharacterAsset('unknown'),null);
});
test('The title guide reads normal-play records, never practice stage or malformed values',()=>{
 assert.equal(typeof animals.getSavedLevel,'function');
 const key=levels.GAME_STORAGE_KEYS['number-pop'].wave;
 const store=values=>({getItem:k=>values[k]??null,setItem(){assert.fail('must not write records');}});
 assert.equal(animals.getSavedLevel('number-pop',store({[key]:'6'})),2);
 assert.equal(animals.getSavedLevel('number-pop',store({[key]:'6',toenow_game_scores:JSON.stringify({'number-pop':{maxWave:21}})})),5);
 for(const value of ['NaN','21oops','6.5','-3'])assert.equal(animals.getSavedLevel('number-pop',store({[key]:value})),1);
 assert.equal(animals.getSavedLevel('unknown',store({})),1);
});
