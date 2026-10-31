(function (root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  else root.ToenowTime = rules;
})(globalThis, function () {
  'use strict';
  return Object.freeze({
    START_SECONDS: 60,
    correct: (seconds, bonus = 3) => Math.min(60, Math.max(0, seconds) + bonus),
    wrong: seconds => Math.max(0, seconds - 5)
  });
});
