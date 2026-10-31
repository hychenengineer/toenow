(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CarefreeFarm=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='toenow_carefree_farm_v1';
 const CROPS={
  grass:{name:'Grass',icon:'🌿',cost:0,seconds:30,yield:3,sell:1,level:1},carrot:{name:'Carrot',icon:'🥕',cost:3,seconds:50,yield:3,sell:4,level:1},
  clover:{name:'Clover',icon:'☘️',cost:2,seconds:45,yield:3,sell:4,level:2},corn:{name:'Corn',icon:'🌽',cost:5,seconds:75,yield:3,sell:8,level:2},
  wheat:{name:'Wheat',icon:'🌾',cost:4,seconds:60,yield:4,sell:5,level:3},cabbage:{name:'Cabbage',icon:'🥬',cost:5,seconds:80,yield:3,sell:10,level:3},
  pumpkin:{name:'Pumpkin',icon:'🎃',cost:8,seconds:120,yield:2,sell:22,level:3},beet:{name:'Beetroot',icon:'🍠',cost:6,seconds:90,yield:3,sell:12,level:4},
  oats:{name:'Oats',icon:'🌾',cost:5,seconds:75,yield:4,sell:8,level:4},sunflower:{name:'Sunflower',icon:'🌻',cost:8,seconds:120,yield:3,sell:18,level:4},
  strawberry:{name:'Strawberry',icon:'🍓',cost:10,seconds:150,yield:4,sell:18,level:5},lavender:{name:'Lavender',icon:'🪻',cost:10,seconds:150,yield:3,sell:25,level:5}
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
  {plots:3,capacity:1,harvests:0,varieties:0,species:0,adults:0,cost:0,orders:0},
  {plots:6,capacity:2,harvests:6,varieties:2,species:1,adults:1,cost:50,orders:0},
  {plots:9,capacity:3,harvests:24,varieties:4,species:2,adults:2,cost:250,orders:2},
  {plots:12,capacity:5,harvests:72,varieties:6,species:3,adults:3,cost:1000,orders:6},
  {plots:15,capacity:8,harvests:180,varieties:9,species:4,adults:4,cost:3000,orders:15}
 ];
 const BONDS=[{xp:0,name:'Getting acquainted'},{xp:12,name:'Familiar faces'},{xp:35,name:'Good friends'},{xp:80,name:'Close companions'},{xp:160,name:'One little family'}];
 const TRAITS=['Curious','Gentle','Playful','Dreamy'];
 const keepsakeNames={sheep:['Pressed clover','Tiny wool heart','Silver pasture bell','Cloud-soft ribbon'],pig:['Polished pebble','Lucky wooden button','Mushroom sketch','Little treasure map'],cow:['Daisy bookmark','Meadow postcard','Golden milk charm','Wildflower wreath'],alpaca:['Soft pompom','Pastel tassel','Rainbow spool','Handwoven friendship band'],llama:['Travel feather','Mountain stone','Woven travel patch','Sunrise compass']};
 const KEEPSAKES=Object.entries(keepsakeNames).flatMap(([species,names])=>names.map((name,i)=>({id:species+'-'+i,species,name,bond:i,icon:['🍀','🎀','🔔','💝'][i]})));
 const DECORATIONS={flowerbed:{name:'Flower border',orders:3,stamps:4,coins:120},picnic:{name:'Picnic corner',orders:8,stamps:10,coins:400},pond:{name:'Little duck pond',orders:15,stamps:20,coins:1000},arch:{name:'Friendship arch',orders:25,stamps:30,coins:2500}};
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 const own=(object,key)=>typeof key==='string'&&Object.hasOwn(object,key);
 function bond(a){let result=0;BONDS.forEach((b,i)=>{if(a.friendship>=b.xp)result=i;});return result;}
 function baby(species,index=0){return {species,growth:0,cycles:0,due:0,ready:false,gift:null,bonus:false,friendship:0,petReadyAt:0,trait:TRAITS[(Object.keys(ANIMALS).indexOf(species)+index)%TRAITS.length]};}
 function makeOrder(s){
  const id=s.nextOrderId++,crops=s.unlocked,products=[...new Set(s.animals.map(a=>ANIMALS[a.species].product))];
  const first=crops[(id-1)%crops.length],second=id%3===0?products[(id-1)%products.length]:crops[id%crops.length];
  const needs={[first]:2+s.level+id%3};needs[second]=(needs[second]||0)+(CROPS[second]?2+s.level:1+Math.floor(s.level/3));
  const value=Object.entries(needs).reduce((sum,[item,n])=>sum+ITEMS[item].sell*n,0);
  return {id,requester:['Village market','Neighbourhood pantry','Village weaver'][(id-1)%3],needs,coins:Math.ceil(value*1.5),stamps:2};
 }
 function addProgression(s){
  s.version=2;s.stamps=0;s.completedOrders=0;s.collection=[];s.decorations=[];s.nextOrderId=1;s.orders=[];
  s.animals.forEach((a,i)=>Object.assign(a,{friendship:0,petReadyAt:0,trait:TRAITS[(Object.keys(ANIMALS).indexOf(a.species)+i)%TRAITS.length]}));
  for(let i=0;i<3;i++)s.orders.push(makeOrder(s));return s;
 }
 function create(now=Date.now()){return addProgression({version:1,level:1,coins:20,plots:Array.from({length:3},()=>null),animals:[baby('sheep')],inventory:{grass:3},unlocked:['grass','carrot'],harvests:0,harvested:[],lastSeen:now});}
 function advance(s,now=Date.now()){
  now=Math.max(s.lastSeen,now);s.lastSeen=now;
  for(const a of s.animals){
   if(!a.due||a.due>now)continue;
   a.due=0;a.cycles++;
   a.friendship=Math.min(160,a.friendship+(a.bonus?4:2));
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
   {key:'Completed orders',value:s.completedOrders,target:next.orders},
   {key:'Coins',value:s.coins,target:next.cost}
  ];
 }
 function act(s,action,now=Date.now()){
  advance(s,now);now=s.lastSeen;
  const fail=reason=>({ok:false,reason});const add=(id,n)=>s.inventory[id]=(s.inventory[id]||0)+n;
  const a=integer(action.animal)?s.animals[action.animal]:null,c=own(CROPS,action.crop)?CROPS[action.crop]:null;
  switch(action.type){
   case 'plant':{
    if(!integer(action.plot)||action.plot>=s.plots.length||s.plots[action.plot]||!c||!s.unlocked.includes(action.crop))return fail('Choose an empty plot and an unlocked crop.');
    if(s.coins<c.cost)return fail('Not enough coins. Grass seeds are free.');
    s.coins-=c.cost;s.plots[action.plot]={crop:action.crop,due:now+c.seconds*1000};break;
   }
   case 'harvest':{
    const p=integer(action.plot)?s.plots[action.plot]:null;if(!p||p.due>now)return fail('Still growing.');
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
    if(CROPS[gift])unlock(s,gift);add(gift,2);a.gift=null;
    const found=KEEPSAKES.find(k=>k.species===a.species&&k.bond<=bond(a)&&!s.collection.includes(k.id));
    if(found)s.collection.push(found.id);s.stamps++;return {ok:true,gift,keepsake:found?.id||null};
   }
   case 'pet':if(!a)return fail('Choose an animal.');if(a.petReadyAt>now)return fail('Your friend is still enjoying that cuddle.');a.friendship=Math.min(160,a.friendship+1);a.petReadyAt=now+600000;return {ok:true,petted:true};
   case 'sell':{
    const quantity=action.quantity===undefined?1:action.quantity;
    if(!own(ITEMS,action.item)||!integer(quantity)||quantity<1||quantity>(s.inventory[action.item]||0))return fail('Enter a whole number within your stock.');
    const total=ITEMS[action.item].sell*quantity;if(!integer(s.coins+total))return fail('Amount is too large.');
    s.inventory[action.item]-=quantity;s.coins+=total;return {ok:true,sold:quantity,total};
   }
   case 'fulfill':{
    const index=s.orders.findIndex(o=>o.id===action.order);if(index<0)return fail('This order has already been delivered.');const order=s.orders[index];
    if(Object.entries(order.needs).some(([id,n])=>(s.inventory[id]||0)<n))return fail('Gather the requested items first.');
    if(!integer(s.coins+order.coins)||!integer(s.stamps+order.stamps))return fail('Amount is too large.');
    for(const [id,n] of Object.entries(order.needs))s.inventory[id]-=n;
    s.coins+=order.coins;s.stamps+=order.stamps;s.completedOrders++;s.orders[index]=makeOrder(s);return {ok:true,delivered:true};
   }
   case 'buyDecoration':{
    const d=own(DECORATIONS,action.decoration)?DECORATIONS[action.decoration]:null;
    if(!d||s.decorations.includes(action.decoration)||s.completedOrders<d.orders||s.coins<d.coins||s.stamps<d.stamps)return fail('Complete more orders and collect stamps for this decoration.');
    s.coins-=d.coins;s.stamps-=d.stamps;s.decorations.push(action.decoration);return {ok:true,decorated:true};
   }
   case 'buyAnimal':{
    const spec=own(ANIMALS,action.species)?ANIMALS[action.species]:null;if(!spec||spec.level>s.level||s.animals.length>=STAGES[s.level-1].capacity)return fail('Grow your farm to welcome more animals.');
    if(s.level<5&&s.animals.some(a=>a.species===action.species))return fail('Welcome different species first. More of each at farm level 5.');
    if(s.coins<spec.cost)return fail('Not enough coins. Grass seeds are free.');
    s.coins-=spec.cost;s.animals.push(baby(action.species,s.animals.length));unlock(s,spec.food);add(spec.food,3);break;
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
 function validBase(s){
  return [1,2].includes(s?.version)&&integer(s.level)&&s.level>=1&&s.level<=5&&integer(s.coins)&&integer(s.lastSeen)&&integer(s.harvests)&&Array.isArray(s.harvested)&&new Set(s.harvested).size===s.harvested.length&&s.harvested.every(k=>own(CROPS,k))&&Array.isArray(s.plots)&&s.plots.length===STAGES[s.level-1].plots&&s.plots.every(p=>p===null||(p&&own(CROPS,p.crop)&&integer(p.due)))&&Array.isArray(s.animals)&&s.animals.length>=1&&s.animals.length<=STAGES[s.level-1].capacity&&s.animals.every(a=>a&&own(ANIMALS,a.species)&&integer(a.growth)&&a.growth<=3&&integer(a.cycles)&&integer(a.due)&&typeof a.ready==='boolean'&&typeof a.bonus==='boolean'&&(a.gift===null||own(ITEMS,a.gift)))&&s.inventory&&typeof s.inventory==='object'&&!Array.isArray(s.inventory)&&Object.entries(s.inventory).every(([k,v])=>own(ITEMS,k)&&integer(v))&&Array.isArray(s.unlocked)&&s.unlocked.includes('grass')&&s.unlocked.every(k=>own(CROPS,k));
 }
 function valid(s){
  if(!validBase(s)||s.version!==2)return false;
  return integer(s.stamps)&&integer(s.completedOrders)&&integer(s.nextOrderId)&&s.nextOrderId>3&&s.animals.every(a=>integer(a.friendship)&&a.friendship<=160&&integer(a.petReadyAt)&&TRAITS.includes(a.trait))&&Array.isArray(s.collection)&&new Set(s.collection).size===s.collection.length&&s.collection.every(id=>KEEPSAKES.some(k=>k.id===id))&&Array.isArray(s.decorations)&&new Set(s.decorations).size===s.decorations.length&&s.decorations.every(id=>own(DECORATIONS,id))&&Array.isArray(s.orders)&&s.orders.length===3&&new Set(s.orders.map(o=>o?.id)).size===3&&s.orders.every(o=>o&&integer(o.id)&&o.id>0&&o.id<s.nextOrderId&&typeof o.requester==='string'&&integer(o.coins)&&integer(o.stamps)&&o.needs&&typeof o.needs==='object'&&!Array.isArray(o.needs)&&Object.keys(o.needs).length>0&&Object.entries(o.needs).every(([id,n])=>own(ITEMS,id)&&integer(n)&&n>0));
 }
 function load(storage,now=Date.now()){
  try{const raw=storage.getItem(KEY);if(!raw)return {state:create(now),blocked:false};const s=JSON.parse(raw);if(s?.version===1&&validBase(s))addProgression(s);if(!valid(s))throw Error('Invalid save');return {state:advance(s,now),blocked:false};}
  catch(_){return {state:create(now),blocked:true};}
 }
 function save(storage,s,preview=false){if(preview)return true;try{if(!valid(s))return false;storage.setItem(KEY,JSON.stringify(s));return true;}catch(_){return false;}}
 return {KEY,CROPS,ANIMALS,GOODS,ITEMS,STAGES,BONDS,TRAITS,KEEPSAKES,DECORATIONS,bond,create,advance,act,requirements,load,save,valid};
});
