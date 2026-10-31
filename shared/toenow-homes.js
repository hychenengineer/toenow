// Shared read-only scenes. The materials ledger owns purchases and placement.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(root,require('./toenow-materials.js'),require('./toenow-homes-config.js'));
  else root.ToenowHomes=factory(root,root.ToenowMaterials,root.ToenowHomesConfig);
})(typeof globalThis!=='undefined'?globalThis:this,function(root,materials,configs){
  'use strict';
  function balance(snapshot,id){const n=snapshot?.balances?.[id];return Number.isSafeInteger(n)&&n>=0?n:0;}
  function translator(t,language){return s=>{
    const translated=t?t(s):s;if(translated!==s)return translated;
    const lang=language||root.ToenowI18n?.language;
    return lang==='zh-Hant'?(configs.entries[s]||s):s;
  };}
  function getModel(gameId,snapshot={}){
    const config=configs.get(gameId);if(!config||!materials.ITEMS[gameId])return null;
    const home=snapshot.homes?.[gameId]||{},raw=home.stage;
    const stage=Number.isInteger(raw)?Math.max(1,Math.min(5,raw)):1;
    return {stage,balance:balance(snapshot,gameId),projects:config.projects.map(p=>{
      const recipe=materials.upgradeRecipe(gameId,p.stage);
      return {...p,recipe,cost:materials.COSTS[p.stage],built:stage>=p.stage,available:stage+1===p.stage,
        affordable:Object.entries(recipe).every(([id,n])=>balance(snapshot,id)>=n)};
    }),decorations:['welcome','together'].map((id,i)=>({id,sprite:i+4,name:materials.ITEMS[gameId][id],
      owned:Array.isArray(home.owned)&&home.owned.includes(id),
      placed:Array.isArray(home.owned)&&home.owned.includes(id)&&Array.isArray(home.placed)&&home.placed.includes(id),
      recipe:materials.recipe(gameId,id)}))};
  }
  function getDialogue(gameId,snapshot={},index=0){
    const config=configs.get(gameId),model=getModel(gameId,snapshot);if(!model)return {text:'',count:0};
    const chat=config.chat,ambient=chat.ambient||[],cycle=3+ambient.length;
    const at=((Number.isSafeInteger(index)?index:0)%cycle+cycle)%cycle;
    if(at===1){
      const next=model.projects.find(p=>p.available);if(!next)return {text:chat.complete,count:0};
      const missing=Object.entries(next.recipe).find(([id,n])=>balance(snapshot,id)<n);
      return missing?{text:'We still need {count} {material} for our next project!',count:missing[1]-balance(snapshot,missing[0]),material:materials.ITEMS[missing[0]].name}:{text:chat.ready,count:0};
    }
    const returning=model.balance>0||model.stage>1||model.decorations.some(d=>d.owned);
    return {text:at===0?(returning?chat.returning:chat.welcome):at===2?chat.gameTip:ambient[at-3],count:0};
  }
  function markup(options={}){
    const {gameId,snapshot={},mode='visit',projectId,chatIndex=0,notice='',lastBuilt=''}=options;
    const config=configs.get(gameId);if(!config)return '';
    const t=translator(options.t,options.language),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const e=s=>escape(t(s)),m=getModel(gameId,snapshot),building=mode==='build';
    const selected=m.projects.find(p=>p.id===projectId);
    const decoration=m.decorations.find(d=>d.id===projectId);
    const line=getDialogue(gameId,snapshot,chatIndex),dialogue=notice?t(notice):t(line.text).replace('{count}',line.count).replace('{material}',t(line.material||''));
    const sprite=(n,extra='')=>`<span class="rabbit-sprite rabbit-sprite-${n}" style="background-image:url('${escape(config.atlas)}')" ${extra} aria-hidden="true"></span>`;
    function workbench(){
      const item=selected||decoration;
      if(!building||!item)return '';
      const costs=cost=>`<div class="rabbit-material-costs">${Object.entries(cost).map(([id,n])=>`<span class="rabbit-material-cost" aria-label="${e(materials.ITEMS[id].name)} ${balance(snapshot,id)} / ${n}"><span aria-hidden="true">${materials.ITEMS[id].icon}</span> ${e(materials.ITEMS[id].name)} <b>${balance(snapshot,id)} / ${n}</b><small>${e(configs.get(id).gameTitle||configs.get(id).gameName||id)}</small></span>`).join('')}</div>`;
      const affordable=Object.entries(item.recipe).every(([id,n])=>balance(snapshot,id)>=n);
      const action=selected?`<button type="button" data-rabbit-confirm="${selected.id}" ${selected.built||!selected.available||!selected.affordable?'disabled':''}>${e(selected.built?'Built':'Build here')}</button>`:`<button type="button" ${decoration.owned?`data-rabbit-toggle="${decoration.id}"`:`data-rabbit-craft="${decoration.id}"`} ${!decoration.owned&&!affordable?'disabled':''}>${e(decoration.owned?(decoration.placed?'Put away':'Place'):'Make')}</button>`;
      return `<section class="rabbit-workbench" aria-label="${e(item.name)}"><header><h3>${e(item.name)}</h3><button type="button" data-rabbit-action="visit" aria-label="${e('Close building tools')}">×</button></header>${selected?`<p>${e(selected.built?'Already part of our home.':selected.available?'This is where our next project will go.':'Build the earlier projects first.')}</p>`:''}${decoration?.owned?`<p>${e(decoration.placed?'On display':'In your collection')}</p>`:selected?.built?'':costs(item.recipe)}<div class="rabbit-project-price">${action}</div></section>`;
    }
    return `<section class="animal-home rabbit-home ${building?'is-building':''}" data-home-id="${escape(gameId)}" data-rabbit-stage="${m.stage}" data-rabbit-mode="${mode}"><header class="rabbit-home-header"><button type="button" data-rabbit-action="back">← ${e('My island')}</button><h2 id="islandLocationTitle">${e(config.place)}</h2><span class="rabbit-home-balance" aria-label="${e(materials.ITEMS[gameId].name)}: ${m.balance}">${materials.ITEMS[gameId].icon} <b>${m.balance}</b></span></header><div class="rabbit-canvas-frame"><div class="rabbit-yard"><img class="rabbit-home-background" src="${escape(config.background)}" alt="${e(config.starterDescription)}" draggable="false"><button type="button" class="rabbit-character" data-rabbit-action="chat" aria-label="${e(config.talkLabel)}"><img src="${escape(config.character)}" alt="" draggable="false"></button>${m.projects.map(p=>`<button type="button" class="rabbit-project rabbit-project-${p.position} ${p.built?'is-built':'is-empty'} ${building&&selected?.id===p.id?'is-selected':''} ${lastBuilt===p.id?'just-built':''}" data-rabbit-project="${p.id}" aria-label="${e(p.name)}${p.built?' · '+e('Built'):''}">${p.built?sprite(p.sprite,`data-rabbit-built="${p.id}" data-home-built="${p.id}"`):sprite(p.sprite,'data-rabbit-preview="true"')}<span class="rabbit-project-label">${p.built?'✓':'⚒'} ${e(p.name)}</span></button>`).join('')}${m.decorations.map(d=>`<button type="button" class="rabbit-decoration-slot rabbit-placed-${d.id} ${d.placed?'is-built':'is-empty'} ${building&&decoration?.id===d.id?'is-selected':''}" data-rabbit-decor="${d.id}" aria-label="${e(d.name)}" ${d.placed?`data-rabbit-decoration="${d.id}"`:''}>${sprite(d.sprite,d.placed?'':'data-rabbit-preview="true"')}<span class="rabbit-project-label">${d.placed?'✓':'✿'} ${e(d.name)}</span></button>`).join('')}</div>${workbench()}</div><footer class="rabbit-home-footer"><div class="rabbit-dialogue"><span class="rabbit-portrait"><img src="${escape(config.character)}" alt=""></span><p role="status" aria-live="polite">${escape(dialogue)}</p></div><nav class="rabbit-home-actions" aria-label="${e('Home activities')}"><button type="button" class="rabbit-primary" data-rabbit-action="play"><span aria-hidden="true">${materials.ITEMS[gameId].icon}</span><span>${e(config.playLabel)}<small>${e(config.gameTitle||config.gameName||gameId)}</small></span></button><button type="button" data-rabbit-action="chat" aria-label="${e(config.talkLabel)}"><span aria-hidden="true">💬</span>${e('Chat')}</button></nav></footer></section>`;
  }
  return {getModel,getDialogue,markup};
});
