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
    const army=Object.keys(E.TYPES).map(k=>'<div class="travel-squad">'+image(k)+'<span>'+name(k)+'</span><strong>'+Math.ceil(r.army[k]/E.TYPES[k].hp)+'</strong>'+(r.upgrades[k]?'<small>✦</small>':'')+'</div>').join('');
    const node=(id,x,y,content,label,cls='')=>'<button type="button" data-location="'+id+'" class="map-node '+cls+(selected===id?' chosen':'')+'" style="--x:'+x+'%;--y:'+y+'%" aria-label="'+label+'">'+content+'<span>'+label+'</span></button>';
    let nodes=node('home',12,49,'<img src="'+habitat('beaver',1)+'" alt="">',t('Forest Camp','森林基地'),'home-node');
    for(const [id,f] of Object.entries(C.FORTS)){
      const captured=r.forts[id].captured,locked=!captured&&!C.available(r,id);
      nodes+=node(id,f.x,f.y,'<img src="'+habitat(f.species)+'" alt=""><b>'+(captured?'✓':locked?'⌑':'⚑')+'</b>',fortName(id),(captured?'captured ':'')+(locked?'locked':''));
    }
    for(const [id,s] of Object.entries(C.SITES)){
      const found=r.sites[id].revealed,claimed=r.sites[id].claimed;
      nodes+=node(id,s.x,s.y,found?'<div class="trail-find">'+(id==='friends'?image('rabbit'):id==='cache'?'◈':'♣')+'</div>':'<div class="trail-fog">?</div>',claimed?t('Explored','已領取'):found?siteName(id):t('Unexplored trail','未知小徑'),(found?'revealed ':'foggy ')+(claimed?'claimed':''));
    }
    let detail='';
    if(selected==='home'){
      detail='<span class="eyebrow">'+t('RECRUIT & PREPARE','招募與整備')+'</span><h2>'+t('Forest Camp','森林基地')+'</h2><p>'+t('Choose your next counter. Wounded squads keep their current health.','為下一座城搭配剋制部隊；招兵只增加新兵，不會回復舊兵傷勢。')+'</p>';
      detail+=Object.keys(E.TYPES).map(k=>'<div class="recruit-card"><div class="recruit-title">'+image(k)+'<div><strong>'+name(k)+'</strong><small>'+t('Each: ','每隻：')+C.COST[k]+t(' gold',' 金幣')+'</small></div><b>'+Math.ceil(r.army[k]/E.TYPES[k].hp)+'</b></div><div class="recruit-actions">'+action('+1',recruitAttrs(k,1),r.gold<C.COST[k])+action('+3',recruitAttrs(k,3),r.gold<C.COST[k]*3)+'</div><div class="upgrade-line"><small>'+description[k]+'</small>'+action(r.upgrades[k]?t('Trained ✦','已升級 ✦'):t('Train · 35 wood','升級・35 木材'),upgradeAttrs(k),r.upgrades[k]||r.wood<C.UPGRADE_COST)+'</div></div>').join('');
    }else if(C.FORTS[selected]){
      const f=C.FORTS[selected],saved=r.forts[selected],count=Object.keys(E.TYPES).reduce((n,k)=>n+Math.ceil(saved.hp[k]/E.TYPES[k].hp),0);
      const counter={fox:'beaver',beaver:'squirrel',squirrel:'fox'}[f.species];
      detail='<span class="eyebrow">'+t('SCOUTING REPORT','偵察報告')+'</span><h2>'+fortName(selected)+'</h2><img class="scouting-art" src="'+habitat(f.species)+'" alt=""><div class="scouted-army">'+Object.keys(E.TYPES).map(k=>'<div>'+image(k)+'<span>'+name(k)+'</span><b>'+Math.ceil(saved.hp[k]/E.TYPES[k].hp)+'</b></div>').join('')+'</div><p>'+t('Bring ','帶上')+name(counter)+t(' to counter their main force.','，剋制守軍主力。')+'</p><div class="fort-loot">◈ '+f.gold+t(' gold',' 金幣')+' · ♣ '+f.wood+t(' wood',' 木材')+'</div>';
      detail+=saved.captured?'<p class="captured-note">✓ '+t('This fort is yours. Its reward has been collected.','這座城已屬於你，獎勵已領取。')+'</p>':!C.available(r,selected)?'<p>'+t('Capture both outer forts to reach the citadel.','先攻下橡果堡與溪流城寨，就能進攻主堡。')+'</p>':action(t('Attack fort · ','進攻城堡・')+count+t(' defenders',' 隻守軍'),'data-attack="'+selected+'"',!C.hasArmy(r),'primary');
      if(!C.hasArmy(r))detail+='<p>'+t('Your army needs reinforcements. Return to camp or explore a trail.','部隊已耗盡，請回基地招兵，或探索小徑尋找援軍。')+'</p>';
      detail+=action(t('Back to camp','返回基地'),'data-location="home"');
    }else{
      const s=C.SITES[selected],status=r.sites[selected];
      detail='<span class="eyebrow">'+t('OFF THE BEATEN PATH','岔路上的發現')+'</span><h2>'+(status.revealed?siteName(selected):t('What is beyond the mist?','迷霧後面藏著什麼？'))+'</h2>';
      if(status.claimed)detail+='<p>'+t('You have collected this discovery. Find another trail or prepare for a siege.','這裡的發現已領取。可以找其他小徑，或準備攻城。')+'</p>';
      else if(!status.revealed)detail+='<p>'+t('Follow the trail to uncover a one-time supply or new animal friends.','沿著小徑探索，可能發現一次性的物資，或願意加入的動物朋友。')+'</p>'+action(t('Explore this trail','探索這條小徑'),'data-explore="'+selected+'"',false,'primary');
      else if(s.reinforcements)detail+='<p>'+t('A travelling team offers to help. Choose three new allies.','旅行中的動物小隊願意幫忙，選擇三隻新夥伴加入。')+'</p>'+Object.keys(E.TYPES).map(k=>action(image(k)+name(k)+' +3','data-claim="'+selected+'" data-choice="'+k+'"')).join('');
      else detail+='<p>'+t('You found an old supply cache. Carry one bundle back to camp.','找到一處舊物資庫！選一份物資帶回基地。')+'</p>'+action('◈ '+s.gold+t(' gold',' 金幣'),'data-claim="'+selected+'" data-choice="gold"',false,'primary')+action('♣ '+s.wood+t(' wood',' 木材'),'data-claim="'+selected+'" data-choice="wood"');
      detail+=action(t('Back to camp','返回基地'),'data-location="home"');
    }
    let notice=t('Scout the forts. Explore a trail. Decide which squad to build next.','先偵察敵堡、探索小徑，再決定這一局要衝哪種兵。');
    if(r.last?.type==='victory'){const f=C.FORTS[r.last.id];notice=fortName(r.last.id)+t(' captured! +','攻下了！獲得 ')+f.gold+t(' gold · ',' 金幣・')+f.wood+t(' wood. Survivors return to camp.',' 木材，剩餘部隊已返回基地。');}
    if(r.last?.type==='retreat')notice=t('Retreated to camp. Both armies keep their losses. Recruit or explore before returning.','已撤回基地，雙方戰損都會保留。先補兵或探索，再回來挑戰。');
    if(r.last?.type==='defeat')notice=t('Your army was defeated. Resources and captured forts remain. Recruit or find allies to continue.','這次部隊全滅了，但資源與已佔領城堡保留。招兵或尋找援軍，仍能繼續遠征。');
    return '<div class="expedition-heading"><div><span class="eyebrow">'+t('ONE ISLAND · ONE EXPEDITION','一座小島・一局遠征')+'</span><h1>'+t('The Mistwood Expedition','迷霧森林遠征')+'</h1><p>'+t('Explore, recruit, and outsmart three forts. Every survivor matters.','探索、招兵，以巧取勝。每一隻活著回來的動物都很重要。')+'</p></div><div class="exp-resources"><span>◈ <b id="exp-gold">'+r.gold+'</b> '+t('gold','金幣')+'</span><span>♣ <b id="exp-wood">'+r.wood+'</b> '+t('wood','木材')+'</span><span>⚑ <b>'+C.captured(r)+'/3</b> '+t('forts','城堡')+'</span></div></div><div class="exp-notice" role="status">'+notice+'</div><div class="expedition-layout"><section class="exp-map-card"><div class="exp-map" role="group" aria-label="'+t('Expedition map','遠征地圖')+'"><div class="island-land"></div><svg class="island-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M12 49 Q19 25 29 18 M12 49 Q20 78 29 78 M12 49 Q33 25 49 27 M12 49 Q35 70 51 72 M49 27 Q68 20 80 38 M51 72 Q65 70 75 79 M51 72 Q73 65 80 38"/></svg><span class="map-tree tree-a">♣</span><span class="map-tree tree-b">♣</span><span class="map-tree tree-c">♣</span>'+nodes+'<span class="map-caption">'+t('MISTWOOD ISLAND','迷霧森林島')+'</span></div><div class="travel-army">'+army+'</div><p class="map-footnote">'+t('Losses persist. Explore supplies once. Capture both outer forts to unlock the citadel.','戰損不會重置・物資只能領一次・攻下兩座外堡後開啟主堡')+'</p></section><aside class="expedition-detail">'+detail+'</aside></div>';
  }};
})();
