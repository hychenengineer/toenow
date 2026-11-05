const fs=require('fs'),E=require('../../games/animal-siege/engine.js');
function action(s,seed){
 const own=s.units.filter(u=>u.team==='player'&&u.hp>0&&!u.acted),foes=s.units.filter(u=>u.team==='enemy'&&u.hp>0);let best;
 const rand=()=>{seed.value=(seed.value*1664525+1013904223)>>>0;return seed.value/4294967296;};
 for(const u of own)for(const p of u.moved?[{x:u.x,y:u.y,cost:0}]:E.reachable(s,u)){
  const at={...u,x:p.x,y:p.y};
  const danger=foes.reduce((v,t)=>v+(Math.abs(t.x-p.x)+Math.abs(t.y-p.y)<=E.TYPES[t.kind].move+E.TYPES[t.kind].range?E.damage(s,t,at):0),0);
  for(const t of foes)if(E.canAttack(s,at,t)){
   const hit=E.damage(s,at,t),val=Math.min(hit,t.hp)*2+Math.min(E.count(t),hit/E.TYPES[t.kind].hp)*7+(hit>=t.hp?25:0)-danger*.1-p.cost*.1+rand()*seed.noise;
   if(!best||val>best.val)best={id:u.id,p,target:t.id,val};
  }
  const near=Math.min(...foes.map(t=>Math.abs(t.x-p.x)+Math.abs(t.y-p.y)-(E.TYPES[u.kind].counters===t.kind?2:0)));
  const val=-near*seed.advance-danger*seed.risk+(p.cost?0:2)+rand()*seed.noise;
  if(!best||val>best.val)best={id:u.id,p,val};
 }
 if(!best)return null;if(best.p.cost)E.move(s,best.id,best.p.x,best.p.y);
 if(best.target)E.attack(s,best.id,best.target);else E.defend(s,best.id);return best;
}
let wins=0;
for(let attempt=0;attempt<200;attempt++){
 const s=E.createBattle(),plan=[],seed={value:attempt+1,noise:attempt<1?0:10,advance:1+(attempt%4),risk:(attempt%7)*.04};
 while(!s.result&&s.round<25){
  while(s.phase==='player'&&s.units.some(u=>u.team==='player'&&u.hp>0&&!u.acted)){const a=action(s,seed);plan.push({round:s.round,...a});if(s.result)break;}
  if(s.phase==='player')E.endPlayerTurn(s);while(s.phase==='enemy')E.enemyStep(s);
 }
 if(s.result==='victory'){wins++;fs.writeFileSync('artifacts/animal-siege/winning-plan.json',JSON.stringify({attempt,round:s.round,survivors:s.units.filter(u=>u.team==='player').map(u=>[u.id,E.count(u)]),plan},null,2));console.log('WIN',attempt,'round',s.round);break;}
 if(attempt%25===0)console.log('attempt',attempt,s.result,s.round);
}if(!wins)process.exitCode=1;
