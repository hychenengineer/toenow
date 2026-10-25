(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(null,require('./toenow-levels.js'));
  else root.ToenowAnimals=factory(root,root.ToenowLevels);
})(typeof globalThis!=='undefined'?globalThis:this,function(root,levels){
  'use strict';
  const THEMES={
    'animal-rescue-train':{species:'panda',icon:'🐼',place:'Panda Rescue Station',placeZh:'熊貓救援車站',kind:'station',task:'Help the panda stationmaster board every animal safely.',taskZh:'幫熊貓站長安排乘車順序，讓每隻動物安全上車。'},
    'number-pop':{species:'rabbit',icon:'🐰',place:'Rabbit Harvest Garden',placeZh:'兔子採收園',kind:'music',task:'Collect numbered harvest baskets from lowest to highest with Rabbit.',taskZh:'和兔子一起，依數值從小到大收取採收籃。'},
    'ball-track':{species:'otter',icon:'🦦',place:'Otter River Shelter',placeZh:'水獺溪流小屋',kind:'orbit',task:'Remember the otters, follow their floating leaves, then find their hiding places.',taskZh:'記住指定水獺，追蹤浮葉移動，再找出牠們躲藏的位置。'},
    'block-match':{species:'beaver',icon:'🦫',place:'Beaver Timber Workshop',placeZh:'海狸木作工坊',kind:'workshop',task:'Remove extra timber tiles to match Beaver\'s blueprint.',taskZh:'移除多餘木板，完成海狸圖紙上的排列。'},
    'add-up':{species:'squirrel',icon:'🐿️',place:'Squirrel Supply Depot',placeZh:'松鼠補給站',kind:'garden',task:'Choose nut bags that add up to Squirrel\'s supply order.',taskZh:'選取堅果袋，湊出松鼠補給訂單上的總數。'},
    'space-scale':{species:'fox',icon:'🦊',place:'Fox Parcel Weighhouse',placeZh:'狐狸秤重小屋',kind:'observatory',task:'Read the scales and help Fox sort mysterious parcels by weight.',taskZh:'觀察天平，幫狐狸推理神祕包裹的重量順序。'},
    'tap-match':{species:'penguin',icon:'🐧',place:'Penguin Matching Pool',placeZh:'企鵝配對池',kind:'arch',task:'Find matching picture cards and help Penguin collect them.',taskZh:'找出符合目標的圖卡，幫企鵝完成收集。'},
    'spot-quick':{species:'owl',icon:'🦉',place:'Owl Observation Station',placeZh:'貓頭鷹觀察站',kind:'lookout',task:'Identify blurry photos from every category for Owl\'s observation journal.',taskZh:'辨認各種類別的模糊照片，完成貓頭鷹的觀察圖鑑。'},
    'shadow-match':{species:'raccoon',icon:'🦝',place:'Raccoon Shadow Theater',placeZh:'浣熊影子劇場',kind:'temple',task:'Watch Raccoon\'s moving paper shapes and find the matching card.',taskZh:'觀察浣熊操作的移動剪紙，找出相同形狀組合的圖卡。'},
    'flash-brain':{species:'elephant',icon:'🐘',place:'Elephant Memory Garden',placeZh:'大象記憶花園',kind:'lighthouse',task:'Remember the animal flowerbeds with Elephant. Recall their positions and avoid thorns.',taskZh:'和大象記住動物出現的花圃，點回位置並避開荊棘。'}
  };
  const bySpecies=Object.fromEntries(Object.values(THEMES).map(t=>[t.species,t]));
  const state=new Map();
  const characters=new Map();
  function getTheme(id){return THEMES[id]||null;}
  function stage(value){const n=Number(value);return Number.isFinite(n)?Math.min(5,Math.max(1,Math.trunc(n))):1;}
  function levelForWave(wave){return levels?.getLevelInfo(Math.max(1,Number(wave)||1)).level||1;}
  function getBuildingAsset(id,level){const t=getTheme(id);return t?`assets/animal-island/${t.species}-level${stage(level)}.webp`:null;}
  function getCharacterAsset(species){return bySpecies[species]?`assets/animal-island/${species}-character.webp`:null;}
  function getSavedLevel(id,storage){
    const keys=levels?.GAME_STORAGE_KEYS?.[id];if(!keys)return 1;
    try{
      const store=storage||root?.localStorage;
      const valid=value=>{const n=Number(value);return Number.isSafeInteger(n)&&n>=1?n:1;};
      let records;try{records=JSON.parse(store?.getItem('toenow_game_scores')||'{}');}catch(_){}
      return levelForWave(Math.max(valid(store?.getItem(keys.wave)),valid(records?.[id]?.maxWave)));
    }catch(_){return 1;}
  }
  function drawAnimal(ctx,species,x,y,size){
    const t=bySpecies[species];
    if(!ctx||!t||!Number.isFinite(size)||size<=0)return;
    if(root?.Image){
      if(!characters.has(species)){const img=new root.Image();img.src='../../'+getCharacterAsset(species);characters.set(species,img);}
      const img=characters.get(species);
      if(img.complete&&img.naturalWidth>0){ctx.save();const h=size*1.35,w=h*img.naturalWidth/img.naturalHeight;ctx.drawImage(img,x-w/2,y-h/2,w,h);ctx.restore();return;}
    }
    ctx.save();ctx.globalAlpha=1;ctx.shadowBlur=0;
    ctx.font=`${size}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#3d5146';
    ctx.fillText(t.icon,x,y);ctx.restore();
  }
  function label(en,zh){return root?.ToenowI18n?.language==='zh-Hant'?zh:en;}
  function paint(id){
    const t=getTheme(id),s=state.get(id);if(!t||!s?.host)return;
    const host=s.host,displayLevel=host.hidden?s.level:getSavedLevel(id);host.dataset.level=String(displayLevel);host.dataset.reaction=s.reaction||'ready';
    const source='../../'+getBuildingAsset(id,displayLevel);
    if(host.querySelector('img').getAttribute('src')!==source)host.querySelector('img').setAttribute('src',source);
    host.querySelector('img').alt=label(t.place,t.placeZh);
    host.querySelector('strong').textContent=label(t.place,t.placeZh);
    host.querySelector('[data-animal-task]').textContent=t.task&&label(t.task,t.taskZh);
    host.querySelector('[data-animal-level]').textContent=`LVL ${displayLevel}`;
    const status=host.querySelector('[data-animal-status]');
    status.textContent=s.reaction==='success'?label('Collected!','完成收集！'):s.reaction==='retry'?label('Look again. You can do it!','再觀察一下，你可以的！'):'';
  }
  function setWave(id,wave){if(!getTheme(id))return;const prior=state.get(id),level=levelForWave(wave);if(prior?.level===level)return;const s=prior||{};s.level=level;state.set(id,s);paint(id);}
  function feedback(id,success){
    if(!getTheme(id))return;
    const s=state.get(id)||{level:1};s.reaction=success?'success':'retry';state.set(id,s);paint(id);
    if(root?.setTimeout){root.clearTimeout(s.timer);s.timer=root.setTimeout(()=>{s.reaction='ready';paint(id);},1600);}
  }
  function mount(id){
    const doc=root?.document,t=getTheme(id);if(!doc?.createElement||!t)return null;
    if(state.get(id)?.host)return state.get(id).host;
    const host=doc.createElement('aside');host.className='animal-companion';host.dataset.i18nIgnore='';host.setAttribute('aria-label',label('Animal companion','動物夥伴'));
    host.innerHTML='<button type="button" class="animal-companion-toggle" aria-expanded="false"><span aria-hidden="true"></span><small data-animal-level></small></button><div class="animal-companion-detail" hidden><img width="160" height="130" alt=""><strong></strong><p data-animal-task></p></div><span class="animal-companion-status" data-animal-status role="status" aria-live="polite"></span>';
    host.querySelector('button span').textContent=t.icon;
    const button=host.querySelector('button'),detail=host.querySelector('.animal-companion-detail');
    button.setAttribute('aria-label',label(t.place,t.placeZh));
    button.addEventListener('click',()=>{detail.hidden=!detail.hidden;button.setAttribute('aria-expanded',String(!detail.hidden));});
    const s=state.get(id)||{level:1};s.host=host;state.set(id,s);doc.body.append(host);doc.body.classList.add('animal-game');doc.body.dataset.animalGame=id;
    // Gameplay owns the whole touch surface. The expandable guide belongs to the title.
    function syncVisibility(){
      const title=doc.querySelector('[data-toenow-screen="title"],#title-screen');
      host.hidden=!title||!title.getClientRects?.().length||root.getComputedStyle(title).visibility==='hidden';
      if(host.hidden&&!detail.hidden){detail.hidden=true;button.setAttribute('aria-expanded','false');}
      if(s.wasVisible!==!host.hidden){s.wasVisible=!host.hidden;paint(id);}
    }
    syncVisibility();
    doc.addEventListener('click',event=>{
      if(event.target.closest?.('[data-start="true"],.unified-practice-level-btn'))host.hidden=true;
    },true);
    const visibilityTimer=root.setInterval(syncVisibility,250);
    root.addEventListener('pagehide',()=>root.clearInterval(visibilityTimer),{once:true});
    paint(id);root.addEventListener('toenow:languagechange',()=>{paint(id);button.setAttribute('aria-label',label(t.place,t.placeZh));});
    if(root.Image){const img=new root.Image();img.src='../../'+getCharacterAsset(t.species);characters.set(t.species,img);}
    return host;
  }
  if(root?.document?.addEventListener){
    const boot=()=>{const id=(root.location?.pathname||'').match(/\/games\/([^/]+)/)?.[1];if(id)mount(id);};
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  }
  return {THEMES,getTheme,getBuildingAsset,getCharacterAsset,getSavedLevel,levelForWave,drawAnimal,setWave,feedback,mount};
});
