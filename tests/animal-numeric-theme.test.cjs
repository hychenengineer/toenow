const { readSource } = require('../tools/lib/game-source.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = id => readSource(`games/${id}/index.html`, 'utf8');
function fn(html, name, next) { return html.slice(html.indexOf(`function ${name}(`), html.indexOf(`function ${next}(`)); }
test('Harvest baskets keep numeric labels and the fraction gauge', () => {
  const html = read('number-pop');
  assert.match(html, /function drawHarvestBasket\(/);
  assert.match(html, /drawCoreValueLabel\(ctx, c, drawX, drawY, r\)/);
  assert.match(html, /c\.fractionGauge/);
  assert.match(html, /ToenowAnimals\.feedback\('number-pop', true\)/);
  assert.match(html, /ToenowAnimals\.feedback\('number-pop', false\)/);
});
test('Supply bags leave exact-sum, two-item minimum and overshoot logic intact', () => {
  const html = read('add-up');
  assert.match(html, /function drawNutBag\(/);
  assert.match(html, /currentVal === target && selectedNodes\.length >= 2/);
  assert.match(html, /currentVal > target/);
  assert.match(html, /ctx\.fillText\(n\.label, 0, 2\)/);
});
test('Parcel render never uses hidden mass and keeps symbols distinct', () => {
  const source = fn(read('space-scale'), 'drawMysteryParcel', 'drawAsteroid');
  assert.ok(source.length > 100);
  assert.doesNotMatch(source, /body\.mass/);
  const labels = [];
  const ctx = new Proxy({ fillText: value => labels.push(value) }, { get: (o,k) => k in o ? o[k] : () => {} });
  const context = { Math, ctx };
  vm.createContext(context); vm.runInContext(source, context);
  for (let keyIndex = 1; keyIndex <= 6; keyIndex++) context.drawMysteryParcel(ctx, { visualRadius: 25, primaryColor: '#aabbcc', symbol: `p${keyIndex}`, keyIndex }, 100, 100, 0, false, 1);
  assert.deepEqual(labels, ['p1','p2','p3','p4','p5','p6']);
});
test('Supply orders retain two, three and four bag solutions in every tier', () => {
  const context = require('../games/add-up/rules.js');
  for (const wave of [1,5,6,10,11,15,16,20,21,35]) for(let run=0;run<10;run++) {
    const data=context.generateWaveData(wave);
    const sizes=new Set();
    for(let mask=1;mask<(1<<data.items.length);mask++) {
      const selected=data.items.filter((_,i)=>mask&(1<<i));
      if(context.evaluateSelection(selected)===data.target) sizes.add(selected.length);
    }
    for(const size of [2,3,4]) assert.ok(sizes.has(size), `wave ${wave} needs a ${size}-bag solution`);
  }
  assert.equal(context.calculateTimeRefund(2),0);assert.equal(context.calculateTimeRefund(3),5);assert.equal(context.calculateTimeRefund(4),10);
  assert.equal(context.getChainMultiplier(2),1);assert.equal(context.getChainMultiplier(3),2);assert.equal(context.getChainMultiplier(4),3);
});
test('Mystery parcel directive is decided by hidden mass across the unchanged tiers', () => {
  const context=require('../games/space-scale/rules.js');
  for(const wave of [1,3,4,6,7,9,10,12,13,15,21]) for(let seed=1;seed<=20;seed++) {
    const puzzle=context.generateOverhauledPuzzle(wave,seed);
    const ordered=[...puzzle.bodies].sort((a,b)=>b.mass-a.mass);
    const rank=puzzle.directive==='max'?0:puzzle.directive==='min'?ordered.length-1:Math.floor(ordered.length/2);
    assert.equal(puzzle.targetBodyId,ordered[rank].id);
    assert.ok(puzzle.scales.length>=1&&puzzle.scales.length<=6);
    assert.ok(puzzle.bodies.every(b=>Number.isFinite(b.visualRadius)&&b.visualRadius>0));
  }
});
test('Supply bag labels render after spark particles in dark ink',()=>{
 const html=read('add-up'),render=html.slice(html.indexOf('function renderArena()'),html.indexOf('// Test & inspection hook'));
 assert.ok(render.indexOf('// 7. Particles')<render.indexOf('drawNutBag(scene.ctx, n.radius'));
 const label=render.slice(render.indexOf('drawNutBag(scene.ctx, n.radius'),render.indexOf("ctx.fillText(n.label, 0, 2)"));
 assert.match(label,/#4d3c29/);
});
