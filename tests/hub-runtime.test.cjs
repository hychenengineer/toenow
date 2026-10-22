const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('Hub index.html scripts have zero syntax errors and render all game cards cleanly', () => {
  const htmlPath = path.resolve(__dirname, '../index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // 1. Verify every single inline <script> has valid syntax
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;
  let mainScriptCode = '';

  while ((match = scriptRegex.exec(html)) !== null) {
    scriptIndex++;
    const code = match[1];
    if (!code.trim()) continue;

    // Check syntax
    try {
      new vm.Script(code);
    } catch (err) {
      assert.fail(`Syntax error in index.html script block #${scriptIndex}: ${err.message}`);
    }

    if (code.includes('bootstrapToenow')) {
      mainScriptCode = code;
    }
  }

  assert.ok(mainScriptCode, 'Should locate main bootstrap script in index.html');

  // 2. Simulate browser runtime execution of Hub scripts
  const mockElements = new Map();
  function createMockEl(tag = 'div') {
    return {
      tagName: tag.toUpperCase(),
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      children: [],
      setAttribute: () => {},
      getAttribute: () => null,
      addEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getContext: () => new Proxy({}, {
        get: (target, prop) => {
          if (prop === 'measureText') return () => ({ width: 10 });
          return () => {};
        }
      }),
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

  const storage = {};
  const windowMock = {
    addEventListener: () => {},
    document: documentMock,
    localStorage: {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; }
    },
    location: { search: '' },
    ToenowLevels: require('../shared/toenow-levels.js')
  };

  const context = {
    window: windowMock,
    document: documentMock,
    localStorage: windowMock.localStorage,
    console: console,
    setTimeout: () => {},
    setInterval: () => {},
    fetch: () => Promise.resolve({ ok: false }),
    ToenowLevels: windowMock.ToenowLevels
  };

  vm.createContext(context);
  vm.runInContext(mainScriptCode, context);

  // Verify gamesBentoGrid has rendered all 10 games
  const grid = mockElements.get('gamesBentoGrid');
  assert.ok(grid, 'gamesBentoGrid must exist');
  assert.ok(grid.innerHTML.length > 0, 'gamesBentoGrid must render content');

  const gameCardCount = (grid.innerHTML.match(/data-game-id=/g) || []).length;
  assert.equal(gameCardCount, 10, 'All 10 games should render on the hub dashboard');
});
