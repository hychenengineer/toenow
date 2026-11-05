const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../games/animal-siege/campaign.js');
const E=require('../games/animal-siege/engine.js');
function win(run,id){const battle=C.beginBattle(run,id);assert.ok(battle);battle.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);battle.result='victory';battle.phase='finished';assert.equal(C.completeBattle(run,battle),true);return battle;}
function clearTrail(run){C.explore(run,'cache');C.investigate(run,'cache');const b=C.beginTrailBattle(run,'cache');assert.ok(b);b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.result='victory';assert.equal(C.completeTrailBattle(run,b),true);return b;}

test('guarded trail reveals clues before guards and blocks treasure until a real victory',()=>{
  const r=C.create();assert.equal(C.beginTrailBattle(r,'cache'),null);assert.equal(C.claim(r,'cache','gold'),false);
  assert.equal(C.explore(r,'cache'),true);assert.equal(r.sites.cache.stage,'clues');assert.equal(C.claim(r,'cache','gold'),false);
  assert.equal(C.investigate(r,'cache'),true);assert.equal(C.investigate(r,'cache'),false);assert.equal(r.sites.cache.stage,'guards');
  const guardHP=structuredClone(r.sites.cache.guardHP),b=C.beginTrailBattle(r,'cache');assert.equal(b.kind,'trail');assert.equal(b.siteId,'cache');assert.deepEqual(b.walls,[]);
  for(const u of b.units)assert.equal(u.hp,u.team==='player'?r.army[u.kind]:guardHP[u.kind]);
  assert.equal(C.recruit(r,'beaver',1),false);assert.equal(C.completeBattle(r,b),false,'trail combat cannot settle as a fort');
  b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.result='victory';assert.equal(C.completeTrailBattle(r,b),true);
  assert.equal(r.sites.cache.stage,'loot');assert.equal(r.gold,90);assert.equal(C.captured(r),0);assert.equal(C.completeTrailBattle(r,b),false);
  assert.equal(C.claim(r,'cache','gold'),true);assert.equal(r.gold,170);assert.equal(r.sites.cache.stage,'claimed');assert.equal(C.claim(r,'cache','wood'),false);
  assert.equal(C.beginTrailBattle(r,'cache'),null);
});

test('trail retreats retain both armies and reject stale battles without rerolling guards',()=>{
  const r=C.create();C.explore(r,'cache');C.investigate(r,'cache');const b=C.beginTrailBattle(r,'cache');
  b.units.find(u=>u.id==='p-beaver').hp=13;b.units.find(u=>u.id==='e-fox').hp=9;b.result='retreat';
  assert.equal(C.completeTrailBattle(r,b),true);assert.equal(r.army.beaver,13);assert.equal(r.sites.cache.guardHP.fox,9);assert.equal(r.sites.cache.stage,'guards');assert.equal(r.gold,90);
  const next=C.beginTrailBattle(r,'cache');assert.equal(next.units.find(u=>u.id==='p-beaver').hp,13);assert.equal(next.units.find(u=>u.id==='e-fox').hp,9);
  assert.equal(C.completeTrailBattle(r,b),false);assert.equal(C.claim(r,'cache','wood'),false);
});

test('inaccessible guarded loot cannot keep a wiped expedition alive',()=>{
  const r=C.create();r.army={beaver:0,fox:0,squirrel:0};r.gold=0;r.sites.timber.claimed=true;r.sites.friends.claimed=true;
  assert.equal(C.canRecover(r),false);assert.equal(C.beginTrailBattle(r,'cache'),null);
  r.sites.cache.cleared=true;r.sites.cache.stage='loot';r.sites.cache.revealed=true;assert.equal(C.canRecover(r),true);
  assert.equal(C.claim(r,'cache','wood'),true);assert.equal(r.result,'defeat','choosing wood cannot revive an empty army');
});

test('preparation follows surviving defenders and quotes real recruitment and training budgets without spending',()=>{
  const r=C.create(),before=structuredClone(r),p=C.preparation(r,'acorn');
  assert.deepEqual([p.main,p.counter,p.defenders,p.recruitCost,p.goldAfterRecruit,p.woodNeeded],['fox','beaver',19,60,30,10]);
  assert.deepEqual(r,before,'reading the scout report cannot spend resources');
  r.forts.acorn.hp.fox=8;r.forts.acorn.hp.squirrel=30;
  const changed=C.preparation(r,'acorn');assert.equal(changed.main,'squirrel');assert.equal(changed.counter,'fox');
  assert.equal(changed.recruitCost,75);assert.equal(C.prepare(r,'acorn'),true);assert.equal(r.planFort,'acorn');
  assert.equal(C.prepare(r,'tower'),false,'locked forts cannot replace the next objective');
  win(r,'acorn');assert.equal(r.planFort,'river');assert.equal(C.preparation(r,'acorn'),null);
});

test('battle report counts deployed troops, exact losses, actual counter damage and paid rewards once',()=>{
  const r=C.create();r.army.beaver=13;const b=C.beginBattle(r,'acorn');
  const defender=b.units.find(u=>u.id==='e-fox');defender.hp=8;defender.x=2;defender.y=1;
  assert.equal(E.attack(b,'p-beaver','e-fox'),true);b.units.find(u=>u.id==='p-beaver').hp=12;
  for(const u of b.units.filter(u=>u.team==='enemy'))u.hp=0;
  assert.equal(C.completeBattle(r,b),true);const report=structuredClone(r.battleReport);
  assert.equal(report.outcome,'victory');assert.deepEqual(report.player.beaver,{deployed:2,survived:1,lost:1,hpLost:1});
  assert.equal(report.enemy.fox.lost,11);assert.equal(report.counterHits,1);assert.equal(report.counterDamage,8);
  assert.deepEqual(report.reward,{gold:140,wood:40});assert.equal(C.completeBattle(r,b),false);assert.deepEqual(r.battleReport,report);
  C.recruit(r,'beaver',1);C.explore(r,'cache');assert.deepEqual(r.battleReport,report,'camp choices retain the last battle report');
  const next=C.beginBattle(r,'river');assert.equal(C.completeBattle(r,b),false);assert.deepEqual(r.battleReport,report);
  next.units.find(u=>u.id==='p-beaver').hp=0;assert.equal(C.completeBattle(r,next),true);
  assert.equal(r.battleReport.outcome,'retreat');assert.deepEqual(r.battleReport.reward,{gold:0,wood:0});
  assert.equal(r.battleReport.player.beaver.deployed,2);assert.equal(r.battleReport.player.beaver.lost,2);
});

test('whole battle counter totals include attacks older than the eight-entry journal',()=>{
  const r=C.create();r.forts.acorn.hp.fox=1200;const b=C.beginBattle(r,'acorn');
  const attacker=b.units.find(u=>u.id==='p-beaver'),target=b.units.find(u=>u.id==='e-fox');
  attacker.hp=12;target.x=2;target.y=1;
  for(let i=0;i<12;i++){attacker.acted=false;assert.equal(E.attack(b,attacker.id,target.id),true);}
  assert.equal(b.log.length,8);C.completeBattle(r,b);
  assert.equal(r.battleReport.counterHits,12);assert.equal(r.battleReport.counterDamage,84);
});

test('attacking a different available fort keeps its preparation after retreat',()=>{
  const r=C.create(),b=C.beginBattle(r,'river');assert.equal(r.planFort,'river');
  C.completeBattle(r,b);assert.equal(C.preparation(r).id,'river');
});
test('expedition starts with exact original army health and three distinct forts',()=>{
  const r=C.create();assert.deepEqual(r.army,{beaver:72,fox:32,squirrel:30});
  assert.equal(r.gold,90);assert.equal(r.wood,25);assert.equal(Object.keys(r.forts).length,3);
  assert.equal(C.beginBattle(r,'tower'),null);assert.ok(C.beginBattle(r,'acorn'));
});
test('one-time exploration supplies and recruitment spend resources without healing wounded survivors',()=>{
  const r=C.create();assert.equal(C.claim(r,'cache','gold'),false);
  clearTrail(r);assert.equal(C.claim(r,'cache','gold'),true);assert.equal(r.gold,170);
  assert.equal(C.claim(r,'cache','gold'),false);r.army.beaver=13;
  const before=r.gold;assert.equal(C.recruit(r,'beaver',3),true);assert.equal(r.army.beaver,49);assert.equal(r.gold,before-60);
  for(const n of [0,-1,1.5,NaN,Infinity,100000])assert.equal(C.recruit(r,'fox',n),false);
  assert.equal(C.recruit(r,'not-an-animal',1),false);
});
test('retreat and defeat keep exact health on both sides and reject stale or duplicate settlement',()=>{
  const r=C.create(),b=C.beginBattle(r,'acorn');r.gold=100;
  assert.equal(C.recruit(r,'fox',1),false);
  b.units.find(u=>u.id==='p-beaver').hp=13;b.units.find(u=>u.id==='p-fox').hp=0;b.units.find(u=>u.id==='e-fox').hp=17;
  assert.equal(C.completeBattle(r,b),true);assert.equal(r.army.beaver,13);assert.equal(r.army.fox,0);assert.equal(r.gold,100);
  assert.equal(C.completeBattle(r,b),false);const next=C.beginBattle(r,'acorn');
  assert.equal(next.units.find(u=>u.id==='e-fox').hp,17);assert.equal(next.units.find(u=>u.id==='p-beaver').hp,13);
  assert.equal(C.completeBattle(r,b),false,'old battle cannot settle new attempt');
  next.units.filter(u=>u.team==='player').forEach(u=>u.hp=0);next.result='defeat';assert.equal(C.completeBattle(r,next),true);
  assert.equal(r.army.beaver,0);assert.equal(r.result,null,'remaining gold permits recovery');
});
test('capturing both outer forts opens final fort and rewards cannot be farmed',()=>{
  const r=C.create(),before=r.gold,b=win(r,'acorn');assert.equal(r.gold,before+140);
  assert.equal(C.completeBattle(r,b),false);assert.equal(C.beginBattle(r,'acorn'),null);assert.equal(C.beginBattle(r,'tower'),null);
  win(r,'river');assert.ok(C.beginBattle(r,'tower'));const final=r.activeBattle;
  final.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);final.result='victory';assert.equal(C.completeBattle(r,final),true);
  assert.equal(r.result,'victory');assert.ok(C.score(r)>0);assert.equal(C.recruit(r,'beaver',1),false);
});
test('wiped armies can use hidden reinforcements; no army and no recovery ends the run',()=>{
  const r=C.create();r.army={beaver:0,fox:0,squirrel:0};r.gold=0;
  assert.equal(C.canRecover(r),true);assert.equal(C.beginBattle(r,'acorn'),null);
  C.explore(r,'friends');assert.equal(C.claim(r,'friends','squirrel'),true);assert.equal(r.army.squirrel,18);
  for(const id of ['cache','timber']){C.explore(r,id);C.claim(r,id,'wood');}
  const b=C.beginBattle(r,'acorn');b.units.filter(u=>u.team==='player').forEach(u=>u.hp=0);b.result='defeat';C.completeBattle(r,b);
  assert.equal(C.canRecover(r),false);assert.equal(r.result,'defeat');
});
test('training changes only the trained species and affects real range, movement and incoming damage',()=>{
  const r=C.create();r.wood=200;for(const kind of Object.keys(E.TYPES))assert.equal(C.upgrade(r,kind),true);
  assert.equal(C.upgrade(r,'fox'),false);const b=C.beginBattle(r,'acorn');
  assert.equal(E.stats(b.units.find(u=>u.id==='p-fox')).move,5);
  assert.equal(E.stats(b.units.find(u=>u.id==='p-squirrel')).range,5);
  assert.equal(E.stats(b.units.find(u=>u.id==='e-fox')).move,4);
  const beaver=b.units.find(u=>u.id==='p-beaver'),enemy=b.units.find(u=>u.id==='e-fox');
  assert.ok(E.damage(b,enemy,beaver)<E.damage(b,enemy,{...beaver,trained:false}));
  const archer=b.units.find(u=>u.id==='p-squirrel');b.walls=[];b.trees=[];archer.x=0;archer.y=0;enemy.x=5;enemy.y=0;
  assert.equal(E.canAttack(b,archer,enemy),true);assert.equal(E.canAttack(b,{...archer,trained:false},enemy),false);
});
test('spending the last discovery on wood ends a wiped run when recovery becomes impossible',()=>{
  const r=C.create();clearTrail(r);r.army={beaver:0,fox:0,squirrel:0};r.gold=0;r.sites.friends.claimed=true;
  C.explore(r,'cache');C.claim(r,'cache','wood');assert.equal(r.result,null);
  C.explore(r,'timber');C.claim(r,'timber','wood');assert.equal(r.result,'defeat');
});
