(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CapybaraDrift=factory();})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const SESSION='capybara_drift_progress_v1';
 const SHOP={peach:{cost:0,color:'#edaa9a'},flower:{cost:120,color:'#d7b4dd'},citrus:{cost:240,color:'#edca68'},mint:{cost:360,color:'#97c8ac'}};
 const POINTS={bubble:1,yuzu:5,petal:3,friend:10,rock:0};
 const safe=(n,max=1e9)=>Number.isFinite(n)?Math.max(0,Math.min(max,n)):0;
 const clamp=n=>Math.max(.12,Math.min(.88,Number.isFinite(n)?n:.5));
 function create(wave=1,isPractice=false){return {version:1,x:.5,target:.5,elapsed:0,score:0,credited:0,yuzu:0,friends:0,petals:0,wave:Math.max(1,Math.floor(safe(wave,100000))),startWave:Math.max(1,Math.floor(safe(wave,100000))),isPractice:!!isPractice,speed:.105,spawn:0,serial:8,items:[{id:1,type:'bubble',x:.5,y:.59},{id:2,type:'bubble',x:.5,y:.54},{id:3,type:'bubble',x:.5,y:.49},{id:4,type:'yuzu',x:.36,y:.34},{id:5,type:'petal',x:.65,y:.25},{id:6,type:'friend',x:.5,y:.08}],particles:[],trail:[],paused:false};}
 function steer(s,x){s.target=clamp(x);}
 function step(s,dt,random=Math.random){
  if(s.paused)return [];
  dt=Math.min(.05,Math.max(0,Number(dt)||0));s.elapsed+=dt;s.wave=s.startWave+Math.floor(s.elapsed/45);s.x+=(s.target-s.x)*Math.min(1,dt*8);
  s.trail.unshift(s.x);if(s.trail.length>4)s.trail.pop();
  const events=[];s.spawn-=dt;
  if(s.spawn<=0){s.spawn=1.05;const r=random();const type=r<.48?'bubble':r<.7?'yuzu':r<.87?'petal':r<.96?'friend':'rock',x=.15+random()*.7;s.items.push({type,x,y:-.07,id:++s.serial});if(type==='bubble')for(let i=1;i<3;i++)s.items.push({type,x,y:-.07-i*.045,id:++s.serial});}
  for(const item of s.items){
   item.y+=s.speed*dt;
   if(!item.collected&&Math.abs(item.x-s.x)<.085&&Math.abs(item.y-.72)<.065){
    item.collected=true;const points=POINTS[item.type]||0;s.score+=points;
    if(item.type==='yuzu')s.yuzu++;if(item.type==='friend')s.friends++;if(item.type==='petal')s.petals++;
    s.particles.push({x:item.x,y:item.y,life:1.3,text:points?'+'+points:'♡',type:item.type});events.push(item.type);
   }
  }
  s.items=s.items.filter(i=>!i.collected&&i.y<1.15).slice(-30);
  for(const p of s.particles){p.life-=dt;p.y-=dt*.05;}s.particles=s.particles.filter(p=>p.life>0).slice(-40);
  return events;
 }
 function readProfile(storage){
  let raw;try{raw=JSON.parse(storage.getItem(SESSION)||'null');}catch(_){}
  const owned=['peach',...Object.keys(SHOP).filter(k=>k!=='peach'&&Array.isArray(raw?.owned)&&raw.owned.includes(k))];
  return {wallet:Math.floor(safe(raw?.wallet)),total:Math.floor(safe(raw?.total)),owned,equipped:owned.includes(raw?.equipped)?raw.equipped:'peach',session:raw?.session||null};
 }
 function write(storage,profile){try{storage.setItem(SESSION,JSON.stringify(profile));return true;}catch(_){return false;}}
 function checkpoint(storage,s,finish=false){
  if(s.isPractice)return false;
  const p=readProfile(storage),delta=Math.max(0,s.score-s.credited);p.wallet+=delta;p.total+=delta;
  p.session=finish?null:{version:1,x:s.x,target:s.target,elapsed:s.elapsed,score:s.score,credited:s.score,yuzu:s.yuzu,friends:s.friends,petals:s.petals,startWave:s.startWave};
  if(write(storage,p)){s.credited=s.score;return true;}return false;
 }
 function restore(storage){
  const raw=readProfile(storage).session;if(!raw||raw.version!==1)return null;
  for(const k of ['x','target','elapsed','score','credited','yuzu','friends','petals','startWave'])if(!Number.isFinite(raw[k])||raw[k]<0||raw[k]>1e9)return null;
  if(raw.credited!==raw.score||raw.startWave<1)return null;
  const s=create(raw.startWave);for(const k of ['elapsed','score','credited','yuzu','friends','petals'])s[k]=raw[k];s.x=clamp(raw.x);s.target=clamp(raw.target);s.wave=s.startWave+Math.floor(s.elapsed/45);return s;
 }
 function finish(storage,s){return checkpoint(storage,s,true);}
 function buy(storage,id){
  if(!Object.hasOwn(SHOP,id))return false;const p=readProfile(storage);
  if(!p.owned.includes(id)){if(p.wallet<SHOP[id].cost)return false;p.wallet-=SHOP[id].cost;p.owned.push(id);}p.equipped=id;return write(storage,p);
 }
 return {SESSION,SHOP,POINTS,create,steer,step,checkpoint,restore,finish,readProfile,buy};
});
