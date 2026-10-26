const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('Number Pop keeps drifting bubbles in the middle half on wide screens and leaves room on phones', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../games/number-pop/index.html'), 'utf8');
  const boundsFunction = html.slice(html.indexOf('function getArenaBounds()'), html.indexOf('function computeCoreScaleFactor'));
  const clampFunction = html.slice(html.indexOf('function clampCoreToSafeArena('), html.indexOf('const BASE_GAME_TIME'));
  for (const width of [390, 768, 1280, 1860, 2560]) {
    const context = { viewportW: width, viewportH: 900, getHudBottom: () => 160 };
    vm.createContext(context);
    vm.runInContext(`${boundsFunction}\n${clampFunction}`, context);
    const bounds = context.getArenaBounds();
    if (width >= 1280) {
      assert.equal(bounds.left, width / 4);
      assert.equal(bounds.right, width * 3 / 4);
    } else if (width === 390) {
      assert.equal(bounds.left, 15);
      assert.equal(bounds.right, width - 15);
    }
    for (const startX of [-100, width + 100]) {
      const core = { x: startX, y: 400, vx: startX < 0 ? -80 : 80, vy: 0, radius: 46 };
      for (let frame = 0; frame < 3600; frame++) {
        core.x += core.vx / 60;
        context.clampCoreToSafeArena(core, bounds);
        assert.ok(core.x - core.radius >= bounds.left, `${width}px: bubble crossed left boundary`);
        assert.ok(core.x + core.radius <= bounds.right, `${width}px: bubble crossed right boundary`);
      }
    }
  }
});

test('Number Pop generates valid math fractions for all waves 1-30 with no zero denominators or NaN', () => {
  const htmlPath = path.resolve(__dirname, '../games/number-pop/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract script
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match, gameScript = '';
  while ((match = scriptRegex.exec(html)) !== null) {
    if (match[1].includes('__QUANTUM_GAME__')) {
      gameScript = match[1];
      break;
    }
  }
  assert.ok(gameScript, 'Must locate Number Pop game engine script');

  // Mock minimal canvas and DOM environment
  const mockStorage = {};
  const mockElements = new Map();
  function createMockEl(tag = 'div') {
    return {
      tagName: tag.toUpperCase(),
      style: {},
      dataset: {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      children: [],
      setAttribute: () => {},
      getAttribute: () => null,
      addEventListener: () => {},
      getContext: () => new Proxy({}, { get: () => () => ({ width: 10 }) }),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      innerHTML: '',
      textContent: ''
    };
  }

  const documentMock = {
    getElementById: (id) => {
      if (!mockElements.has(id)) mockElements.set(id, createMockEl('div'));
      return mockElements.get(id);
    },
    querySelectorAll: () => [],
    querySelector: () => createMockEl('div'),
    createElement: (t) => createMockEl(t),
    body: createMockEl('body')
  };

  const windowMock = {
    addEventListener: () => {},
    document: documentMock,
    localStorage: {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; }
    },
    location: { search: '' },
    AudioContext: class {
      constructor() {
        this.state = 'running';
        this.destination = {};
      }
      createOscillator() {
        return {
          connect: () => {},
          start: () => {},
          stop: () => {},
          frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
        };
      }
      createGain() {
        return {
          connect: () => {},
          gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
        };
      }
      createBiquadFilter() {
        return {
          connect: () => {},
          frequency: { setValueAtTime: () => {} }
        };
      }
    },
    requestAnimationFrame: () => 1
  };
  windowMock.webkitAudioContext = windowMock.AudioContext;

  const context = {
    ToenowLevels: require('../shared/toenow-levels.js'),
    ToenowScreens: require('./helpers/screen-engine-adapter.cjs').adapter(documentMock),
    window: windowMock,
    document: documentMock,
    navigator: { userAgent: 'NodeTest', maxTouchPoints: 0 },
    performance: { now: () => Date.now() },
    localStorage: windowMock.localStorage,
    console: console,
    AudioContext: windowMock.AudioContext,
    webkitAudioContext: windowMock.AudioContext,
    requestAnimationFrame: () => 1,
    setTimeout: () => {},
    setInterval: () => {},
    URLSearchParams: global.URLSearchParams || URLSearchParams,
    Math: Math
  };

  vm.createContext(context);
  vm.runInContext(gameScript, context);

  const game = windowMock.__QUANTUM_GAME__;
  assert.ok(game, '__QUANTUM_GAME__ hook must be exposed');

  for (const wave of [1, 5, 6, 10, 11, 15, 16, 20, 21, 30]) {
    vm.runInContext(`{ ${gameScript}\n}`, context);
    const run = windowMock.__QUANTUM_GAME__;
    run.setWave(wave);
    run.setRunDuration(60);
    run.forceGameOver();
    assert.equal(mockElements.get('go-survival-rank').textContent,
      context.ToenowLevels.getLevelInfo(wave).badgeText, `Wave ${wave}: show the shared difficulty level`);
  }

  // Verify all waves from 1 to 30
  for (let w = 1; w <= 30; w++) {
    game.setWave(w);
    const state = game.getState();
    assert.ok(state.cores.length >= 3, `Wave ${w} should spawn at least 3 cores`);

    state.cores.forEach((core, i) => {
      // 1. Value must be a valid finite number
      assert.ok(!Number.isNaN(core.value), `Wave ${w} core #${i} value must not be NaN`);
      assert.ok(Number.isFinite(core.value), `Wave ${w} core #${i} value must be finite (got ${core.value})`);

      // 2. If it's a fraction (e.g. '1/5'), denominator must NEVER be 0
      if (core.label && core.label.includes('/')) {
        const parts = core.label.split('/');
        const numerator = Number(parts[0]);
        const denominator = Number(parts[1]);

        assert.ok(!Number.isNaN(denominator), `Wave ${w} fraction denominator must be a valid number`);
        assert.notEqual(denominator, 0, `Wave ${w} fraction denominator MUST NEVER BE 0! (label: ${core.label})`);
        assert.ok(denominator > 0, `Wave ${w} fraction denominator must be strictly positive (label: ${core.label})`);

        // Check level 3 (waves 11-15): Fractions in level 3 should be positive
        if (w >= 11 && w <= 15) {
          assert.ok(numerator > 0, `Level 3 wave ${w} fraction numerator should be positive (label: ${core.label})`);
          assert.ok(core.value > 0, `Level 3 wave ${w} fraction value should be positive (label: ${core.label})`);
        }
      }
    });
  }
});
