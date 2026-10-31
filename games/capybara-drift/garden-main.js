(async function(){'use strict';const E=window.CapybaraGarden,ID='capybara-drift',$=id=>document.getElementById(id),t=x=>window.ToenowI18n?.t(x)||x;let storage;try{storage=window.localStorage;}catch(_){}
 const canvas=$('garden'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let view;
 let profile=E.load(storage),history=E.history(),mode='title',returnMode='title',preview=false,selected='swim',time=0,last=0,audio,sound=false,visitorClock=0,noticeTimer,frameId;
 let panMode=false,multiTouch=false;const pointers=new Map();
 const icons={swim:'🍊',water:'💧',stone:'🪨',wood:'🪵',bamboo:'🎋',flowers:'🌸',light:'🏮',erase:'⌫'},names={swim:'Swim',water:'Water',stone:'Stone',wood:'Wood',bamboo:'Bamboo',flowers:'Flowers',light:'Light',erase:'Remove'},animals={duck:'🦆',frog:'🐸',turtle:'🐢',otter:'🦦',rabbit:'🐇',butterfly:'🦋',firefly:'✨'},animalNames={duck:'Duck',frog:'Frog',turtle:'Turtle',otter:'Otter',rabbit:'Rabbit',butterfly:'Butterfly',firefly:'Firefly'};
 const sdk=new window.ToenowGameSDK({gameId:ID,category:'relax',gameTitle:'Capybara Hot Spring Garden',onStart:o=>start(!!o?.isPractice),onPause:pause,onResume:resume,onRestart:()=>start(preview)});
 window.ToenowScreens.mount(ID);
 visible('title-screen',false);
 $('garden-loading-message').textContent=t('Loading garden…');
 $('garden-reload').textContent=t('Try again');
 $('garden-reload').onclick=()=>location.reload();
 try{view=new window.GardenRenderer(canvas);await view.ready;}catch(error){console.warn('Garden renderer could not start',error);$('garden-loading-message').textContent=t('The garden could not load. Please try again.');$('garden-reload').hidden=false;return;}
 $('garden-loading').hidden=true;
 function translate(){window.ToenowI18n?.apply?.();}
 function visible(id,on){$(id).hidden=!on;$(id).classList.toggle('active',on);}
 function notify(text){clearTimeout(noticeTimer);$('notice').textContent=t(text);noticeTimer=setTimeout(()=>$('notice').textContent='',3200);}
 function save(){if(preview)return true;const ok=E.save(storage,profile,false);if(!ok)notify('Progress could not be saved on this device.');return ok;}
 function controls(){for(const b of $('materials').children)b.setAttribute('aria-pressed',String(b.dataset.tool===selected&&!panMode));$('pan-toggle').setAttribute('aria-pressed',String(panMode));$('undo').disabled=!history.past.length;$('redo').disabled=!history.future.length;$('garden-hint').textContent=t(panMode?'Drag to move · Pinch to zoom':preview?'Preview leaves your saved garden untouched.':selected==='swim'?'Tap the water to swim':'Tap to grow your garden');canvas.setAttribute('aria-label',t('Hot spring garden')+' · '+t(panMode?'Move map':names[selected])+' · '+view.cursor.q+', '+view.cursor.r);}
 for(const id of Object.keys(icons)){const b=document.createElement('button');b.type='button';b.dataset.tool=id;b.setAttribute('aria-label',t(names[id]));const icon=document.createElement('b');icon.textContent=icons[id];icon.setAttribute('aria-hidden','true');const text=document.createElement('small');text.textContent=t(names[id]);b.append(icon,text);b.onclick=()=>{panMode=false;selected=id;controls();};$('materials').append(b);}
 function start(isPreview=false){if(mode==='playing'||mode==='rest')save();preview=isPreview;profile=E.load(storage,preview);history=E.history();E.visit(profile);visitorClock=0;mode='playing';last=0;closeDialogs();sdk.startRun({isPractice:preview,wave:1});visible('title-screen',false);visible('gameover-screen',false);visible('garden-tools',true);view.swimmer={q:0,r:0};view.target={...profile.cells.find(c=>c.type==='water')};view.fruit={q:view.target.q+.5,r:view.target.r};controls();save();canvas.focus();}
 function title(){closeDialogs();mode='title';visible('garden-tools',false);visible('gameover-screen',false);window.ToenowScreens.updateTitle(ID,{});visible('title-screen',true);$('btn-start').focus();}
 function closeDialogs(){resetPointers();for(const id of ['rest-panel','book'])if($(id).open)$(id).close();}
 function pause(){if(mode==='rest')return;resetPointers();returnMode=mode;if(mode==='playing')save();mode='rest';$('rest-panel').showModal();$('reset-confirm').hidden=true;$('resume').focus();}
 function resume(){closeDialogs();mode=returnMode;last=0;(mode==='playing'?canvas:mode==='title'?$('btn-start'):$('btn-retry')).focus();}
 function finish(){if(mode!=='playing'&&!(mode==='rest'&&returnMode==='playing')){resume();return;}save();closeDialogs();mode='result';sdk.handleGameOver({score:0,wave:1,isPractice:preview,duration:Date.now()-sdk.runStartTime});window.ToenowScreens.updateGameOver(ID,{score:0,wave:1,combo:null,reason:'GAME OVER',visit:profile.visitors.map(id=>animalNames[id])});visible('garden-tools',false);visible('gameover-screen',true);$('btn-retry').focus();}
 function tone(){if(!sound||mode!=='playing')return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});if(audio.currentTime-(tone.last||-1)<.12)return;tone.last=audio.currentTime;const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;o.frequency.setValueAtTime(520+Math.random()*150,now);o.frequency.exponentialRampToValueAtTime(240,now+.17);g.gain.setValueAtTime(.025,now);g.gain.exponentialRampToValueAtTime(.001,now+.2);o.connect(g);g.connect(audio.destination);o.start();o.stop(now+.21);}catch(_){}}
 function apply(q,r){if(mode!=='playing')return;view.cursor={q,r};if(selected==='swim'){const water=profile.cells.filter(c=>c.type==='water'),nearest=water.reduce((a,b)=>Math.hypot(b.q-q,b.r-r)<Math.hypot(a.q-q,a.r-r)?b:a);view.target={q:nearest.q,r:nearest.r};view.ripple(nearest.q,nearest.r);tone();}else if(E.edit(profile,history,q,r,selected)){view.ripple(q,r);tone();save();}controls();}
 function resetPointers(){for(const id of pointers.keys())if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);pointers.clear();multiTouch=false;}
 function locationOf(e){const b=canvas.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};}
 function pair(){const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};}
 canvas.addEventListener('pointerdown',e=>{
  if(mode!=='playing'||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();
  const p=locationOf(e);pointers.set(e.pointerId,{...p,start:p,type:e.pointerType});canvas.setPointerCapture(e.pointerId);
  if(pointers.size>1){multiTouch=true;return;}
  // Defer touch edits until release so the first finger of a pinch never builds.
  if(!panMode&&e.pointerType!=='touch'){const cell=view.input(p.x,p.y);apply(cell.q,cell.r);}
 });
 canvas.addEventListener('pointermove',e=>{
  if(mode!=='playing')return;const p=locationOf(e),old=pointers.get(e.pointerId);
  if(!old){if(!panMode)view.cursor=view.input(p.x,p.y);return;}
  e.preventDefault();const before=pointers.size>1?pair():null;pointers.set(e.pointerId,{...old,...p});
  if(before){const after=pair();view.moveCamera(profile,after.x-before.x,after.y-before.y,view.zoom*after.distance/before.distance,before);return;}
  if(multiTouch)return;
  if(panMode){view.moveCamera(profile,p.x-old.x,p.y-old.y);return;}
  const cell=view.input(p.x,p.y);if(old.type!=='touch'&&(cell.q!==view.cursor.q||cell.r!==view.cursor.r))apply(cell.q,cell.r);
 });
 function endPointer(e,cancelled=false){
  const old=pointers.get(e.pointerId);if(!old)return;
  if(!cancelled&&mode==='playing'&&!panMode&&!multiTouch&&old.type==='touch'){
   const p=locationOf(e);if(Math.hypot(p.x-old.start.x,p.y-old.start.y)<14){const cell=view.input(p.x,p.y);apply(cell.q,cell.r);}
  }
  pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(!pointers.size)multiTouch=false;save();
 }
 canvas.addEventListener('pointerup',e=>endPointer(e));canvas.addEventListener('pointercancel',e=>endPointer(e,true));canvas.addEventListener('lostpointercapture',e=>endPointer(e,true));
 canvas.addEventListener('keydown',e=>{if(mode!=='playing')return;const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(dir){e.preventDefault();if(panMode){view.moveCamera(profile,dir[0]*40,dir[1]*40);return;}view.cursor.q=Math.max(-12,Math.min(12,view.cursor.q+dir[0]));view.cursor.r=Math.max(-12,Math.min(12,view.cursor.r+dir[1]));if(selected==='swim')apply(view.cursor.q,view.cursor.r);controls();}if(!panMode&&(e.key==='Enter'||e.key===' ')){e.preventDefault();apply(view.cursor.q,view.cursor.r);}if(e.key==='Escape'){e.preventDefault();pause();}});
 $('undo').onclick=()=>{E.undo(profile,history);save();controls();};$('redo').onclick=()=>{E.redo(profile,history);save();controls();};$('zoom-in').onclick=()=>view.moveCamera(profile,0,0,view.zoom+.15);$('zoom-out').onclick=()=>view.moveCamera(profile,0,0,view.zoom-.15);
 $('pan-toggle').onclick=()=>{resetPointers();panMode=!panMode;controls();};$('recenter').onclick=()=>view.resetCamera();
 $('btn-start').onclick=()=>start(false);$('btn-journey-practice').onclick=()=>start(true);$('btn-retry').onclick=()=>start(preview);$('btn-title').onclick=title;$('rest').onclick=pause;$('resume').onclick=resume;$('restart').onclick=()=>start(preview);$('finish').onclick=finish;
 function exit(){if(mode==='playing'||mode==='rest')save();sdk.exitToHub();}$('back-hub').onclick=exit;$('rest-hub').onclick=exit;
 $('restore').onclick=()=>$('reset-confirm').hidden=false;$('reset-no').onclick=()=>$('reset-confirm').hidden=true;$('reset-yes').onclick=()=>{history.past.push(JSON.parse(JSON.stringify(profile.cells)));history.future=[];profile.cells=E.defaults().cells;save();returnMode='playing';resume();controls();};
 $('sound').onclick=()=>{sound=!sound;$('sound').textContent=t(sound?'Sound on':'Sound off');$('sound').setAttribute('aria-pressed',String(sound));tone();};
 $('postcard').onclick=()=>{if(mode!=='playing')return;const previous=profile.postcards.slice();E.postcard(profile);if(!save()){profile.postcards=previous;return;}document.body.classList.add('capturing');setTimeout(()=>{document.body.classList.remove('capturing');notify(preview?'Preview postcard saved for this visit.':'Postcard saved');},650);};
 function book(album){resetPointers();if(mode!=='rest')returnMode=mode;mode='rest';$('book').classList.remove('postcard-view');$('book-title').textContent=t(album?'Postcard album':'Collection book');$('book-content').replaceChildren();if(album){for(const card of [...profile.postcards].reverse()){const box=document.createElement('div');box.className='book-card';const open=document.createElement('button');open.className='postcard-open';open.setAttribute('aria-label',t('Open postcard')+' · '+new Date(card.timestamp).toLocaleString());const thumb=document.createElement('canvas');open.append(thumb);box.append(open);open.onclick=()=>openPostcard(card);$('book-content').append(box);view.postcard(thumb,{...profile,...card});const label=document.createElement('p');label.textContent=new Date(card.timestamp).toLocaleDateString()+' · '+t(card.palette);box.append(label);}if(!profile.postcards.length)$('book-content').textContent=t('Your first postcard is waiting.');}else{for(const id of profile.discoveries){const box=document.createElement('div');box.className='book-card';const icon=document.createElement('strong');icon.textContent=animals[id];const text=document.createElement('span');text.textContent=t(animalNames[id]);box.append(icon,text);$('book-content').append(box);}for(const cosmetic of profile.cosmetics){const b=document.createElement('button');b.textContent=t(({peach:'Peach float',mint:'Mint float',citrus:'Yuzu float',flower:'Flower float'})[cosmetic]);b.setAttribute('aria-pressed',String(profile.equipped===cosmetic));b.onclick=()=>{profile.equipped=cosmetic;save();for(const v of $('book-content').querySelectorAll('button'))v.setAttribute('aria-pressed',String(v===b));};$('book-content').append(b);}}if(!$('book').open)$('book').showModal();$('book-close').focus();}
 function openPostcard(card){
  $('book').classList.add('postcard-view');$('book-title').textContent=t('Postcard');$('book-content').replaceChildren();
  const detail=document.createElement('div');detail.id='postcard-detail';
  const picture=document.createElement('canvas');picture.setAttribute('role','img');picture.setAttribute('aria-label',t('Hot spring garden'));
  const date=document.createElement('p');date.textContent=new Date(card.timestamp).toLocaleString()+' · '+t(card.palette);
  const explanation=document.createElement('p');explanation.textContent=t(preview?'Preview leaves your saved garden untouched.':'Your current garden will be saved as another postcard before continuing.');
  const restore=document.createElement('button');restore.id='postcard-continue';restore.textContent=t('Continue from here');
  const error=document.createElement('p');error.setAttribute('role','alert');
  restore.disabled=!card.cells.some(c=>c.type==='water');
  restore.onclick=()=>{
   const before=JSON.parse(JSON.stringify(profile));
   if(!E.restorePostcard(profile,card))return;
   if(!save()){profile=before;error.textContent=t('Progress could not be saved on this device.');return;}
   history=E.history();visitorClock=0;view.resetCamera();view.ripples=[];
   const first=profile.cells.find(c=>c.type==='water');view.swimmer={q:first.q,r:first.r};view.target={...view.swimmer};view.fruit={q:first.q+.5,r:first.r};
   panMode=false;returnMode='playing';resume();controls();notify('Garden restored');
  };
  const back=document.createElement('button');back.id='postcard-back';back.textContent=t('Back to album');back.onclick=()=>book(true);
  detail.append(picture,date,explanation,error,restore,back);$('book-content').append(detail);
  view.postcard(picture,{...profile,...card},1000,600);restore.focus();
 }
 $('collection-open').onclick=()=>book(false);$('album-open').onclick=()=>book(true);$('book-close').onclick=resume;for(const id of ['book','rest-panel'])$(id).addEventListener('cancel',e=>{e.preventDefault();resume();});
 addEventListener('resize',()=>view.resize());addEventListener('pagehide',e=>{if(mode==='playing'||mode==='rest')save();if(!e.persisted){cancelAnimationFrame(frameId);view.destroy();}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
 function frame(now){const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(mode==='playing'){time+=dt;visitorClock+=dt;if(visitorClock>45){visitorClock=0;const id=E.visit(profile);notify(animalNames[id]);save();}}view.draw(profile,reduced?0:time,dt,mode==='playing',reduced,mode==='playing'&&!panMode?selected:null);frameId=requestAnimationFrame(frame);}controls();title();translate();frameId=requestAnimationFrame(frame);
})();
