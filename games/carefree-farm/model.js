(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CarefreeFarm=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='toenow_carefree_farm_v1';
 const CROPS={
  grass:{name:'Grass',icon:'🌿',cost:0,seconds:30,yield:3,sell:2,level:1},carrot:{name:'Carrot',icon:'🥕',cost:3,seconds:50,yield:3,sell:4,level:1},
  clover:{name:'Clover',icon:'☘️',cost:2,seconds:45,yield:3,sell:3,level:2},corn:{name:'Corn',icon:'🌽',cost:5,seconds:75,yield:3,sell:6,level:2},
  wheat:{name:'Wheat',icon:'🌾',cost:4,seconds:60,yield:4,sell:4,level:3},cabbage:{name:'Cabbage',icon:'🥬',cost:5,seconds:80,yield:3,sell:6,level:3},
  pumpkin:{name:'Pumpkin',icon:'🎃',cost:8,seconds:120,yield:2,sell:12,level:3},beet:{name:'Beetroot',icon:'🍠',cost:6,seconds:90,yield:3,sell:7,level:4},
  oats:{name:'Oats',icon:'🌾',cost:5,seconds:75,yield:4,sell:5,level:4},sunflower:{name:'Sunflower',icon:'🌻',cost:8,seconds:120,yield:3,sell:9,level:4},
  strawberry:{name:'Strawberry',icon:'🍓',cost:10,seconds:150,yield:4,sell:9,level:5},lavender:{name:'Lavender',icon:'🪻',cost:10,seconds:150,yield:3,sell:12,level:5}
 };
 const ANIMALS={
  sheep:{name:'Sheep',food:'grass',favorite:'clover',product:'wool',gift:'clover',cost:55,seconds:40,level:1},
  pig:{name:'Pig',food:'carrot',favorite:'pumpkin',product:'truffle',gift:'pumpkin',cost:70,seconds:60,level:2},
  cow:{name:'Cow',food:'grass',favorite:'corn',product:'milk',gift:'bouquet',cost:110,seconds:75,level:3},
  alpaca:{name:'Alpaca',food:'grass',favorite:'cabbage',product:'fleece',gift:'rainbow',cost:150,seconds:90,level:4},
  llama:{name:'Llama',food:'grass',favorite:'oats',product:'parcel',gift:'souvenir',cost:180,seconds:100,level:4}
 };
 const GOODS={wool:{name:'Wool',icon:'🧶',sell:18},truffle:{name:'Truffle',icon:'🍄',sell:24},milk:{name:'Milk',icon:'🥛',sell:25},fleece:{name:'Alpaca fleece',icon:'🧵',sell:30},parcel:{name:'Gathering basket',icon:'🧺',sell:32},bouquet:{name:'Meadow bouquet',icon:'💐',sell:22},rainbow:{name:'Rainbow yarn',icon:'🌈',sell:35},souvenir:{name:'Little keepsake',icon:'🎀',sell:40}};
 const ITEMS={...CROPS,...GOODS};
 const STAGES=[
  {plots:3,capacity:1,harvests:0,varieties:0,species:0,adults:0,cost:0},
  {plots:6,capacity:2,harvests:4,varieties:1,species:1,adults:1,cost:25},
  {plots:9,capacity:3,harvests:12,varieties:3,species:2,adults:1,cost:60},
  {plots:12,capacity:5,harvests:24,varieties:5,species:3,adults:2,cost:100},
  {plots:15,capacity:8,harvests:40,varieties:7,species:4,adults:3,cost:160}
 ];
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 function baby(species){return {species,growth:0,cycles:0,due:0,ready:false,gift:null,bonus:false};}
 function create(now=Date.now()){return {version:1,level:1,coins:20,plots:Array.from({length:3},()=>null),animals:[baby('sheep')],inventory:{grass:3},unlocked:['grass','carrot'],harvests:0,harvested:[],lastSeen:now};}
 function advance(s,now=Date.now()){
  now=Math.max(s.lastSeen,now);s.lastSeen=now;
  for(const a of s.animals){
   if(!a.due||a.due>now)continue;
   a.due=0;a.cycles++;
   if(a.growth<3)a.growth++;else a.ready=true;
   if(!a.gift&&(a.cycles===1||a.cycles%3===0))a.gift=ANIMALS[a.species].gift;
  }
  return s;
 }
 function unlock(s,crop){if(!s.unlocked.includes(crop))s.unlocked.push(crop);}
 function requirements(s){
  const next=STAGES[s.level];if(!next)return [];
  return [
   {key:'Harvests',value:s.harvests,target:next.harvests},
   {key:'Crop varieties harvested',value:s.harvested.length,target:next.varieties},
   {key:'Animal species',value:new Set(s.animals.map(a=>a.species)).size,target:next.species},
   {key:'Grown animals',value:s.animals.filter(a=>a.growth===3).length,target:next.adults},
   {key:'Coins',value:s.coins,target:next.cost}
  ];
 }
 function act(s,action,now=Date.now()){
  advance(s,now);now=s.lastSeen;
  const fail=reason=>({ok:false,reason});const add=(id,n)=>s.inventory[id]=(s.inventory[id]||0)+n;
  const a=s.animals[action.animal],c=CROPS[action.crop];
  switch(action.type){
   case 'plant':{
    if(!integer(action.plot)||action.plot>=s.plots.length||s.plots[action.plot]||!c||!s.unlocked.includes(action.crop))return fail('Choose an empty plot and an unlocked crop.');
    if(s.coins<c.cost)return fail('Not enough coins. Grass seeds are free.');
    s.coins-=c.cost;s.plots[action.plot]={crop:action.crop,due:now+c.seconds*1000};break;
   }
   case 'harvest':{
    const p=s.plots[action.plot];if(!p||p.due>now)return fail('Still growing.');
    add(p.crop,CROPS[p.crop].yield);s.harvests++;if(!s.harvested.includes(p.crop))s.harvested.push(p.crop);s.plots[action.plot]=null;break;
   }
   case 'feed':{
    if(!a||!c)return fail('Choose food for your animal.');const spec=ANIMALS[a.species];
    if(a.due||a.ready)return fail('Collect the produce or wait for digestion.');
    if(action.crop!==spec.food&&action.crop!==spec.favorite)return fail('This animal prefers another crop.');
    if(!(s.inventory[action.crop]>0))return fail('Grow this food first.');
    s.inventory[action.crop]--;a.bonus=action.crop===spec.favorite;a.due=now+spec.seconds*1000*(a.bonus?0.75:1);break;
   }
   case 'collect':if(!a?.ready)return fail('No produce yet.');add(ANIMALS[a.species].product,a.bonus?2:1);a.ready=false;a.bonus=false;break;
   case 'gift':{
    if(!a?.gift)return fail('No surprise yet.');const gift=a.gift;
    if(CROPS[gift])unlock(s,gift);add(gift,2);a.gift=null;return {ok:true,gift};
   }
   case 'sell':if(!ITEMS[action.item]||!(s.inventory[action.item]>0))return fail('Nothing to sell yet.');s.inventory[action.item]--;s.coins+=ITEMS[action.item].sell;break;
   case 'buyAnimal':{
    const spec=ANIMALS[action.species];if(!spec||spec.level>s.level||s.animals.length>=STAGES[s.level-1].capacity)return fail('Grow your farm to welcome more animals.');
    if(s.level<5&&s.animals.some(a=>a.species===action.species))return fail('Welcome different species first. More of each at farm level 5.');
    if(s.coins<spec.cost)return fail('Not enough coins. Grass seeds are free.');
    s.coins-=spec.cost;s.animals.push(baby(action.species));unlock(s,spec.food);add(spec.food,3);break;
   }
   case 'upgrade':{
    const next=STAGES[s.level];if(!next||requirements(s).some(r=>r.value<r.target))return fail('Complete the farm milestones first.');
    s.coins-=next.cost;s.level++;while(s.plots.length<next.plots)s.plots.push(null);
    for(const [id,crop] of Object.entries(CROPS))if(crop.level<=s.level)unlock(s,id);break;
   }
   default:return fail('Unknown action.');
  }
  return {ok:true};
 }
 function valid(s){
  return s?.version===1&&integer(s.level)&&s.level>=1&&s.level<=5&&integer(s.coins)&&integer(s.lastSeen)&&integer(s.harvests)&&Array.isArray(s.harvested)&&new Set(s.harvested).size===s.harvested.length&&s.harvested.every(k=>Object.hasOwn(CROPS,k))&&Array.isArray(s.plots)&&s.plots.length===STAGES[s.level-1].plots&&s.plots.every(p=>p===null||(p&&Object.hasOwn(CROPS,p.crop)&&integer(p.due)))&&Array.isArray(s.animals)&&s.animals.length>=1&&s.animals.length<=STAGES[s.level-1].capacity&&s.animals.every(a=>a&&Object.hasOwn(ANIMALS,a.species)&&integer(a.growth)&&a.growth<=3&&integer(a.cycles)&&integer(a.due)&&typeof a.ready==='boolean'&&typeof a.bonus==='boolean'&&(a.gift===null||Object.hasOwn(ITEMS,a.gift)))&&s.inventory&&typeof s.inventory==='object'&&!Array.isArray(s.inventory)&&Object.entries(s.inventory).every(([k,v])=>Object.hasOwn(ITEMS,k)&&integer(v))&&Array.isArray(s.unlocked)&&s.unlocked.includes('grass')&&s.unlocked.every(k=>Object.hasOwn(CROPS,k));
 }
 function load(storage,now=Date.now()){
  try{const raw=storage.getItem(KEY);if(!raw)return {state:create(now),blocked:false};const s=JSON.parse(raw);if(!valid(s))throw Error('Invalid save');return {state:advance(s,now),blocked:false};}
  catch(_){return {state:create(now),blocked:true};}
 }
 function save(storage,s,preview=false){if(preview)return true;try{if(!valid(s))return false;storage.setItem(KEY,JSON.stringify(s));return true;}catch(_){return false;}}
 return {KEY,CROPS,ANIMALS,GOODS,ITEMS,STAGES,create,advance,act,requirements,load,save,valid};
});
