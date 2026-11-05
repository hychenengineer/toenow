/* River presentation and lifecycle; gameplay and durable progress live in engine.js. */
(function(){
 'use strict';
 const E=window.CapybaraDrift,ID='capybara-drift',$=id=>document.getElementById(id);
 const canvas=$('river'),ctx=canvas.getContext('2d');
 let storage;try{storage=window.localStorage;}catch(_){}
 const t=text=>window.ToenowI18n?.t(text)||text;
 const scenes=['Bamboo Brook','Petal Lagoon','Gentle Rain','Starlight Springs'];
 let floatColor=E.SHOP[E.readProfile(storage).equipped].color;
 let state=E.create(),mode='title',width=800,height=600,last=0,saveClock=0,drag=null,hintUntil=0,noticeUntil=0,soundOn=false,audio=null,keys=new Set(),sceneIndex=-1;
 const sdk=new window.ToenowGameSDK({gameId:ID,category:'relax',gameTitle:'Capybara Drift',onStart:o=>start(o.wave,o.isPractice),onPause:()=>pause(),onResume:()=>resume(),onRestart:()=>start(state.startWave,state.isPractice)});
 window.ToenowScreens.mount(ID);
 function visible(id,value){$(id).hidden=!value;$(id).classList.toggle('active',value);}
 function updateTitle(){window.ToenowScreens.updateTitle(ID,{bestScore:sdk.loadBestScore(),bestWave:sdk.loadBestWave()});$('continue').hidden=!E.restore(storage);}
 function title(){mode='title';state.paused=true;visible('title-screen',true);visible('gameover-screen',false);visible('rest-panel',false);visible('play-hud',false);visible('title-extras',true);visible('drift-hint',false);visible('notice',false);updateTitle();}
 function start(wave=1,isPractice=false,restored=null){
  if(mode==='playing'||mode==='rest')checkpoint();
  state=restored||E.create(wave,isPractice);state.paused=false;mode='playing';last=0;saveClock=0;sceneIndex=-1;drag=null;keys.clear();
  sdk.startRun({wave:state.startWave,isPractice:state.isPractice});
  visible('title-screen',false);visible('gameover-screen',false);visible('rest-panel',false);visible('title-extras',false);visible('play-hud',true);visible('shop',false);
  hintUntil=state.elapsed+8;visible('drift-hint',true);syncHUD();checkpoint();
 }
 function checkpoint(){if(mode==='playing'||mode==='rest'){const saved=E.checkpoint(storage,state);if(!state.isPractice&&saved)sdk.saveBestRecords(state.score,state.wave);return saved;}return false;}
 function pause(){if(mode!=='playing')return;checkpoint();state.paused=true;mode='rest';drag=null;keys.clear();$('wallet').textContent=String(E.readProfile(storage).wallet);visible('rest-panel',true);$('resume').focus();}
 function resume(){if(mode!=='rest')return;state.paused=false;mode='playing';last=0;visible('rest-panel',false);canvas.focus();}
 function finishDrift(){
  if(mode!=='playing'&&mode!=='rest')return;
  E.finish(storage,state);state.paused=true;mode='result';drag=null;keys.clear();
  sdk.handleGameOver({score:state.score,wave:state.wave,isPractice:state.isPractice,duration:Math.max(1000,state.elapsed*1000)});
  window.ToenowScreens.updateGameOver(ID,{score:state.score,bestScore:sdk.loadBestScore(),wave:state.wave,combo:null,reason:'GAME OVER'});
  visible('rest-panel',false);visible('play-hud',false);visible('drift-hint',false);visible('notice',false);visible('gameover-screen',true);$('btn-retry').focus();
 }
 function syncHUD(){
  $('score').textContent=String(state.score);$('friends').textContent=String(state.friends);
  const n=Math.floor((state.startWave-1)/5+state.elapsed/60)%4;$('scene').textContent=t(scenes[n]);
  if(sceneIndex!==n&&sceneIndex!==-1)notice(scenes[n]);sceneIndex=n;
 }
 function notice(text){$('notice').textContent=t(text);visible('notice',true);noticeUntil=state.elapsed+3;}
 function shop(){
  const p=E.readProfile(storage);floatColor=E.SHOP[p.equipped].color;$('wallet').textContent=String(p.wallet);$('shop-items').replaceChildren();
  for(const [id,item] of Object.entries(E.SHOP)){
   const names={peach:'Peach float',flower:'Flower float',citrus:'Yuzu float',mint:'Mint float'};
   const button=document.createElement('button');button.type='button';button.dataset.float=id;button.setAttribute('aria-pressed',String(p.equipped===id));
   const swatch=document.createElement('span');swatch.className='float-swatch';swatch.style.setProperty('--float',item.color);button.appendChild(swatch);
   const name=document.createElement('span');name.textContent=t(names[id]);button.appendChild(name);
   const cost=document.createElement('span');cost.textContent=p.equipped===id?t('Wearing'):p.owned.includes(id)?t('Wear it'):item.cost+' '+t('joy');button.appendChild(cost);
   button.disabled=state.isPractice;
   button.addEventListener('click',()=>{const success=E.buy(storage,id);shop();$('shop-status').textContent=t(success?'A lovely new look!':'A little more joy to collect.');});$('shop-items').appendChild(button);
  }
  $('shop-status').textContent=state.isPractice?t('Practice leaves your saved joy untouched.') : '';
 }
 function tone(type){
  if(!soundOn)return;
  try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});
   const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type='sine';osc.frequency.setValueAtTime(type==='friend'?660:type==='yuzu'?523:880,now);osc.frequency.exponentialRampToValueAtTime(440,now+.16);gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.22);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+.23);
  }catch(_){}
 }
 function resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);const d=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);}
 const riverWidth=()=>Math.min(width*.78,680);
 function waterX(x,y){const bend=Math.sin(y*4+state.elapsed*.025)*riverWidth()*.065;return width/2+(x-.5)*riverWidth()+bend;}
 function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function line(points,color,size){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))ctx.lineTo(p[0],p[1]);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.stroke();}
 function yuzu(x,y,r){ellipse(x,y,r,r*.9,'#edbd4b');ellipse(x-r*.25,y-r*.25,r*.2,r*.15,'#ffe295');ctx.save();ctx.translate(x+2,y-r);ctx.rotate(-.4);ellipse(0,0,r*.4,r*.17,'#6e9c6e');ctx.restore();}
 function capy(x,y,size,float,fruit=0,friend=false){
  ctx.save();ctx.translate(x,y);ctx.scale(size/100,size/100);ctx.rotate(Math.sin(state.elapsed*1.5+(friend?2:0))*.035);
  ellipse(0,31,59,19,'#4a918227');
  ctx.beginPath();ctx.ellipse(0,14,55,31,0,0,Math.PI*2);ctx.strokeStyle='#fff8e4';ctx.lineWidth=18;ctx.stroke();ctx.strokeStyle=float;ctx.lineWidth=13;ctx.stroke();
  ellipse(0,2,33,33,'#af805b');ellipse(-29,11,10,8,'#976f50');ellipse(29,11,10,8,'#976f50');
  ellipse(-22,-35,10,12,'#a77b55');ellipse(22,-35,10,12,'#a77b55');ellipse(-22,-35,5,7,'#d3a780');ellipse(22,-35,5,7,'#d3a780');
  ellipse(0,-20,34,30,'#bf956a');ellipse(0,-6,29,19,'#cfaa7d');
  line([[-22,-22],[-18,-24],[-14,-22]],'#654c3e',2.6);line([[14,-22],[18,-24],[22,-22]],'#654c3e',2.6);
  ellipse(-7,-9,2,2.7,'#725343');ellipse(7,-9,2,2.7,'#725343');line([[-5,1],[0,3],[5,1]],'#82634c',1.6);
  ellipse(-25,-9,6,3,'#dfa48a80');ellipse(25,-9,6,3,'#dfa48a80');
  for(let i=0;i<Math.min(fruit,4);i++)yuzu(Math.sin(i*1.4+state.elapsed)*3,-54-i*13,9);
  if(fruit>4){ctx.fillStyle='#fff9dc';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('+'+(fruit-4),24,-81);}
  ctx.restore();
 }
 function plant(x,y,r,color,flower=false){
  line([[x,y+r],[x,y-r*.4]],'#91ab7a',2);ellipse(x-r*.35,y,r*.7,r*.28,color);ellipse(x+r*.35,y-r*.35,r*.7,r*.28,color);
  if(flower){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*r*.32,y-r*.7+Math.sin(a)*r*.32,r*.28,r*.28,'#f5cfcb');}ellipse(x,y-r*.7,r*.14,r*.14,'#e3be6c');}
 }
 function render(){
  const scene=Math.floor((state.startWave-1)/5+state.elapsed/60)%4,night=scene===3;
  const palettes=[['#d8e6bd','#b9e2d6','#81bfbc'],['#e7dece','#c5e7dd','#92c9c4'],['#cbded2','#bddbd5','#89b5bb'],['#536b79','#6b9caa','#497f99']];
  const [grass,water,deep]=palettes[scene],rw=riverWidth(),flow=state.elapsed*height*.07;
  ctx.fillStyle=grass;ctx.fillRect(0,0,width,height);
  // Winding banks: the playable channel remains broad in all scenes.
  for(const [extra,color] of [[60,night?'#9e9d89':'#f5e8c7'],[20,night?'#829b9a':'#dbe9d9'],[0,water]]){
   ctx.beginPath();for(let i=0;i<=30;i++){const y=i/30*height,x=waterX(0,i/30)-extra;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}for(let i=30;i>=0;i--){const y=i/30*height;ctx.lineTo(waterX(1,i/30)+extra,y);}ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  const g=ctx.createLinearGradient(width/2-rw/2,0,width/2+rw/2,0);g.addColorStop(0,'#ffffff18');g.addColorStop(.5,deep+'44');g.addColorStop(1,'#ffffff18');ctx.fillStyle=g;ctx.fillRect(width/2-rw*.4,0,rw*.8,height);
  for(let i=0;i<40;i++){
   const y=((i*73+flow*.6)%(height+60))-30,x=waterX(.1+((i*37)%80)/100,y/height);
   line([[x,y],[x+9,y+2],[x+22,y]],night?'#b8e0dc33':'#ffffff60',1.5);
  }
  for(let i=0;i<18;i++){
   const y=((i*97+flow)%(height+180))-90,side=i%2===0?-1:1,x=waterX(side<0?0:1,y/height)+side*(35+(i%3)*19);
   ellipse(x,y+12,35,16,night?'#446964':'#a4c78d');plant(x,y,18,night?'#789a82':'#7fa97a',scene===1||i%3===0);plant(x+20,y+18,10,'#9fbb85',i%3===1);
   if(i%4===0){ellipse(x-side*15,y+36,15,9,night?'#91a49d':'#c2c7b0');ellipse(x-side*12,y+33,8,3,'#e5e1c3');}
  }
  for(let i=0;i<7;i++){const y=((i*113+flow*.8)%(height+100))-50,x=waterX(i%2?.95:.05,y/height);ellipse(x,y,17,8,night?'#7eab91':'#8dbf98');ellipse(x+4,y-3,4,3,'#f2d1d4');}
  // A little passing spa pavilion every ninety seconds; never interrupts the drift.
  const stop=(state.elapsed%90)*height*.1-height*.45;
  if(stop>-100&&stop<height+100){const x=waterX(0,stop/height)-25;ctx.fillStyle=night?'#a19a83':'#e0b68d';ctx.fillRect(x-36,stop-12,72,42);for(let i=0;i<5;i++)line([[x-32+i*15,stop-10],[x-32+i*15,stop+28]],'#bf9271',1);ellipse(x,stop+3,24,13,'#c9e9da');plant(x-25,stop-30,15,'#95ad7d',true);}
  for(const item of state.items){const x=waterX(item.x,item.y),y=item.y*height;
   if(item.type==='bubble'){ellipse(x,y,13,13,'#ffffff31');ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.strokeStyle='#fffdf0c9';ctx.lineWidth=2;ctx.stroke();ellipse(x-4,y-5,4,2,'#fff');}
   if(item.type==='yuzu')yuzu(x,y,13);
   if(item.type==='petal'){ctx.save();ctx.translate(x,y);ctx.rotate(state.elapsed*.5);for(let n=0;n<5;n++){const a=n*Math.PI*2/5;ellipse(Math.cos(a)*9,Math.sin(a)*9,7,5,'#edbcc7');}ellipse(0,0,4,4,'#fff3b3');ctx.restore();}
   if(item.type==='friend')capy(x,y,33,'#c8bedc',0,true);
   if(item.type==='rock'){ellipse(x,y+7,22,10,'#59998930');ellipse(x,y,19,13,night?'#9baeb4':'#bcc8b8');ellipse(x-4,y-4,10,5,'#e1e2cf');}
  }
  const float=floatColor,size=Math.max(62,Math.min(112,rw*.24));
  for(let i=Math.min(state.friends,4);i>0;i--){const y=.72*height+i*size*.49,x=waterX(state.x+Math.sin(state.elapsed*1.2-i)*.035,y/height);capy(x,y,size*.55,i%2?'#c4c0df':'#b5d5b7',0,true);}
  const px=waterX(state.x,.72),py=.72*height+Math.sin(state.elapsed*1.6)*3;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(px,py+size*.35+i*9,size*.65+i*9,12+i*3,0,0,Math.PI*2);ctx.strokeStyle='#fff6da60';ctx.lineWidth=1.5;ctx.stroke();}
  capy(px,py,size,float,state.yuzu);
  for(const p of state.particles){ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle='#fffbea';ctx.font='bold 22px ui-rounded,sans-serif';ctx.textAlign='center';ctx.fillText(p.text,waterX(p.x,p.y),p.y*height-25);ctx.globalAlpha=1;}
  if(scene===2){for(let i=0;i<45;i++){const x=(i*137)%width,y=(i*71+state.elapsed*230)%height;line([[x,y],[x-3,y+11]],'#e9f6ef66',1);}}
  if(night){for(let i=0;i<25;i++){const x=(i*173)%width,y=(i*97)%height;ellipse(x+Math.sin(state.elapsed+i)*8,y,1.5,1.5,'#ffe5a9'+(Math.sin(state.elapsed+i)>.1?'bb':'44'));}}
 }
 function tick(now){
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  if(mode==='playing'){
   if(keys.has('ArrowLeft')||keys.has('a'))E.steer(state,state.target-dt*.5);if(keys.has('ArrowRight')||keys.has('d'))E.steer(state,state.target+dt*.5);
   const events=E.step(state,dt);if(events.length){tone(events[0]);checkpoint();if(events.includes('friend'))notice('A new friend is drifting with you.');}
   saveClock+=dt;if(saveClock>=2){checkpoint();saveClock=0;}
   if(state.elapsed>=hintUntil)visible('drift-hint',false);if(state.elapsed>=noticeUntil)visible('notice',false);
   syncHUD();
  }
  render();window.requestAnimationFrame(tick);
 }
 function steerPointer(e){const r=canvas.getBoundingClientRect(),bend=waterX(.5,.72)-width/2;E.steer(state,((e.clientX-r.left)-width/2-bend)/riverWidth()+.5);}
 canvas.addEventListener('pointerdown',e=>{if(mode!=='playing'||drag!==null)return;drag=e.pointerId;canvas.setPointerCapture?.(drag);steerPointer(e);canvas.focus();});
 canvas.addEventListener('pointermove',e=>{if(mode==='playing'&&drag===e.pointerId)steerPointer(e);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
 document.addEventListener('keydown',e=>{if(mode==='playing'&&['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();keys.add(e.key);}if(e.key==='Escape'){if(mode==='playing')pause();else if(mode==='rest')resume();}});
 document.addEventListener('keyup',e=>keys.delete(e.key));
 window.addEventListener('blur',()=>pause());document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 window.addEventListener('resize',()=>{drag=null;resize();});window.addEventListener('pagehide',()=>checkpoint());
 window.addEventListener('toenow:languagechange',()=>{syncHUD();if(!$('shop').hidden)shop();});
 window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==window.location.origin)return;const type=e.data?.type;if(type==='PAUSE_GAME')pause();if(type==='RESUME_GAME')resume();if(type==='RESTART_GAME'||type==='GAME_RESTART')start(state.startWave,state.isPractice);});
 $('btn-start').addEventListener('click',()=>start());$('btn-retry').addEventListener('click',()=>start(state.startWave,state.isPractice));$('btn-title').addEventListener('click',title);
 $('continue').addEventListener('click',()=>{const saved=E.restore(storage);if(saved)start(1,false,saved);});
 $('rest').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('finish').addEventListener('click',finishDrift);
 $('wardrobe').addEventListener('click',()=>{visible('shop',$('shop').hidden);shop();});
 function exit(e){e?.preventDefault();checkpoint();sdk.exitToHub();}$('back-hub').addEventListener('click',exit);$('rest-hub').addEventListener('click',exit);
 $('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').textContent=t(soundOn?'Sound on':'Sound off');tone('yuzu');});
 document.querySelector('[data-tutorial-replay]')?.addEventListener('click',()=>{start(1,true);hintUntil=Infinity;});
 sdk.setupPractice((wave,isPractice)=>start(wave,isPractice));
 resize();title();window.requestAnimationFrame(tick);
})();
