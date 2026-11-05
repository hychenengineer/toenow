const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../games/animal-siege/engine.js');
function duel(a,b){const s=E.createBattle();s.units=[E.unit('a','player',a,2,2,5),E.unit('b','enemy',b,3,2,5)];s.walls=[];s.trees=[];return s;}
test('ground movement follows a shortest legal path without crossing walls or units',()=>{
  const s=E.createBattle(),u=s.units.find(u=>u.id==='p-fox');const before=structuredClone(s);
  for(const end of E.reachable(s,u)){
    const path=E.movementPath(s,u,end.x,end.y);assert.equal(path.length,end.cost+1);assert.deepEqual(path[0],{x:u.x,y:u.y});assert.deepEqual(path.at(-1),{x:end.x,y:end.y});
    for(let i=1;i<path.length;i++){assert.equal(Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].y-path[i-1].y),1);assert.equal(E.blocked(s,path[i].x,path[i].y),false);assert.equal(E.occupant(s,path[i].x,path[i].y),undefined);}
  }
  assert.deepEqual(E.movementPath(s,u,5,2),[]);assert.deepEqual(s,before);
});
test('attack range exposes legal tiles, respects walls and trained range without mutating a move preview',()=>{
  const s=E.createBattle(),u=s.units.find(u=>u.kind==='squirrel'&&u.team==='player');
  const before=structuredClone(s),preview={...u,x:3,y:4,trained:true};
  const range=E.attackRange(s,preview);assert.ok(range.length>0);
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
    const expected=!E.blocked(s,x,y)&&(x!==preview.x||y!==preview.y)&&E.canAttack(s,preview,{team:'enemy',hp:1,x,y});
    assert.equal(range.some(p=>p.x===x&&p.y===y),expected,'tile '+x+','+y);
  }
  assert.deepEqual(s,before);assert.deepEqual(E.attackRange(s,{...u,hp:0}),[]);
});
test('attack feedback reports actual lost HP and units even for an overkill',()=>{
  const s=duel('beaver','fox');s.units[1].hp=1;assert.equal(E.attack(s,'a','b'),true);
  assert.deepEqual([s.last.hpBefore,s.last.hpAfter,s.last.actualDamage,s.last.loss],[1,0,1,1]);
});
test('counter chain rewards the same species on either side equally',()=>{
  for(const [a,b] of [['beaver','fox'],['fox','squirrel'],['squirrel','beaver']]){
    const s=duel(a,b),[attacker,target]=s.units;
    assert.ok(E.damage(s,attacker,target)>E.damage(s,attacker,{...target,kind:a}));
    const mirrored={...s,units:s.units.map(u=>({...u,team:u.team==='player'?'enemy':'player'}))};
    assert.equal(E.damage(s,attacker,target),E.damage(mirrored,mirrored.units[0],mirrored.units[1]));
  }
});
test('movement follows paths and cannot cross walls or occupied tiles',()=>{
  const s=E.createBattle(),u=s.units[0];
  assert.equal(E.move(s,u.id,5,2),false);
  assert.equal(E.move(s,u.id,s.units[1].x,s.units[1].y),false);
  assert.equal(E.move(s,u.id,2,1),true);
  assert.equal(E.move(s,u.id,3,1),false,'one move per turn');
  assert.ok(E.reachable(s,u).every(p=>p.cost<=E.TYPES[u.kind].move));
});
test('ranged attacks require clear sight and never damage allies',()=>{
  const s=duel('squirrel','beaver');s.units[0].x=1;s.units[1].x=5;s.walls=[[3,2]];
  assert.equal(E.canAttack(s,...s.units),false);
  s.walls=[];assert.equal(E.canAttack(s,...s.units),true);
  s.units[1].team='player';assert.equal(E.canAttack(s,...s.units),false);
});
test('attack consumes action; defending reduces damage until next own turn',()=>{
  const s=duel('beaver','fox');const [a,b]=s.units;
  const normal=E.damage(s,b,a);a.guarding=true;assert.ok(E.damage(s,b,a)<normal);
  const hp=b.hp;assert.equal(E.attack(s,a.id,b.id),true);assert.ok(b.hp<hp);
  assert.equal(E.attack(s,a.id,b.id),false);assert.equal(E.move(s,a.id,1,2),false);
  E.endPlayerTurn(s);assert.equal(s.phase,'enemy');
  while(s.phase==='enemy')E.enemyStep(s);
  if(s.phase==='player'){assert.equal(s.round,2);assert.equal(a.guarding,false);}
});
test('AI obeys terrain, finishes turns, and terminal battles reject further actions',()=>{
  const s=E.createBattle();E.endPlayerTurn(s);
  const original=s.units.filter(u=>u.team==='enemy').map(u=>[u.x,u.y]);
  for(let i=0;i<12&&s.phase==='enemy';i++)E.enemyStep(s);
  assert.equal(s.phase,'player');
  assert.notDeepEqual(s.units.filter(u=>u.team==='enemy').map(u=>[u.x,u.y]),original,'defenders must actually move or attack');
  for(const u of s.units.filter(u=>u.hp>0))assert.equal(E.blocked(s,u.x,u.y),false);
  assert.equal(new Set(s.units.filter(u=>u.hp>0).map(u=>u.x+','+u.y)).size,s.units.filter(u=>u.hp>0).length);
  const d=duel('fox','squirrel');d.units[1].hp=1;E.attack(d,'a','b');
  assert.equal(d.result,'victory');assert.equal(d.reward.gold,140);
  assert.equal(E.move(d,'a',1,2),false);assert.equal(E.endPlayerTurn(d),false);
});
test('five practice tiers scale defenders while keeping the board valid',()=>{
  let previous=0;
  for(const wave of [1,6,11,16,21]){
    const s=E.createBattle(wave);const total=s.units.filter(u=>u.team==='enemy').reduce((n,u)=>n+E.count(u),0);
    assert.ok(total>previous);previous=total;
    assert.ok(s.units.filter(u=>u.team==='player').reduce((n,u)=>n+E.count(u),0)<total);
  }
});
test('the smaller starting army can capture the fort through legal movement and counters',()=>{
  const s=E.createBattle();
  for(const [round,id,x,y,target] of require('./fixtures/animal-siege-plan.json')){
    while(s.round<round){assert.equal(E.endPlayerTurn(s),true);while(s.phase==='enemy')E.enemyStep(s);}
    const u=s.units.find(u=>u.id===id);
    if(u.x!==x||u.y!==y)assert.equal(E.move(s,id,x,y),true);
    assert.equal(target?E.attack(s,id,target):E.defend(s,id),true);
  }
  assert.equal(s.result,'victory');assert.equal(s.round,8);
  assert.equal(s.units.filter(u=>u.team==='player').reduce((n,u)=>n+E.count(u),0),7);
});
test('Expedition battles do not add a locked place to the existing exploration route',()=>{
  const levels=require('../shared/toenow-levels.js');
  const values={};const storage={getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v};
  const flow=require('../shared/toenow-exploration.js').create({storage,levels,gameIds:Object.keys(levels.GAME_STORAGE_KEYS)});
  assert.equal(levels.GAME_STORAGE_KEYS['animal-siege'].island,'expedition');
  assert.equal(flow.snapshot().order.length,10);
  assert.equal(flow.snapshot().order.includes('animal-siege'),false);
});
