(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'),require('./campaign.js'),require('./hero.js'));
  else root.AnimalHeroStory=factory(root.AnimalSiege,root.AnimalExpedition,root.AnimalHero);
})(typeof globalThis!=='undefined'?globalThis:this,function(E,C,H){
  'use strict';
  const STORAGE_KEY='animal_siege_hero_story_v1';
  const kinds=Object.keys(E.TYPES);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const CHAPTERS=[
    {id:'rally',number:1,title:'Forest Rally',titleZh:'森林集結',faction:'forest',fortId:'trail',kind:'trail',
      intro:'Hazel, a young forest commander, finds three squads cut off by the mist. Lead them through the clearing and bring everyone home.',
      introZh:'年輕的森林指揮官榛葉，發現三支小隊被迷霧困住。帶領伙伴穿過空地，一起回到營地。',
      victory:'The rescued scouts entrust Hazel with an oak staff. Its light reveals the path to a forgotten shrine — and awakens your first spells.',
      victoryZh:'獲救的斥候將橡木法杖交給榛葉。杖上的光指向失落神殿，也喚醒了你的第一批魔法。',
      enemy:{beaver:3,fox:4,squirrel:3},trees:[[3,0],[4,2],[3,5]],walls:[],reward:{gold:100,wood:35,equipment:['oakStaff']}},
    {id:'shrine',number:2,title:'Lost Shrine',titleZh:'失落神殿',faction:'forest',fortId:'river',kind:'siege',
      intro:'The river shrine is sealed by frightened sentries. Use your new magic to protect the expedition and reopen its gates.',
      introZh:'河畔神殿被驚慌的守衛封鎖了。用新學會的魔法保護遠征隊，重新打開神殿大門。',
      victory:'The shrine shines again. Hazel learns to guide the wind, and a river charm restores hope to the caravan. Beyond the water, the mountain road is blocked.',
      victoryZh:'神殿再次亮起。榛葉學會引導風的力量，河流護符讓遠征隊重拾希望。跨過河流，山口道路卻遭到封鎖。',
      enemy:{beaver:6,fox:7,squirrel:5},trees:[[2,2],[4,0],[3,4]],walls:[[5,0],[5,2],[5,3],[5,5]],reward:{gold:120,wood:35,equipment:['riverCharm']}},
    {id:'pass',number:3,title:'Mountain Pass',titleZh:'山口爭奪',faction:'rock',fortId:'acorn',kind:'siege',
      intro:'The Rockbound army holds the narrow pass. Choose Hazel’s talent before leaving camp, then find a way through their sturdy defense.',
      introZh:'岩山部族占住狹窄山口。離開營地前，先選擇榛葉的天賦，再設法突破堅固的防線。',
      victory:'The mountain captain yields and opens the road. The expedition gains a command wand and a protective charm. Moonlit tracks lead deeper into the forest.',
      victoryZh:'岩山隊長讓出道路。遠征隊獲得指揮魔杖與守護護符，循著月光下的足跡，走向森林深處。',
      enemy:{beaver:9,fox:8,squirrel:7},trees:[[2,0],[3,3]],walls:[[5,0],[5,2],[5,3],[5,5]],reward:{gold:140,wood:35,equipment:['thornWand','leafCharm']}},
    {id:'maze',number:4,title:'Moonlit Maze',titleZh:'月影迷境',faction:'moon',fortId:'trail',kind:'trail',
      intro:'Moonshadow scouts weave between the trees. Prepare three spells and choose your supplies before following them through the mist.',
      introZh:'月影斥候在樹林間靈巧穿梭。先準備三個法術、選好補給，再循著他們的蹤跡穿越迷霧。',
      victory:'The mist lifts, revealing the citadel. A dawn staff and moon charm are yours. One final commander stands between the expedition and a safe way home.',
      victoryZh:'迷霧散開，王城終於出現。你獲得晨曦法杖與月影護符。最後一位指揮官，守在通往家園的道路上。',
      enemy:{beaver:10,fox:12,squirrel:9},trees:[[3,0],[3,2],[4,3],[3,5]],walls:[],reward:{gold:160,wood:35,equipment:['dawnStaff','moonCharm']}},
    {id:'citadel',number:5,title:'Citadel Dawn',titleZh:'王城決戰',faction:'moon',fortId:'tower',kind:'siege',
      intro:'The Moonshadow commander waits behind the citadel walls. They can cast spells too. Bring your chosen equipment, trust your companions, and finish the journey together.',
      introZh:'月影指揮官在王城內等待。他也能施放魔法。帶上選好的裝備，相信伙伴，一起完成這段遠征。',
      victory:'Dawn reaches the forest. The three peoples agree to reopen the roads, and Hazel leads the expedition home. Your companions will remember the commander you became.',
      victoryZh:'晨光照進森林。三個族群同意重新開放道路，榛葉帶著遠征隊回到家園。伙伴們會記得，你成為了怎樣的指揮官。',
      enemy:{beaver:13,fox:14,squirrel:12},trees:[[2,0],[3,2],[3,4]],walls:[[5,0],[5,2],[5,3],[5,5]],reward:{gold:200,wood:50,equipment:[]}}
  ];
  function create(wave=1){
    const r=C.create(wave);
    r.hero=H.createHero(1);
    r.story={chapter:1,cleared:[],awaitingAdvance:false,supplies:[],completed:false,lastReward:null,checkpoint:null};
    return r;
  }
  const chapter=r=>r?.story?CHAPTERS[r.story.chapter-1]||null:null;
  const editable=r=>!!(chapter(r)&&!r.result&&!r.activeBattle&&!r.story.awaitingAdvance);
  function snapshot(r){
    return {wave:r.wave,army:clone(r.army),gold:r.gold,wood:r.wood,upgrades:clone(r.upgrades),hero:clone(r.hero),
      story:{chapter:r.story.chapter,cleared:[...r.story.cleared],awaitingAdvance:r.story.awaitingAdvance,supplies:[...r.story.supplies],completed:r.story.completed,lastReward:clone(r.story.lastReward)},result:r.result};
  }
  function hydrate(data){const r=C.create(data.wave);Object.assign(r,clone(data));r.story.checkpoint=null;r.activeBattle=null;return r;}
  function beginBattle(r){
    if(!editable(r)||!C.hasArmy(r)||(r.story.chapter>=3&&!r.hero.talent))return null;
    const c=chapter(r),b=E.createBattle(r.wave),extra=(r.wave-1)/5;
    r.story.checkpoint=snapshot(r);
    b.storyChapter=c.number;b.storyFaction=c.faction;b.fortId=c.fortId;b.kind=c.kind;
    if(c.kind==='trail')b.siteId='cache';
    b.walls=clone(c.walls);b.trees=clone(c.trees);
    for(const u of b.units){u.hp=u.team==='player'?r.army[u.kind]:(c.enemy[u.kind]+extra)*E.TYPES[u.kind].hp;u.trained=u.team==='player'&&r.upgrades[u.kind];}
    b.deployment=Object.fromEntries(['player','enemy'].map(team=>[team,Object.fromEntries(kinds.map(k=>[k,b.units.find(u=>u.team===team&&u.kind===k).hp]))]));
    let enemyHero=null;
    if(c.number===5){enemyHero=H.createHero(5);enemyHero.id='moonwarden';enemyHero.faction='moon';enemyHero.loadout=['bolt','shield','slow'];}
    H.attach(b,r.hero,enemyHero);r.activeBattle=b;r.last=null;return b;
  }
  function completeBattle(r,b){
    if(!r?.story||!b||r.activeBattle!==b||b.storyChapter!==r.story.chapter||r.result||!['victory','defeat','retreat'].includes(b.result))return false;
    const victory=b.result==='victory'&&b.units.filter(u=>u.team==='enemy').every(u=>u.hp===0)&&b.units.some(u=>u.team==='player'&&u.hp>0);
    if(b.result==='victory'&&!victory)return false;
    if(!victory){
      const checkpoint=r.story.checkpoint;if(!checkpoint)return false;
      Object.assign(r,hydrate(checkpoint));r.last={type:'story-retry',outcome:b.result};return true;
    }
    const c=chapter(r);
    if(r.story.cleared.includes(c.number))return false;
    for(const k of kinds){const u=b.units.find(u=>u.team==='player'&&u.kind===k),ceiling=Math.ceil(r.army[k]/E.TYPES[k].hp)*E.TYPES[k].hp;r.army[k]=Math.max(0,Math.min(ceiling,Math.floor(u?.hp||0)))+3*E.TYPES[k].hp;}
    r.gold+=c.reward.gold;r.wood+=c.reward.wood;
    for(const id of c.reward.equipment)if(!r.hero.inventory.includes(id))r.hero.inventory.push(id);
    H.levelUp(r.hero,Math.min(5,c.number+1));
    for(const id of c.reward.equipment){const slot=H.EQUIPMENT[id].slot;if(!r.hero.equipment[slot])H.equip(r.hero,id);}
    r.hero.mana=H.stats(r.hero).maxMana;
    r.story.cleared.push(c.number);r.story.lastReward={...clone(c.reward),reinforcements:3};
    r.story.awaitingAdvance=c.number<5;r.story.completed=c.number===5;r.story.checkpoint=null;
    r.activeBattle=null;r.last={type:'story-victory',chapter:c.number};
    if(c.number===5)r.result='victory';
    return true;
  }
  function advance(r){
    if(!r?.story||r.result||r.activeBattle||!r.story.awaitingAdvance||r.story.chapter>=5)return false;
    r.story.chapter++;r.story.awaitingAdvance=false;r.story.lastReward=null;r.last=null;return true;
  }
  function claimSupply(r,choice){
    if(!editable(r)||r.story.supplies.includes(r.story.chapter)||!['gold','wood','reinforcements'].includes(choice))return false;
    if(choice==='gold')r.gold+=60;else if(choice==='wood')r.wood+=35;else for(const k of kinds)r.army[k]+=2*E.TYPES[k].hp;
    r.story.supplies.push(r.story.chapter);r.last={type:'story-supply',choice};return true;
  }
  const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  const uniqueList=(xs,allowed,max)=>Array.isArray(xs)&&xs.length<=max&&new Set(xs).size===xs.length&&xs.every(x=>allowed.includes(x));
  function valid(data){
    if(!data||!integer(data.wave,1,21)||(data.wave-1)%5||!integer(data.gold,0,100000)||!integer(data.wood,0,100000))return false;
    if(!kinds.every(k=>integer(data.army?.[k],0,100000)&&typeof data.upgrades?.[k]==='boolean'))return false;
    const s=data.story,h=data.hero;
    if(!s||!integer(s.chapter,1,5)||!Array.isArray(s.cleared)||s.cleared.length>5||!s.cleared.every((n,i)=>n===i+1))return false;
    if(typeof s.awaitingAdvance!=='boolean'||typeof s.completed!=='boolean'||!uniqueList(s.supplies,[1,2,3,4,5],5)||s.supplies.some(n=>n>s.chapter))return false;
    if(s.completed?!(s.chapter===5&&s.cleared.length===5&&data.result==='victory'&&!s.awaitingAdvance):!(data.result===null&&s.cleared.length===s.chapter-(s.awaitingAdvance?0:1)))return false;
    if(s.awaitingAdvance&&s.chapter===5)return false;
    if(!h||h.id!=='hazel'||h.level!==Math.min(5,s.cleared.length+1)||!integer(h.mana,0,1000)||!['guardian','sage',null].includes(h.talent))return false;
    if(h.level<3&&h.talent!==null)return false;
    const expected=H.createHero(h.level),earned=CHAPTERS.slice(0,s.cleared.length).flatMap(c=>c.reward.equipment);
    if(!uniqueList(h.knownSpells,expected.knownSpells,6)||h.knownSpells.length!==expected.knownSpells.length||!uniqueList(h.loadout,h.knownSpells,3))return false;
    if(!uniqueList(h.inventory,earned,6)||h.inventory.length!==earned.length||!h.equipment)return false;
    for(const slot of ['weapon','charm']){const id=h.equipment[slot];if(id!==null&&(!h.inventory.includes(id)||H.EQUIPMENT[id]?.slot!==slot))return false;}
    if(h.mana>H.stats(h).maxMana)return false;
    if(s.lastReward!==null){const reward=CHAPTERS[s.chapter-1].reward;if(!s.awaitingAdvance&&!s.completed)return false;if(s.lastReward.gold!==reward.gold||s.lastReward.wood!==reward.wood||s.lastReward.reinforcements!==3||JSON.stringify(s.lastReward.equipment)!==JSON.stringify(reward.equipment))return false;}
    return true;
  }
  function save(storage,r){
    if(!r?.story||!storage)return false;
    try{const data=r.activeBattle?r.story.checkpoint:snapshot(r);if(!valid(data))return false;storage.setItem(STORAGE_KEY,JSON.stringify({version:1,run:data}));return true;}catch(_){return false;}
  }
  function load(storage){
    try{const saved=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');return saved?.version===1&&valid(saved.run)?hydrate(saved.run):null;}catch(_){return null;}
  }
  function score(r){return r.story.cleared.length*300+kinds.reduce((n,k)=>n+Math.ceil(r.army[k]/E.TYPES[k].hp)*10,0)+r.story.supplies.length*15;}
  return {CHAPTERS,STORAGE_KEY,create,chapter,beginBattle,completeBattle,advance,claimSupply,save,load,score};
});
