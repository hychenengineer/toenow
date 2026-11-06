/* Single-run expedition and skirmishes using the exploration island's original art. */
(function(){
  'use strict';
  const E=window.AnimalSiege,C=window.AnimalExpedition,ID='animal-siege',$=id=>document.getElementById(id);
  const skirmishMode=new URLSearchParams(location.search).get('mode')==='battle';
  let state,run=null,locationId='home',selected=null,targetId=null,isPractice=false,paused=false,timer=null,generation=0,settled=false,expeditionSettled=false;
  let plannedMove=null,orderMode=null;
  let scene='map',campBuilding=null,locationOpen=false,campOpen=false,trailOpen=false;
  let lessonReturn=null;
  let lessonRequested=false,opening=null;
  const openingHost=$('opening-story');
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
  const introduction=window.AnimalOpeningStory.progress(tipStorage);
  function clearLessonLocks(){for(const el of document.querySelectorAll('[data-lesson-locked]')){el.disabled=el.dataset.lessonLocked==='true';delete el.dataset.lessonLocked;}}
  function keepLessonTargetVisible(){
    if(!coach.isLesson||$('battle-coach').hidden)return;
    const target=document.querySelector('[data-coach-highlight]');if(!target)return;
    const rect=target.getBoundingClientRect(),dock=document.querySelector('.battle-actions');
    const limit=innerHeight-12;
    if(rect.top<10||rect.bottom>limit-8)target.scrollIntoView({block:'center',behavior:'instant'});
  }
  function measureOrderDock(){
    if(!$('battle').hidden&&innerWidth<=780){const h=document.querySelector('.battle-actions').getBoundingClientRect().height;$('battle').style.setProperty('--order-dock-height',(h+24)+'px');}
  }
  function positionCoach(){
    const box=$('battle-coach'),shade=$('lesson-shade'),target=document.querySelector('[data-coach-highlight]');
    shade.hidden=box.hidden||!coach.isLesson;
    if(shade.hidden||!target)return;
    const r=target.getBoundingClientRect(),pad=5,l=Math.max(0,r.left-pad),t=Math.max(0,r.top-pad),right=Math.min(innerWidth,r.right+pad),bottom=Math.min(innerHeight,r.bottom+pad);
    shade.style.clipPath=`polygon(evenodd,0px 0px,${innerWidth}px 0px,${innerWidth}px ${innerHeight}px,0px ${innerHeight}px,0px 0px,${l}px ${t}px,${right}px ${t}px,${right}px ${bottom}px,${l}px ${bottom}px,${l}px ${t}px)`;
    const h=box.offsetHeight,w=box.offsetWidth;
    box.style.left=Math.max(10,Math.min(innerWidth-w-10,r.left+r.width/2-w/2))+'px';
    const dock=document.querySelector('.battle-actions'),dockRect=dock.getBoundingClientRect();
    const above=innerWidth<=780&&dock.contains(target)?dockRect.top-h-12:r.top-h-12;
    box.style.top=Math.max(10,Math.min(innerHeight-h-10,innerWidth<=780&&dock.contains(target)?above:r.bottom+h+12<innerHeight?r.bottom+12:above))+'px';
  }
  function startLesson(){
    if(lessonReturn||!state)return;
    lessonReturn={state,selected,targetId,plannedMove};cancel();resetFeedback();resetSiege();
    state=window.AnimalBattleCoach.createLessonBattle(E);selected=null;targetId=null;plannedMove=null;paused=false;
    show('pause-layer',false);document.body.dataset.state='playing';coach.beginLesson();render();
  }
  function restoreLesson(){
    if(!lessonReturn)return;
    cancel();resetFeedback();resetSiege();const saved=lessonReturn;lessonReturn=null;
    state=saved.state;selected=saved.selected;targetId=saved.targetId;plannedMove=saved.plannedMove;
    coach.stop();render();
    if(state.phase==='enemy')scheduleEnemy();
  }
  function paintCoach(){
    clearLessonLocks();
    for(const el of document.querySelectorAll('[data-coach-highlight]')){el.classList.remove('onboarding-focus');el.removeAttribute('data-coach-highlight');const ids=(el.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!=='battle-coach-prompt');if(ids.length)el.setAttribute('aria-describedby',ids.join(' '));else el.removeAttribute('aria-describedby');}
    const a=byId(selected),t=byId(targetId);
    const model=state&&!$('battle').hidden&&!orderMode?coach.view({phase:state.phase,result:state.result,paused,busy:feedbackBusy||captureBusy,selected:a,plannedMove:!!plannedMove,
      ready:a&&!a.acted&&E.canAttack(state,plannedMove?{...a,x:plannedMove.x,y:plannedMove.y}:a,t),targets:a?alive('enemy').filter(t=>E.canAttack(state,a,t)).length:0,hasUnacted:alive('player').some(u=>!u.acted)}):null;
    $('battle-coach').hidden=!model;$('action-hint').hidden=false;
    $('battle').dataset.lesson=String(!!lessonReturn);
    $('battle-coach-replay').hidden=!(run&&!run.result||state&&!state.result);
    $('battle-coach-replay').disabled=feedbackBusy||!!lessonReturn||state?.phase==='enemy';
    $('battle-coach-replay').textContent=state?text('Replay battle tips','重新查看操作提示'):text('Show tips in the next battle','下次戰鬥重看提示');
    if(!model){$('lesson-shade').hidden=true;return;}
    $('battle-coach').dataset.guided=String(!!model.guided);
    $('battle-coach').dataset.step=model.step;$('battle-coach').setAttribute('aria-label',text('Battle tips','戰鬥操作提示'));
    $('battle-coach-label').textContent=text('HANDS-ON · ','操作演練・')+model.index+'/'+(model.total||4);
    $('battle-coach-skip').textContent=text('Skip lesson','跳過演練');
    const prompt=text(...model.prompt);if($('battle-coach-prompt').textContent!==prompt)$('battle-coach-prompt').textContent=prompt;
    const highlight=model.selector?document.querySelector(model.selector):null;
    if(highlight){highlight.classList.add('onboarding-focus');highlight.setAttribute('data-coach-highlight','');const ids=highlight.getAttribute('aria-describedby');highlight.setAttribute('aria-describedby',(ids?ids+' ':'')+'battle-coach-prompt');}
    if(model.guided){
      for(const el of document.querySelectorAll('#board button,.battle-actions button,#end-turn,#restart'))if(el!==highlight){el.dataset.lessonLocked=String(el.disabled);el.disabled=true;}
      // Bring the required action into view, accounting for the fixed mobile order dock.
      requestAnimationFrame(()=>{measureOrderDock();keepLessonTargetVisible();positionCoach();});
    }
  }
  function guideLabels(){
    $('unit-guide-open').textContent=text('Unit Handbook','兵種圖鑑');
    $('unit-guide-open').hidden=!!opening||!(run&&!run.result||state&&!state.result);
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
  const sdk=new window.ToenowGameSDK({gameId:ID,category:'logic',onStart:o=>begin(o?.wave||1,!!o?.isPractice),onPause:()=>pause(true),onResume:()=>pause(false),onRestart:()=>begin(run?.wave||lessonReturn?.state.wave||state?.wave||1,isPractice)});
  const feedback=window.AnimalCombatFeedback.create({surface:document.querySelector('.board-surround'),board:$('board'),layer:$('combat-effects'),live:$('combat-announcement'),text,art});
  const siege=window.AnimalSiegeScene.create({flag:document.querySelector('.siege-flag'),notice:$('siege-victory'),title:$('siege-capture-title'),gold:$('siege-gold'),wood:$('siege-wood'),goldLabel:$('siege-gold-label'),woodLabel:$('siege-wood-label'),text});
  function resetSiege(){sceneVersion++;captureShown=false;captureBusy=false;siege.reset();}
  function resetFeedback(){clearOrder();combatVersion++;feedbackBusy=false;pendingFeedback=null;feedback.clear();$('board').setAttribute('aria-busy','false');}
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
  function setScene(value){clearOrder();closeLocation(false);closeJourney('camp',false);closeJourney('trail',false);scene=value;for(const id of ['expedition','camp','trail','battle'])show(id,id===(value==='map'?'expedition':value));}
  function closeJourney(kind,focus=true){
    if(kind==='camp')campOpen=false;else trailOpen=false;
    const dialog=$(kind+'-dialog');if(dialog?.open)dialog.close();
    if(focus&&scene===kind)(kind==='camp'?$('camp').querySelector('[data-building="'+campBuilding+'"]'):$('trail-inspect'))?.focus({preventScroll:true});
  }
  function bindJourney(kind,isOpen){
    const dialog=$(kind+'-dialog');
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeJourney(kind);});
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeJourney(kind);});
    if(isOpen&&scene===kind&&!paused)dialog.showModal();
  }
  function renderCamp(){if(run){$('camp').innerHTML=window.AnimalCampView.render(run,campBuilding,{text,name,image});bindJourney('camp',campOpen);}guideLabels();paintCoach();if(opening)paintOpening();}
  function renderTrail(){if(run){$('trail').innerHTML=window.AnimalTrailView.render(run,locationId,{text,name,image});bindJourney('trail',trailOpen);}guideLabels();paintCoach();}
  function openCamp(){if(paused||!run||run.result||state)return;campBuilding=null;setScene('camp');renderCamp();window.scrollTo({top:0,behavior:'instant'});}
  function enterTrail(id){if(paused||!run||state||run.result||!C.SITES[id]?.guards)return;C.explore(run,id);locationId=id;setScene('trail');trailOpen=true;renderTrail();window.scrollTo({top:0,behavior:'instant'});}
  function launchTrailBattle(id){
    if(paused||!run)return false;const next=C.beginTrailBattle(run,id);if(!next)return false;
    cancel();resetFeedback();resetSiege();plannedMove=null;state=next;settled=false;selected=alive('player')[0]?.id||null;targetId=null;
    setScene('battle');window.scrollTo({top:0,behavior:'instant'});if(lessonRequested||coach.needsLesson){lessonRequested=false;startLesson();}else render();return true;
  }
  function cancel(){generation++;clearTimeout(timer);timer=null;}
  function closeOpening(){
    opening=null;show('opening-story',false);$('expedition').inert=false;$('camp').inert=false;
    if(run&&!run.result)document.body.dataset.state=paused?'paused':'playing';
  }
  function paintOpening(){
    if(!opening)return;
    const current=opening.current(),copy=window.AnimalOpeningStory.copy,inCamp=current.phase==='camp';
    const translate=value=>window.ToenowI18n?.t(value)||value;
    show('opening-story',!paused);
    $('expedition').inert=!paused;$('camp').inert=!paused;
    $('story-chapter').textContent=translate(inCamp?copy.campChapter:copy.chapter);
    $('story-heading').textContent=translate(inCamp?copy.campTitle:copy.title);
    $('story-progress').textContent=(current.index+1)+' / '+current.total;
    $('story-speaker').textContent=translate(copy[current.speaker]);
    $('story-dialogue').textContent=translate(current.text);
    $('story-next').textContent=translate(inCamp?(current.last?copy.finish:current.index===0?copy.recruit:copy.train):(current.last?copy.depart:copy.next));
    $('story-skip').textContent=translate(copy.skip);
    const character=openingHost.querySelector('[data-story-character]');character.dataset.storyCharacter=current.speaker;
    character.querySelector('figcaption').textContent=translate(copy[current.speaker]);$('story-portrait').src=art(current.speaker);
  }
  function begin(wave=1,practice=false){
    start(wave,practice);
    if(skirmishMode||practice)return;
    const saved=introduction.read();
    if(saved?.status==='completed'||saved?.status==='skipped')return;
    opening=window.AnimalOpeningStory.create(saved);
    if(opening.current().phase==='camp')openCamp();
    introduction.save(opening.current());document.body.dataset.state='story';
    paintOpening();guideLabels();$('story-next').focus({preventScroll:true});
  }
  function advanceOpening(){
    if(!opening||paused)return;
    const current=opening.current();
    if(current.phase==='story'&&current.last){opening.enterCamp();openCamp();}
    else if(current.phase==='camp'&&current.last){finishOpening('completed');return;}
    else opening.advance();
    introduction.save(opening.current());paintOpening();$('story-next').focus({preventScroll:true});
  }
  function finishOpening(status='skipped'){if(opening)introduction.finish(status);closeOpening();guideLabels();const target=scene==='camp'?$('camp').querySelector('[data-building="beaver"]'):$('expedition').querySelector('[data-location="home"]');target?.focus({preventScroll:true});}
  function title(){closeOpening();lessonRequested=false;clearOrder();closeLocation(false);closeJourney('camp',false);closeJourney('trail',false);coach.stop();lessonReturn=null;closeGuide(false);cancel();resetFeedback();resetSiege();plannedMove=null;state=null;run=null;paused=false;sdk.runActive=false;sdk.cancelMaterials();show('pause-layer',false);show('battle',false);show('expedition',false);show('camp',false);show('trail',false);scene='map';campBuilding=null;show('outcome',false);show('gameover-screen',false);show('title-screen',true);document.body.dataset.state='title';ToenowScreens.updateTitle(ID,{bestScore:sdk.loadBestScore(),bestWave:sdk.loadBestWave()});paintCoach();}
  function start(wave=1,practice=false){
    closeOpening();lessonRequested=false;
    coach.stop();lessonReturn=null;
    closeGuide(false);cancel();resetFeedback();resetSiege();plannedMove=null;isPractice=practice;run=skirmishMode?null:C.create(wave);state=run?null:E.createBattle(wave);locationId='home';selected=state?'p-beaver':null;targetId=null;paused=false;settled=false;expeditionSettled=false;
    sdk.startRun({wave:run?.wave||state.wave,isPractice});show('title-screen',false);show('gameover-screen',false);show('outcome',false);show('pause-layer',false);campBuilding=null;setScene(run?'map':'battle');document.body.dataset.state='playing';if(state&&coach.needsLesson)startLesson();if(run)renderMap();else render();labels();
  }
  function warmFortArt(id){if(!C.FORTS[id])return;for(const kind of id==='acorn'?['battle','wall','gate']:['battle','tree','wall','gate']){const href='../../assets/animal-siege/'+id+'-'+kind+(kind==='wall'||kind==='gate'?'-side-v1.webp':'-v1.webp');if(document.querySelector('link[rel="preload"][href="'+href+'"]'))continue;const link=document.createElement('link');link.rel='preload';link.as='image';link.href=href;document.head.appendChild(link);}}
  function closeLocation(focus=true){locationOpen=false;const dialog=$('location-dialog');if(dialog?.open)dialog.close();if(focus&&scene==='map')$('expedition').querySelector('[data-location="'+locationId+'"]')?.focus({preventScroll:true});}
  function renderMap(){
    if(!run)return;warmFortArt(locationId);$('expedition').innerHTML=window.AnimalExpeditionView.render(run,locationId,{text,name,image});
    const dialog=$('location-dialog');
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeLocation();});
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeLocation();});
    if(locationOpen&&scene==='map'&&!paused)dialog.showModal();
    guideLabels();paintCoach();
  }
  function launchBattle(id){
    if(paused||!run)return false;closeGuide(false);const next=C.beginBattle(run,id);if(!next)return false;
    warmFortArt(id);
    cancel();resetFeedback();resetSiege();plannedMove=null;state=next;settled=false;selected=alive('player')[0]?.id||null;targetId=null;
    setScene('battle');document.body.dataset.state='playing';window.scrollTo({top:0,behavior:'instant'});if(lessonRequested||coach.needsLesson){lessonRequested=false;startLesson();}else render();return true;
  }
  function paintOutcome(){
    $('outcome').textContent=run?(run.result==='victory'?text('All three forts captured. Expedition complete!','三座城堡全數攻下，遠征成功！'):text('No troops or supplies remain. Your expedition ends here.','部隊與補給都已耗盡，這趟遠征結束了。')):(state?.result==='victory'?text('Fort captured! +140 gold · +40 wood','攻下堡壘！獲得 140 金幣・40 木材'):text('The fort held. Try a different formation.','攻城未成，再試試不同的站位！'));
  }
  function endExpedition(){
    if(!run||!run.result||expeditionSettled)return;closeLocation(false);closeJourney('camp',false);closeJourney('trail',false);expeditionSettled=true;cancel();resetFeedback();
    const score=C.score(run),wave=run.wave+Math.max(0,C.captured(run)-1);
    sdk.handleGameOver({score,wave,isPractice});
    ToenowScreens.updateGameOver(ID,{score,bestScore:sdk.loadBestScore(),wave,combo:null,reason:'GAME OVER'});
    paintOutcome();guideLabels();
    show('outcome',true);show('gameover-screen',true);document.body.dataset.state='gameover';
  }
  function retreat(){if(!run||!state||paused||feedbackBusy||state.phase!=='player')return;state.result='retreat';state.phase='finished';finish();}
  function finish(){
    if(lessonReturn){restoreLesson();return;}
    if(!state||settled||captureBusy)return;
    coach.end(state.result);
    closeGuide(false);
    if(state.kind!=='trail'&&state.result==='victory'&&!captureShown){
      captureShown=true;captureBusy=true;cancel();resetFeedback();const battle=state,version=++sceneVersion;
      const fort=C.FORTS[state.fortId||'acorn'];render();
      siege.capture({name:text(fort.name,fort.nameZh),gold:fort.gold,wood:fort.wood}).then(()=>{if(sceneVersion!==version||state!==battle)return;captureBusy=false;finish();});return;
    }
    settled=true;cancel();resetFeedback();plannedMove=null;
    if(run){
      const trail=state.kind==='trail',siteId=state.siteId;
      if(!(trail?C.completeTrailBattle(run,state):C.completeBattle(run,state)))return;
      if(run.result){endExpedition();return;}
      state=null;selected=null;targetId=null;locationId=trail?siteId:'home';setScene(trail?'trail':'map');if(trail){trailOpen=true;renderTrail();}else renderMap();window.scrollTo({top:0,behavior:'instant'});return;
    }
    const score=state.score??(state.result==='victory'?300+alive('player').reduce((n,u)=>n+E.count(u)*10,0):state.units.filter(u=>u.team==='enemy').reduce((n,u)=>n+(u.hp===0?30:0),0));
    sdk.handleGameOver({score,wave:state.wave,isPractice});
    ToenowScreens.updateGameOver(ID,{score,bestScore:sdk.loadBestScore(),wave:state.wave,combo:null,reason:'GAME OVER'});
    paintOutcome();guideLabels();
    show('outcome',true);show('gameover-screen',true);document.body.dataset.state='gameover';
  }
  function pause(value){if(captureBusy||(!state&&!run)||run?.result||(!run&&state?.result))return;paused=value;cancel();show('pause-layer',value);document.body.dataset.state=value?'paused':'playing';labels();if(!value&&!feedbackBusy){if(pendingFeedback){const next=pendingFeedback;pendingFeedback=null;next();}else if(state?.result)finish();else if(state?.phase==='enemy')scheduleEnemy();}}
  function afterEnemyAction(){
    if(lessonReturn&&state.phase==='player'){coach.observe();restoreLesson();return;}
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
  function finishTurn(){if(!state||!E.endPlayerTurn(state))return;coach.endTurn();selected=null;targetId=null;render();scheduleEnemy();}
  function endTurn(){if(paused||feedbackBusy||captureBusy||!state||state.phase!=='player'||state.result||!coach.allows('end-turn'))return;orderMode='end-turn';render();}
  function clearOrder(){orderMode=null;const d=$('battle-order');if(d?.open)d.close();}
  function dismissOrder(){const target=byId(targetId),cell=target?target.x+','+target.y:null;if(orderMode==='attack')coach.cancelTarget();clearOrder();targetId=null;if(state)render();if(cell)$('board').querySelector('[data-cell="'+cell+'"]')?.focus({preventScroll:true});}
  function positionOrders(){
    const controls=$('unit-orders');if(controls.hidden)return;
    const a=byId(selected),at=plannedMove||a,tile=at&&$('board').querySelector('[data-cell="'+at.x+','+at.y+'"]');if(!tile)return;
    const r=tile.getBoundingClientRect(),surface=document.querySelector('.board-surround').getBoundingClientRect();
    controls.style.width=Math.max(0,r.width-8)+'px';
    controls.style.left=(r.left-surface.left+document.querySelector('.board-surround').scrollLeft+4)+'px';
    controls.style.top=(r.bottom-surface.top+4)+'px';
  }
  function syncOrder(ready,a,t,predicted,predictedLoss){
    const d=$('battle-order'),valid=!!(state&&state.phase==='player'&&!state.result&&!feedbackBusy&&!captureBusy&&(orderMode==='end-turn'||orderMode==='attack'&&a&&!a.acted&&t&&E.canAttack(state,plannedMove?{...a,x:plannedMove.x,y:plannedMove.y}:a,t)));
    if(orderMode&&!valid)clearOrder();
    if(!orderMode||paused){if(d.open)d.close();return;}
    $('order-title').textContent=orderMode==='attack'?(plannedMove?text('Move & attack?','移動並攻擊？'):text('Confirm attack?','確認攻擊？')):plannedMove?text('Move & end turn?','移動並結束回合？'):text('End your turn?','結束回合？');
    $('order-cancel').textContent=text('Cancel','取消');
    $('order-actors').innerHTML=orderMode==='attack'?image(a.kind)+'<span>→</span>'+image(t.kind):'';
    $('preview').hidden=false;
    if(orderMode==='end-turn')$('preview').textContent=(plannedMove?text('Confirm the previewed move. ','確認目前預覽的移動。'):'')+text('Squads that have not acted will automatically defend.','尚未行動的部隊會自動防守。');
    $('confirm-attack').hidden=orderMode!=='attack';$('confirm-attack').disabled=orderMode!=='attack';
    $('order-accept').hidden=orderMode!=='end-turn';$('order-accept').textContent=text('Confirm end turn','確認結束回合');
    if(!d.open)d.showModal();
  }
  function acceptOrder(){if(orderMode!=='end-turn'||paused||feedbackBusy||captureBusy||state?.phase!=='player'||state.result)return;clearOrder();if(plannedMove)commitMove(finishTurn);else finishTurn();}
  function choose(id){const u=byId(id);if(paused||feedbackBusy||state?.phase!=='player'||!u||u.team!=='player'||u.hp<=0||!coach.allows('choose'))return;coach.choose();plannedMove=null;selected=id;targetId=null;render();}
  function commitMove(after){
    if(paused||feedbackBusy||state?.phase!=='player'||!plannedMove||plannedMove.id!==selected)return;
    const move=plannedMove,unit=byId(move.id),path=E.movementPath(state,unit,move.x,move.y);
    if(!E.move(state,move.id,move.x,move.y))return;
    plannedMove=null;targetId=null;playWalk(unit,path,after);
  }
  function completeUnitAction(){
    targetId=null;
    if(state.result){render();finish();return;}
    if(!coach.isLesson&&state.phase==='player'&&alive('player').every(u=>u.acted)){finishTurn();return;}
    selected=alive('player').find(u=>!u.acted)?.id||selected;
    render();
  }
  function confirmMove(){if(!coach.isLesson)commitMove(()=>{
    const unit=byId(selected);
    if(unit){E.defend(state,unit.id);completeUnitAction();}
  });}
  function confirmAttack(){
    if(orderMode!=='attack')return;
    if(paused||feedbackBusy||captureBusy||!state||state.phase!=='player'||state.result||!coach.allows('attack'))return;
    const a=byId(selected),t=byId(targetId);
    const from=plannedMove&&a?{...a,x:plannedMove.x,y:plannedMove.y}:a;
    if(!a||a.acted||!t||!E.canAttack(state,from,t))return;
    clearOrder();const execute=()=>executeAttack(a.id,t.id);
    if(plannedMove)commitMove(execute);else execute();
  }
  function executeAttack(id,enemyId){
    const a=byId(id);if(!E.attack(state,id,enemyId)){render();return;}
    coach.attack();
    targetId=null;playAttack({...state.last},completeUnitAction);
  }
  function clickTile(x,y){
    if(!state||paused||feedbackBusy||state.phase!=='player')return;
    const u=E.occupant(state,x,y),a=byId(selected);
    if(u?.team==='player'){choose(u.id);return;}
    if(u?.team==='enemy'){
      if(!a||a.acted||!coach.allows('target'))return;
      const from=plannedMove?{...a,x:plannedMove.x,y:plannedMove.y}:a;
      if(coach.isLesson&&!E.canAttack(state,from,u))return;
      targetId=u.id;coach.target();if(E.canAttack(state,from,u))orderMode='attack';render();
      return;
    }
    if(a&&!a.acted&&!a.moved&&coach.allows('move')&&(!coach.isLesson||x===3&&y===1)&&E.reachable(state,a).some(p=>p.cost>0&&p.x===x&&p.y===y)){
      plannedMove={id:a.id,x,y};targetId=null;coach.previewMove();render();
    }
  }
  function render(){
    if(!state)return;
    clearLessonLocks();
    guideLabels();
    $('board').setAttribute('aria-busy',String(feedbackBusy||captureBusy));
    const a=byId(selected),canAct=state.phase==='player'&&!paused&&!feedbackBusy&&!captureBusy&&!state.result;
    const reachable=a&&!a.acted&&!a.moved&&canAct?E.reachable(state,a):[];
    const attackOrigin=plannedMove&&a?{...a,x:plannedMove.x,y:plannedMove.y}:a;
    const attackRange=state.phase==='player'&&!paused&&!state.result?E.attackRange(state,attackOrigin):[];
    const active=document.activeElement?.dataset?.cell;
    $('edition').textContent=run?text('MISTWOOD EXPEDITION · LOSSES PERSIST','迷霧森林遠征・戰損會保留'):text('BATTLE PROTOTYPE · EXPLORATION ISLAND','戰鬥試玩版・探索島動物');
    $('battle-name').textContent=lessonReturn?text('A quick battle rehearsal','先來練習一回合'):state.kind==='trail'?text('Trail guardians','林間舊路守衛'):run?text(C.FORTS[state.fortId].name,C.FORTS[state.fortId].nameZh):text('The Acorn Fort','橡果堡攻城戰');
    $('objective').textContent=lessonReturn?text('Learn by doing. Your real army and records are safe.','親手試一次。真正的部隊與紀錄都不受影響。'):text('Outsmart a larger army. Defeat all three defending squads.','用克制與站位，以少勝多，擊敗三隊守軍。');
    $('round-label').textContent=text('ROUND','回合');$('round-number').textContent=state.round;
    $('ally-label').textContent=text('● YOUR SQUADS','● 我方部隊');$('enemy-label').textContent=text('◆ DEFENDERS','◆ 敵方守軍');
    $('phase-label').textContent=state.result?text('Battle complete','戰鬥結束'):state.phase==='player'?text('Your turn · take your time','我方回合・慢慢思考'):text('Defenders are moving…','守軍正在行動…');
    $('tile-help').textContent=plannedMove?text('Blue footprints: move · Orange stripes: attack from preview','藍色腳印：移動・橘紅斜線：預覽位置的攻擊範圍'):text('Blue footprints: move · Orange stripes: attack range · Red swords: attackable enemies','藍色腳印：移動・橘紅斜線：攻擊範圍・紅色劍：可攻擊敵人');
    const trail=state.kind==='trail',fort=trail?{gold:0,wood:0}:run?C.FORTS[state.fortId]:{gold:140,wood:40};
    const sceneFort=trail?C.SITES[state.siteId]:C.FORTS[state.fortId||'acorn'];
    document.querySelector('.siege-flag').hidden=trail;$('battle').dataset.fort=state.fortId||'acorn';
    $('siege-label').textContent=trail?text('Forest clearing · Guard encounter','林間空地・守衛遭遇'):text(sceneFort.name+' · Siege gate',sceneFort.nameZh+'・攻城入口');
    if(!trail)siege.update({name:text(sceneFort.name,sceneFort.nameZh),gold:fort.gold,wood:fort.wood});
    $('reward-preview').textContent=trail?text('Defeat the guards, then search for supplies.','擊退守衛後，可搜尋隱藏物資。'):text('FORT REWARD · ','攻城獎勵・')+fort.gold+text(' gold / ',' 金幣／')+fort.wood+text(' wood',' 木材');
    $('prototype-note').textContent=run?text('Retreat on your turn to preserve survivors. Both armies retain losses.','可在我方回合撤退，保留剩餘部隊；雙方戰損都會留下。'):text('Battle prototype · Exploration, recruiting and construction will come after this playtest.','單場戰鬥練習・想探索與招兵，請從一般入口開始遠征。');
    const movePath=plannedMove?E.movementPath(state,a,plannedMove.x,plannedMove.y):[];
    let board='';
    for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++){
      const actual=E.occupant(state,x,y),wall=state.walls.some(p=>p[0]===x&&p[1]===y),tree=state.trees.some(p=>p[0]===x&&p[1]===y);
      const destination=!!plannedMove&&plannedMove.x===x&&plannedMove.y===y,origin=!!plannedMove&&actual?.id===plannedMove.id;
      const u=destination?byId(plannedMove.id):origin?null:actual;
      const target=canAct&&a&&!a.acted&&E.canAttack(state,attackOrigin,actual),reach=!u&&reachable.some(p=>p.x===x&&p.y===y&&p.cost>0);
      const inRange=attackRange.some(p=>p.x===x&&p.y===y);
      const classes=['tile',wall?'wall':'',tree?'tree':'',!trail&&x===5&&!wall?'gate':'',!trail&&x===7&&y===1?'flag':'',reach?'reachable':'',movePath.slice(1,-1).some(p=>p.x===x&&p.y===y)?'move-path':'',u?'has-unit':'',u?.team==='enemy'?'enemy-unit':'',u?.acted?'spent':'',u?.id===selected?'selected':'',target?'target':'',target&&u?.id===targetId?'attack-picked':'',inRange?'attack-range':'',plannedMove&&inRange?'range-preview':'',destination?'move-destination':'',origin?'move-origin':''].filter(Boolean).join(' ');
      const label=origin?text('Starting position · tap to cancel move','原本位置・點選取消移動'):(destination?text('Move preview · ','移動預覽・'):'')+(u?text(u.team==='player'?'Ally ':'Enemy ',u.team==='player'?'我方':'敵方')+name(u.kind)+' ×'+E.count(u)+(u.acted?text(' · done','・已行動'):''):wall?text('Wall','城牆'):tree?text('Tree','樹木'):!trail&&x===5&&!wall?text('Open gate','可通行城門'):text('Tile','格子')+' '+(x+1)+','+(y+1));
      board+='<button type="button" '+(u?'data-unit="'+u.id+'" data-action-state="'+window.AnimalBattleView.status(state,u,u.id===a?.id?attackOrigin:u,destination).key+'" ':'')+'class="'+classes+'" data-cell="'+x+','+y+'" aria-label="'+label+(inRange?text(' · In attack range','・在攻擊範圍內'):'')+(target?text(' · Select attack target','・選取攻擊目標'):'')+'"'+(wall||tree?' disabled':'')+'>'+(!trail&&x===5&&!wall?'<span class="gate-lane" aria-hidden="true"></span>':'')+(u?image(u.kind)+window.AnimalBattleView.unit(state,u,{text,name,origin:u.id===a?.id?attackOrigin:u,preview:destination,selected:u.id===selected})+'<span class="unit-count">'+E.count(u)+'</span>'+(u.guarding?'<span class="unit-shield">◈</span>':'')+(target?'<span class="target-marker" aria-hidden="true">⚔</span>':''):origin?'↶':wall?'<span class="wood-wall" aria-hidden="true"><i></i><i></i><i></i></span>':tree?'<span class="battle-tree" aria-hidden="true">♣</span>':'')+'</button>';
    }
    $('board').innerHTML=board;
    if(active)$('board').querySelector('[data-cell="'+active+'"]')?.focus({preventScroll:true});

    $('selection').innerHTML=a&&a.hp>0?'<strong>'+name(a.kind)+(a.trained?' ✦':'')+'</strong>'+text('Move ','移動 ')+E.stats(a).move+text(' · Range ',' 格・射程 ')+E.stats(a).range+text(' · HP ',' 格・生命 ')+a.hp: text('Choose one of your squads.','點選一隊我方動物。');
    const t=byId(targetId);
    const predicted=t&&a?Math.min(E.damage(state,a,t),t.hp):0;
    const predictedLoss=t?E.count(t)-Math.ceil(Math.max(0,t.hp-predicted)/E.TYPES[t.kind].hp):0;
    const targets=canAct&&a&&!a.acted?alive('enemy').filter(t=>E.canAttack(state,attackOrigin,t)):[];
    const ready=!!(canAct&&a&&!a.acted&&t&&E.canAttack(state,attackOrigin,t));
    $('action-hint').textContent=captureBusy||state.result?text('Battle complete','戰鬥結束'):paused?text('Battle paused','戰鬥已暫停'):feedbackBusy?text('Action in progress…','行動中…'):state.phase==='enemy'?text('Watch the defenders. Your turn is next.','觀察守軍的行動，接著輪到你。'):ready?(plannedMove?text('Ready: one order moves and attacks.','準備好了：一個指令就能移動並攻擊。'):text('Target selected. Press Attack.','已選取目標，按「攻擊」出手。')):plannedMove?(targets.length?text('From here you can attack '+targets.map(t=>name(t.kind)).join(', ')+'. Tap a red-sword enemy.','走到這裡可以攻擊'+targets.map(t=>name(t.kind)).join('、')+'。點選紅色劍標記的敵人。'):text('No enemy in range here. Confirm the move to automatically defend, or choose another tile.','這裡沒有可攻擊的敵人。確認移動後會自動防守，也可以改選位置。')):!a||a.acted?text('Choose another squad, or end your turn.','選擇其他部隊，或結束回合。'):a.moved?(targets.length?text('You can still attack! Select a red-sword enemy.','還可以攻擊！請選擇紅色劍標記的敵人。'):text('No enemy in range. Defend or choose another squad.','目前沒有可攻擊的敵人，可以防守或操作其他動物。')):text('Choose a blue tile to move, or select a red-sword enemy to attack.','選藍色格子移動，或選紅色劍標記的敵人攻擊。');
    $('preview').hidden=!t||!a||!canAct;
    $('preview').textContent=t&&a?(E.canAttack(state,attackOrigin,t)?name(a.kind)+' → '+name(t.kind)+' · '+text('Predicted damage ','預計傷害 ')+predicted+text(' · troops lost ','・減兵 ')+predictedLoss+(E.TYPES[a.kind].counters===t.kind?text(' · Counter ×1.8','・克制 ×1.8'):''):text('Out of reach, or the wall blocks your shot. Choose another position or target.','距離太遠，或城牆擋住射線。請改選位置或目標。')):'';
    $('confirm-attack').hidden=!ready;$('confirm-attack').disabled=!ready;
    $('confirm-attack').textContent=ready?(plannedMove?text('⚔ Move & attack '+name(t.kind),'⚔ 移動並攻擊'+name(t.kind)):text('⚔ Attack '+name(t.kind),'⚔ 攻擊'+name(t.kind))):text('⚔ Attack','⚔ 攻擊');
    $('action-hint').dataset.step=ready?'attack':plannedMove?'move':canAct&&a?.moved&&targets.length?'target':'choose';
    $('move-confirmation').hidden=!plannedMove;
    $('confirm-move').textContent=text('Defend','防守');$('confirm-move').disabled=!plannedMove||!canAct;
    $('cancel-move').textContent=text('Cancel','取消');$('cancel-move').disabled=!plannedMove||!canAct;
    $('defend').textContent=text('◈ Defend','◈ 防守');$('defend').disabled=!!plannedMove||!canAct||!a||a.acted;
    $('end-turn').textContent=plannedMove?text('Move & end turn →','移動並結束回合 →'):text('End turn →','結束回合 →');$('end-turn').disabled=!canAct;
    const remaining=alive('player').filter(u=>!u.acted).length;
    $('remaining-orders').textContent=state.phase==='player'?text(remaining+' squads can act','還有 '+remaining+' 隊可行動'):text('Defenders’ turn','敵方回合');
    $('restart').textContent=run?(trail?text('Leave clearing · keep losses','撤離空地・保留戰損'):text('Retreat to camp · keep losses','撤回基地・保留戰損')):text('Restart this battle','重新挑戰這場戰鬥');$('restart').disabled=!!run&&!canAct;
    $('counter-strip').innerHTML=Object.keys(E.TYPES).map(k=>'<div class="counter-pair">'+image(k)+'<b>'+name(k)+'</b><span>'+text('beats →','克制 →')+'</span>'+image(E.TYPES[k].counters)+'</div>').join('');
    $('journal-label').textContent=text('BATTLE JOURNAL','戰場紀錄');
    $('journal').textContent=state.log.length?state.log.slice(-2).map(hit=>{const u=byId(hit.id),t=byId(hit.targetId);return text(u.team==='player'?'Ally ':'Enemy ',u.team==='player'?'我方':'敵方')+name(u.kind)+' → '+name(t.kind)+text(' · damage ','・傷害 ')+(hit.actualDamage??hit.damage)+text(' · lost ','・損失 ')+hit.loss;}).join(' / '):text('Allies: ','我方 ')+alive('player').reduce((n,u)=>n+E.count(u),0)+text(' · Defenders: ',' 隻・守軍 ')+alive('enemy').reduce((n,u)=>n+E.count(u),0)+text('. Let the counters do the work.',' 隻。靠克制與站位找出勝機。');
    $('unit-orders').hidden=!(canAct&&a&&a.hp>0&&!a.acted)&&!plannedMove;
    $('defend').hidden=!!plannedMove;
    syncOrder(ready,a,t,predicted,predictedLoss);paintCoach();
    requestAnimationFrame(positionOrders);
  }
  ToenowScreens.mount(ID);
  // Contextual tips follow the real battle; the shared sandbox lesson is not registered.
  const lessonButton=document.querySelector('#title-screen [data-tutorial-replay]');
  if(lessonButton)lessonButton.hidden=true;
  $('btn-start').addEventListener('click',()=>begin());
  $('btn-retry').addEventListener('click',()=>begin(run?.wave||lessonReturn?.state.wave||state?.wave||1,isPractice));
  $('btn-title').addEventListener('click',title);
  // Isolated runs remain available through the SDK; the opening has no Practice picker.
  $('story-next').addEventListener('click',advanceOpening);
  $('story-skip').addEventListener('click',()=>finishOpening());
  $('board').addEventListener('click',e=>{const cell=e.target.closest('[data-cell]');if(cell){const [x,y]=cell.dataset.cell.split(',').map(Number);clickTile(x,y);}});
  $('confirm-move').addEventListener('click',confirmMove);
  $('confirm-attack').addEventListener('click',confirmAttack);
  $('order-accept').addEventListener('click',acceptOrder);
  $('order-cancel').addEventListener('click',dismissOrder);
  $('battle-order').addEventListener('cancel',e=>{e.preventDefault();dismissOrder();});
  $('battle-order').addEventListener('click',e=>{if(e.target!==$('battle-order'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismissOrder();});
  $('battle-coach-skip').addEventListener('click',()=>{coach.skip();if(lessonReturn)restoreLesson();else paintCoach();});
  $('battle-coach-replay').addEventListener('click',()=>{if(captureBusy||feedbackBusy||lessonReturn||state?.phase==='enemy'||!(run&&!run.result||state&&!state.result))return;if(state)startLesson();else{lessonRequested=true;coach.replay(false);pause(false);}});
  $('unit-guide-open').addEventListener('click',openGuide);
  $('unit-guide-close').addEventListener('click',()=>closeGuide());
  $('unit-guide').addEventListener('cancel',e=>{e.preventDefault();closeGuide();});
  $('unit-guide').addEventListener('click',e=>{if(e.target!==$('unit-guide'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGuide();});
  $('cancel-move').addEventListener('click',()=>{if(!paused&&!coach.isLesson&&plannedMove){plannedMove=null;targetId=null;render();}});
  $('defend').addEventListener('click',()=>{if(!paused&&!feedbackBusy&&!plannedMove&&state?.phase==='player'&&E.defend(state,selected)){completeUnitAction();}});
  $('end-turn').addEventListener('click',endTurn);
  $('restart').addEventListener('click',()=>run?retreat():start(state?.wave||1,isPractice));
  $('expedition').addEventListener('click',e=>{
    if(!run||run.result||paused||state)return;
    const button=e.target.closest('button');if(!button||button.disabled)return;const d=button.dataset;
    if('enterCamp' in d){openCamp();return;}
    if(d.enterTrail){enterTrail(d.enterTrail);return;}
    if(d.explore&&C.SITES[d.explore]?.guards){enterTrail(d.explore);return;}
    if(button.id==='location-close'){closeLocation();return;}
    if(d.location){locationId=d.location;locationOpen=true;renderMap();return;}
    if(d.prepare){if(C.prepare(run,d.prepare)){locationId='home';renderMap();}return;}
    if(d.attack){launchBattle(d.attack);return;}
    let changed=false;
    if(d.explore)changed=C.explore(run,d.explore);
    if(d.claim)changed=C.claim(run,d.claim,d.choice);

    if(changed){if(run.result)endExpedition();else renderMap();}
  });
  $('camp').addEventListener('click',e=>{
    if(!run||run.result||paused||state||scene!=='camp')return;const b=e.target.closest('button');if(!b||b.disabled||b.closest('#opening-story'))return;const d=b.dataset;
    if(b.id==='camp-exit'){locationId='home';setScene('map');renderMap();return;}
    if(b.id==='camp-dialog-close'){closeJourney('camp');return;}
    if(E.TYPES[d.building]){campBuilding=d.building;campOpen=true;}
    if(d.recruit)C.recruit(run,d.recruit,Number(d.amount));
    if(d.upgrade)C.upgrade(run,d.upgrade);
    renderCamp();
  });
  $('trail').addEventListener('click',e=>{
    if(!run||run.result||paused||state||scene!=='trail')return;const b=e.target.closest('button');if(!b||b.disabled||b.closest('#opening-story'))return;const d=b.dataset;
    if(b.id==='trail-dialog-close'){closeJourney('trail');return;}
    if(b.id==='trail-inspect'){trailOpen=true;renderTrail();return;}
    if(b.id==='trail-exit'){setScene('map');renderMap();return;}
    if('enterCamp' in d){openCamp();return;}
    if(d.trailFight){launchTrailBattle(d.trailFight);return;}
    if(d.investigate)C.investigate(run,d.investigate);
    if(d.claim)C.claim(run,d.claim,d.choice);
    if(run.result)endExpedition();else renderTrail();
  });
  $('back').addEventListener('click',()=>{cancel();sdk.exitToHub();});
  $('resume').addEventListener('click',()=>pause(false));$('title-button').addEventListener('click',title);
  function labels(){if(state)render();else if(run){if(scene==='camp')renderCamp();else if(scene==='trail')renderTrail();else renderMap();}guideLabels();if(!$('outcome').hidden)paintOutcome();$('pause-label').textContent=text('Take a breather','休息一下');$('resume').textContent=text('Continue','繼續');$('title-button').textContent=run?text('Title screen · end this run','返回標題・結束這一局'):text('Title screen','返回標題');if(opening)paintOpening();}
  window.addEventListener('toenow:languagechange',labels);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&opening){if($('camp-dialog')?.open)return;finishOpening();return;}if(e.key!=='Escape'||$('battle-order').open||$('unit-guide').open||$('location-dialog')?.open||$('camp-dialog')?.open||$('trail-dialog')?.open)return;if(plannedMove&&!paused&&!coach.isLesson){plannedMove=null;targetId=null;render();return;}if(run&&!run.result||state&&!state.result)pause(!paused);});
  window.addEventListener('resize',()=>requestAnimationFrame(()=>{positionOrders();keepLessonTargetVisible();positionCoach();}));window.addEventListener('scroll',positionCoach,{passive:true});
  window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.parent)return;if(e.data?.type==='GAME_RESTART')sdk.restart();if(e.data?.type==='GAME_PAUSE')sdk.pause();if(e.data?.type==='GAME_RESUME')sdk.resume();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&(run&&!run.result||state&&!state.result))pause(true);});
  labels();title();
})();

