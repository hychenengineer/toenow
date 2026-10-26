const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const state=JSON.parse(fs.readFileSync('artifacts/game-ui-publication-state.json','utf8'));
const command=JSON.parse(fs.readFileSync(path.join(state.snapshot,'package.json'),'utf8')).scripts.test.split(/\s+/);
const result=cp.spawnSync(process.execPath,command.slice(1),{cwd:state.snapshot,encoding:'utf8',windowsHide:true,maxBuffer:12*1024*1024});
fs.writeFileSync('artifacts/game-ui-publication-npm.log',(result.stdout||'')+(result.stderr||''));
console.log((result.stdout||'').split(/\r?\n/).slice(-13).join('\n'));
if(result.error)throw result.error;
if(result.status!==0)throw Error('Snapshot tests failed: '+result.status);
