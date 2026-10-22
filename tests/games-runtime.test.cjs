const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const GAMES = [
  { id: 'number-pop', path: 'games/number-pop/index.html', startBtn: 'btn-start' },
  { id: 'ball-track', path: 'games/ball-track/index.html', startBtn: 'btn-start-game' },
  { id: 'spot-quick', path: 'games/spot-quick/index.html', startBtn: 'startAnalysisBtn' },
  { id: 'tap-match', path: 'games/tap-match/index.html', startBtn: 'btn-start-run' },
  { id: 'add-up', path: 'games/add-up/index.html', startBtn: 'btn-start-game' },
  { id: 'block-match', path: 'games/block-match/index.html', startBtn: 'btn-start' },
  { id: 'space-scale', path: 'games/space-scale/index.html', startBtn: 'btn-start' },
  { id: 'shadow-match', path: 'games/shadow-match/index.html', startBtn: 'btn-init-optics' }
];

function createMockDOM(html) {
  const idRegex = /id=["']([^"']+)["']/g;
  const existingIds = new Set();
  let m;
  while ((m = idRegex.exec(html)) !== null) {
    existingIds.add(m[1]);
  }

  const elements = new Map();

  function getOrCreateElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        tagName: 'DIV',
        dataset: {},
        classList: {
          contains: () => false,
          toggle: () => {},
          add: () => {},
          remove: () => {}
        },
        setAttribute: () => {},
        getAttribute: () => null,
        removeAttribute: () => {},
        addEventListener: function (ev, fn) {
          if (!this._listeners) this._listeners = {};
          if (!this._listeners[ev]) this._listeners[ev] = [];
          this._listeners[ev].push(fn);
        },
        removeEventListener: function () {},
        dispatchEvent: function (ev) {
          const fns = (this._listeners && this._listeners[ev.type]) || [];
          fns.forEach((fn) => fn(ev));
        },
        style: {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 }),
        parentElement: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 })
        },
        getContext: () => ({
          save: () => {},
          restore: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          roundRect: () => {},
          rect: () => {},
          clip: () => {},
          fill: () => {},
          stroke: () => {},
          fillText: () => {},
          strokeText: () => {},
          setTransform: () => {},
          scale: () => {},
          translate: () => {},
          rotate: () => {},
          clearRect: () => {},
          drawImage: () => {},
          fillRect: () => {},
          strokeRect: () => {},
          measureText: () => ({ width: 10 }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createPattern: () => ({})
        }),
        children: [],
        appendChild: () => {},
        removeChild: () => {},
        blur: () => {},
        focus: () => {}
      });
    }
    return elements.get(id);
  }

  const doc = {
    body: getOrCreateElement('body'),
    getElementById: (id) => {
      if (existingIds.has(id)) {
        return getOrCreateElement(id);
      }
      return null;
    },
    createElement: (tag) => getOrCreateElement('mock-' + Math.random()),
    querySelectorAll: (selector) => [],
    querySelector: (selector) => null,
    addEventListener: function (ev, fn) {
      if (!this._listeners) this._listeners = {};
      if (!this._listeners[ev]) this._listeners[ev] = [];
      this._listeners[ev].push(fn);
    },
    removeEventListener: () => {},
    activeElement: null
  };

  return { doc, existingIds, elements };
}

for (const game of GAMES) {
  test(`Game [${game.id}] initializes cleanly and binds START GAME without runtime error`, () => {
    const fullPath = path.resolve(__dirname, '..', game.path);
    assert.ok(fs.existsSync(fullPath), `Game file missing: ${game.path}`);

    const html = fs.readFileSync(fullPath, 'utf8');
    const { doc, existingIds, elements } = createMockDOM(html);

    // Verify Start Button exists in DOM
    assert.ok(
      existingIds.has(game.startBtn),
      `Start button ID [${game.startBtn}] not found in ${game.path}`
    );

    // Verify HTML contains title-best-level or title record
    const hasBestLevel = existingIds.has('title-best-level') || existingIds.has('titleBestLevel');
    assert.ok(
      hasBestLevel,
      `Unified title best level element missing in ${game.path}`
    );

    // Setup sandboxed execution environment
    const sandbox = {
      window: null,
      document: doc,
      navigator: { webdriver: false, userAgent: 'NodeTestRunner' },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      },
      location: { search: '', href: 'http://localhost/' },
      performance: { now: () => Date.now() },
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => {},
      setTimeout: (fn) => setTimeout(fn, 0),
      clearTimeout: (id) => clearTimeout(id),
      setInterval: () => 1,
      clearInterval: () => {},
      devicePixelRatio: 1,
      AudioContext: function () {
        return {
          currentTime: 0,
          state: 'running',
          destination: {},
          createGain: () => ({ connect: () => {}, gain: { value: 1, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }),
          createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }),
          createBiquadFilter: () => ({ connect: () => {}, frequency: { setValueAtTime: () => {} } }),
          resume: async () => {}
        };
      },
      addEventListener: function (ev, fn) {
        if (!this._listeners) this._listeners = {};
        if (!this._listeners[ev]) this._listeners[ev] = [];
        this._listeners[ev].push(fn);
      },
      removeEventListener: function () {}
    };
    sandbox.window = sandbox;

    // Extract inline scripts
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const scriptBlocks = [];
    while ((match = scriptRegex.exec(html)) !== null) {
      if (!match[0].includes('src=')) {
        scriptBlocks.push(match[1]);
      }
    }

    assert.ok(scriptBlocks.length > 0, `No inline script blocks found in ${game.path}`);

    // Execute scripts in isolated function scope with mock window/document
    const combinedScript = scriptBlocks.join('\n;\n');
    const runner = new Function(
      'window',
      'document',
      'navigator',
      'localStorage',
      'location',
      'performance',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'devicePixelRatio',
      'AudioContext',
      'webkitAudioContext',
      combinedScript
    );

    try {
      runner(
        sandbox.window,
        sandbox.document,
        sandbox.navigator,
        sandbox.localStorage,
        sandbox.location,
        sandbox.performance,
        sandbox.requestAnimationFrame,
        sandbox.cancelAnimationFrame,
        sandbox.setTimeout,
        sandbox.clearTimeout,
        sandbox.setInterval,
        sandbox.clearInterval,
        sandbox.devicePixelRatio,
        sandbox.AudioContext,
        sandbox.AudioContext
      );
    } catch (err) {
      assert.fail(`Runtime error during initial boot of ${game.id}: ${err.message}\n${err.stack}`);
    }

    // Verify start button event listener was attached
    const startElem = elements.get(game.startBtn);
    assert.ok(startElem, `Start element ${game.startBtn} was not registered`);
    const hasListener =
      (startElem._listeners && (startElem._listeners['click'] || startElem._listeners['pointerdown'])) ||
      (sandbox.document._listeners && sandbox.document._listeners['click']) ||
      (sandbox._listeners && sandbox._listeners['click']);

    assert.ok(
      hasListener,
      `No click or pointerdown event listener attached to ${game.startBtn} in ${game.id}`
    );

    // Dispatch click to ensure start doesn't throw
    try {
      if (startElem._listeners) {
        if (startElem._listeners['click']) startElem._listeners['click'].forEach((fn) => fn({ currentTarget: startElem, preventDefault: () => {} }));
        if (startElem._listeners['pointerdown']) startElem._listeners['pointerdown'].forEach((fn) => fn({ currentTarget: startElem, preventDefault: () => {} }));
      }
    } catch (err) {
      assert.fail(`Runtime error when clicking START in ${game.id}: ${err.message}\n${err.stack}`);
    }
  });
}
