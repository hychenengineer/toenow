const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webm':'video/webm','.json':'application/json'};
http.createServer((req,res)=>{
 try{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  const size=fs.statSync(file).size;
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
  const range=req.headers.range;
  if(range){
   const match=/^bytes=(\d+)-(\d*)$/.exec(range);
   if(!match){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
   const start=Number(match[1]),end=Math.min(match[2]?Number(match[2]):size-1,size-1);
   if(start> end){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
   res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${size}`});
   fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }else{res.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);}
 }catch{res.writeHead(404).end('Not found');}
}).listen(8776,'127.0.0.1',()=>console.log('http://127.0.0.1:8776/artifacts/hub-preview-sample/'));
