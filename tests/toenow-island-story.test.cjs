const { test } = require('node:test');
const assert = require('node:assert/strict');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('new visitors see the story while returning visitors can enter the Hub directly', () => {
  const Story = require('../shared/toenow-island-story.js');
  const progress = Story.createProgress(memoryStorage());
  assert.equal(progress.shouldShow(), true);
  assert.equal(progress.shouldShow(true), false);
  assert.equal(progress.shouldShow(), true, 'checking a returning visit must not mark the story finished');
});

test('completing or skipping is remembered on reload without changing gameplay saves', () => {
  const Story = require('../shared/toenow-island-story.js');
  for (const status of ['completed', 'skipped']) {
    const storage = memoryStorage({ number_pop_best_score: '120', toenow_exploration_v3: '{"opened":["number-pop"]}' });
    const before = [...storage.values];
    Story.createProgress(storage).finish(status);
    assert.equal(Story.createProgress(storage).shouldShow(), false);
    assert.equal(storage.getItem('toenow_island_story_v1'), status);
    assert.deepEqual([...storage.values].filter(([key]) => key !== 'toenow_island_story_v1'), before);
  }
});

test('invalid saved story states do not suppress a first visit', () => {
  const Story = require('../shared/toenow-island-story.js');
  for (const value of ['', 'false', '{broken', 'in-progress', '{"status":"completed"}']) {
    const storage = memoryStorage({ toenow_island_story_v1: value });
    assert.equal(Story.createProgress(storage).shouldShow(), true, value);
  }
});

test('blocked or full storage still remembers dismissal for the current visit', () => {
  const Story = require('../shared/toenow-island-story.js');
  for (const storage of [undefined, { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } },
    { getItem: () => null, setItem() { throw Error('quota'); } }]) {
    const progress = Story.createProgress(storage);
    assert.equal(progress.shouldShow(), true);
    assert.doesNotThrow(() => progress.finish('skipped'));
    assert.equal(progress.shouldShow(), false);
  }
});

test('an invalid completion status cannot silently hide the introduction', () => {
  const Story = require('../shared/toenow-island-story.js');
  const storage = memoryStorage();
  const progress = Story.createProgress(storage);
  progress.finish('in-progress');
  assert.equal(progress.shouldShow(), true);
  assert.equal(storage.values.size, 0);
  progress.finish();
  assert.equal(Story.createProgress(storage).shouldShow(), false);
});
