(function(){
  'use strict';
  const E=window.AnimalSiege,C=window.AnimalExpedition;
  window.AnimalUnitGuide={render(host,{text:t,name,image,upgrades={}}){
    const percent=multiplier=>Math.round((1-multiplier)*100)+'%';
    const guard=percent(E.COMBAT.guardMultiplier),beaverArmor=percent(E.COMBAT.trainedBeaverMultiplier);
    const role={
      beaver:t('Front-line guard. High health helps hold the gate; use it against fox squads. Squirrel archers counter it.','前線衛兵。血量較高，適合守住城門、迎擊狐狸；要留意克制牠的松鼠射手。'),
      fox:t('Mobile scout. Reach distant enemies or reposition through open gates; use it against squirrels. Beaver guards counter it.','機動斥候。移動距離較遠，適合穿過城門、接近遠處的松鼠；要避開克制牠的海狸。'),
      squirrel:t('Ranged support. Attack beavers from a safe position. Walls and trees block shots, and foxes can close the gap.','遠程支援。保持距離射擊海狸；城牆與樹木會擋住射線，也要留意快速接近的狐狸。')
    };
    const training={
      beaver:t('Training: passive damage reduction '+beaverArmor+'. Combined with Defend: '+percent(E.COMBAT.guardMultiplier*E.COMBAT.trainedBeaverMultiplier)+' total damage reduction.','升級：常駐減傷 '+beaverArmor+'。搭配防守時，合計減傷 '+percent(E.COMBAT.guardMultiplier*E.COMBAT.trainedBeaverMultiplier)+'。'),
      fox:t('Training: move +1 tile.','升級：移動距離增加 1 格。'),
      squirrel:t('Training: attack range +1 tile.','升級：射程增加 1 格。')
    };
    const stat=(field,label,value)=>'<div><dt>'+label+'</dt><dd data-stat="'+field+'">'+value+'</dd></div>';
    const chain=Object.keys(E.TYPES).map(kind=>'<div class="guide-counter-link" data-guide-counter="'+kind+'" data-counter-target="'+E.TYPES[kind].counters+'">'+image(kind)+'<span><b>'+name(kind)+'</b><small>'+t('counters →','克制 →')+'</small><b>'+name(E.TYPES[kind].counters)+'</b></span>'+image(E.TYPES[kind].counters)+'</div>').join('');
    const cards=Object.keys(E.TYPES).map(kind=>{
      const trained=!!upgrades[kind],s=E.stats({kind,trained});
      return '<article class="guide-unit" data-guide-kind="'+kind+'"><header>'+image(kind)+'<div><h3>'+name(kind)+'</h3><small>'+(trained?t('Trained ✦ · current stats','已升級 ✦・目前能力'):t('Base stats · per animal','基本能力・每隻數值'))+'</small></div></header><dl>'+stat('hp',t('Health','血量'),s.hp)+stat('attack',t('Attack','攻擊力'),s.attack)+stat('defense',t('Defense (passive)','防禦（常駐減傷）'),kind==='beaver'&&trained?beaverArmor:'0%')+stat('move',t('Move (tiles)','移動（格）'),s.move)+stat('range',t('Range (tiles)','射程（格）'),s.range)+stat('cost',t('Gold per recruit','每隻招募金幣'),C.COST[kind])+'</dl><p class="guide-role">'+role[kind]+'</p><p class="guide-defense"><b>'+t('Defend: ','防守：')+'</b>'+t('Reduce incoming damage by '+guard+' and end this squad’s action.','受到傷害減少 '+guard+'，並結束這隊本回合的行動。')+'</p><p class="guide-training">'+training[kind]+' <small>'+t('Training cost: '+C.UPGRADE_COST+' wood.','升級花費 '+C.UPGRADE_COST+' 木材。')+'</small></p></article>';
    }).join('');
    host.innerHTML='<section class="guide-chain" aria-labelledby="guide-chain-title"><h3 id="guide-chain-title">'+t('The complete counter chain','完整兵種克制鏈')+'</h3><div class="guide-chain-links">'+chain+'</div><p>'+t('Counter attacks multiply base damage by ','克制攻擊的基礎傷害乘以 ')+E.COMBAT.counterMultiplier+t('. Both armies follow this chain.',' 倍，敵我雙方都適用。')+'</p></section><div class="guide-units">'+cards+'</div><p class="guide-rules">'+t('Health and attack are per animal. Squad base damage = surviving animals × attack. Defense uses damage reduction rather than armor points. Counter and defense multipliers are applied before rounding down; a valid attack deals at least 1 damage. The damage preview shows the current matchup.','血量與攻擊力以每隻計算；小隊基礎傷害＝存活兵數 × 攻擊力。防禦使用減傷比例，沒有獨立防禦點數。克制與減傷倍率計算後向下取整，有效攻擊至少造成 1 點傷害；實際對戰可查看攻擊預覽。')+'</p>';
  }};
})();
