// toenow-sdk.js - Unified Lifecycle & Storage SDK for Toenow Matrix Games
// Compatible with Node.js and Browser environments.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./toenow-levels.js'),
      require('./toenow-security.js'),
      require('./toenow-platform.js'),
      require('./toenow-materials.js')
    );
  } else {
    root.ToenowGameSDK = factory(root.ToenowLevels, root.ToenowSecurity, root.ToenowPlatform, root.ToenowMaterials);
  }
})(typeof self !== 'undefined' ? self : this, function (ToenowLevels, ToenowSecurity, ToenowPlatform, ToenowMaterials) {
  'use strict';
  var instances = {};

  var LEVELS = ToenowLevels ? ToenowLevels.LEVELS : [
    { level: 1, name: 'Beginner', badgeText: 'LVL 1 · BEGINNER', minWave: 1, maxWave: 5, startWave: 1 },
    { level: 2, name: 'Intermediate', badgeText: 'LVL 2 · INTERMEDIATE', minWave: 6, maxWave: 10, startWave: 6 },
    { level: 3, name: 'Advanced', badgeText: 'LVL 3 · ADVANCED', minWave: 11, maxWave: 15, startWave: 11 },
    { level: 4, name: 'Expert', badgeText: 'LVL 4 · EXPERT', minWave: 16, maxWave: 20, startWave: 16 },
    { level: 5, name: 'Master', badgeText: 'LVL 5 · MASTER', minWave: 21, maxWave: Infinity, startWave: 21 }
  ];

  var GAME_STORAGE_KEYS = (ToenowLevels && ToenowLevels.GAME_STORAGE_KEYS) || {
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

  function getLevelInfo(wave) {
    if (ToenowLevels && typeof ToenowLevels.getLevelInfo === 'function') {
      return ToenowLevels.getLevelInfo(wave);
    }
    var w = Number(wave) || 1;
    if (w < 1) w = 1;
    for (var i = 0; i < LEVELS.length; i++) {
      var lvl = LEVELS[i];
      if (w >= lvl.minWave && w <= lvl.maxWave) return lvl;
    }
    return LEVELS[LEVELS.length - 1];
  }

  function ToenowGameSDK(config) {
    if (!(this instanceof ToenowGameSDK)) {
      return new ToenowGameSDK(config);
    }
    this.config = config || {};
    this.gameId = this.config.gameId || 'unknown-game';
    this.category = this.config.category || 'puzzle';
    this.hasWaves = this.config.hasWaves !== undefined ? Boolean(this.config.hasWaves) : (this.config.wavesPerLevel !== undefined ? this.config.wavesPerLevel > 1 : true);
    this.maxLevels = Number(this.config.maxLevels) || 5;
    this.keys = GAME_STORAGE_KEYS[this.gameId] || {
      score: this.gameId.replace(/-/g, '_') + '_best_score',
      wave: this.gameId.replace(/-/g, '_') + '_best_wave'
    };
    this.isPractice = false;
    this.runActive = false;
    try { this.materialLedger = ToenowMaterials?.create({ storage: typeof localStorage !== 'undefined' ? localStorage : null }); } catch (_) {}
    instances[this.gameId] = this;
    this.runStartTime = Date.now();
    this.platform = ToenowPlatform ? new ToenowPlatform(this.config) : null;
  }

  ToenowGameSDK.prototype.loadBestScore = function () {
    try {
      if (typeof localStorage === 'undefined') return 0;
      return Number(localStorage.getItem(this.keys.score) || 0) || 0;
    } catch (_) {
      return 0;
    }
  };

  ToenowGameSDK.prototype.loadBestWave = function () {
    try {
      if (typeof localStorage === 'undefined') return 1;
      return Number(localStorage.getItem(this.keys.wave) || 1) || 1;
    } catch (_) {
      return 1;
    }
  };

  ToenowGameSDK.prototype.saveBestRecords = function (score, wave) {
    if (this.isPractice) return { saved: false, reason: 'practice_mode' };
    try { if (typeof localStorage === 'undefined') return { saved: false }; }
    catch (_) { return { saved: false, reason: 'storage_unavailable' }; }

    var numericScore = Math.max(0, Math.round(Number(score) || 0));
    var numericWave = Math.max(1, Math.round(Number(wave) || 1));

    var curBestScore = this.loadBestScore();
    var curBestWave = this.loadBestWave();

    var updatedScore = Math.max(curBestScore, numericScore);
    var updatedWave = Math.max(curBestWave, numericWave);

    try {
      if (numericScore > curBestScore) {
        localStorage.setItem(this.keys.score, String(updatedScore));
      }
      if (numericWave > curBestWave && this.keys.wave) {
        localStorage.setItem(this.keys.wave, String(updatedWave));
      }
    } catch (_) { return { saved: false, reason: 'storage_unavailable' }; }

    return {
      saved: true,
      bestScore: updatedScore,
      bestWave: updatedWave,
      isNewBestScore: numericScore > curBestScore,
      isNewBestWave: numericWave > curBestWave
    };
  };

  ToenowGameSDK.prototype.syncTitleUI = function (customValues) {
    if (typeof document === 'undefined') return;
    customValues = customValues || {};

    var bestScore = customValues.bestScore !== undefined ? customValues.bestScore : this.loadBestScore();
    var bestWave = customValues.bestWave !== undefined ? customValues.bestWave : this.loadBestWave();
    var levelInfo = getLevelInfo(bestWave);

    // Sync score elements
    var scoreEls = [
      document.getElementById('title-best-score'),
      document.getElementById('titleBestScore'),
      document.querySelector('[data-toenow-record="score"]')
    ];
    scoreEls.forEach(function (el) {
      if (el) el.textContent = bestScore > 0 ? Number(bestScore).toLocaleString() : '0';
    });

    // Sync wave elements
    var waveEls = [
      document.getElementById('title-best-wave'),
      document.getElementById('titleBestWave'),
      document.querySelector('[data-toenow-record="wave"]')
    ];
    var displayWave = String(Math.max(1, bestWave));
    waveEls.forEach(function (el) {
      if (el) el.textContent = displayWave;
    });

    // If game has no waves (hasWaves: false), update label from BEST WAVE to BEST LEVEL
    if (!this.hasWaves) {
      waveEls.forEach(function (el) {
        if (!el || !el.parentElement || typeof el.parentElement.querySelector !== 'function') return;
        var labelEl = el.parentElement.querySelector('.unified-record-label');
        if (labelEl) labelEl.textContent = 'BEST LEVEL';
      });
      var dedicatedWaveLabel = document.getElementById('title-best-wave-label');
      if (dedicatedWaveLabel) dedicatedWaveLabel.textContent = 'BEST LEVEL';
    }

    // Sync level elements
    var levelEls = [
      document.getElementById('title-best-level'),
      document.getElementById('titleBestLvl'),
      document.querySelector('[data-toenow-record="level"]')
    ];
    levelEls.forEach(function (el) {
      if (el) {
        if (bestScore <= 0 && bestWave <= 1) {
          el.textContent = 'LVL 1 · BEGINNER';
        } else {
          el.textContent = levelInfo.badgeText;
        }
      }
    });

    return {
      bestScore: bestScore,
      bestWave: bestWave,
      levelInfo: levelInfo
    };
  };

  ToenowGameSDK.prototype.reportGameOver = function (options) {
    this.finishMaterials(options);
    this.runActive = false;
    options = options || {};
    var rawScore = Math.max(0, Math.round(Number(options.score) || 0));
    var rawWave = Math.max(1, Math.round(Number(options.wave) || 1));
    var isPractice = options.isPractice !== undefined ? Boolean(options.isPractice) : this.isPractice;

    try {
      if (typeof window !== 'undefined' && window.ToenowAnalytics) {
        window.ToenowAnalytics.endGame(this.gameId, { score: rawScore, wave: rawWave, isPractice: isPractice });
      }
    } catch (_) {}

    if (!isPractice && this.category !== 'relax') {
      this.saveBestRecords(rawScore, rawWave);
    }

    // Immediately refresh title records so returning to title has zero delay
    this.syncTitleUI();

    var payload = {
      type: 'GAME_OVER',
      gameId: this.gameId,
      category: this.category,
      score: rawScore,
      wave: rawWave,
      level: getLevelInfo(rawWave).level,
      levelName: getLevelInfo(rawWave).name,
      isPractice: isPractice,
      accuracy: options.accuracy,
      streak: options.streak,
      rank: options.rank,
      duration: options.duration
    };

    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(payload, '*');
      } catch (_) {}
    }

    return payload;
  };

  ToenowGameSDK.prototype.setupPractice = function (onStartGame) {
    if (typeof document === 'undefined') return;
    var self = this;
    if (ToenowLevels && typeof ToenowLevels.setupPracticeMode === 'function') {
      ToenowLevels.setupPracticeMode({
        gameId: this.gameId,
        hasWaves: this.hasWaves,
        onStartGame: function (startWave, isPractice) {
          self.isPractice = Boolean(isPractice);
          if (typeof onStartGame === 'function') {
            onStartGame(startWave, isPractice);
          }
        }
      });
    }
  };

  ToenowGameSDK.prototype.share = function (options) {
    options = options || {};
    if (ToenowLevels && typeof ToenowLevels.shareScore === 'function') {
      ToenowLevels.shareScore({
        gameId: this.gameId,
        gameTitle: options.gameTitle || this.config.gameTitle,
        score: options.score !== undefined ? options.score : this.loadBestScore(),
        wave: options.wave !== undefined ? options.wave : this.loadBestWave()
      });
    }
  };

  ToenowGameSDK.prototype.setPracticeMode = function (isPractice) {
    this.isPractice = Boolean(isPractice);
  };

  ToenowGameSDK.prototype.startRun = function (options) {
    this.runStartTime = Date.now();
    options = options || {};
    this.runActive = true;
    this.runStartWave = Math.max(1, Number(options.wave) || 1);
    this.progressLevel = 0;
    this.setPracticeMode(options.isPractice !== undefined ? options.isPractice : this.isPractice);
    this.cancelMaterials();
    const isLesson = typeof window !== 'undefined' && window.ToenowTutorials?.isActive?.(this.gameId);
    this.materialRun = this.materialLedger?.beginRun(this.gameId, { wave: this.runStartWave, isPractice: this.isPractice, isPreview: options.isPreview || isLesson });
    if (typeof window !== 'undefined') window.ToenowMaterialUI?.clear();
    try {
      if (typeof window !== 'undefined' && window.ToenowAnalytics) {
        window.ToenowAnalytics.startGame(this.gameId, { wave: options.wave || 1, isPractice: this.isPractice });
      }
    } catch (_) {}
  };

  ToenowGameSDK.getInstance = function (gameId) { return instances[gameId] || null; };
  ToenowGameSDK.prototype.cancelMaterials = function () {
    this.materialLedger?.cancelRun(this.materialRun);
    this.materialRun = null;
    this.materialGeneration = (this.materialGeneration || 0) + 1;
  };
  ToenowGameSDK.prototype.finishMaterials = function (options) {
    const token = this.materialRun, generation = this.materialGeneration;
    this.materialRun = null;
    const data = Object.assign({}, options, { isPractice: this.isPractice || options?.isPractice,
      isPreview: options?.isPreview || (typeof window !== 'undefined' && window.ToenowTutorials?.isActive?.(this.gameId)) });
    const finish = () => {
      const reward = this.materialLedger?.finishRun(token, data) || { amount: 0 };
      if (typeof window !== 'undefined' && generation === this.materialGeneration && (reward.amount || reward.error)) window.ToenowMaterialUI?.show(this.gameId, reward);
      return reward;
    };
    // Serialize writes from other same-origin game/Hub tabs where Web Locks exist.
    if (typeof window !== 'undefined' && window.navigator?.locks) return window.navigator.locks.request('toenow-materials-v1', finish);
    return finish();
  };
  ToenowGameSDK.prototype.reportProgress = function (options) {
    options = options || {};
    var wave = options.wave;
    if (!this.runActive || this.isPractice || !Number.isSafeInteger(wave) || wave < 1) return null;
    var completed = getLevelInfo(wave).level - 1;
    // The rescue train has one puzzle per tier and reports its actual clear.
    if (this.gameId === 'animal-rescue-train' && Number.isSafeInteger(options.completedLevel)) completed = options.completedLevel;
    if (completed < 1 || completed > 5 || completed <= this.progressLevel ||
      (this.gameId !== 'animal-rescue-train' && wave <= this.runStartWave)) return null;
    this.progressLevel = completed;
    try {
      if (typeof localStorage !== 'undefined') {
        var saved; try { saved = JSON.parse(localStorage.getItem('toenow_game_milestones_v1') || '{}'); } catch (_) {}
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
        saved[this.gameId] = Math.max(Number(saved[this.gameId]) || 0, completed);
        localStorage.setItem('toenow_game_milestones_v1', JSON.stringify(saved));
        if (wave > this.loadBestWave()) localStorage.setItem(this.keys.wave, String(wave));
      }
    } catch (_) {}
    var payload = { type: 'GAME_PROGRESS', gameId: this.gameId, wave: wave, completedLevel: completed, isPractice: false };
    try { if (typeof window !== 'undefined' && window.parent && window.parent !== window) window.parent.postMessage(payload, '*'); } catch (_) {}
    return payload;
  };

  // Opt-in lifecycle entry points; existing games using reportGameOver stay compatible.
  ToenowGameSDK.prototype.start = function (options) {
    options = options || {};
    this.setPracticeMode(Boolean(options.isPractice));
    this.startRun(options);
    if (typeof this.config.onStart === 'function') this.config.onStart(options);
  };
  ['Pause', 'Resume', 'Restart'].forEach(function (name) {
    ToenowGameSDK.prototype[name.toLowerCase()] = function () {
      var callback = this.config['on' + name];
      if (typeof callback === 'function') callback();
    };
  });
  ToenowGameSDK.prototype.handleGameOver = function (options) {
    options = Object.assign({}, options || {});
    this.setPracticeMode(options.isPractice !== undefined ? options.isPractice : this.isPractice);
    options.isPractice = this.isPractice;
    options.duration = Math.max(0, Number(options.duration) || Date.now() - this.runStartTime);
    if (!this.isPractice) {
      var check = this.verifyScorePlausibility(options.score, options.wave, options.duration / 1000);
      if (!check.isValid) return check;
    }
    return this.reportGameOver(options);
  };
  ToenowGameSDK.prototype.exitToHub = function () {
    if (typeof window === 'undefined') return;
    if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'CLOSE_GAME', gameId: this.gameId }, '*');
    else window.location.href = '../../index.html';
  };

  /**
   * Ad Integration: Show a rewarded ad (e.g. for player revive or double score)
   */
  ToenowGameSDK.prototype.showRewardedAd = function (options) {
    if (this.platform) {
      this.platform.showRewardedAd(options);
    } else if (options && typeof options.onReward === 'function') {
      options.onReward({ verified: true });
    }
  };

  /**
   * Ad Integration: Show an interstitial ad (e.g. on game over)
   */
  ToenowGameSDK.prototype.showInterstitialAd = function (options) {
    if (this.platform) {
      this.platform.showInterstitialAd(options);
    } else if (options && typeof options.onComplete === 'function') {
      options.onComplete();
    }
  };

  /**
   * Anti-Cheat Plausibility Check
   */
  ToenowGameSDK.prototype.verifyScorePlausibility = function (score, wave, durationSec) {
    if (!ToenowSecurity) return { isValid: true };
    return ToenowSecurity.verifyScorePlausibility({
      gameId: this.gameId,
      score: score,
      wave: wave,
      durationSec: durationSec
    });
  };

  return ToenowGameSDK;
});
