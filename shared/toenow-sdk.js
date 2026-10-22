// toenow-sdk.js - Unified Lifecycle & Storage SDK for Toenow Matrix Games
// Compatible with Node.js and Browser environments.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./toenow-levels.js'),
      require('./toenow-security.js'),
      require('./toenow-platform.js')
    );
  } else {
    root.ToenowGameSDK = factory(root.ToenowLevels, root.ToenowSecurity, root.ToenowPlatform);
  }
})(typeof self !== 'undefined' ? self : this, function (ToenowLevels, ToenowSecurity, ToenowPlatform) {
  'use strict';

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
    this.keys = GAME_STORAGE_KEYS[this.gameId] || {
      score: this.gameId.replace(/-/g, '_') + '_best_score',
      wave: this.gameId.replace(/-/g, '_') + '_best_wave'
    };
    this.isPractice = false;
    this.runStartTime = Date.now();
    this.platform = ToenowPlatform ? new ToenowPlatform(this.config) : null;
  }

  ToenowGameSDK.prototype.loadBestScore = function () {
    if (typeof localStorage === 'undefined') return 0;
    try {
      return Number(localStorage.getItem(this.keys.score) || 0) || 0;
    } catch (_) {
      return 0;
    }
  };

  ToenowGameSDK.prototype.loadBestWave = function () {
    if (typeof localStorage === 'undefined') return 1;
    try {
      return Number(localStorage.getItem(this.keys.wave) || 1) || 1;
    } catch (_) {
      return 1;
    }
  };

  ToenowGameSDK.prototype.saveBestRecords = function (score, wave) {
    if (this.isPractice) return { saved: false, reason: 'practice_mode' };
    if (typeof localStorage === 'undefined') return { saved: false };

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
    } catch (_) {}

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
    waveEls.forEach(function (el) {
      if (el) el.textContent = String(Math.max(1, bestWave));
    });

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
    options = options || {};
    var rawScore = Math.max(0, Math.round(Number(options.score) || 0));
    var rawWave = Math.max(1, Math.round(Number(options.wave) || 1));
    var isPractice = options.isPractice !== undefined ? Boolean(options.isPractice) : this.isPractice;

    if (!isPractice) {
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
        onStart: function (startWave, isPractice) {
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

  ToenowGameSDK.prototype.startRun = function () {
    this.runStartTime = Date.now();
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
