from pathlib import Path
base=Path('games/animal-siege')
p=base/'expedition-view.js';s=p.read_text(encoding='utf-8');s=s.replace('<aside class="expedition-detail">\'+detail+\'</aside></div>', '</div><dialog id="location-dialog" aria-labelledby="location-heading" data-i18n-ignore><aside class="expedition-detail"><button type="button" id="location-close" aria-label="\'+t(\'Close location\',\'關閉地點資訊\')+\'">×</button>\'+detail+\'</aside></dialog>');s=s.replace('<h2>\'+t(\'Forest Camp\'', '<h2 id="location-heading">\'+t(\'Forest Camp\'');s=s.replace('<h2>\'+fortName(selected)', '<h2 id="location-heading">\'+fortName(selected)');s=s.replace('<h2>\'+(status.revealed', '<h2 id="location-heading">\'+(status.revealed');p.write_text(s,encoding='utf-8')
p=base/'main.js';s=p.read_text(encoding='utf-8');s=s.replace("let scene='map',campBuilding=null;", "let scene='map',campBuilding=null,locationOpen=false;")
s=s.replace("function setScene(value){scene=value;", "function setScene(value){closeLocation(false);scene=value;")
s=s.replace('function title(){coach.stop();','function title(){closeLocation(false);coach.stop();')
a=s.index('  function renderMap(){');b=s.index('\n  function launchBattle',a)
s=s[:a]+'''  function closeLocation(focus=true){locationOpen=false;const dialog=$('location-dialog');if(dialog?.open)dialog.close();if(focus&&scene==='map')$('expedition').querySelector('[data-location="'+locationId+'"]')?.focus({preventScroll:true});}
  function renderMap(){
    if(!run)return;warmFortArt(locationId);$('expedition').innerHTML=window.AnimalExpeditionView.render(run,locationId,{text,name,image});
    const dialog=$('location-dialog');
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeLocation();});
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeLocation();});
    if(locationOpen&&scene==='map'&&!paused)dialog.showModal();
    guideLabels();paintCoach();
  }'''+s[b:]
s=s.replace("if(d.location){locationId=d.location;renderMap();return;}","if(button.id==='location-close'){closeLocation();return;}\n    if(d.location){locationId=d.location;locationOpen=true;renderMap();return;}")
s=s.replace("if(e.key!=='Escape'||$('unit-guide').open)return;", "if(e.key!=='Escape'||$('unit-guide').open||$('location-dialog')?.open)return;")
p.write_text(s,encoding='utf-8')
