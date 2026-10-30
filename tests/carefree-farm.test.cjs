const {test}=require('node:test');
const assert=require('node:assert/strict');
const F=require('../games/carefree-farm/model.js');
test('every crop, animal and product has Chinese catalog copy and real art',()=>{
 const catalog=require('../shared/toenow-i18n-farm.js').entries,fs=require('node:fs'),path=require('node:path');
 for(const [id,c] of Object.entries(F.CROPS)){assert(catalog[c.name],id);assert(fs.existsSync(path.join(__dirname,'../assets/carefree-farm/crop-'+id+'.webp')));}
 for(const [id,a] of Object.entries(F.ANIMALS)){assert(catalog[a.name],id);assert(fs.existsSync(path.join(__dirname,'../assets/carefree-farm/'+id+'.webp')));}
 for(const c of Object.values(F.GOODS))assert(catalog[c.name]);assert.equal(catalog.Harvest,'收成');
});
test('all five stages are reachable through legal actions starting from a fresh farm',()=>{
 const s=F.create(1000);let time=1000;
 const action=a=>{const result=F.act(s,a,time);assert(result.ok,JSON.stringify(a)+' '+result.reason);};
 const harvest=crop=>{action({type:'plant',plot:0,crop});time+=F.CROPS[crop].seconds*1000;action({type:'harvest',plot:0});};
 const earn=coins=>{let iterations=0;while(s.coins<coins){assert(++iterations<1000);harvest('grass');for(let i=0;i<3;i++)action({type:'sell',item:'grass'});}};
 for(let level=2;level<=5;level++){
  const next=F.STAGES[level-1];
  while(new Set(s.animals.map(a=>a.species)).size<next.species){const species=Object.keys(F.ANIMALS).find(k=>F.ANIMALS[k].level<=s.level&&!s.animals.some(a=>a.species===k));earn(F.ANIMALS[species].cost);action({type:'buyAnimal',species});}
  for(let i=0;i<next.adults;i++)while(s.animals[i].growth<3){const spec=F.ANIMALS[s.animals[i].species];if(!s.inventory[spec.food]){earn(F.CROPS[spec.food].cost);harvest(spec.food);}action({type:'feed',animal:i,crop:spec.food});time+=spec.seconds*1000;F.advance(s,time);}
  while(s.harvested.length<next.varieties){const crop=s.unlocked.find(k=>!s.harvested.includes(k));assert(crop,'enough crop varieties before next gate');earn(F.CROPS[crop].cost);harvest(crop);}
  while(s.harvests<next.harvests)harvest('grass');earn(next.cost);action({type:'upgrade'});assert.equal(s.level,level);
 }
 assert.equal(s.plots.length,15);assert.equal(s.unlocked.length,12);assert(F.valid(s));
});
test('farm expansion requires farming and animal milestones, not only coins',()=>{
 const s=F.create(1000);s.coins=10000;
 assert.equal(s.plots.length,3);assert(!F.act(s,{type:'upgrade'},1000).ok);assert(!F.act(s,{type:'buyAnimal',species:'pig'},1000).ok);
 s.harvests=4;s.harvested=['grass'];s.animals[0].growth=3;
 assert(F.act(s,{type:'upgrade'},1000).ok);assert.equal(s.level,2);assert.equal(s.plots.length,6);assert(s.unlocked.includes('corn'));
 assert(!F.act(s,{type:'buyAnimal',species:'sheep'},1000).ok,'reserve early capacity for different species so progression cannot deadlock');
 assert(F.act(s,{type:'buyAnimal',species:'pig'},1000).ok);assert(!F.act(s,{type:'buyAnimal',species:'sheep'},1000).ok);
 assert(!F.act(s,{type:'upgrade'},1000).ok);
 for(let level=3;level<=5;level++){
 const next=F.STAGES[level-1];s.harvests=next.harvests;s.harvested=Object.keys(F.CROPS).filter(k=>s.unlocked.includes(k)).slice(0,next.varieties);
 while(s.animals.length<next.species){const species=Object.keys(F.ANIMALS).find(k=>F.ANIMALS[k].level<=s.level&&!s.animals.some(a=>a.species===k));assert(F.act(s,{type:'buyAnimal',species},1000).ok);}
 s.animals.forEach(a=>a.growth=3);assert(F.act(s,{type:'upgrade'},1000).ok);assert.equal(s.level,level);assert(F.valid(s));
 }
 assert.equal(s.unlocked.length,12);assert.equal(F.STAGES[s.level-1].capacity,8);assert(!F.act(s,{type:'upgrade'},1000).ok);
});
test('farm starts with one baby sheep and a recoverable free crop',()=>{
 const s=F.create(1000);assert.equal(s.animals.length,1);assert.equal(s.animals[0].species,'sheep');assert.equal(s.animals[0].growth,0);
 s.coins=0;s.inventory.grass=0;assert.equal(F.act(s,{type:'plant',plot:0,crop:'grass'},1000).ok,true);
 assert.equal(F.act(s,{type:'plant',plot:0,crop:'grass'},1000).ok,false);
 F.advance(s,61000);assert.equal(F.act(s,{type:'harvest',plot:0},61000).ok,true);assert(s.inventory.grass>0);
 assert.equal(F.act(s,{type:'harvest',plot:0},61000).ok,false);
});
test('fed baby grows offline once; gifts persist and cannot be claimed twice',()=>{
 const s=F.create(1000);s.inventory.grass=20;
 assert(F.act(s,{type:'feed',animal:0,crop:'grass'},1000).ok);assert(!F.act(s,{type:'feed',animal:0,crop:'grass'},1001).ok);
 F.advance(s,1e7);assert.equal(s.animals[0].growth,1);assert(s.animals[0].gift);
 F.advance(s,2e7);assert.equal(s.animals[0].growth,1);
 assert(F.act(s,{type:'gift',animal:0},2e7).ok);assert(s.unlocked.includes('clover'));assert(!F.act(s,{type:'gift',animal:0},2e7).ok);
 for(let i=0;i<2;i++){F.act(s,{type:'feed',animal:0,crop:'grass'},2e7+i*1e6);F.advance(s,2e7+(i+1)*1e6);}
 assert.equal(s.animals[0].growth,3);
 F.act(s,{type:'feed',animal:0,crop:'grass'},3e7);F.advance(s,4e7);assert.equal(s.animals[0].ready,true);
 assert(F.act(s,{type:'collect',animal:0},4e7).ok);assert.equal(s.inventory.wool,1);assert(!F.act(s,{type:'collect',animal:0},4e7).ok);
});
test('all species have compatible crops, stable production and distinct surprises',()=>{
 const s=F.create(0);s.coins=10000;s.level=5;s.plots=Array(15).fill(null);s.unlocked=Object.keys(F.CROPS);
 for(const [species,a] of Object.entries(F.ANIMALS)){
 if(species!=='sheep')assert(F.act(s,{type:'buyAnimal',species},0).ok);
 const index=s.animals.findIndex(x=>x.species===species);s.inventory[a.food]=50;
 assert(s.unlocked.includes(a.food));
 for(let cycle=0;cycle<6;cycle++){
 assert(F.act(s,{type:'feed',animal:index,crop:a.food},s.lastSeen).ok);F.advance(s,s.lastSeen+1e6);
 if(s.animals[index].ready)assert(F.act(s,{type:'collect',animal:index},(cycle+1)*1e6).ok);
 }
 assert(s.animals[index].gift);assert(s.inventory[a.product]>=1);
 assert(F.act(s,{type:'gift',animal:index},7e6).ok);

 }
 assert.equal(new Set(Object.values(F.ANIMALS).map(a=>a.gift)).size,5);
});
test('invalid and unaffordable transactions leave economy untouched',()=>{
 const s=F.create(100);s.coins=0;
 for(const action of [{type:'buyAnimal',species:'cow'},{type:'plant',plot:-1,crop:'grass'},{type:'plant',plot:0,crop:'unknown'},{type:'sell',item:'wool'},{type:'expand'},{type:'feed',animal:99,crop:'grass'}]){
 const before=JSON.stringify(s);assert(!F.act(s,action,100).ok);assert.equal(JSON.stringify(s),before);
 }
});
test('versioned saves roundtrip and preview/storage failures do not overwrite',()=>{
 const data=new Map();const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const s=F.create(100);assert(F.save(storage,s,false));assert.deepEqual(F.load(storage,100).state,s);
 const before=data.get(F.KEY);s.coins=999;assert(F.save(storage,s,true));assert.equal(data.get(F.KEY),before);
 data.set(F.KEY,'{bad');assert.equal(F.load(storage,100).blocked,true);assert.equal(data.get(F.KEY),'{bad');
 data.set(F.KEY,JSON.stringify({version:999}));assert.equal(F.load(storage,100).blocked,true);
 assert.equal(F.save({setItem(){throw Error('quota');}},s,false),false);
});
