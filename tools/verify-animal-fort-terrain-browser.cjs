const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../games/animal-siege/campaign.js');
const E=require('../games/animal-siege/engine.js');
const base=process.env.TOENOW_TEST_URL||'http://127.0.0.1:8774';
async function run(){
  const dir=path.resolve(__dirname,'../artifacts/animal-fort-terrain');fs.mkdirSync(dir,{recursive:true});
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{for(const [width,lang,reduced] of [[1280,'zh-Hant',false],[390,'en',true],[320,'zh-Hant',true]])for(const id of ['river','tower']){
    const p=await browser.newPage({viewport:{width,height:950},isMobile:width<700,hasTouch:width<700,reducedMotion:reduced?'reduce':'no-preference'}),errors=[];
    p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(l=>{localStorage.setItem('toenow_language_v1',l);localStorage.setItem('animal_siege_hands_on_v2','completed');},lang);
    const hooks='window.__terrainGateApproach=()=>{const a=byId("p-beaver");a.x=4;a.y=1;a.moved=false;a.acted=false;selected=a.id;render();};window.__terrainSnapshot=()=>structuredClone({run,state});window.__terrainUnlock=()=>{run.forts.acorn.captured=true;run.forts.river.captured=true;renderMap();};window.__terrainNearWin=()=>{for(const u of state.units.filter(u=>u.team==="enemy"))u.hp=0;const a=byId("p-beaver"),t=byId("e-fox");a.x=1;a.y=1;a.acted=false;a.moved=false;t.x=2;t.y=1;t.hp=1;selected=a.id;render();};window.__terrainFinish=()=>finish();';
    const source=fs.readFileSync(path.resolve(__dirname,'../games/animal-siege/main.js'),'utf8').replace(/\}\)\(\);\s*$/,hooks+'})();');
    await p.route('**/games/animal-siege/main.js*',r=>r.fulfill({contentType:'application/javascript',body:source}));
    await p.goto(base+'/games/animal-siege/?mode=expedition');await p.locator('#btn-start').click();if(id==='tower')await p.evaluate(()=>window.__terrainUnlock());
    await p.locator('[data-location="'+id+'"]').click();
    for(const kind of ['battle','tree','wall','gate'])assert.equal(await p.locator('link[rel="preload"][href$="'+id+'-'+kind+(kind==='wall'||kind==='gate'?'-side-v1.webp':'-v1.webp')+'"]').count(),1,'scouting warms the fort art before entering battle');
    await p.locator('[data-attack="'+id+'"]').click();
    const s=(await p.evaluate(()=>window.__terrainSnapshot())).state,expectedRun=C.create();if(id==='tower'){expectedRun.forts.acorn.captured=true;expectedRun.forts.river.captured=true;}const expected=C.beginBattle(expectedRun,id);
    assert.match(await p.locator('.board-surround').evaluate(e=>getComputedStyle(e).backgroundImage),new RegExp(id+'-battle-v1.webp'),'each fort uses its own illustrated terrain');
    assert.deepEqual(s.walls,expected.walls);assert.deepEqual(s.trees,expected.trees);
    for(const [x,y] of s.walls.concat(s.trees))assert.equal(await p.locator('[data-cell="'+x+','+y+'"]').isDisabled(),true);
    for(const u of s.units)assert.equal(E.blocked(s,u.x,u.y),false);
    assert.equal(await p.locator('.wood-wall').count(),4);assert.equal(await p.locator('.tile.gate:not(:disabled)').count(),2);assert.equal(await p.locator('.battle-tree').count(),3);
    assert.match(await p.locator('.wood-wall').first().evaluate(e=>getComputedStyle(e).backgroundImage),new RegExp(id+'-wall-side-v1.webp'));
    assert.match(await p.locator('.battle-tree').first().evaluate(e=>getComputedStyle(e).backgroundImage),new RegExp(id+'-tree-v1.webp'));
    assert.match(await p.locator('.gate-lane').first().evaluate(e=>getComputedStyle(e).backgroundImage),new RegExp(id+'-gate-side-v1.webp'),'gate passage faces left/right along the actual battle axis');
    assert.equal(await p.locator('.tile.wall').first().evaluate(e=>getComputedStyle(e).opacity),'1','solid collision props are clearly visible');
    assert.equal(await p.locator('#board').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
    await p.evaluate(async id=>{await Promise.all(['battle','tree','wall','gate'].map(async kind=>{const i=new Image();i.src='../../assets/animal-siege/'+id+'-'+kind+(kind==='wall'||kind==='gate'?'-side-v1.webp':'-v1.webp');await i.decode();}));await new Promise(requestAnimationFrame);},id);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(dir,id+'-'+width+'-'+lang+'.png'),fullPage:true});
    await p.locator('.tile.reachable').first().click();assert.deepEqual((await p.evaluate(()=>window.__terrainSnapshot())).state,s,'new scenery never commits a movement preview');
    await p.locator('#confirm-move').click();await p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');
    assert.equal((await p.evaluate(()=>window.__terrainSnapshot())).state.units.find(u=>u.id==='p-beaver').moved,true);
    await p.evaluate(()=>window.__terrainGateApproach());await p.locator('[data-cell="5,1"]').click();await p.locator('#confirm-move').click();await p.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');
    assert.deepEqual((await p.evaluate(()=>window.__terrainSnapshot())).state.units.filter(u=>u.id==='p-beaver').map(u=>[u.x,u.y]),[[5,1]],'animals still enter the open gate cell');
    const oldFlag=await p.locator('.flag-cloth').evaluate(e=>getComputedStyle(e).backgroundImage);
    await p.evaluate(()=>window.__terrainNearWin());await p.locator('[data-cell="2,1"]').click();await p.locator('#confirm-attack').click();await p.locator('#siege-victory').waitFor({state:'visible'});
    assert.equal(await p.locator('.siege-flag').getAttribute('data-owner'),'player');assert.notEqual(await p.locator('.flag-cloth').evaluate(e=>getComputedStyle(e).backgroundImage),oldFlag);
    assert.equal(await p.locator('#siege-victory').getAttribute('data-gold'),String(C.FORTS[id].gold));assert.equal(await p.locator('#siege-victory').getAttribute('data-wood'),String(C.FORTS[id].wood));
    await p.waitForFunction(id=>window.__terrainSnapshot().run.forts[id].captured,id);const won=await p.evaluate(()=>window.__terrainSnapshot());assert.equal(won.run.gold,90+C.FORTS[id].gold);assert.equal(won.run.wood,25+C.FORTS[id].wood);
    await p.evaluate(()=>window.__terrainFinish());assert.deepEqual(await p.evaluate(()=>window.__terrainSnapshot()),won,'fort rewards settle only once');assert.deepEqual(errors,[]);
    console.log('PASS '+id+' '+width+' '+lang+': distinct artwork, real terrain/props, grounded movement, capture flag and exact one-time rewards');await p.close();
  }}finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
