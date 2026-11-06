const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../games/animal-siege/engine.js');
const H=require('../games/animal-siege/hero.js');
function battle(level=4,enemy=null){const s=E.createBattle();s.walls=[];s.trees=[];s.units=[E.unit('p','player','beaver',1,2,8),E.unit('p2','player','squirrel',0,4,5),E.unit('e','enemy','fox',2,2,12),E.unit('e2','enemy','beaver',7,5,5)];const h=H.createHero(level);h.loadout=['heal','bolt','shield'];H.attach(s,h,enemy);return s;}
function round(s){E.endPlayerTurn(s);while(s.phase==='enemy')E.enemyStep(s);}
test('Hazel progression unlocks spells once and uses distinct hero levels',()=>{
  const h=H.createHero();assert.equal(h.id,'hazel');assert.deepEqual(h.knownSpells,[]);assert.deepEqual(h.loadout,[]);
  const base=H.stats(h);assert.equal(H.levelUp(h,4),true);assert.ok(H.stats(h).power>base.power);assert.equal(h.knownSpells.length,6);h.mana=0;
  assert.equal(H.levelUp(h,4),false);assert.equal(h.mana,0);assert.equal(H.levelUp(h,3),false);assert.equal(h.level,4);
});
test('equipment enforces ownership and slots without unlimited mana refills',()=>{
  const h=H.createHero(4);h.inventory=['oakStaff','thornWand','riverCharm','leafCharm'];
  assert.equal(H.equip(h,'moonCharm'),false);assert.equal(H.equip(h,'oakStaff'),true);assert.equal(h.equipment.weapon,'oakStaff');
  assert.equal(H.equip(h,'thornWand'),true);assert.equal(h.equipment.weapon,'thornWand');h.mana=1;
  assert.equal(H.equip(h,'riverCharm'),true);assert.equal(h.mana,1);assert.equal(H.equip(h,'leafCharm'),true);assert.equal(h.mana,1);assert.equal(H.equip(h,'riverCharm'),true);assert.equal(h.mana,1);
});
test('one permanent talent and no more than three known spells can be equipped',()=>{
  const h=H.createHero(2);assert.equal(H.chooseTalent(h,'guardian'),false);H.levelUp(h,3);
  assert.equal(H.chooseTalent(h,'sage'),true);assert.equal(H.chooseTalent(h,'guardian'),false);assert.ok(H.spellCost(h,'bolt')<H.SPELLS.bolt.cost);
  h.loadout=['shield','heal','bolt'];assert.equal(H.toggleSpell(h,'haste'),false);assert.equal(H.toggleSpell(h,'heal'),true);assert.equal(H.toggleSpell(h,'haste'),true);assert.equal(H.toggleSpell(h,'slow'),false);
});
test('attach creates detached commanders and does not change old unit definitions',()=>{
  const h=H.createHero(3),enemy={...H.createHero(3),faction:'rock'},s=battle(3,enemy),old=JSON.stringify(E.TYPES);H.attach(s,h,enemy);
  s.commanders.player.mana=0;s.commanders.player.loadout.push('slow');assert.notEqual(h.mana,0);assert.equal(h.loadout.includes('slow'),false);
  assert.equal(s.units[0].maxHp,96);assert.equal(s.units[2].commander.faction,'rock');assert.equal(JSON.stringify(E.TYPES),old);
  const plain=E.createBattle();assert.equal(plain.commanders,undefined);assert.equal(plain.units[0].maxHp,undefined);
});
test('casts validate targets, mana, turn, unlocks and loadout before changing state',()=>{
  const s=battle();const before=structuredClone(s);assert.equal(H.castSpell(s,'bolt','p'),false);assert.equal(H.castSpell(s,'heal','e'),false);assert.equal(H.castSpell(s,'haste','p'),false);assert.deepEqual(s,before);
  const flags=s.units.map(u=>[u.moved,u.acted]);assert.equal(H.castSpell(s,'bolt','e'),true);assert.ok(s.commanders.player.mana<before.commanders.player.mana);assert.deepEqual(s.units.map(u=>[u.moved,u.acted]),flags);
  assert.equal(H.castSpell(s,'shield','p'),false);assert.equal(s.log.length,0);assert.equal(s.last,undefined);assert.equal(s.heroLast.spellId,'bolt');
  const poor=battle();poor.commanders.player.mana=0;assert.equal(H.castSpell(poor,'bolt','e'),false);poor.commanders.player.mana=99;poor.phase='enemy';assert.equal(H.castSpell(poor,'bolt','e'),false);
  poor.phase='player';poor.result='victory';assert.equal(H.castSpell(poor,'bolt','e'),false);
});
test('heal repairs living soldiers but cannot restore losses or resurrect a squad',()=>{
  const s=battle();s.units[0].hp=49;assert.equal(H.castSpell(s,'heal','p'),true);assert.equal(s.units[0].hp,60);
  const dead=battle();dead.units[0].hp=0;assert.equal(H.castSpell(dead,'heal','p'),false);
  const full=battle();assert.equal(H.castSpell(full,'heal','p'),false);
});
test('a squad deployed wounded can heal its surviving soldiers to full health',()=>{
  const s=E.createBattle(),u=s.units.find(u=>u.id==='p-beaver');u.hp=49;H.attach(s,H.createHero(2));
  assert.equal(u.maxHp,60);assert.equal(H.canCast(s,'heal',u.id),true);assert.equal(H.castSpell(s,'heal',u.id),true);
  assert.equal(u.hp,60);assert.equal(E.count(u),5);
});
test('casualties after wounded deployment lower the healing ceiling without resurrection',()=>{
  const s=E.createBattle(),u=s.units.find(u=>u.id==='p-beaver');u.hp=49;H.attach(s,H.createHero(2));u.hp=37;
  assert.equal(H.castSpell(s,'heal',u.id),true);assert.equal(u.hp,48);assert.equal(E.count(u),4);
  const fresh=battle();fresh.units[0].hp=13;assert.equal(H.castSpell(fresh,'heal','p'),true);assert.equal(fresh.units[0].hp,24);assert.equal(E.count(fresh.units[0]),2);
});
test('bolt settles a final kill immediately and rejects subsequent casts',()=>{
  const s=battle();s.units[2].hp=1;s.units[3].hp=0;assert.equal(H.castSpell(s,'bolt','e'),true);assert.equal(s.result,'victory');assert.equal(s.phase,'finished');assert.equal(H.castSpell(s,'shield','p'),false);
});
test('shield, haste and slow affect combat and expire at the caster next turn',()=>{
  const s=battle(),u=s.units[0],e=s.units[2];u.statuses=[];const normal=E.damage(s,e,u);assert.equal(H.castSpell(s,'shield','p'),true);assert.ok(E.damage(s,e,u)<normal);
  E.endPlayerTurn(s);assert.ok(u.statuses.some(x=>x.id==='shield'));while(s.phase==='enemy')E.enemyStep(s);assert.equal(u.statuses.length,0);
  const fast=battle();fast.commanders.player.loadout=['haste'];const move=E.stats(fast.units[0]).move;H.castSpell(fast,'haste','p');assert.equal(E.stats(fast.units[0]).move,move+2);round(fast);assert.equal(E.stats(fast.units[0]).move,move);
  const slow=battle();slow.commanders.player.loadout=['slow'];H.castSpell(slow,'slow','e');assert.equal(E.stats(slow.units[2]).move,2);round(slow);assert.equal(E.stats(slow.units[2]).move,4);
});
test('inspire boosts exactly the next attack and is consumed after it',()=>{
  const s=battle();s.commanders.player.loadout=['inspire'];const normal=E.damage(s,s.units[0],s.units[2]);H.castSpell(s,'inspire','p');assert.ok(E.damage(s,s.units[0],s.units[2])>normal);E.attack(s,'p','e');assert.equal(s.units[0].statuses.some(x=>x.id==='inspire'),false);
});
test('faction traits affect their own units and enemy spells obey mana, rounds and expiry',()=>{
  const enemy=H.createHero(4);enemy.faction='moon';enemy.loadout=['slow'];const s=battle(4,enemy);assert.equal(E.stats(s.units[2]).move,5);
  const rock=battle(4,{...enemy,faction:'rock'});assert.ok(E.damage(rock,rock.units[0],rock.units[2])<E.damage(s,s.units[0],s.units[2]));
  assert.equal(H.enemyCast(s),false);E.endPlayerTurn(s);assert.equal(H.enemyCast(s),true);assert.equal(H.enemyCast(s),false);assert.equal(s.heroLast.team,'enemy');assert.equal(s.log.length,0);
  const target=s.units.find(u=>u.statuses.some(x=>x.id==='slow'));assert.ok(target);while(s.phase==='enemy')E.enemyStep(s);assert.ok(target.statuses.some(x=>x.id==='slow'));E.endPlayerTurn(s);assert.equal(target.statuses.some(x=>x.id==='slow'),false);
  const empty=battle(4,enemy);E.endPlayerTurn(empty);empty.commanders.enemy.mana=0;assert.equal(H.enemyCast(empty),false);
});
test('classic fixture retains exact legal result without hero metadata',()=>{
  const s=E.createBattle();for(const [r,id,x,y,target] of require('./fixtures/animal-siege-plan.json')){while(s.round<r)round(s);const u=s.units.find(u=>u.id===id);if(u.x!==x||u.y!==y)assert.equal(E.move(s,id,x,y),true);assert.equal(target?E.attack(s,id,target):E.defend(s,id),true);}assert.equal(s.result,'victory');assert.equal(s.round,8);assert.equal(s.units.filter(u=>u.team==='player').reduce((n,u)=>n+E.count(u),0),7);
});
