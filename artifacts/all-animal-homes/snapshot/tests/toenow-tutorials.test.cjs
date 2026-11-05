const { readSource } = require('../tools/lib/game-source.cjs');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {catalog,createProgress,createSession}=require('../shared/toenow-tutorials.js');
const ids=['number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain','animal-rescue-train'];
test('ten games use the shared coach and register adapters in their own game engines',()=>{
  assert.deepEqual(Object.keys(catalog).sort(),ids.slice().sort());
  for(const id of ids){
    const html=readSource(`games/${id}/index.html`,'utf8');
    assert.ok(html.includes('../../shared/toenow-tutorials.js'),id);
    const source=id==='flash-brain'?readSource('games/flash-brain/tutorial.js','utf8'):id==='animal-rescue-train'?readSource('games/animal-rescue-train/game.js','utf8'):html;
    assert.match(source,/ToenowTutorials\??\.register(?:\?\.)?\(/,id+' registers real engine');
  }
});
test('v2 completion is isolated per game and old illustration completion does not suppress real teaching',()=>{
  const records=new Map([['toenow_tutorial_block-match_v1','completed']]);
  const storage={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)};
  const progress=createProgress(storage);
  assert.equal(progress.key('block-match'),'toenow_tutorial_block-match_v2');
  assert.equal(progress.shouldShow('block-match'),true);
  assert.throws(()=>progress.mark('block-match','opened'));
  progress.mark('block-match','completed');assert.equal(progress.shouldShow('block-match'),false);
  assert.equal(progress.shouldShow('add-up'),true);
  progress.mark('add-up','skipped');assert.equal(createProgress(storage).shouldShow('add-up'),false);
});
test('session activates protection before engine start and retains it throughout cleanup',()=>{
  const events=[];let run;const progress=createProgress();
  run=createSession('block-match',{
    start(){events.push(['start',run.active]);},stop(){events.push(['stop',run.active]);},
    getGuide(){return {prompt:'Tap away the extra tile',rect:{x:1,y:2,width:3,height:4}};}
  },progress);
  run.start();assert.equal(run.active,true);assert.equal(run.done,false);
  assert.equal(progress.shouldShow('block-match'),true);assert.equal(run.guide().rect.x,1);
  run.stop();assert.equal(run.active,false);assert.equal(progress.shouldShow('block-match'),true);
  assert.deepEqual(events,[['start',true],['stop',true]]);
});
test('only actual engine completion or explicit skip records teaching as seen',()=>{
  const progress=createProgress();let stopped=0;
  const adapter={start(){},stop(){stopped++;},getGuide(){return {};}};
  const run=createSession('block-match',adapter,progress);run.start();
  run.complete();run.complete();assert.equal(run.done,true);
  assert.equal(progress.shouldShow('block-match'),false);assert.equal(stopped,0);
  run.stop();assert.equal(stopped,1);run.stop();assert.equal(stopped,1);
  const skip=createSession('add-up',adapter,progress);skip.start();skip.skip();
  assert.equal(progress.shouldShow('add-up'),false);
});
test('unavailable storage does not block teaching or in-page completion',()=>{
  const progress=createProgress({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
  const run=createSession('flash-brain',{start(){},stop(){},getGuide(){return {};}},progress);
  run.start();run.complete();run.stop();assert.equal(progress.shouldShow('flash-brain'),false);
});
test('shared coach contains no duplicate game renderer or synthetic answer buttons',()=>{
  const src=readSource('shared/toenow-tutorials.js','utf8');
  assert.doesNotMatch(src,/tutorial-choice|createElementNS|function silhouette|function garden|function draw\(/);
  assert.match(src,/getGuide/);
  const {createI18n}=require('../shared/toenow-i18n.js');
  const catalogs=['core','games-a','games-b','animals'].map(name=>require('../shared/toenow-i18n-'+name+'.js'));
  const t=createI18n({languages:['zh-TW'],catalogs});
  for(const c of Object.values(catalog))assert.notEqual(t.t(c.prompt),c.prompt,c.name);
});
