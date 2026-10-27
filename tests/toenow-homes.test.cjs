const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const filename=path.resolve(__dirname,'../shared/toenow-homes.js');
const homes=fs.existsSync(filename)?require(filename):{};
const ids=['number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain','animal-rescue-train'];
const state=(id,stage=1,balances={})=>({balances,homes:{[id]:{stage,owned:['welcome','together'],placed:['welcome']}}});
test('each home derives its own four sequential additions and only reveals purchased art',()=>{
  assert.equal(typeof homes.getModel,'function');
  for(const id of ids)for(let stage=1;stage<=5;stage++){
    const snapshot=state(id,stage),before=JSON.stringify(snapshot),m=homes.getModel(id,snapshot);
    assert.equal(m.stage,stage);assert.equal(m.projects.filter(p=>p.built).length,stage-1);
    assert.equal(m.projects.filter(p=>p.available).length,stage<5?1:0);
    assert.deepEqual(m.projects.map(p=>p.cost),[16,24,40,60]);
    const html=homes.markup({gameId:id,snapshot});
    assert(html.includes(`data-home-id="${id}"`));
    assert.equal((html.match(/data-home-built=/g)||[]).length,stage-1);
    assert(html.includes('data-rabbit-decoration="welcome"'));assert(!html.includes('data-rabbit-decoration="together"'));
    assert.equal(JSON.stringify(snapshot),before);
  }
});
test('collaboration prices require every ingredient and preview never spends or constructs',()=>{
  assert.equal(typeof homes.getModel,'function');
  const snapshot=state('number-pop',2,{'number-pop':100,'block-match':7,'flash-brain':4});
  const before=JSON.stringify(snapshot),m=homes.getModel('number-pop',snapshot);
  assert.equal(m.projects[1].affordable,false);
  assert.equal(homes.getDialogue('number-pop',snapshot,1).count,1);
  assert.equal(homes.getDialogue('number-pop',snapshot,1).material,'Timber');
  const html=homes.markup({gameId:'number-pop',snapshot,mode:'build',projectId:'greenhouse'});
  const timberSource=html.match(/<button[^>]*data-material-source="block-match"[^>]*>/)[0];
  assert.match(timberSource,/aria-label="Find materials: Timber 7 \/ 8"/);
  assert(html.includes('data-rabbit-confirm="greenhouse" disabled'));
  assert(html.includes('data-material-source="flash-brain"'));
  assert(!html.includes('data-home-built="greenhouse"'));
  assert.equal(JSON.stringify(snapshot),before);
});
test('all homes expose their own art and accessible recipe travel, play chat and build actions',()=>{
  assert.equal(typeof homes.markup,'function');
  const config=require('../shared/toenow-homes-config.js');
  for(const id of ids){
    const c=config.get(id),html=homes.markup({gameId:id,snapshot:state(id),mode:'build',projectId:'decor'});
    for(const asset of [c.background,c.character,c.atlas])assert(html.includes(asset),`${id}: ${asset}`);
    for(const action of ['play','chat','build'])assert(html.includes(`data-rabbit-action="${action}"`));
    assert(html.includes('aria-label="'));assert(html.includes(c.place));
    if(id!=='number-pop')assert(!html.includes('Rabbit Harvest Garden'));
  }
});
test('chat cycles through varied ambient lines while preserving missing, ready and completed context',()=>{
  assert.equal(typeof homes.getDialogue,'function');
  for(const id of ids){
    const lines=Array.from({length:12},(_,i)=>homes.getDialogue(id,state(id),i).text);
    assert(new Set(lines).size>=6,id);
    const rich=Object.fromEntries(ids.map(key=>[key,100]));
    assert.equal(homes.getDialogue(id,state(id,1,rich),1).count,0);
    assert.notEqual(homes.getDialogue(id,state(id,5),1).text,homes.getDialogue(id,state(id),1).text);
  }
});
test('invalid homes fail gracefully and translated notices are escaped',()=>{
  assert.equal(typeof homes.markup,'function');
  assert.equal(homes.getModel('not-a-home',{}),null);assert.equal(homes.markup({gameId:'not-a-home'}),'');
  const html=homes.markup({gameId:'ball-track',notice:'<unsafe>',t:s=>s==='Build & decorate'?'建造與裝飾':s});
  assert(html.includes('建造與裝飾'));assert(html.includes('&lt;unsafe&gt;'));assert(!html.includes('<unsafe>'));
});
test('Traditional Chinese config translation fills gaps in the existing Hub translator',()=>{
  assert.equal(typeof homes.markup,'function');
  const config=require('../shared/toenow-homes-config.js'),c=config.get('ball-track');
  const html=homes.markup({gameId:'ball-track',language:'zh-Hant',t:s=>s});
  assert(config.entries[c.place]);assert(html.includes(config.entries[c.place]));
  assert(!html.includes(`>${c.place}</h2>`));
});
test('malformed save values do not unlock or afford construction and unowned decorations stay hidden',()=>{
  assert.equal(typeof homes.getModel,'function');
  const snapshot={homes:{'ball-track':{stage:'5',owned:[],placed:['welcome']}},balances:{'ball-track':Infinity}};
  const model=homes.getModel('ball-track',snapshot);
  assert.equal(model.stage,1);assert.equal(model.balance,0);assert(!model.projects[0].affordable);
  assert(!homes.markup({gameId:'ball-track',snapshot}).includes('data-rabbit-decoration="welcome"'));
});
test('visitors with built homes are welcomed back even after spending every material',()=>{
  const config=require('../shared/toenow-homes-config.js');
  for(const id of ids)assert.equal(homes.getDialogue(id,state(id,2),0).text,config.get(id).chat.returning);
});
