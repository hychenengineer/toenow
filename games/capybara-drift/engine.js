(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('../../shared/toenow-materials.js'));else root.CapybaraDrift=factory(root.ToenowMaterials);})(typeof window!=='undefined'?window:globalThis,function(materials){
 'use strict';
 const SESSION='capybara_drift_progress_v1',DURATION=90;
 const SHOP={peach:{cost:0,color:'#edaa9a'},flower:{cost:120,color:'#d7b4dd'},citrus:{cost:240,color:'#edca68'},mint:{cost:360,color:'#97c8ac'}};
 const POINTS={bubble:1,yuzu:5,petal:3,friend:10,collectible:5,material:0,rock:0,log:0};
 const entries=rows=>rows.map(([id,name,zh])=>({id,name,zh}));
 const POOLS={
 scenes:entries([['lotus','Lotus pond','荷花池'],['bamboo','Bamboo creek','竹林溪流'],['meadow','Flower meadow','花田'],['bridge','Little bridge','小橋流水'],['forest','Forest stream','森林溪流'],['spring','Warm springs','溫泉'],['estuary','Seaside river','海邊河口'],['willow','Willow bank','柳樹河岸'],['maple','Maple bend','楓葉河灣'],['garden','Floating garden','水上花園']]),
 times:entries([['dawn','Misty dawn','薄霧清晨'],['morning','Morning light','晨光'],['afternoon','Lazy afternoon','悠閒午後'],['sunset','Golden sunset','金色夕陽'],['twilight','Blue twilight','藍色暮光'],['night','Moonlit night','月光夜晚']]),
 weather:entries([['breeze','Gentle breeze','微風'],['clear','Clear skies','晴天'],['cloud','Soft clouds','薄雲'],['rain','Gentle rain','細雨'],['sunshower','Sun shower','太陽雨'],['mist','Drifting mist','輕霧'],['storm','Passing thunder','短暫雷雨'],['rainbow','Rain then rainbow','雨後彩虹']]),
 friends:entries([['duck','Little duck','小鴨'],['otter','River otter','水獺'],['turtle','Sleepy turtle','瞌睡烏龜'],['frog','Leaf frog','荷葉青蛙'],['heron','White heron','白鷺'],['capybara','Capybara friend','水豚朋友'],['duckling','Duckling family','小鴨一家'],['kingfisher','Kingfisher','翠鳥'],['snail','Leaf snail','葉子蝸牛'],['beaver','Helpful beaver','熱心海狸'],['butterfly','Butterfly','蝴蝶'],['firefly','Little firefly','小螢火蟲']]),
 collectibles:entries([['leaf-hat','Leaf hat','葉子帽'],['flower-crown','Flower crown','花圈'],['shell','Pearl shell','珍珠貝殼'],['bottle','Message bottle','漂流瓶'],['smooth-stone','Smooth stone','光滑石頭'],['leaf-umbrella','Leaf umbrella','葉子傘'],['lotus-seed','Lotus seed','蓮子'],['pink-petal','Pink petal','粉紅花瓣'],['acorn','Tiny acorn','小橡果'],['pinecone','Pine cone','松果'],['ribbon','Floating ribbon','漂浮緞帶'],['clover','Lucky clover','幸運草'],['feather','Soft feather','柔軟羽毛'],['maple-leaf','Maple leaf','楓葉'],['star-stone','Star stone','星星石'],['glass-bead','Sea glass bead','海玻璃珠'],['tiny-bell','Tiny bell','小鈴鐺'],['water-lily','Water lily','睡蓮'],['orange','Sweet orange','甜橘子'],['postcard','River postcard','河流明信片'],['seed-pod','Seed boat','種子小船'],['rain-drop','Raindrop charm','雨滴吊飾'],['moon-shell','Moon shell','月亮貝殼'],['reed-flute','Little reed flute','小蘆笛']]),
 events:entries([['petal-rain','Petal shower','花瓣雨'],['fish','Passing fish','魚群經過'],['leaves','Dancing leaves','落葉旋舞'],['gift','A little gift','朋友的小禮物'],['fireflies','Firefly lights','螢火蟲微光'],['rainbow','A little rainbow','小彩虹'],['bubbles','Bubble garden','泡泡花園'],['riding','A floating companion','結伴漂流'],['ripples','Circles on the river','河面的圈圈'],['lotus','Lotus blossoms','荷花綻放'],['wish','A floating wish','漂流心願'],['birds','Birdsong break','鳥鳴時光']])};
 const icons={duck:'🦆',otter:'🦦',turtle:'🐢',frog:'🐸',heron:'🪶',capybara:'🦫',duckling:'🐥',kingfisher:'🐦',snail:'🐌',beaver:'🦫',butterfly:'🦋',firefly:'✨','leaf-hat':'🍃','flower-crown':'🌸',shell:'🐚',bottle:'🍾','smooth-stone':'🪨','leaf-umbrella':'☂️','lotus-seed':'🌱','pink-petal':'🌸',acorn:'🌰',pinecone:'🌲',ribbon:'🎀',clover:'🍀',feather:'🪶','maple-leaf':'🍁','star-stone':'⭐','glass-bead':'🔮','tiny-bell':'🔔','water-lily':'🪷',orange:'🍊',postcard:'💌','seed-pod':'🌱','rain-drop':'💧','moon-shell':'🌙','reed-flute':'🎵'};
 for(const [key,pool]of Object.entries(POOLS))for(const d of pool)d.icon=icons[d.id]||({scenes:'🌿',times:'☀️',weather:'🌦️',events:'✨'}[key]||'🌿');
 const safe=(n,max=1e9)=>Number.isFinite(n)?Math.max(0,Math.min(max,n)):0;
 const clamp=n=>Math.max(.12,Math.min(.88,Number.isFinite(n)?n:.5));
 const has=(pool,id)=>POOLS[pool].some(x=>x.id===id);
 const pick=(xs,r)=>xs[Math.min(xs.length-1,Math.floor(safe(r(),.999999)*xs.length))];
 function signature(t){return [t.scene,t.time,t.weather,t.friend,t.collectible,t.event].join('|');}
 function itinerary(history=[],random=Math.random){let t;for(let i=0;i<30;i++){t={id:'trip-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)};for(const [k,p]of Object.entries(POOLS))t[{scenes:'scene',times:'time',friends:'friend',collectibles:'collectible',events:'event'}[k]||k]=pick(p,random).id;
 if(t.event==='fireflies'||t.friend==='firefly')t.time='night';if(t.collectible==='leaf-umbrella'||t.collectible==='rain-drop')t.weather=pick(['rain','sunshower','storm'],random);if(t.event==='rainbow')t.weather='rainbow';
 const materialKeys=Object.keys(materials?.ITEMS||{});t.materialId=random()<.65&&materialKeys.length?pick(materialKeys,random):null;if(!history.includes(signature(t)))break;}return t;}
 function create(wave=1,isPractice=false){return {version:2,x:.5,y:.72,target:.5,targetY:.72,flowTime:0,hitTime:0,hitCount:0,hitSide:1,obstacleClock:6,obstacleCount:0,playTime:0,playCount:0,eddy:{active:false,angle:0,radius:.13,intent:false},elapsed:0,score:0,credited:0,yuzu:0,friends:0,petals:0,wave:1,startWave:1,isPractice:!!isPractice,speed:.105,spawn:1,serial:8,items:[{id:1,type:'bubble',x:.5,y:.59},{id:2,type:'bubble',x:.5,y:.54},{id:3,type:'bubble',x:.5,y:.49},{id:4,type:'yuzu',x:.36,y:.34},{id:5,type:'petal',x:.65,y:.25}],particles:[],trail:[],paused:false,completed:false,trip:itinerary(),inventory:{},newFinds:[],seenFriends:[],materialCollected:false,featured:{},knownInventory:{}};}
 function begin(storage,isPractice=false){const p=readProfile(storage),s=create(1,isPractice);s.trip=itinerary(p.history);s.knownInventory={...p.inventory};if(!isPractice){p.history=[...p.history,signature(s.trip)].slice(-8);p.session=serializable(s);write(storage,p);}return s;}
 function eddyInfo(s){let hash=0;for(const c of s.trip.id)hash=(hash*31+c.charCodeAt(0))|0;const x=(hash&1)? .25:.75;return {available:!s.completed&&(s.eddy?.active||(s.elapsed>=20&&s.elapsed<=45)),active:!!s.eddy?.active,x,y:.66,rx:.16,ry:.11,exitX:.5,exitY:.56};}
 function position(s){return {x:s.x,y:s.y??.72,heading:s.eddy?.active?Math.atan2(.6875*Math.cos(s.eddy.angle),-Math.sin(s.eddy.angle)):0};}
 function leaveEddy(s){if(!s.eddy?.active)return false;s.eddy.active=false;s.eddy.intent=false;s.target=.5;s.targetY=.72;return true;}
 function play(s){if(s.paused||s.completed)return false;s.playTime=1.3;s.playCount=(s.playCount||0)+1;return true;}
 function steer(s,x,y){s.target=clamp(x);const e=eddyInfo(s);if(!Number.isFinite(y))return;const cy=Math.max(.15,Math.min(.88,y));
  if(e.active){if(Math.abs(x-e.exitX)<.15&&cy<.62){leaveEddy(s);return;}const dx=(x-e.x)/e.rx,dy=(cy-e.y)/e.ry;if(dx*dx+dy*dy<1.5)s.eddy.radius=Math.max(.055,Math.min(.13,Math.hypot(x-e.x,(cy-e.y)/.6875)));return;}
  s.eddy.intent=e.available&&Math.hypot((x-e.x)/e.rx,(cy-e.y)/e.ry)<.9;s.targetY=s.eddy.intent?cy:.72;
 }
 function step(s,dt,random=Math.random){
  if(s.paused||s.completed)return [];
  dt=Math.min(.05,Math.max(0,Number(dt)||0),s.eddy.active ? .05 : DURATION-s.elapsed);s.flowTime+=dt;if(!s.eddy.active)s.elapsed=Math.min(DURATION,s.elapsed+dt);if(s.elapsed>DURATION-1e-8)s.elapsed=DURATION;s.wave=1;s.hitTime=Math.max(0,(s.hitTime||0)-dt);s.playTime=Math.max(0,s.playTime-dt);
  const eddy=eddyInfo(s);if(s.eddy.active){s.eddy.angle=(s.eddy.angle+dt*.65)%(Math.PI*2);s.x=eddy.x+Math.cos(s.eddy.angle)*s.eddy.radius;s.y=eddy.y+Math.sin(s.eddy.angle)*s.eddy.radius*.6875;}
  else{s.x+=(s.target-s.x)*Math.min(1,dt*8);s.y+=(s.targetY-s.y)*Math.min(1,dt*5);if(s.eddy.intent&&eddy.available&&Math.hypot((s.x-eddy.x)/eddy.rx,(s.y-eddy.y)/eddy.ry)<.85){s.eddy.active=true;s.eddy.intent=false;s.eddy.angle=Math.atan2((s.y-eddy.y)/.6875,s.x-eddy.x);s.eddy.radius=Math.max(.055,Math.min(.13,Math.hypot(s.x-eddy.x,(s.y-eddy.y)/.6875)));}}
  s.trail.unshift(s.x);if(s.trail.length>4)s.trail.pop();
  const events=[];s.spawn-=dt;
  // A separate clock prevents random pickup rolls from clustering obstacles.
  s.obstacleClock-=dt;if(s.obstacleClock<=1e-8){s.obstacleClock+=7;s.obstacleCount++;const type=s.obstacleCount%2?'rock':'log',x=.2+((s.obstacleCount-1)%3)*.3;s.items.push({id:++s.serial,type,x,y:-.07});}
  if(s.spawn<=0){s.spawn=1.05;const r=random(),type=r<.55?'bubble':r<.8?'yuzu':'petal',x=.15+random()*.7;s.items.push({type,x,y:-.07,id:++s.serial});if(type==='bubble')for(let i=1;i<3;i++)s.items.push({type,x,y:-.07-i*.045,id:++s.serial});}
  // Featured encounters enter close enough to meet during this short trip.
  for(const [key,at,type]of [['friend',15,'friend'],['collectible',35,'collectible'],['material',55,'material']])if(s.elapsed>=at&&!s.featured[key]){s.featured[key]=true;if(type!=='material'||s.trip.materialId)s.items.push({id:++s.serial,type,x:.3+random()*.4,y:.12,friendId:s.trip.friend,collectibleId:s.trip.collectible,materialId:s.trip.materialId});events.push('encounter:'+key);}
  if(s.elapsed>=65&&s.trip.event==='gift'&&!s.featured.event){s.featured.event=true;s.items.push({id:++s.serial,type:'collectible',eventGift:true,collectibleId:s.trip.collectible,x:.3+random()*.4,y:.12});events.push('encounter:gift');}
  for(const item of s.items){
   if(s.eddy.active&&!item.eddyPassed&&item.y>.55&&item.y<.73&&Math.abs(item.x-eddy.x)<.19){item.orbit={angle:Math.atan2((item.y-eddy.y)/.6875,item.x-eddy.x),life:0};item.eddyPassed=true;}
   if(item.orbit){item.orbit.life+=dt;item.orbit.angle+=dt*.7;item.x=eddy.x+Math.cos(item.orbit.angle)*.13;item.y=eddy.y+Math.sin(item.orbit.angle)*.09;if(item.orbit.life>8){delete item.orbit;item.y=.79;}}
   else item.y+=s.speed*dt;if(!item.collected&&Math.abs(item.x-s.x)<.085&&Math.abs(item.y-s.y)<.065){
   item.collected=true;
   if(item.type==='rock'||item.type==='log'){
    if(s.hitTime<=0){s.hitTime=.8;s.hitCount++;s.hitSide=item.x<s.x?1:item.x>s.x?-1:s.x>.5?-1:1;if(!s.eddy.active){s.x=clamp(s.x+s.hitSide*.045);s.target=clamp(s.target+s.hitSide*.045);}events.push('hit');}
    continue;
   }
   if(item.type==='material'&&s.materialCollected)continue;const points=POINTS[item.type]||0;s.score+=points;
   if(item.type==='yuzu')s.yuzu++;if(item.type==='friend'){s.friends++;const id=item.friendId||s.trip.friend;if(!s.seenFriends.includes(id))s.seenFriends.push(id);}if(item.type==='petal')s.petals++;
   if(item.type==='collectible'){const id=item.collectibleId||s.trip.collectible;if(has('collectibles',id)){s.inventory[id]=(s.inventory[id]||0)+1;if(!s.knownInventory[id]&&!s.newFinds.includes(id))s.newFinds.push(id);}}
   if(item.type==='material'&&item.materialId===s.trip.materialId)s.materialCollected=true;
   s.particles.push({x:item.x,y:item.y,life:1.3,text:points?'+'+points:'♡',type:item.type});events.push(item.type);
  }}
  s.items=s.items.filter(i=>!i.collected&&i.y<1.15).slice(-30);for(const p of s.particles){p.life-=dt;p.y-=dt*.05;}s.particles=s.particles.filter(p=>p.life>0).slice(-40);s.completed=s.elapsed>=DURATION;return events;
 }
 function cleanInventory(raw){return Object.fromEntries(POOLS.collectibles.filter(x=>Number.isSafeInteger(raw?.[x.id])&&raw[x.id]>0).map(x=>[x.id,Math.min(1e8,raw[x.id])]));}
 function readProfile(storage){let raw;try{raw=JSON.parse(storage.getItem(SESSION)||'null');}catch(_){}const owned=['peach',...Object.keys(SHOP).filter(k=>k!=='peach'&&Array.isArray(raw?.owned)&&raw.owned.includes(k))];return {wallet:Math.floor(safe(raw?.wallet)),total:Math.floor(safe(raw?.total)),owned,equipped:owned.includes(raw?.equipped)?raw.equipped:'peach',session:raw?.session||null,inventory:cleanInventory(raw?.inventory),collection:cleanInventory(raw?.inventory),history:Array.isArray(raw?.history)?raw.history.filter(x=>typeof x==='string').slice(-8):[],receipts:raw?.receipts&&typeof raw.receipts==='object'&&!Array.isArray(raw.receipts)?raw.receipts:{}};}
 function write(storage,p){try{storage.setItem(SESSION,JSON.stringify(p));return true;}catch(_){return false;}}
 function serializable(s){const {particles,trail,paused,...saved}=s;return JSON.parse(JSON.stringify(saved));}
 function checkpoint(storage,s,finish=false){if(s.isPractice)return false;
  // Material receipt and balance are saved atomically in their own ledger. Retrying
  // after a failed profile checkpoint cannot grant this trip's resource twice.
  if(s.materialCollected&&s.trip.materialId){const reward=materials?.create({storage}).claimDrift(s.trip.id,s.trip.materialId);s.materialRewarded=!!reward?.ok;if(!reward?.ok)return false;}
  const p=readProfile(storage),prior=p.receipts[s.trip.id],credited=prior?Math.floor(safe(prior.score)):s.credited;
  const delta=Math.max(0,s.score-credited);p.wallet+=delta;p.total+=delta;const priorItems=cleanInventory(prior?.inventory);
  for(const [id,n]of Object.entries(cleanInventory(s.inventory)))p.inventory[id]=(p.inventory[id]||0)+Math.max(0,n-(priorItems[id]||0));
  p.receipts[s.trip.id]={score:Math.max(s.score,credited),inventory:Object.fromEntries(POOLS.collectibles.map(d=>[d.id,Math.max(s.inventory[d.id]||0,priorItems[d.id]||0)]).filter(([,n])=>n>0))};p.session=finish?null:serializable({...s,credited:s.score});if(write(storage,p)){s.credited=s.score;return true;}return false;
 }
 function restore(storage){const raw=readProfile(storage).session;if(!raw||![1,2].includes(raw.version))return null;for(const k of ['x','target','elapsed','score','credited','yuzu','friends','petals','startWave'])if(!Number.isFinite(raw[k])||raw[k]<0||raw[k]>1e9)return null;if(raw.credited!==raw.score||raw.startWave<1)return null;
  // Legacy sessions retain earned points while entering the new finite journey.
  if(raw.version===1){const s=create();for(const k of ['score','credited','yuzu','friends','petals'])s[k]=raw[k];s.elapsed=Math.min(raw.elapsed,DURATION);s.flowTime=s.elapsed;s.x=clamp(raw.x);s.target=clamp(raw.target);s.completed=s.elapsed>=DURATION;return s;}
  const t=raw.trip;if(!t||!/^trip-[a-z0-9-]+$/.test(t.id)||!has('scenes',t.scene)||!has('times',t.time)||!has('weather',t.weather)||!has('friends',t.friend)||!has('collectibles',t.collectible)||!has('events',t.event)||(t.materialId!==null&&!Object.hasOwn(materials?.ITEMS||{},t.materialId))||raw.elapsed>DURATION||!Array.isArray(raw.items)||raw.items.length>30)return null;
  const s=create();Object.assign(s,raw,{x:clamp(raw.x),target:clamp(raw.target),inventory:cleanInventory(raw.inventory),knownInventory:cleanInventory(raw.knownInventory),particles:[],trail:[],paused:false,wave:1,startWave:1,speed:.105,completed:raw.elapsed>=DURATION});s.featured=raw.featured&&typeof raw.featured==='object'?raw.featured:{};s.newFinds=Array.isArray(raw.newFinds)?raw.newFinds.filter(id=>has('collectibles',id)):[];s.seenFriends=Array.isArray(raw.seenFriends)?raw.seenFriends.filter(id=>has('friends',id)):[];
  if(typeof raw.materialCollected!=='boolean'||!Number.isFinite(s.spawn)||!Number.isSafeInteger(s.serial)||s.items.some(i=>!i||!Object.hasOwn(POINTS,i.type)||!Number.isFinite(i.x)||!Number.isFinite(i.y)||!Number.isSafeInteger(i.id)||i.orbit&&(!Number.isFinite(i.orbit.angle)||!Number.isFinite(i.orbit.life)||i.orbit.life<0||i.orbit.life>8)))return null;
  if(raw.eddy!==undefined&&(!raw.eddy||typeof raw.eddy.active!=='boolean'||!Number.isFinite(raw.eddy.angle)||!Number.isFinite(raw.eddy.radius)||raw.eddy.radius<.055||raw.eddy.radius>.13||raw.eddy.active&&(raw.elapsed<20||raw.elapsed>45)))return null;
  if(raw.flowTime!==undefined&&(!Number.isFinite(raw.flowTime)||raw.flowTime<0)||raw.y!==undefined&&(!Number.isFinite(raw.y)||raw.y<.15||raw.y>.88))return null;
  s.hitTime=Number.isFinite(raw.hitTime)?safe(raw.hitTime,.8):0;s.hitCount=Math.floor(safe(raw.hitCount));s.hitSide=raw.hitSide===-1?-1:1;s.obstacleClock=Number.isFinite(raw.obstacleClock)?Math.max(.001,Math.min(7,raw.obstacleClock)):6;s.obstacleCount=Math.floor(safe(raw.obstacleCount));
  s.flowTime=raw.flowTime??s.elapsed;s.y=raw.y??.72;s.targetY=Number.isFinite(raw.targetY)?Math.max(.15,Math.min(.88,raw.targetY)):.72;s.eddy={active:false,angle:0,radius:.13,intent:false,...raw.eddy};s.playTime=Number.isFinite(raw.playTime)?Math.max(0,Math.min(1.3,raw.playTime)):0;s.playCount=Math.floor(safe(raw.playCount));return s;
 }
 function finish(storage,s){return checkpoint(storage,s,true);}
 function buy(storage,id){if(!Object.hasOwn(SHOP,id))return false;const p=readProfile(storage);if(!p.owned.includes(id)){if(p.wallet<SHOP[id].cost)return false;p.wallet-=SHOP[id].cost;p.owned.push(id);}p.equipped=id;return write(storage,p);}
 function name(pool,id,lang='en'){const d=POOLS[pool]?.find(x=>x.id===id);return d?(lang.startsWith('zh')?d.zh:d.name):id||'';}
 function environment(s){return Object.fromEntries(Object.entries({scene:'scenes',time:'times',weather:'weather',friend:'friends',collectible:'collectibles',event:'events'}).map(([k,p])=>[k,POOLS[p].find(x=>x.id===s.trip[k])]));}
 return {SESSION,DURATION,SHOP,POINTS,POOLS,create,begin,steer,step,eddyInfo,position,leaveEddy,play,checkpoint,restore,finish,readProfile,buy,name,environment};
});
