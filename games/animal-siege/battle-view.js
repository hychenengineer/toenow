(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.AnimalBattleView=factory(root.AnimalSiege);})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const startingHP=new WeakMap();
  function status(s,u,origin=u,preview=false){
    const canHit=s.units.some(t=>t.team!==u.team&&t.hp>0&&E.canAttack(s,origin,t));
    if(u.guarding)return {key:'guarding',icon:'◈',label:['Defending','防守中']};
    if(u.acted)return {key:'acted',icon:'✓',label:['Done','已行動']};
    if(preview)return {key:'preview',icon:'👣',label:canHit?['Preview · can attack','預覽・可攻擊']:['Move preview','移動預覽']};
    if(u.moved)return {key:'moved',icon:'👣',label:canHit?['Moved · can attack','已移動・可攻擊']:['Moved','已移動']};
    return {key:'ready',icon:u.team==='player'&&canHit?'⚔':'●',label:u.team==='enemy'?['Defender','守軍']:canHit?['Can attack','可攻擊']:['Can move','可移動']};
  }
  function unit(s,u,{text:t,name,origin=u,preview=false,selected=false}){
    if(!startingHP.has(u))startingHP.set(u,Math.ceil(u.hp/E.TYPES[u.kind].hp)*E.TYPES[u.kind].hp);
    const max=Math.max(u.hp,startingHP.get(u)),action=status(s,u,origin,preview),stats=E.stats(u),label=t(...action.label);
    return '<span class="unit-status" aria-label="'+label+'"><i aria-hidden="true">'+action.icon+'</i><span>'+label+'</span></span><span class="unit-hp">'+u.hp+' HP</span><span class="unit-health" role="progressbar" aria-label="'+name(u.kind)+t(' health','生命')+'" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+u.hp+'"><i style="width:'+Math.round(u.hp/max*100)+'%"></i></span>'+(selected?'<span class="unit-capability" aria-label="'+t('Move '+stats.move+' · Range '+stats.range,'移動 '+stats.move+' 格・射程 '+stats.range+' 格')+'">↔ '+stats.move+' · ⚔ '+stats.range+'</span>':'');
  }
  return {status,unit};
});
