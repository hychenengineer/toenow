(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.AnimalHero=factory(root.AnimalSiege);})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const FACTIONS={
    forest:{id:'forest',name:'Forest Alliance',nameZh:'森林聯盟',description:'Balanced woodland squads. Use the unit counter matchups to break their formation.',descriptionZh:'均衡的森林部隊。運用兵種克制，突破對方陣形。'},
    rock:{id:'rock',name:'Rock Guard',nameZh:'岩山守軍',description:'Squads take 15% less attack and spell damage.',descriptionZh:'部隊受到的攻擊與法術傷害減少 15%。',damageMultiplier:.85},
    moon:{id:'moon',name:'Moonshade',nameZh:'月影軍',description:'Squads gain 1 movement.',descriptionZh:'部隊移動距離增加 1。',move:1}
  };
  const HERO={id:'hazel',name:'Hazel',nameZh:'榛葉',kind:'fox',faction:'forest',description:'A fox commander who protects the forest from behind the lines.',descriptionZh:'在後方指揮、守護森林的狐狸英雄。',passive:{id:'shelter',name:'Forest Shelter',nameZh:'森林庇護',description:'One front-line squad takes 20% less damage until your next turn.',descriptionZh:'一隊前排部隊在你的下回合前受到的傷害減少 20%。'}};
  const SPELLS={
    heal:{id:'heal',name:'Mend',nameZh:'治療',description:'Restore injured living soldiers. Fallen soldiers stay lost.',descriptionZh:'治療存活士兵的傷勢，不復活陣亡士兵。',target:'ally',cost:4,level:2},
    shield:{id:'shield',name:'Leaf Shield',nameZh:'葉之護盾',description:'Take 40% less damage until the caster’s next turn.',descriptionZh:'在施法者的下回合前受到的傷害減少 40%。',target:'ally',cost:3,level:2},
    bolt:{id:'bolt',name:'Magic Arrow',nameZh:'魔法箭',description:'Deal direct damage to one enemy squad.',descriptionZh:'直接傷害一隊敵軍。',target:'enemy',cost:4,level:2},
    haste:{id:'haste',name:'Haste',nameZh:'加速',description:'Gain 2 movement until the caster’s next turn.',descriptionZh:'在施法者的下回合前移動距離增加 2。',target:'ally',cost:3,level:3},
    slow:{id:'slow',name:'Slow',nameZh:'緩速',description:'Lose 2 movement, minimum 1, until the caster’s next turn.',descriptionZh:'在施法者的下回合前移動距離減少 2，最低為 1。',target:'enemy',cost:3,level:4},
    inspire:{id:'inspire',name:'Inspire',nameZh:'鼓舞',description:'The next attack deals 50% more damage, until the caster’s next turn.',descriptionZh:'在施法者的下回合前，下一次攻擊傷害增加 50%。',target:'ally',cost:3,level:4}
  };
  const EQUIPMENT={
    oakStaff:{id:'oakStaff',slot:'weapon',name:'Oak Staff',nameZh:'橡木法杖',description:'+3 spell power.',descriptionZh:'法強 +3。',stat:'power',value:3},
    thornWand:{id:'thornWand',slot:'weapon',name:'Thorn Wand',nameZh:'荊棘短杖',description:'+3 army attack.',descriptionZh:'部隊攻擊 +3。',stat:'attack',value:3},
    dawnStaff:{id:'dawnStaff',slot:'weapon',name:'Dawn Staff',nameZh:'曙光法杖',description:'+6 spell power.',descriptionZh:'法強 +6。',stat:'power',value:6},
    riverCharm:{id:'riverCharm',slot:'charm',name:'River Charm',nameZh:'河流護符',description:'+5 maximum mana.',descriptionZh:'魔力上限 +5。',stat:'maxMana',value:5},
    leafCharm:{id:'leafCharm',slot:'charm',name:'Leaf Charm',nameZh:'綠葉護符',description:'+3 army defense.',descriptionZh:'部隊防禦 +3。',stat:'defense',value:3},
    moonCharm:{id:'moonCharm',slot:'charm',name:'Moon Charm',nameZh:'月光護符',description:'+9 maximum mana.',descriptionZh:'魔力上限 +9。',stat:'maxMana',value:9}
  };
  const TALENTS={
    guardian:{id:'guardian',name:'Guardian',nameZh:'守護者',description:'+4 army defense. Choose one permanent talent at level 3.',descriptionZh:'部隊防禦 +4。等級 3 可選擇一個永久天賦。'},
    sage:{id:'sage',name:'Sage',nameZh:'賢者',description:'Spells cost 1 less mana, minimum 1. Choose once at level 3.',descriptionZh:'法術消耗減少 1 魔力，最低為 1。等級 3 可永久選擇一次。'}
  };
  const clampLevel=level=>Math.max(1,Math.min(5,Math.floor(Number(level)||1)));
  function stats(hero){
    const l=clampLevel(hero?.level),result={attack:2+l-1,defense:2+l-1,power:8+(l-1)*3,maxMana:14+(l-1)*3};
    for(const slot of ['weapon','charm']){const item=EQUIPMENT[hero?.equipment?.[slot]];if(item&&item.slot===slot)result[item.stat]+=item.value;}
    if(hero?.talent==='guardian')result.defense+=4;return result;
  }
  function createHero(level=1){const l=clampLevel(level),known=Object.keys(SPELLS).filter(id=>SPELLS[id].level<=l),h={id:HERO.id,level:l,mana:0,knownSpells:known,loadout:known.slice(0,3),inventory:[],equipment:{weapon:null,charm:null},talent:null};h.mana=stats(h).maxMana;return h;}
  function levelUp(hero,level){const l=clampLevel(level);if(!hero||l<=hero.level)return false;hero.level=l;hero.knownSpells=Object.keys(SPELLS).filter(id=>SPELLS[id].level<=l);for(const id of hero.knownSpells)if(hero.loadout.length<3&&!hero.loadout.includes(id))hero.loadout.push(id);hero.mana=stats(hero).maxMana;return true;}
  function chooseTalent(hero,id){if(!hero||hero.level<3||hero.talent||!TALENTS[id])return false;hero.talent=id;return true;}
  function equip(hero,id){const item=EQUIPMENT[id];if(!hero||!item||!hero.inventory.includes(id))return false;hero.equipment[item.slot]=id;hero.mana=Math.min(hero.mana,stats(hero).maxMana);return true;}
  function toggleSpell(hero,id){if(!hero||!SPELLS[id]||!hero.knownSpells.includes(id)||SPELLS[id].level>hero.level)return false;const index=hero.loadout.indexOf(id);if(index>=0){hero.loadout.splice(index,1);return true;}if(hero.loadout.length>=3)return false;hero.loadout.push(id);return true;}
  function spellCost(hero,id){return SPELLS[id]?Math.max(1,SPELLS[id].cost-(hero?.talent==='sage'?1:0)):Infinity;}
  function attach(state,hero,enemyHero=null){
    const copy=h=>h?JSON.parse(JSON.stringify(h)):null;
    state.commanders={player:copy(hero),enemy:copy(enemyHero)};
    for(const team of ['player','enemy']){
      const commander=state.commanders[team],values=commander?stats(commander):{attack:0,defense:0};
      const faction=team==='player'?(commander?.faction||HERO.faction):(commander?.faction||state.storyFaction||'forest');
      for(const u of state.units.filter(u=>u.team===team)){u.commander={attack:values.attack,defense:values.defense,faction};u.maxHp=E.count(u)*E.TYPES[u.kind].hp;u.statuses=[];}
      if(commander){commander.castRound=0;commander.mana=Math.min(commander.mana,stats(commander).maxMana);
        const front=state.units.filter(u=>u.team===team&&u.hp>0).sort((a,b)=>(a.kind==='beaver'?-1:0)-(b.kind==='beaver'?-1:0)||(team==='player'?b.x-a.x:a.x-b.x))[0];
        if(front&&faction==='forest')front.statuses.push({id:'shelter',sourceTeam:team,expiresRound:state.round+1,value:.8});
      }
    }return state;
  }
  function canCast(state,id,targetId,team='player'){
    const hero=state?.commanders?.[team],spell=SPELLS[id],target=state?.units?.find(u=>u.id===targetId);
    if(!hero||!spell||!target||target.hp<=0||state.result||state.phase!==team||hero.castRound===state.round||hero.level<spell.level||!hero.knownSpells.includes(id)||!hero.loadout.includes(id)||hero.mana<spellCost(hero,id))return false;
    if((spell.target==='ally')!==(target.team===team))return false;
    if(id==='heal'&&target.hp>=Math.min(target.maxHp||target.hp,E.count(target)*E.TYPES[target.kind].hp))return false;
    return true;
  }
  function castSpell(state,id,targetId,team='player'){
    if(!canCast(state,id,targetId,team))return false;
    const hero=state.commanders[team],target=state.units.find(u=>u.id===targetId),power=stats(hero).power,before=target.hp;
    hero.mana-=spellCost(hero,id);hero.castRound=state.round;
    if(id==='heal')target.hp=Math.min(target.maxHp,E.count(target)*E.TYPES[target.kind].hp,target.hp+10+power*2);
    else if(id==='bolt'){
      const reduction=(target.commander?.faction==='rock'?.85:1)*(target.statuses||[]).filter(s=>s.id==='shield'||s.id==='shelter').reduce((value,s)=>value*s.value,1);
      target.hp=Math.max(0,target.hp-Math.max(1,Math.floor((12+power*2)*reduction)));E.settle(state);
    }else{const values={shield:.6,haste:2,slow:-2,inspire:1.5};target.statuses=target.statuses.filter(s=>s.id!==id);target.statuses.push({id,sourceTeam:team,expiresRound:state.round+1,value:values[id]});}
    state.heroLast={type:'spell',team,spellId:id,targetId,hpBefore:before,hpAfter:target.hp,actualDamage:Math.max(0,before-target.hp),healed:Math.max(0,target.hp-before),round:state.round};return true;
  }
  function enemyCast(state){
    const hero=state?.commanders?.enemy;if(!hero||state.phase!=='enemy'||state.result)return false;
    const living=state.units.filter(u=>u.hp>0),priority=['heal','bolt','slow','inspire','haste','shield'];
    for(const id of priority){const targets=living.filter(u=>canCast(state,id,u.id,'enemy')).sort((a,b)=>id==='bolt'?a.hp-b.hp:(b.maxHp-b.hp)-(a.maxHp-a.hp));if(targets.length)return castSpell(state,id,targets[0].id,'enemy');}return false;
  }
  return {FACTIONS,HERO,SPELLS,EQUIPMENT,TALENTS,createHero,stats,levelUp,chooseTalent,equip,toggleSpell,attach,spellCost,canCast,castSpell,enemyCast};
});
