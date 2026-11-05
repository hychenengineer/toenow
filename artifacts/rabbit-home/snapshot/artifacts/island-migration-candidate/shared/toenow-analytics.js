// Shared GA4 adapter. Only production hosts collect data; SDK calls remain optional.
(function (window, document) {
  'use strict';
  if (window.ToenowAnalytics) return;
  var measurementId = 'G-PWQER2ZXV5';
  var games = {
    'number-pop': 'Number Pop', 'ball-track': 'Ball Track',
    'block-match': 'Block Match', 'add-up': 'Add Up',
    'space-scale': 'Space Scale', 'tap-match': 'Tap Match',
    'spot-quick': 'Spot Quick', 'shadow-match': 'Shadow Match',
    'flash-brain': 'Flash Brain', 'animal-rescue-train': 'Animal Rescue Train'
  };
  var enabled = window.location.protocol === 'https:' && /^(?:toenow\.pages\.dev|(?:www\.)?toenow\.com)$/.test(window.location.hostname);
  var active = Object.create(null);
  function cleanUrl(value) {
    try { var url = new URL(value); return url.origin + url.pathname; }
    catch (_) { return ''; }
  }
  function number(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
  }
  function send(name, id, options) {
    if (!enabled || !Object.prototype.hasOwnProperty.call(games, id)) return;
    options = options || {};
    var params = { game_id: id, game_name: games[id], send_to: measurementId };
    if (name !== 'game_open') {
      params.play_mode = options.isPractice ? 'practice' : 'normal';
      params.wave = Math.max(1, number(options.wave, 1));
    }
    if (name === 'game_end') params.score = number(options.score, 0);
    window.gtag('event', name, params);
  }
  function safe(fn) {
    return function () { try { return fn.apply(null, arguments); } catch (_) { /* Analytics must never interrupt a game. */ } };
  }
  var api = {
    enabled: enabled,
    openGame: safe(function (id) { send('game_open', id); }),
    startGame: safe(function (id, options) { active[id] = options || {}; send('game_start', id, options); }),
    endGame: safe(function (id, options) {
      if (!Object.prototype.hasOwnProperty.call(active, id)) return;
      var run = active[id]; delete active[id];
      send('game_end', id, Object.assign({}, run, options || {}));
    })
  };
  // A Hub iframe shares its parent's tag and client identity. No iframe page_view.
  var delegated = false;
  try {
    if (window.parent !== window && window.parent.location.origin === window.location.origin && window.parent.ToenowAnalytics) {
      api = window.parent.ToenowAnalytics;
      delegated = true;
    }
  } catch (_) { /* Standalone tracking also works inside another site's iframe. */ }
  window.ToenowAnalytics = api;
  if (enabled && !delegated) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        page_location: window.location.origin + window.location.pathname,
        page_referrer: cleanUrl(document.referrer),
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
      document.head.appendChild(script);
    } catch (_) { /* Blocked scripts do not affect gameplay. */ }
  }
  var match = /^\/games\/([^/]+)\//.exec(window.location.pathname);
  if (match) api.openGame(match[1]);
})(window, document);
