(function(){
 'use strict';
 const host=document.getElementById('animals'),actors=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let decorations='',previous=0;
 const asset=(species,part)=>'../../assets/carefree-farm/rig-v1/'+species+'-'+part+'.webp';
 const rigs={sheep:{x:35,y:28,w:250,h:165,legY:140,legH:108,front:220,hind:91},horse:{x:20,y:18,w:275,h:165,legY:125,legH:128,front:224,hind:106},cow:{x:20,y:20,w:275,h:155,legY:118,legH:132,front:220,hind:100},alpaca:{x:30,y:5,w:260,h:191,legY:147,legH:105,front:226,hind:86},llama:{x:30,y:0,w:260,h:200,legY:150,legH:103,front:222,hind:100}};
 function markup(species){const r=rigs[species],legs=[['hind-right','hind',-9],['front-right','front',-9],['hind-left','hind',9],['front-left','front',9]];
  return '<svg class="animal-rig" viewBox="0 0 320 280" aria-hidden="true"><g class="rig-facing">'+legs.map(([name,part,offset])=>{const x=r[part]+offset,w=r.legH*(part==='front'?.43:.5);return '<g data-leg="'+name+'" data-pivot-x="'+x+'" data-pivot-y="'+(r.legY+14)+'"'+(name.endsWith('right')?' class="far-leg"':'')+'><image href="'+asset(species,part)+'" x="'+(x-w/2)+'" y="'+r.legY+'" width="'+w+'" height="'+r.legH+'"/></g>';}).join('')+'<image class="rig-body" href="'+asset(species,'body')+'" x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'"/></g></svg>';
 }
 function pose(a,walking){const offsets={'front-left':0,'front-right':Math.PI,'hind-left':Math.PI/2,'hind-right':Math.PI*1.5};for(const leg of a.node.querySelectorAll('[data-leg]')){const phase=a.time*Math.PI*2*1.05+offsets[leg.dataset.leg],angle=walking?Math.sin(phase)*3.5:0;leg.setAttribute('transform','rotate('+angle.toFixed(3)+' '+leg.dataset.pivotX+' '+leg.dataset.pivotY+')');}a.node.dataset.walking=String(walking);}

 function update(state,selected,t){
  for(const [i,actor] of actors)if(i>=state.animals.length){actor.node.remove();actors.delete(i);}
  state.animals.forEach((animal,i)=>{
   let a=actors.get(i);
   if(!a){const node=document.createElement('button');node.className='roaming-animal';node.dataset.animal=i;node.innerHTML='<span class="animal-shadow"></span><span class="rig-host"></span><span class="animal-name"></span><span class="pasture-gift"></span>';host.append(node);a={node,x:0,time:i*2.7,pose:-1,freeze:false};actors.set(i,a);node.addEventListener('pointerenter',()=>a.freeze=true);node.addEventListener('pointerleave',()=>a.freeze=false);node.addEventListener('focus',()=>a.freeze=true);node.addEventListener('blur',()=>a.freeze=false);}
   a.animal=animal;a.node.classList.toggle('baby',animal.growth<3);a.node.classList.toggle('selected',i===selected);a.node.setAttribute('aria-pressed',String(i===selected));const name=i===0?t('Cotton'):t(CarefreeFarm.ANIMALS[animal.species].name)+' '+(i+1);a.node.setAttribute('aria-label',name+' · '+t(animal.growth<3?'Baby':'Grown up'));a.node.querySelector('.animal-name').textContent=name;a.node.querySelector('.pasture-gift').textContent=animal.gift?'🎁':animal.ready?'✦':'';
   if(a.species!==animal.species){a.species=animal.species;a.node.querySelector('.rig-host').innerHTML=markup(animal.species);pose(a,false);}
  });
  const next=state.decorations.join(',');if(next!==decorations){decorations=next;host.querySelectorAll('.pasture-decoration').forEach(n=>n.remove());for(const id of state.decorations){const n=document.createElement('div');n.className='pasture-decoration decor-'+id;n.setAttribute('role','img');n.setAttribute('aria-label',t(CarefreeFarm.DECORATIONS[id].name));n.innerHTML={flowerbed:'<i>✿</i><i>✿</i><i>✿</i><i>✿</i><i>✿</i>',picnic:'<span>🧺</span>',pond:'<span>🦆</span>',arch:'<span>❀</span><span>❀</span>'}[id];host.prepend(n);}}
  layout();
 }
 function layout(){const width=host.clientWidth,columns=Math.max(1,Math.min(4,Math.floor((width-24)/142))),rows=Math.ceil(actors.size/columns);host.style.height=(Math.max(2,rows)*130+115)+'px';for(const [i,a]of actors){const count=Math.min(columns,actors.size-Math.floor(i/columns)*columns),cell=(width-34)/count;a.x=Math.max(-Math.max(0,Math.min(24,(cell-130)/2-3)),Math.min(Math.max(0,Math.min(24,(cell-130)/2-3)),a.x));a.node.style.left=(17+cell*((i%columns)+.5)-65+a.x)+'px';a.node.style.top=(65+Math.floor(i/columns)*130)+'px';a.node.style.zIndex=String(10+Math.floor(i/columns));}}
 function frame(time){
  const dt=Math.min(.05,(time-previous)/1000||0);previous=time;
  const active=!document.hidden&&!host.closest('[hidden]')&&document.getElementById('farm-app').dataset.state==='playing'&&!document.querySelector('dialog[open]');
  if(active){for(const a of actors.values()){a.oldX=a.x;a.wantsWalk=false;if(!reduced.matches&&!a.freeze){a.time+=dt;if(a.time%15<7){const direction=Math.floor(a.time/15)%2===0?1:-1;a.x+=direction*dt*7;a.wantsWalk=true;a.node.querySelector('.rig-facing').setAttribute('transform',direction===1?'':'translate(320 0) scale(-1 1)');}}}layout();for(const a of actors.values())pose(a,a.wantsWalk&&Math.abs(a.x-a.oldX)>.0001);}
  requestAnimationFrame(frame);
 }
 new ResizeObserver(layout).observe(host);requestAnimationFrame(frame);window.CarefreePasture={update,markup};
})();
