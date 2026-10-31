const {test}=require('node:test');const a=require('node:assert/strict');
const E=require('../games/capybara-drift/garden-model.js');
function storage(seed={}){const data={...seed};return {data,getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v;}};}
test('welcoming small garden and bounded sanitized profiles',()=>{const p=E.defaults();a(p.cells.length>5&&p.cells.length<25);a(p.visitors.length);const clean=E.sanitize({cells:Array(500).fill({q:999,r:0,type:'water'}),postcards:Array(100).fill({})});a(clean.cells.length<=E.MAX_CELLS);a(clean.postcards.length<=E.MAX_POSTCARDS);a.deepEqual(E.load(storage({[E.KEY]:'{broken'})).cells,p.cells);a.doesNotThrow(()=>E.load({getItem(){throw Error();}}));});
test('legacy stays byte-for-byte untouched and preview never imports or writes',()=>{const raw=JSON.stringify({owned:['peach','mint'],equipped:'mint',wallet:200,session:{elapsed:30}}),s=storage({capybara_drift_progress_v1:raw});const p=E.load(s);a(p.cosmetics.includes('mint'));E.save(s,p,false);a.equal(s.data.capybara_drift_progress_v1,raw);const before=JSON.stringify(s.data);E.save(s,E.load(s,true),true);a.equal(JSON.stringify(s.data),before);a.equal(E.load(s,true).equipped,'peach');});
test('edits bounded, connected features derived, undo redo serializable',()=>{const p=E.defaults(),h=E.history();a(E.edit(p,h,3,0,'wood'));a.equal(p.cells.find(c=>c.q===3&&c.r===0).type,'wood');E.undo(p,h);a(!p.cells.some(c=>c.q===3&&c.r===0));E.redo(p,h);a(p.cells.some(c=>c.q===3&&c.r===0));a.equal(E.edit(p,h,999,0,'water'),false);a.equal(E.edit(p,h,3,0,'bad'),false);a(E.features(p).some(c=>c.feature));a.deepEqual(E.sanitize(JSON.parse(JSON.stringify(p))).cells,p.cells);});
test('visitors avoid recent repeats and discoveries idempotent, postcards capped',()=>{const p=E.defaults();const first=E.visit(p,()=>0);const second=E.visit(p,()=>0);a.notEqual(first,second);E.discover(p,'duck');const n=p.discoveries.length;E.discover(p,'duck');a.equal(p.discoveries.length,n);for(let i=0;i<40;i++)E.postcard(p,i);a.equal(p.postcards.length,E.MAX_POSTCARDS);a(!JSON.stringify(p).includes('data:image'));a.doesNotThrow(()=>E.save({setItem(){throw Error();}},p,false));});
test('capacity, duplicate cells, undo bounds and last water protection',()=>{const p=E.defaults(),h=E.history();for(let q=-12;q<=12;q++)for(let r=-12;r<=12;r++)E.edit(p,h,q,r,'water');a.equal(p.cells.length,E.MAX_CELLS);a(h.past.length<=40);a.equal(E.edit(p,h,12,12,'stone'),false);const one=E.sanitize({version:1,cells:[{q:0,r:0,type:'water'},{q:0,r:0,type:'water'}]});a.equal(one.cells.length,1);a.equal(E.edit(one,E.history(),0,0,'erase'),false);});
test('malformed arrays and unsupported schemas fall back without importing ambiguous wallets',()=>{for(const raw of [null,[],{version:99},{version:1,cells:'bad',postcards:[null,{}, {timestamp:1,cells:[null]}],cosmetics:['unknown','mint','mint'],visitors:['unknown']}])a.doesNotThrow(()=>E.sanitize(raw));const s=storage({capybara_drift_progress_v1:'{"wallet":999,"owned":"mint"}'});a.deepEqual(E.load(s).cosmetics,['peach']);a.equal(Object.keys(s.data).length,1);});
test('postcards keep immutable scene snapshots and storage roundtrips',()=>{const p=E.defaults();const card=E.postcard(p,42),before=JSON.stringify(card);E.edit(p,E.history(),4,0,'bamboo');p.equipped='mint';a.equal(JSON.stringify(card),before);const s=storage();a.equal(E.save(s,p,false),true);a.equal(E.load(s).postcards[0].timestamp,42);a.equal(E.save(null,p,false),false);});
test('restore postcard after reload preserves album and collection and backs up current garden',()=>{
 const s=storage(),p=E.defaults();p.cosmetics.push('mint');p.equipped='mint';const card=E.postcard(p,42);
 E.edit(p,E.history(),4,0,'bamboo');p.palette='rain';p.equipped='peach';p.discoveries.push('otter');E.save(s,p,false);
 const loaded=E.load(s),before=JSON.parse(JSON.stringify(loaded));
 a.equal(E.restorePostcard(loaded,loaded.postcards[0],99),true);
 a.deepEqual(loaded.cells,card.cells);a.equal(loaded.palette,card.palette);a.equal(loaded.equipped,'mint');
 a.deepEqual(loaded.discoveries,before.discoveries);a.equal(loaded.postcards.length,2);
 a.deepEqual(loaded.postcards[1].cells,before.cells);a.equal(loaded.postcards[1].palette,'rain');
 E.save(s,loaded,false);a.deepEqual(E.load(s).cells,card.cells);
 loaded.cells[0].type='stone';a.equal(loaded.postcards[0].cells[0].type,'water');
});
test('restore rejects unusable postcards without changes and retains selected card in a full album',()=>{
 const p=E.defaults(),before=JSON.stringify(p);
 a.equal(E.restorePostcard(p,{timestamp:1,cells:[{q:0,r:0,type:'stone'}]}),false);a.equal(JSON.stringify(p),before);
 for(let n=0;n<E.MAX_POSTCARDS;n++)E.postcard(p,n);
 const first=JSON.parse(JSON.stringify(p.postcards[0]));a.equal(E.restorePostcard(p,first,100),true);
 a.equal(p.postcards.length,E.MAX_POSTCARDS);a(p.postcards.some(c=>c.timestamp===0));a(p.postcards.some(c=>c.timestamp===100));
});
