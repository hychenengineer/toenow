const { test } = require('node:test');
const assert = require('node:assert/strict');
const clock = require('../shared/toenow-time.js');

test('a timed run starts with sixty seconds and rewards correct answers up to sixty', () => {
  assert.equal(clock.START_SECONDS, 60);
  assert.equal(clock.correct(40), 43);
  assert.equal(clock.correct(59), 60);
  assert.equal(clock.correct(60), 60);
});
test('wrong answers remove five seconds and clamp at zero', () => {
  assert.equal(clock.wrong(60), 55);
  assert.equal(clock.wrong(5), 0);
  assert.equal(clock.wrong(2), 0);
  assert.equal(clock.wrong(0), 0);
});

test('Tap Match can award only 0.2 seconds per correct target while keeping the cap',()=>{
 assert.equal(clock.correct(40,.2),40.2);
 assert.equal(clock.correct(59,.2),59.2);
 assert.equal(clock.correct(59.9,.2),60);
 assert.equal(clock.correct(60,.2),60);
 assert.equal(clock.correct(40),43);
});
