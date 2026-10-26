const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {catalog,createProgress,createLesson}=require('../shared/toenow-tutorials.js');
const ids=['number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain','animal-rescue-train'];
test('all ten games load shared tutorials and provide game-specific interactive examples',()=>{
  assert.deepEqual(Object.keys(catalog).sort(),ids.slice().sort());
  for(const id of ids){
    const html=fs.readFileSync(`games/${id}/index.html`,'utf8');
    assert.ok(html.includes('../../shared/toenow-tutorials.js'),id);
    assert.ok(html.includes('../../assets/toenow-tutorials.css'),id);
    assert.ok(catalog[id].steps.some(s=>s.answers?.length),id+' has actions');
  }
});
test('completion is per game/version and only explicit completion or skipping persists',()=>{
  const records=new Map();const storage={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)};
  const progress=createProgress(storage);
  assert.equal(progress.shouldShow('block-match'),true);
  assert.throws(()=>progress.mark('block-match','opened'));
  assert.equal(records.size,0);
  progress.mark('block-match','completed');
  assert.equal(createProgress(storage).shouldShow('block-match'),false);
  assert.equal(progress.shouldShow('add-up'),true);
  progress.mark('add-up','skipped');assert.equal(progress.shouldShow('add-up'),false);
  storage.setItem(progress.key('block-match'),'old-version');
  assert.equal(createProgress(storage).shouldShow('block-match'),true);
});
test('storage unavailable or corrupt never blocks starting or replays within this page',()=>{
  const progress=createProgress({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
  assert.equal(progress.shouldShow('flash-brain'),true);
  progress.mark('flash-brain','completed');
  assert.equal(progress.shouldShow('flash-brain'),false);
  assert.equal(progress.shouldShow('ball-track'),true);
});
test('each lesson rejects mistakes and requires its own ordered actions before success',()=>{
  for(const id of ids){
    const lesson=createLesson(id);
    assert.equal(lesson.done,false);
    for(const step of catalog[id].steps){
      const index=lesson.index;
      assert.equal(lesson.act('wrong'),false,id);
      assert.equal(lesson.index,index,id);
      for(const answer of step.answers)assert.equal(lesson.act(answer),true,id);
    }
    assert.equal(lesson.done,true,id);
    assert.equal(lesson.act('wrong'),false,id);
  }
});
test('number ordering and Flash Brain priority cannot be skipped; sums accept either order',()=>{
  const numbers=createLesson('number-pop');assert.equal(numbers.act('three'),false);
  numbers.act('one');assert.equal(numbers.act('three'),false);
  const memory=createLesson('flash-brain');memory.act('remember');
  assert.equal(memory.act('bed4'),false);memory.act('bed0');memory.act('bed4');assert.equal(memory.done,true);
  const sum=createLesson('add-up');assert.equal(sum.act('four'),false);sum.act('three');sum.act('two');assert.equal(sum.done,true);
});

test('every lesson instruction and teaching control has a Traditional Chinese translation',()=>{
  const {createI18n}=require('../shared/toenow-i18n.js');
  const catalogs=['core','games-a','games-b','animals'].map(name=>require('../shared/toenow-i18n-'+name+'.js'));
  const i18n=createI18n({languages:['zh-TW'],catalogs});
  const phrases=Object.values(catalog).flatMap(c=>c.steps.map(s=>s.prompt)).concat([
    'Play tutorial','More rules','Try it — no timer','Close tutorial','Skip tutorial','Back to title',
    'You did it!','✓ Ready to play!','Follow the glow. Try one tap.','Try the glowing one. No rush!',
    'Target','Tap away the extra tile','Hide and follow','I remember — hide them',
    'Queue','Carriage','Flowerbed','Tile','Blurry picture','circle-square','circle-triangle','square-triangle'
  ]);
  for(const phrase of phrases)assert.notEqual(i18n.t(phrase),phrase,phrase);
});
