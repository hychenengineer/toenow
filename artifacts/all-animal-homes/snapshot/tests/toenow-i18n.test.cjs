const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createI18n, resolveLanguage } = require('../shared/toenow-i18n.js');

test('OS/browser language selects Chinese only for Chinese preferences', () => {
  for (const language of ['zh-TW', 'zh-CN', 'zh-HK', 'zh-Hant', 'zh']) {
    assert.equal(resolveLanguage(null, [language]), 'zh-Hant');
  }
  for (const language of ['en-US', 'ja-JP', 'ko-KR', 'fr-FR']) {
    assert.equal(resolveLanguage(null, [language, 'zh-TW']), 'en');
  }
  assert.equal(resolveLanguage(null, []), 'en');
  assert.equal(resolveLanguage('en', ['zh-TW']), 'en');
  assert.equal(resolveLanguage('zh-Hant', ['en-US']), 'zh-Hant');
  assert.equal(resolveLanguage('bad-value', ['zh-TW']), 'zh-Hant');
});

test('manual preference persists separately from scores and survives recreation', () => {
  const values = new Map([['animal_rescue_train_best_score', '99']]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const i18n = createI18n({ storage, languages: ['en-US'] });
  assert.equal(i18n.language, 'en');
  i18n.setLanguage('zh-Hant');
  assert.equal(createI18n({ storage, languages: ['en-US'] }).language, 'zh-Hant');
  assert.equal(values.get('animal_rescue_train_best_score'), '99');
  assert.throws(() => i18n.setLanguage('arbitrary'));
});

test('blocked storage does not prevent live switching or translation', () => {
  const storage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const i18n = createI18n({ storage, languages: ['zh-TW'], catalogs: [{ entries: { 'START GAME': '開始遊戲' }, patterns: [[/^Wave (\d+)$/, number => `第 ${number} 波`]] }] });
  assert.equal(i18n.t('START GAME'), '開始遊戲');
  assert.equal(i18n.t('Wave 21'), '第 21 波');
  assert.equal(i18n.t(' −3 × 2 = ? '), ' −3 × 2 = ? ');
  i18n.setLanguage('en');
  assert.equal(i18n.t('START GAME'), 'START GAME');
});

test('every game and Hub load the same catalogs before the runtime', () => {
  const root = path.resolve(__dirname, '..');
  const pages = ['index.html', ...fs.readdirSync(path.join(root, 'games')).filter(id => fs.existsSync(path.join(root, 'games', id, 'index.html'))).map(id => `games/${id}/index.html`)];
  assert.equal(pages.length, 12);
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const runtime = html.indexOf('toenow-i18n.js');
    const dependencies = ['toenow-levels.js', 'toenow-security.js', 'toenow-platform.js', 'toenow-sdk.js'];
    for (let i = 1; i < dependencies.length; i++) {
      assert.ok(html.indexOf(dependencies[i - 1]) >= 0 && html.indexOf(dependencies[i - 1]) < html.indexOf(dependencies[i]), `${page}: shared SDK dependency order`);
    }
    for (const file of ['toenow-i18n-core.js', 'toenow-i18n-games-a.js', 'toenow-i18n-games-b.js']) {
      assert.ok(fs.existsSync(path.join(root, 'shared', file)), `${file}: catalog exists`);
      assert.ok(html.indexOf(file) >= 0 && html.indexOf(file) < runtime, `${page}: ${file} before runtime`);
    }
  }
});
