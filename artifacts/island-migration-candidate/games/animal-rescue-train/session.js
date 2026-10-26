(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.RescueSession = factory(root.RescueTrain);
})(globalThis, function (engine) {
  'use strict';
  const Game = engine && engine.Game;
  const fingerprint = level => JSON.stringify([level.queues, level.carCount ?? 3, level.goals, level.requiredLastAnimal || null]);
  function saveProgress(index, level, actions, canUndo = actions.length > 0, meta = {}) {
    return { version: 2, index, fingerprint: fingerprint(level), actions: actions.map(action => [...action]), canUndo,
      wave: meta.wave ?? index * 5 + 1, isPractice: Boolean(meta.isPractice), scoreBefore: meta.scoreBefore ?? 0, elapsedMs: meta.elapsedMs ?? 0, reported: Boolean(meta.reported),
      requiredLastAnimal: level.requiredLastAnimal || null, puzzleIndex: level.puzzleIndex };
  }
  function restoreProgress(data, levels, resolveLevel) {
    try {
      if (typeof data === 'string') data = JSON.parse(data);
      if (!data || data.version !== 2 || !Number.isInteger(data.index) || data.index < 0 || data.index >= levels.length) return null;
      if (!Number.isInteger(data.wave) || data.wave < 1 || data.wave > 100000 || Math.min(4, Math.floor((data.wave - 1) / 5)) !== data.index) return null;
      if (!Number.isFinite(data.scoreBefore) || data.scoreBefore < 0 || data.scoreBefore > data.wave * 30 || !Number.isFinite(data.elapsedMs) || data.elapsedMs < 0) return null;
      const level = resolveLevel ? resolveLevel(data.wave, data.requiredLastAnimal, data.puzzleIndex) : levels[data.index];
      if (data.fingerprint !== fingerprint(level) || !Array.isArray(data.actions) || data.actions.length > level.queues.flat().length) return null;
      const game = new Game(level);
      for (const action of data.actions) {
        if (!Array.isArray(action) || action.length !== 2 || !game.move(...action)) return null;
      }
      if (data.canUndo === false) game.previous = null;
      return { index: data.index, game, actions: data.actions.map(action => [...action]), wave: data.wave, isPractice: Boolean(data.isPractice), scoreBefore: data.scoreBefore, elapsedMs: data.elapsedMs, reported: Boolean(data.reported) };
    } catch { return null; }
  }
  return { saveProgress, restoreProgress };
});
