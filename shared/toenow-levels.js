var LEVELS = [
  { level: 1, name: 'Beginner', badgeText: 'LVL 1 · BEGINNER', minWave: 1, maxWave: 5, startWave: 1 },
  { level: 2, name: 'Intermediate', badgeText: 'LVL 2 · INTERMEDIATE', minWave: 6, maxWave: 10, startWave: 6 },
  { level: 3, name: 'Advanced', badgeText: 'LVL 3 · ADVANCED', minWave: 11, maxWave: 15, startWave: 11 },
  { level: 4, name: 'Expert', badgeText: 'LVL 4 · EXPERT', minWave: 16, maxWave: 20, startWave: 16 },
  { level: 5, name: 'Master', badgeText: 'LVL 5 · MASTER', minWave: 21, maxWave: Infinity, startWave: 21 }
];

var GAME_STORAGE_KEYS = {
  'carefree-farm': { score: 'carefree_farm_best_score_v1', wave: 'carefree_farm_best_wave_v1', progress: 'toenow_carefree_farm_v1', island: 'carefree' },
  'capybara-drift': { score: 'capybara_drift_best_score_v1', wave: 'capybara_drift_best_wave_v1', island: 'carefree' },
  'animal-rescue-train': { score: 'animal_rescue_train_best_score', wave: 'animal_rescue_train_best_wave', session: 'animal_rescue_train_guest_v2', puzzles: 'animal_rescue_train_puzzle_history_v1' },
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
    if (typeof options === 'string') {
      options = { gameId: options };
    }
    options = options || {};

    var gameId = options.gameId;
    var keys = gameId && GAME_STORAGE_KEYS ? GAME_STORAGE_KEYS[gameId] : null;

    var bestScore = 0;
    if (options.bestScore !== undefined) {
      bestScore = Number(options.bestScore) || 0;
    } else if (keys && typeof localStorage !== 'undefined') {
      bestScore = Number(localStorage.getItem(keys.score) || 0) || 0;
    }

    var maxWave = 1;
    if (options.maxWave !== undefined) {
      maxWave = Number(options.maxWave) || 1;
    } else if (keys && typeof localStorage !== 'undefined') {
      maxWave = Number(localStorage.getItem(keys.wave) || 1) || 1;
    }

    var scoreEl = options.scoreElement || document.getElementById('title-best-score') || document.getElementById('titleBestScore');
    if (scoreEl) {
      scoreEl.textContent = bestScore > 0 ? bestScore.toLocaleString() : '0';
    }

    var waveEl = options.waveElement || document.getElementById('title-best-wave') || document.getElementById('titleBestWave');
    if (waveEl) {
      waveEl.textContent = String(Math.max(1, maxWave));
    }

    // Support hasWaves: false -> label shows "BEST LEVEL" instead of "BEST WAVE"
    var waveLabelEl = options.waveLabelElement || document.getElementById('title-best-wave-label');
    if (!waveLabelEl && waveEl && waveEl.parentElement && typeof waveEl.parentElement.querySelector === 'function') {
      waveLabelEl = waveEl.parentElement.querySelector('.unified-record-label');
    }
    if (waveLabelEl && options.hasWaves === false) {
      waveLabelEl.textContent = 'BEST LEVEL';
    }

    var levelEl = options.levelElement || document.getElementById('title-best-level') || document.getElementById('titleBestLvl');
    if (levelEl) {
      if (bestScore <= 0 && (!options.maxWave || options.maxWave <= 1) && maxWave <= 1) {
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

  function openPracticeModal(onStartGame, options) {
    if (typeof document === 'undefined') return;
    var onStart = typeof onStartGame === 'function' ? onStartGame : function () {};
    options = options || {};
    var hasWaves = options.hasWaves !== false;

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

      var waveRangeText = hasWaves
        ? (lvl.level === 5 ? 'Wave 21+' : 'Waves ' + lvl.minWave + '–' + lvl.maxWave)
        : 'Level ' + lvl.level;

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
      openPracticeModal(onStart, options);
    };

    if (options.gameId) {
      try {
        syncTitleRecords(options);
      } catch (_) {}
    }
  }


  /**
   * Generates a high-resolution, futuristic cyber/glow score challenge poster card.
   * Renders to Canvas and exports as a PNG Blob.
   * @param {Object} options
   * @param {string} options.gameId
   * @param {string} options.gameTitle
   * @param {number} options.score
   * @param {number} options.wave
   * @param {string} options.badgeText
   * @param {Function} callback (blob: Blob)
   */
  function generateScorePoster(options, callback) {
    if (typeof document === 'undefined') {
      if (typeof callback === 'function') callback(null);
      return;
    }

    var canvas = document.createElement('canvas');
    var w = 1200;
    var h = 675; // Standard 16:9 social share card ratio (optimal for Twitter, Discord, Teams, WhatsApp preview)
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    if (!ctx) {
      if (typeof callback === 'function') callback(null);
      return;
    }

    // 1. Deep Space Cyber Background
    var bgGrad = ctx.createRadialGradient(w / 2, h * 0.35, 50, w / 2, h / 2, 700);
    bgGrad.addColorStop(0, '#151e36');
    bgGrad.addColorStop(0.5, '#0b0f19');
    bgGrad.addColorStop(1, '#04060b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Futuristic Grid Mesh Effect
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (var x = 0; x <= w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (var y = 0; y <= h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Ambient Glow Orbs
    ctx.save();
    var glowCyan = ctx.createRadialGradient(220, 160, 10, 220, 160, 280);
    glowCyan.addColorStop(0, 'rgba(34, 211, 238, 0.22)');
    glowCyan.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glowCyan;
    ctx.beginPath();
    ctx.arc(220, 160, 280, 0, Math.PI * 2);
    ctx.fill();

    var glowPurple = ctx.createRadialGradient(w - 200, h - 140, 10, w - 200, h - 140, 320);
    glowPurple.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
    glowPurple.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = glowPurple;
    ctx.beginPath();
    ctx.arc(w - 200, h - 140, 320, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Central Glassmorphism Card Frame
    var pad = 44;
    var cardX = pad;
    var cardY = pad;
    var cardW = w - pad * 2;
    var cardH = h - pad * 2;
    var r = 24;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.lineTo(cardX + cardW - r, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    ctx.lineTo(cardX + cardW, cardY + cardH - r);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
    ctx.lineTo(cardX + r, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
    ctx.lineTo(cardX, cardY + r);
    ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    ctx.closePath();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();

    // Card Glass Border
    var borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    borderGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    borderGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.4)');
    borderGrad.addColorStop(1, 'rgba(16, 185, 129, 0.6)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 5. Header Branding: TOENOW MATRIX · COGNITIVE ARENA
    ctx.save();
    ctx.font = '900 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.letterSpacing = '4px';
    ctx.fillText('⚡ TOENOW MATRIX', cardX + 50, cardY + 70);

    ctx.font = '600 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('COGNITIVE CHALLENGE RECORD', cardX + 50, cardY + 98);
    ctx.restore();

    // Game Title Badge
    ctx.save();
    ctx.font = '800 48px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var titleGrad = ctx.createLinearGradient(cardX + 50, cardY + 160, cardX + 450, cardY + 160);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = titleGrad;
    ctx.fillText(options.gameTitle.toUpperCase(), cardX + 50, cardY + 175);
    ctx.restore();

    // Level Badge Pill
    ctx.save();
    var badgeText = options.badgeText || 'LVL 1 · BEGINNER';
    ctx.font = '700 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var badgeW = ctx.measureText(badgeText).width + 36;
    var badgeX = cardX + 50;
    var badgeY = cardY + 205;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, 36, [18]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(badgeText, badgeX + 18, badgeY + 25);

    // Wave Pill
    var waveText = 'WAVE ' + options.wave;
    var waveW = ctx.measureText(waveText).width + 36;
    var waveX = badgeX + badgeW + 16;
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(waveX, badgeY, waveW, 36, [18]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.fillText(waveText, waveX + 18, badgeY + 25);
    ctx.restore();

    // 6. Giant Glowing Score Centerpiece
    ctx.save();
    ctx.font = '600 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('FINAL SCORE', cardX + 50, cardY + 310);

    ctx.font = '900 102px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var scoreStr = options.score.toLocaleString();
    var scoreGrad = ctx.createLinearGradient(cardX + 50, cardY + 360, cardX + 600, cardY + 410);
    scoreGrad.addColorStop(0, '#38bdf8');
    scoreGrad.addColorStop(0.5, '#22d3ee');
    scoreGrad.addColorStop(1, '#a855f7');

    ctx.shadowColor = 'rgba(56, 189, 248, 0.65)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = scoreGrad;
    ctx.fillText(scoreStr, cardX + 50, cardY + 410);
    ctx.restore();

    // 7. Right Side Call-To-Action Box ("CAN YOU BEAT THIS?")
    ctx.save();
    var ctaW = 340;
    var ctaH = 340;
    var ctaX = cardX + cardW - ctaW - 50;
    var ctaY = cardY + 95;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, [20]);
    ctx.fill();
    ctx.stroke();

    // Hologram icon
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', ctaX + ctaW / 2, ctaY + 95);

    ctx.font = '900 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CAN YOU BEAT THIS?', ctaX + ctaW / 2, ctaY + 155);

    ctx.font = '500 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Accept challenge & test', ctaX + ctaW / 2, ctaY + 190);
    ctx.fillText('your cognitive reflexes!', ctaX + ctaW / 2, ctaY + 215);

    // Play Now simulated button
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(ctaX + 35, ctaY + 250, ctaW - 70, 48, [24]);
    ctx.fill();

    ctx.font = '800 17px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0b0f19';
    ctx.fillText('PLAY NOW ▶', ctaX + ctaW / 2, ctaY + 281);
    ctx.restore();

    // 8. Footer Link / Domain
    ctx.save();
    ctx.font = '600 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('🔗 Free online training at toenow.com', cardX + 50, cardY + cardH - 35);
    ctx.restore();

    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        callback(blob);
      }, 'image/png');
    } else {
      callback(null);
    }
  }

  /**
   * Universal One-Click Share helper
   * Shares game score / challenge link with dynamic Poster Image via Web Share API or falls back to Clipboard.
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
    if (typeof globalThis !== 'undefined' && globalThis.ToenowI18n?.language === 'zh-Hant') {
      shareText = '🧠 我在 Toenow 的「' + globalThis.ToenowI18n.t(gameTitle) + '」獲得 ' + score.toLocaleString() + ' 分（第 ' + info.level + ' 級 · 第 ' + wave + ' 波）！你能打破我的紀錄嗎？ ' + shareUrl;
    }

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

    function doShare(file) {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        var shareData = {
          title: typeof globalThis !== 'undefined' && globalThis.ToenowI18n?.language === 'zh-Hant' ? 'Toenow — ' + globalThis.ToenowI18n.t(gameTitle) + ' 挑戰' : 'Toenow Matrix — ' + gameTitle + ' Challenge',
          text: shareText,
          url: shareUrl
        };

        // Attach image poster if supported
        if (file && typeof navigator.canShare === 'function') {
          try {
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (_) {}
        }

        navigator.share(shareData).catch(function (err) {
          if (err && err.name !== 'AbortError') {
            copyToClipboard(shareText, showShareToast);
          }
        });
      } else {
        copyToClipboard(shareText, showShareToast);
      }
    }

    try {
      generateScorePoster({
        gameId: gameId,
        gameTitle: gameTitle,
        score: score,
        wave: wave,
        badgeText: info.badgeText
      }, function (blob) {
        if (blob && typeof File !== 'undefined') {
          var file = new File([blob], gameId + '-score-record.png', { type: 'image/png' });
          doShare(file);
        } else {
          doShare(null);
        }
      });
    } catch (_) {
      doShare(null);
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
    generateScorePoster: generateScorePoster,
    shareScore: shareScore
  };
});
