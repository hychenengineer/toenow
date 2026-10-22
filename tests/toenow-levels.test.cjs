const { test } = require('node:test');
const assert = require('node:assert/strict');
const ToenowLevels = require('../shared/toenow-levels.js');

test('ToenowLevels exports standard 5 levels with 5 waves each', () => {
  assert.equal(ToenowLevels.LEVELS.length, 5);
  
  // Level 1: Beginner (Waves 1-5)
  for (let w = 1; w <= 5; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 1);
    assert.equal(info.name, 'Beginner');
    assert.equal(info.badgeText, 'LVL 1 · BEGINNER');
  }

  // Level 2: Intermediate (Waves 6-10)
  for (let w = 6; w <= 10; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 2);
    assert.equal(info.name, 'Intermediate');
    assert.equal(info.badgeText, 'LVL 2 · INTERMEDIATE');
  }

  // Level 3: Advanced (Waves 11-15)
  for (let w = 11; w <= 15; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 3);
    assert.equal(info.name, 'Advanced');
    assert.equal(info.badgeText, 'LVL 3 · ADVANCED');
  }

  // Level 4: Expert (Waves 16-20)
  for (let w = 16; w <= 20; w++) {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 4);
    assert.equal(info.name, 'Expert');
    assert.equal(info.badgeText, 'LVL 4 · EXPERT');
  }

  // Level 5: Master (Waves 21+)
  [21, 25, 50, 100].forEach((w) => {
    const info = ToenowLevels.getLevelInfo(w);
    assert.equal(info.level, 5);
    assert.equal(info.name, 'Master');
    assert.equal(info.badgeText, 'LVL 5 · MASTER');
  });
});

test('ToenowLevels handles edge case inputs gracefully', () => {
  assert.equal(ToenowLevels.getLevelInfo(0).level, 1);
  assert.equal(ToenowLevels.getLevelInfo(-10).level, 1);
  assert.equal(ToenowLevels.getLevelInfo(null).level, 1);
  assert.equal(ToenowLevels.getLevelInfo(undefined).level, 1);
  assert.equal(ToenowLevels.getLevelInfo('12').level, 3);
});

test('ToenowLevels creates standard game-over payload', () => {
  const payload = ToenowLevels.createGameOverPayload({
    gameId: 'number-pop',
    category: 'math',
    score: 1250,
    wave: 7,
    duration: 45000,
    isPractice: true
  });

  assert.equal(payload.type, 'GAME_OVER');
  assert.equal(payload.gameId, 'number-pop');
  assert.equal(payload.category, 'math');
  assert.equal(payload.score, 1250);
  assert.equal(payload.wave, 7);
  assert.equal(payload.level, 2);
  assert.equal(payload.levelName, 'Intermediate');
  assert.equal(payload.duration, 45000);
  assert.equal(payload.isPractice, true);
});

test('ToenowLevels setupPracticeMode renders practice button and opens modal to select level', () => {
  // Lightweight DOM mock
  function createMockElement(tag = 'div') {
    let _className = '';
    const _classes = new Set();
    const el = {
      tagName: tag.toUpperCase(),
      get className() { return _className; },
      set className(val) {
        _className = val || '';
        _classes.clear();
        _className.split(/\s+/).filter(Boolean).forEach(c => _classes.add(c));
      },
      classList: {
        add(c) {
          _classes.add(c);
          _className = Array.from(_classes).join(' ');
        },
        remove(c) {
          _classes.delete(c);
          _className = Array.from(_classes).join(' ');
        },
        contains(c) {
          return _classes.has(c);
        }
      },
      style: {},
      children: [],
      setAttribute(k, v) { this[k] = v; },
      getAttribute(k) { return this[k]; },
      appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
        child.parentElement = this;
        return child;
      },
      insertBefore(newNode, refNode) {
        const idx = this.children.indexOf(refNode);
        if (idx !== -1) {
          this.children.splice(idx, 0, newNode);
        } else {
          this.children.push(newNode);
        }
        newNode.parentNode = this;
        newNode.parentElement = this;
        return newNode;
      },
      remove() {
        if (this.parentElement) {
          const idx = this.parentElement.children.indexOf(this);
          if (idx !== -1) this.parentElement.children.splice(idx, 1);
          this.parentElement = null;
        }
      },
      querySelector(sel) {
        const check = (node) => {
          if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) return node;
          if (sel.startsWith('#') && node.id === sel.slice(1)) return node;
          if (node.tagName && node.tagName.toLowerCase() === sel.toLowerCase()) return node;
          for (const c of (node.children || [])) {
            const found = check(c);
            if (found) return found;
          }
          return null;
        };
        return check(this);
      },
      querySelectorAll(sel) {
        const results = [];
        const check = (node) => {
          if (node !== this) {
            if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) results.push(node);
          }
          for (const c of (node.children || [])) {
            check(c);
          }
        };
        check(this);
        return results;
      },
      addEventListener(ev, fn) {
        if (!this._listeners) this._listeners = {};
        if (!this._listeners[ev]) this._listeners[ev] = [];
        this._listeners[ev].push(fn);
      },
      click() {
        const fns = (this._listeners && this._listeners['click']) || [];
        fns.forEach(fn => fn({ preventDefault: () => {}, stopPropagation: () => {} }));
      }
    };
    return el;
  }

  const mockBody = createMockElement('body');
  const mockCard = createMockElement('div');
  mockCard.className = 'unified-title-card';
  const mockStartBtn = createMockElement('button');
  mockStartBtn.className = 'unified-start-btn';
  mockCard.appendChild(mockStartBtn);
  mockBody.appendChild(mockCard);

  global.document = {
    createElement: (tag) => createMockElement(tag),
    body: mockBody,
    querySelector: (sel) => mockBody.querySelector(sel)
  };

  let chosenStartWave = null;
  let chosenPractice = null;

  ToenowLevels.setupPracticeMode({
    container: mockCard,
    startBtn: mockStartBtn,
    onStartGame: (startWave, isPractice) => {
      chosenStartWave = startWave;
      chosenPractice = isPractice;
    }
  });

  const practiceBtn = mockCard.querySelector('.unified-practice-btn');
  assert.ok(practiceBtn, 'Practice button should be created in actions bar');
  assert.equal(practiceBtn.textContent, 'PRACTICE');

  // Modal is created with hidden class initially
  let modal = mockBody.querySelector('.unified-practice-modal');
  assert.ok(modal, 'Modal should be attached to body');
  assert.ok(modal.classList.contains('hidden'), 'Modal should initially have hidden class');

  // Click Practice
  practiceBtn.click();
  assert.ok(!modal.classList.contains('hidden'), 'Modal should not have hidden class after clicking Practice');

  const levelButtons = modal.querySelectorAll('.unified-practice-level-btn');
  assert.equal(levelButtons.length, 5, 'Should have 5 levels to choose from');

  // Click Level 3 (startWave 11)
  levelButtons[2].click();
  assert.equal(chosenStartWave, 11, 'Level 3 should launch wave 11');
  assert.equal(chosenPractice, true, 'isPractice should be true');

  // Modal should be hidden again
  assert.ok(modal.classList.contains('hidden'), 'Modal should have hidden class after selection');
});
