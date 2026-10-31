const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../games/capybara-drift/engine.js');
const store=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),data};};
test('rocks and logs gently bump once without becoming collected rewards',()=>{
 for(const type of ['rock','log']){const s=E.create();s.items=[{id:101,type,x:s.x,y:s.y}];const before=s.score;
  assert.deepEqual(E.step(s,.01,()=>.5),['hit']);assert.equal(s.hitCount,1);assert(s.hitTime>.7);assert.equal(Math.abs(s.hitSide),1);assert(s.x>=.12&&s.x<=.88);assert.equal(s.score,before);assert.deepEqual(s.inventory,{});assert.equal(s.materialCollected,false);assert.equal(s.items.length,0);assert.equal(s.particles.length,0);
  s.items=[{id:102,type,x:s.x,y:s.y}];assert.deepEqual(E.step(s,.01,()=>.5),[]);assert.equal(s.hitCount,1);assert.equal(s.items.length,0);
 }
});
test('obstacles arrive early then sparsely with no random pickup dependency',()=>{
 const s=E.create();s.items=[];const arrivals=[];const ids=new Set();for(let i=0;i<400;i++){E.step(s,.05,()=>.5);for(const item of s.items)if(['rock','log'].includes(item.type)&&!ids.has(item.id)){ids.add(item.id);arrivals.push({time:s.flowTime,type:item.type});}}
 assert(arrivals.length>=3);assert(Math.abs(arrivals[0].time-6)<.06);assert(arrivals.some(a=>a.type==='rock'));assert(arrivals.some(a=>a.type==='log'));for(let i=1;i<arrivals.length;i++)assert(Math.abs(arrivals[i].time-arrivals[i-1].time-7)<.06);
});
test('bump and obstacle clock freeze on pause and restore with legacy defaults',()=>{
 const storage=store(),s=E.begin(storage);s.items=[{id:101,type:'log',x:s.x,y:s.y}];E.step(s,.01,()=>.5);s.paused=true;const before=JSON.stringify(s);E.step(s,.05);assert.equal(JSON.stringify(s),before);s.paused=false;E.checkpoint(storage,s);const r=E.restore(storage);assert.equal(r.hitTime,s.hitTime);assert.equal(r.hitCount,1);assert.equal(r.obstacleClock,s.obstacleClock);E.step(r,.05,()=>.5);assert(r.hitTime<s.hitTime);
 const raw=JSON.parse(storage.getItem(E.SESSION));for(const k of ['hitTime','hitCount','hitSide','obstacleClock','obstacleCount'])delete raw.session[k];storage.setItem(E.SESSION,JSON.stringify(raw));const legacy=E.restore(storage);assert.equal(legacy.hitTime,0);assert.equal(legacy.hitCount,0);assert.equal(legacy.obstacleClock,6);
});
function enterEddy(s){s.elapsed=25;const e=E.eddyInfo(s);E.steer(s,e.x,e.y);assert.equal(s.eddy.active,false,'A distant pointer must not teleport into the eddy');for(let i=0;i<80&&!s.eddy.active;i++)E.step(s,.05,()=>.5);assert(s.eddy.active);return E.eddyInfo(s);}
test('obstacle bumps inside the eddy keep the orbit valid and recover after cooldown',()=>{
 const s=E.create();enterEddy(s);const radius=s.eddy.radius,elapsed=s.elapsed;s.items=[{id:301,type:'rock',x:s.x,y:s.y}];assert(E.step(s,.001,()=>.5).includes('hit'));assert.equal(s.eddy.active,true);assert.equal(s.eddy.radius,radius);assert.equal(s.elapsed,elapsed);
 for(let i=0;i<17;i++)E.step(s,.05,()=>.5);assert.equal(s.hitTime,0);s.items=[{id:302,type:'log',x:s.x,y:s.y}];assert(E.step(s,.001,()=>.5).includes('hit'));assert.equal(s.hitCount,2);assert.equal(s.eddy.radius,radius);assert(Number.isFinite(E.position(s).heading));
});
test('optional eddy freezes journey time while flow, pickups and orbit continue',()=>{
 const s=E.create();const e=enterEddy(s),elapsed=s.elapsed,flow=s.flowTime,position=E.position(s);s.items=[{id:100,type:'bubble',x:.5,y:.1}];s.spawn=.01;
 for(let i=0;i<100;i++)E.step(s,.05,()=>.5);
 assert.equal(s.elapsed,elapsed);assert(s.flowTime>flow+4.9);assert(s.items.some(i=>i.id>100)||s.items.length>1);assert.notDeepEqual(E.position(s),position);assert.equal(s.completed,false);assert.equal(e.active,true);
 s.paused=true;const before=JSON.stringify(s);E.step(s,.05);assert.equal(JSON.stringify(s),before);
});
test('touch steering and explicit exit return freely to journey time',()=>{
 const s=E.create();enterEddy(s);const elapsed=s.elapsed;const e=E.eddyInfo(s);E.steer(s,e.exitX,e.exitY);assert.equal(s.eddy.active,false);E.step(s,.05);assert(s.elapsed>elapsed);
 E.steer(s,e.x,e.y);for(let i=0;i<100&&!s.eddy.active;i++)E.step(s,.05);assert(s.eddy.active);assert.equal(E.leaveEddy(s),true);assert.equal(s.eddy.active,false);
 const n=E.create();E.steer(n,.25,.66);for(let i=0;i<100;i++)E.step(n,.05);assert.equal(n.eddy.active,false,'Eddy is unavailable before the middle of the route');
});
test('eddy saves restore position and material cap without practice writes',()=>{
 const M=require('../shared/toenow-materials.js'),storage=store(),s=E.begin(storage);enterEddy(s);s.trip.materialId='block-match';s.materialCollected=true;E.play(s);E.checkpoint(storage,s);const r=E.restore(storage);assert(r);assert.deepEqual(E.position(r),E.position(s));assert.equal(r.eddy.active,true);assert.equal(r.flowTime,s.flowTime);assert.equal(r.materialCollected,true);
 for(let i=0;i<100;i++)E.step(r,.05);E.checkpoint(storage,r);assert.equal(M.create({storage}).snapshot().balances['block-match'],1);
 const p=E.begin(storage,true);enterEddy(p);p.materialCollected=true;p.trip.materialId='block-match';const before=JSON.stringify([...storage.data]);E.checkpoint(storage,p);assert.equal(JSON.stringify([...storage.data]),before);
});
test('long eddy stays bounded and can collect at actual orbit height',()=>{
 const s=E.create();enterEddy(s);for(let i=0;i<24000;i++)E.step(s,.05,()=>.5);assert(s.items.length<=30);assert(s.particles.length<=40);assert(s.trail.length<=4);assert(s.elapsed<45);assert(Number.isFinite(E.position(s).heading));
 s.items=[{id:999999,type:'yuzu',x:s.x,y:s.y}];const score=s.score;E.step(s,.001);assert.equal(s.score,score+5);E.play(s);assert(s.playTime>0);
});
test('legacy journey saves default flow and height, malformed eddy saves fail safely',()=>{
 const storage=store(),s=E.begin(storage);s.elapsed=12;E.checkpoint(storage,s);const raw=JSON.parse(storage.getItem(E.SESSION));delete raw.session.flowTime;delete raw.session.y;delete raw.session.eddy;storage.setItem(E.SESSION,JSON.stringify(raw));const r=E.restore(storage);assert.equal(r.flowTime,12);assert.equal(r.y,.72);assert.equal(r.eddy.active,false);
 raw.session.eddy={active:true,angle:Infinity,radius:.13};storage.setItem(E.SESSION,JSON.stringify(raw));assert.equal(E.restore(storage),null);
});
test('a new drift has something to collect immediately instead of an empty river',()=>{
 const s=E.create();assert(s.items.some(i=>i.type==='bubble'&&i.y>.5));
 for(let i=0;i<50;i++)E.step(s,.05,()=>.5);assert(s.score>0);
});
test('finite drift keeps speed fixed, positions safe and entity memory bounded',()=>{
 const s=E.create();const speed=s.speed;
 E.steer(s,100); assert.equal(s.target,.88);
 for(let i=0;i<20000;i++)E.step(s,.05,()=>.5);
 assert.equal(s.speed,speed);assert.equal(s.elapsed,90);assert(s.items.length<35);assert(s.particles.length<50);assert(s.x>=.12&&s.x<=.88);assert.equal(s.wave,1);
});
test('collection is once only, misses and rocks never subtract points',()=>{
 const s=E.create();s.items=[{type:'yuzu',x:s.x,y:.72,id:1}];E.step(s,.01,()=>.5);assert.equal(s.score,5);assert.equal(s.yuzu,1);
 E.step(s,.01,()=>.5);assert.equal(s.score,5);
 s.items=[{type:'rock',x:s.x,y:.72,id:2},{type:'bubble',x:.1,y:1.3,id:3}];E.step(s,.01,()=>.5);assert.equal(s.score,5);
});
test('pause freezes simulation and friends stay bounded during an endless run',()=>{
 const s=E.create();s.paused=true;E.step(s,1);assert.equal(s.elapsed,0);s.paused=false;
 for(let i=0;i<100;i++){s.items=[{type:'friend',x:s.x,y:.72,id:i}];E.step(s,.01);}assert.equal(s.friends,100);assert(s.trail.length<=4);
});
test('checkpoint credits only new normal-play points, reload does not duplicate wallet',()=>{
 const storage=store();let s=E.create();s.score=80;E.checkpoint(storage,s);E.checkpoint(storage,s);assert.equal(E.readProfile(storage).wallet,80);
 s=E.restore(storage);assert.equal(s.score,80);s.score+=5;E.checkpoint(storage,s);assert.equal(E.readProfile(storage).wallet,85);
 E.finish(storage,s);assert.equal(E.restore(storage),null);assert.equal(E.readProfile(storage).wallet,85);
});
test('practice cannot overwrite checkpoint, points, purchases or best records',()=>{
 const storage=store();const s=E.create();s.score=50;E.checkpoint(storage,s);const before=JSON.stringify([...storage.data]);
 const p=E.create(11,true);p.score=900;E.checkpoint(storage,p);E.finish(storage,p);assert.equal(JSON.stringify([...storage.data]),before);
});
test('cosmetics charge exactly once and cannot be equipped before purchase',()=>{
 const storage=store();const s=E.create();s.score=200;E.checkpoint(storage,s);
 assert.equal(E.buy(storage,'flower'),true);assert.equal(E.readProfile(storage).wallet,80);assert.equal(E.buy(storage,'flower'),true);assert.equal(E.readProfile(storage).wallet,80);
 assert.equal(E.buy(storage,'citrus'),false);assert.equal(E.buy(storage,'unknown'),false);
});
test('corrupt saves and inaccessible storage fail safely',()=>{
 const storage=store();storage.setItem(E.SESSION,'{"x":null,"score":1e999}');assert.equal(E.restore(storage),null);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 assert.doesNotThrow(()=>{E.checkpoint(blocked,E.create());E.finish(blocked,E.create());});assert.equal(E.restore(blocked),null);
});
test('relaxing scores cannot change cognitive ratings',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const start=html.indexOf('function recalibrateCognitiveProfile('),end=html.indexOf('\n    function ',start+10);
 const code=html.slice(start,end);let writes=0;
 const context=vm.createContext({GAMES_CONFIG:[{id:'capybara-drift',category:'relax'}],getUserProfile:()=>({memory:80,reaction:70}),calculatePerformanceIndex:()=>1,localStorage:{setItem(){writes++;}},STORAGE_KEYS:{PROFILE:'profile'},saveUserProfile(){writes++;},renderHexagonRadar(){}});
 vm.runInContext(code+'\nrecalibrateCognitiveProfile("capybara-drift","relax",1);',context);assert.equal(writes,0);
});

 test('journeys last 90 active seconds with no increasing levels',()=>{const s=E.create(21);for(let i=0;i<3000;i++)E.step(s,.05,()=>.5);assert.equal(E.DURATION,90);assert.equal(s.elapsed,90);assert.equal(s.completed,true);assert.equal(s.wave,1);});
 test('new trips have diverse named itineraries and resume keeps their exact pickups',()=>{const storage=store();const seen=new Set();for(let i=0;i<12;i++){const s=E.begin(storage);seen.add(JSON.stringify([s.trip.scene,s.trip.time,s.trip.weather,s.trip.friend,s.trip.collectible,s.trip.event]));E.checkpoint(storage,s);const r=E.restore(storage);assert.deepEqual(r.trip,s.trip);assert.deepEqual(r.items,s.items);}assert(seen.size>5);assert(E.POOLS.collectibles.length>=16);});
 test('featured collection persists once through resume and repeated finish',()=>{const storage=store(),s=E.begin(storage);s.items=[{id:88,type:'collectible',collectibleId:s.trip.collectible,x:s.x,y:.72}];E.step(s,.01);assert.equal(s.inventory[s.trip.collectible],1);E.checkpoint(storage,s);const r=E.restore(storage);E.finish(storage,r);E.finish(storage,r);assert.equal(E.readProfile(storage).inventory[s.trip.collectible],1);});
 test('one collected construction resource has a durable receipt even if checkpoint fails',()=>{const M=require('../shared/toenow-materials.js'),storage=store(),s=E.begin(storage);s.trip.materialId='block-match';s.items=[{id:91,type:'material',materialId:'block-match',x:s.x,y:.72}];E.step(s,.01);assert.equal(s.materialCollected,true);const original=storage.setItem;storage.setItem=(k,v)=>{if(k===E.SESSION)throw Error('crash');original(k,v);};E.checkpoint(storage,s);storage.setItem=original;E.finish(storage,s);E.finish(storage,s);assert.equal(M.create({storage}).snapshot().balances['block-match'],1);});
 test('practice trip and collected resource never write any storage',()=>{const storage=store(),s=E.begin(storage,true);s.trip.materialId='block-match';s.materialCollected=true;s.inventory[s.trip.collectible]=1;E.checkpoint(storage,s);E.finish(storage,s);assert.equal(storage.data.size,0);});

test('old pre-reward session cannot mint a second material after reload',()=>{
 const M=require('../shared/toenow-materials.js'),storage=store(),s=E.begin(storage);s.trip.materialId='block-match';s.items=[{id:80,type:'material',materialId:'block-match',x:s.x,y:.72}];E.checkpoint(storage,s);const before=storage.getItem(E.SESSION);E.step(s,.01);E.checkpoint(storage,s);
 storage.setItem(E.SESSION,before);const r=E.restore(storage);E.step(r,.01);E.finish(storage,r);assert.equal(M.create({storage}).snapshot().balances['block-match'],1);
});
test('stale trip checkpoints cannot roll back a receipt and duplicate collection or wallet',()=>{
 const storage=store(),s=E.begin(storage);s.items=[{id:90,type:'collectible',collectibleId:s.trip.collectible,x:s.x,y:.72}];E.checkpoint(storage,s);const stale=E.restore(storage);E.step(s,.01);E.checkpoint(storage,s);E.checkpoint(storage,stale);E.finish(storage,s);assert.equal(E.readProfile(storage).inventory[s.trip.collectible],1);assert.equal(E.readProfile(storage).wallet,s.score);
});
test('featured pickups are not granted by early landing and occur at most once',()=>{
 const storage=store(),s=E.begin(storage);E.finish(storage,s);assert.deepEqual(E.readProfile(storage).inventory,{});
 const r=E.create();r.trip.materialId='block-match';let materialSpawns=0;for(let i=0;i<1801;i++){const events=E.step(r,.05,()=>.5);materialSpawns+=events.filter(x=>x==='encounter:material').length;}assert.equal(materialSpawns,1);assert.equal(r.featured.material,true);assert.equal(r.wave,1);
});
test('malformed pending pickups reject a save without losing cosmetics or collection',()=>{
 const storage=store(),s=E.begin(storage);s.score=200;E.checkpoint(storage,s);E.buy(storage,'flower');const raw=JSON.parse(storage.getItem(E.SESSION));raw.session.items=[{type:'material',x:null,y:.7,id:2}];storage.setItem(E.SESSION,JSON.stringify(raw));assert.equal(E.restore(storage),null);assert(E.readProfile(storage).owned.includes('flower'));assert.equal(E.readProfile(storage).wallet,80);
});
test('night and rain discoveries have coherent generated itineraries',()=>{
 for(let i=0;i<400;i++){const t=E.create().trip;if(t.friend==='firefly'||t.event==='fireflies')assert.equal(t.time,'night');if(t.collectible==='leaf-umbrella'||t.collectible==='rain-drop')assert(['rain','sunshower','storm','rainbow'].includes(t.weather));if(t.event==='rainbow')assert.equal(t.weather,'rainbow');}
});
test('gift event offers one extra collectible to pick up and cannot respawn after resume',()=>{
 const storage=store(),s=E.begin(storage);s.trip.event='gift';s.trip.materialId=null;s.elapsed=64.99;s.items=[];s.featured={friend:true,collectible:true,material:true};
 E.step(s,.02,()=>.5);const gifts=s.items.filter(i=>i.eventGift);assert.equal(gifts.length,1);assert.equal(gifts[0].type,'collectible');assert.equal(gifts[0].collectibleId,s.trip.collectible);assert.equal(s.materialCollected,false);assert.deepEqual(s.inventory,{},'Gift must be picked up, not credited automatically');
 E.checkpoint(storage,s);const r=E.restore(storage);assert.equal(r.featured.event,true);for(let i=0;i<40;i++)E.step(r,.05,()=>.5);assert(r.items.filter(i=>i.eventGift).length<=1);const gift=r.items.find(i=>i.eventGift);assert(gift);gift.x=r.x;gift.y=.72;E.step(r,.01,()=>.5);assert.equal(r.inventory[r.trip.collectible],1);E.checkpoint(storage,r);const after=E.restore(storage);for(let i=0;i<200;i++)E.step(after,.05,()=>.5);assert.equal(after.items.filter(i=>i.eventGift).length,0);assert.equal(after.inventory[after.trip.collectible],1);
});
test('other journey events do not create gift pickups',()=>{const s=E.create();s.trip.event='fish';s.elapsed=64.99;s.items=[];s.featured={friend:true,collectible:true,material:true};E.step(s,.02,()=>.5);assert.equal(s.items.filter(i=>i.eventGift).length,0);});
