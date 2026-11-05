const { test } = require('node:test');
const assert = require('node:assert/strict');

test('opening introduces three allies and the actual ordered fortress objectives', () => {
  const Opening = require('../games/animal-siege/opening-story.js');
  const Campaign = require('../games/animal-siege/campaign.js');
  const story = Opening.create();
  const lines = [];
  do { lines.push(story.current()); } while (story.advance());
  assert.equal(lines.length, 6);
  assert.deepEqual(new Set(lines.map(line => line.speaker)), new Set(['fox', 'squirrel', 'beaver']));
  const copy = lines.map(line => line.text).join(' ');
  for (const fort of Object.values(Campaign.FORTS)) assert.ok(copy.includes(fort.name), fort.name);
  assert.ok(copy.includes('both outer forts'), 'outer forts unlock the citadel');
  assert.equal(lines[0].index, 0);
  assert.equal(lines.at(-1).last, true);
  assert.equal(story.advance(), false, 'cannot advance beyond the last line');
  assert.equal(story.current().index, 5);
  assert.equal(Opening.create().current().index, 0, 'new runs start a fresh story');
});

test('every opening line and control has Traditional Chinese catalog copy', () => {
  const Opening = require('../games/animal-siege/opening-story.js');
  const catalog = require('../shared/toenow-i18n-games-b.js').entries;
  for (const text of [...Opening.lines.map(line => line.text), ...(Opening.campLines || []).map(line => line.text), ...Object.values(Opening.copy)]) {
    assert.ok(catalog[text], 'missing translation: ' + text);
    assert.match(catalog[text], /[\u3400-\u9fff]/);
  }
});

test('map dialogue leads to a camp tour, with recruitment before training', () => {
  const Opening = require('../games/animal-siege/opening-story.js');
  const Campaign = require('../games/animal-siege/campaign.js');
  const story = Opening.create();
  assert.equal(story.current().phase, 'story');
  assert.equal(story.enterCamp(), false, 'finish map dialogue before entering the camp tour');
  while (story.advance()) {}
  assert.equal(story.enterCamp(), true);
  assert.equal(story.current().phase, 'camp');
  assert.equal(story.current().topic, 'buildings');
  story.advance();
  assert.equal(story.current().topic, 'recruit');
  assert.ok(story.current().text.includes(String(Campaign.COST.beaver)));
  story.advance();
  assert.equal(story.current().topic, 'train');
  assert.ok(story.current().text.includes(String(Campaign.UPGRADE_COST)));
  assert.equal(story.current().last, true);
  assert.equal(story.advance(), false);
});

test('Animal Siege uses the shared title without rank records and keeps standard results', () => {
  const Screens = require('../shared/toenow-screens.js');
  assert.doesNotMatch(Screens.titleMarkup('animal-siege'), /data-screen-record|BEST SCORE|BEST LEVEL|BEGINNER/);
  assert.match(Screens.titleMarkup('number-pop'), /data-screen-record="score"/);
  assert.match(Screens.gameOverMarkup('animal-siege'), /data-screen-field="bestScore"/);
  const host = { dataset: {}, classList: { add() {} }, setAttribute() {},
    querySelector() { throw new Error('A title without records must not query missing record nodes'); } };
  assert.doesNotThrow(() => Screens.renderTitle(host, 'animal-siege', { bestScore: 999, bestWave: 21 }));
});
