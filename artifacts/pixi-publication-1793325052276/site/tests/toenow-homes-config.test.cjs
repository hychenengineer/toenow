const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const materials=require('../shared/toenow-materials.js');
const animals=require('../shared/toenow-animals.js');
const filename=path.join(__dirname,'../shared/toenow-homes-config.js');
const config=fs.existsSync(filename)?require(filename):{};

test('home configuration covers precisely the ten material homes with safe lookup',()=>{
  assert.equal(typeof config.get,'function');
  assert.deepEqual(Object.keys(config.HOMES).sort(),Object.keys(materials.ITEMS).sort());
  for(const id of Object.keys(materials.ITEMS))assert.equal(config.get(id),config.HOMES[id]);
  for(const id of ['capybara-drift','unknown','__proto__','constructor',null])assert.equal(config.get(id),null);
});

test('every home has its actual animal, thematic projects, art paths and translated dialogue',()=>{
  assert(config.HOMES,'Home configuration is available');
  for(const [id,home] of Object.entries(config.HOMES)){
    const theme=animals.THEMES[id];
    assert.equal(home.gameId,id);assert.equal(home.species,theme.species);assert.equal(home.place,theme.place);
    assert.equal(home.projects.length,4);
    assert.deepEqual(home.projects.map(p=>p.stage),[2,3,4,5]);
    assert.deepEqual(home.projects.map(p=>p.sprite),[0,1,2,3]);
    assert.deepEqual(home.projects.map(p=>p.position),['patch','greenhouse','stall','pergola']);
    assert.equal(new Set(home.projects.map(p=>p.id)).size,4);
    assert.equal(new Set(home.projects.map(p=>p.name)).size,4);
    const folder=id==='number-pop'?'assets/rabbit-home':`assets/animal-homes/${theme.species}`;
    assert.equal(home.background,`${folder}/background.webp`);assert.equal(home.atlas,`${folder}/buildings.webp`);
    assert.equal(home.character,id==='number-pop'?'assets/rabbit-home/rabbit.webp':`assets/animal-island/${theme.species}-character.webp`);
    assert(home.chat.ambient.length>=4);assert.equal(new Set(home.chat.ambient).size,home.chat.ambient.length);
    const strings=[home.place,home.gameTitle,home.playLabel,home.starterDescription,home.talkLabel,...home.projects.map(p=>p.name),...['welcome','returning','ready','complete','gameTip'].map(key=>home.chat[key]),...home.chat.ambient];
    for(const text of strings){assert.equal(typeof text,'string');assert(text.trim());assert.match(config.entries[text],/[\u3400-\u9fff]/,`Missing translation: ${text}`);}
  }
});

test('Rabbit keeps existing project identities and browser exports the same API',()=>{
  assert(config.HOMES,'Home configuration is available');
  const rabbit=require('../shared/toenow-rabbit-home.js');
  assert.deepEqual(config.get('number-pop').projects,rabbit.PROJECTS);
  const context={};vm.runInNewContext(fs.readFileSync(filename,'utf8'),context);
  assert.equal(typeof context.ToenowHomesConfig.get,'function');
  assert.equal(context.ToenowHomesConfig.get('space-scale').species,'fox');
  assert.equal(context.ToenowHomesConfig.get('tap-match').species,'penguin');
  assert.equal(context.ToenowHomesConfig.get('shadow-match').species,'raccoon');
});
