// Test-only player policy. The browser still performs every chosen move/attack through UI controls.
const E=require('../../games/animal-siege/engine.js');
function chooseAction(s){
  const own=s.units.filter(u=>u.team==='player'&&u.hp>0&&!u.acted),foes=s.units.filter(u=>u.team==='enemy'&&u.hp>0);let best;
  for(const u of own)for(const p of u.moved?[{x:u.x,y:u.y,cost:0}]:E.reachable(s,u)){
    const at={...u,x:p.x,y:p.y};
    const danger=foes.reduce((n,t)=>n+(Math.abs(t.x-p.x)+Math.abs(t.y-p.y)<=E.stats(t).move+E.stats(t).range?E.damage(s,t,at):0),0);
    for(const t of foes)if(E.canAttack(s,at,t)){
      const hit=E.damage(s,at,t),value=Math.min(hit,t.hp)*2+Math.min(E.count(t),hit/E.TYPES[t.kind].hp)*7+(hit>=t.hp?25:0)-danger*.1-p.cost*.1;
      if(!best||value>best.value)best={id:u.id,x:p.x,y:p.y,target:t.id,value};
    }
    const near=Math.min(...foes.map(t=>Math.abs(t.x-p.x)+Math.abs(t.y-p.y)-(E.TYPES[u.kind].counters===t.kind?2:0)));
    const value=-near+(p.cost?0:2);
    if(!best||value>best.value)best={id:u.id,x:p.x,y:p.y,target:null,value};
  }
  return best;
}
module.exports={chooseAction};
