var LEVELS = [
  { level: 1, name: 'Beginner', badgeText: 'LVL 1 · BEGINNER', minWave: 1, maxWave: 5, startWave: 1 },
  { level: 2, name: 'Intermediate', badgeText: 'LVL 2 · INTERMEDIATE', minWave: 6, maxWave: 10, startWave: 6 },
  { level: 3, name: 'Advanced', badgeText: 'LVL 3 · ADVANCED', minWave: 11, maxWave: 15, startWave: 11 },
  { level: 4, name: 'Expert', badgeText: 'LVL 4 · EXPERT', minWave: 16, maxWave: 20, startWave: 16 },
  { level: 5, name: 'Master', badgeText: 'LVL 5 · MASTER', minWave: 21, maxWave: Infinity, startWave: 21 }
];

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ToenowLevels = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getLevelInfo(wave) {
    var w = Number(wave) || 1;
    if (w < 1) w = 1;

    for (var i = 0; i < LEVELS.length; i++) {
      var lvl = LEVELS[i];
      if (w >= lvl.minWave && w <= lvl.maxWave) {
        return lvl;
      }
    }
    return LEVELS[LEVELS.length - 1];
  }

  function syncTitleRecords(options) {
    if (typeof document === 'undefined') return;
    options = options || {};

    var bestScore = Number(options.bestScore) || 0;
    var maxWave = Number(options.maxWave) || 1;

    var scoreEl = options.scoreElement || document.getElementById('title-best-score');
    if (scoreEl) {
      scoreEl.textContent = bestScore > 0 ? bestScore.toLocaleString() : '0';
    }

    var levelEl = options.levelElement || document.getElementById('title-best-level');
    if (levelEl) {
      if (bestScore <= 0 && (!options.maxWave || options.maxWave <= 1)) {
        levelEl.textContent = 'LVL 1 · BEGINNER';
      } else {
        var info = getLevelInfo(maxWave);
        levelEl.textContent = info.badgeText;
      }
    }
  }

  function createGameOverPayload(data) {
    data = data || {};
    var wave = Number(data.wave) || 1;
    var levelInfo = getLevelInfo(wave);

    return {
      type: 'GAME_OVER',
      gameId: data.gameId,
      category: data.category,
      score: Math.round(Number(data.score) || 0),
      wave: wave,
      level: levelInfo.level,
      levelName: levelInfo.name,
      duration: data.duration,
      accuracy: data.accuracy,
      streak: data.streak,
      rank: data.rank,
      isPractice: Boolean(data.isPractice)
    };
  }

  var activeModal = null;

  function openPracticeModal(onStartGame) {
    if (typeof document === 'undefined') return;
    var onStart = typeof onStartGame === 'function' ? onStartGame : function () {};

    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
      activeModal = null;
    }

    var modal = document.createElement('div');
    modal.className = 'unified-practice-modal';
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
        if (modal.parentNode) modal.parentNode.removeChild(modal);
        activeModal = null;
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
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      activeModal = null;
    });
    modalContent.appendChild(closeBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    activeModal = modal;
  }

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

    var practiceBtn = container.querySelector('.unified-practice-btn');
    if (!practiceBtn) {
      var actionsBar = container.querySelector('.unified-actions-bar');
      if (!actionsBar) {
        actionsBar = document.createElement('div');
        actionsBar.className = 'unified-actions-bar';
        startBtn.parentNode.insertBefore(actionsBar, startBtn);
        actionsBar.appendChild(startBtn);
      }

      practiceBtn = document.createElement('button');
      practiceBtn.type = 'button';
      practiceBtn.className = 'unified-practice-btn';
      practiceBtn.textContent = 'PRACTICE';
      practiceBtn.setAttribute('aria-label', 'Open Practice Mode Level Selector');
      actionsBar.appendChild(practiceBtn);
    }

    practiceBtn.onclick = function (e) {
      e.preventDefault();
      openPracticeModal(onStart);
    };
  }

  return {
    LEVELS: LEVELS,
    getLevelInfo: getLevelInfo,
    syncTitleRecords: syncTitleRecords,
    createGameOverPayload: createGameOverPayload,
    openPracticeModal: openPracticeModal,
    setupPracticeMode: setupPracticeMode
  };
});
