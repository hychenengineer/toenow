(function(){
  'use strict';
  const C=window.AnimalExpedition,E=window.AnimalSiege;
  window.AnimalExpeditionView={render(r,selected,{text:t,name,image}){
    const habitat=(species,stage=3)=>'../../assets/animal-island/'+species+'-level'+stage+'.webp';
    const siteName=id=>t(C.SITES[id].name,C.SITES[id].nameZh);
    const fortName=id=>t(C.FORTS[id].name,C.FORTS[id].nameZh);
    const description={beaver:t('Take 20% less damage','受到傷害減少 20%'),fox:t('Move one extra tile','移動距離增加 1 格'),squirrel:t('Shoot one tile farther','射程增加 1 格')};
    const action=(label,attrs,disabled=false,cls='')=>'<button type="button" '+attrs+' class="exp-action '+cls+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
    const recruitAttrs=(k,n)=>'data-recruit="'+k+'" data-amount="'+n+'" aria-label="'+t('Recruit '+n+' '+name(k)+' for '+C.COST[k]*n+' gold','招募 '+n+' 隻'+name(k)+'，花費 '+C.COST[k]*n+' 金幣')+'"';
    const upgradeAttrs=k=>'data-upgrade="'+k+'" aria-label="'+t('Train '+name(k)+' for 35 wood','升級'+name(k)+'，花費 35 木材')+'"';
    const plan=C.preparation(r);
    let report='';
    if(r.battleReport){
      const b=r.battleReport,total=(team,key)=>Object.values(b[team]).reduce((n,u)=>n+u[key],0);
      const deployed=total('player','deployed'),lost=total('player','lost'),survived=total('player','survived');
      report='<details class="battle-report"'+(['victory','retreat','defeat'].includes(r.last?.type)?' open':'')+' data-report-outcome="'+b.outcome+'" data-report-fort="'+b.id+'"><summary class="report-heading"><div><span class="eyebrow">'+t('LAST BATTLE · LOSSES PERSIST','最近戰況・戰損會保留')+'</span><h3>'+fortName(b.id)+' · '+(b.outcome==='victory'?t('Captured','攻城成功'):b.outcome==='retreat'?t('Retreated','撤回基地'):t('Defeated','部隊全滅'))+'</h3></div><div class="report-reward" data-report-gold="'+b.reward.gold+'" data-report-wood="'+b.reward.wood+'">'+(b.outcome==='victory'?'◈ +'+b.reward.gold+t(' gold',' 金幣')+' · ♣ +'+b.reward.wood+t(' wood',' 木材'):t('No capture reward','本次未獲得攻城獎勵'))+'</div></summary><div class="report-body"><div class="report-totals"><span>'+t('Deployed','投入')+'<b>'+deployed+'</b></span><span>'+t('Lost','損失')+'<b>'+lost+'</b></span><span>'+t('Survived','生還')+'<b>'+survived+'</b></span></div><table><caption>'+t('Your squads · exact survivors return to camp','我方各隊戰況・生還部隊保留原有生命')+'</caption><thead><tr><th>'+t('Squad','部隊')+'</th><th>'+t('Deployed','出發')+'</th><th>'+t('Lost','損失')+'</th><th>'+t('Survived','生還')+'</th></tr></thead><tbody>'+Object.keys(E.TYPES).map(k=>'<tr data-report-kind="'+k+'"><th>'+image(k)+name(k)+'</th><td>'+b.player[k].deployed+'</td><td>'+b.player[k].lost+'</td><td>'+b.player[k].survived+'</td></tr>').join('')+'</tbody></table><p>'+t('Counter attacks: ','克制攻擊：')+b.counterHits+t(' · Actual counter damage: ',' 次・實際造成 ')+b.counterDamage+t(' HP.',' 點傷害。')+'</p><p class="report-takeaway">'+(b.outcome==='victory'&&deployed<total('enemy','deployed')?t('A smaller army won: ','以少勝多：我方 ')+deployed+t(' allies against ',' 隻對上 ')+total('enemy','deployed')+t(' defenders.',' 隻守軍。'):t('Defenders lost: ','守軍本次減少 ')+total('enemy','lost')+t(' animals.',' 隻。'))+' '+t('Review losses, then decide where to spend your new supplies.','看看哪隊損失最多，再決定下一筆補給要花在哪裡。')+'</p></div></details>';
    }
    const party='<div class="kingdom-party" aria-hidden="true">'+Object.keys(E.TYPES).filter(k=>r.army[k]>0).map(image).join('')+'</div>';
    // Interaction anchors follow the approved painted scene, independently of campaign rules.
    const points={home:[12.5,49],acorn:[51,26.5],river:[52,69],tower:[83,37],cache:[26,20],timber:[22,75],friends:[77,77]};
    const node=(id,x,y,content,label,cls='')=>{const [px,py]=points[id]||[x,y];return '<button type="button" data-location="'+id+'" class="map-node '+cls+(selected===id?' chosen':'')+'" style="--x:'+px+'%;--y:'+py+'%" aria-label="'+label+'">'+content+'<span>'+label+'</span></button>';};
    let nodes=node('home',12,49,'<img src="'+habitat('beaver',1)+'" alt="">',t('Forest Camp','森林基地'),'home-node');
    for(const [id,f] of Object.entries(C.FORTS)){
      const captured=r.forts[id].captured,locked=!captured&&!C.available(r,id);
      nodes+=node(id,f.x,f.y,'<img src="'+habitat(f.species)+'" alt=""><b>'+(captured?'✓':locked?'🔒':'⚑')+'</b>',fortName(id),(captured?'captured ':'')+(locked?'locked':''));
    }
    for(const [id,s] of Object.entries(C.SITES)){
      const found=r.sites[id].revealed,claimed=r.sites[id].claimed;
      nodes+=node(id,s.x,s.y,found?'<div class="trail-find">'+(claimed?'✓':id==='friends'?image('rabbit'):id==='cache'?'◈':'♣')+'</div>':'<div class="trail-fog">?</div>',claimed?t('Explored','已領取'):found?siteName(id):t('Unexplored trail','未知小徑'),(found?'revealed ':'foggy ')+(claimed?'claimed':''));
    }
    let detail='';
    if(selected==='home'){
      detail='<span class="eyebrow">'+t('RECRUIT & PREPARE','招募與整備')+'</span><h2 id="location-heading">'+t('Forest Camp','森林基地')+'</h2><p>'+t('Choose your next counter. Wounded squads keep their current health.','為下一座城搭配剋制部隊；招兵只增加新兵，不會回復舊兵傷勢。')+'</p>';
      detail+=action(t('Enter Forest Camp →','進入森林基地 →'),'data-enter-camp',false,'primary');
    }else if(C.FORTS[selected]){
      const f=C.FORTS[selected],saved=r.forts[selected],count=Object.keys(E.TYPES).reduce((n,k)=>n+Math.ceil(saved.hp[k]/E.TYPES[k].hp),0);
      const scout=C.preparation(r,selected),counter=scout?.counter||{fox:'beaver',beaver:'squirrel',squirrel:'fox'}[f.species];
      detail='<span class="eyebrow">'+t('SCOUTING REPORT','偵察報告')+'</span><h2 id="location-heading">'+fortName(selected)+'</h2><img class="scouting-art" src="'+habitat(f.species)+'" alt=""><div class="scouted-army">'+Object.keys(E.TYPES).map(k=>'<div>'+image(k)+'<span>'+name(k)+'</span><b>'+Math.ceil(saved.hp[k]/E.TYPES[k].hp)+'</b></div>').join('')+'</div><p>'+t('Bring ','帶上')+name(counter)+t(' to counter their main force.','，剋制守軍主力。')+'</p><div class="fort-loot">◈ '+f.gold+t(' gold',' 金幣')+' · ♣ '+f.wood+t(' wood',' 木材')+'</div>';
      detail+=saved.captured?'<p class="captured-note">✓ '+t('This fort is yours. Its reward has been collected.','這座城已屬於你，獎勵已領取。')+'</p>':!C.available(r,selected)?'<p>'+t('Capture both outer forts to reach the citadel.','先攻下橡果堡與溪流城寨，就能進攻主堡。')+'</p>':action(t('Attack fort · ','進攻城堡・')+count+t(' defenders',' 隻守軍'),'data-attack="'+selected+'"',!C.hasArmy(r),'primary');
      if(!C.hasArmy(r))detail+='<p>'+t('Your army needs reinforcements. Return to camp or explore a trail.','部隊已耗盡，請回基地招兵，或探索小徑尋找援軍。')+'</p>';
      if(scout){detail+='<div class="scout-main">'+t('Main force: ','主力：')+name(scout.main)+' '+scout.counts[scout.main]+' / '+scout.defenders+t(' defenders',' 隻守軍')+'</div>';}
    }else{
      const s=C.SITES[selected],status=r.sites[selected];
      detail='<span class="eyebrow">'+t('OFF THE BEATEN PATH','岔路上的發現')+'</span><h2 id="location-heading">'+(status.revealed?siteName(selected):t('What is beyond the mist?','迷霧後面藏著什麼？'))+'</h2>';
      if(s.guards&&status.revealed)detail+='<p>'+t('Follow the tracks, scout the patrol and decide whether to fight for supplies.','追蹤腳印、偵察巡守隊，再決定要不要挑戰守衛取得物資。')+'</p>'+action(status.claimed?t('Revisit clearing','查看已探索空地'):t('Continue exploring →','繼續探索 →'),'data-enter-trail="'+selected+'"',false,'primary');
      else if(status.claimed)detail+='<p>'+t('You have collected this discovery. Find another trail or prepare for a siege.','這裡的發現已領取。可以找其他小徑，或準備攻城。')+'</p>';
      else if(!status.revealed)detail+='<p>'+t('Follow the trail to uncover a one-time supply or new animal friends.','沿著小徑探索，可能發現一次性的物資，或願意加入的動物朋友。')+'</p>'+action(t('Explore this trail','探索這條小徑'),'data-explore="'+selected+'"',false,'primary');
      else if(s.reinforcements)detail+='<p>'+t('A travelling team offers to help. Choose three new allies.','旅行中的動物小隊願意幫忙，選擇三隻新夥伴加入。')+'</p>'+Object.keys(E.TYPES).map(k=>action(image(k)+name(k)+' +3','data-claim="'+selected+'" data-choice="'+k+'"')).join('');
      else detail+='<p>'+t('You found an old supply cache. Carry one bundle back to camp.','找到一處舊物資庫！選一份物資帶回基地。')+'</p>'+action('◈ '+s.gold+t(' gold',' 金幣'),'data-claim="'+selected+'" data-choice="gold"',false,'primary')+action('♣ '+s.wood+t(' wood',' 木材'),'data-claim="'+selected+'" data-choice="wood"');
    }
    let notice=t('Scout the forts. Explore a trail. Decide which squad to build next.','先偵察敵堡、探索小徑，再決定這一局要衝哪種兵。');
    if(r.last?.type==='victory'){const f=C.FORTS[r.last.id];notice=fortName(r.last.id)+t(' captured! +','攻下了！獲得 ')+f.gold+t(' gold · ',' 金幣・')+f.wood+t(' wood. Survivors return to camp.',' 木材，剩餘部隊已返回基地。');}
    if(r.last?.type==='retreat')notice=t('Retreated to camp. Both armies keep their losses. Recruit or explore before returning.','已撤回基地，雙方戰損都會保留。先補兵或探索，再回來挑戰。');
    if(r.last?.type==='defeat')notice=t('Your army was defeated. Resources and captured forts remain. Recruit or find allies to continue.','這次部隊全滅了，但資源與已佔領城堡保留。招兵或尋找援軍，仍能繼續遠征。');
    return '<div class="expedition-heading"><div><h1>'+t('The Mistwood Expedition','迷霧森林遠征')+'</h1></div><div class="exp-resources"><span>◈ <b id="exp-gold">'+r.gold+'</b> '+t('gold','金幣')+'</span><span>♣ <b id="exp-wood">'+r.wood+'</b> '+t('wood','木材')+'</span><span>⚑ <b>'+C.captured(r)+'/3</b> '+t('forts','城堡')+'</span></div></div>'+window.AnimalArmyView.render(r,{text:t,name,image})+report+'<div class="expedition-layout"><div class="expedition-main"><section class="exp-map-card"><div class="exp-map" role="group" aria-label="'+t('Expedition map','遠征地圖')+'"><div class="island-land"></div><svg class="island-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M12 49 Q19 25 29 18 M12 49 Q20 78 29 78 M12 49 Q33 25 49 27 M12 49 Q35 70 51 72 M49 27 Q68 20 80 38 M51 72 Q65 70 75 79 M51 72 Q73 65 80 38"/></svg><span class="map-tree tree-a">♣</span><span class="map-tree tree-b">♣</span><span class="map-tree tree-c">♣</span>'+nodes+party+'<span class="map-caption">'+t('MISTWOOD ISLAND','迷霧森林島')+'</span></div></section></div></div><dialog id="location-dialog" aria-labelledby="location-heading" data-i18n-ignore><aside class="expedition-detail"><button type="button" id="location-close" aria-label="'+t('Close location','關閉地點資訊')+'">×</button>'+detail+'</aside></dialog>';
  }};
})();
