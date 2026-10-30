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
  const tr = text => root?.ToenowI18n?.t(text) || text;
  function normalizeJourney(data = {}) {
    const friends=Array.isArray(data.friends)?data.friends:data.friend?[{name:data.friend,icon:data.friendIcon||'🐾',count:1}]:[];
    return {friends:friends.map(f=>({name:String(f.name||''),icon:String(f.icon||'🐾'),count:Math.max(1,number(f.count,1))})), items: (Array.isArray(data.items) ? data.items : []).map(item => ({name: String(item.name || ''), icon: String(item.icon || '🍃'), count: number(item.count), isNew: !!item.isNew})).filter(item => item.count > 0), friend: String(data.friend || ''), scene: String(data.scene || ''), material: data.material ? String(data.material) : null, collectionCount: number(data.collectionCount) };
  }
  function journeyShareText(data) {
    const j = normalizeJourney(data);
    return [tr('A little river journey'), j.scene, j.friend, ...j.items.map(item => tr(item.name) + ' ×' + item.count), j.material].filter(Boolean).join(' · ');
  }
  function journeyTitleMarkup(c) {
    return `<div class="unified-title-card journey-title-card"><img class="unified-animal-art" data-screen-animal-art src="${escape(c.titleArt || "../../assets/animal-island/capybara-level1.webp")}" alt="" width="140" height="94"><div class="unified-category-pill">${escape(c.icon)} RELAX</div><h1 id="${escape(c.headingId)}" class="unified-game-title">${escape(c.name)}</h1><p class="unified-game-desc">${escape(c.description)}</p><details class="tutorial-rules-details"><summary>More rules</summary><div class="unified-rules-box">${c.rules.map(rule => `<div class="unified-rule-item"><span class="unified-rule-kicker">${escape(rule.label)}</span><span class="unified-rule-text">${escape(rule.text)}</span></div>`).join('')}</div></details><div class="unified-actions-bar"><button id="${escape(c.startId)}" type="button" class="unified-start-btn" data-start="true">Start a little journey</button></div><button id="${escape(c.practiceId)}" type="button" class="secondary-btn" data-screen-practice>Practice journey</button></div>`;
  }
  function titleMarkup(id) {
    const c = config(id);
    if(c.presentation==='visit')return journeyTitleMarkup(c).replace('Start a little journey',escape(c.startLabel || 'Visit your spring')).replace('Practice journey',escape(c.practiceLabel || 'Preview garden'));
    if (c.presentation === "journey") return journeyTitleMarkup(c);
    return `<div class="unified-title-card">
      <img class="unified-animal-art" data-screen-animal-art src="../../assets/animal-island/${escape(c.animalSpecies || 'owl')}-level1.webp" alt="" width="140" height="94">
      <div class="unified-category-pill"><span class="unified-category-icon">${escape(c.icon)}</span> ${escape(c.category)}</div>
      <h1 id="${escape(c.headingId)}" class="unified-game-title">${escape(c.name)}</h1>
      <p class="unified-game-desc">${escape(c.description)}</p>
      <details class="tutorial-rules-details"><summary>More rules</summary><div class="unified-rules-box">${c.rules.map(rule => `<div class="unified-rule-item"><span class="unified-rule-kicker">${escape(rule.label)}</span><span class="unified-rule-text">${escape(rule.text)}</span></div>`).join('')}</div></details>
      <div class="unified-records-strip"><div class="unified-record-item"><span class="unified-record-label">BEST SCORE</span><span id="title-best-score" data-screen-record="score" class="unified-record-val">0</span></div><span class="unified-record-sep" aria-hidden="true">·</span><div class="unified-record-item"><span class="unified-record-label">BEST LEVEL</span><span id="title-best-level" data-screen-record="level" class="unified-record-val">LVL 1 · BEGINNER</span></div><span id="title-best-wave" hidden>1</span></div>
      <div class="unified-actions-bar"><button id="${escape(c.startId)}" type="button" class="unified-start-btn" data-start="true">START GAME</button></div>
      <button type="button" class="toenow-tutorial-replay" data-tutorial-replay>Play tutorial</button>
    </div>`;
  }
  function journeyResultMarkup() {
    return `<section class="journey-souvenirs" aria-label="Your little journey"><div data-journey-items class="journey-finds" role="group" aria-label="Collected items"></div><div data-journey-friends class="journey-finds journey-friends" role="group" aria-label="Friends met"></div></section>`;
  }
  function gameOverMarkup(id) {
    const c = config(id), journey = c.presentation === 'journey';
    if(c.presentation==='visit')return `<div class="modal-card"><h2 id="screen-gameover-title">${escape(c.visitHeading || "A lovely little visit")}</h2><p>Come back whenever you like.</p><p data-visit-summary></p><div class="modal-actions"><button id="${escape(c.retryId)}" data-screen-action="retry" type="button" class="primary-btn">Visit again</button><button id="btn-share-score" data-screen-action="share" type="button" class="unified-share-btn">${escape(c.shareLabel || "Share garden")}</button><button id="${escape(c.returnId)}" data-screen-action="title" type="button" class="secondary-btn">TITLE SCREEN</button></div></div>`;
    const labels = { score: 'SCORE', bestScore: 'BEST SCORE', wave: 'WAVE REACHED', combo: 'PEAK COMBO' };
    const summary = journey ? journeyResultMarkup() : `<h2 id="screen-gameover-title" data-screen-field="reason" class="toenow-result-heading">TIME EXPIRED</h2><p class="modal-subtitle">Session complete.</p>
      <div class="stat-grid">${Object.keys(labels).map(key => `<div class="stat-tile"><span class="stat-tile-label">${labels[key]}</span><span id="${escape(c.fields[key])}" data-screen-field="${key}" class="stat-tile-value">0</span></div>`).join('')}</div>
      <p id="${escape(c.fields.level)}" data-screen-field="level" class="unified-gameover-subtitle">LVL 1 · BEGINNER</p>`;
    return `<div class="modal-card">${journey?'':`<img class="unified-animal-art" data-screen-animal-art src="../../assets/animal-island/${escape(c.animalSpecies || 'owl')}-level1.webp" alt="" width="140" height="94">`}${summary}
      <div class="modal-actions"><button id="${escape(c.retryId)}" data-screen-action="retry" data-start="true" type="button" class="primary-btn">${journey ? 'Drift again' : 'PLAY AGAIN'}</button>
      ${journey?'':`<section class="toenow-membership" data-membership-invite aria-label="Keep Your Progress"><h3>Keep Your Progress</h3><p>Save your game records to your account and sync across devices.</p><a class="toenow-membership-register" data-account-action="register" href="../../?auth=register" target="_blank" rel="noopener">Create Free Account</a><p class="toenow-membership-login"><span>Already a member?</span> <a data-account-action="signin" href="../../?auth=signin" target="_blank" rel="noopener">Sign In</a></p></section>`}
      <button id="btn-share-score" data-screen-action="share" type="button" class="unified-share-btn"><span aria-hidden="true">${journey ? '🍃' : '⚡'}</span><span>${journey ? 'Share this journey' : 'SHARE SCORE'}</span></button><button id="${escape(c.returnId)}" data-screen-action="title" type="button" class="secondary-btn">TITLE SCREEN</button></div></div>`;
  }
  function stamp(host, id, kind) {
    host.dataset.toenowScreenOwner = 'ToenowScreens';
    host.dataset.toenowGame = id;
    host.dataset.toenowScreen = kind;
    host.classList.add(kind === 'title' ? 'unified-title-screen' : 'unified-gameover-screen');
    host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true');
    if(kind==='gameover'&&config(id).presentation==='journey'){host.removeAttribute?.('aria-labelledby');host.setAttribute('aria-label',tr('Your little journey'));}else host.setAttribute('aria-labelledby', kind === 'title' ? config(id).headingId : 'screen-gameover-title');
  }
  function renderTitle(host, id, options = {}) {
    stamp(host, id, 'title'); host.innerHTML = titleMarkup(id);
    titles.set(id, host);
    updateTitle(id, options);
    if (options.onStart) host.querySelector('[data-start]').addEventListener('click', options.onStart);
    if (['journey','visit'].includes(config(id).presentation)) {
      if (options.onPractice) host.querySelector('[data-screen-practice]').addEventListener('click', () => options.onPractice(1, true));
    } else if (options.onPractice) levels.setupPracticeMode({ container: '#' + host.id + ' .unified-title-card', onStartGame: options.onPractice });
    return { destroy() { if (titles.get(id) === host) titles.delete(id); host.replaceChildren(); } };
  }
  function updateTitle(id, data) {
    const host = titles.get(id);
    if (!host) throw new Error('Title not mounted: ' + id);
    if (['journey','visit'].includes(config(id).presentation)) return;
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
      if(config(id).presentation==='visit'){const text=tr(config(id).name)+' · '+(instance.visitText||'');if(root?.navigator?.share)root.navigator.share({title:tr(config(id).name),text}).catch(()=>{});else root?.navigator?.clipboard?.writeText(text).catch(()=>{});return;}
      if (config(id).presentation === "journey") {
        const text = journeyShareText(instance.journey || {});
        if (root?.navigator?.share) root.navigator.share({title: tr("A little river journey"), text}).catch(() => {});
        else if (root?.navigator?.clipboard?.writeText) root.navigator.clipboard.writeText(text).then(() => { const button = host.querySelector('[data-screen-action="share"] span:last-child'); if (button) button.textContent = tr("Journey copied"); }).catch(() => {});
        return;
      }
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
      const invite=host.querySelector('[data-membership-invite]');if(invite)invite.hidden = !!accountWindow().ToenowAccount?.signedIn;
    };
    let accountTarget;
    if (root) {
      accountTarget = accountWindow();
      accountTarget.addEventListener('toenow-auth-change', refreshMembership);
      for (const action of ['register', 'signin']) {
        host.querySelector('[data-account-action="' + action + '"]')?.addEventListener('click', event => {
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
    if(config(id).presentation==='visit'){instance.visitText=(data.visit||[]).map(tr).join(' · ');instance.host.querySelector('[data-visit-summary]').textContent=instance.visitText;return instance.data;}
    if (config(id).presentation === 'journey') {
      instance.journey = normalizeJourney(data.journey);
      const j = instance.journey;
      const icons=entries=>entries.map(item=>`<div class="journey-find" role="img" aria-label="${escape(tr(item.name))} ×${item.count}" title="${escape(tr(item.name))}"><span aria-hidden="true">${escape(item.icon)}</span>${item.count>1?`<b aria-hidden="true">×${item.count}</b>`:''}</div>`).join('');
      instance.host.querySelector('[data-journey-items]').innerHTML=icons(j.items);
      instance.host.querySelector('[data-journey-friends]').innerHTML=icons(j.friends);
      return instance.data;
    }
    const art = instance.host.querySelector('[data-screen-animal-art]');
    if (art) art.src = `../../assets/animal-island/${config(id).animalSpecies || 'owl'}-level${levels.getLevelInfo(instance.data.wave).level}.webp`;
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
  return { mount, renderTitle, renderGameOver, updateTitle, updateGameOver, normalizeResult, normalizeJourney, journeyShareText, titleMarkup, gameOverMarkup, expandHTML, catalog };
});
