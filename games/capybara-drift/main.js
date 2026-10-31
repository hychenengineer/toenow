/* River presentation and lifecycle; gameplay and durable progress live in engine.js. */
(function(){
 'use strict';
 const E=window.CapybaraDrift,R=window.CapybaraRiver,ID='capybara-drift',$=id=>document.getElementById(id);
 const canvas=$('river'),ctx=canvas.getContext('2d');
 let storage;try{storage=window.localStorage;}catch(_){}
 const t=text=>window.ToenowI18n?.t(text)||text;
 const lang=()=>window.ToenowI18n?.language||document.documentElement.lang||'en';
 const label=(pool,id)=>E.name(pool,id,lang());
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let pauseReturnMode='playing',pointerStart=null,eddyWasActive=false,swimmerHeading=0;
 let visualTime=0,weatherStage=-1,thunderPlayed=false;
 let floatColor=E.SHOP[E.readProfile(storage).equipped].color;
 let state=E.create(),mode='title',width=800,height=600,last=0,saveClock=0,drag=null,hintUntil=0,noticeUntil=0,soundOn=false,audio=null,keys=new Set();
 const sdk=new window.ToenowGameSDK({gameId:ID,category:'relax',gameTitle:'Capybara Drift',onStart:o=>start(o.wave,o.isPractice),onPause:()=>pause(),onResume:()=>resume(),onRestart:()=>start(state.startWave,state.isPractice)});
 window.ToenowScreens.mount(ID);
 function visible(id,value){$(id).hidden=!value;$(id).classList.toggle('active',value);}
 function updateTitle(){window.ToenowScreens.updateTitle(ID,{bestScore:sdk.loadBestScore(),bestWave:sdk.loadBestWave()});$('continue').hidden=!E.restore(storage);}
 function title(){visible('rest',true);visible('eddy-controls',false);visible('collection-panel',false);mode='title';state.paused=true;visible('title-screen',true);visible('gameover-screen',false);visible('rest-panel',false);visible('play-hud',false);visible('title-extras',true);visible('drift-hint',false);visible('notice',false);updateTitle();}
 function start(wave=1,isPractice=false,restored=null){
  if(mode==='playing'||mode==='rest')checkpoint();
  state=restored||E.begin(storage,isPractice);state.paused=false;mode='playing';last=0;saveClock=0;pauseReturnMode='playing';drag=null;keys.clear();weatherStage=-1;thunderPlayed=state.elapsed>=48;eddyWasActive=!!state.eddy.active;pointerStart=null;swimmerHeading=0;
  sdk.startRun({wave:state.startWave,isPractice:state.isPractice});
  visible('collection-panel',false);visible('title-screen',false);visible('gameover-screen',false);visible('rest-panel',false);visible('title-extras',false);visible('play-hud',true);visible('shop',false);
  visible('rest',true);hintUntil=state.flowTime+8;visible('drift-hint',true);syncHUD();checkpoint();
 }
 function checkpoint(){if(mode==='playing'||mode==='rest'&&pauseReturnMode==='playing'){const saved=E.checkpoint(storage,state);if(!state.isPractice&&saved)sdk.saveBestRecords(state.score,state.wave);return saved;}return false;}
 function pause(){if(!['playing','result','title'].includes(mode))return;pauseReturnMode=mode;if(mode==='playing')checkpoint();state.paused=true;mode='rest';drag=null;keys.clear();$('wallet').textContent=String(E.readProfile(storage).wallet);visible('eddy-controls',false);visible('gameover-screen',false);visible('title-screen',false);visible('title-extras',false);visible('rest-panel',true);$('resume').focus();}
 function resume(){if(mode!=='rest')return;visible('collection-panel',false);mode=pauseReturnMode;state.paused=mode!=='playing';last=0;visible('rest-panel',false);visible('gameover-screen',mode==='result');visible('title-screen',mode==='title');visible('title-extras',mode==='title');if(mode==='title')$('btn-start').focus();else if(mode==='result')$('btn-retry').focus();else canvas.focus();}
 function finishDrift(){
  if(mode==='rest'&&pauseReturnMode!=='playing'){resume();return;}
  if(mode!=='playing'&&mode!=='rest')return;
  visible('eddy-controls',false);E.finish(storage,state);state.paused=true;mode='result';drag=null;keys.clear();
  sdk.handleGameOver({score:state.score,wave:state.wave,isPractice:state.isPractice,duration:Math.max(1000,state.flowTime*1000)});
  window.ToenowScreens.updateGameOver(ID,{score:state.score,bestScore:sdk.loadBestScore(),wave:1,combo:null,reason:'TIME EXPIRED',journey:journeySummary()});
  visible('rest-panel',false);visible('play-hud',false);visible('drift-hint',false);visible('notice',false);visible('gameover-screen',true);$('btn-retry').focus();
 }
 function journeySummary(){
  const material=window.ToenowMaterials?.ITEMS[state.trip.materialId];
  const friends=(state.friends?(state.seenFriends?.length?state.seenFriends:[state.trip.friend]):[]).map(id=>({name:label('friends',id),icon:E.POOLS.friends.find(f=>f.id===id)?.icon||'🐾',count:1}));
  const basics=[...(state.materialCollected&&state.materialRewarded&&material?[{name:t(material.name),icon:material.icon,count:1}]:[]),...(state.yuzu?[{name:t('Yuzu'),icon:'🍊',count:state.yuzu}]:[]),...(state.petals?[{name:t('Petals'),icon:'🌸',count:state.petals}]:[])];
  return {friends,items:basics.concat(Object.entries(state.inventory||{}).map(([id,count])=>{const item=E.POOLS.collectibles.find(i=>i.id===id);return {name:label('collectibles',id),icon:item?.icon||'✿',count,isNew:state.newFinds?.includes(id)};})),friend:state.friends?label('friends',state.trip.friend):'',scene:label('scenes',state.trip.scene),material:state.materialCollected&&state.materialRewarded?(t(window.ToenowMaterials?.ITEMS[state.trip.materialId]?.name||'')+' ×1'):null,collectionCount:Object.keys(E.readProfile(storage).collection||{}).length};
 }
 function syncHUD(){
  $('score').textContent=String(state.yuzu+state.petals+Object.values(state.inventory||{}).reduce((a,b)=>a+b,0));$('friends').textContent=String(state.friends);
  const remaining=Math.max(0,Math.ceil(E.DURATION-state.elapsed));$('trip-clock').textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
  $('scene').textContent=label('scenes',state.trip.scene);
  const eddy=E.eddyInfo(state);visible('eddy-controls',mode==='playing'&&eddy.active);$('trip-clock').classList.toggle('clock-resting',eddy.active);$('trip-clock').setAttribute('aria-label',t(eddy.active?'Time rests here. Stay as long as you like.':'Until we reach shore'));
  if(eddy.active!==eddyWasActive){notice(eddy.active?'Time rests here. Stay as long as you like.':'Back to the winding river');eddyWasActive=eddy.active;}
  if(eddy.available)visible('drift-hint',false);
  const stage=state.elapsed<28?0:state.elapsed<65?1:2;
  if(weatherStage!==stage){if(stage===1)notice(label('weather',state.trip.weather));if(stage===2)notice(label('events',state.trip.event));weatherStage=stage;}
 }
 function collectionBook(){
  const collected=E.readProfile(storage).collection||{},grid=$('collection-grid');grid.replaceChildren();
  $('collection-total').textContent=Object.keys(collected).length+' / '+E.POOLS.collectibles.length;
  for(const item of E.POOLS.collectibles){const cell=document.createElement('div');cell.className='collection-cell'+(collected[item.id]?' found':'');const icon=document.createElement('span');icon.textContent=collected[item.id]?item.icon:'·';const name=document.createElement('small');name.textContent=collected[item.id]?label('collectibles',item.id):'???';const count=document.createElement('b');count.textContent=collected[item.id]?'×'+collected[item.id]:'';cell.append(icon,name,count);grid.append(cell);}
  visible('collection-panel',true);$('collection-close').focus();
 }
 function notice(text){$('notice').textContent=t(text);visible('notice',true);noticeUntil=state.flowTime+3;}
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
   const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type='sine';osc.frequency.setValueAtTime(type==='hit'?120:type==='friend'?660:type==='yuzu'?523:880,now);osc.frequency.exponentialRampToValueAtTime(type==='hit'?65:440,now+.16);gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.22);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+.23);
  }catch(_){}
 }
 function distantThunder(){
  if(!soundOn)return;
  try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();
   const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;osc.type='sine';osc.frequency.setValueAtTime(62,now);osc.frequency.exponentialRampToValueAtTime(31,now+1.8);gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.045,now+.45);gain.gain.exponentialRampToValueAtTime(.001,now+2);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(now+2);
  }catch(_){}
 }
 // Draw the river in its own coordinates; the camera maps downstream to screen-left.
 function resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.height);height=Math.max(1,r.width);const d=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(height*d);canvas.height=Math.round(width*d);ctx.setTransform(0,d,-d,0,height*d,0);}
 const riverWidth=()=>R.width(width);
 function waterX(x,y){return R.project(state,x,y,width);}
 function screenPoint(x,y){return R.screen(state,x,y,height,width);}
 function riverText(text,x,y){ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);ctx.fillText(text,0,0);ctx.restore();}
 function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 function line(points,color,size){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))ctx.lineTo(p[0],p[1]);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.stroke();}
 function yuzu(x,y,r){ellipse(x,y,r,r*.9,'#edbd4b');ellipse(x-r*.25,y-r*.25,r*.2,r*.15,'#ffe295');ctx.save();ctx.translate(x+2,y-r);ctx.rotate(-.4);ellipse(0,0,r*.4,r*.17,'#6e9c6e');ctx.restore();}
 function capy(x,y,size,float,fruit=0,friend=false,heading=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);ctx.scale(size/100,size/100);ctx.rotate(heading+(!friend&&state.hitTime>0?Math.sin(state.hitTime*45)*.12:0)+Math.sin(visualTime*1.5+(friend?2:0))*.035+(!friend&&state.playTime>0&&!reduced?(1-state.playTime/1.3)*Math.PI*2:0));
  ellipse(-2,28,55,13,'#4a91821c');
  ctx.beginPath();ctx.ellipse(0,17,51,23,0,0,Math.PI*2);ctx.strokeStyle='#fff8e4';ctx.lineWidth=16;ctx.stroke();ctx.strokeStyle=float;ctx.lineWidth=11;ctx.stroke();
  ellipse(-8,0,35,23,'#b58c66');ellipse(-26,13,11,7,'#9f7958');ellipse(14,16,12,7,'#a27c57');
  ellipse(20,-15,25,24,'#c49c72');ellipse(34,-7,23,15,'#d0ab7d');ellipse(8,-34,8,10,'#b68d65');ellipse(8,-34,4,6,'#d5af88');
  if(!friend&&state.hitTime>0){line([[19,-22],[27,-15]],'#685443',2.3);line([[27,-22],[19,-15]],'#685443',2.3);ctx.fillStyle='#e8ba60';ctx.font='16px sans-serif';ctx.fillText('✦',-6,-43);ctx.fillText('✧',39,-35);}else line([[18,-18],[23,-20],[28,-18]],'#685443',2.3);ellipse(49,-10,2,2.5,'#775d47');line([[34,2],[40,4],[46,2]],'#8b6d51',1.5);ellipse(24,-4,6,3,'#dfad9180');
  if(fruit)yuzu(16,-46,10);ctx.restore();
 }
 function plant(x,y,r,color,flower=false){
  line([[x,y+r],[x,y-r*.4]],'#91ab7a',2);ellipse(x-r*.35,y,r*.7,r*.28,color);ellipse(x+r*.35,y-r*.35,r*.7,r*.28,color);
  if(flower){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(x+Math.cos(a)*r*.32,y-r*.7+Math.sin(a)*r*.32,r*.28,r*.28,'#f5cfcb');}ellipse(x,y-r*.7,r*.14,r*.14,'#e3be6c');}
 }
 // The river changes continuously, without flashes or changes in difficulty.
 function riverLighting(env){
  const colors=[['#bccfc2','#a7cfca','#7cacb3'],['#dce7c8','#bfe0d2','#8fc5bd'],['#dfe6c4','#b8dcd3','#81bdb8'],['#e5cfbd','#c4cfc4','#a6b9bd'],['#96a9b2','#99bcc6','#6f9aaa'],['#657e8c','#7ea7b5','#54869a']];
  let base=E.POOLS.times.findIndex(x=>x.id===env.time.id);base=Math.max(0,base);
  const shift=env.time.id==='night'?0:Math.min(1.8,state.elapsed/65),from=Math.min(5,base+Math.floor(shift)),to=Math.min(5,from+1),f=shift%1;
  const mix=(a,b,k)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-k)+parseInt(b.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
  const wet=['rain','sunshower','storm','rainbow'].includes(env.weather.id)?Math.min(1,Math.max(0,(state.elapsed-22)/12),Math.max(0,(78-state.elapsed)/12)):0;
  const palette=colors[from].map((c,i)=>mix(c,colors[to][i],f));
  if(env.weather.id==='storm')for(let i=0;i<3;i++)palette[i]=mix(palette[i],['#8fa9a3','#9ebfbd','#789ba8'][i],wet*.55);
  return {colors:palette,night:from>=4,scene:['lotus','meadow','garden'].includes(env.scene.id)?1:0,wet,light:from+f};
 }
 function drawFriend(x,y,size,friend){
  const id=friend.id;if(id==='capybara'||id==='otter'||id==='beaver'){capy(x,y,size,id==='otter'?'#d1be9e':'#baccc6',0,true);return;}
  ctx.save();ctx.translate(x,y+Math.sin(visualTime*1.3)*2);ctx.rotate(-Math.PI/2);ctx.scale(size/40,size/40);
  ellipse(0,12,24,7,'#ffffff3d');
  if(['duck','duckling','heron','kingfisher'].includes(id)){
   const white=id==='heron',c=id==='kingfisher'?'#7eafb7':white?'#f3f0dc':'#e9ce86';
   ellipse(0,3,17,10,c);ellipse(7,-8,9,10,c);ellipse(18,-7,6,3,'#dba775');ellipse(9,-10,1.4,1.6,'#586155');ellipse(-4,2,8,5,white?'#d9ddd0':'#d8b976');
   if(id==='duckling'){ellipse(-20,11,7,5,'#ebd59a');ellipse(-17,6,4,4,'#ebd59a');}
  }else if(id==='turtle'||id==='frog'){
   ellipse(-12,9,6,4,'#8eaa82');ellipse(12,9,6,4,'#8eaa82');ellipse(0,1,16,13,'#97ad83');ellipse(0,-13,9,7,'#b5c49a');ellipse(-3,-14,1,1,'#596c53');ellipse(3,-14,1,1,'#596c53');
   if(id==='turtle'){line([[-10,0],[0,-5],[10,0],[0,8],[-10,0]],'#7f9975',1.3);}else{ellipse(-6,-18,4,4,'#b5c49a');ellipse(6,-18,4,4,'#b5c49a');}
  }else if(id==='snail'){
   ellipse(0,12,25,9,'#a9c3a0');ellipse(0,0,12,12,'#cfb58c');ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*3.5);ctx.strokeStyle='#a58e71';ctx.lineWidth=2;ctx.stroke();ellipse(14,5,7,5,'#c6cba1');
  }else{
   const flutter=Math.sin(visualTime*3)*.25+.75;ellipse(-9,0,10*flutter,14,'#e0c6d2');ellipse(9,0,10*flutter,14,'#e8d7a4');ellipse(0,0,3,9,id==='firefly'?'#fff2b0':'#8d9c89');
  }
  ctx.restore();
 }
 function drawTreasure(item,x,y){
  const d=item.type==='material'?window.ToenowMaterials?.ITEMS[item.materialId]:E.POOLS.collectibles.find(c=>c.id===item.collectibleId);
  ellipse(x,y+13,24,8,'#ffffff55');ellipse(x,y,23,23,item.type==='material'?'#ffedc6cc':'#fff8e6a8');
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='25px "Segoe UI Emoji",sans-serif';riverText(d?.icon||'🍃',x,y);ctx.textBaseline='alphabetic';
  if(item.type==='material'){ctx.fillStyle='#536b59';ctx.font='10px "Segoe UI",sans-serif';riverText(t('Building gift'),x+35,y);}
 }
 function drawScenery(env,lighting,flow){
  const id=env.scene.id;
  for(let i=0;i<9;i++){
   const y=((i*151+flow*.8)%(height+250))-125,side=i%2?-1:1,x=waterX(side<0?0:1,y/height)+side*55;
   if(id==='bamboo'){for(let j=0;j<3;j++){line([[x+j*10,y+40],[x+j*10-3,y-75]],'#6f957778',6);for(let k=0;k<3;k++)line([[x+j*10,y-k*23],[x+j*10+13,y-k*23-8]],'#92af8680',3);}}
   else if(['forest','willow','maple'].includes(id)){line([[x,y+35],[x,y-22]],'#a2957866',8);for(let j=0;j<4;j++)ellipse(x+Math.sin(j*2)*21,y-22+j*9,30,21,id==='maple'?'#cfa88c88':lighting.night?'#6c928488':'#98b79188');if(id==='willow')for(let j=0;j<5;j++)line([[x-25+j*12,y],[x-27+j*12,y+42]],'#91ac8388',2);}
   else if(id==='meadow'||id==='garden'){for(let j=0;j<4;j++)plant(x+j*9,y+Math.sin(j)*15,12,'#a1b48b',true);}
   else if(id==='estuary'){ellipse(x,y,28,14,'#eee1c488');for(let j=0;j<3;j++)ellipse(x+j*8,y+j*10,6,4,'#f9e8d5');}
   else if(id==='spring'){for(let j=0;j<3;j++){ctx.globalAlpha=.1;ellipse(x+Math.sin(visualTime+j)*8,y-j*22,25+j*8,8,'#fff9e9');ctx.globalAlpha=1;}}
  }
  if(id==='bridge'){const y=((flow*.6)%(height+600))-150;const x=waterX(.5,y/height);line([[x-riverWidth()*.65,y],[x+riverWidth()*.65,y]],'#c4b296',22);line([[x-riverWidth()*.65,y-12],[x+riverWidth()*.65,y-12]],'#e4d5b4',3);}
  if(id==='lotus')for(let i=0;i<7;i++){const y=(i*133+flow*.5)%(height+80)-40,x=waterX(i%2?.88:.12,y/height);ellipse(x,y,27,12,'#8cb49b88');plant(x,y-7,14,'#94b59b',true);}
 }
 function drawWeather(env,lighting,flow){
  const w=env.weather.id,wet=lighting.wet,time=visualTime;
  if(wet>0){ctx.globalAlpha=wet*.5;for(let i=0;i<(reduced?12:42);i++){const x=(i*71+time*150)%width,y=(i*137)%height;line([[x,y],[x+9,y+2]],'#f2faf2',1);if(i%5===0){ctx.beginPath();ctx.ellipse(x,y+16,9,3,0,0,Math.PI*2);ctx.strokeStyle='#ffffff77';ctx.stroke();}}ctx.globalAlpha=1;}
  if(w==='mist'||env.time.id==='dawn'){for(let i=0;i<4;i++){const y=(i*height/4+time*4)%height;const fog=ctx.createRadialGradient(width*.5,y,1,width*.5,y,width*.75);fog.addColorStop(0,'#f5f2e32a');fog.addColorStop(1,'#f5f2e300');ctx.fillStyle=fog;ctx.fillRect(0,0,width,height);}}
  if(w==='storm'&&wet>0&&!reduced){const a=Math.max(0,1-Math.abs(state.elapsed-48)/1.8)*.07;ctx.fillStyle='rgba(255,246,219,'+a+')';ctx.fillRect(0,0,width,height);}
  const event=env.event.id,active=state.elapsed>62;
  if((w==='rainbow'&&state.elapsed>64)||(event==='rainbow'&&active)){ctx.save();ctx.globalAlpha=Math.min(.22,(state.elapsed-62)/30);const x=width*.5,y=height*.25;['#dba6a0','#e0c49c','#c3d1a4','#a9c7c6'].forEach((c,i)=>{ctx.beginPath();ctx.arc(x,y,width*.42-i*7,Math.PI,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=6;ctx.stroke();});ctx.restore();}
  if(!active)return;
  if(['petal-rain','leaves','wish','birds'].includes(event))for(let i=0;i<16;i++){const x=(i*97+Math.sin(time*.4+i)*25+width)%width,y=(i*61+time*13)%height;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time+i));ellipse(0,0,5,2,event==='leaves'?'#d4b38b88':event==='birds'?'#f7edd099':'#efc6d699');ctx.restore();}
  if(event==='fish')for(let i=0;i<8;i++){const y=height*.42+Math.sin(time*.5+i)*23,x=waterX((time*.025+i*.13)%1,y/height);ellipse(x,y,11,4,'#648f8f55');line([[x-10,y],[x-15,y-4],[x-15,y+4],[x-10,y]],'#648f8f44',2);}
  if(['bubbles','ripples'].includes(event))for(let i=0;i<8;i++){const y=(i*101+time*16)%height,x=waterX(.12+(i*.127)%.76,y/height);ctx.beginPath();ctx.ellipse(x,y,12+Math.sin(time+i)*4,6,0,0,Math.PI*2);ctx.strokeStyle='#fff9de66';ctx.lineWidth=1;ctx.stroke();}
  if(event==='lotus')for(let i=0;i<9;i++){const y=(i*107+time*9)%height,x=waterX(.12+(i*.117)%.76,y/height);ellipse(x,y,23,11,'#91b49b88');plant(x,y-9,16,'#a0bb9a',true);}
  if(event==='riding'){const y=height*.72+44,x=waterX(state.x+.16,.72);drawFriend(x,y,34,env.friend);}
  if(event==='gift'){const x=waterX(.72,.36),y=height*.36;drawFriend(x+23,y+10,34,env.friend);ellipse(x-12,y+7,16,8,'#a6bda1');ctx.fillStyle='#e7c9a3';ctx.fillRect(x-22,y-16,23,20);line([[x-10,y-16],[x-10,y+4]],'#f7e6c6',3);line([[x-22,y-7],[x+1,y-7]],'#f7e6c6',3);}
  if(event==='fireflies')for(let i=0;i<18;i++)ellipse((i*103+Math.sin(time+i)*13)%width,(i*79)%height,2,2,'#f4e4ab99');
 }
 function drawEddy(water){
  const e=E.eddyInfo(state);if(!e.available)return;
  const cx=waterX(e.x,e.y),cy=e.y*height;
  const path=(rx,ry)=>{ctx.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,y=e.y+Math.sin(a)*ry,x=waterX(e.x+Math.cos(a)*rx,y);if(i===0)ctx.moveTo(x,y*height);else ctx.lineTo(x,y*height);}ctx.closePath();};
  path(e.rx*1.18,e.ry*1.18);ctx.fillStyle='#edf0de40';ctx.fill();
  path(e.rx,e.ry);ctx.fillStyle=water;ctx.fill();ctx.strokeStyle='#fff8dd99';ctx.lineWidth=2;ctx.stroke();
  // Leaves travel around the same pocket as the swimmer and pickups.
  for(let i=0;i<10;i++){const a=i*Math.PI/5+visualTime*.23,y=e.y+Math.sin(a)*e.ry*.96,x=waterX(e.x+Math.cos(a)*e.rx*.96,y);ctx.save();ctx.translate(x,y*height);ctx.rotate(a);ellipse(0,0,5,2.4,i%3?'#b3c4a5':'#efd3c7');ctx.restore();}
  for(let k=0;k<1;k++){ctx.beginPath();for(let i=0;i<75;i++){const a=i/74*Math.PI*3+visualTime*.28+k*2.1,r=.025+i/74*e.rx*.7,y=e.y+Math.sin(a)*r*.6875,x=waterX(e.x+Math.cos(a)*r,y);if(!i)ctx.moveTo(x,y*height);else ctx.lineTo(x,y*height);}ctx.strokeStyle='#fff8e36b';ctx.lineWidth=1.4;ctx.stroke();}
  ctx.textAlign='center';ctx.font='11px "Segoe UI",sans-serif';ctx.fillStyle='#456b62';
  const textX=Math.max(100,Math.min(width-100,cx)),textY=(e.y-e.ry)*height-17;
  riverText(t(e.active?'A little time to float':'A quiet little eddy'),cx-e.rx*riverWidth()-24,cy);
  if(!e.active){ctx.font='10px "Segoe UI",sans-serif';riverText(t('Slide into the circles to linger'),cx-e.rx*riverWidth()-9,cy);}
  else{const ex=waterX(e.exitX,e.exitY),ey=e.exitY*height;for(let i=1;i<7;i++){const f=i/7;ellipse(cx+(ex-cx)*f,cy+(ey-cy)*f,1.5,1.5,'#fff8dfaa');}ctx.beginPath();ctx.arc(ex,ey,13,0,Math.PI*2);ctx.strokeStyle='#fff9e2aa';ctx.stroke();line([[ex-4,ey+3],[ex,ey-3],[ex+4,ey+3]],'#5c887c',1.5);}
 }
 function drawSplash(x,y,size){
  const progress=1-state.playTime/1.3;for(let i=0;i<9;i++){const a=i/9*Math.PI*2,r=size*(.3+progress*.7);ctx.globalAlpha=1-progress;ellipse(x+Math.cos(a)*r,y+Math.sin(a)*r*.55-12,2.5,4,'#fff9df');ctx.globalAlpha=1;}
 }
 function render(){
  const env=E.environment(state),lighting=riverLighting(env);const scene=lighting.scene,night=lighting.night;

  const [grass,water,deep]=lighting.colors,rw=riverWidth(),flow=state.elapsed*height*.045,waterFlow=visualTime*height*.045;
  ctx.fillStyle=grass;ctx.fillRect(0,0,width,height);
  // Winding banks: the playable channel remains broad in all scenes.
  for(const [extra,color] of [[60,night?'#9e9d89':'#f5e8c7'],[20,night?'#829b9a':'#dbe9d9'],[0,water]]){
   ctx.beginPath();for(let i=0;i<=30;i++){const y=i/30*height,x=waterX(0,i/30)-extra;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}for(let i=30;i>=0;i--){const y=i/30*height;ctx.lineTo(waterX(1,i/30)+extra,y);}ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,'#fff5db25');g.addColorStop(.55,'#ffffff00');g.addColorStop(1,deep+'25');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  for(let i=0;i<40;i++){
   const y=((i*73+waterFlow*.6)%(height+60))-30,x=waterX(.1+((i*37)%80)/100,y/height);
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
  drawScenery(env,lighting,flow);drawEddy(water);
  for(const item of state.items){const x=waterX(item.x,item.y),y=item.y*height;
   if(item.type==='bubble'){ellipse(x,y,13,13,'#ffffff31');ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.strokeStyle='#fffdf0c9';ctx.lineWidth=2;ctx.stroke();ellipse(x-4,y-5,4,2,'#fff');}
   if(item.type==='yuzu')yuzu(x,y,13);
   if(item.type==='petal'){ctx.save();ctx.translate(x,y);ctx.rotate(state.elapsed*.5);for(let n=0;n<5;n++){const a=n*Math.PI*2/5;ellipse(Math.cos(a)*9,Math.sin(a)*9,7,5,'#edbcc7');}ellipse(0,0,4,4,'#fff3b3');ctx.restore();}
   if(item.type==='friend')drawFriend(x,y,38,env.friend);
   if(item.type==='collectible'||item.type==='material')drawTreasure(item,x,y);
   if(item.type==='log'){ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2);ellipse(0,8,29,10,'#527a6b22');line([[-23,0],[23,0]],'#ab8964',17);line([[-18,-3],[18,-3]],'#c2a17c',3);ellipse(23,0,5,8,'#d6b58c');ellipse(23,0,2,4,'#ab8964');ctx.restore();}
   if(item.type==='rock'){ellipse(x,y+7,22,10,'#59998930');ellipse(x,y,19,13,night?'#9baeb4':'#bcc8b8');ellipse(x-4,y-4,10,5,'#e1e2cf');}
  }
  const float=floatColor,size=Math.max(58,Math.min(104,rw*.24)),pos=E.position(state);
  for(let i=Math.min(state.friends,4);i>0;i--){const y=(pos.y+.035)*height+i*size*.39,x=waterX(pos.x+Math.sin(visualTime*1.2-i)*.035,y/height);drawFriend(x,y,size*.53,env.friend);}
  const px=waterX(pos.x,pos.y),py=pos.y*height+Math.sin(visualTime*1.6)*3;
  let heading=R.heading(state,pos.y,width,height)*.45;
  if(state.eddy.active){const e=E.eddyInfo(state),a=state.eddy.angle+.01,ny=e.y+Math.sin(a)*state.eddy.radius*.6875,nx=waterX(e.x+Math.cos(a)*state.eddy.radius,ny);heading=Math.atan2(ny*height-pos.y*height,nx-px)+Math.PI/2;}
  if(mode==='playing')swimmerHeading+=Math.atan2(Math.sin(heading-swimmerHeading),Math.cos(heading-swimmerHeading))*.1;
  capy(px,py,size,float,state.yuzu,false,swimmerHeading);if(state.playTime>0)drawSplash(px,py,size);drawWeather(env,lighting,flow);
  for(const p of state.particles){ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle='#fffbea';ctx.font='bold 22px ui-rounded,sans-serif';ctx.textAlign='center';riverText(p.type==='hit'?'✦':p.type==='friend'?'♡':p.type==='collectible'?'✧':p.type==='material'?'⌂':'·',waterX(p.x,p.y)-25,p.y*height);ctx.globalAlpha=1;}

  if(night){for(let i=0;i<25;i++){const x=(i*173)%width,y=(i*97)%height;ellipse(x+Math.sin(state.elapsed+i)*8,y,1.5,1.5,'#ffe5a9'+(Math.sin(state.elapsed+i)>.1?'bb':'44'));}}
 }
 function tick(now){
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(mode==='playing'||mode==='title')visualTime+=dt;
  if(mode==='playing'){
   if(keys.has('ArrowUp')||keys.has('w'))E.steer(state,state.target-dt*.5);if(keys.has('ArrowDown')||keys.has('s'))E.steer(state,state.target+dt*.5);
   const events=E.step(state,dt);if(events.length){tone(events[0]);checkpoint();if(events.includes('friend'))notice(label('friends',state.trip.friend));if(events.includes('collectible'))notice(label('collectibles',state.trip.collectible));if(events.includes('material'))notice('A gift for the island homes!');}
   saveClock+=dt;if(saveClock>=2){checkpoint();saveClock=0;}
   if(state.flowTime>=hintUntil)visible('drift-hint',false);if(state.flowTime>=noticeUntil)visible('notice',false);
   if(!thunderPlayed&&state.trip.weather==='storm'&&state.elapsed>=48){thunderPlayed=true;distantThunder();}
   syncHUD();if(state.completed||state.elapsed>=E.DURATION)finishDrift();
  }
  render();window.requestAnimationFrame(tick);
 }
 function steerPointer(e){const r=canvas.getBoundingClientRect(),p=R.input(state,e.clientX-r.left,e.clientY-r.top,height,width);E.steer(state,p.x,Math.max(.15,Math.min(.88,p.y)));}
 function playful(){if(mode!=='playing')return;E.play(state);tone('yuzu');checkpoint();}
 canvas.addEventListener('pointerdown',e=>{if(mode!=='playing'||drag!==null)return;drag=e.pointerId;canvas.setPointerCapture?.(drag);const r=canvas.getBoundingClientRect(),p=E.position(state),screen=screenPoint(p.x,p.y),near=Math.hypot(e.clientX-r.left-screen.x,e.clientY-r.top-screen.y)<Math.max(35,riverWidth()*.12);pointerStart={x:e.clientX,y:e.clientY,near,moved:false};if(!near)steerPointer(e);canvas.focus();});
 canvas.addEventListener('pointermove',e=>{if(mode!=='playing'||drag!==e.pointerId)return;if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>8)pointerStart.moved=true;if(!pointerStart?.near||pointerStart.moved)steerPointer(e);});
 canvas.addEventListener('pointerup',e=>{if(drag===e.pointerId&&pointerStart?.near&&!pointerStart.moved)playful();drag=null;pointerStart=null;});
 for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;pointerStart=null;});
 document.addEventListener('keydown',e=>{if(mode==='playing'&&['ArrowUp','ArrowDown','w','s'].includes(e.key)){e.preventDefault();keys.add(e.key);}if(mode==='playing'&&e.key==='ArrowRight'){e.preventDefault();E.leaveEddy(state);}if(mode==='playing'&&e.code==='Space'&&e.target===canvas){e.preventDefault();playful();}if(e.key==='Escape'){if(!$('collection-panel').hidden){visible('collection-panel',false);$('collection-open').focus();}else if(['playing','result','title'].includes(mode))pause();else if(mode==='rest')resume();}});
 document.addEventListener('keyup',e=>keys.delete(e.key));
 window.addEventListener('blur',()=>{if(mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
 window.addEventListener('resize',()=>{drag=null;resize();});window.addEventListener('pagehide',()=>checkpoint());
 window.addEventListener('toenow:languagechange',()=>{syncHUD();if(mode==='result')window.ToenowScreens.updateGameOver(ID,{score:state.score,bestScore:0,wave:1,combo:null,reason:'TIME EXPIRED',journey:journeySummary()});if(!$('collection-panel').hidden)collectionBook();if(!$('shop').hidden)shop();});
 window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==window.location.origin)return;const type=e.data?.type;if(type==='PAUSE_GAME')pause();if(type==='RESUME_GAME')resume();if(type==='RESTART_GAME'||type==='GAME_RESTART')start(state.startWave,state.isPractice);});
 $('btn-start').addEventListener('click',()=>start());$('btn-retry').addEventListener('click',()=>start(state.startWave,state.isPractice));$('btn-title').addEventListener('click',title);
 $('continue').addEventListener('click',()=>{const saved=E.restore(storage);if(saved)start(1,false,saved);});
 $('eddy-play').addEventListener('click',playful);$('eddy-leave').addEventListener('click',()=>{E.leaveEddy(state);syncHUD();checkpoint();canvas.focus();});
 $('rest').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('finish').addEventListener('click',finishDrift);
 $('wardrobe').addEventListener('click',()=>{visible('shop',$('shop').hidden);shop();});
 function exit(e){e?.preventDefault();checkpoint();sdk.exitToHub();}$('back-hub').addEventListener('click',exit);$('rest-hub').addEventListener('click',exit);
 $('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').textContent=t(soundOn?'Sound on':'Sound off');tone('yuzu');});
 document.querySelector('[data-tutorial-replay]')?.addEventListener('click',()=>{start(1,true);hintUntil=Infinity;});
 $('btn-journey-practice')?.addEventListener('click',()=>start(1,true));
 $('collection-open').addEventListener('click',collectionBook);$('collection-close').addEventListener('click',()=>{visible('collection-panel',false);$('collection-open').focus();});
 resize();title();window.requestAnimationFrame(tick);
})();
