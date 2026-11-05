const {test}=require('node:test');
const assert=require('node:assert/strict');
const Coach=require('../games/animal-siege/battle-coach.js');
const context={phase:'player',selected:{id:'p-beaver',moved:false,acted:false},hasUnacted:true};
test('cancelling the attack popup returns a guided rehearsal to choosing a target',()=>{
  const c=Coach.create();c.beginLesson();c.choose();c.previewMove();c.target();assert.equal(c.allows('attack'),true);
  c.cancelTarget();assert.equal(c.allows('target'),true);assert.equal(c.allows('attack'),false);
  c.target();assert.equal(c.allows('attack'),true);c.attack();c.cancelTarget();assert.equal(c.allows('end-turn'),true,'cancelling cannot rewind a committed attack');
});
test('battle coach follows reversible real actions and completes only after an attack and end turn',()=>{
  const values=new Map([['animal_siege_best_score_v1','17']]),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},c=Coach.create(storage);
  c.begin();assert.equal(c.view(context).step,'select');c.choose();assert.equal(c.view(context).step,'move');
  assert.equal(c.view({...context,plannedMove:true}).step,'confirm-move');assert.equal(c.view(context).step,'move');
  const moved={...context,selected:{...context.selected,moved:true}};
  assert.equal(c.view({...moved,targets:0}).step,'no-target');assert.equal(c.view({...moved,targets:1}).step,'target');
  assert.equal(c.view({...context,ready:true}).step,'attack','attacking without moving is supported');
  c.endTurn();assert.equal(c.active,true,'ending without attacking cannot falsely complete the lesson');
  c.attack();assert.equal(c.view(context).step,'end-turn');c.endTurn();assert.equal(c.active,false);
  assert.equal(values.get(Coach.KEY),'completed');assert.equal(values.get('animal_siege_best_score_v1'),'17');
  const next=Coach.create(storage);next.begin();assert.equal(next.active,false);
});
test('skip persists and manual replay works without clearing completion or changing a battle',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},c=Coach.create(storage);
  c.begin();c.skip();assert.equal(values.get(Coach.KEY),'skipped');c.begin();assert.equal(c.active,false);
  c.replay(true);assert.equal(c.active,true);assert.equal(c.view(context).step,'select');assert.equal(values.get(Coach.KEY),'skipped');
  c.stop();c.replay(false);assert.equal(c.active,false);c.begin();assert.equal(c.active,true,'map replay waits for the next battle');
});
test('pause, feedback and end screens hide the coach; enemy turns provide an observation hint',()=>{
  const c=Coach.create();c.begin();assert.equal(c.view({...context,paused:true}),null);assert.equal(c.view({...context,busy:true}),null);assert.equal(c.view({...context,result:'victory'}),null);
  assert.equal(c.view({...context,phase:'enemy'}).step,'wait');assert.equal(c.view({...context,hasUnacted:false}).step,'end-turn');
  c.attack();c.end('victory');c.begin();assert.equal(c.active,false,'victory can complete the lesson before the next end turn');
});
test('unavailable storage cannot interrupt gameplay and session completion is remembered in memory',()=>{
  const c=Coach.create({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
  c.begin();c.skip();c.begin();assert.equal(c.active,false);c.replay(true);assert.equal(c.active,true);
});

test('hands-on lesson gates each real action and waits for the enemy observation before completion',()=>{
  const values=new Map(),c=Coach.create({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)});
  assert.equal(c.needsLesson,true);c.beginLesson();
  assert.equal(c.allows('attack'),false);assert.equal(c.allows('choose'),true);
  c.endTurn();assert.equal(c.view(context).step,'select','cannot skip ahead by ending a turn');
  c.choose();assert.equal(c.view(context).step,'move');
  c.previewMove();assert.equal(c.view(context).step,'target');
  c.target();assert.equal(c.view(context).step,'attack');
  c.attack();assert.equal(c.view(context).step,'end-turn');
  c.endTurn();assert.equal(c.view({...context,phase:'enemy'}).step,'wait');
  assert.notEqual(values.get(Coach.KEY),'completed');
  c.observe();assert.equal(values.get(Coach.KEY),'completed');assert.equal(c.needsLesson,false);
});

test('lesson fixture supports a legal move and combined attack, then a safe enemy response',()=>{
  const E=require('../games/animal-siege/engine.js'),s=Coach.createLessonBattle(E);
  const original=structuredClone(s),a=s.units.find(u=>u.id==='p-beaver');
  assert.equal(E.move(s,a.id,3,1),true);assert.equal(E.attack(s,a.id,'e-fox'),true);
  assert.equal(s.result,null);assert.equal(E.endPlayerTurn(s),true);
  while(s.phase==='enemy')E.enemyStep(s);
  assert.equal(s.result,null);assert.ok(a.hp>0);assert.equal(original.round,1);
});

test('skipping the hands-on lesson remembers the choice and replay permits every step again',()=>{
  const c=Coach.create();c.beginLesson();c.choose();c.skip();assert.equal(c.needsLesson,false);
  c.beginLesson();assert.equal(c.view(context).step,'select');assert.equal(c.allows('move'),false);
  c.stop();assert.equal(c.isLesson,false);
});
