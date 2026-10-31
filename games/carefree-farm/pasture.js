(function(){
 'use strict';
 const P=window.PIXI,host=document.getElementById('animals'),actors=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');canvas.className='pasture-canvas';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
 const rigs={
  sheep:{body:[35,25,250,165],top:164,bottom:249,front:218,hind:91,width:48},
  horse:{body:[20,16,275,165],top:139,bottom:249,front:206,hind:106,width:46},
  cow:{body:[20,18,275,155],top:148,bottom:249,front:219,hind:101,width:50},
  alpaca:{body:[35,0,250,184],top:158,bottom:249,front:224,hind:90,width:46},
  llama:{body:[35,0,250,192],top:166,bottom:249,front:222,hind:100,width:46}
 };
 const feet=[['hind-right','hind',-13,.25],['front-right','front',-13,.75],['hind-left','hind',7,.5],['front-left','front',7,0]];
 let app=null,textures=null,decorations='',previous=0,raf=0,disposed=false,renderError='';
 const asset=(species,part)=>'../../assets/carefree-farm/rig-v1/'+species+'-'+part+'.webp';
 function createMesh(texture,width,height){
  const positions=new Float32Array(20),uvs=new Float32Array(20),indices=[];
  for(let row=0;row<5;row++){uvs[row*4]=0;uvs[row*4+1]=row/4;uvs[row*4+2]=1;uvs[row*4+3]=row/4;if(row<4){const i=row*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}}
  const mesh=new P.Mesh({texture,geometry:new P.MeshGeometry({positions,uvs,indices:new Uint32Array(indices)})});
  return {mesh,positions,width,height,dx:0,lift:0};
 }
 function build(a){
  if(!textures?.[a.species]?.hind||!app)return;if(a.root)a.root.destroy({children:true});
  const r=rigs[a.species];a.root=new P.Container();a.shadow=new P.Graphics();a.root.addChild(a.shadow);a.facing=new P.Container();a.root.addChild(a.facing);a.legs=[];
  for(const [name,part,offset,phase]of feet){const far=name.endsWith('right'),leg=createMesh(textures[a.species][part],r.width*(far?.9:1),r.bottom-r.top-(far?4:0));Object.assign(leg,{name,phase,far,x:r[part]+offset,y:r.top});leg.mesh.position.set(leg.x,leg.y);if(far)leg.mesh.tint=0xb6aa96;a.facing.addChild(leg.mesh);a.legs.push(leg);}
  const [x,y,w,h]=r.body;a.body=new P.Sprite(textures[a.species].body);a.body.position.set(x,y);a.body.width=w;a.body.height=h;a.facing.addChild(a.body);app.stage.addChild(a.root);pose(a,0);layout();
 }
 function pose(a,dt){
  if(!a.legs)return;
  const target=a.walking?1:0;a.strength=reduced.matches?0:a.strength+(target-a.strength)*Math.min(1,dt*14);
  if(a.walking)a.gait+=dt/1.25;
  for(const leg of a.legs){const phase=(a.gait+leg.phase)%1,swing=phase>=.65,q=swing?(phase-.65)/.35:phase/.65;
   leg.dx=(swing?-7.2+14.4*q*q*(3-2*q):7.2-14.4*q)*a.strength;leg.lift=(swing?Math.sin(Math.PI*q)*2.2:0)*a.strength;
   for(let row=0;row<5;row++){const t=row/4,shift=leg.dx*t+(row===2?leg.lift*.35:0),half=leg.width/2*[1,.9,.8,.8,.92][row],y=leg.height*t-leg.lift*t*t;leg.positions[row*4]=shift-half;leg.positions[row*4+1]=y;leg.positions[row*4+2]=shift+half;leg.positions[row*4+3]=y;}
   leg.mesh.geometry.getBuffer('aPosition').update();
  }
  a.facing.scale.x=a.direction;a.facing.position.x=a.direction===1?0:320;
 }
 function update(state,selected,t){
  for(const [i,a]of actors)if(i>=state.animals.length){a.root?.destroy({children:true});a.node.remove();actors.delete(i);}
  state.animals.forEach((animal,i)=>{let a=actors.get(i);if(!a){const node=document.createElement('button');node.className='roaming-animal';node.dataset.animal=i;node.innerHTML='<span class="animal-shadow"></span><span class="animal-name"></span><span class="pasture-gift"></span>';host.append(node);a={node,x:0,time:i*2.7,gait:i*.17,strength:0,walking:false,direction:1,freeze:false};actors.set(i,a);node.addEventListener('pointerenter',()=>a.freeze=true);node.addEventListener('pointerleave',()=>a.freeze=false);node.addEventListener('focus',()=>a.freeze=true);node.addEventListener('blur',()=>a.freeze=false);}
   a.animal=animal;a.selected=i===selected;a.node.classList.toggle('baby',animal.growth<3);a.node.classList.toggle('selected',i===selected);a.node.setAttribute('aria-pressed',String(i===selected));const name=i===0?t('Cotton'):t(CarefreeFarm.ANIMALS[animal.species].name)+' '+(i+1);a.node.setAttribute('aria-label',name+' · '+t(animal.growth<3?'Baby':'Grown up'));a.node.querySelector('.animal-name').textContent=name;a.node.querySelector('.pasture-gift').textContent=animal.gift?'🎁':animal.ready?'✦':'';
   if(a.species!==animal.species){a.species=animal.species;build(a);}if(renderError&&!a.node.querySelector('.pasture-fallback')){const img=document.createElement('img');img.className='pasture-fallback';img.src='../../assets/carefree-farm/'+a.species+'.webp';img.alt='';a.node.prepend(img);}
  });
  const next=state.decorations.join(',');if(next!==decorations){decorations=next;host.querySelectorAll('.pasture-decoration').forEach(n=>n.remove());for(const id of state.decorations){const n=document.createElement('div');n.className='pasture-decoration decor-'+id;n.setAttribute('role','img');n.setAttribute('aria-label',t(CarefreeFarm.DECORATIONS[id].name));n.innerHTML={flowerbed:'<i>✿</i><i>✿</i><i>✿</i><i>✿</i><i>✿</i>',picnic:'<span>🧺</span>',pond:'<span>🦆</span>',arch:'<span>❀</span><span>❀</span>'}[id];host.prepend(n);}}
  layout();
 }
 function layout(){const width=host.clientWidth,columns=Math.max(1,Math.min(4,Math.floor((width-24)/142))),rows=Math.ceil(actors.size/columns),height=Math.max(2,rows)*130+115;host.style.height=height+'px';
  if(app?.renderer&&width>0&&(app.screen.width!==width||app.screen.height!==host.clientHeight))app.renderer.resize(width,host.clientHeight);
  for(const [i,a]of actors){const count=Math.min(columns,actors.size-Math.floor(i/columns)*columns),cell=(width-34)/count,limit=Math.max(0,Math.min(24,(cell-130)/2-3));a.x=Math.max(-limit,Math.min(limit,a.x));const x=17+cell*((i%columns)+.5)-65+a.x,y=65+Math.floor(i/columns)*130;a.node.style.left=x+'px';a.node.style.top=y+'px';a.node.style.zIndex=String(10+Math.floor(i/columns));if(a.root){a.shadow.clear().ellipse(160,251,83,10).fill({color:0x435c3a,alpha:.16});if(a.selected)a.shadow.ellipse(160,251,88,13).stroke({color:0xfff4b9,width:2,alpha:.9});const scale=110/280*(a.animal.growth<3?.8:1);a.root.scale.set(scale);a.root.position.set(x+65-160*scale,y+110-280*scale);a.root.zIndex=Math.floor(i/columns);}}
 }
 function frame(time){const dt=Math.min(.05,(time-previous)/1000||0);previous=time;const active=!document.hidden&&!host.closest('[hidden]')&&document.getElementById('farm-app').dataset.state==='playing'&&!document.querySelector('dialog[open]');
  if(active){for(const a of actors.values()){a.oldX=a.x;a.wantsWalk=false;if(!reduced.matches&&!a.freeze){a.time+=dt;if(a.time%15<7){a.direction=Math.floor(a.time/15)%2===0?1:-1;a.x+=a.direction*dt*7;a.wantsWalk=true;}}}layout();for(const a of actors.values()){a.walking=a.wantsWalk&&Math.abs(a.x-a.oldX)>.0001;a.node.dataset.walking=String(a.walking);pose(a,dt);}}
  if(app?.renderer&&!host.closest('[hidden]')&&!document.hidden)app.render();if(!disposed)raf=requestAnimationFrame(frame);
 }
 const observer=new ResizeObserver(layout);observer.observe(host);
 const ready=(async()=>{try{app=new P.Application();await app.init({canvas,preference:'webgl',autoStart:false,antialias:true,backgroundAlpha:0,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true,preserveDrawingBuffer:true});app.stage.sortableChildren=true;const loaded={};
   await Promise.all(Object.keys(rigs).map(async species=>{const parts=await Promise.all(['body','front','hind'].map(part=>P.Assets.load(asset(species,part))));loaded[species]={body:parts[0]};for(let i=1;i<3;i++){const t=parts[i],top=Math.round(t.height*.38);loaded[species][i===1?'front':'hind']=new P.Texture({source:t.source,frame:new P.Rectangle(0,top,t.width,t.height-top)});}}));
   if(disposed){if(app?.renderer)app.destroy(false,{children:true});app=null;return;}textures=loaded;canvas.dataset.renderer='pixi-webgl';host.classList.add('pixi-ready');for(const a of actors.values())build(a);layout();app.render();
  }catch(error){renderError=String(error);canvas.dataset.renderer='unavailable';if(app?.renderer)app.destroy(false,{children:true});app=null;textures=null;for(const a of actors.values()){a.root=null;a.legs=null;const img=document.createElement('img');img.className='pasture-fallback';img.src='../../assets/carefree-farm/'+a.species+'.webp';img.alt='';a.node.prepend(img);}}
 })();
 raf=requestAnimationFrame(frame);window.addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();if(app?.renderer)app.destroy(false,{children:true});});
 window.CarefreePasture={update,ready,inspect:()=>({renderer:canvas.dataset.renderer,error:renderError,animals:[...actors.values()].map(a=>({species:a.species,x:a.x,walking:a.walking,legs:(a.legs||[]).map(l=>({name:l.name,dx:l.dx,lift:l.lift,ground:l.y+l.height,vertices:Array.from(l.positions)}))}))})};
})();
