/**
 * Toenow Universal Levels and Runtime Standards Module
 * Central single-source-of-truth for:
 * 1. 5-Level difficulty mapping (5 waves per level)
 * 2. Cross-game level badge formatting
 * 3. Hub message contracts
 * 4. Safe title screen initialization helpers
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ToenowLevels = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LEVELS = [
    { level: 1, name: 'Beginner', minWave: 1, maxWave: 5 },
    { level: 2, name: 'Intermediate', minWave: 6, maxWave: 10 },
    { level: 3, name: 'Advanced', minWave: 11, maxWave: 15 },
    { level: 4, name: 'Expert', minWave: 16, maxWave: 20 },
    { level: 5, name: 'Master', minWave: 21, maxWave: Infinity }
  ];

  /**
   * Returns standard level descriptor for any given wave number.
   * @param {number|string} wave
   * @returns {{ level: number, name: string, badgeText: string, fullBadgeText: string }}
   */
  function getLevelInfo(wave) {
    var w = Math.max(1, parseInt(wave, 10) || 1);
    var matched = LEVELS[0];
    for (var i = 0; i < LEVELS.length; i++) {
      if (w <= LEVELS[i].maxWave) {
        matched = LEVELS[i];
        break;
      }
    }
    return {
      level: matched.level,
      name: matched.name,
      badgeText: 'LVL ' + matched.level + ' · ' + matched.name.toUpperCase(),
      fullBadgeText: 'LVL ' + matched.level + ' · ' + matched.name.toUpperCase() + ' (W' + w + ')'
    };
  }

  /**
   * Safely updates a game's title screen records without throwing null errors.
   * @param {Object} options
   * @param {number|string} options.score
   * @param {number|string} options.wave
   * @param {string} [options.scoreElementId='title-best-score']
   * @param {string} [options.levelElementId='title-best-level']
   */
  function syncTitleRecords(options) {
    if (typeof document === 'undefined') return;
    options = options || {};
    var score = Math.max(0, parseInt(options.score, 10) || 0);
    var wave = Math.max(1, parseInt(options.wave, 10) || 1);
    var scoreId = options.scoreElementId || 'title-best-score';
    var levelId = options.levelElementId || 'title-best-level';

    var elScore = document.getElementById(scoreId);
    if (elScore) {
      elScore.textContent = score.toLocaleString();
    }

    var elLevel = document.getElementById(levelId);
    if (elLevel) {
      var info = getLevelInfo(wave);
      elLevel.textContent = info.badgeText;
    }
  }

  /**
   * Formats a game-over postMessage payload to report back to toenow hub.
   * @param {Object} data
   * @returns {Object}
   */
  function createGameOverPayload(data) {
    data = data || {};
    var wave = Math.max(1, Number(data.wave) || 1);
    var lvl = getLevelInfo(wave);
    return {
      type: 'GAME_OVER',
      gameId: String(data.gameId || ''),
      category: String(data.category || 'puzzle'),
      score: Math.max(0, Math.round(Number(data.score) || 0)),
      wave: wave,
      level: lvl.level,
      levelName: lvl.name,
      duration: Math.max(0, Math.round(Number(data.duration) || 0))
    };
  }

  return {
    LEVELS: LEVELS,
    getLevelInfo: getLevelInfo,
    syncTitleRecords: syncTitleRecords,
    createGameOverPayload: createGameOverPayload
  };
});
