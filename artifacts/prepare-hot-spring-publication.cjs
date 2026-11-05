// Assemble an isolated Git index; never stage/reset the user's actual index.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=process.argv[2];if(!out||fs.existsSync(out))throw Error('Need a fresh output directory');fs.mkdirSync(out,{recursive:true});
const env={...process.env,GIT_INDEX_FILE:path.join(out,'publication.index')};
const git=(args,input)=>execFileSync('git',args,{cwd:root,env,input,encoding:'utf8',maxBuffer:20e6});
const baseline=git(['rev-parse','origin/preview']).trim();git(['read-tree',baseline]);
const local=f=>fs.readFileSync(path.join(root,f),'utf8'),base=f=>git(['show',baseline+':'+f]);
function blob(file,content){const hash=execFileSync('git',['hash-object','-w','--stdin'],{cwd:root,input:content,encoding:'utf8'}).trim();git(['update-index','--add','--cacheinfo','100644',hash,file]);}
function selected(file,predicate){const diff=git(['diff','--no-ext-diff',baseline,'--',file]);const at=diff.indexOf('@@ ');if(at<0)return;const head=diff.slice(0,at),hunks=diff.slice(at).split(/(?=^@@ )/m).filter(Boolean).filter(predicate);if(hunks.length)git(['apply','--cached','--whitespace=nowarn','-'],head+hunks.join(''));}
for(const f of ['games/capybara-drift/index.html','games/capybara-drift/garden-model.js','games/capybara-drift/garden-renderer.js','games/capybara-drift/garden-main.js','games/capybara-drift/garden.css','shared/toenow-screens.js','tests/toenow-screens.test.cjs','tests/practice-mode.test.cjs','tests/capybara-garden.test.cjs','tools/verify-hot-spring-garden.cjs','docs/CAPYBARA_HOT_SPRING_GARDEN_RUN_REPORT.md','docs/superpowers/plans/2026-10-29-hot-spring-garden.md'])blob(f,fs.readFileSync(path.join(root,f)));
blob('assets/capybara-hot-spring-garden-preview.png',fs.readFileSync(path.join(root,'assets/capybara-hot-spring-garden-preview.png')));
selected('index.html',h=>/carefree-entry|id: 'capybara-drift'|originals.forEach|Relax visits/.test(h));
selected('shared/toenow-sdk.js',h=>h.includes("this.category !== 'relax'"));
selected('shared/toenow-screen-config.js',h=>h.includes('CAPYBARA HOT SPRING GARDEN'));
const catalog=local('shared/toenow-i18n-games-b.js'),start=catalog.indexOf('  const entries = {')+'  const entries = {'.length,end=catalog.indexOf("    'The grid gets");if(end<start)throw Error('Catalog marker');blob('shared/toenow-i18n-games-b.js',base('shared/toenow-i18n-games-b.js').replace('  const entries = {','  const entries = {'+catalog.slice(start,end)));
blob('package.json',base('package.json').replace('"scripts": {','"scripts": {\n    "pretest": "node --test tests/capybara-garden.test.cjs",'));
// Runtime mocks do not emulate canvas/dialogs; real browser checks cover the garden.
let runtime=base('tests/games-runtime.test.cjs');const marker='    // Verify HTML contains title-best-level or title record';runtime=runtime.replace(marker,"    if(game.id==='capybara-drift'){assert.ok(existingIds.has('garden'));assert.equal(require('../shared/toenow-screen-config.js')[game.id].presentation,'visit');return;}\n"+marker);blob('tests/games-runtime.test.cjs',runtime);
const browser=local('tools/verify-shared-screens-browser.cjs'),a=browser.indexOf("      if(c.presentation==='visit'){"),b=browser.indexOf("      const journey =",a),loop="    for (const [id,c] of Object.entries(catalog).filter(([id])=>!process.env.TOENOW_TEST_GAMES || process.env.TOENOW_TEST_GAMES.split(',').includes(id))) {";if(a<0||b<a)throw Error('Browser markers');blob('tools/verify-shared-screens-browser.cjs',base('tools/verify-shared-screens-browser.cjs').replace(loop,loop+'\n'+browser.slice(a,b)));
git(['diff','--cached','--check']);const tree=git(['write-tree']).trim();const prefix=path.join(out,'site')+path.sep;fs.mkdirSync(prefix);git(['checkout-index','--all','--prefix='+prefix]);console.log(JSON.stringify({baseline,tree,site:prefix}));console.log(git(['diff','--cached','--stat']));
