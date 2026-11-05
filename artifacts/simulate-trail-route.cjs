const C=require('../games/animal-siege/campaign.js'),E=require('../games/animal-siege/engine.js'),{chooseAction}=require('../tools/lib/animal-siege-driver.cjs');
function battle(b){for(let i=0;i<500&&!b.result;i++){if(b.phase==='enemy'){E.enemyStep(b);continue;}const a=chooseAction(b);if(!a){E.endPlayerTurn(b);continue;}const u=b.units.find(u=>u.id===a.id);if(u.x!==a.x||u.y!==a.y)E.move(b,a.id,a.x,a.y);if(a.target)E.attack(b,a.id,a.target);else E.defend(b,a.id);}return b;}
for(const prepareFirst of [false,true])for(const towerFox of [false,true]){const r=C.create();
 C.explore(r,'friends');C.claim(r,'friends','fox');C.explore(r,'timber');C.claim(r,'timber','wood');
 if(prepareFirst){C.upgrade(r,'beaver');C.upgrade(r,'squirrel');C.recruit(r,'beaver',3);C.recruit(r,'squirrel',1);}
 C.explore(r,'cache');C.investigate(r,'cache');C.completeTrailBattle(r,battle(C.beginTrailBattle(r,'cache')));C.claim(r,'cache','gold');
 if(!prepareFirst){C.upgrade(r,'beaver');C.upgrade(r,'squirrel');C.recruit(r,'beaver',3);C.recruit(r,'squirrel',3);}else C.recruit(r,'squirrel',2);C.recruit(r,'fox',1);
 const history=[];for(const id of ['acorn','river','tower']){const b=C.beginBattle(r,id);if(!b)break;C.completeBattle(r,battle(b));history.push({id,result:b.result,army:{...r.army},gold:r.gold});if(b.result!=='victory')break;if(id!=='tower'){C.upgrade(r,'fox');for(const k of (towerFox&&id==='river'?['fox','fox','fox','squirrel','beaver']:['squirrel','beaver','fox']))C.recruit(r,k,3);}}
 console.log(JSON.stringify({prepareFirst,towerFox,result:r.result,history}));}
