(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.AnimalBattleView=factory(root.AnimalSiege);})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  function status(s,u,origin=u,preview=false){
    const canHit=s.units.some(t=>t.team!==u.team&&t.hp>0&&E.canAttack(s,origin,t));
    if(u.guarding)return {key:'guarding',icon:'◈',label:['Defending','防守中']};
    if(u.acted)return {key:'acted',icon:'✓',label:['Done','已行動']};
    if(preview)return {key:'preview',icon:'👣',label:canHit?['Preview · can attack','預覽・可攻擊']:['Move preview','移動預覽']};
    if(u.moved)return {key:'moved',icon:'👣',label:canHit?['Moved · can attack','已移動・可攻擊']:['Moved','已移動']};
    return {key:'ready',icon:u.team==='player'&&canHit?'⚔':'●',label:u.team==='enemy'?['Defender','守軍']:canHit?['Can attack','可攻擊']:['Can move','可移動']};
  }
  function unit(s,u,{text:t,origin=u,preview=false}){
    const action=status(s,u,origin,preview),label=t(...action.label);
    return '<span class="unit-status" aria-label="'+label+'"><i aria-hidden="true">'+action.icon+'</i><span>'+label+'</span></span>';
  }
  return {status,unit};
});
