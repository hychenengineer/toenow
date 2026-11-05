/* Single-run expedition and skirmishes using the exploration island's original art. */
(function(){
  'use strict';
  const E=window.AnimalSiege,C=window.AnimalExpedition,ID='animal-siege',$=id=>document.getElementById(id);
  const skirmishMode=new URLSearchParams(location.search).get('mode')==='battle';
  let state,run=null,locationId='home',selected=null,targetId=null,isPractice=false,paused=false,timer=null,generation=0,settled=false,expeditionSettled=false;
  let plannedMove=null;
  let feedbackBusy=false,combatVersion=0;
  let pendingFeedback=null;
  let captureShown=false,captureBusy=false,sceneVersion=0;
  let guideResume=false,guideBattle=null,guideRun=null;
  const zh=()=>window.ToenowI18n?.language==='zh-Hant';
  const text=(en,cn)=>zh()?cn:en;
  const name=kind=>text(E.TYPES[kind].name,{beaver:'海狸衛兵',fox:'狐狸斥候',squirrel:'松鼠射手'}[kind]);
  const art=kind=>'../../assets/animal-island/'+kind+'-character.webp';
  const image=kind=>'<img src="'+art(kind)+'" alt="" draggable="false">';
  const byId=id=>state?.units.find(u=>u.id===id);
  const alive=team=>state.units.filter(u=>u.team===team&&u.hp>0);
  let tipStorage;try{tipStorage=window.localStorage;}catch(_){}
  const coach=window.AnimalBattleCoach.create(tipStorage);
  function paintCoach(){
    for(const el of document.querySelectorAll('[data-coach-highlight]')){el.classList.remove('onboarding-focus');el.removeAttribute('data-coach-highlight');const ids=(el.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!=='battle-coach-prompt');if(ids.length)el.setAttribute('aria-describedby',ids.join(' '));else el.removeAttribute('aria-describedby');}
    const a=byId(selected),t=byId(targetId);
    const model=state&&!$('battle').hidden?coach.view({phase:state.phase,result:state.result,paused,busy:feedbackBusy||captureBusy,selected:a,plannedMove:!!plannedMove,
      ready:!plannedMove&&a&&!a.acted&&E.canAttack(state,a,t),targets:a?alive('enemy').filter(t=>E.canAttack(state,a,t)).length:0,hasUnacted:alive('player').some(u=>!u.acted)}):null;
    $('battle-coach').hidden=!model;$('action-hint').hidden=!!model;
    $('battle-coach-replay').hidden=!(run&&!run.result||state&&!state.result);
    $('battle-coach-replay').textContent=state?text('Replay battle tips','重新查看操作提示'):text('Show tips in the next battle','下次戰鬥重看提示');
    if(!model)return;
    $('battle-coach').dataset.step=model.step;$('battle-coach').setAttribute('aria-label',text('Battle tips','戰鬥操作提示'));
    $('battle-coach-label').textContent=text('QUICK TIPS · ','新手提示・')+model.index+'/4';
    $('battle-coach-skip').textContent=text('Skip tips','跳過提示');
    const prompt=text(...model.prompt);if($('battle-coach-prompt').textContent!==prompt)$('battle-coach-prompt').textContent=prompt;
    const highlight=model.selector?document.querySelector(model.selector):null;
    if(highlight){highlight.classList.add('onboarding-focus');highlight.setAttribute('data-coach-highlight','');const ids=highlight.getAttribute('aria-describedby');highlight.setAttribute('aria-describedby',(ids?ids+' ':'')+'battle-coach-prompt');}
  }
  function guideLabels(){
    $('unit-guide-open').textContent=text('Unit Handbook','兵種圖鑑');
    $('unit-guide-open').hidden=!(run&&!run.result||state&&!state.result);
    $('unit-guide-open').disabled=captureBusy;
    $('unit-guide-title').textContent=text('Unit Handbook','兵種圖鑑');
    $('unit-guide-intro').textContent=text('Counters, stats per animal and battlefield roles. Reading pauses the game.','完整克制鏈、每隻動物的能力與用途。閱讀時遊戲暫停。');
    $('unit-guide-close').textContent=text('Close handbook','關閉圖鑑');
    if($('unit-guide').open){const upgrades=run?.upgrades||Object.fromEntries((state?.units||[]).filter(u=>u.team==='player').map(u=>[u.kind,u.trained]));window.AnimalUnitGuide.render($('unit-guide-content'),{text,name,image,upgrades});}
  }
  function openGuide(){
    if(captureBusy||$('unit-guide').open||!(run&&!run.result||state&&!state.result))return;
    guideResume=!paused;guideBattle=state;guideRun=run;pause(true);$('unit-guide').showModal();guideLabels();$('unit-guide-close').focus();
  }
  function closeGuide(resume=true){
    if(!$('unit-guide').open)return;
    const continueGame=resume&&guideResume&&guideBattle===state&&guideRun===run;guideResume=false;
    $('unit-guide').close();if(continueGame)pause(false);
    if(resume&&!$('unit-guide-open').hidden)$('unit-guide-open').focus();
  }
  const sdk=new window.ToenowGameSDK({gameId:ID,category:'logic',onStart:o=>start(o?.wave||1,!!o?.isPractice),onPause:()=>pause(true),onResume:()=>pause(false),onRestart:()=>start(run?.wave||state?.wave||1,isPractice)});
  const feedback=window.AnimalCombatFeedback.create({surface:document.querySelector('.board-surround'),board:$('board'),layer:$('combat-effects'),live:$('combat-announcement'),text,art});
  const siege=window.AnimalSiegeScene.create({flag:document.querySelector('.siege-flag'),notice:$('siege-victory'),title:$('siege-capture-title'),gold:$('siege-gold'),wood:$('siege-wood'),goldLabel:$('siege-gold-label'),woodLabel:$('siege-wood-label'),text});
  function resetSiege(){sceneVersion++;captureShown=false;captureBusy=false;siege.reset();}
  function resetFeedback(){combatVersion++;feedbackBusy=false;pendingFeedback=null;feedback.clear();$('board').setAttribute('aria-busy','false');}
  function playAttack(hit,after){
    const battle=state,version=++combatVersion;feedbackBusy=true;render();
    feedback.play(hit,{...byId(hit.id)},{...byId(hit.targetId)},!!state.result).then(()=>{
      if(version!==combatVersion||state!==battle)return;feedbackBusy=false;if(paused)pendingFeedback=after;else after();
    });
  }
  function playWalk(unit,path,after){
    const battle=state,version=++combatVersion;feedbackBusy=true;render();
    feedback.walk({...unit},path).then(()=>{if(version!==combatVersion||state!==battle)return;feedbackBusy=false;if(paused)pendingFeedback=after;else after();});
  }
  function show(id,visible){const el=$(id);el.hidden=!visible;el.classList.toggle('hidden',!visible);el.classList.toggle('active',visible);}
  function cancel(){generation++;clearTimeout(timer);timer=null;}
  function title(){coach.stop();closeGuide(false);cancel();resetFeedback();resetSiege();plannedMove=null;state=null;run=null;paused=false;sdk.runActive=false;sdk.cancelMaterials();show('pause-layer',false);show('battle',false);show('expedition',false);show('outcome',false);show('gameover-screen',false);show('title-screen',true);document.body.dataset.state='title';ToenowScreens.updateTitle(ID,{bestScore:sdk.loadBestScore(),bestWave:sdk.loadBestWave()});paintCoach();}
  function start(wave=1,practice=false){
    coach.stop();
    closeGuide(false);cancel();resetFeedback();resetSiege();plannedMove=null;isPractice=practice;run=skirmishMode?null:C.create(wave);state=run?null:E.createBattle(wave);locationId='home';selected=state?'p-beaver':null;targetId=null;paused=false;settled=false;expeditionSettled=false;
    sdk.startRun({wave:run?.wave||state.wave,isPractice});show('title-screen',false);show('gameover-screen',false);show('outcome',false);show('pause-layer',false);show('battle',!run);show('expedition',!!run);document.body.dataset.state='playing';if(state)coach.begin();if(run)renderMap();else render();labels();
  }
  function warmFortArt(id){if(!C.FORTS[id])return;for(const kind of id==='acorn'?['battle','wall','gate']:['battle','tree','wall','gate']){const href='../../assets/animal-siege/'+id+'-'+kind+(kind==='wall'||kind==='gate'?'-side-v1.webp':'-v1.webp');if(document.querySelector('link[rel="preload"][href="'+href+'"]'))continue;const link=document.createElement('link');link.rel='preload';link.as='image';link.href=href;document.head.appendChild(link);}}
  function renderMap(){if(!run)return;warmFortArt(locationId);$('expedition').innerHTML=window.AnimalExpeditionView.render(run,locationId,{text,name,image});guideLabels();paintCoach();}
  function launchBattle(id){
    if(paused||!run)return false;closeGuide(false);const next=C.beginBattle(run,id);if(!next)return false;
    warmFortArt(id);
    cancel();resetFeedback();resetSiege();plannedMove=null;state=next;settled=false;selected=alive('player')[0]?.id||null;targetId=null;
    coach.begin();
    show('expedition',false);show('battle',true);document.body.dataset.state='playing';render();window.scrollTo({top:0,behavior:'instant'});return true;
  }
  function paintOutcome(){
    $('outcome').textContent=run?(run.result==='victory'?text('All three forts captured. Expedition complete!','三座城堡全數攻下，遠征成功！'):text('No troops or supplies remain. Your expedition ends here.','部隊與補給都已耗盡，這趟遠征結束了。')):(state?.result==='victory'?text('Fort captured! +140 gold · +40 wood','攻下堡壘！獲得 140 金幣・40 木材'):text('The fort held. Try a different formation.','攻城未成，再試試不同的站位！'));
  }
  function endExpedition(){
    if(!run||!run.result||expeditionSettled)return;expeditionSettled=true;cancel();resetFeedback();
    const score=C.score(run),wave=run.wave+Math.max(0,C.captured(run)-1);
    sdk.handleGameOver({score,wave,isPractice});
    ToenowScreens.updateGameOver(ID,{score,bestScore:sdk.loadBestScore(),wave,combo:null,reason:'GAME OVER'});
    paintOutcome();guideLabels();
    show('outcome',true);show('gameover-screen',true);document.body.dataset.state='gameover';
  }
  function retreat(){if(!run||!state||paused||feedbackBusy||state.phase!=='player')return;state.result='retreat';state.phase='finished';finish();}
  function finish(){
    if(!state||settled||captureBusy)return;
    coach.end(state.result);
    closeGuide(false);
    if(state.result==='victory'&&!captureShown){
      captureShown=true;captureBusy=true;cancel();resetFeedback();const battle=state,version=++sceneVersion;
      const fort=C.FORTS[state.fortId||'acorn'];render();
      siege.capture({name:text(fort.name,fort.nameZh),gold:fort.gold,wood:fort.wood}).then(()=>{if(sceneVersion!==version||state!==battle)return;captureBusy=false;finish();});return;
    }
    settled=true;cancel();resetFeedback();plannedMove=null;
    if(run){
      if(!C.completeBattle(run,state))return;
      if(run.result){endExpedition();return;}
      state=null;selected=null;targetId=null;locationId='home';show('battle',false);show('expedition',true);renderMap();window.scrollTo({top:0,behavior:'instant'});return;
    }
    const score=state.score??(state.result==='victory'?300+alive('player').reduce((n,u)=>n+E.count(u)*10,0):state.units.filter(u=>u.team==='enemy').reduce((n,u)=>n+(u.hp===0?30:0),0));
    sdk.handleGameOver({score,wave:state.wave,isPractice});
    ToenowScreens.updateGameOver(ID,{score,bestScore:sdk.loadBestScore(),wave:state.wave,combo:null,reason:'GAME OVER'});
    paintOutcome();guideLabels();
    show('outcome',true);show('gameover-screen',true);document.body.dataset.state='gameover';
  }
  function pause(value){if(captureBusy||(!state&&!run)||run?.result||(!run&&state?.result))return;paused=value;cancel();show('pause-layer',value);document.body.dataset.state=value?'paused':'playing';labels();if(!value&&!feedbackBusy){if(pendingFeedback){const next=pendingFeedback;pendingFeedback=null;next();}else if(state?.result)finish();else if(state?.phase==='enemy')scheduleEnemy();}}
  function afterEnemyAction(){
    if(state.result)finish();else if(state.phase==='enemy'){render();scheduleEnemy();}else{selected=alive('player').find(u=>!u.acted)?.id||null;render();}
  }
  function scheduleEnemy(){
    const token=generation;
    timer=setTimeout(()=>{
      if(token!==generation||paused||!state||state.phase!=='enemy')return;
      const previous=state.last,before={...state,units:state.units.map(u=>({...u}))},actorBefore=before.units.find(u=>u.id===state.enemyQueue[0]);E.enemyStep(state);targetId=null;
      const hit=state.last!==previous&&state.last?.type==='attack'?{...state.last}:null;
      const next=()=>hit?playAttack(hit,afterEnemyAction):afterEnemyAction();
      const actorAfter=actorBefore?byId(actorBefore.id):null,path=actorAfter&&actorBefore.hp>0?E.movementPath(before,actorBefore,actorAfter.x,actorAfter.y):[];
      if(path.length>1)playWalk(actorAfter,path,next);else next();
    },650);
  }
  function endTurn(){if(paused||feedbackBusy||plannedMove||!state||!E.endPlayerTurn(state))return;coach.endTurn();selected=null;targetId=null;render();scheduleEnemy();}
  function choose(id){const u=byId(id);if(paused||feedbackBusy||state?.phase!=='player'||!u||u.team!=='player'||u.hp<=0)return;coach.choose();plannedMove=null;selected=id;targetId=null;render();}
  function confirmMove(){
    if(paused||feedbackBusy||state?.phase!=='player'||!plannedMove||plannedMove.id!==selected)return;
    const move=plannedMove,unit=byId(move.id),path=E.movementPath(state,unit,move.x,move.y);plannedMove=null;targetId=null;
    if(E.move(state,move.id,move.x,move.y))playWalk(unit,path,render);else render();
  }
  function confirmAttack(){
    if(paused||feedbackBusy||captureBusy||plannedMove||!state||state.phase!=='player'||state.result)return;
    const a=byId(selected),t=byId(targetId);
    if(!a||a.acted||!t||!E.canAttack(state,a,t)||!E.attack(state,a.id,t.id))return;
    coach.attack();
    targetId=null;playAttack({...state.last},()=>{selected=alive('player').find(p=>!p.acted)?.id||a.id;render();if(state.result)finish();});
  }
  function clickTile(x,y){
    if(!state||paused||feedbackBusy||state.phase!=='player')return;
    const u=E.occupant(state,x,y),a=byId(selected);
    if(u?.team==='player'){choose(u.id);return;}
    if(u?.team==='enemy'){
      if(plannedMove){$('confirm-move').focus();return;}
      if(!a||a.acted)return;
      targetId=u.id;render();
      return;
    }
    if(a&&!a.acted&&!a.moved&&E.reachable(state,a).some(p=>p.cost>0&&p.x===x&&p.y===y)){
      plannedMove={id:a.id,x,y};targetId=null;render();
    }
  }
  function render(){
    if(!state)return;
    guideLabels();
    $('board').setAttribute('aria-busy',String(feedbackBusy||captureBusy));
    const a=byId(selected),canAct=state.phase==='player'&&!paused&&!feedbackBusy&&!captureBusy&&!state.result;
    const reachable=a&&!a.acted&&!a.moved&&canAct?E.reachable(state,a):[];
    const attackOrigin=plannedMove&&a?{...a,x:plannedMove.x,y:plannedMove.y}:a;
    const attackRange=state.phase==='player'&&!paused&&!state.result?E.attackRange(state,attackOrigin):[];
    const active=document.activeElement?.dataset?.cell;
    $('edition').textContent=run?text('MISTWOOD EXPEDITION · LOSSES PERSIST','迷霧森林遠征・戰損會保留'):text('BATTLE PROTOTYPE · EXPLORATION ISLAND','戰鬥試玩版・探索島動物');
    $('battle-name').textContent=run?text(C.FORTS[state.fortId].name,C.FORTS[state.fortId].nameZh):text('The Acorn Fort','橡果堡攻城戰');
    $('objective').textContent=text('Outsmart a larger army. Defeat all three defending squads.','用克制與站位，以少勝多，擊敗三隊守軍。');
    $('round-label').textContent=text('ROUND','回合');$('round-number').textContent=state.round;
    $('ally-label').textContent=text('● YOUR SQUADS','● 我方部隊');$('enemy-label').textContent=text('◆ DEFENDERS','◆ 敵方守軍');
    $('phase-label').textContent=state.result?text('Battle complete','戰鬥結束'):state.phase==='player'?text('Your turn · take your time','我方回合・慢慢思考'):text('Defenders are moving…','守軍正在行動…');
    $('squad-label').textContent=text('YOUR EXPEDITION','你的遠征小隊');
    $('tile-help').textContent=plannedMove?text('Blue footprints: move · Orange stripes: attack from preview','藍色腳印：移動・橘紅斜線：預覽位置的攻擊範圍'):text('Blue footprints: move · Orange stripes: attack range · Red swords: attackable enemies','藍色腳印：移動・橘紅斜線：攻擊範圍・紅色劍：可攻擊敵人');
    const fort=run?C.FORTS[state.fortId]:{gold:140,wood:40};
    const sceneFort=C.FORTS[state.fortId||'acorn'];$('battle').dataset.fort=state.fortId||'acorn';
    $('siege-label').textContent=text(sceneFort.name+' · Siege gate',sceneFort.nameZh+'・攻城入口');
    siege.update({name:text(sceneFort.name,sceneFort.nameZh),gold:fort.gold,wood:fort.wood});
    $('reward-preview').textContent=text('FORT REWARD · ','攻城獎勵・')+fort.gold+text(' gold / ',' 金幣／')+fort.wood+text(' wood',' 木材');
    $('prototype-note').textContent=run?text('Retreat on your turn to preserve survivors. Both armies retain losses.','可在我方回合撤退，保留剩餘部隊；雙方戰損都會留下。'):text('Battle prototype · Exploration, recruiting and construction will come after this playtest.','單場戰鬥練習・想探索與招兵，請從一般入口開始遠征。');
    let board='';
    for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++){
      const actual=E.occupant(state,x,y),wall=state.walls.some(p=>p[0]===x&&p[1]===y),tree=state.trees.some(p=>p[0]===x&&p[1]===y);
      const destination=!!plannedMove&&plannedMove.x===x&&plannedMove.y===y,origin=!!plannedMove&&actual?.id===plannedMove.id;
      const u=destination?byId(plannedMove.id):origin?null:actual;
      const target=!plannedMove&&canAct&&a&&!a.acted&&E.canAttack(state,a,actual),reach=!u&&reachable.some(p=>p.x===x&&p.y===y&&p.cost>0);
      const inRange=attackRange.some(p=>p.x===x&&p.y===y);
      const classes=['tile',wall?'wall':'',tree?'tree':'',x===5&&!wall?'gate':'',x===7&&y===1?'flag':'',reach?'reachable':'',u?'has-unit':'',u?.team==='enemy'?'enemy-unit':'',u?.acted?'spent':'',u?.id===selected?'selected':'',target?'target':'',target&&u?.id===targetId?'attack-picked':'',inRange?'attack-range':'',plannedMove&&inRange?'range-preview':'',destination?'move-destination':'',origin?'move-origin':''].filter(Boolean).join(' ');
      const label=origin?text('Starting position · tap to cancel move','原本位置・點選取消移動'):(destination?text('Move preview · ','移動預覽・'):'')+(u?text(u.team==='player'?'Ally ':'Enemy ',u.team==='player'?'我方':'敵方')+name(u.kind)+' ×'+E.count(u)+(u.acted?text(' · done','・已行動'):''):wall?text('Wall','城牆'):tree?text('Tree','樹木'):x===5&&!wall?text('Open gate','可通行城門'):text('Tile','格子')+' '+(x+1)+','+(y+1));
      board+='<button type="button" class="'+classes+'" data-cell="'+x+','+y+'" aria-label="'+label+(inRange?text(' · In attack range','・在攻擊範圍內'):'')+(target?text(' · Select attack target','・選取攻擊目標'):'')+'"'+(wall||tree?' disabled':'')+'>'+(x===5&&!wall?'<span class="gate-lane" aria-hidden="true"></span>':'')+(u?image(u.kind)+'<span class="unit-count">'+E.count(u)+'</span>'+(u.guarding?'<span class="unit-shield">◈</span>':'')+(target?'<span class="target-marker" aria-hidden="true">⚔</span>':''):origin?'↶':wall?'<span class="wood-wall" aria-hidden="true"><i></i><i></i><i></i></span>':tree?'<span class="battle-tree" aria-hidden="true">♣</span>':'')+'</button>';
    }
    $('board').innerHTML=board;
    if(active)$('board').querySelector('[data-cell="'+active+'"]')?.focus({preventScroll:true});
    $('roster').innerHTML=state.units.filter(u=>u.team==='player').map(u=>'<button type="button" class="roster-unit '+(u.id===selected?'active':'')+'" data-unit="'+u.id+'" '+(!canAct||u.hp<=0?'disabled':'')+'>'+image(u.kind)+'<span><strong>'+name(u.kind)+'</strong><small>'+(u.hp<=0?text('Retreated','已退場'):u.acted?text('Done this round','本回合已行動'):u.moved?text('Moved · attack or defend','已移動・可攻擊或防守'):text('Ready to act','等待指令'))+'</small></span><b>'+E.count(u)+'</b></button>').join('');
    $('selection').innerHTML=a&&a.hp>0?'<strong>'+name(a.kind)+(a.trained?' ✦':'')+'</strong>'+text('Move ','移動 ')+E.stats(a).move+text(' · Range ',' 格・射程 ')+E.stats(a).range+text(' · HP ',' 格・生命 ')+a.hp: text('Choose one of your squads.','點選一隊我方動物。');
    const t=byId(targetId);
    const predicted=t&&a?Math.min(E.damage(state,a,t),t.hp):0;
    const predictedLoss=t?E.count(t)-Math.ceil(Math.max(0,t.hp-predicted)/E.TYPES[t.kind].hp):0;
    const targets=canAct&&a&&!a.acted?alive('enemy').filter(t=>E.canAttack(state,a,t)):[];
    const ready=!!(canAct&&!plannedMove&&a&&!a.acted&&t&&E.canAttack(state,a,t));
    $('action-hint').textContent=captureBusy||state.result?text('Battle complete','戰鬥結束'):paused?text('Battle paused','戰鬥已暫停'):feedbackBusy?text('Action in progress…','行動中…'):state.phase==='enemy'?text('Watch the defenders. Your turn is next.','觀察守軍的行動，接著輪到你。'):plannedMove?text('Confirm this move, or choose another blue tile.','按「確定移動」，或改選其他藍色格子。'):ready?text('Target selected. Press the attack button below.','已選取目標，按下方「攻擊」按鈕出手。'):!a||a.acted?text('Choose another squad, or end your turn.','選擇其他部隊，或結束回合。'):a.moved?(targets.length?text('You can still attack! Select a red-sword enemy.','還可以攻擊！請選擇紅色劍標記的敵人。'):text('No enemy in range. Defend or choose another squad.','目前沒有可攻擊的敵人，可以防守或操作其他動物。')):text('Choose a blue tile to move, or select a red-sword enemy to attack.','選藍色格子移動，或選紅色劍標記的敵人攻擊。');
    $('preview').hidden=!t||!a||!!plannedMove||!canAct;
    $('preview').textContent=t&&a?(E.canAttack(state,a,t)?name(a.kind)+' → '+name(t.kind)+' · '+text('Predicted damage ','預計傷害 ')+predicted+text(' · troops lost ','・減兵 ')+predictedLoss+(E.TYPES[a.kind].counters===t.kind?text(' · Counter ×1.8','・克制 ×1.8'):''):text('Out of reach, or the wall blocks your shot. Move to a clear position.','距離太遠，或城牆擋住射線。先移動到合適位置。')):'';
    $('confirm-attack').hidden=!ready;$('confirm-attack').disabled=!ready;
    $('confirm-attack').textContent=ready?text('⚔ Attack '+name(t.kind),'⚔ 攻擊'+name(t.kind)):text('⚔ Attack','⚔ 攻擊');
    $('action-hint').dataset.step=plannedMove?'move':ready?'attack':canAct&&a?.moved&&targets.length?'target':'choose';
    $('move-confirmation').hidden=!plannedMove;
    $('confirm-move').textContent=text('Confirm move','確定移動');$('confirm-move').disabled=!plannedMove||!canAct;
    $('cancel-move').textContent=text('Cancel','取消');$('cancel-move').disabled=!plannedMove||!canAct;
    $('defend').textContent=text('◈ Defend','◈ 防守');$('defend').disabled=!!plannedMove||!canAct||!a||a.acted;
    $('end-turn').textContent=text('End turn →','結束回合 →');$('end-turn').disabled=!!plannedMove||!canAct;
    $('restart').textContent=run?text('Retreat to camp · keep losses','撤回基地・保留戰損'):text('Restart this battle','重新挑戰這場戰鬥');$('restart').disabled=!!run&&!canAct;
    $('counter-strip').innerHTML=Object.keys(E.TYPES).map(k=>'<div class="counter-pair">'+image(k)+'<b>'+name(k)+'</b><span>'+text('beats →','克制 →')+'</span>'+image(E.TYPES[k].counters)+'</div>').join('');
    $('journal-label').textContent=text('BATTLE JOURNAL','戰場紀錄');
    $('journal').textContent=state.log.length?state.log.slice(-2).map(hit=>{const u=byId(hit.id),t=byId(hit.targetId);return text(u.team==='player'?'Ally ':'Enemy ',u.team==='player'?'我方':'敵方')+name(u.kind)+' → '+name(t.kind)+text(' · damage ','・傷害 ')+(hit.actualDamage??hit.damage)+text(' · lost ','・損失 ')+hit.loss;}).join(' / '):text('Allies: ','我方 ')+alive('player').reduce((n,u)=>n+E.count(u),0)+text(' · Defenders: ',' 隻・守軍 ')+alive('enemy').reduce((n,u)=>n+E.count(u),0)+text('. Let the counters do the work.',' 隻。靠克制與站位找出勝機。');
    paintCoach();
  }
  ToenowScreens.mount(ID);
  // Contextual tips follow the real battle; the shared sandbox lesson is not registered.
  const lessonButton=document.querySelector('#title-screen [data-tutorial-replay]');
  if(lessonButton)lessonButton.hidden=true;
  $('btn-start').addEventListener('click',()=>start());
  $('btn-retry').addEventListener('click',()=>start(run?.wave||state?.wave||1,isPractice));
  $('btn-title').addEventListener('click',title);
  // #title-screen supplies the shared practice selector, including its five tiers.
  window.ToenowLevels.setupPracticeMode({container:'#title-screen .unified-title-card',onStartGame:(wave,isPractice)=>start(wave,isPractice)});
  $('board').addEventListener('click',e=>{const cell=e.target.closest('[data-cell]');if(cell){const [x,y]=cell.dataset.cell.split(',').map(Number);clickTile(x,y);}});
  $('roster').addEventListener('click',e=>{const el=e.target.closest('[data-unit]');if(el)choose(el.dataset.unit);});
  $('confirm-move').addEventListener('click',confirmMove);
  $('confirm-attack').addEventListener('click',confirmAttack);
  $('battle-coach-skip').addEventListener('click',()=>{coach.skip();paintCoach();});
  $('battle-coach-replay').addEventListener('click',()=>{if(captureBusy||!(run&&!run.result||state&&!state.result))return;coach.replay(!!state);pause(false);});
  $('unit-guide-open').addEventListener('click',openGuide);
  $('unit-guide-close').addEventListener('click',()=>closeGuide());
  $('unit-guide').addEventListener('cancel',e=>{e.preventDefault();closeGuide();});
  $('unit-guide').addEventListener('click',e=>{if(e.target!==$('unit-guide'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGuide();});
  $('cancel-move').addEventListener('click',()=>{if(!paused&&plannedMove){plannedMove=null;render();}});
  $('defend').addEventListener('click',()=>{if(!paused&&!feedbackBusy&&!plannedMove&&state?.phase==='player'&&E.defend(state,selected)){selected=alive('player').find(u=>!u.acted)?.id||null;targetId=null;render();}});
  $('end-turn').addEventListener('click',endTurn);
  $('restart').addEventListener('click',()=>run?retreat():start(state?.wave||1,isPractice));
  $('expedition').addEventListener('click',e=>{
    if(!run||run.result||paused||state)return;
    const button=e.target.closest('button');if(!button||button.disabled)return;const d=button.dataset;
    if(d.location){locationId=d.location;renderMap();return;}
    if(d.prepare){if(C.prepare(run,d.prepare)){locationId='home';renderMap();}return;}
    if(d.attack){launchBattle(d.attack);return;}
    let changed=false;
    if(d.explore)changed=C.explore(run,d.explore);
    if(d.claim)changed=C.claim(run,d.claim,d.choice);
    if(d.recruit)changed=C.recruit(run,d.recruit,Number(d.amount));
    if(d.upgrade)changed=C.upgrade(run,d.upgrade);
    if(changed){if(run.result)endExpedition();else renderMap();}
  });
  $('back').addEventListener('click',()=>{cancel();sdk.exitToHub();});
  $('menu').addEventListener('click',()=>pause(true));$('resume').addEventListener('click',()=>pause(false));$('title-button').addEventListener('click',title);
  function labels(){if(state)render();else if(run)renderMap();guideLabels();if(!$('outcome').hidden)paintOutcome();$('pause-label').textContent=text('Take a breather','休息一下');$('resume').textContent=text('Continue','繼續');$('title-button').textContent=run?text('Title screen · end this run','返回標題・結束這一局'):text('Title screen','返回標題');}
  window.addEventListener('toenow:languagechange',labels);
  window.addEventListener('keydown',e=>{if(e.key!=='Escape'||$('unit-guide').open)return;if(plannedMove&&!paused){plannedMove=null;render();return;}if(run&&!run.result||state&&!state.result)pause(!paused);});
  window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.parent)return;if(e.data?.type==='GAME_RESTART')sdk.restart();if(e.data?.type==='GAME_PAUSE')sdk.pause();if(e.data?.type==='GAME_RESUME')sdk.resume();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&(run&&!run.result||state&&!state.result))pause(true);});
  labels();title();
})();
