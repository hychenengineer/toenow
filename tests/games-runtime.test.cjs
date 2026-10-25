const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const GAMES = [
  { id: 'animal-rescue-train', path: 'games/animal-rescue-train/index.html', startBtn: 'btn-start-game', external: true },
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
        style: { setProperty: () => {} },
        innerHTML: '',
        textContent: '',
        querySelector: () => null,
        querySelectorAll: () => [],
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

    const html = require('./helpers/screen-engine-adapter.cjs').expand(fs.readFileSync(fullPath, 'utf8'), game.id);
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
    sandbox.ToenowScreens = require('./helpers/screen-engine-adapter.cjs').adapter(doc);
    sandbox.scrollTo = () => {};
    sandbox.window = sandbox;
    if (game.id === 'add-up') sandbox.PointerEvent = function () {};

    // Extract inline scripts
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const scriptBlocks = [];
    while ((match = scriptRegex.exec(html)) !== null) {
      const src = match[0].match(/src=["']([^"']+)["']/);
      if (game.external && src) {
        scriptBlocks.push(fs.readFileSync(path.resolve(path.dirname(fullPath), src[1]), 'utf8'));
      } else if (!src) {
        scriptBlocks.push(match[1]);
      }
    }

    assert.ok(scriptBlocks.length > 0, `No inline script blocks found in ${game.path}`);

    // Execute scripts in isolated function scope with mock window/document
    const combinedScript = 'const ToenowScreens = window.ToenowScreens;\n' + scriptBlocks.join('\n;\n');
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
      if (game.external) {
        const vm = require('node:vm');
        const context = vm.createContext(sandbox);
        scriptBlocks.forEach(code => vm.runInContext(code, context));
      } else runner(
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

    // Verify Game Over screen is NEVER active/visible on initial launch
    const gameoverScreenIds = ['gameover-screen', 'screen-gameover', 'gameOverModal', 'modal-gameover', 'gameover-overlay'];
    gameoverScreenIds.forEach(gId => {
      if (elements.has(gId)) {
        const goEl = elements.get(gId);
        const isActive = goEl.classList.contains('active') || goEl.classList.contains('visible');
        assert.equal(isActive, false, `Game Over screen #${gId} in ${game.id} must NOT have active/visible class on boot`);
      }
    });

    // Dispatch click to ensure start doesn't throw
    try {
      if (startElem._listeners) {
        if (startElem._listeners['click']) startElem._listeners['click'].forEach((fn) => fn({ currentTarget: startElem, preventDefault: () => {} }));
        if (startElem._listeners['pointerdown']) startElem._listeners['pointerdown'].forEach((fn) => fn({ currentTarget: startElem, preventDefault: () => {} }));
      }
    } catch (err) {
      assert.fail(`Runtime error when clicking START in ${game.id}: ${err.message}\n${err.stack}`);
    }

    if (game.id === 'add-up') {
      const arena = elements.get('reactor-canvas');
      const reactor = sandbox.__overclockReactor;
      const node = reactor.getState().nodes[0];
      const event = { clientX: node.x, clientY: node.y, button: 0, preventDefault() {} };
      sandbox.performance.now = () => 1000;
      arena.dispatchEvent({ ...event, type: 'pointerdown', pointerType: 'touch' });
      assert.equal(reactor.getState().nodes[0].selected, true, 'Touch selects the bag');
      // Touch compatibility mouse events arrive on release, possibly long after pointerdown.
      sandbox.performance.now = () => 1250;
      arena.dispatchEvent({ ...event, type: 'mousedown' });
      assert.equal(reactor.getState().nodes[0].selected, true, 'Delayed compatibility mouse event must not deselect');
      sandbox.performance.now = () => 1260;
      arena.dispatchEvent({ ...event, type: 'pointerdown', pointerType: 'touch' });
      assert.equal(reactor.getState().nodes[0].selected, false, 'A second intentional tap still deselects');
      arena.dispatchEvent({ ...event, type: 'pointerdown', pointerType: 'mouse' });
      arena.dispatchEvent({ ...event, type: 'mousedown' });
      assert.equal(reactor.getState().nodes[0].selected, true, 'Mouse selects exactly once');
    }
  });
}
