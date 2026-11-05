const fs=require('fs'),assert=require('assert/strict');
const p=JSON.parse(fs.readFileSync(__dirname+'/publication.json'));
const gh='https://api.github.com/repos/hychenengineer/toenow',cf=`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/toenow`;
const ghHeaders={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},cfHeaders={Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN};
async function get(url,headers){const r=await fetch(url,{headers});assert(r.ok);return r.json();}
(async()=>{const [build,main,preview,project,deployments]=await Promise.all([get(gh+'/pages/builds/latest',ghHeaders),get(gh+'/branches/main',ghHeaders),get(gh+'/branches/preview',ghHeaders),get(cf,cfHeaders),get(cf+'/deployments?per_page=5',cfHeaders)]);
 assert.equal(build.commit,p.sha);assert.equal(build.status,'built');assert.equal(main.commit.sha,p.main);assert.equal(preview.commit.sha,p.sha);assert.equal(project.result.canonical_deployment.id,p.cloudflareProduction);assert.equal(project.result.source.config.preview_deployment_setting,'none');
 const deployment=deployments.result.find(d=>d.deployment_trigger.metadata.commit_hash===p.sha);assert(deployment?.is_skipped);assert(deployment.stages.every(s=>s.status==='idle'));
 const result={checkedAt:new Date().toISOString(),commit:p.sha,pagesBuilt:true,mainUnchanged:true,cloudflareProductionUnchanged:true,cloudflareSkipped:true,skipReason:deployment.skip_reason};fs.writeFileSync(__dirname+'/deployment-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
