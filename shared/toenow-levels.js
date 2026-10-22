/**
 * Toenow Universal Levels and Runtime Standards Module
 * Central single-source-of-truth for:
 * 1. 5-Level difficulty mapping (5 waves per level)
 * 2. Cross-game level badge formatting
 * 3. Hub message contracts
 * 4. Safe title screen initialization helpers
 * 5. Universal Practice Mode (Modal UI + Level Selection + Safe Launch)
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
    { level: 1, name: 'Beginner', minWave: 1, maxWave: 5, startWave: 1 },
    { level: 2, name: 'Intermediate', minWave: 6, maxWave: 10, startWave: 6 },
    { level: 3, name: 'Advanced', minWave: 11, maxWave: 15, startWave: 11 },
    { level: 4, name: 'Expert', minWave: 16, maxWave: 20, startWave: 16 },
    { level: 5, name: 'Master', minWave: 21, maxWave: Infinity, startWave: 21 }
  ];

  /**
   * Returns standard level descriptor for any given wave number.
   * @param {number|string} wave
   * @returns {{ level: number, name: string, badgeText: string, fullBadgeText: string, startWave: number }}
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
      startWave: matched.startWave,
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
    var isPractice = Boolean(data.isPractice);
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
      isPractice: isPractice,
      duration: Math.max(0, Math.round(Number(data.duration) || 0))
    };
  }

  /**
   * Attaches universal Practice Mode modal to the title screen.
   * Generates a "PRACTICE" button next to "START GAME", and opens a level picker (Level 1-5).
   * Selecting a level triggers onStartGame(startWave, true).
   * @param {Object} options
   * @param {HTMLElement|string} options.container - The title card element or selector containing START GAME button
   * @param {Function} options.onStartGame - Callback: (startWave, isPractice) => void
   */
  function setupPracticeMode(options) {
    if (typeof document === 'undefined') return;
    options = options || {};
    var onStart = typeof options.onStartGame === 'function' ? options.onStartGame : function () {};
    var container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : (options.container || document.querySelector('.unified-title-card'));

    if (!container) return;

    var startBtn = container.querySelector('.unified-start-btn') || container.querySelector('[data-start="true"]');
    if (!startBtn) return;

    // Check if practice button already exists
    if (container.querySelector('.unified-practice-btn')) return;

    // Wrap buttons into an actions bar if needed
    var actionsBar = container.querySelector('.unified-actions-bar');
    if (!actionsBar) {
      actionsBar = document.createElement('div');
      actionsBar.className = 'unified-actions-bar';
      startBtn.parentNode.insertBefore(actionsBar, startBtn);
      actionsBar.appendChild(startBtn);
    }

    var practiceBtn = document.createElement('button');
    practiceBtn.type = 'button';
    practiceBtn.className = 'unified-practice-btn';
    practiceBtn.textContent = 'PRACTICE';
    practiceBtn.setAttribute('aria-label', 'Open Practice Mode Level Selector');
    actionsBar.appendChild(practiceBtn);

    // Create Modal for Level Selection
    var modalId = 'unified-practice-modal-' + Math.random().toString(36).slice(2, 7);
    var modal = document.createElement('div');
    modal.className = 'unified-practice-modal hidden';
    modal.id = modalId;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Select Practice Level');

    var modalContent = document.createElement('div');
    modalContent.className = 'unified-practice-card';

    var header = document.createElement('div');
    header.className = 'unified-practice-header';
    header.innerHTML = '<span class="unified-practice-pill">🎯 TRAINING MODE</span>' +
      '<h2 class="unified-practice-title">CHOOSE LEVEL</h2>' +
      '<p class="unified-practice-subtitle">Practice any difficulty freely. Scores in practice mode are not recorded.</p>';
    modalContent.appendChild(header);

    var levelGrid = document.createElement('div');
    levelGrid.className = 'unified-practice-grid';

    LEVELS.forEach(function (lvl) {
      var itemBtn = document.createElement('button');
      itemBtn.type = 'button';
      itemBtn.className = 'unified-practice-level-btn';
      itemBtn.setAttribute('data-level', String(lvl.level));
      itemBtn.setAttribute('data-wave', String(lvl.startWave));

      var waveRangeText = lvl.level === 5 ? 'Wave 21+' : 'Waves ' + lvl.minWave + '–' + lvl.maxWave;
      itemBtn.innerHTML = '<div class="unified-practice-level-num">LVL ' + lvl.level + '</div>' +
        '<div class="unified-practice-level-details">' +
        '  <span class="unified-practice-level-name">' + lvl.name.toUpperCase() + '</span>' +
        '  <span class="unified-practice-level-range">' + waveRangeText + '</span>' +
        '</div>' +
        '<span class="unified-practice-play-arrow">▶</span>';

      itemBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        modal.classList.add('hidden');
        onStart(lvl.startWave, true);
      });

      levelGrid.appendChild(itemBtn);
    });
    modalContent.appendChild(levelGrid);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'unified-practice-cancel-btn';
    closeBtn.textContent = 'CANCEL';
    closeBtn.addEventListener('click', function () {
      modal.classList.add('hidden');
    });
    modalContent.appendChild(closeBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    practiceBtn.addEventListener('click', function (e) {
      e.preventDefault();
      modal.classList.remove('hidden');
    });
  }

  return {
    LEVELS: LEVELS,
    getLevelInfo: getLevelInfo,
    syncTitleRecords: syncTitleRecords,
    createGameOverPayload: createGameOverPayload,
    setupPracticeMode: setupPracticeMode
  };
});
