const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=process.cwd();
const git=(args,options={})=>cp.execFileSync('git',args,{cwd:root,...options});
const base=git(['rev-parse','origin/main']).toString().trim();
const original=file=>git(['show',`${base}:${file}`]).toString().replace(/\r\n/g,'\n');
const current=file=>fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const babel=require('C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
function functionSource(source,name){
  const ast=babel.babelParse(source,'publication.js',false);let result;
  babel.traverse(ast,{FunctionDeclaration(node){if(node.node.id?.name===name){if(result)throw Error('Duplicate function '+name);result=source.slice(node.node.start,node.node.end);}}});
  if(!result)throw Error('Missing function '+name);return result;
}
function replaceOnce(source,from,to){
  if(!source.includes(from)||source.indexOf(from)!==source.lastIndexOf(from))throw Error('Ambiguous replacement: '+from.slice(0,80));
  return source.replace(from,to);
}
const shipped=new Map();
const files=['index.html','assets/toenow-tutorials.css','shared/toenow-island.js','shared/toenow-i18n-core.js','shared/toenow-i18n-animals.js','shared/toenow-i18n-games-a.js','shared/toenow-tutorial-config.js','shared/toenow-tutorials.js',
 'games/flash-brain/index.html','games/flash-brain/tutorial.js','games/flash-brain/assets/index-cr-6j3L1.js','games/flash-brain/wave-clear.js','games/flash-brain/wave-clear.css',
 'tests/flash-brain.test.cjs','tests/flash-progressive-tutorial.test.cjs',
 'tools/verify-tutorials-browser.cjs','tools/verify-flash-priority-notice-browser.cjs','tools/verify-game-launch-browser.cjs','tools/verify-flash-progressive-browser.cjs','tools/verify-flash-wave-clear-browser.cjs','tools/verify-ball-memory-browser.cjs'];
for(const file of files)shipped.set(file,current(file));
let html=original('games/ball-track/index.html');
const main=current('games/ball-track/main.js'),renderer=current('games/ball-track/renderer.js');
const script=()=>[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(text=>text.includes('(function ()'));
for(const name of ['getPlayboardGeometry','setBodyState','updateSimulation'])html=replaceOnce(html,functionSource(script(),name),functionSource(main,name));
for(const name of ['drawTargetLineupPanel','drawShellCapsule'])html=replaceOnce(html,functionSource(script(),name),functionSource(renderer,name).replace(/\bscene\./g,''));
const lineup=functionSource(script(),'enterLineupPhase');
html=replaceOnce(html,lineup,lineup+'\n\n        '+functionSource(main,'confirmMemory')+"\n        btnConfirmMemory.addEventListener('click',confirmMemory);");
html=replaceOnce(html,"const btnOverdrive = document.getElementById('btn-overdrive');","const btnOverdrive = document.getElementById('btn-overdrive');\n        const btnConfirmMemory = document.getElementById('btn-confirm-memory');");
const registration=source=>source.slice(source.indexOf("window.ToenowTutorials?.register?.('ball-track', {"),source.indexOf('        // Initialize',source.indexOf("window.ToenowTutorials?.register?.('ball-track', {"))).trimEnd();
html=replaceOnce(html,registration(html),registration(main));
const oldButton=`<button class="overdrive-btn" id="btn-overdrive" type="button" aria-label="Hold Shift for Overdrive">\n          <span id="overdrive-btn-label">HOLD [SHIFT] FOR OVERDRIVE</span>`;
const newButton=`<button class="overdrive-btn" id="btn-confirm-memory" type="button" hidden>I remember — start moving</button>\n        <button class="overdrive-btn" id="btn-overdrive" type="button" aria-label="Hold Shift or this button to accelerate">\n          <span id="overdrive-btn-label">HOLD TO ACCELERATE · SHIFT</span>`;
html=replaceOnce(html,oldButton,newButton);
const styles=current('games/ball-track/style.css');
const extra=styles.slice(styles.indexOf('      #btn-confirm-memory[hidden]'),styles.indexOf('      .bottom-hud {'));
if(!extra.includes('168px'))throw Error('Missing tutorial layout');
html=replaceOnce(html,'</style>',extra+'    </style>');
if(html.includes('ToenowGameModules')||html.includes('./main.js'))throw Error('Unrelated module refactor leaked');
shipped.set('games/ball-track/index.html',html);
let tests=original('tests/animal-spatial.test.cjs');
tests=replaceOnce(tests,"test('otter replaces the revealed core only at original reveal phases',()=>{\n for(const phase of ['lineup','wave_ready','insert']){","test('otter stays visible while awaiting memory confirmation and hides during movement',()=>{\n for(const phase of ['lineup','wave_ready','insert','memorize']){");
const spatial=current('tests/animal-spatial.test.cjs');
const palette=spatial.slice(spatial.indexOf("test('otter target panel"),spatial.indexOf('function loadFunction('));
tests=replaceOnce(tests,'function loadFunction(',palette+'function loadFunction(');
shipped.set('tests/animal-spatial.test.cjs',tests);
const pkg=JSON.parse(original('package.json'));pkg.scripts.test=pkg.scripts.test.replace('node --test ','node --test tests/flash-progressive-tutorial.test.cjs ');
shipped.set('package.json',JSON.stringify(pkg,null,2)+'\n');
let screens=current('tools/verify-shared-screens-browser.cjs');
screens=screens.replace("const { readSource } = require('./lib/game-source.cjs');\n",'').replace("let js = readSource(path.join(root,'games',id,'assets/index-cr-6j3L1.js'),'utf8');","let js = fs.readFileSync(path.join(root,'games',id,'assets/index-cr-6j3L1.js'),'utf8');");
const elseStart=screens.indexOf('  } else {',screens.indexOf('async function instrument'));
const elseEnd=screens.indexOf('\n}\nfunction structure',elseStart);
const oldScreens=original('tools/verify-shared-screens-browser.cjs');
screens=screens.slice(0,elseStart)+oldScreens.slice(oldScreens.indexOf('  } else {',oldScreens.indexOf('async function instrument')),oldScreens.indexOf('\n}\nfunction structure',oldScreens.indexOf('async function instrument')))+screens.slice(elseEnd);
if(screens.includes('main.js')||screens.includes('readSource'))throw Error('Module test adapter leaked');
shipped.set('tools/verify-shared-screens-browser.cjs',screens);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'toenow-challenges-publish-'));
const env={...process.env,GIT_INDEX_FILE:path.join(temp,'publish.index')};
git(['read-tree',base],{env});
for(const[file,content]of shipped){
 const blob=git(['hash-object','-w','--stdin'],{input:content}).toString().trim();
 git(['update-index','--add','--cacheinfo',`100644,${blob},${file}`],{env});
}
const tree=git(['write-tree'],{env}).toString().trim(),snapshot=path.join(temp,'snapshot');fs.mkdirSync(snapshot);
git(['archive','--format=tar','--output='+path.join(temp,'snapshot.tar'),tree]);cp.execFileSync('tar',['-xf',path.join(temp,'snapshot.tar'),'-C',snapshot]);
const manifest={base,tree,temp,snapshot,files:[...shipped.keys()].sort()};
fs.writeFileSync('artifacts/challenge-publication-state.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify(manifest,null,2));
