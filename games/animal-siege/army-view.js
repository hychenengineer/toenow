(function(){
  'use strict';
  window.AnimalArmyView={render(r,{text:t,name,image}){
    const E=window.AnimalSiege;
    return '<section class="army-summary" aria-label="'+t('Current army','目前兵力')+'"><span class="army-summary-label">'+t('YOUR ARMY','目前兵力')+'</span><div class="army-summary-units">'+Object.keys(E.TYPES).map(k=>'<div data-army-kind="'+k+'">'+image(k)+'<span>'+name(k)+'</span><b>'+Math.ceil(r.army[k]/E.TYPES[k].hp)+'</b>'+(r.upgrades[k]?'<small aria-label="'+t('Trained','已升級')+'">✦</small>':'')+'</div>').join('')+'</div></section>';
  }};
})();
