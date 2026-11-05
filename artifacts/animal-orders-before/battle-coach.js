(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AnimalBattleCoach=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='animal_siege_battle_tips_v1';
  const steps={
    select:{index:1,selector:'.tile.has-unit:not(.enemy-unit):not(.spent)',prompt:['Tap one of your animals to see where it can move and attack.','點選一隊我方動物，查看牠的移動與攻擊範圍。']},
    move:{index:2,selector:'.tile.reachable',prompt:['Choose a blue footprint tile to preview a move. You can change your mind before confirming.','選藍色腳印格預覽移動，確認前都能改選或取消。']},
    'confirm-move':{index:2,selector:'#confirm-move',prompt:['Like this position? Press Confirm move. Cancel lets you choose again.','位置選好了嗎？按「確定移動」；也可以取消重選。']},
    target:{index:3,selector:'.tile.target',prompt:['You can still attack after moving. Select a red-sword enemy to preview damage.','移動後還可以攻擊！選紅色劍標記的敵人，先看看預計傷害。']},
    'no-target':{index:3,selector:'#defend',prompt:['No enemy is in range here. Defend, choose another squad, or end your turn.','這個位置沒有可攻擊的敵人。可以防守、換另一隊，或結束回合。']},
    attack:{index:3,selector:'#confirm-attack',prompt:['Check the predicted damage, then press Attack. Selecting an enemy alone does not attack.','確認預計傷害，再按「攻擊」。點選敵人只會選取目標。']},
    'end-turn':{index:4,selector:'#end-turn',prompt:['You can command another squad, or press End turn when you are ready. Squads that have not acted will defend.','可以繼續操作其他部隊，準備好後按「結束回合」。還沒行動的部隊會自動防守。']},
    wait:{index:3,selector:null,prompt:['Watch the defenders. You can command your animals again on your next turn.','先觀察守軍行動，下一個我方回合就能繼續指揮動物。']}
  };
  function create(storage){
    let active=false,chosen=false,attacked=false,forced=false,remembered;
    function read(){if(remembered!==undefined)return remembered;try{return storage?.getItem(KEY);}catch(_){return null;}}
    function mark(value){remembered=value;try{storage?.setItem(KEY,value);}catch(_){}active=false;}
    const coach={get active(){return active;},
      begin(){active=forced||!['completed','skipped'].includes(read());forced=false;chosen=false;attacked=false;},
      choose(){if(active)chosen=true;},attack(){if(active)attacked=true;},
      endTurn(){if(active&&attacked)mark('completed');},
      end(result){if(active&&attacked&&result==='victory')mark('completed');active=false;},
      stop(){active=false;forced=false;},skip(){if(active)mark('skipped');},
      replay(inBattle){forced=true;active=false;if(inBattle)coach.begin();},
      view(c){
        if(!active||c.paused||c.busy||c.result)return null;
        const step=c.phase==='enemy'?'wait':attacked||c.hasUnacted===false?'end-turn':c.ready?'attack':c.plannedMove?'confirm-move':!c.selected||c.selected.acted?'select':c.selected.moved?(c.targets?'target':'no-target'):chosen?'move':'select';
        return {step,...steps[step]};
      }
    };return coach;
  }
  return {KEY,create};
});
