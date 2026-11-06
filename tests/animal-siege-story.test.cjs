const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../games/animal-siege/story.js');
const E = require('../games/animal-siege/engine.js');
const H = require('../games/animal-siege/hero.js');
function win(run) { const b=S.beginBattle(run); assert.ok(b); b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0); b.result='victory';b.phase='finished';assert.equal(S.completeBattle(run,b),true);return b; }
test('five sequential story chapters unlock once and reward a growing fixed hero',()=>{
  const r=S.create();assert.equal(r.hero.id,'hazel');assert.equal(S.CHAPTERS.length,5);assert.equal(S.advance(r),false);
  for(let n=1;n<=5;n++){
    assert.equal(S.chapter(r).number,n);
    if(n===3)assert.equal(H.chooseTalent(r.hero,'guardian'),true);
    const gold=r.gold;const b=win(r);assert.equal(r.gold,gold+S.CHAPTERS[n-1].reward.gold);
    assert.equal(S.completeBattle(r,b),false);assert.equal(r.story.cleared.length,n);
    if(n<5){assert.equal(r.result,null);assert.equal(S.beginBattle(r),null);assert.equal(S.advance(r),true);assert.equal(S.advance(r),false);}
  }
  assert.equal(r.result,'victory');assert.equal(r.hero.level,5);assert.equal(r.hero.inventory.length,6);assert.equal(S.advance(r),false);
});
test('third chapter requires a talent choice; the current chapter owns its battle',()=>{
  const r=S.create();win(r);S.advance(r);win(r);S.advance(r);assert.equal(S.beginBattle(r),null);
  H.chooseTalent(r.hero,'sage');const b=S.beginBattle(r);assert.ok(b);
  const prior=JSON.stringify(r);assert.equal(S.completeBattle(r,structuredClone(b)),false);assert.equal(JSON.stringify(r),prior);
  assert.equal(S.completeBattle(r,b),false,'unfinished combat cannot settle');
});
test('defeat and retreat restore prebattle choices, troops, resources and mana without losing prior chapters',()=>{
  for(const outcome of ['defeat','retreat']){
    const r=S.create();win(r);S.advance(r);S.claimSupply(r,'reinforcements');r.hero.mana=3;
    const before=structuredClone({army:r.army,gold:r.gold,wood:r.wood,hero:r.hero,cleared:r.story.cleared});
    const b=S.beginBattle(r);for(const u of b.units)u.hp=0;b.commanders.player.mana=0;b.result=outcome;b.phase='finished';
    assert.equal(S.completeBattle(r,b),true);assert.deepEqual({army:r.army,gold:r.gold,wood:r.wood,hero:r.hero,cleared:r.story.cleared},before);
    assert.equal(r.activeBattle,null);assert.equal(r.result,null);assert.ok(S.beginBattle(r));
  }
});
test('supplies are one choice per chapter and cannot be claimed during combat or after victory',()=>{
  const r=S.create();const before=structuredClone(r.army);assert.equal(S.claimSupply(r,'bad'),false);
  assert.equal(S.claimSupply(r,'reinforcements'),true);for(const k of Object.keys(E.TYPES))assert.equal(r.army[k],before[k]+E.TYPES[k].hp*2);
  assert.equal(S.claimSupply(r,'gold'),false);const b=S.beginBattle(r);assert.equal(S.claimSupply(r,'wood'),false);
  b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.result='victory';S.completeBattle(r,b);assert.equal(S.claimSupply(r,'gold'),false);
});
test('safe checkpoints resume a map and protect against malformed or unavailable storage',()=>{
  const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  const r=S.create();win(r);S.advance(r);assert.equal(S.save(storage,r),true);const restored=S.load(storage);
  assert.equal(restored.story.chapter,2);assert.deepEqual(restored.hero,r.hero);assert.equal(restored.activeBattle,null);
  const army=structuredClone(r.army);const b=S.beginBattle(r);b.units[0].hp=1;b.commanders.player.mana=0;assert.equal(S.save(storage,r),true);
  assert.deepEqual(S.load(storage).army,army);assert.equal(S.load(storage).activeBattle,null);
  for(const bad of ['{',JSON.stringify({version:99}),JSON.stringify({version:1,run:{}})]){memory.set(S.STORAGE_KEY,bad);assert.equal(S.load(storage),null);}
  const broken={getItem(){throw Error('blocked');},setItem(){throw Error('full');}};assert.equal(S.load(broken),null);assert.equal(S.save(broken,r),false);
});
test('chapter maps have valid deployment, distinct factions and a final enemy commander',()=>{
  const r=S.create();
  for(let n=1;n<=5;n++){
    if(n===3)H.chooseTalent(r.hero,'guardian');const b=S.beginBattle(r);assert.equal(b.storyChapter,n);assert.equal(b.storyFaction,S.chapter(r).faction);
    for(const u of b.units)assert.equal(E.blocked(b,u.x,u.y),false);
    assert.equal(!!b.commanders.enemy,n===5);b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.result='victory';S.completeBattle(r,b);if(n<5)S.advance(r);
  }
});
test('chapter rewards refill newly equipped mana and preserve healed surviving soldiers',()=>{
  const r=S.create();win(r);S.advance(r);r.army.beaver=49;
  const b=S.beginBattle(r);b.units.find(u=>u.id==='p-beaver').hp=60;
  b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.result='victory';S.completeBattle(r,b);
  assert.equal(r.army.beaver,96,'five healed soldiers plus three reinforcements');
  assert.equal(r.hero.mana,H.stats(r.hero).maxMana,'reward charm included in camp refill');
});
test('both talents complete all five chapters with legal orders and hero spells',()=>{
  const {chooseAction}=require('../tools/lib/animal-siege-driver.cjs');
  for(const talent of ['guardian','sage']){
    const r=S.create();
    for(let n=1;n<=5;n++){
      if(n===3)H.chooseTalent(r.hero,talent);S.claimSupply(r,'reinforcements');const b=S.beginBattle(r);
      for(let step=0;step<300&&!b.result;step++){
        if(b.phase==='enemy'){H.enemyCast(b);if(!b.result)E.enemyStep(b);continue;}
        let cast=false;
        for(const spell of ['bolt','shield','heal']){const target=b.units.filter(u=>H.canCast(b,spell,u.id)).sort((a,z)=>a.hp-z.hp)[0];if(target){H.castSpell(b,spell,target.id);cast=true;break;}}
        if(cast||b.result)continue;
        const action=chooseAction(b);if(!action){E.endPlayerTurn(b);continue;}
        const u=b.units.find(u=>u.id===action.id);if(u.x!==action.x||u.y!==action.y)assert.equal(E.move(b,u.id,action.x,action.y),true);
        assert.equal(action.target?E.attack(b,u.id,action.target):E.defend(b,u.id),true);
      }
      assert.equal(b.result,'victory',talent+' chapter '+n);assert.ok(b.round<=12);
      assert.equal(S.completeBattle(r,b),true);if(n<5)S.advance(r);
    }
    assert.equal(r.result,'victory');
  }
});
