// The single owner of title and game-over markup for the nine arcade games.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./toenow-screen-config.js'), require('./toenow-levels.js'), null);
  else root.ToenowScreens = factory(root.ToenowScreenConfig, root.ToenowLevels, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (catalog, levels, root) {
  'use strict';
  const instances = new Map();
  const titles = new Map();
  function config(id) { if (!catalog[id]) throw new Error('Unknown screen game: ' + id); return catalog[id]; }
  function escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback; }
  function normalizeResult(data = {}) {
    const wave = Math.max(1, number(data.wave, 1));
    return { score: number(data.score), bestScore: number(data.bestScore), wave, combo: data.combo == null ? null : number(data.combo), level: levels.getLevelInfo(wave).badgeText, reason: data.reason === 'GAME OVER' ? 'GAME OVER' : 'TIME EXPIRED' };
  }
  function titleMarkup(id) {
    const c = config(id);
    return `<div class="unified-title-card">
      <img class="unified-animal-art" data-screen-animal-art src="../../assets/animal-island/${escape(c.animalSpecies || 'owl')}-level1.webp" alt="" width="140" height="94">
      <div class="unified-category-pill"><span class="unified-category-icon">${escape(c.icon)}</span> ${escape(c.category)}</div>
      <h1 id="${escape(c.headingId)}" class="unified-game-title">${escape(c.name)}</h1>
      <p class="unified-game-desc">${escape(c.description)}</p>
      <div class="unified-rules-box">${c.rules.map(rule => `<div class="unified-rule-item"><span class="unified-rule-kicker">${escape(rule.label)}</span><span class="unified-rule-text">${escape(rule.text)}</span></div>`).join('')}</div>
      <div class="unified-records-strip"><div class="unified-record-item"><span class="unified-record-label">BEST SCORE</span><span id="title-best-score" data-screen-record="score" class="unified-record-val">0</span></div><span class="unified-record-sep" aria-hidden="true">·</span><div class="unified-record-item"><span class="unified-record-label">BEST LEVEL</span><span id="title-best-level" data-screen-record="level" class="unified-record-val">LVL 1 · BEGINNER</span></div><span id="title-best-wave" hidden>1</span></div>
      <div class="unified-actions-bar"><button id="${escape(c.startId)}" type="button" class="unified-start-btn" data-start="true">START GAME</button></div>
    </div>`;
  }
  function gameOverMarkup(id) {
    const c = config(id);
    const labels = { score: 'SCORE', bestScore: 'BEST SCORE', wave: 'WAVE REACHED', combo: 'PEAK COMBO' };
    return `<div class="modal-card"><h2 id="screen-gameover-title" data-screen-field="reason" class="toenow-result-heading">TIME EXPIRED</h2><p class="modal-subtitle">Session complete.</p>
      <div class="stat-grid">${Object.keys(labels).map(key => `<div class="stat-tile"><span class="stat-tile-label">${labels[key]}</span><span id="${escape(c.fields[key])}" data-screen-field="${key}" class="stat-tile-value">0</span></div>`).join('')}</div>
      <p id="${escape(c.fields.level)}" data-screen-field="level" class="unified-gameover-subtitle">LVL 1 · BEGINNER</p>
      <div class="modal-actions"><button id="${escape(c.retryId)}" data-screen-action="retry" data-start="true" type="button" class="primary-btn">PLAY AGAIN</button>
      <section class="toenow-membership" data-membership-invite aria-label="Keep Your Progress"><h3>Keep Your Progress</h3><p>Save your game records to your account and sync across devices.</p><a class="toenow-membership-register" data-account-action="register" href="../../?auth=register" target="_blank" rel="noopener">Create Free Account</a><p class="toenow-membership-login"><span>Already a member?</span> <a data-account-action="signin" href="../../?auth=signin" target="_blank" rel="noopener">Sign In</a></p></section>
      <button id="btn-share-score" data-screen-action="share" type="button" class="unified-share-btn"><span aria-hidden="true">⚡</span><span>SHARE SCORE</span></button><button id="${escape(c.returnId)}" data-screen-action="title" type="button" class="secondary-btn">TITLE SCREEN</button></div></div>`;
  }
  function stamp(host, id, kind) {
    host.dataset.toenowScreenOwner = 'ToenowScreens';
    host.dataset.toenowGame = id;
    host.dataset.toenowScreen = kind;
    host.classList.add(kind === 'title' ? 'unified-title-screen' : 'unified-gameover-screen');
    host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', kind === 'title' ? config(id).headingId : 'screen-gameover-title');
  }
  function renderTitle(host, id, options = {}) {
    stamp(host, id, 'title'); host.innerHTML = titleMarkup(id);
    titles.set(id, host);
    updateTitle(id, options);
    if (options.onStart) host.querySelector('[data-start]').addEventListener('click', options.onStart);
    if (options.onPractice) levels.setupPracticeMode({ container: '#' + host.id + ' .unified-title-card', onStartGame: options.onPractice });
    return { destroy() { if (titles.get(id) === host) titles.delete(id); host.replaceChildren(); } };
  }
  function updateTitle(id, data) {
    const host = titles.get(id);
    if (!host) throw new Error('Title not mounted: ' + id);
    host.querySelector('[data-screen-record="score"]').textContent = number(data.bestScore).toLocaleString();
    host.querySelector('[data-screen-record="level"]').textContent = levels.getLevelInfo(data.bestWave || 1).badgeText;
    host.querySelector('#title-best-wave').textContent = Math.max(1, number(data.bestWave, 1));
    const art=host.querySelector('[data-screen-animal-art]');
    if(art)art.src=`../../assets/animal-island/${config(id).animalSpecies || 'owl'}-level${levels.getLevelInfo(data.bestWave || 1).level}.webp`;
  }
  function renderGameOver(host, id, options = {}) {
    stamp(host, id, 'gameover'); host.innerHTML = gameOverMarkup(id);
    const instance = { host, data: normalizeResult(options), options };
    instances.set(id, instance);
    host.querySelector('[data-screen-action="share"]').addEventListener('click', () => {
      const data = instance.data;
      levels.shareScore({ gameId: id, gameTitle: config(id).name.replace(/\b\w+/g, word => word[0] + word.slice(1).toLowerCase()), score: data.score, wave: data.wave, level: levels.getLevelInfo(data.wave).level, badgeText: data.level });
    });
    if (options.onRetry) host.querySelector('[data-screen-action="retry"]').addEventListener('click', options.onRetry);
    if (options.onTitle) host.querySelector('[data-screen-action="title"]').addEventListener('click', options.onTitle);
    const accountWindow = () => {
      try { if (root.parent !== root && root.parent.location.origin === root.location.origin && root.parent.ToenowAccount) return root.parent; } catch (_) {}
      return root;
    };
    const refreshMembership = () => {
      if (!root) return;
      host.querySelector('[data-membership-invite]').hidden = !!accountWindow().ToenowAccount?.signedIn;
    };
    let accountTarget;
    if (root) {
      accountTarget = accountWindow();
      accountTarget.addEventListener('toenow-auth-change', refreshMembership);
      for (const action of ['register', 'signin']) {
        host.querySelector('[data-account-action="' + action + '"]').addEventListener('click', event => {
          const account = accountWindow().ToenowAccount;
          if (account?.open) { event.preventDefault(); account.open(action); }
        });
      }
    }
    instance.refreshMembership = refreshMembership;
    updateGameOver(id, options);
    return { destroy() { accountTarget?.removeEventListener('toenow-auth-change', refreshMembership); if (instances.get(id) === instance) instances.delete(id); host.replaceChildren(); } };
  }
  function updateGameOver(id, data) {
    const instance = instances.get(id);
    if (!instance) throw new Error('Screen not mounted: ' + id);
    instance.refreshMembership?.();
    instance.data = normalizeResult(data);
    for (const [key, value] of Object.entries(instance.data)) {
      const node = instance.host.querySelector('[data-screen-field="' + key + '"]');
      if (node) node.textContent = key === 'combo' ? value == null ? '—' : 'x' + value : typeof value === 'number' ? value.toLocaleString() : value;
    }
    return instance.data;
  }
  function mount(id) {
    const c = config(id), doc = root.document;
    renderTitle(doc.getElementById(c.titleId), id);
    renderGameOver(doc.getElementById(c.endId), id);
  }
  // Used only by DOM-less engine tests: expand the very same templates used in browsers.
  function expandHTML(html, id) {
    return html.replace(/(<(?:section|div)\b[^>]*data-toenow-screen="(title|gameover)"[^>]*>)(<\/(?:section|div)>)/g, (_, open, kind, close) => open + (kind === 'title' ? titleMarkup(id) : gameOverMarkup(id)) + close);
  }
  return { mount, renderTitle, renderGameOver, updateTitle, updateGameOver, normalizeResult, titleMarkup, gameOverMarkup, expandHTML, catalog };
});
