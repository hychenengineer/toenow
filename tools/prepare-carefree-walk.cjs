// Extract the ten disjoint sprites from the generated atlas without repainting them.
// Shared head anchors keep each pair aligned even though raised hooves change its bounds.
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../assets/carefree-farm/motion/walk-v2');
(async()=>{
 const {data,info}=await sharp(path.join(dir,'source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info,labels=new Int32Array(width*height),queue=new Int32Array(width*height),parts=[];
 for(let p=0;p<labels.length;p++){
  if(labels[p]||data[p*4+3]<8)continue;const id=parts.length+1;let head=0,tail=1,x0=width,x1=0,y0=height,y1=0;queue[0]=p;labels[p]=id;
  while(head<tail){const n=queue[head++],x=n%width,y=Math.floor(n/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const k of [x?n-1:-1,x<width-1?n+1:-1,n-width,n+width])if(k>=0&&k<labels.length&&!labels[k]&&data[k*4+3]>=8){labels[k]=id;queue[tail++]=k;}
  }parts.push({id,count:tail,x0,x1,y0,y1});
 }
 const large=parts.filter(p=>p.count>10000).sort((a,b)=>a.y0-b.y0);if(large.length!==10)throw Error('Expected ten distinct animal sprites');
 for(let row=0;row<5;row++){
  const pair=large.slice(row*2,row*2+2).sort((a,b)=>a.x0-b.x0),species=['sheep','pig','cow','alpaca','llama'][row];
  for(const part of pair){part.anchor=0;for(let y=part.y0;y<part.y0+(part.y1-part.y0)*.45;y++)for(let x=part.x0;x<=part.x1;x++)if(labels[y*width+x]===part.id)part.anchor=Math.max(part.anchor,x);}
  const left=Math.min(...pair.map(p=>p.x0-p.anchor))-2,right=Math.max(...pair.map(p=>p.x1-p.anchor))+2,w=right-left+1,h=Math.max(...pair.map(p=>p.y1-p.y0))+5;
  for(let pose=0;pose<2;pose++){
   const part=pair[pose],buffer=Buffer.alloc(w*h*4);
   for(let y=Math.max(0,part.y0-1);y<=Math.min(height-1,part.y1+1);y++)for(let x=Math.max(0,part.x0-1);x<=Math.min(width-1,part.x1+1);x++){
    const n=y*width+x;let belongs=labels[n]===part.id;
    if(!belongs&&data[n*4+3]<8)for(const k of [n-1,n+1,n-width,n+width])if(labels[k]===part.id)belongs=true;
    if(belongs){const dx=x-part.anchor-left,dy=y-part.y0+2;if(dx>=0&&dx<w&&dy>=0&&dy<h)data.copy(buffer,(dy*w+dx)*4,n*4,n*4+4);}
   }
   await sharp(buffer,{raw:{width:w,height:h,channels:4}}).resize(256,256,{fit:'contain',position:'south',background:{r:0,g:0,b:0,alpha:0}}).extend({top:12,bottom:12,left:12,right:12,background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90}).toFile(path.join(dir,species+'-'+(pose+1)+'.webp'));
  }
 }console.log('Extracted five aligned pairs with distinct front-leg poses.');
})().catch(e=>{console.error(e);process.exitCode=1;});
