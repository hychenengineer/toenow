(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AnimalSiege=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TYPES={
    beaver:{name:'Beaver Guard',hp:12,attack:4,move:2,range:1,counters:'fox'},
    fox:{name:'Fox Scout',hp:8,attack:4,move:4,range:1,counters:'squirrel'},
    squirrel:{name:'Squirrel Archer',hp:6,attack:3,move:2,range:4,counters:'beaver'}
  };
  const COMBAT=Object.freeze({counterMultiplier:1.8,guardMultiplier:0.55,trainedBeaverMultiplier:0.8});
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  const count=u=>Math.ceil(Math.max(0,u.hp)/TYPES[u.kind].hp);
  const stats=u=>({...TYPES[u.kind],move:Math.max(1,TYPES[u.kind].move+(u.trained&&u.kind==='fox'?1:0)+(u.commander?.faction==='moon'?1:0)+(u.statuses||[]).filter(s=>s.id==='haste'||s.id==='slow').reduce((n,s)=>n+s.value,0)),range:TYPES[u.kind].range+(u.trained&&u.kind==='squirrel'?1:0)});
  function unit(id,team,kind,x,y,n){return {id,team,kind,x,y,hp:n*TYPES[kind].hp,moved:false,acted:false,guarding:false};}
  function createBattle(wave=1){
    const tier=Math.min(5,Math.max(1,Math.ceil((Number(wave)||1)/5))),extra=tier-1;
    return {width:8,height:6,round:1,wave:1+(tier-1)*5,phase:'player',result:null,reward:{gold:0,wood:0},
      walls:[[5,0],[5,2],[5,3],[5,5]],trees:[[2,0],[3,3]],enemyQueue:[],log:[],counterTotals:{player:{hits:0,damage:0},enemy:{hits:0,damage:0}},
      units:[unit('p-beaver','player','beaver',1,1,6),unit('p-fox','player','fox',0,3,4),unit('p-squirrel','player','squirrel',1,4,5),
        unit('e-fox','enemy','fox',6,1,11+extra*2),unit('e-squirrel','enemy','squirrel',7,3,5+extra),unit('e-beaver','enemy','beaver',6,5,3+extra)]};
  }
  const blocked=(s,x,y)=>x<0||y<0||x>=s.width||y>=s.height||s.walls.concat(s.trees).some(p=>p[0]===x&&p[1]===y);
  const occupant=(s,x,y)=>s.units.find(u=>u.hp>0&&u.x===x&&u.y===y);
  function reachable(s,u){
    if(!u||u.hp<=0)return [];
    const out=[{x:u.x,y:u.y,cost:0}],seen=new Set([u.x+','+u.y]);
    for(let i=0;i<out.length;i++){
      const p=out[i];if(p.cost>=stats(u).move)continue;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=p.x+dx,y=p.y+dy,key=x+','+y;
        if(!seen.has(key)&&!blocked(s,x,y)&&!occupant(s,x,y)){seen.add(key);out.push({x,y,cost:p.cost+1});}
      }
    }
    return out;
  }
  function lineOfSight(s,a,b){
    // Supercover grid traversal: walls on either side of an exact corner block a shot.
    let x=a.x,y=a.y;const dx=b.x-a.x,dy=b.y-a.y,nx=Math.abs(dx),ny=Math.abs(dy),sx=Math.sign(dx),sy=Math.sign(dy);
    let ix=0,iy=0;
    while(ix<nx||iy<ny){
      const lhs=(1+2*ix)*ny,rhs=(1+2*iy)*nx;
      if(lhs===rhs){if(blocked(s,x+sx,y)||blocked(s,x,y+sy))return false;x+=sx;y+=sy;ix++;iy++;}
      else if(lhs<rhs){x+=sx;ix++;}else{y+=sy;iy++;}
      if((x!==b.x||y!==b.y)&&blocked(s,x,y))return false;
    }
    return true;
  }
  function movementPath(s,u,x,y){
    const tiles=reachable(s,u),end=tiles.find(p=>p.x===x&&p.y===y);if(!end)return [];
    const path=[{x:end.x,y:end.y}];let current=end;
    while(current.cost>0){current=tiles.find(p=>p.cost===current.cost-1&&Math.abs(p.x-current.x)+Math.abs(p.y-current.y)===1);if(!current)return [];path.unshift({x:current.x,y:current.y});}
    return path;
  }
  function canAttack(s,a,b){return !!(a&&b&&a.hp>0&&b.hp>0&&a.team!==b.team&&distance(a,b)<=stats(a).range&&lineOfSight(s,a,b));}
  function attackRange(s,u){
    if(!u||u.hp<=0)return [];const tiles=[];
    for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
      if(!blocked(s,x,y)&&(x!==u.x||y!==u.y)&&canAttack(s,u,{x,y,hp:1,team:u.team==='player'?'enemy':'player'}))tiles.push({x,y});
    }
    return tiles;
  }
  function damage(s,a,b){return Math.max(1,Math.floor(count(a)*TYPES[a.kind].attack*(TYPES[a.kind].counters===b.kind?COMBAT.counterMultiplier:1)*(b.guarding?COMBAT.guardMultiplier:1)*(b.trained&&b.kind==='beaver'?COMBAT.trainedBeaverMultiplier:1)*(1+(a.commander?.attack||0)*.04)/(1+(b.commander?.defense||0)*.04)*(b.commander?.faction==='rock'?.85:1)*(a.statuses||[]).filter(s=>s.id==='inspire').reduce((n,s)=>n*s.value,1)*(b.statuses||[]).filter(s=>s.id==='shield'||s.id==='shelter').reduce((n,s)=>n*s.value,1)));}
  const allowed=(s,u)=>u&&u.hp>0&&!u.acted&&!s.result&&s.phase===u.team;
  function move(s,id,x,y){
    const u=s.units.find(u=>u.id===id);if(!allowed(s,u)||u.moved||!reachable(s,u).some(p=>p.x===x&&p.y===y&&p.cost>0))return false;
    const from={x:u.x,y:u.y};u.x=x;u.y=y;u.moved=true;u.guarding=false;s.last={type:'move',id,from,x,y};return true;
  }
  function settle(s){
    if(!s.units.some(u=>u.hp>0&&u.team==='enemy')){s.result='victory';s.reward={gold:140,wood:40};}
    else if(!s.units.some(u=>u.hp>0&&u.team==='player'))s.result='defeat';
    if(s.result)s.phase='finished';
  }
  function attack(s,id,targetId){
    const a=s.units.find(u=>u.id===id),b=s.units.find(u=>u.id===targetId);
    if(!allowed(s,a)||!canAttack(s,a,b))return false;
    const hit=damage(s,a,b),before=count(b),hpBefore=b.hp;b.hp=Math.max(0,b.hp-hit);a.acted=true;a.moved=true;a.guarding=false;
    if(a.statuses)a.statuses=a.statuses.filter(s=>s.id!=='inspire');
    s.last={type:'attack',id,targetId,damage:hit,hpBefore,hpAfter:b.hp,actualDamage:hpBefore-b.hp,loss:before-count(b),counter:TYPES[a.kind].counters===b.kind};
    if(s.last.counter){const total=s.counterTotals[a.team];total.hits++;total.damage+=s.last.actualDamage;}
    s.log.push({...s.last});s.log=s.log.slice(-8);settle(s);return true;
  }
  function defend(s,id){const u=s.units.find(u=>u.id===id);if(!allowed(s,u))return false;u.guarding=true;u.acted=true;u.moved=true;s.last={type:'defend',id};return true;}
  function expireStatuses(s,team){for(const u of s.units)if(u.statuses)u.statuses=u.statuses.filter(status=>status.sourceTeam!==team||status.expiresRound>s.round);}
  function endPlayerTurn(s){
    if(s.phase!=='player'||s.result)return false;
    for(const u of s.units.filter(u=>u.team==='player'&&u.hp>0&&!u.acted))defend(s,u.id);
    s.phase='enemy';s.enemyQueue=s.units.filter(u=>u.team==='enemy'&&u.hp>0).map(u=>u.id);
    expireStatuses(s,'enemy');
    for(const u of s.units.filter(u=>u.team==='enemy')){u.moved=false;u.acted=false;u.guarding=false;}
    return true;
  }
  function enemyStep(s){
    if(s.phase!=='enemy'||s.result)return false;
    const nextId=s.enemyQueue.shift();
    const u=s.units.find(u=>u.id===nextId);
    if(u&&u.hp>0){
      const targets=s.units.filter(t=>t.team==='player'&&t.hp>0);let best;
      for(const p of reachable(s,u))for(const t of targets){
        if(!canAttack(s,{...u,...p},t))continue;
        const hit=damage(s,u,t),value=Math.min(hit,t.hp)+Math.min(count(t),hit/TYPES[t.kind].hp)*6-p.cost*.1;
        if(!best||value>best.value)best={p,t,value};
      }
      if(best){if(best.p.cost)move(s,u.id,best.p.x,best.p.y);attack(s,u.id,best.t.id);}
      else{
        // Route through gates using a full BFS, avoiding dead ends behind walls.
        const goals=new Set();
        for(const t of targets)for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
          if(!blocked(s,x,y)&&(!occupant(s,x,y)||(x===u.x&&y===u.y))&&canAttack(s,{...u,x,y},t))goals.add(x+','+y);
        }
        const q=[{x:u.x,y:u.y,path:[]}],seen=new Set([u.x+','+u.y]);let path;
        for(let i=0;i<q.length;i++){
          const p=q[i];if(goals.has(p.x+','+p.y)){path=p.path;break;}
          for(const [dx,dy] of [[-1,0],[0,-1],[0,1],[1,0]]){const x=p.x+dx,y=p.y+dy,k=x+','+y;
            if(!seen.has(k)&&!blocked(s,x,y)&&!occupant(s,x,y)){seen.add(k);q.push({x,y,path:[...p.path,{x,y}]});}
          }
        }
        if(path?.length){const p=path[Math.min(path.length,stats(u).move)-1];move(s,u.id,p.x,p.y);}
        defend(s,u.id);
      }
    }
    if(!s.result&&!s.enemyQueue.length){s.phase='player';s.round++;expireStatuses(s,'player');for(const p of s.units.filter(u=>u.team==='player')){p.moved=false;p.acted=false;p.guarding=false;}}
    return true;
  }
  return {TYPES,COMBAT,stats,createBattle,unit,count,blocked,occupant,reachable,movementPath,lineOfSight,canAttack,attackRange,damage,move,attack,defend,endPlayerTurn,enemyStep,settle};
});
