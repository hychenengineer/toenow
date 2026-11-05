import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),dir=path.join(root,'artifacts/animal-materials/preview-publication');
const prepared=JSON.parse(fs.readFileSync(path.join(dir,'prepared.json'),'utf8'));
for(const [file,expected] of [['snapshot-tests.log','# pass 197'],['snapshot-screens.log','"standalone":40,"iframe":10,"practice":10'],['snapshot-lifecycle.log','Hub iframe receipt → same home PASS']]){
 const source=fs.readFileSync(path.join(dir,file),'utf8');if(!source.includes(expected)||/not ok |AssertionError|TimeoutError/.test(source))throw Error('Verification incomplete: '+file);
}
const gh='https://api.github.com/repos/hychenengineer/toenow';
const ghHeaders={Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
const cf=`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/toenow`;
const cfHeaders={Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`};
async function request(url,headers,method='GET',body){const res=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});const raw=await res.text();const data=raw?JSON.parse(raw):null;if(!res.ok)throw Error(JSON.stringify({status:res.status,message:data?.message,errors:data?.errors}));return data;}
const before=(await request(cf,cfHeaders)).result;
if(before.source.config.preview_deployment_setting!=='none'||before.source.config.production_branch!=='main')throw Error('Cloudflare preview safety gate failed');
const main=await request(gh+'/branches/main',ghHeaders);if(main.commit.sha!==prepared.baseline)throw Error('Remote main moved');
const previousPreview=await fetch(gh+'/branches/preview',{headers:ghHeaders});if(previousPreview.status!==404)throw Error('Preview already exists; inspect before updating');
function git(args,input,extraEnv={}){const r=spawnSync('git',args,{cwd:root,env:{...process.env,...extraEnv},input,encoding:'utf8',windowsHide:true,maxBuffer:20*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout||'git failed');return r.stdout.trim();}
const stagedTree=git(['write-tree'],undefined,{GIT_INDEX_FILE:prepared.index});if(stagedTree!==prepared.tree)throw Error('Prepared tree changed');
const sha=git(['commit-tree',prepared.tree,'-p',prepared.baseline], 'Add animal materials, home construction and current game updates for preview\n\nPublish the tested source snapshot to the preview branch. Keep main and the Cloudflare production deployment unchanged.\n');
const pushEnv={GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+process.env.GITHUB_TOKEN).toString('base64')};
git(['push','origin',`${sha}:refs/heads/preview`],undefined,pushEnv);
const remote=await request(gh+'/branches/preview',ghHeaders);if(remote.commit.sha!==sha)throw Error('Remote preview SHA mismatch');
await request(gh+'/pages',ghHeaders,'PUT',{source:{branch:'preview',path:'/'},build_type:'legacy'});
const pages=await request(gh+'/pages',ghHeaders);if(pages.source.branch!=='preview'||pages.source.path!=='/')throw Error('Pages source mismatch');
const build=await request(gh+'/pages/builds',ghHeaders,'POST');
const after=(await request(cf,cfHeaders)).result;
if(after.canonical_deployment?.id!==before.canonical_deployment?.id||after.source.config.preview_deployment_setting!=='none')throw Error('Cloudflare production changed or preview gate changed');
const evidence={publishedAt:new Date().toISOString(),sha,tree:prepared.tree,main:prepared.baseline,pagesUrl:pages.html_url,pagesSource:pages.source,cloudflareProduction:after.canonical_deployment.id,cloudflarePreviewSetting:after.source.config.preview_deployment_setting,buildRequested:true,changedFiles:prepared.paths};
fs.writeFileSync(path.join(dir,'publication.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({sha,pagesUrl:pages.html_url,pagesSource:pages.source,cloudflareProductionUnchanged:true,buildRequested:true}));
