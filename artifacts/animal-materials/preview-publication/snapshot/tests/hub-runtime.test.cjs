const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('Local preview server supports accurate video byte ranges and invalid-range fallback', async () => {
  const { spawn } = require('node:child_process');
  const server = spawn(process.execPath, ['tools/serve-local.cjs'], {
    cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT: '0' }, windowsHide: true
  });
  try {
    const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 5000);
      server.once('error', error => { clearTimeout(timeout); reject(error); });
      server.stdout.on('data', chunk => {
        const match = String(chunk).match(/127\.0\.0\.1:(\d+)/);
        if (match) { clearTimeout(timeout); resolve(Number(match[1])); }
      });
    });
    assert.ok(port > 0, 'the actual assigned port must be reported');
    const url = `http://127.0.0.1:${port}/shared/toenow-game-previews.js`;
    const file = fs.readFileSync(path.resolve(__dirname, '../shared/toenow-game-previews.js'));
    const partial = await fetch(url, { headers: { Range: 'bytes=100-199' } });
    assert.equal(partial.status, 206);assert.equal(partial.headers.get('content-range'), `bytes 100-199/${file.length}`);
    assert.deepEqual(Buffer.from(await partial.arrayBuffer()), file.subarray(100, 200));
    const suffix = await fetch(url, { headers: { Range: 'bytes=-20' } });
    assert.equal(suffix.status, 206);assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), file.subarray(-20));
    const invalid = await fetch(url, { headers: { Range: 'bytes=99999999-' } });
    assert.equal(invalid.status, 416);assert.equal(invalid.headers.get('content-range'), `bytes */${file.length}`);
  } finally { server.kill(); }
});

test('Gameplay previews load on demand, play one video, and cancel late playback', async () => {
  const { createPlaybackController } = require('../shared/toenow-game-previews.js');
  let timer;
  const controller = createPlaybackController({ setTimeout: fn => (timer = fn, 1), clearTimeout: () => { timer = null; } });
  const host = () => ({ classList: { add() {}, remove() {} } });
  const makeVideo = () => ({ dataset: { src: '/clip.webm' }, src: '', paused: true, currentTime: 0,
    play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } });
  const first = makeVideo(), second = makeVideo();
  controller.request(first, host());
  assert.equal(first.src, '', 'hover delay must not download video');
  controller.stop();assert.equal(timer, null);
  controller.request(first, host());await timer();assert.equal(first.src, '/clip.webm');assert.equal(first.paused, false);
  controller.request(second, host());assert.equal(first.paused, true);await timer();assert.equal(second.paused, false);
  let resolvePlay;first.play = () => new Promise(resolve => { resolvePlay = () => { first.paused = false; resolve(); }; });
  controller.request(first, host());const pending = timer();
  controller.stop();resolvePlay();await pending;
  assert.equal(first.paused, true, 'a cancelled play promise must not revive a video');
});

test('Gameplay preview failure preserves poster and reports a fallback', async () => {
  const { createPlaybackController } = require('../shared/toenow-game-previews.js');
  let timer, failures = 0;
  const controller = createPlaybackController({ setTimeout: fn => (timer = fn, 1), clearTimeout() {}, onError: () => failures++ });
  const classes = new Set();
  const video = { dataset: { src: '/missing.webm' }, src: '', currentTime: 0, pause() {}, play: () => Promise.reject(new Error('blocked')) };
  controller.request(video, { classList: { add: c => classes.add(c), remove: c => classes.delete(c) } });
  await timer();assert.equal(failures, 1);assert.equal(classes.has('preview-playing'), false);
});

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
    URLSearchParams: global.URLSearchParams || URLSearchParams,
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
  assert.equal(gameCardCount, 11, 'All 11 games should render on the hub dashboard');
});
