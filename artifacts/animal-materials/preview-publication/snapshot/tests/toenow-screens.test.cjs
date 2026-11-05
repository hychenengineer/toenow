const { readSource } = require('../tools/lib/game-source.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const games = ['capybara-drift','number-pop','ball-track','block-match','add-up','space-scale','tap-match','spot-quick','shadow-match','flash-brain'];

test('nine games use one screen library without copied title or result templates', () => {
  for (const id of games) {
    const html = readSource(path.join(root, 'games', id, 'index.html'), 'utf8');
    assert.ok(html.includes('../../shared/toenow-screens.js'), `${id}: shared renderer dependency`);
    const source = id === 'flash-brain' ? readSource(path.join(root,'games',id,'assets/index-cr-6j3L1.js'),'utf8') : html;
    assert.ok(source.includes('ToenowScreens.'), `${id}: invokes renderer`);
    if (id !== 'flash-brain') {
      assert.equal((source.match(/data-toenow-screen="title"/g) || []).length, 1);
      assert.equal((source.match(/data-toenow-screen="gameover"/g) || []).length, 1);
      assert.ok(source.includes('ToenowScreens.updateGameOver('), `${id}: passes actual results to library`);
      assert.ok(source.includes('ToenowScreens.updateTitle('), `${id}: passes title records to library`);
      assert.doesNotMatch(source, /getElementById\(['"]title-best-level['"]\)/, `${id}: duplicated title level presentation`);
      assert.doesNotMatch(source, /<h2[^>]*>\s*(?:GAME OVER|TIME EXPIRED|Run Complete)/, `${id}: copied result heading`);
    } else {
      assert.ok(source.includes('ToenowScreens.renderTitle('));
      assert.ok(source.includes('ToenowScreens.renderGameOver('));
      assert.doesNotMatch(source, /className:`(?:modal-actions|stat-grid)`/);
    }
    assert.doesNotMatch(source, /<(?:div|section)[^>]*class="[^"]*unified-title-card/, `${id}: copied title markup`);
    assert.doesNotMatch(source, /className:`unified-title-card`/, `${id}: copied React title markup`);
  }
});

test('shared renderer owns event callbacks, current share payload, and instance disposal', () => {
  const screens = require('../shared/toenow-screens.js');
  const levels = require('../shared/toenow-levels.js');
  const nodes = new Map();
  const host = { dataset: {}, classList: { add() {} }, setAttribute() {}, replaceChildren() {}, querySelector(selector) {
    if (!nodes.has(selector)) nodes.set(selector, { textContent: '', listeners: {}, addEventListener(event, fn) { this.listeners[event] = fn; } });
    return nodes.get(selector);
  }};
  let starts=0, retries=0, titles=0, shared;
  screens.renderTitle(host, 'number-pop', { bestScore: 456, bestWave: 6, onStart() { starts++; } });
  nodes.get('[data-start]').listeners.click();
  assert.equal(starts,1);
  assert.equal(host.dataset.toenowScreenOwner,'ToenowScreens');
  const previousShare=levels.shareScore;
  levels.shareScore=data=>{shared=data;};
  try {
    const view=screens.renderGameOver(host,'number-pop',{score:12,bestScore:456,wave:6,combo:2,onRetry(){retries++;},onTitle(){titles++;}});
    screens.updateGameOver('number-pop',{score:99,bestScore:456,wave:21,combo:3});
    nodes.get('[data-screen-action="share"]').listeners.click();
    nodes.get('[data-screen-action="retry"]').listeners.click();
    nodes.get('[data-screen-action="title"]').listeners.click();
    assert.equal(shared.score,99); assert.equal(shared.wave,21); assert.equal(shared.level,5);
    assert.equal(retries,1); assert.equal(titles,1);
    assert.equal(nodes.get('[data-screen-field="level"]').textContent,'LVL 5 · MASTER');
    view.destroy();
    assert.throws(()=>screens.updateGameOver('number-pop',{}),/not mounted/);
  } finally { levels.shareScore=previousShare; }
});

test('shared screen copy is escaped and missing/non-finite results are safe', () => {
  const screens=require('../shared/toenow-screens.js');
  const c=screens.catalog['number-pop']; const previous=c.description;
  try { c.description='<img src=x onerror="bad()">'; assert.ok(screens.titleMarkup('number-pop').includes('&lt;img')); }
  finally { c.description=previous; }
  const data=screens.normalizeResult({score:NaN,bestScore:Infinity,wave:-5,combo:null});
  assert.deepEqual([data.score,data.bestScore,data.wave,data.combo],[0,0,1,null]);
  assert.throws(()=>screens.titleMarkup('unknown-game'),/Unknown/);
});

test('shared screen templates provide identical result fields and three actions for all games', () => {
  const screens = require('../shared/toenow-screens.js');
  for (const id of games) {
    const title = screens.titleMarkup(id);
    const end = screens.gameOverMarkup(id);
    assert.match(title, /unified-title-card/);
    assert.match(title, /unified-actions-bar/);
    assert.match(end, /data-screen-field="score"/);
    assert.match(end, /data-screen-field="bestScore"/);
    assert.match(end, /data-screen-field="wave"/);
    assert.match(end, /data-screen-field="combo"/);
    assert.equal((end.match(/data-screen-action=/g) || []).length, 3);
    assert.match(end, /TITLE SCREEN/);
  }
});

test('screen result normalization uses the shared five-level mapping', () => {
  const screens = require('../shared/toenow-screens.js');
  for (const wave of [1,5,6,10,11,15,16,20,21,99]) {
    const result = screens.normalizeResult({ score: 123, bestScore: 500, wave, combo: 3 });
    assert.equal(result.level, require('../shared/toenow-levels.js').getLevelInfo(wave).badgeText);
    assert.equal(result.score, 123);
    assert.equal(result.bestScore, 500);
    assert.equal(result.combo, 3);
  }
});

test('membership invitation follows replay and preserves the three game actions', () => {
  const screens = require('../shared/toenow-screens.js');
  for (const id of games) {
    const html = screens.gameOverMarkup(id);
    assert.ok(html.indexOf('data-membership-invite') > html.indexOf('data-screen-action="retry"'));
    assert.ok(html.indexOf('data-membership-invite') < html.indexOf('data-screen-action="share"'));
    assert.match(html, /Create Free Account/);
    assert.match(html, /Already a member\?/);
    assert.match(html, /data-account-action="signin"/);
    assert.equal((html.match(/data-screen-action=/g) || []).length, 3);
  }
});
