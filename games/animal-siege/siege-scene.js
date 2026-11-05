(function(){
  'use strict';
  window.AnimalSiegeScene={create({flag,notice,title,gold,wood,goldLabel,woodLabel,text}){
    let timer=null,resolveCapture=null;
    function reset(){clearTimeout(timer);timer=null;notice.hidden=true;flag.dataset.owner='defenders';flag.classList.remove('flag-raised');const done=resolveCapture;resolveCapture=null;done?.();}
    function update({name,gold:coins,wood:timber}){title.textContent=text('Captured: ','攻下：')+name;gold.textContent='+'+coins;wood.textContent='+'+timber;goldLabel.textContent=text('gold','金幣');woodLabel.textContent=text('wood','木材');notice.dataset.gold=coins;notice.dataset.wood=timber;}
    function capture(data){
      update(data);flag.dataset.owner='player';flag.classList.add('flag-raised');notice.hidden=false;
      return new Promise(resolve=>{resolveCapture=resolve;timer=setTimeout(()=>{timer=null;notice.hidden=true;const done=resolveCapture;resolveCapture=null;done?.();},matchMedia('(prefers-reduced-motion: reduce)').matches?450:1200);});
    }
    return {reset,update,capture};
  }};
})();
