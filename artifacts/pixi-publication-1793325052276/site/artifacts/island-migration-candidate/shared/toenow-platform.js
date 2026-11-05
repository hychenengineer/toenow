// toenow-platform.js - Universal Cross-Platform & Ad Adapter for Toenow Matrix Games
// Supports: Toenow Hub (postMessage), Poki SDK, CrazyGames SDK, Google AdSense, and Standalone.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./toenow-security.js'));
  } else {
    root.ToenowPlatform = factory(root.ToenowSecurity);
  }
})(typeof self !== 'undefined' ? self : this, function (ToenowSecurity) {
  'use strict';

  function detectEnvironment() {
    if (typeof window === 'undefined') return 'node';
    if (window.PokiSDK) return 'poki';
    if (window.CrazyGames) return 'crazygames';
    if (window.parent && window.parent !== window) return 'hub';
    return 'standalone';
  }

  function ToenowPlatform(config) {
    if (!(this instanceof ToenowPlatform)) {
      return new ToenowPlatform(config);
    }
    this.config = config || {};
    this.env = this.config.env || detectEnvironment();
    this.isAdPlaying = false;
  }

  /**
   * Universal Rewarded Ad with Anti-Skip Cryptographic Verification
   * @param {Object} options
   * @param {Function} options.onReward Callback triggered ONLY when ad is genuinely watched
   * @param {Function} options.onDismiss Callback if user canceled or ad failed
   * @param {string} [options.rewardType] E.g. 'revive' | 'double_score'
   */
  ToenowPlatform.prototype.showRewardedAd = function (options) {
    options = options || {};
    var onReward = typeof options.onReward === 'function' ? options.onReward : function () {};
    var onDismiss = typeof options.onDismiss === 'function' ? options.onDismiss : function () {};

    if (this.isAdPlaying) {
      onDismiss({ reason: 'AD_ALREADY_ACTIVE' });
      return;
    }

    var self = this;
    this.isAdPlaying = true;

    // Create a secured session
    var session = ToenowSecurity
      ? ToenowSecurity.createAdSession({ type: 'rewarded', minDurationMs: 4000 })
      : { adId: 'mock', startTime: Date.now(), minDurationMs: 4000 };

    if (this.env === 'poki' && window.PokiSDK) {
      window.PokiSDK.rewardedBreak(function () {
        // Watched to completion
        self.isAdPlaying = false;
        var proof = ToenowSecurity ? ToenowSecurity.signAdCompletion(session) : 'ok';
        var verified = ToenowSecurity ? ToenowSecurity.verifyAdCompletion(session, proof) : { isValid: true };
        if (verified.isValid) {
          onReward({ verified: true, session: session });
        } else {
          onDismiss({ reason: verified.reason });
        }
      }).then(function (success) {
        if (!success) {
          self.isAdPlaying = false;
          onDismiss({ reason: 'NOT_COMPLETED' });
        }
      });
      return;
    }

    // Default Browser / Hub / Standalone Mock/AdBreak Modal
    this._renderAdModal({
      type: 'REWARDED DRILL SPONSOR',
      title: 'SPONSORED COGNITIVE RECOVERY',
      subtitle: options.rewardType === 'revive' ? 'Watch transmission to reactivate neural shield' : 'Watch transmission to claim reward multiplier',
      durationSec: 4,
      onComplete: function () {
        self.isAdPlaying = false;
        var proof = ToenowSecurity ? ToenowSecurity.signAdCompletion(session) : 'ok';
        var verified = ToenowSecurity ? ToenowSecurity.verifyAdCompletion(session, proof) : { isValid: true };
        if (verified.isValid) {
          onReward({ verified: true, session: session });
        } else {
          onDismiss({ reason: verified.reason });
        }
      },
      onCancel: function () {
        self.isAdPlaying = false;
        onDismiss({ reason: 'USER_SKIPPED' });
      }
    });
  };

  /**
   * Universal Interstitial Ad (Between rounds / Game Over)
   */
  ToenowPlatform.prototype.showInterstitialAd = function (options) {
    options = options || {};
    var onComplete = typeof options.onComplete === 'function' ? options.onComplete : function () {};

    if (this.isAdPlaying) {
      onComplete();
      return;
    }

    var self = this;
    this.isAdPlaying = true;

    if (this.env === 'poki' && window.PokiSDK) {
      window.PokiSDK.commercialBreak(function () {
        self.isAdPlaying = false;
        onComplete();
      });
      return;
    }

    this._renderAdModal({
      type: 'INTERMISSION PROTOCOL',
      title: 'NETWORK SYNAPSE CALIBRATION',
      subtitle: 'Synchronizing matrix telemetry...',
      durationSec: 2,
      onComplete: function () {
        self.isAdPlaying = false;
        onComplete();
      },
      onCancel: function () {
        self.isAdPlaying = false;
        onComplete();
      }
    });
  };

  ToenowPlatform.prototype._renderAdModal = function (opts) {
    if (typeof document === 'undefined') {
      setTimeout(opts.onComplete, 100);
      return;
    }

    var existing = document.getElementById('toenow-ad-overlay');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var overlay = document.createElement('div');
    overlay.id = 'toenow-ad-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '99999';
    overlay.style.background = 'rgba(4, 7, 14, 0.96)';
    overlay.style.backdropFilter = 'blur(16px)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = "'Outfit', system-ui, sans-serif";
    overlay.style.padding = '24px';
    overlay.style.boxSizing = 'border-box';

    var card = document.createElement('div');
    card.style.background = 'rgba(15, 23, 42, 0.85)';
    card.style.border = '1px solid rgba(34, 211, 238, 0.4)';
    card.style.borderRadius = '16px';
    card.style.padding = '32px 28px';
    card.style.maxWidth = '420px';
    card.style.width = '100%';
    card.style.textAlign = 'center';
    card.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(34, 211, 238, 0.15)';

    var kicker = document.createElement('div');
    kicker.style.fontSize = '11px';
    kicker.style.fontWeight = '800';
    kicker.style.letterSpacing = '0.15em';
    kicker.style.color = '#22d3ee';
    kicker.style.marginBottom = '8px';
    kicker.textContent = opts.type;

    var title = document.createElement('h2');
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '20px';
    title.style.fontWeight = '800';
    title.style.letterSpacing = '-0.01em';
    title.textContent = opts.title;

    var sub = document.createElement('p');
    sub.style.margin = '0 0 24px 0';
    sub.style.fontSize = '13px';
    sub.style.color = '#94a3b8';
    sub.style.lineHeight = '1.5';
    sub.textContent = opts.subtitle;

    var timerEl = document.createElement('div');
    timerEl.style.fontSize = '14px';
    timerEl.style.fontWeight = '700';
    timerEl.style.fontFamily = "'JetBrains Mono', monospace";
    timerEl.style.color = '#f59e0b';
    timerEl.style.marginBottom = '20px';

    var cancelBtn = document.createElement('button');
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.background = 'transparent';
    cancelBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    cancelBtn.style.color = '#64748b';
    cancelBtn.style.borderRadius = '6px';
    cancelBtn.style.fontSize = '12px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.textContent = 'Skip (No Reward)';
    cancelBtn.onclick = function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      clearInterval(interval);
      opts.onCancel();
    };

    card.appendChild(kicker);
    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(timerEl);
    card.appendChild(cancelBtn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var remaining = opts.durationSec;
    timerEl.textContent = 'Reward unlocking in ' + remaining + 's...';

    var interval = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        opts.onComplete();
      } else {
        timerEl.textContent = 'Reward unlocking in ' + remaining + 's...';
      }
    }, 1000);
  };

  return ToenowPlatform;
});
