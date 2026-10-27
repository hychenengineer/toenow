const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../games/capybara-drift/engine.js');
const store=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),data};};
test('a new drift has something to collect immediately instead of an empty river',()=>{
 const s=E.create();assert(s.items.some(i=>i.type==='bubble'&&i.y>.5));
 for(let i=0;i<50;i++)E.step(s,.05,()=>.5);assert(s.score>0);
});
test('endless drift keeps speed fixed, positions safe and entity memory bounded',()=>{
 const s=E.create();const speed=s.speed;
 E.steer(s,100); assert.equal(s.target,.88);
 for(let i=0;i<20000;i++)E.step(s,.05,()=>.5);
 assert.equal(s.speed,speed);assert(s.elapsed>900);assert(s.items.length<35);assert(s.particles.length<50);assert(s.x>=.12&&s.x<=.88);assert(s.wave>5);
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
