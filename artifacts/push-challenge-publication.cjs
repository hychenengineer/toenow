const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const statePath='artifacts/challenge-publication-state.json',state=JSON.parse(fs.readFileSync(statePath,'utf8'));
const git=args=>cp.execFileSync('git',args,{encoding:'utf8'}).trim();
function check(file,count,pattern){
 const log=fs.readFileSync(file,'utf8');
 if(/AssertionError|TimeoutError|not ok \d/.test(log)||(log.match(pattern)||[]).length!==count)throw Error('Incomplete verification: '+file);
}
check(path.join(state.snapshot,'artifacts/publication-npm.log'),1,/# pass 167/g);
for(const file of ['publication-ball.log','publication-wave-clear.log','publication-flash.log'])check(path.join(state.snapshot,'artifacts',file),4,/^PASS /gm);
const originalSnapshot='C:/Users/HSINYU~1/AppData/Local/Temp/toenow-challenges-publish-vAFGB4/snapshot';
check(path.join(originalSnapshot,'artifacts/publication-launch.log'),20,/^PASS:/gm);
check(path.join(originalSnapshot,'artifacts/publication-shared-screens.log'),1,/\{"standalone":36,"iframe":9,"practice":9\}/g);
const revised=git(['diff','--name-only','8ba5e0587efc0e5986821ca8ee557b78f72a6393',state.tree]).split('\n').sort();
if(JSON.stringify(revised)!==JSON.stringify(['tools/verify-ball-memory-browser.cjs','tools/verify-flash-progressive-browser.cjs','tools/verify-flash-wave-clear-browser.cjs']))throw Error('Runtime changed since full matrix');
const paths=git(['diff','--name-only',state.base,state.tree]).split('\n').sort();
if(JSON.stringify(paths)!==JSON.stringify(state.files))throw Error('Unexpected publication paths');
const remote=git(['ls-remote','origin','refs/heads/main']).split(/\s/)[0];
if(remote!==state.base)throw Error('Remote advanced; rebuild and verify publication');
state.originalHead=git(['rev-parse','HEAD']);state.originalBranch=git(['branch','--show-current']);
state.originalIndex=git(['write-tree']);
state.commit=git(['commit-tree',state.tree,'-p',state.base,'-m','Fix island launch transitions and animal memory guidance']);
fs.writeFileSync(statePath,JSON.stringify(state,null,2));
cp.execFileSync('git',['push','origin',state.commit+':refs/heads/main'],{stdio:'inherit'});
const published=git(['ls-remote','origin','refs/heads/main']).split(/\s/)[0];
if(published!==state.commit)throw Error('Remote commit verification failed');
if(git(['rev-parse','HEAD'])!==state.originalHead||git(['branch','--show-current'])!==state.originalBranch||git(['write-tree'])!==state.originalIndex)throw Error('Original checkout changed');
state.published=true;state.checks={node:167,launch:20,shared:{standalone:36,iframe:9,practice:9},focusedLanguageSizeMatrices:12};
fs.writeFileSync(statePath,JSON.stringify(state,null,2));
console.log(JSON.stringify({commit:state.commit,remote:published,branch:'main',preservedCheckout:state.originalBranch,files:paths.length,checks:state.checks},null,2));
