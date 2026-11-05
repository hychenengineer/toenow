const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const dir=__dirname,p=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json')));
const main='c1e2572b0e58a69909823058389173b86fb7c36c',production='fcc91c4f-7199-4ff7-bd58-d717f6d56cdc';
const gh='https://api.github.com/repos/hychenengineer/toenow',cf=`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/toenow`;
const ghHeaders={Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const cfHeaders={Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`};
async function get(url,headers){const r=await fetch(url,{headers});if(!r.ok)throw Error('API status '+r.status);return r.json();}
function git(args,input,extra={}){const r=spawnSync('git',args,{input,encoding:'utf8',env:{...process.env,...extra},windowsHide:true,maxBuffer:20e6});if(r.status)throw Error(r.stderr);return r.stdout.trim();}
(async()=>{
 for(const [file,expected] of [['snapshot-tests.log','# pass 217'],['snapshot-browser.log','animal-rescue-train: art, varied chat']]){const text=fs.readFileSync(path.join(dir,file),'utf8');if(!text.includes(expected)||/AssertionError|TimeoutError|not ok /.test(text))throw Error('Checks incomplete '+file);}
 const browserProof=JSON.parse(fs.readFileSync(path.join(dir,'snapshot/artifacts/all-animal-homes/browser/results.json')));if(browserProof.homes.length!==10||browserProof.checks.length!==12||browserProof.errors.length)throw Error('Incomplete ten-home snapshot browser proof');const artProof=JSON.parse(fs.readFileSync(path.join(dir,'art-verification.json')));if(artProof.count!==18)throw Error('Incomplete art proof');
 const [m,b,pages,cloud]=await Promise.all([get(gh+'/branches/main',ghHeaders),get(gh+'/branches/preview',ghHeaders),get(gh+'/pages',ghHeaders),get(cf,cfHeaders)]);
 if(m.commit.sha!==main||b.commit.sha!==p.base||pages.source.branch!=='preview'||cloud.result.source.config.preview_deployment_setting!=='none'||cloud.result.canonical_deployment.id!==production)throw Error('Publication baseline moved');
 if(git(['write-tree'],undefined,{GIT_INDEX_FILE:p.index})!==p.tree)throw Error('Tree moved');
 const sha=git(['commit-tree',p.tree,'-p',p.base],'[CF-Pages-Skip] Complete all ten interactive animal homes\n\nThemed home scenes, contextual chat, visible building and decoration for every explorer game. Preview only.\n');
 git(['push','origin',`${sha}:refs/heads/preview`],undefined,{GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+process.env.GITHUB_TOKEN).toString('base64')});
 if((await get(gh+'/branches/preview',ghHeaders)).commit.sha!==sha)throw Error('Remote SHA mismatch');
 if(crypto.createHash('sha256').update(fs.readFileSync('.git/index')).digest('hex')!==p.realIndex)throw Error('Real index changed');
 const result={sha,base:p.base,main,cloudflareProduction:production,pagesUrl:pages.html_url,version:'animal-homes-20261027-1',pushedAt:new Date().toISOString()};fs.writeFileSync(path.join(dir,'publication.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
