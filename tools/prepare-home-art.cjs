// Copy canonical generated sources and convert format only; no background removal.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),sharp=require('sharp');
const records=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../artifacts/all-animal-homes/generated-art.json')));
(async()=>{for(const record of records){if(!record.path)throw Error('Missing generated image '+record.species+'/'+record.kind);
 const dir=path.resolve(__dirname,'../assets/animal-homes',record.species),source='sources/'+record.kind+'.png',runtime=record.kind+'.webp';fs.mkdirSync(path.join(dir,'sources'),{recursive:true});
 const data=fs.readFileSync(record.path),sha256=crypto.createHash('sha256').update(data).digest('hex'),target=path.join(dir,source);
 if(fs.existsSync(target)){if(crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')!==sha256)throw Error('Preserve existing source '+target);}else fs.copyFileSync(record.path,target);
 if(!fs.existsSync(path.join(dir,runtime)))await sharp(data).webp({quality:88,alphaQuality:100}).toFile(path.join(dir,runtime));
 const meta=await sharp(data).metadata();if(record.kind==='buildings'&&Math.abs(meta.width/meta.height-1.5)>.03)throw Error('Atlas cells are not square: '+record.species);
 const stats=await sharp(data).ensureAlpha().raw().toBuffer({resolveWithObject:true});let transparent=0;for(let i=3;i<stats.data.length;i+=4)if(stats.data[i]===0)transparent++;
 const manifestPath=path.join(dir,'manifest.json'),manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):{generator:'OpenAI imagegen (built-in)',assets:[]};
 manifest.assets=manifest.assets.filter(a=>a.kind!==record.kind);manifest.assets.push({kind:record.kind,source,runtime,sourceImage:path.basename(record.path),width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha,transparentFraction:transparent/(meta.width*meta.height),sha256,prompt:record.prompt});fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');console.log(record.species+'/'+runtime+' '+meta.width+'x'+meta.height);
}})().catch(e=>{console.error(e);process.exitCode=1;});
