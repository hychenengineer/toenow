from pathlib import Path
base=Path('games/animal-siege')
p=base/'camp-view.js';s=p.read_text(encoding='utf-8');s=s.replace("+'</button></header><div class=\"journey-layout\">'", "+'</button></header><div class=\"journey-layout\">'")
s=s.replace("+'</button></header><div class=\"journey-layout\"><section", "+'</button></header>'+window.AnimalArmyView.render(r,{text:t,name,image})+'<div class=\"journey-layout\"><section")
s=s.replace("+'</section><aside class=\"journey-panel\" aria-live=\"polite\">'+panel+'</aside></div>'", "+'</section></div><dialog id=\"camp-dialog\" class=\"journey-dialog\" aria-labelledby=\"camp-building-heading\"><aside class=\"journey-panel\"><button type=\"button\" class=\"journey-dialog-close\" id=\"camp-dialog-close\" aria-label=\"'+t('Close building','關閉建築資訊')+'\">×</button>'+panel+'</aside></dialog>'")
s=s.replace("panel='<h2>'+buildings[k]", "panel='<h2 id=\"camp-building-heading\">'+buildings[k]")
p.write_text(s,encoding='utf-8')
p=base/'trail-view.js';s=p.read_text(encoding='utf-8-sig');s=s.replace("+'</button></header><div class=\"journey-layout\"><section", "+'</button></header>'+window.AnimalArmyView.render(r,{text:t,name,image})+'<div class=\"journey-layout\"><section")
s=s.replace("+'<div class=\"trail-scene-caption\">'", "+'<button type=\"button\" id=\"trail-inspect\" class=\"trail-scene-caption\" aria-haspopup=\"dialog\" aria-controls=\"trail-dialog\">'")
s=s.replace("+'</div></section><aside class=\"journey-panel\"><div class=\"trail-steps\">'", "+'<strong>'+t('Tap to investigate →','點選查看 →')+'</strong></button></section></div><dialog id=\"trail-dialog\" class=\"journey-dialog\" aria-labelledby=\"trail-event-heading\"><aside class=\"journey-panel\"><button type=\"button\" class=\"journey-dialog-close\" id=\"trail-dialog-close\" aria-label=\"'+t('Close exploration details','關閉探索資訊')+'\">×</button><div class=\"trail-steps\">'")
s=s.replace("+'</aside></div>';", "+'</aside></dialog>';")
s=s.replace("content='<h2>", "content='<h2 id=\"trail-event-heading\">")
p.write_text(s,encoding='utf-8')
p=base/'expedition-view.js';s=p.read_text(encoding='utf-8');s=s.replace("<span class=\"eyebrow\">'+t('ONE ISLAND · ONE EXPEDITION','一座小島・一局遠征')+'</span>", '')
s=s.replace("<p>'+t('Explore, recruit, and outsmart three forts. Every survivor matters.','探索、招兵，以巧取勝。每一隻活著回來的動物都很重要。')+'</p>",'')
s=s.replace("<div class=\"exp-notice\" role=\"status\">'+notice+'</div>'+report", "'+window.AnimalArmyView.render(r,{text:t,name,image})+report")
p.write_text(s,encoding='utf-8')
p=base/'index.html';s=p.read_text(encoding='utf-8');s=s.replace('<button id="menu" type="button">Menu</button>','');s=s.replace('<script src="expedition-view.js"></script>','<script src="army-view.js"></script>\n  <script src="expedition-view.js"></script>');s=s.replace('<link rel="stylesheet" href="map-dialog.css">','<link rel="stylesheet" href="map-dialog.css">\n  <link rel="stylesheet" href="journey-dialog.css">');p.write_text(s,encoding='utf-8')
p=base/'main.js';s=p.read_text(encoding='utf-8');s=s.replace("campBuilding=null,locationOpen=false;", "campBuilding=null,locationOpen=false,campOpen=false,trailOpen=false;")
s=s.replace("function setScene(value){closeLocation(false);scene=value;", "function setScene(value){closeLocation(false);closeJourney('camp',false);closeJourney('trail',false);scene=value;")
s=s.replace("function title(){closeLocation(false);", "function title(){closeLocation(false);closeJourney('camp',false);closeJourney('trail',false);")
s=s.replace("function renderCamp(){if(run)$('camp').innerHTML=window.AnimalCampView.render(run,campBuilding,{text,name,image});guideLabels();paintCoach();}", "function renderCamp(){if(run){$('camp').innerHTML=window.AnimalCampView.render(run,campBuilding,{text,name,image});bindJourney('camp',campOpen);}guideLabels();paintCoach();}")
s=s.replace("function renderTrail(){if(run)$('trail').innerHTML=window.AnimalTrailView.render(run,locationId,{text,name,image});guideLabels();paintCoach();}", "function renderTrail(){if(run){$('trail').innerHTML=window.AnimalTrailView.render(run,locationId,{text,name,image});bindJourney('trail',trailOpen);}guideLabels();paintCoach();}")
needle='  function renderCamp()';pos=s.index(needle)
s=s[:pos]+'''  function closeJourney(kind,focus=true){
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
'''+s[pos:]
s=s.replace("if(E.TYPES[d.building])campBuilding=d.building;", "if(b.id==='camp-dialog-close'){closeJourney('camp');return;}\n    if(E.TYPES[d.building]){campBuilding=d.building;campOpen=true;}")
s=s.replace("if(b.id==='trail-exit'){", "if(b.id==='trail-dialog-close'){closeJourney('trail');return;}\n    if(b.id==='trail-inspect'){trailOpen=true;renderTrail();return;}\n    if(b.id==='trail-exit'){")
s=s.replace("$('menu').addEventListener('click',()=>pause(true));", '')
s=s.replace("||$('location-dialog')?.open)return;", "||$('location-dialog')?.open||$('camp-dialog')?.open||$('trail-dialog')?.open)return;")
s=s.replace("closeLocation(false);expeditionSettled=true;", "closeLocation(false);closeJourney('camp',false);closeJourney('trail',false);expeditionSettled=true;")
p.write_text(s,encoding='utf-8')
