const fs=require('node:fs');
const babel=require('C:/Users/HsinYuChen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/lib/transform/babelBundle.js');
const globals=new Set(['Math','String','Number','Boolean','Array','Object','Set','Map','Date','Infinity','NaN','undefined','parseFloat','parseInt','performance','window','document','getComputedStyle']);
const ranges={
 'spot-quick':[['function renderOffscreenSpecimen(','function gameLoop(']],
 'number-pop':[['function drawPolygon(','function frameLoop(']],
 'ball-track':[['function drawArenaBackground(','function frameLoop(']],
 'shadow-match':[['function renderFrame(','function frameLoop(']],
 'space-scale':[['function drawMysteryParcel(','function tick(']],
 'add-up':[['function drawNutBag(','// Test & inspection']],
 'tap-match':[['function drawOuterShape(','function updateGame('],['function renderGame(','function loop(']],
 'block-match':[['function drawRoundedRect(','function frame(']]
};
for(const [id,sections] of Object.entries(ranges)){
 const dir=`games/${id}`;let main=fs.readFileSync(dir+'/main.js','utf8');
 let pieces=[];
 for(const [start,end]of sections){
   const a=main.indexOf(start),b=main.indexOf(end,a);if(a<0||b<0)throw Error(id+' boundaries');
   const chunk=main.slice(a,b),parsed=babel.babelParse(chunk,'renderer.js',false);
   const functions=parsed.program.body.filter(n=>n.type==='FunctionDeclaration');
   pieces.push(...functions.map(n=>chunk.slice(n.start,n.end)));
   // Leave frame clocks and other controller-owned initializers in place.
   for(const n of functions.reverse())main=main.slice(0,a+n.start)+main.slice(a+n.end);
 }
 let source=pieces.join('\n');const ast=babel.babelParse(source,'renderer.js',false),deps=new Set(),writes=new Set(),edits=[];
 const functions=ast.program.body.map(n=>{if(n.type!=='FunctionDeclaration')throw Error(id+' renderer contains '+n.type);return n.id.name});
 babel.traverse(ast,{Identifier(p){
   const name=p.node.name;if(globals.has(name)||p.scope.hasBinding(name,true))return;
   const write=(p.parentPath.isAssignmentExpression()&&p.key==='left')||(p.parentPath.isUpdateExpression()&&p.key==='argument');
   if(!write&&!p.isReferencedIdentifier())return;
   if(write)writes.add(name);deps.add(name);
   const replacement=p.parentPath.isObjectProperty()&&p.parent.shorthand ? `${name}: scene.${name}` : `scene.${name}`;
   edits.push([p.node.start,p.node.end,replacement]);
 }});
 for(const [start,end,text]of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+text+source.slice(end);
 const renderer=`// Drawing only. The controller supplies live values through scene getters.\n(function (root, factory) {\n  if (typeof module === 'object' && module.exports) module.exports = factory();\n  else root.ToenowGameModules['${id}'].renderer = factory();\n})(typeof window !== 'undefined' ? window : globalThis, function () {\n  'use strict';\n  function createRenderer(scene) {\n${source}\n    return { ${functions.join(', ')} };\n  }\n  return { createRenderer };\n});\n`;
 fs.writeFileSync(dir+'/renderer.js',renderer);
 const create=`\n        // Getters preserve current dimensions, state and buffers across resize/restart.\n        const { ${functions.join(', ')} } = window.ToenowGameModules['${id}'].renderer.createRenderer({\n${[...deps].map(name=>`          get ${name}() { return ${name}; }${writes.has(name)?`,\n          set ${name}(value) { ${name} = value; }`:''}`).join(',\n')}\n        });\n`;
 main=main.replace(/(['"])use strict\1;/,m=>m+create);
 fs.writeFileSync(dir+'/main.js',main);
 const html=fs.readFileSync(dir+'/index.html','utf8').replace('<script src="./main.js">','<script src="./renderer.js"></script>\n    <script src="./main.js">');fs.writeFileSync(dir+'/index.html',html);
 console.log(id,functions.length+' render functions',deps.size+' scene dependencies','mutable: '+[...writes].join(','));
}
