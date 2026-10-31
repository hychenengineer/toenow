const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../games/carefree-farm/model.js');
const legacy=require('./fixtures/carefree-farm-v1.json');
test('malformed progression data never overwrites the stored farm',()=>{
 for(const corrupt of [s=>s.orders[0].needs={unknown:2},s=>s.orders[1].id=s.orders[0].id,s=>s.collection=['unknown'],s=>s.animals[0].friendship=-1,s=>s.decorations=['unknown']]){
  const state=F.create(1000);corrupt(state);const raw=JSON.stringify(state);let writes=0;const store={getItem:()=>raw,setItem(){writes++;}};assert(F.load(store,1000).blocked);assert(!F.save(store,state));assert.equal(writes,0);
 }
});
test('new animal progression content has Chinese translations and all four motion poses',()=>{
 const catalog=require('../shared/toenow-i18n-farm.js').entries,fs=require('node:fs'),path=require('node:path');
 for(const name of [...F.BONDS.map(b=>b.name),...F.TRAITS,...F.KEEPSAKES.map(k=>k.name),...Object.values(F.DECORATIONS).map(d=>d.name)])assert(catalog[name],name);
 for(const species of Object.keys(F.ANIMALS))for(let pose=0;pose<4;pose++)assert(fs.existsSync(path.join(__dirname,'../assets/carefree-farm/motion',species+'-'+pose+'.webp')));
});
test('v1 migration preserves a mature farm and pending rewards without writing on read',()=>{
 const raw=JSON.stringify(legacy),store={getItem:()=>raw,setItem(){throw Error('must not write on read');}};
 const {state,blocked}=F.load(store,1000);assert.equal(blocked,false);assert.equal(state.version,2);
 for(const key of ['level','coins','plots','inventory','unlocked','harvests','harvested'])assert.deepEqual(state[key],legacy[key]);
 state.animals.forEach((a,i)=>{for(const key of Object.keys(legacy.animals[i]))assert.deepEqual(a[key],legacy.animals[i][key]);assert.equal(a.friendship,0);});
 assert.equal(state.orders.length,3);assert(F.valid(state));
 F.advance(state,60000);assert.equal(state.animals[0].friendship,2);F.advance(state,1e8);assert.equal(state.animals[0].friendship,2);
});
test('quantity sales are exact, bounded integers and revalidate current stock',()=>{
 const s=F.create(1000);s.inventory.carrot=12;const coins=s.coins;
 assert(F.act(s,{type:'sell',item:'carrot',quantity:3},1000).ok);assert.equal(s.inventory.carrot,9);assert.equal(s.coins,coins+12);
 for(const quantity of [0,-1,1.5,NaN,Infinity,10,'3',Number.MAX_SAFE_INTEGER]){const before=JSON.stringify(s);assert(!F.act(s,{type:'sell',item:'carrot',quantity},1000).ok);assert.equal(JSON.stringify(s),before);}
 assert(F.act(s,{type:'sell',item:'carrot',quantity:9},1000).ok);assert(!F.act(s,{type:'sell',item:'carrot',quantity:9},1000).ok);
});
test('favorite meals and pet cooldown build permanent friendship exactly once',()=>{
 const s=F.create(1000);s.inventory.clover=4;
 assert(F.act(s,{type:'pet',animal:0},1000).ok);assert.equal(s.animals[0].friendship,1);assert(!F.act(s,{type:'pet',animal:0},1001).ok);
 assert(F.act(s,{type:'feed',animal:0,crop:'clover'},1000).ok);const due=s.animals[0].due;F.advance(s,due);assert.equal(s.animals[0].friendship,5);F.advance(s,due+1e6);assert.equal(s.animals[0].friendship,5);
 assert(F.act(s,{type:'pet',animal:0},due+1e6).ok);assert.equal(s.animals[0].friendship,6);
});
test('gifts keep their old rewards and add unique tier-gated keepsakes',()=>{
 const s=F.create(1000),a=s.animals[0];a.gift='clover';
 const first=F.act(s,{type:'gift',animal:0},1000);assert(first.ok);assert(first.keepsake);assert.equal(s.collection.length,1);assert.equal(s.inventory.clover,2);assert.equal(s.stamps,1);
 assert(!F.act(s,{type:'gift',animal:0},1000).ok);assert.equal(s.stamps,1);
 a.gift='clover';F.act(s,{type:'gift',animal:0},1000);assert.equal(s.collection.length,1);
 a.friendship=100;a.gift='clover';F.act(s,{type:'gift',animal:0},1000);assert.equal(s.collection.length,2);assert(F.valid(s));
});
test('orders persist, consume exactly their requirements and cannot pay twice',()=>{
 const s=F.create(1000),order=s.orders[0];const before=JSON.stringify(s);assert(!F.act(s,{type:'fulfill',order:order.id},1000).ok);assert.equal(JSON.stringify(s),before);
 for(const [id,n] of Object.entries(order.needs))s.inventory[id]=(s.inventory[id]||0)+n;
 const inv={...s.inventory},coins=s.coins,stamps=s.stamps,others=s.orders.slice(1);
 assert(F.act(s,{type:'fulfill',order:order.id},1000).ok);assert.equal(s.coins,coins+order.coins);assert.equal(s.stamps,stamps+order.stamps);assert.equal(s.completedOrders,1);
 for(const [id,n] of Object.entries(order.needs))assert.equal(s.inventory[id],inv[id]-n);
 assert.deepEqual(s.orders.slice(1),others);assert(!F.act(s,{type:'fulfill',order:order.id},1000).ok);assert(F.valid(s));
 const loaded=F.load({getItem:()=>JSON.stringify(s)},1000);assert.deepEqual(loaded.state.orders,s.orders);
});
test('recurring orders only ask for accessible ingredients at every stage',()=>{
 for(let level=1;level<=5;level++){
 const s=F.create(1000);s.level=level;s.plots=Array(F.STAGES[level-1].plots).fill(null);s.unlocked=Object.keys(F.CROPS).filter(id=>F.CROPS[id].level<=level);
 for(let i=0;i<40;i++){const order=s.orders[i%3];for(const [id,n] of Object.entries(order.needs)){assert(s.unlocked.includes(id)||s.animals.some(a=>F.ANIMALS[a.species].product===id));s.inventory[id]=n;}assert(F.act(s,{type:'fulfill',order:order.id},1000).ok);}
 assert.equal(s.completedOrders,40);assert.equal(s.orders.length,3);
 }
});
test('decorations have meaningful milestones, costs and persistent ownership',()=>{
 const s=F.create(1000),d=F.DECORATIONS.flowerbed;s.coins=10000;s.stamps=100;
 assert(!F.act(s,{type:'buyDecoration',decoration:'flowerbed'},1000).ok);s.completedOrders=d.orders;
 assert(F.act(s,{type:'buyDecoration',decoration:'flowerbed'},1000).ok);assert.equal(s.coins,10000-d.coins);assert.equal(s.stamps,100-d.stamps);assert(s.decorations.includes('flowerbed'));assert(!F.act(s,{type:'buyDecoration',decoration:'flowerbed'},1000).ok);
});
test('grass remains free recovery food; every other crop earns more per plot-minute',()=>{
 const rate=c=>(c.yield*c.sell-c.cost)/c.seconds;assert.equal(F.CROPS.grass.cost,0);
 for(const [id,c] of Object.entries(F.CROPS))if(id!=='grass')assert(rate(c)>rate(F.CROPS.grass),id);
 assert(F.STAGES[4].orders>=15);assert(F.STAGES[4].harvests>=150);
});
