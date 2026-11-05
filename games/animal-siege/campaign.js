(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.AnimalExpedition=factory(root.AnimalSiege);})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const COST={beaver:20,fox:25,squirrel:18},UPGRADE_COST=35;
  const FORTS={
    acorn:{name:'Acorn Fort',nameZh:'橡果堡',species:'fox',x:49,y:27,army:{fox:11,squirrel:5,beaver:3},gold:140,wood:40},
    river:{name:'River Keep',nameZh:'溪流城寨',species:'beaver',x:51,y:72,army:{beaver:10,fox:3,squirrel:4},gold:150,wood:40},
    tower:{name:'Treetop Citadel',nameZh:'樹冠主堡',species:'squirrel',x:80,y:38,army:{squirrel:12,beaver:4,fox:3},gold:180,wood:50}
  };
  const SITES={
    cache:{name:'Old forest trail',nameZh:'林間舊路',x:29,y:18,gold:80,wood:35,guards:{beaver:1,fox:4,squirrel:2}},
    timber:{name:'Hidden riverside path',nameZh:'河畔小徑',x:29,y:78,gold:60,wood:45},
    friends:{name:'Mysterious clearing',nameZh:'神祕空地',x:75,y:79,reinforcements:3}
  };
  const kinds=Object.keys(E.TYPES),hasArmy=r=>kinds.some(k=>r.army[k]>0);
  const captured=r=>Object.values(r.forts).filter(f=>f.captured).length;
  const available=(r,id)=>!!FORTS[id]&&!r.forts[id].captured&&(id!=='tower'||r.forts.acorn.captured&&r.forts.river.captured);
  function create(wave=1){
    const normalized=Math.max(1,Math.min(21,1+5*Math.floor((Math.max(1,Number(wave)||1)-1)/5))),extra=(normalized-1)/5;
    return {wave:normalized,army:{beaver:72,fox:32,squirrel:30},gold:90,wood:25,upgrades:{beaver:false,fox:false,squirrel:false},
      sites:Object.fromEntries(Object.keys(SITES).map(id=>[id,{revealed:false,claimed:false,...(SITES[id].guards?{stage:'hidden',cleared:false,guardHP:Object.fromEntries(kinds.map(k=>[k,(SITES[id].guards[k]+extra)*E.TYPES[k].hp]))}:{})}])),
      forts:Object.fromEntries(Object.entries(FORTS).map(([id,f])=>[id,{captured:false,hp:Object.fromEntries(kinds.map(k=>[k,(f.army[k]+extra*(k===f.species?2:1))*E.TYPES[k].hp]))}])),
      activeFort:null,activeSite:null,activeBattle:null,attempts:0,result:null,last:null,planFort:'acorn',battleReport:null};
  }
  const editable=r=>r&&!r.result&&!r.activeBattle;
  function preparation(r,id=r?.planFort){
    if(!r||!FORTS[id]||r.forts[id].captured)return null;
    const counts=Object.fromEntries(kinds.map(k=>[k,Math.ceil(r.forts[id].hp[k]/E.TYPES[k].hp)]));
    const main=kinds.reduce((best,k)=>counts[k]>counts[best]?k:best,FORTS[id].species);
    const counter=kinds.find(k=>E.TYPES[k].counters===main),secondary=counter==='squirrel'?'fox':'squirrel';
    return {id,main,counter,secondary,counts,defenders:kinds.reduce((n,k)=>n+counts[k],0),
      allies:kinds.reduce((n,k)=>n+Math.ceil(r.army[k]/E.TYPES[k].hp),0),
      recruitCost:COST[counter]*3,goldAfterRecruit:r.gold-COST[counter]*3,
      secondaryCost:COST[secondary]*3,goldAfterSecondary:r.gold-COST[secondary]*3,
      woodNeeded:r.upgrades[secondary]?0:Math.max(0,UPGRADE_COST-r.wood)};
  }
  function prepare(r,id){if(!editable(r)||!available(r,id))return false;r.planFort=id;return true;}
  function explore(r,id){if(!editable(r)||!SITES[id]||r.sites[id].revealed)return false;r.sites[id].revealed=true;if(SITES[id].guards)r.sites[id].stage='clues';r.last={type:'discovery',id};return true;}
  function investigate(r,id){if(!editable(r)||!SITES[id]?.guards||r.sites[id].stage!=='clues')return false;r.sites[id].stage='guards';r.last={type:'scouted',id};return true;}
  function beginTrailBattle(r,id){
    if(!editable(r)||!SITES[id]?.guards||r.sites[id].stage!=='guards'||r.sites[id].claimed||!hasArmy(r))return null;
    const b=E.createBattle(r.wave);b.kind='trail';b.siteId=id;b.fortId='trail';b.walls=[];b.trees=[[3,0],[4,2],[3,5]];
    for(const u of b.units){u.hp=u.team==='player'?r.army[u.kind]:r.sites[id].guardHP[u.kind];u.trained=u.team==='player'&&r.upgrades[u.kind];}
    b.deployment=Object.fromEntries(['player','enemy'].map(team=>[team,Object.fromEntries(kinds.map(k=>[k,b.units.find(u=>u.team===team&&u.kind===k).hp]))]));
    r.activeSite=id;r.activeBattle=b;r.sites[id].attempts=(r.sites[id].attempts||0)+1;r.last=null;return b;
  }
  function completeTrailBattle(r,b){
    if(!r||!b||b.kind!=='trail'||r.activeBattle!==b||r.activeSite!==b.siteId||r.result||!['victory','defeat','retreat'].includes(b.result))return false;
    const id=b.siteId,s=r.sites[id],initial=b.deployment;
    for(const k of kinds){r.army[k]=Math.max(0,Math.min(r.army[k],Math.floor(Number(b.units.find(u=>u.team==='player'&&u.kind===k)?.hp)||0)));s.guardHP[k]=Math.max(0,Math.min(s.guardHP[k],Math.floor(Number(b.units.find(u=>u.team==='enemy'&&u.kind===k)?.hp)||0)));}
    const victory=kinds.every(k=>s.guardHP[k]===0)&&hasArmy(r),outcome=victory?'victory':hasArmy(r)?'retreat':'defeat';
    s.cleared=victory;s.stage=victory?'loot':'guards';s.lastOutcome=outcome;
    s.lastLosses={allies:kinds.reduce((n,k)=>n+Math.ceil(initial.player[k]/E.TYPES[k].hp)-Math.ceil(r.army[k]/E.TYPES[k].hp),0),guards:kinds.reduce((n,k)=>n+Math.ceil(initial.enemy[k]/E.TYPES[k].hp)-Math.ceil(s.guardHP[k]/E.TYPES[k].hp),0)};
    r.activeBattle=null;r.activeSite=null;r.last={type:'trail-'+outcome,id};if(!canRecover(r))r.result='defeat';return true;
  }
  function claim(r,id,choice){
    if(!editable(r)||!SITES[id]||!r.sites[id].revealed||r.sites[id].claimed)return false;
    if(SITES[id].guards&&!r.sites[id].cleared)return false;
    const site=SITES[id];
    if(site.reinforcements){if(!kinds.includes(choice))return false;r.army[choice]+=site.reinforcements*E.TYPES[choice].hp;}
    else{if(choice!=='gold'&&choice!=='wood')return false;r[choice]+=site[choice];}
    r.sites[id].claimed=true;if(SITES[id].guards)r.sites[id].stage='claimed';r.last={type:'claim',id,choice};if(!canRecover(r))r.result='defeat';return true;
  }
  function recruit(r,kind,amount){
    if(!editable(r)||!kinds.includes(kind)||!Number.isSafeInteger(amount)||amount<=0||amount>100||r.gold<COST[kind]*amount)return false;
    r.gold-=COST[kind]*amount;r.army[kind]+=E.TYPES[kind].hp*amount;r.last={type:'recruit',kind,amount};return true;
  }
  function upgrade(r,kind){
    if(!editable(r)||!kinds.includes(kind)||r.upgrades[kind]||r.wood<UPGRADE_COST)return false;
    r.wood-=UPGRADE_COST;r.upgrades[kind]=true;r.last={type:'upgrade',kind};return true;
  }
  function beginBattle(r,id){
    if(!editable(r)||!available(r,id)||!hasArmy(r))return null;
    const b=E.createBattle(r.wave);
    for(const u of b.units){u.hp=u.team==='player'?r.army[u.kind]:r.forts[id].hp[u.kind];u.trained=u.team==='player'&&r.upgrades[u.kind];}
    if(id==='river')b.trees=[[2,2],[4,0],[3,4]];
    if(id==='tower')b.trees=[[2,0],[3,2],[3,4]];
    b.deployment=Object.fromEntries(['player','enemy'].map(team=>[team,Object.fromEntries(kinds.map(k=>[k,b.units.find(u=>u.team===team&&u.kind===k).hp]))]));
    b.fortId=id;r.planFort=id;r.activeFort=id;r.activeBattle=b;r.attempts++;r.last=null;return b;
  }
  function canRecover(r){return hasArmy(r)||r.gold>=Math.min(...Object.values(COST))||Object.keys(SITES).some(id=>!r.sites[id].claimed&&(!SITES[id].guards||r.sites[id].cleared));}
  function completeBattle(r,b){
    if(!r||!b||r.activeBattle!==b||r.activeFort!==b.fortId||r.result)return false;
    // A settlement owns the currently active battle exactly once, including retreat.
    const id=b.fortId;
    const report={id,player:{},enemy:{},counterHits:0,counterDamage:0,reward:{gold:0,wood:0}};
    for(const team of ['player','enemy'])for(const kind of kinds){
      const initial=b.deployment?.[team]?.[kind]??(team==='player'?r.army[kind]:r.forts[id].hp[kind]);
      const hp=Math.max(0,Math.min(initial,Math.floor(Number(b.units.find(u=>u.team===team&&u.kind===kind)?.hp)||0)));
      const deployed=Math.ceil(initial/E.TYPES[kind].hp),survived=Math.ceil(hp/E.TYPES[kind].hp);
      report[team][kind]={deployed,survived,lost:deployed-survived,hpLost:initial-hp};
    }
    report.counterHits=b.counterTotals.player.hits;report.counterDamage=b.counterTotals.player.damage;
    for(const kind of kinds){
      const ally=b.units.find(u=>u.team==='player'&&u.kind===kind),enemy=b.units.find(u=>u.team==='enemy'&&u.kind===kind);
      r.army[kind]=Math.max(0,Math.min(r.army[kind],Math.floor(Number(ally?.hp)||0)));
      r.forts[id].hp[kind]=Math.max(0,Math.min(r.forts[id].hp[kind],Math.floor(Number(enemy?.hp)||0)));
    }
    const victory=kinds.every(k=>r.forts[id].hp[k]===0)&&hasArmy(r);
    if(victory&&!r.forts[id].captured){r.forts[id].captured=true;r.gold+=FORTS[id].gold;r.wood+=FORTS[id].wood;report.reward={gold:FORTS[id].gold,wood:FORTS[id].wood};}
    r.activeBattle=null;r.activeFort=null;r.last={type:victory?'victory':hasArmy(r)?'retreat':'defeat',id};
    report.outcome=r.last.type;r.battleReport=report;
    if(victory)r.planFort=Object.keys(FORTS).find(id=>available(r,id))||null;
    if(captured(r)===3)r.result='victory';else if(!canRecover(r))r.result='defeat';
    return true;
  }
  function score(r){return captured(r)*300+kinds.reduce((n,k)=>n+Math.ceil(r.army[k]/E.TYPES[k].hp)*10,0)+Object.values(r.sites).filter(s=>s.claimed).length*15;}
  return {COST,UPGRADE_COST,FORTS,SITES,create,available,captured,hasArmy,preparation,prepare,explore,investigate,claim,recruit,upgrade,beginTrailBattle,completeTrailBattle,beginBattle,completeBattle,canRecover,score};
});
