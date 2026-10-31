(function(){
 'use strict';
 const host=document.getElementById('animals'),actors=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let decorations='',previous=0;
 const source=(species,pose)=>'../../assets/carefree-farm/motion/'+(pose===1||pose===2?'walk-v2/':'')+species+'-'+pose+'.webp';
 function update(state,selected,t){
  for(const [i,actor] of actors)if(i>=state.animals.length){actor.node.remove();actors.delete(i);}
  state.animals.forEach((animal,i)=>{
   let a=actors.get(i);
   if(!a){const node=document.createElement('button');node.className='roaming-animal';node.dataset.animal=i;node.innerHTML='<span class="animal-shadow"></span><img alt=""><span class="animal-name"></span><span class="pasture-gift"></span>';host.append(node);a={node,x:0,time:i*2.7,pose:-1,freeze:false};actors.set(i,a);node.addEventListener('pointerenter',()=>a.freeze=true);node.addEventListener('pointerleave',()=>a.freeze=false);node.addEventListener('focus',()=>a.freeze=true);node.addEventListener('blur',()=>a.freeze=false);}
   a.animal=animal;a.node.classList.toggle('baby',animal.growth<3);a.node.classList.toggle('selected',i===selected);a.node.setAttribute('aria-pressed',String(i===selected));const name=i===0?t('Cotton'):t(CarefreeFarm.ANIMALS[animal.species].name)+' '+(i+1);a.node.setAttribute('aria-label',name+' · '+t(animal.growth<3?'Baby':'Grown up'));a.node.querySelector('.animal-name').textContent=name;a.node.querySelector('.pasture-gift').textContent=animal.gift?'🎁':animal.ready?'✦':'';
   a.node.querySelector('img').src=source(animal.species,0);a.pose=0;
  });
  const next=state.decorations.join(',');if(next!==decorations){decorations=next;host.querySelectorAll('.pasture-decoration').forEach(n=>n.remove());for(const id of state.decorations){const n=document.createElement('div');n.className='pasture-decoration decor-'+id;n.setAttribute('role','img');n.setAttribute('aria-label',t(CarefreeFarm.DECORATIONS[id].name));n.innerHTML={flowerbed:'<i>✿</i><i>✿</i><i>✿</i><i>✿</i><i>✿</i>',picnic:'<span>🧺</span>',pond:'<span>🦆</span>',arch:'<span>❀</span><span>❀</span>'}[id];host.prepend(n);}}
  layout();
 }
 function layout(){const width=host.clientWidth,columns=Math.max(1,Math.min(4,Math.floor((width-24)/142))),rows=Math.ceil(actors.size/columns);host.style.height=(Math.max(2,rows)*130+115)+'px';for(const [i,a]of actors){const count=Math.min(columns,actors.size-Math.floor(i/columns)*columns),cell=(width-34)/count;a.x=Math.max(-Math.max(0,Math.min(24,(cell-130)/2-3)),Math.min(Math.max(0,Math.min(24,(cell-130)/2-3)),a.x));a.node.style.left=(17+cell*((i%columns)+.5)-65+a.x)+'px';a.node.style.top=(65+Math.floor(i/columns)*130)+'px';a.node.style.zIndex=String(10+Math.floor(i/columns));}}
 function frame(time){const dt=Math.min(.05,(time-previous)/1000||0);previous=time;const active=!document.hidden&&!host.closest('[hidden]')&&document.getElementById('farm-app').dataset.state==='playing'&&!document.querySelector('dialog[open]');if(active){for(const a of actors.values()){let pose=0;if(!reduced.matches&&!a.freeze){a.time+=dt;const phase=a.time%15;if(phase<7){const direction=Math.floor(a.time/15)%2===0?1:-1;a.x+=direction*dt*7;a.x=Math.max(-24,Math.min(24,a.x));pose=1+Math.floor(a.time*5)%2;a.node.querySelector('img').style.transform='scaleX('+direction+')';}else if(phase<12)pose=3;}if(pose!==a.pose){a.node.querySelector('img').src=source(a.animal.species,pose);a.pose=pose;}}layout();}requestAnimationFrame(frame);}
 new ResizeObserver(layout).observe(host);requestAnimationFrame(frame);window.CarefreePasture={update};
})();
