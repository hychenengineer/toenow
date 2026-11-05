from pathlib import Path
base=Path('games/animal-siege')
p=base/'main.js'
s=p.read_text(encoding='utf-8')
s=s.replace("let plannedMove=null;","let plannedMove=null;\n  let scene='map',campBuilding=null;",1)
needle='  function cancel(){'
s=s.replace(needle,"""  function setScene(value){scene=value;for(const id of ['expedition','camp','trail','battle'])show(id,id===(value==='map'?'expedition':value));}
  function renderCamp(){if(run)$('camp').innerHTML=window.AnimalCampView.render(run,campBuilding,{text,name,image});guideLabels();paintCoach();}
  function renderTrail(){if(run)$('trail').innerHTML=window.AnimalTrailView.render(run,locationId,{text,name,image});guideLabels();paintCoach();}
  function openCamp(){if(paused||!run||run.result||state)return;campBuilding=null;setScene('camp');renderCamp();window.scrollTo({top:0,behavior:'instant'});}
  function enterTrail(id){if(paused||!run||state||run.result||!C.SITES[id]?.guards)return;C.explore(run,id);locationId=id;setScene('trail');renderTrail();window.scrollTo({top:0,behavior:'instant'});}
  function launchTrailBattle(id){
    if(paused||!run)return false;const next=C.beginTrailBattle(run,id);if(!next)return false;
    cancel();resetFeedback();resetSiege();plannedMove=null;state=next;settled=false;selected=alive('player')[0]?.id||null;targetId=null;
    setScene('battle');window.scrollTo({top:0,behavior:'instant'});if(coach.needsLesson)startLesson();else render();return true;
  }
"""+needle)
s=s.replace("show('battle',false);show('expedition',false);show('outcome',false)","show('battle',false);show('expedition',false);show('camp',false);show('trail',false);scene='map';campBuilding=null;show('outcome',false)")
s=s.replace("show('battle',!run);show('expedition',!!run);","campBuilding=null;setScene(run?'map':'battle');")
s=s.replace("show('expedition',false);show('battle',true);","setScene('battle');")
s=s.replace("if(state.result==='victory'&&!captureShown)","if(state.kind!=='trail'&&state.result==='victory'&&!captureShown)")
s=s.replace("if(!C.completeBattle(run,state))return;","const trail=state.kind==='trail',siteId=state.siteId;\n      if(!(trail?C.completeTrailBattle(run,state):C.completeBattle(run,state)))return;")
s=s.replace("state=null;selected=null;targetId=null;locationId='home';show('battle',false);show('expedition',true);renderMap();","state=null;selected=null;targetId=null;locationId=trail?siteId:'home';setScene(trail?'trail':'map');if(trail)renderTrail();else renderMap();")
s=s.replace("run?text(C.FORTS[state.fortId].name,C.FORTS[state.fortId].nameZh)","state.kind==='trail'?text('Trail guardians','林間舊路守衛'):run?text(C.FORTS[state.fortId].name,C.FORTS[state.fortId].nameZh)")
s=s.replace("const fort=run?C.FORTS[state.fortId]:{gold:140,wood:40};","const trail=state.kind==='trail',fort=trail?{gold:0,wood:0}:run?C.FORTS[state.fortId]:{gold:140,wood:40};")
s=s.replace("const sceneFort=C.FORTS[state.fortId||'acorn'];","const sceneFort=trail?C.SITES[state.siteId]:C.FORTS[state.fortId||'acorn'];\n    document.querySelector('.siege-flag').hidden=trail;")
s=s.replace("siege.update({name:text(sceneFort.name,sceneFort.nameZh),gold:fort.gold,wood:fort.wood});","if(!trail)siege.update({name:text(sceneFort.name,sceneFort.nameZh),gold:fort.gold,wood:fort.wood});")
s=s.replace("$('reward-preview').textContent=text('FORT REWARD", "$('reward-preview').textContent=trail?text('Defeat the guards, then search for supplies.','擊退守衛後，可搜尋隱藏物資。'):text('FORT REWARD")
s=s.replace("$('siege-label').textContent=text(sceneFort.name+' · Siege gate',sceneFort.nameZh+'・攻城入口');","$('siege-label').textContent=trail?text('Forest clearing · Guard encounter','林間空地・守衛遭遇'):text(sceneFort.name+' · Siege gate',sceneFort.nameZh+'・攻城入口');")
s=s.replace("x===5&&!wall", "!trail&&x===5&&!wall")
s=s.replace("x===7&&y===1?'flag'", "!trail&&x===7&&y===1?'flag'")
s=s.replace("run?text('Retreat to camp · keep losses','撤回基地・保留戰損')", "run?(trail?text('Leave clearing · keep losses','撤離空地・保留戰損'):text('Retreat to camp · keep losses','撤回基地・保留戰損'))")
s=s.replace("if(d.location){", "if('enterCamp' in d){openCamp();return;}\n    if(d.enterTrail){enterTrail(d.enterTrail);return;}\n    if(d.explore&&C.SITES[d.explore]?.guards){enterTrail(d.explore);return;}\n    if(d.location){")
s=s.replace("    if(d.recruit)changed=C.recruit(run,d.recruit,Number(d.amount));\n    if(d.upgrade)changed=C.upgrade(run,d.upgrade);", "")
needle="  $('back').addEventListener"
s=s.replace(needle,"""  $('camp').addEventListener('click',e=>{
    if(!run||run.result||paused||state||scene!=='camp')return;const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
    if(b.id==='camp-exit'){locationId='home';setScene('map');renderMap();return;}
    if(E.TYPES[d.building])campBuilding=d.building;
    if(d.recruit)C.recruit(run,d.recruit,Number(d.amount));
    if(d.upgrade)C.upgrade(run,d.upgrade);
    renderCamp();
  });
  $('trail').addEventListener('click',e=>{
    if(!run||run.result||paused||state||scene!=='trail')return;const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
    if(b.id==='trail-exit'){setScene('map');renderMap();return;}
    if('enterCamp' in d){openCamp();return;}
    if(d.trailFight){launchTrailBattle(d.trailFight);return;}
    if(d.investigate)C.investigate(run,d.investigate);
    if(d.claim)C.claim(run,d.claim,d.choice);
    if(run.result)endExpedition();else renderTrail();
  });
"""+needle)
s=s.replace("else if(run)renderMap();guideLabels();", "else if(run){if(scene==='camp')renderCamp();else if(scene==='trail')renderTrail();else renderMap();}guideLabels();")
p.write_text(s,encoding='utf-8')
p=base/'index.html';s=p.read_text(encoding='utf-8').replace('<link rel="stylesheet" href="battle-orders.css">','<link rel="stylesheet" href="battle-orders.css">\n  <link rel="stylesheet" href="camp-trail.css">').replace('<main id="battle"','<main id="camp" hidden data-i18n-ignore></main>\n  <main id="trail" hidden data-i18n-ignore></main>\n  <main id="battle"').replace('<script src="expedition-view.js"></script>','<script src="expedition-view.js"></script>\n  <script src="camp-view.js"></script>\n  <script src="trail-view.js"></script>');p.write_text(s,encoding='utf-8')
p=base/'expedition-view.js';s=p.read_text(encoding='utf-8');a=s.index("      detail+=Object.keys(E.TYPES).map(k=>'<div class=\"recruit-card");b=s.index("\n    }else if(C.FORTS[selected])",a);s=s[:a]+"      detail+=action(t('Enter Forest Camp →','進入森林基地 →'),'data-enter-camp',false,'primary');"+s[b:];s=s.replace("      if(status.claimed)detail+=", "      if(s.guards&&status.revealed)detail+='<p>'+t('Follow the tracks, scout the patrol and decide whether to fight for supplies.','追蹤腳印、偵察巡守隊，再決定要不要挑戰守衛取得物資。')+'</p>'+action(status.claimed?t('Revisit clearing','查看已探索空地'):t('Continue exploring →','繼續探索 →'),'data-enter-trail=\"'+selected+'\"',false,'primary');\n      else if(status.claimed)detail+=");p.write_text(s,encoding='utf-8')
p=base/'campaign.js';s=p.read_text(encoding='utf-8').replace('beginTrailBattle,completeTrailBattle,upgrade,beginBattle','beginTrailBattle,completeTrailBattle,beginBattle');p.write_text(s,encoding='utf-8')
