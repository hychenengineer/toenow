(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.RescueSession = factory(root.RescueTrain);
})(globalThis, function (engine) {
  'use strict';
  const Game = engine && engine.Game;
  const fingerprint = level => JSON.stringify([level.queues, level.carCount ?? 3, level.goals]);
  function saveProgress(index, level, actions, canUndo = actions.length > 0) {
    return { version: 1, index, fingerprint: fingerprint(level), actions: actions.map(action => [...action]), canUndo };
  }
  function restoreProgress(data, levels) {
    try {
      if (typeof data === 'string') data = JSON.parse(data);
      if (!data || data.version !== 1 || !Number.isInteger(data.index) || data.index < 0 || data.index >= levels.length) return null;
      const level = levels[data.index];
      if (data.fingerprint !== fingerprint(level) || !Array.isArray(data.actions) || data.actions.length > level.queues.flat().length) return null;
      const game = new Game(level);
      for (const action of data.actions) {
        if (!Array.isArray(action) || action.length !== 2 || !game.move(...action)) return null;
      }
      if (data.canUndo === false) game.previous = null;
      return { index: data.index, game, actions: data.actions.map(action => [...action]) };
    } catch { return null; }
  }
  return { saveProgress, restoreProgress };
});
