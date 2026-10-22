var LEVELS = [
  { level: 1, name: 'Beginner', badgeText: 'LVL 1 · BEGINNER', minWave: 1, maxWave: 5, startWave: 1 },
  { level: 2, name: 'Intermediate', badgeText: 'LVL 2 · INTERMEDIATE', minWave: 6, maxWave: 10, startWave: 6 },
  { level: 3, name: 'Advanced', badgeText: 'LVL 3 · ADVANCED', minWave: 11, maxWave: 15, startWave: 11 },
  { level: 4, name: 'Expert', badgeText: 'LVL 4 · EXPERT', minWave: 16, maxWave: 20, startWave: 16 },
  { level: 5, name: 'Master', badgeText: 'LVL 5 · MASTER', minWave: 21, maxWave: Infinity, startWave: 21 }
];

var GAME_STORAGE_KEYS = {
  'number-pop': { score: 'qcc_high_score_v1', wave: 'qcc_best_wave_v1' },
  'ball-track': { score: 'quantum_shell_best_score_v5', wave: 'quantum_shell_best_wave_v5' },
  'block-match': { score: 'chip_defrag_high_score_v5', wave: 'block_match_best_wave' },
  'add-up': { score: 'overclock_reactor_best_v2', wave: 'add_up_best_wave' },
  'space-scale': { score: 'grav_anomaly_best_score_v2', wave: 'space_scale_best_wave' },
  'tap-match': { score: 'whack_match_high_score_v1', wave: 'whack_match_best_wave_v1' },
  'spot-quick': { score: 'fast_focus_high_score_v1', wave: 'fast_focus_best_wave_v1' },
  'shadow-match': { score: 'shadow_match_best_score_v1', wave: 'shadow_match_best_wave_v1' },
  'flash-brain': { score: 'flash_brain_best_score_v1', wave: 'flash_brain_best_wave_v1' }
};

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

  
  /**
   * Universal One-Click Share helper
   * Shares game score / challenge link via Web Share API or falls back to Clipboard.
   * @param {Object} options
   * @param {string} options.gameId
   * @param {string} options.gameTitle
   * @param {number} options.score
   * @param {number} options.wave
   * @param {number} [options.level]
   * @param {string} [options.badgeText]
   */
  function shareScore(options) {
    options = options || {};
    var gameId = options.gameId || 'game';
    var gameTitle = options.gameTitle || (gameId.charAt(0).toUpperCase() + gameId.slice(1).replace(/-/g, ' '));
    var score = Math.round(Number(options.score) || 0);
    var wave = Number(options.wave) || 1;
    var info = options.level ? { level: options.level, badgeText: options.badgeText || ('LVL ' + options.level) } : getLevelInfo(wave);

    var shareUrl = (typeof window !== 'undefined' && window.location)
      ? (window.location.origin + window.location.pathname.replace(/games\/[^/]+\/?$/, '') + '?play=' + encodeURIComponent(gameId) + '&challenge=' + score)
      : 'https://toenow.matrix.io/?play=' + encodeURIComponent(gameId) + '&challenge=' + score;

    var shareText = '🧠 I scored ' + score.toLocaleString() + ' pts (' + info.badgeText + ' · Wave ' + wave + ') in ' + gameTitle + ' on Toenow Matrix! Can you beat my record? ' + shareUrl;

    function showShareToast(msg) {
      if (typeof document === 'undefined') return;
      var existing = document.querySelector('.unified-share-toast');
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

      var toast = document.createElement('div');
      toast.className = 'unified-share-toast';
      toast.innerHTML = '<span>🔗</span> ' + msg;
      document.body.appendChild(toast);

      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 2500);
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({
        title: 'Toenow Matrix — ' + gameTitle + ' Challenge',
        text: shareText,
        url: shareUrl
      }).catch(function (err) {
        if (err && err.name !== 'AbortError') {
          copyToClipboard(shareText, showShareToast);
        }
      });
    } else {
      copyToClipboard(shareText, showShareToast);
    }
  }

  function copyToClipboard(text, onComplete) {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(function () {
        onComplete('Challenge link copied to clipboard!');
      }).catch(function () {
        fallbackCopy(text, onComplete);
      });
    } else {
      fallbackCopy(text, onComplete);
    }
  }

  function fallbackCopy(text, onComplete) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onComplete('Challenge link copied to clipboard!');
    } catch (_) {
      onComplete('Score: ' + text);
    }
  }

  return {
    LEVELS: LEVELS,
    GAME_STORAGE_KEYS: GAME_STORAGE_KEYS,
    getLevelInfo: getLevelInfo,
    syncTitleRecords: syncTitleRecords,
    createGameOverPayload: createGameOverPayload,
    openPracticeModal: openPracticeModal,
    setupPracticeMode: setupPracticeMode,
    shareScore: shareScore
  };
});
