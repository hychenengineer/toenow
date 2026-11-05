from pathlib import Path
base=Path('games/animal-siege')
p=base/'index.html';s=p.read_text(encoding='utf-8');a=s.index('      <aside class="command-panel">');b=s.index('      </aside>',a)+len('      </aside>')
s=s[:a]+s[b:];needle='<div id="combat-effects" aria-hidden="true"></div>'
s=s.replace(needle,needle+'''<div id="unit-orders" class="battle-actions" hidden data-i18n-ignore><div id="selection" class="selection"></div><div id="move-confirmation" class="move-confirmation" hidden><button id="cancel-move" type="button"></button><button id="confirm-move" type="button"></button></div><button id="defend" type="button"></button></div>''')
needle='    <section class="counter-strip"'
s=s.replace(needle,'''    <div class="field-turn-controls"><button id="restart" type="button" class="text-button"></button><span id="remaining-orders" role="status" aria-live="polite"></span><button id="end-turn" type="button"></button></div>
    <p id="action-hint" role="status" aria-live="polite"></p>
    <dialog id="battle-order" class="battle-confirm" aria-labelledby="order-title" data-i18n-ignore><div class="battle-confirm-card"><h2 id="order-title"></h2><div id="order-actors" aria-hidden="true"></div><p id="preview" class="preview"></p><div class="order-confirm-buttons"><button id="order-cancel" type="button"></button><button id="confirm-attack" type="button" hidden></button><button id="order-accept" type="button" hidden></button></div></div></dialog>
'''+needle)
s=s.replace('<script src="main.js"></script>','<script src="battle-view.js"></script>\n  <script src="main.js"></script>');s=s.replace('<link rel="stylesheet" href="journey-dialog.css">','<link rel="stylesheet" href="journey-dialog.css">\n  <link rel="stylesheet" href="field-orders.css">');p.write_text(s,encoding='utf-8')
p=base/'main.js';s=p.read_text(encoding='utf-8');s=s.replace('let plannedMove=null;','let plannedMove=null,orderMode=null;',1)
s=s.replace("const limit=innerWidth<=780&&!dock.contains(target)?dock.getBoundingClientRect().top:innerHeight;", "const limit=innerHeight-12;")
s=s.replace("const model=state&&!$('battle').hidden?coach.view", "const model=state&&!$('battle').hidden&&!orderMode?coach.view")
s=s.replace("'#board button,#roster button,.battle-actions button,#restart'", "'#board button,.battle-actions button,#end-turn,#restart'")
s=s.replace("function setScene(value){closeLocation(false);", "function setScene(value){clearOrder();closeLocation(false);")
s=s.replace("function title(){closeLocation(false);", "function title(){clearOrder();closeLocation(false);")
s=s.replace("function resetFeedback(){combatVersion++;", "function resetFeedback(){clearOrder();combatVersion++;")
s=s.replace("  function endTurn(){if(paused||feedbackBusy||captureBusy||!state||!coach.allows('end-turn'))return;if(plannedMove)commitMove(finishTurn);else finishTurn();}", "  function endTurn(){if(paused||feedbackBusy||captureBusy||!state||state.phase!=='player'||state.result||!coach.allows('end-turn'))return;orderMode='end-turn';render();}")
needle='  function choose(id)'
pos=s.index(needle)
s=s[:pos]+'''  function clearOrder(){orderMode=null;const d=$('battle-order');if(d?.open)d.close();}
  function dismissOrder(){const target=byId(targetId),cell=target?target.x+','+target.y:null;clearOrder();targetId=null;if(state)render();if(cell)$('board').querySelector('[data-cell="'+cell+'"]')?.focus({preventScroll:true});}
  function positionOrders(){
    const controls=$('unit-orders');if(controls.hidden)return;
    const a=byId(selected),at=plannedMove||a,tile=at&&$('board').querySelector('[data-cell="'+at.x+','+at.y+'"]');if(!tile)return;
    const r=tile.getBoundingClientRect(),surface=document.querySelector('.board-surround').getBoundingClientRect(),w=controls.offsetWidth,h=controls.offsetHeight;
    controls.style.left=Math.max(8,Math.min(surface.width-w-8,r.left-surface.left+r.width/2-w/2))+'px';
    controls.style.top=Math.max(8,Math.min(surface.height-h-8,r.bottom-surface.top+5))+'px';
  }
  function syncOrder(ready,a,t,predicted,predictedLoss){
    const d=$('battle-order'),valid=!!(state&&state.phase==='player'&&!state.result&&!feedbackBusy&&!captureBusy&&(orderMode==='end-turn'||orderMode==='attack'&&ready));
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
'''+s[pos:]
s=s.replace("  function confirmAttack(){\n", "  function confirmAttack(){\n    if(orderMode!=='attack')return;\n")
s=s.replace("    const execute=()=>executeAttack(a.id,t.id);", "    clearOrder();const execute=()=>executeAttack(a.id,t.id);")
s=s.replace("      targetId=u.id;coach.target();render();", "      targetId=u.id;coach.target();if(E.canAttack(state,from,u))orderMode='attack';render();")
s=s.replace("    $('squad-label').textContent=text('YOUR EXPEDITION','你的遠征小隊');\n",'')
s=s.replace("      board+='<button type=\"button\" class=\"'+classes+'\" data-cell=", "      board+='<button type=\"button\" '+(u?'data-unit=\"'+u.id+'\" data-action-state=\"'+window.AnimalBattleView.status(state,u,u.id===a?.id?attackOrigin:u,destination).key+'\" ':'')+'class=\"'+classes+'\" data-cell=")
s=s.replace("(u?image(u.kind)+'<span class=\"unit-count\">'", "(u?image(u.kind)+window.AnimalBattleView.unit(state,u,{text,name,origin:u.id===a?.id?attackOrigin:u,preview:destination,selected:u.id===selected})+'<span class=\"unit-count\">'")
a=s.index("    $('roster').innerHTML=");b=s.index("\n    $('selection').innerHTML=",a);s=s[:a]+s[b:]
s=s.replace("text(remaining+' squads can act · End turn makes idle squads defend.','還有 '+remaining+' 隊可行動・結束回合時，未行動部隊自動防守。')", "text(remaining+' squads can act','還有 '+remaining+' 隊可行動')")
s=s.replace("    paintCoach();\n    requestAnimationFrame(measureOrderDock);", "    $('unit-orders').hidden=!(canAct&&a&&a.hp>0&&!a.acted)&&!plannedMove;\n    $('defend').hidden=!!plannedMove;\n    syncOrder(ready,a,t,predicted,predictedLoss);paintCoach();\n    requestAnimationFrame(positionOrders);")
s=s.replace("  $('roster').addEventListener('click',e=>{const el=e.target.closest('[data-unit]');if(el)choose(el.dataset.unit);});\n",'')
s=s.replace("  $('confirm-attack').addEventListener('click',confirmAttack);", "  $('confirm-attack').addEventListener('click',confirmAttack);\n  $('order-accept').addEventListener('click',acceptOrder);\n  $('order-cancel').addEventListener('click',dismissOrder);\n  $('battle-order').addEventListener('cancel',e=>{e.preventDefault();dismissOrder();});\n  $('battle-order').addEventListener('click',e=>{if(e.target!==$('battle-order'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismissOrder();});")
s=s.replace("if(e.key!=='Escape'||$('unit-guide').open", "if(e.key!=='Escape'||$('battle-order').open||$('unit-guide').open")
s=s.replace("measureOrderDock();keepLessonTargetVisible();positionCoach();}));", "positionOrders();keepLessonTargetVisible();positionCoach();}));")
p.write_text(s,encoding='utf-8')
