(function(){
 'use strict';
 const F=window.CarefreeFarm,ID='carefree-farm',$=id=>document.getElementById(id),t=x=>window.ToenowI18n?.t(x)||x;
 let storage;try{storage=window.localStorage;}catch(_){}
 let state=F.create(),isPractice=false,blocked=false,unsaved=false,mode='title',tab='fields',selectedCrop='grass',selectedAnimal=0,panelType='',shopTab='animals',noticeTimer,busy=false;
 let normalSession=null,baseRaw=null,conflict=false,saleItem='',saleQuantity='1';
 const sdk=new window.ToenowGameSDK({gameId:ID,category:'relax',hasWaves:false,gameTitle:'Carefree Farm',onStart:o=>start(!!o?.isPractice),onPause:pause,onResume:resume,onRestart:()=>start(isPractice)});
 const art=species=>'../../assets/carefree-farm/'+species+'.webp';
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const text=value=>esc(t(value));
 const itemIcon=id=>F.CROPS[id]?`<img class="crop-art" src="../../assets/carefree-farm/crop-${id}.webp" alt="">`:F.ITEMS[id].icon;
 const remaining=due=>{const n=Math.max(0,Math.ceil((due-Date.now())/1000));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
 function notify(message){clearTimeout(noticeTimer);$('notice').textContent=message;noticeTimer=setTimeout(()=>$('notice').textContent='',4000);}
 function visibility(id,on){$(id).hidden=!on;$(id).classList.toggle('active',on);}
 function warning(){const shown=!isPractice&&(blocked||unsaved);$('save-warning').hidden=!shown;$('save-warning').textContent=t(conflict?'Another tab saved newer progress. This temporary session will not overwrite it.':blocked?'Existing save cannot be read. Playing temporarily; the original save is untouched.':'Progress could not be saved on this device. Keep this page open and try again.');}
 function readBase(){try{return storage.getItem(F.KEY);}catch(_){blocked=true;return null;}}
 function persist(){
  if(isPractice||blocked)return;
  const current=readBase();if(blocked){warning();return;}
  if(current!==baseRaw){blocked=true;conflict=true;unsaved=true;warning();return;}
  unsaved=!F.save(storage,state,false);if(!unsaved)baseRaw=JSON.stringify(state);warning();
 }
 function translate(){window.ToenowI18n?.apply?.();}
 function start(preview=false){
  if($('rest-panel').open)$('rest-panel').close();if($('panel').open)$('panel').close();
  if(preview&&!isPractice)normalSession={state,blocked,unsaved,baseRaw,conflict};
  if(!preview&&isPractice&&normalSession){({state,blocked,unsaved,baseRaw,conflict}=normalSession);normalSession=null;}
  isPractice=preview;
  if(preview){state=F.create();blocked=false;unsaved=false;conflict=false;}
  else if(!unsaved){const loaded=F.load(storage);state=loaded.state;blocked=loaded.blocked;baseRaw=readBase();conflict=false;}
  F.advance(state);mode='playing';$('farm-app').dataset.state=mode;sdk.startRun({isPractice});
  selectedAnimal=0;selectedCrop='grass';tab='fields';visibility('title-screen',false);visibility('gameover-screen',false);visibility('play',true);$('rest').hidden=false;$('preview-label').hidden=!isPractice;
  if(!preview&&!blocked&&!baseRaw)persist();render();
 }
 function showTitle(){mode='title';$('farm-app').dataset.state=mode;visibility('play',false);visibility('gameover-screen',false);visibility('title-screen',true);$('rest').hidden=true;window.ToenowScreens.updateTitle(ID,{bestScore:0,bestWave:1});translate();}
 function pause(){if(mode!=='playing')return;mode='paused';$('farm-app').dataset.state=mode;$('rest-panel').showModal();translate();}
 function resume(){if($('rest-panel').open)$('rest-panel').close();if(mode==='paused'){mode='playing';$('farm-app').dataset.state=mode;F.advance(state);render();}}
 function finish(){if($('rest-panel').open)$('rest-panel').close();mode='end';$('farm-app').dataset.state=mode;visibility('play',false);$('rest').hidden=true;
  window.ToenowScreens.updateGameOver(ID,{score:0,bestScore:0,wave:1,combo:null,reason:'GAME OVER',visit:[t('Farm level')+' '+state.level,t('Animal friends')+' '+state.animals.length]});
  sdk.handleGameOver({score:0,wave:1,isPractice,completed:true});visibility('gameover-screen',true);translate();
 }
 async function act(action){
  if(mode!=='playing'||busy)return;busy=true;$('play').setAttribute('aria-busy','true');
  const perform=()=>{
   if(!isPractice&&!blocked&&!unsaved){const loaded=F.load(storage);if(loaded.blocked)blocked=true;else{state=loaded.state;baseRaw=readBase();}}
   const result=F.act(state,action);
   if(result.ok){persist();if(result.sold)notify(t('Sold')+' ×'+result.sold+' · 🪙 '+result.total);else if(result.delivered)notify(t('Order delivered!'));else if(result.decorated)notify(t('A cozy new corner!'));else if(result.keepsake)notify(t('New keepsake!')+' '+t(F.KEEPSAKES.find(k=>k.id===result.keepsake).name));else if(result.gift)notify(t('A little surprise!')+' '+t(F.ITEMS[result.gift].name)+' ×2'+(F.CROPS[result.gift]?' · '+t('New seeds unlocked!'):''));else if(action.type==='upgrade')notify(t('Your farm has grown!'));else if(action.type==='buyAnimal'){selectedAnimal=state.animals.length-1;tab='pasture';notify(t('Welcome, little friend!'));}else if(action.type==='harvest')notify(t('Harvest added to your basket.'));}
   else notify(t(result.reason));render();if($('panel').open)renderPanel();
  };
  try{if(!isPractice&&navigator.locks)await navigator.locks.request('toenow-carefree-farm',perform);else perform();}finally{busy=false;$('play').setAttribute('aria-busy','false');}
 }
 function render(){
  selectedAnimal=Math.min(selectedAnimal,state.animals.length-1);
  $('coins').textContent=state.coins.toLocaleString();$('farm-level').textContent=t('Farm level')+' '+state.level+' · '+t('Animal spaces')+' '+state.animals.length+'/'+F.STAGES[state.level-1].capacity;
  for(const name of ['fields','pasture']){$(name).hidden=tab!==name;$('tab-'+name).setAttribute('aria-selected',String(tab===name));$('tab-'+name).tabIndex=tab===name?0:-1;}
  $('fields-badge').textContent=state.plots.filter(p=>p&&p.due<=Date.now()).length||'';
  $('pasture-badge').textContent=state.animals.filter(a=>a.gift||a.ready).length||'';
  $('plot-count').textContent=state.plots.length+' '+t('plots');$('animal-count').textContent=state.animals.length+' / '+F.STAGES[state.level-1].capacity;
  $('seed-picker').innerHTML=Object.entries(F.CROPS).filter(([id])=>state.unlocked.includes(id)).map(([id,c])=>`<button class="seed ${selectedCrop===id?'selected':''}" data-crop="${id}" aria-pressed="${selectedCrop===id}"><span>${itemIcon(id)}</span><div><strong>${text(c.name)}</strong><small>${c.cost?'🪙 '+c.cost:text('Free')} · ${c.seconds}${text('s')} · ×${c.yield}</small></div></button>`).join('')+`<button data-open="crops">${text('All crops')} ↗</button>`;
  $('plots').innerHTML=state.plots.map((p,i)=>{
   if(!p)return `<button class="plot empty" data-plot="${i}" aria-label="${text('Plant')} ${text(F.CROPS[selectedCrop].name)} ${i+1}"><span>＋</span><span class="label">${text('Plant')}</span></button>`;
   const c=F.CROPS[p.crop],ready=p.due<=Date.now();return `<button class="plot ${ready?'ready':''}" data-plot="${i}" aria-label="${text(c.name)} ${ready?text('Harvest'):text('Growing')}"><span class="sprouts ${ready?'':'young'}">${itemIcon(p.crop)}</span><span class="label">${ready?text('Harvest'):'<span data-due="'+p.due+'">'+remaining(p.due)+'</span>'}</span></button>`;
  }).join('')+(state.level<5?`<button class="plot locked" data-open="growth">🔒 ${text('Next field')} · ${text('Farm level')} ${state.level+1} ↗</button>`:'');
  window.CarefreePasture.update(state,selectedAnimal,t);
  const a=state.animals[selectedAnimal],spec=F.ANIMALS[a.species];
  $('animal-care').innerHTML=`<div class="care-info"><h3>${selectedAnimal===0?text('Cotton'):text(spec.name)} <small>${text(a.growth<3?'Baby':'Grown up')}</small></h3><div class="growth-track" role="progressbar" aria-label="${text('Growth')}" aria-valuenow="${a.growth}" aria-valuemin="0" aria-valuemax="3"><i style="width:${a.growth/3*100}%"></i></div><p>${a.growth<3?a.growth+' / 3 · '+text('Meals to grow up'):text('Produces')+' '+text(F.ITEMS[spec.product].name)}</p><p>${text('Favorite food')} · ${F.CROPS[spec.favorite].icon} ${text(F.CROPS[spec.favorite].name)}</p><p class="bond-label">♥ ${text(F.BONDS[F.bond(a)].name)} · ${a.friendship}/160 · ${text(a.trait)}</p></div><div class="care-actions"><button data-action="pet" ${a.petReadyAt>Date.now()?'disabled':''}>♡ ${text('Pet')} ${a.petReadyAt>Date.now()?'<span data-due="'+a.petReadyAt+'">'+remaining(a.petReadyAt)+'</span>':''}</button>${a.gift?`<button class="primary" data-action="gift">🎁 ${text('Open surprise')}</button>`:''}${a.ready?`<button class="primary" data-action="collect">${F.ITEMS[spec.product].icon} ${text('Collect')}</button>`:a.due?`<button disabled>${text('Growing')} · <span data-due="${a.due}">${remaining(a.due)}</span></button>`:[spec.food,spec.favorite].map(id=>`<button data-feed="${id}" ${state.inventory[id]>0?'':'disabled'}>${F.CROPS[id].icon} ${text('Feed')} · ${state.inventory[id]||0}</button>`).join('')}</div>`;
  $('inventory-open').innerHTML='🧺 <strong>'+text('Warehouse / Sell')+'</strong> <span>↗</span>';
  $('inventory-open').setAttribute('aria-label',t('Warehouse / Sell'));warning();translate();
 }
 function inventoryPanel(){
  let html='<p class="panel-intro">'+text('Keep food for your animals, or choose how many to sell.')+'</p>';
  if(saleItem&&state.inventory[saleItem]>0){const max=state.inventory[saleItem],quantity=Number(saleQuantity),valid=Number.isSafeInteger(quantity)&&quantity>0&&quantity<=max;
   html+='<section class="sale-box"><h3>'+text(F.ITEMS[saleItem].name)+' · '+text('In stock')+' '+max+'</h3><label for="sale-quantity">'+text('Quantity to sell')+'</label><div class="sale-controls"><button data-sale-step="-1" aria-label="'+text('Decrease quantity')+'">−</button><input id="sale-quantity" type="number" inputmode="numeric" min="1" max="'+max+'" step="1" value="'+esc(saleQuantity)+'"><button data-sale-step="1" aria-label="'+text('Increase quantity')+'">＋</button><button data-sale-all="true">'+text('All')+'</button></div><p id="sale-total">'+text('Total')+' · 🪙 '+(valid?quantity*F.ITEMS[saleItem].sell:'—')+'</p><button class="primary" data-confirm-sale="true" '+(valid?'':'disabled')+'>'+text('Confirm sale')+'</button></section>';
  }
  html+=Object.entries(state.inventory).filter(([,n])=>n>0).map(([id,n])=>'<div class="catalog-row"><span class="item-icon">'+itemIcon(id)+'</span><div class="details"><strong>'+text(F.ITEMS[id].name)+' ×'+n+'</strong><p>🪙 '+F.ITEMS[id].sell+' / '+text('each')+'</p></div><button data-sell="'+id+'">'+text('Sell')+' →</button></div>').join('');
  if(!Object.values(state.inventory).some(n=>n>0))html+='<p>'+text('Your basket is empty. Grass seeds are always free.')+'</p>';return html;
 }
 function openPanel(type){panelType=type;if(type==='shop')shopTab='animals';if(type==='inventory'){saleItem='';saleQuantity='1';}renderPanel();if(!$('panel').open)$('panel').showModal();}
 function renderPanel(){
  const title={orders:'Village orders',collection:'Keepsake collection',decorations:'Make it your home',growth:'Farm milestones',inventory:'Warehouse / Sell',shop:'Farm shop',crops:'Crop collection'};
  $('panel-title').textContent=t(title[panelType]);let html='';
  if(panelType==='growth'){
   const next=F.STAGES[state.level],req=F.requirements(state);
   html=`<p class="panel-intro">${text('Grow crops and raise different animals to open each new field.')}</p>`;
   if(next){html+=`<h3>${text('Farm level')} ${state.level} → ${state.level+1}</h3>`+req.map(r=>`<div class="milestone ${r.value>=r.target?'met':''}"><span>${r.value>=r.target?'✓':'○'} ${text(r.key)}</span><b>${r.value} / ${r.target}</b></div>`).join('')+`<div class="stage-reward">${text('Unlocks')} · ${next.plots} ${text('plots')} · ${next.capacity} ${text('Animal spaces')}<br>${Object.values(F.CROPS).filter(c=>c.level===state.level+1).map(c=>c.icon+' '+text(c.name)).join(' · ')}</div><button class="primary upgrade-button" data-action="upgrade" ${req.every(r=>r.value>=r.target)?'':'disabled'}>${text('Open next field')} · 🪙 ${next.cost}</button>`;}else html+=`<p>🌻 ${text('All fields are open. Make yourself at home!')}</p>`;
   html+=`<div class="roadmap">${F.STAGES.map((stage,i)=>`<p>${i+1<=state.level?'✓':'🔒'} ${text('Farm level')} ${i+1} · ${stage.plots} ${text('plots')} · ${stage.capacity} ${text('Animal spaces')}</p>`).join('')}</div>`;
  }else if(panelType==='inventory'){
   html=inventoryPanel();
  }else if(panelType==='orders'){
   html='<p class="panel-intro">'+text('No deadlines. Deliver whenever you feel like it.')+'</p><p>'+text('Completed orders')+': '+state.completedOrders+' · 🎟 '+state.stamps+'</p>'+state.orders.map(o=>'<article class="order-card"><h3>'+text(o.requester)+'</h3>'+Object.entries(o.needs).map(([id,n])=>'<p class="order-need">'+itemIcon(id)+' '+text(F.ITEMS[id].name)+' <b>'+(state.inventory[id]||0)+' / '+n+'</b></p>').join('')+'<div class="order-reward">🪙 '+o.coins+' · 🎟 '+o.stamps+'<button class="primary" data-order="'+o.id+'" '+(Object.entries(o.needs).every(([id,n])=>(state.inventory[id]||0)>=n)?'':'disabled')+'>'+text('Deliver')+'</button></div></article>').join('');
  }else if(panelType==='collection'){
   html='<p class="panel-intro">'+text('Grow closer to your animals. Their surprises become lasting memories.')+'</p><p>'+state.collection.length+' / '+F.KEEPSAKES.length+'</p>'+Object.entries(F.ANIMALS).map(([species,spec])=>'<h3>'+text(spec.name)+'</h3><div class="catalog-grid">'+F.KEEPSAKES.filter(k=>k.species===species).map(k=>'<div class="keepsake '+(state.collection.includes(k.id)?'found':'')+'"><span>'+(state.collection.includes(k.id)?k.icon:'♡')+'</span><strong>'+text(k.name)+'</strong><small>'+text(state.collection.includes(k.id)?'Collected':F.BONDS[k.bond].name)+'</small></div>').join('')+'</div>').join('');
  }else if(panelType==='decorations'){
   html='<p class="panel-intro">'+text('Complete orders to add cozy corners to your pasture.')+'</p><p>🪙 '+state.coins+' · 🎟 '+state.stamps+' · '+text('Completed orders')+' '+state.completedOrders+'</p>'+Object.entries(F.DECORATIONS).map(([id,d])=>'<article class="order-card"><h3>'+text(d.name)+'</h3><p>'+text('Completed orders')+': '+state.completedOrders+' / '+d.orders+'</p><div class="order-reward">🪙 '+d.coins+' · 🎟 '+d.stamps+'<button data-decoration="'+id+'" '+(state.decorations.includes(id)||state.completedOrders<d.orders||state.coins<d.coins||state.stamps<d.stamps?'disabled':'')+'>'+text(state.decorations.includes(id)?'At home':'Place in pasture')+'</button></div></article>').join('');
  }else if(panelType==='crops'||(panelType==='shop'&&shopTab==='crops')){
   html=`<p class="panel-intro">${text('Seeds are paid for when planted. Favorite foods grow animals faster.')}</p><div class="catalog-grid">`+Object.entries(F.CROPS).map(([id,c])=>`<div class="crop-card ${state.unlocked.includes(id)?'':'locked'}"><b>${itemIcon(id)}</b> <strong>${text(c.name)}</strong><p>${state.unlocked.includes(id)?text('Available'):text('Farm level')+' '+c.level+' 🔒'}</p><p>🪙 ${c.cost} · ${c.seconds}${text('s')} · ${text('Harvest')} ×${c.yield}</p><p>${text('Sells for')} 🪙 ${c.sell} / ${text('each')}</p><p>${text('Profit per harvest')} 🪙 ${c.sell*c.yield-c.cost}</p></div>`).join('')+'</div>';
  }else{
   html=`<p class="panel-intro">${text('Every new friend arrives as a baby with three portions of food.')} ${text('Animal spaces')}: ${state.animals.length}/${F.STAGES[state.level-1].capacity}</p>`+Object.entries(F.ANIMALS).map(([id,a])=>{const locked=a.level>state.level,full=state.animals.length>=F.STAGES[state.level-1].capacity,owned=state.level<5&&state.animals.some(friend=>friend.species===id);return `<div class="catalog-row"><img src="${art(id)}" alt=""><div class="details"><strong>${text(a.name)}</strong><p>${text('Food')}: ${text(F.CROPS[a.food].name)} · ${text('Produces')}: ${text(F.ITEMS[a.product].name)}</p><p>${text('Surprise')}: ${text(F.ITEMS[a.gift].name)}</p></div><button data-buy="${id}" ${locked||full||owned||state.coins<a.cost?'disabled':''}>${locked?'🔒 '+text('Farm level')+' '+a.level:owned?text('Already at home'):full?text('More spaces needed'):text('Welcome')+' · 🪙 '+a.cost}</button></div>`;}).join('');
  }
  if(panelType==='shop')html=`<nav class="shop-tabs"><button data-shop-tab="animals" class="${shopTab==='animals'?'selected':''}">${text('Animals')}</button><button data-shop-tab="crops" class="${shopTab==='crops'?'selected':''}">${text('Crops')}</button></nav>`+html;
  $('panel-content').innerHTML=html;translate();
 }
 window.ToenowScreens.mount(ID);
 $('panel-content').addEventListener('input',e=>{if(e.target.id!=='sale-quantity')return;saleQuantity=e.target.value;const n=Number(saleQuantity),valid=Number.isSafeInteger(n)&&n>0&&n<=(state.inventory[saleItem]||0);$('sale-total').textContent=t('Total')+' · 🪙 '+(valid?n*F.ITEMS[saleItem].sell:'—');document.querySelector('[data-confirm-sale]').disabled=!valid;});
 $('btn-start').onclick=()=>start(false);$('btn-farm-practice').onclick=()=>start(true);$('btn-retry').onclick=()=>start(isPractice);$('btn-title').onclick=showTitle;
 $('back-hub').onclick=$('rest-hub').onclick=()=>sdk.exitToHub();$('rest').onclick=pause;$('resume').onclick=resume;$('restart').onclick=()=>start(isPractice);$('finish').onclick=finish;
 $('rest-panel').addEventListener('cancel',e=>{e.preventDefault();resume();});$('panel-close').onclick=()=>$('panel').close();
 $('growth-open').onclick=()=>openPanel('growth');$('inventory-open').onclick=()=>openPanel('inventory');$('shop-open').onclick=()=>openPanel('shop');
 for(const name of ['fields','pasture'])$('tab-'+name).onclick=()=>{tab=name;render();};
 document.querySelector('.tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();tab=tab==='fields'?'pasture':'fields';render();$('tab-'+tab).focus();}});
 $('farm-app').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.crop){selectedCrop=d.crop;render();}else if(d.plot!==undefined){const plot=Number(d.plot);act(state.plots[plot]?{type:'harvest',plot}:{type:'plant',plot,crop:selectedCrop});}
  else if(d.animal!==undefined){selectedAnimal=Number(d.animal);render();}
  else if(d.feed)act({type:'feed',animal:selectedAnimal,crop:d.feed});
  else if(d.action)act({type:d.action,animal:selectedAnimal});else if(d.open)openPanel(d.open);
  else if(d.sell){saleItem=d.sell;saleQuantity='1';renderPanel();}else if(d.saleStep){saleQuantity=String(Math.max(1,Math.min(state.inventory[saleItem]||0,(Number(saleQuantity)||0)+Number(d.saleStep))));renderPanel();}else if(d.saleAll){saleQuantity=String(state.inventory[saleItem]||0);renderPanel();}else if(d.confirmSale)act({type:'sell',item:saleItem,quantity:Number(saleQuantity)});else if(d.order)act({type:'fulfill',order:Number(d.order)});else if(d.decoration)act({type:'buyDecoration',decoration:d.decoration});else if(d.buy)act({type:'buyAnimal',species:d.buy});else if(d.shopTab){shopTab=d.shopTab;renderPanel();}
 });
 window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==location.origin)return;if(e.data?.type==='GAME_PAUSE')pause();if(e.data?.type==='GAME_RESUME')resume();if(e.data?.type==='GAME_RESTART')start(isPractice);});
 window.addEventListener('storage',e=>{if(e.key===F.KEY&&!isPractice&&!blocked&&!unsaved&&mode==='playing'){const loaded=F.load(storage);if(!loaded.blocked){state=loaded.state;render();if($('panel').open)renderPanel();}}});
 window.addEventListener('toenow:languagechange',()=>{if(mode==='playing'||mode==='paused'){render();if($('panel').open)renderPanel();}});
 setInterval(()=>{if(mode!=='playing'&&mode!=='paused')return;const before=JSON.stringify(state.animals);const oldReady=$('fields-badge').textContent;F.advance(state);const ready=String(state.plots.filter(p=>p&&p.due<=Date.now()).length||'');if(before!==JSON.stringify(state.animals)||oldReady!==ready){render();if($('panel').open&&panelType!=='inventory')renderPanel();}else document.querySelectorAll('[data-due]').forEach(el=>el.textContent=remaining(Number(el.dataset.due)));const pet=document.querySelector('[data-action=pet]');if(pet&&state.animals[selectedAnimal].petReadyAt<=Date.now())pet.disabled=false;},1000);
 showTitle();
})();
