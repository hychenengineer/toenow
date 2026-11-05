const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function load(host = 'toenow.com', parent) {
  const scripts = [];
  const window = { location: { hostname: host, protocol: 'https:', origin: 'https://' + host, pathname: '/', href: 'https://' + host + '/?email=private#token' } };
  window.parent = parent || window;
  const document = { title: 'Toenow', referrer: 'https://example.com/?secret=private', createElement: () => ({}), head: { appendChild: el => scripts.push(el) } };
  const context = vm.createContext({ window, document, URL, Date });
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/toenow-analytics.js'), 'utf8'), context);
  return { window, scripts, context, events: () => Array.from(window.dataLayer || [], x => Array.from(x)).filter(x => x[0] === 'event') };
}

test('production installs GA once, strips query and fragment, and records actual runs', () => {
  const app = load();
  assert.equal(app.scripts.length, 1);
  assert.match(app.scripts[0].src, /G-PWQER2ZXV5$/);
  const config = Array.from(app.window.dataLayer[1]);
  assert.equal(config[0], 'config');
  assert.equal(config[2].page_location, 'https://toenow.com/');
  assert.equal(config[2].page_referrer, 'https://example.com/');
  const a = app.window.ToenowAnalytics;
  a.openGame('number-pop');
  a.startGame('number-pop', { wave: 6, isPractice: true });
  a.endGame('number-pop', { score: 25, wave: 7, isPractice: true });
  a.endGame('number-pop', { score: 25, wave: 7 });
  assert.deepEqual(app.events().map(x => x[1]), ['game_open', 'game_start', 'game_end']);
  assert.equal(app.events()[1][2].game_id, 'number-pop');
  assert.equal(app.events()[1][2].play_mode, 'practice');
  assert.equal(app.events()[1][2].wave, 6);
  a.startGame('number-pop', {});
  assert.equal(app.events().filter(x => x[1] === 'game_start').length, 2);
  vm.runInContext(fs.readFileSync(path.join(root, 'shared/toenow-analytics.js'), 'utf8'), app.context);
  assert.equal(app.scripts.length, 1);
});

test('local development sends nothing; unknown event data cannot leak into GA', () => {
  for (const host of ['localhost', '127.0.0.1', '192.168.1.5', 'preview.example.com', 'branch.toenow.pages.dev']) {
    const app = load(host);
    app.window.ToenowAnalytics.startGame('number-pop', {});
    assert.equal(app.scripts.length, 0);
    assert.equal(app.events().length, 0);
  }
  const app = load();
  app.window.ToenowAnalytics.startGame('number-pop', { email: 'private', wave: Infinity });
  assert.equal(app.events()[0][2].email, undefined);
  assert.equal(app.events()[0][2].wave, 1);
  app.window.ToenowAnalytics.startGame('made-up', {});
  assert.equal(app.events().length, 1);
});

test('the configured Cloudflare production stream and custom domains all collect', () => {
  for (const host of ['toenow.pages.dev', 'toenow.com', 'www.toenow.com']) {
    const app = load(host);
    assert.equal(app.window.ToenowAnalytics.enabled, true);
    assert.equal(app.scripts.length, 1);
  }
});

test('same-origin game iframe uses parent tag without an extra page view', () => {
  const hub = load();
  const game = load('toenow.com', hub.window);
  game.window.ToenowAnalytics.startGame('tap-match', { wave: 1 });
  assert.equal(game.scripts.length, 0);
  assert.equal(game.window.dataLayer, undefined);
  assert.equal(hub.events()[0][1], 'game_start');
});

test('every entry point loads analytics before SDK', () => {
  const ids = Object.keys(require('../shared/toenow-levels.js').GAME_STORAGE_KEYS);
  for (const file of ['index.html', ...ids.map(id => 'games/' + id + '/index.html')]) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(html.includes('toenow-analytics.js'), file);
    assert.ok(html.indexOf('toenow-analytics.js') < html.indexOf('toenow-sdk.js'), file);
  }
});

test('SDK start and settlement call shared analytics, without changing game-over payload', () => {
  const calls = [];
  global.window = { ToenowAnalytics: { startGame: (...args) => calls.push(['start', ...args]), endGame: (...args) => calls.push(['end', ...args]) } };
  try {
    const SDK = require('../shared/toenow-sdk.js');
    const sdk = new SDK({ gameId: 'number-pop' });
    sdk.startRun({ wave: 6, isPractice: true });
    const payload = sdk.reportGameOver({ score: 25, wave: 7, isPractice: true });
    assert.deepEqual(calls.map(x => x[0]), ['start', 'end']);
    assert.equal(calls[0][2].wave, 6);
    assert.equal(payload.isPractice, true);
    window.ToenowAnalytics.startGame = () => { throw Error('blocked'); };
    assert.doesNotThrow(() => sdk.startRun({}));
  } finally { delete global.window; }
});
