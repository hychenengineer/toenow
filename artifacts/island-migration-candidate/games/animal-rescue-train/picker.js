(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./levels.js'), require('./puzzles.js'));
  else root.RescuePicker = factory(root.RescueLevels, root.RescuePuzzles);
})(globalThis, function (levels, bank) {
  'use strict';
  // Only these puzzle/rule pairs have verified winning paths under the real engine.
  const validLastAnimals = [
    ['cat', 'dog', 'rabbit', 'panda', 'bear'],
    ['cat', 'dog', 'fox', 'panda', 'owl'],
    ['cat', 'dog', 'rabbit', 'fox'],
    ['cat', 'dog', 'fox', 'owl'],
    ['cat', 'fox', 'pig', 'owl', 'bear']
  ];
  const tierFor = wave => Math.min(4, Math.floor((wave - 1) / 5));

  function createPicker({ storage, key, random = Math.random } = {}) {
    let history = {};
    let lastRead;
    function refreshHistory() {
      try {
        const raw = storage?.getItem(key);
        if (raw === lastRead) return;
        lastRead = raw;
        const saved = JSON.parse(raw || 'null');
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) history = saved;
      } catch { /* In-memory rotation remains available when storage is blocked. */ }
    }
    refreshHistory();

    function resolve(wave, requiredLastAnimal, puzzleIndex) {
      const tier = tierFor(wave);
      const index = puzzleIndex ?? ((wave - (tier * 5 + 1)) % bank[tier].length);
      if (!Number.isInteger(index) || index < 0 || index >= bank[tier].length) throw new Error('Unknown rescue puzzle');
      const level = JSON.parse(JSON.stringify({ ...levels[tier], ...bank[tier][index], puzzleIndex: index }));
      if (tier === 4) {
        level.requiredLastAnimal = requiredLastAnimal || validLastAnimals[index][0];
        if (!validLastAnimals[index].includes(level.requiredLastAnimal)) throw new Error('Unverified last-animal rule');
      }
      return level;
    }

    function pick(wave) {
      refreshHistory();
      const tier = tierFor(wave), count = bank[tier].length;
      let entry = history[tier];
      if (!entry || !Number.isInteger(entry.last) || entry.last < 0 || entry.last >= count ||
          !Array.isArray(entry.remaining) || new Set(entry.remaining).size !== entry.remaining.length ||
          !entry.remaining.every(index => Number.isInteger(index) && index >= 0 && index < count && index !== entry.last)) {
        entry = { last: null, remaining: [] };
      }
      if (!entry.remaining.length) {
        entry.remaining = Array.from({ length: count }, (_, index) => index);
        for (let i = count - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [entry.remaining[i], entry.remaining[j]] = [entry.remaining[j], entry.remaining[i]];
        }
        if (entry.remaining[0] === entry.last && count > 1) {
          [entry.remaining[0], entry.remaining[1]] = [entry.remaining[1], entry.remaining[0]];
        }
      }
      const index = entry.remaining.shift();
      entry.last = index;
      history[tier] = entry;
      try { storage?.setItem(key, JSON.stringify(history)); } catch { /* Keep the current in-memory bag. */ }
      const last = tier === 4 ? validLastAnimals[index][Math.floor(random() * validLastAnimals[index].length)] : null;
      return resolve(wave, last, index);
    }
    return { pick, resolve };
  }
  return { createPicker, validLastAnimals };
});
