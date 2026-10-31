// Extract fifteen disjoint puppet parts from the generated atlas without repainting them.
// Body and limbs are assembled and animated by the pasture renderer.
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../assets/carefree-farm/rig-v1');
(async()=>{
 const {data,info}=await sharp(path.join(dir,'source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info,labels=new Int32Array(width*height),queue=new Int32Array(width*height),parts=[];
 for(let p=0;p<labels.length;p++){
  if(labels[p]||data[p*4+3]<8)continue;const id=parts.length+1;let head=0,tail=1,x0=width,x1=0,y0=height,y1=0;queue[0]=p;labels[p]=id;
  while(head<tail){const n=queue[head++],x=n%width,y=Math.floor(n/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(const k of [x?n-1:-1,x<width-1?n+1:-1,n-width,n+width])if(k>=0&&k<labels.length&&!labels[k]&&data[k*4+3]>=8){labels[k]=id;queue[tail++]=k;}
  }parts.push({id,count:tail,x0,x1,y0,y1});
 }

 const large=parts.filter(p=>p.count>10000).sort((a,b)=>a.y0-b.y0);if(large.length!==15)throw Error('Expected fifteen separate rig parts');
 for(let row=0;row<5;row++){const group=large.slice(row*3,row*3+3).sort((a,b)=>a.x0-b.x0),species=['sheep','horse','cow','alpaca','llama'][row];for(let i=0;i<3;i++){const p=group[i],w=p.x1-p.x0+5,h=p.y1-p.y0+5,buf=Buffer.alloc(w*h*4);for(let y=p.y0-1;y<=p.y1+1;y++)for(let x=p.x0-1;x<=p.x1+1;x++){const n=y*width+x;let belongs=labels[n]===p.id;if(!belongs&&data[n*4+3]<8)for(const k of [n-1,n+1,n-width,n+width])if(labels[k]===p.id)belongs=true;if(belongs)data.copy(buf,((y-p.y0+2)*w+x-p.x0+2)*4,n*4,n*4+4);}await sharp(buf,{raw:{width:w,height:h,channels:4}}).webp({quality:92}).toFile(path.join(dir,species+'-'+['body','front','hind'][i]+'.webp'));}}
 console.log('Extracted five bodies and ten limb sprites.');
})().catch(e=>{console.error(e);process.exitCode=1;});
