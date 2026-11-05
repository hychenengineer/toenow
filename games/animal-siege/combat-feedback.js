(function(){
  'use strict';
  window.AnimalCombatFeedback={create({surface,board,layer,live,text,art}){
    let timer=null,cleanupTimer=null,resolvePlay=null;
    const animations=new Set(),restores=[];
    function clear(){
      clearTimeout(timer);clearTimeout(cleanupTimer);timer=cleanupTimer=null;
      for(const a of animations)a.cancel();animations.clear();while(restores.length)restores.pop()();
      layer.replaceChildren();live.textContent='';const done=resolvePlay;resolvePlay=null;done?.();
    }
    function element(cls,x,y,width,height){const el=document.createElement('div');el.className=cls;Object.assign(el.style,{left:x+'px',top:y+'px',width:width+'px',height:height+'px'});layer.appendChild(el);return el;}
    function animate(el,frames,options){const a=el.animate(frames,options);animations.add(a);a.finished.then(()=>animations.delete(a),()=>animations.delete(a));return a;}
    function cell(unit){const tile=board.querySelector('[data-cell="'+unit.x+','+unit.y+'"]'),r=tile.getBoundingClientRect(),s=surface.getBoundingClientRect();return {tile,x:r.left-s.left,y:r.top-s.top,w:r.width,h:r.height,cx:r.left-s.left+r.width/2,cy:r.top-s.top+r.height/2};}
    function actor(unit,p,cls){
      const el=element(cls,p.x,p.y,p.w,p.h),img=document.createElement('img');img.src=art(unit.kind);img.alt='';el.appendChild(img);
      const original=p.tile.querySelector('img');if(original){original.style.visibility='hidden';restores.push(()=>original.style.removeProperty('visibility'));}
      p.tile.classList.add('combat-occupied');restores.push(()=>p.tile.classList.remove('combat-occupied'));
      return el;
    }
    function walk(unit,path){
      clear();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced||path.length<2)return Promise.resolve();
      const from=cell(path[0]),to=cell(path.at(-1)),walker=actor(unit,from,'combat-walker');walker.dataset.walker=unit.id;walker.dataset.team=unit.team;
      const destination=to.tile.querySelector('img'),badge=to.tile.querySelector('.unit-count');
      for(const node of [destination,badge])if(node){node.style.visibility='hidden';restores.push(()=>node.style.removeProperty('visibility'));}
      to.tile.classList.add('combat-occupied');restores.push(()=>to.tile.classList.remove('combat-occupied'));
      if(badge){const count=badge.cloneNode(true);count.className='walker-count';count.style.removeProperty('visibility');walker.appendChild(count);}
      const frames=path.map((p,i)=>{const point=cell(p);return {transform:'translate('+(point.cx-from.cx)+'px,'+(point.cy-from.cy)+'px)',offset:i/(path.length-1)};});
      animate(walker,frames,{duration:360,easing:'linear',fill:'forwards'});
      const image=walker.querySelector('img');animate(image,[{rotate:'-3deg'},{rotate:'3deg'},{rotate:'-3deg'}],{duration:150,iterations:3});
      return new Promise(resolve=>{resolvePlay=resolve;timer=setTimeout(()=>{timer=null;while(restores.length)restores.pop()();walker.remove();const done=resolvePlay;resolvePlay=null;done?.();},380);});
    }
    function play(hit,attacker,target,terminal=false){
      clear();const from=cell(attacker),to=cell(target),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const damage=hit.actualDamage??hit.damage;
      live.textContent=text(attacker.team==='player'?'Your attack: ':'Enemy attack: ',attacker.team==='player'?'我方攻擊：':'敵方攻擊：')+text('HP lost ','扣血 ')+damage+text(', troops lost ',', 減兵 ')+hit.loss+(hit.counter?text(' · Counter!','・克制！'):'');
      const floating=element('combat-float',Math.max(6,Math.min(surface.clientWidth-154,to.cx-74)),Math.max(8,to.y-36),148,64);
      floating.dataset.damage=String(damage);floating.dataset.loss=String(hit.loss);floating.dataset.team=attacker.team;
      const hp=document.createElement('strong'),loss=document.createElement('span');hp.textContent='−'+damage+' HP';loss.textContent='−'+hit.loss+text(' troops',' 隻');floating.append(hp,loss);
      if(hit.counter){const badge=document.createElement('small');badge.textContent=text('COUNTER!','克制！');floating.appendChild(badge);}
      const duration=reduced?180:terminal?900:520;
      if(!reduced){
        const dx=to.cx-from.cx,dy=to.cy-from.cy,length=Math.hypot(dx,dy)||1,reach=Math.min(38,from.w*.6),source=actor(attacker,from,'combat-actor');
        source.dataset.attacker=attacker.id;
        animate(source,[{transform:'translate(0,0) rotate(0)'},{transform:'translate('+dx/length*reach+'px,'+dy/length*reach+'px) rotate(-7deg)',offset:.45},{transform:'translate(0,0) rotate(0)'}],{duration:360,easing:'ease-in-out'});
        if(attacker.kind==='squirrel'){
          const projectile=element('combat-projectile',from.cx-10,from.cy-10,20,20);projectile.textContent='🌰';
          animate(projectile,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotate(400deg)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotate(440deg)',opacity:0}],{duration:340,easing:'ease-in',fill:'forwards'});
        }
        const victim=actor(target,to,'combat-victim');victim.dataset.target=target.id;
        animate(victim,[{transform:'translateX(0)',filter:'brightness(1)'},{transform:'translateX(-5px) rotate(-4deg)',filter:'brightness(1.9)',offset:.25},{transform:'translateX(5px) rotate(4deg)',offset:.45},{transform:'translateX(-4px) rotate(-2deg)',offset:.65},{transform:'translateX(0)',filter:'brightness(1)',opacity:target.hp<=0?0:1}],{delay:120,duration:340,fill:'forwards'});
        const impact=element('combat-impact',to.cx-23,to.cy-23,46,46);impact.textContent='✦';
        animate(impact,[{transform:'scale(.2) rotate(-30deg)',opacity:0},{transform:'scale(1.3) rotate(15deg)',opacity:1,offset:.35},{transform:'scale(1.6) rotate(30deg)',opacity:0}],{delay:120,duration:320,fill:'forwards'});
        animate(floating,[{transform:'translateY(5px)',opacity:1},{transform:'translateY(0)',opacity:1,offset:.16},{transform:'translateY(-8px)',opacity:1,offset:.8},{transform:'translateY(-23px)',opacity:0}],{duration:1000,fill:'forwards'});
      }
      return new Promise(resolve=>{
        resolvePlay=resolve;
        timer=setTimeout(()=>{timer=null;while(restores.length)restores.pop()();for(const el of layer.querySelectorAll('.combat-actor,.combat-victim,.combat-impact,.combat-projectile'))el.remove();const done=resolvePlay;resolvePlay=null;done?.();},duration);
        cleanupTimer=setTimeout(()=>{cleanupTimer=null;floating.remove();},reduced?1000:1050);
      });
    }
    return {play,walk,clear};
  }};
})();
