// Browser-local collection ledger. Scores and challenge progression remain separate.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./toenow-levels.js'),require('./toenow-security.js'));
  else root.ToenowMaterials=factory(root.ToenowLevels,root.ToenowSecurity);
})(typeof globalThis!=='undefined'?globalThis:this,function(levels,security){
  'use strict';
  const STORAGE_KEY='toenow_materials_v1';
  const ITEMS={
    'number-pop':{key:'carrot',icon:'🥕',name:'Carrots',partner:'block-match',welcome:'Harvest basket',together:'Harvest cart',decor:'🛒'},
    'ball-track':{key:'shell',icon:'🐚',name:'Shells',partner:'block-match',welcome:'Shell collection',together:'River jetty',decor:'⚓'},
    'block-match':{key:'timber',icon:'🪵',name:'Timber',partner:'space-scale',welcome:'Tool rack',together:'Workshop sign',decor:'🪧'},
    'add-up':{key:'nut',icon:'🌰',name:'Nuts',partner:'block-match',welcome:'Nut basket',together:'Supply wagon',decor:'🛒'},
    'space-scale':{key:'ribbon',icon:'🎀',name:'Ribbons',partner:'shadow-match',welcome:'Parcel ribbons',together:'Gift stall',decor:'🎁'},
    'tap-match':{key:'fish',icon:'🐟',name:'Fish',partner:'ball-track',welcome:'Pool flag',together:'Shell slide',decor:'🛝'},
    'spot-quick':{key:'feather',icon:'🪶',name:'Feathers',partner:'block-match',welcome:'Journal stand',together:'Observation perch',decor:'🔭'},
    'shadow-match':{key:'paper',icon:'📜',name:'Color paper',partner:'space-scale',welcome:'Paper garland',together:'Festival stage',decor:'🎭'},
    'flash-brain':{key:'seed',icon:'🌱',name:'Seeds',partner:'number-pop',welcome:'Flower pots',together:'Picnic garden',decor:'🌷'},
    'animal-rescue-train':{key:'bamboo',icon:'🎋',name:'Bamboo',partner:'flash-brain',welcome:'Station planter',together:'Garden platform',decor:'🚉'}
  };
  // Every item participates in four collaboration recipes, including its own home.
  const PARTNER_ORDER=['number-pop','block-match','flash-brain','animal-rescue-train','space-scale','shadow-match','spot-quick','ball-track','tap-match','add-up'];
  const BUILD_AMOUNTS={2:[16],3:[12,8,4],4:[16,12,8,4],5:[24,16,12,8]};
  const COSTS=[0,0,16,24,40,60]; // Total ingredients, never an own-item price.
  const validId=id=>Object.prototype.hasOwnProperty.call(ITEMS,id);
  const integer=(n,fallback=0)=>Number.isSafeInteger(n)&&n>=0&&n<=100000000?n:fallback;
  function combine(id,amounts){if(!validId(id)||!amounts)return null;const start=PARTNER_ORDER.indexOf(id);return Object.fromEntries(amounts.map((n,i)=>[PARTNER_ORDER[(start+i)%PARTNER_ORDER.length],n]));}
  function upgradeRecipe(id,stage){return combine(id,Number.isInteger(stage)?BUILD_AMOUNTS[stage]:null);}
  function recipe(id,kind){return combine(id,kind==='welcome'?[4]:kind==='together'?[8,4,4,4]:null);}
  function create(options={}){
    const storage=options.storage,now=options.now||Date.now,runs=new Map();
    function read(key){try{return storage?.getItem(key);}catch(_){return null;}}
    function load(){
      let raw;try{raw=JSON.parse(read(STORAGE_KEY)||'null');}catch(_){}
      const existing=raw&&raw.version===1&&!Array.isArray(raw);
      let oldScores;try{oldScores=JSON.parse(read('toenow_game_scores')||'{}');}catch(_){}
      const state={version:1,balances:{},homes:{}};
      for(const id of Object.keys(ITEMS)){
        state.balances[id]=integer(raw?.balances?.[id]);
        const home=raw?.homes?.[id];
        let stage=Math.min(5,Math.max(1,integer(home?.stage,1)));
        if(!existing){
          const key=levels?.GAME_STORAGE_KEYS?.[id]?.wave;
          const wave=Math.max(integer(Number(read(key)),1),integer(oldScores?.[id]?.maxWave,1));
          stage=levels?.getLevelInfo(wave).level||1;
        }
        const owned=['welcome','together'].filter(k=>home?.owned?.includes?.(k));
        state.homes[id]={stage,owned,placed:owned.filter(k=>home?.placed?.includes?.(k))};
      }
      return state;
    }
    function save(state){try{if(!storage?.setItem)return false;storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch(_){return false;}}
    function spend(id,cost,change){
      if(!validId(id)||!cost)return {ok:false,reason:'invalid'};
      const state=load();
      if(Object.entries(cost).some(([key,n])=>state.balances[key]<n))return {ok:false,reason:'materials'};
      if(!change(state.homes[id]))return {ok:false,reason:'owned'};
      for(const [key,n]of Object.entries(cost))state.balances[key]-=n;
      return {ok:save(state),reason:'storage'};
    }
    return {
      snapshot:load,
      cancelRun(token){runs.delete(token);},
      beginRun(id,opts={}){
        if(!validId(id)||opts.isPractice||opts.isPreview)return null;
        // Freeze existing homes before this attempt changes any challenge records.
        if(!read(STORAGE_KEY))save(load());
        const token={};runs.set(token,{id,started:now(),wave:integer(opts.wave,1)||1});return token;
      },
      finishRun(token,result={}){
        const run=runs.get(token);runs.delete(token);
        const empty={amount:0};if(!run||result.isPractice||result.isPreview)return empty;
        const {id,started,wave:startWave}=run,elapsed=now()-started;
        if(!Number.isFinite(elapsed)||elapsed<(id==='animal-rescue-train'?1000:10000)||!Number.isSafeInteger(result.score)||result.score<=0||!Number.isSafeInteger(result.wave)||result.wave<startWave)return empty;
        if(security&&!security.verifyScorePlausibility({gameId:id,score:result.score,wave:result.wave,durationSec:elapsed/1000}).isValid)return empty;
        const amount=4+Math.min(4,Math.floor((result.wave-startWave)/3));
        const state=load();state.balances[id]=Math.min(100000000,state.balances[id]+amount);
        if(!save(state))return {amount:0,error:'storage'};
        return {gameId:id,amount,balance:state.balances[id],stage:state.homes[id].stage};
      },
      upgrade(id){const home=load().homes[id];if(!home||home.stage>=5)return {ok:false,reason:'max'};return spend(id,upgradeRecipe(id,home.stage+1),h=>{h.stage++;return true;});},
      craft(id,kind){return spend(id,recipe(id,kind),h=>{if(h.owned.includes(kind))return false;h.owned.push(kind);h.placed.push(kind);return true;});},
      toggle(id,kind){const state=load(),home=state.homes[id];if(!home?.owned.includes(kind))return {ok:false};home.placed=home.placed.includes(kind)?home.placed.filter(k=>k!==kind):[...home.placed,kind];return {ok:save(state)};}
    };
  }
  return {STORAGE_KEY,ITEMS,COSTS,upgradeRecipe,recipe,create};
});
