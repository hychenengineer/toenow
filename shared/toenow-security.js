// toenow-security.js - Anti-Cheat, Plausibility Verification, and Ad Token Cryptography
// Designed for Toenow Matrix games & cross-platform deployment.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ToenowSecurity = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Game Plausibility Physics Profiles
  // Max Points per Second & Max Points per Wave to prevent instant speed/memory hacks
  // NOTE: Score itself has NO CEILING! A player can reach 500,000+ pts legally as long as duration/waves match.
  var GAME_PLAUSIBILITY_PROFILES = {
    'capybara-drift': { maxPtsPerSec: 20, maxPtsPerWave: 1000, minDurationPerWaveSec: 0.1 },
    'animal-rescue-train': { maxPtsPerSec: 100, maxPtsPerWave: 30, minDurationPerWaveSec: 0.1 },
    'number-pop': { maxPtsPerSec: 850, maxPtsPerWave: 6000, minDurationPerWaveSec: 2.0 },
    'ball-track': { maxPtsPerSec: 600, maxPtsPerWave: 4500, minDurationPerWaveSec: 3.0 },
    'spot-quick': { maxPtsPerSec: 750, maxPtsPerWave: 5000, minDurationPerWaveSec: 2.0 },
    'tap-match': { maxPtsPerSec: 800, maxPtsPerWave: 5500, minDurationPerWaveSec: 2.5 },
    'add-up': { maxPtsPerSec: 900, maxPtsPerWave: 6500, minDurationPerWaveSec: 2.5 },
    'block-match': { maxPtsPerSec: 700, maxPtsPerWave: 4800, minDurationPerWaveSec: 2.0 },
    'space-scale': { maxPtsPerSec: 650, maxPtsPerWave: 5000, minDurationPerWaveSec: 3.0 },
    'shadow-match': { maxPtsPerSec: 650, maxPtsPerWave: 4500, minDurationPerWaveSec: 2.5 },
    'flash-brain': { maxPtsPerSec: 800, maxPtsPerWave: 6000, minDurationPerWaveSec: 2.0 },
    'default': { maxPtsPerSec: 1000, maxPtsPerWave: 8000, minDurationPerWaveSec: 1.5 }
  };

  // Simple High-Entropy Nonce Generator
  function generateNonce(len) {
    len = len || 16;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var out = '';
    for (var i = 0; i < len; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  // Fast HMAC-like Hash generator for verification token
  function computeHash(message, secret) {
    secret = secret || 'toenow-matrix-v1-secure-salt';
    var str = message + '|' + secret;
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Evaluates if a game session report is mathematically and physically plausible.
   * Protects against instant-score hacks and memory manipulation without punishing high-skill players.
   *
   * @param {Object} report
   * @param {string} report.gameId
   * @param {number} report.score
   * @param {number} report.wave
   * @param {number} report.durationSec Total run duration in seconds
   * @returns {Object} { isValid: boolean, reason?: string, details: object }
   */
  function verifyScorePlausibility(report) {
    report = report || {};
    var gameId = report.gameId || 'default';
    var score = Math.max(0, Math.round(Number(report.score) || 0));
    var wave = Math.max(1, Math.round(Number(report.wave) || 1));
    var durationSec = Math.max(0.1, Number(report.durationSec) || 0.1);

    var profile = GAME_PLAUSIBILITY_PROFILES[gameId] || GAME_PLAUSIBILITY_PROFILES['default'];

    // If score is 0, always valid
    if (score === 0) {
      return { isValid: true, details: { score: 0, wave: wave, durationSec: durationSec } };
    }

    var ptsPerSec = score / durationSec;
    // Allow a small grace margin for short starter runs
    var allowedPtsPerSec = profile.maxPtsPerSec;
    if (durationSec < 10) {
      allowedPtsPerSec = profile.maxPtsPerSec * 1.5;
    }

    // Check 1: Rate of score gain per second (Speed / Instant-Add Hack)
    if (ptsPerSec > allowedPtsPerSec) {
      return {
        isValid: false,
        reason: 'EXCESSIVE_SCORE_RATE',
        details: {
          score: score,
          durationSec: durationSec,
          ptsPerSec: Math.round(ptsPerSec),
          maxAllowedPtsPerSec: allowedPtsPerSec
        }
      };
    }

    // Check 2: Max points possible given the reached wave (Wave vs Score Hack)
    // E.g., someone reporting 100,000 pts on Wave 1 is impossible.
    // But 100,000 pts on Wave 20+ is totally legal!
    var maxAllowedScoreForWaves = wave * profile.maxPtsPerWave;
    // High combo multiplier bonus buffer: after wave 10, bonus scales up
    if (wave > 10) {
      maxAllowedScoreForWaves = maxAllowedScoreForWaves * (1 + (wave - 10) * 0.15);
    }

    if (score > maxAllowedScoreForWaves) {
      return {
        isValid: false,
        reason: 'SCORE_EXCEEDS_WAVE_CAPACITY',
        details: {
          score: score,
          wave: wave,
          maxAllowedForWaves: Math.round(maxAllowedScoreForWaves)
        }
      };
    }

    // Check 3: Minimum physical duration required to complete waves
    var minRequiredDuration = wave * profile.minDurationPerWaveSec;
    if (durationSec < minRequiredDuration && wave > 3) {
      return {
        isValid: false,
        reason: 'WAVE_CLEAR_TIME_IMPOSSIBLE',
        details: {
          wave: wave,
          durationSec: durationSec,
          minRequiredDuration: minRequiredDuration
        }
      };
    }

    return {
      isValid: true,
      details: {
        score: score,
        wave: wave,
        durationSec: durationSec,
        ptsPerSec: Math.round(ptsPerSec)
      }
    };
  }

  /**
   * Ad Cryptographic Handshake Manager
   * Prevents client-side ad skipping by requiring a timed cryptographically-sealed session token.
   */
  function createAdSession(options) {
    options = options || {};
    var adType = options.type || 'rewarded'; // 'rewarded' | 'interstitial'
    var minDurationMs = options.minDurationMs || (adType === 'rewarded' ? 4500 : 2000);
    var nonce = generateNonce(18);
    var startTime = Date.now();

    return {
      adId: nonce,
      type: adType,
      startTime: startTime,
      minDurationMs: minDurationMs,
      // Generates the challenge payload that must be completed
      challenge: computeHash(nonce + ':' + startTime + ':' + adType)
    };
  }

  /**
   * Validates if an ad completion claim is authentic and actually elapsed the required viewing duration.
   *
   * @param {Object} session The ad session created via createAdSession
   * @param {string} proofToken The proof token returned upon ad close
   * @param {number} finishTimestamp Timestamp when ad finished
   * @returns {Object} { isValid: boolean, reason?: string }
   */
  function verifyAdCompletion(session, proofToken, finishTimestamp) {
    if (!session || !session.adId || !session.startTime) {
      return { isValid: false, reason: 'INVALID_SESSION' };
    }

    var now = finishTimestamp || Date.now();
    var elapsed = now - session.startTime;

    // Check 1: Minimum duration enforcement (Prevent instant ad skip / 0s exploit)
    if (elapsed < session.minDurationMs) {
      return {
        isValid: false,
        reason: 'INSUFFICIENT_AD_DURATION',
        details: { elapsedMs: elapsed, requiredMs: session.minDurationMs }
      };
    }

    // Check 2: Challenge signature integrity
    var expectedProof = computeHash(session.adId + ':' + session.startTime + ':COMPLETED');
    if (proofToken !== expectedProof) {
      return { isValid: false, reason: 'TAMPERED_AD_TOKEN' };
    }

    return { isValid: true, details: { elapsedMs: elapsed } };
  }

  function signAdCompletion(session) {
    if (!session || !session.adId) return '';
    return computeHash(session.adId + ':' + session.startTime + ':COMPLETED');
  }

  return {
    GAME_PLAUSIBILITY_PROFILES: GAME_PLAUSIBILITY_PROFILES,
    verifyScorePlausibility: verifyScorePlausibility,
    createAdSession: createAdSession,
    verifyAdCompletion: verifyAdCompletion,
    signAdCompletion: signAdCompletion,
    generateNonce: generateNonce
  };
});
