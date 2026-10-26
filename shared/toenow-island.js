(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./toenow-animals.js'));
  else root.ToenowIsland = factory(root.ToenowAnimals);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (animals) {
  'use strict';
  const LOCATIONS = [
    { gameId: 'animal-rescue-train', name: 'Rescue Harbor', kind: 'station', x: 81, y: 18, color: '#b75b43' },
    { gameId: 'number-pop', name: 'Melody Garden', kind: 'music', x: 18, y: 78, color: '#957131' },
    { gameId: 'ball-track', name: 'Orbit Terrace', kind: 'orbit', x: 79, y: 45, color: '#396e96' },
    { gameId: 'block-match', name: 'Mosaic Workshop', kind: 'workshop', x: 24, y: 46, color: '#af6a80' },
    { gameId: 'add-up', name: 'Sum Conservatory', kind: 'garden', x: 62, y: 78, color: '#5c8050' },
    { gameId: 'space-scale', name: 'Star Observatory', kind: 'observatory', x: 40, y: 78, color: '#626ca0' },
    { gameId: 'tap-match', name: 'Echo Courtyard', kind: 'arch', x: 51, y: 48, color: '#32847d' },
    { gameId: 'spot-quick', name: 'Forest Lookout', kind: 'lookout', x: 24, y: 20, color: '#6e8450' },
    { gameId: 'shadow-match', name: 'Silhouette Ruins', kind: 'temple', x: 49, y: 20, color: '#806398' },
    { gameId: 'flash-brain', name: 'Memory Lighthouse', kind: 'lighthouse', x: 84, y: 78, color: '#4b86a2' }
  ];
  for (const location of LOCATIONS) {
    const theme = animals?.getTheme(location.gameId);
    if (theme) { location.name = theme.place; location.animal = theme.species; }
  }
  const VIEW_KEY = 'toenow_hub_view_v1';
  function read(storage, key) { try { return storage?.getItem(key); } catch (_) { return null; } }
  function positiveInteger(value, fallback) {
    if (typeof value !== 'number' && typeof value !== 'string') return fallback;
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : fallback;
  }
  function safeScore(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return 0;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
  }
  function getProgress(gameId, storage, levels) {
    const empty = { level: 1, wave: 1, bestScore: 0, explored: false };
    const keys = levels?.GAME_STORAGE_KEYS?.[gameId];
    if (!keys) return empty;
    let records;
    try { records = JSON.parse(read(storage, 'toenow_game_scores') || '{}'); } catch (_) {}
    const record = records && typeof records === 'object' && !Array.isArray(records) ? records[gameId] : null;
    const entry = record && typeof record === 'object' && !Array.isArray(record) ? record : {};
    const wave = Math.max(positiveInteger(entry.maxWave, 1), positiveInteger(read(storage, keys.wave), 1));
    const bestScore = Math.max(safeScore(entry.bestScore), safeScore(read(storage, keys.score)));
    const level = levels.getLevelInfo(wave).level;
    const hasAttempt = typeof entry.lastScore === 'number' && Number.isFinite(entry.lastScore) && entry.lastScore >= 0;
    return { level, wave, bestScore, explored: wave > 1 || bestScore > 0 || hasAttempt };
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Keep the original vector art as a functional fallback for a failed texture request.
  function landmarkVector(kind, level, color) {
    const shapes = {
      lighthouse: '<path d="M44 76 49 28h22l6 48Z" fill="#fff1d1"/><path d="m46 55 28-5 1 12-30 5Z" fill="currentColor"/><path d="M47 28h26v-9H47Z" fill="#f4cc71"/><path d="m44 19 16-12 16 12Z" fill="currentColor"/><path d="M59 38h5v10h-5Z" fill="#526d73"/>',
      observatory: '<path d="M26 76V53h68v23Z" fill="#f3e5c7"/><path d="M26 53a34 34 0 0 1 68 0Z" fill="currentColor"/><path d="M58 20v34M30 45h59" fill="none" stroke="#d6dfce" stroke-width="3"/><path d="m64 27 25-11 5 8-25 11Z" fill="#d9bd7b"/><path d="M52 76V61h16v15" fill="#4b646e"/>',
      station: '<path d="M24 76V44h72v32Z" fill="#f5e2b8"/><path d="m16 46 44-26 44 26Z" fill="currentColor"/><path d="M34 53h15v15H34Zm37 0h15v15H71Z" fill="#729a9b"/><path d="M54 76V53h12v23" fill="#725a4b"/><path d="M15 80h90M25 84h70" stroke="#796b56" stroke-width="3"/>',
      music: '<path d="M30 76V45h60v31Z" fill="#f4e4c4"/><path d="m22 45 38-25 38 25Z" fill="currentColor"/><path d="M44 76V56a8 8 0 0 1 16 0v20m5 0V56a8 8 0 0 1 16 0v20" fill="#798e89"/><path d="M56 32v-9l13-3v10" stroke="#f8edcf" stroke-width="3" fill="none"/><ellipse cx="53" cy="33" rx="4" ry="3" fill="#f8edcf"/><ellipse cx="66" cy="31" rx="4" ry="3" fill="#f8edcf"/>',
      workshop: '<path d="M26 76V42h64v34Z" fill="#eee3c9"/><path d="M19 43 57 22l39 21Z" fill="currentColor"/><path d="M38 49h19v19H38Z" fill="#91b9b0"/><path d="M63 49h16v27H63Z" fill="#b59876"/><path d="M79 22V9h10v20Z" fill="#ae8e73"/>',
      garden: '<path d="M22 76V48l38-27 38 27v28Z" fill="#c9dfc4"/><path d="M22 48h76M60 22v54M41 35v41M79 35v41M22 61h76" fill="none" stroke="currentColor" stroke-width="4"/><path d="M53 76V59h14v17" fill="#72816b"/><path d="m20 48 40-29 40 29" stroke="#d7b773" stroke-width="5" fill="none"/>',
      arch: '<path d="M29 77V47a31 31 0 0 1 62 0v30H75V48a15 15 0 0 0-30 0v29Z" fill="#e3d5b4"/><path d="M25 78h24m22 0h24M60 17v16M36 28l10 10m38-10L74 38" stroke="currentColor" stroke-width="5"/><circle cx="60" cy="27" r="5" fill="#f1c86c"/>',
      lookout: '<path d="m34 78 9-40m43 40-9-40M29 78h62M38 62h45M41 47h39" stroke="#8f704e" stroke-width="6" fill="none"/><path d="M32 44V25h56v19Z" fill="#e9d6ad"/><path d="m23 26 37-20 37 20Z" fill="currentColor"/><path d="M44 31h13v10H44Zm20 0h13v10H64Z" fill="#74978a"/>',
      temple: '<path d="M22 78h76v-8H22ZM29 70V35h12v35m14 0V35h12v35m14 0V35h12v35" fill="#d8cbb1"/><path d="M22 35 60 12l38 23Z" fill="currentColor"/><path d="M18 81h84" stroke="#a18e73" stroke-width="5"/><circle cx="60" cy="25" r="5" fill="#f1e3b6"/>',
      orbit: '<path d="M26 76h68l-7-15H33Z" fill="#d9d0b9"/><path d="M57 64V37h6v27" fill="#81958c"/><ellipse cx="60" cy="40" rx="34" ry="13" transform="rotate(-25 60 40)" stroke="currentColor" stroke-width="6" fill="none"/><circle cx="60" cy="40" r="11" fill="#f2ca77"/><circle cx="84" cy="23" r="7" fill="#adc8bd"/>'
    };
    return `<svg viewBox="0 0 120 105" class="island-landmark" aria-hidden="true" focusable="false" style="color:${color}"><ellipse cx="60" cy="85" rx="49" ry="13" fill="#244b3b28"/><path d="m13 81 47-18 47 18-47 19Z" fill="#bdcba1"/><path d="m13 81 47 19 47-19v6l-47 18-47-18Z" fill="#8fa47b"/>${level >= 2 ? '<g class="landmark-stage-2"><path d="M15 78V60h18v18Z" fill="#f3ddb7"/><path d="m11 60 13-10 13 10Z" fill="currentColor"/></g>' : ''}${shapes[kind] || shapes.workshop}${level >= 3 ? '<g class="landmark-stage-3"><path d="M87 79V59h18v20Z" fill="#e8d7b4"/><path d="m83 59 13-11 13 11Z" fill="currentColor"/><circle cx="18" cy="81" r="7" fill="#719761"/><circle cx="104" cy="84" r="6" fill="#81a56b"/></g>' : ''}${level >= 4 ? '<g class="landmark-stage-4"><path d="M99 55V13" stroke="#876e4a" stroke-width="3"/><path d="M100 13h18l-5 7 5 7h-18Z" fill="currentColor"/><path d="m31 86 5-3 4 3-4 3m40 0 5-3 4 3-4 3" fill="#efd58c"/></g>' : ''}${level >= 5 ? '<g class="landmark-stage-5"><path d="m60 0 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#f5d477" stroke="#967332"/><ellipse cx="60" cy="88" rx="46" ry="11" fill="none" stroke="#f1d689" stroke-width="2"/><circle cx="15" cy="41" r="2" fill="#f6e3ac"/><circle cx="108" cy="38" r="3" fill="#f6e3ac"/></g>' : ''}</svg>`;
  }

  function getBuildingAsset(kind, level) {
    const location = LOCATIONS.find(location => location.kind === kind);
    if (!location) return null;
    if (animals) return animals.getBuildingAsset(location.gameId, level);
    const value = Number(level);
    const stage = Number.isFinite(value) ? Math.max(1, Math.min(5, Math.trunc(value))) : 1;
    return `assets/island-buildings/${kind}-level${stage}.webp`;
  }
  function landmark(kind, level, color) {
    const asset = getBuildingAsset(kind, level);
    if (!asset) return landmarkVector(kind, level, color);
    const stage = Number(asset.match(/-level(\d)\.webp$/)[1]);
    return `<span class="island-landmark landmark-stage-${stage}" data-building-kind="${kind}" data-building-level="${stage}"><img class="island-building-image" data-island-art src="${asset}" alt="" decoding="async"></span>`;
  }

  function mount(options) {
    const { host, listHost, levels, openGame, exploration } = options;
    if (!host) return null;
    const doc = host.ownerDocument, root = doc.defaultView;
    let storage; try { storage = root.localStorage; } catch (_) {}
    let games = options.games, category = 'all', preview = 0;
    let selectedId = LOCATIONS[0].gameId;
    let dialogInvoker = null, launchingGame = false;
    let view = exploration ? 'island' : read(storage, VIEW_KEY) === 'list' ? 'list' : 'island';
    const t = source => root.ToenowI18n?.t(source) || source;
    const e = source => escapeHTML(t(source));
    host.className = 'island-shell';
    host.setAttribute('data-i18n-ignore', '');
    host.innerHTML = `<div class="island-topline"><div class="island-intro"><p class="island-eyebrow" data-island-text="ANIMAL FRIENDS / NEW DISCOVERIES"></p><h1 data-island-text="An island of animals. A world to discover."></h1><p class="island-intro-copy" data-island-text="Meet your animal friends. Help with their challenges and watch their homes grow."></p></div><div class="island-view-switch" role="group" aria-label="Hub view"><button type="button" id="islandMapViewBtn" data-view="island" data-island-text="My island"></button><button type="button" id="islandListViewBtn" data-view="list" data-island-text="Game list"></button></div></div><div class="island-map-panel"><div class="island-map-toolbar"><div class="island-counter" aria-live="polite"></div><div class="island-preview-control"><label for="islandStagePreview" data-island-text="Appearance preview"></label><select id="islandStagePreview"><option value="0" data-island-text="My records"></option>${[1,2,3,4,5].map(n=>`<option value="${n}">Level ${n}</option>`).join('')}</select></div></div><p class="island-preview-note" hidden data-island-text="Visual preview only. Your game records stay unchanged."></p><div class="island-map-viewport" role="region" aria-label="Island exploration map" tabindex="0"><div class="island-map-world"><div class="island-map-markers"></div><div class="island-cartouche" aria-hidden="true"><span>TOENOW</span><span data-island-text="EXPLORER'S ISLAND"></span></div></div></div><div class="island-map-bottom"><label for="islandLocationSelect" data-island-text="Travel to a place"></label><select id="islandLocationSelect"></select><span data-island-text="Swipe the map to explore. Select a place to see its challenge."></span></div><div class="island-legend"><span data-island-text="Five stages, one growing landmark"></span><div>${[1,2,3,4,5].map(n=>`<span>LVL ${n}</span>`).join('<span aria-hidden="true">—</span>')}</div><p data-island-text="Animal homes grow with your highest level reached in normal play. Practice runs do not advance the island."></p></div></div><dialog class="island-location-dialog" aria-labelledby="islandLocationTitle"><button type="button" class="island-dialog-close" aria-label="Close location">×</button><div class="island-dialog-content"></div><button type="button" class="island-play-button" data-island-text="Enter challenge"></button></dialog>`;
    const dialog = host.querySelector('dialog');
    const markers = host.querySelector('.island-map-markers');
    const locationSelect = host.querySelector('#islandLocationSelect');
    const previewSelect = host.querySelector('#islandStagePreview');
    const guidance = doc.createElement('div');
    guidance.className = 'island-guidance';
    host.querySelector('.island-map-viewport').before(guidance);
    const routes = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    routes.setAttribute('class', 'island-discovery-route');
    routes.setAttribute('viewBox', '0 0 100 100');
    routes.setAttribute('preserveAspectRatio', 'none');
    routes.setAttribute('aria-hidden', 'true');
    host.querySelector('.island-map-world').prepend(routes);
    const unlocked = id => !exploration || exploration.isUnlocked(id);
    const findGame = id => games.find(game => game.id === id);
    const visibleLocations = () => LOCATIONS.filter(place => { const game = findGame(place.gameId); return game && (category === 'all' || game.category === category); });
    function renderDetail() {
      const location = LOCATIONS.find(l => l.gameId === selectedId), game = findGame(selectedId);
      if (!location || !game) return;
      const locked = !unlocked(selectedId);
      host.querySelector('.island-play-button').hidden = locked;
      if (locked) {
        host.querySelector('.island-dialog-content').innerHTML = `<div class="island-locked-detail" aria-hidden="true">☁</div><p class="island-detail-eyebrow">${e('Still in the mist')}</p><h2 id="islandLocationTitle">${e(location.name)}</h2><p class="island-detail-description">${e('Complete Level 1 in an open game to reveal another place.')}</p><p class="island-real-progress">${e('Pass Wave 5 in normal play to unlock one new place.')}</p>`;
        return;
      }
      const p = getProgress(selectedId, storage, levels);
      const displayLevel = preview || p.level;
      host.querySelector('.island-dialog-content').innerHTML = `<div class="island-detail-art" data-stage="${displayLevel}">${landmark(location.kind,displayLevel,location.color)}</div><p class="island-detail-eyebrow">${e('A place to discover')} · ${e(game.title)}</p><h2 id="islandLocationTitle">${e(location.name)}</h2><p class="island-detail-description">${e(game.description || '')}</p><p class="island-real-progress">${p.explored ? `${e('Highest level reached')}: LVL ${p.level} · ${e('Wave')} ${p.wave}` : e('Not yet explored. Your first adventure starts at Level 1.')}</p><div class="island-stage-gallery" aria-label="${e('Five landmark stages')}">${[1,2,3,4,5].map(n=>`<div class="island-stage-card ${n===displayLevel?'is-current':''}" data-stage="${n}">${landmark(location.kind,n,location.color)}<span>LVL ${n}</span><small>${e(levels.LEVELS[n-1].name)}</small></div>`).join('')}</div><p class="island-detail-footnote">${e(preview ? 'Visual preview only. Your game records stay unchanged.' : 'Reach the next level in normal play to grow this landmark.')}</p>`;
    }
    function render() {
      const focusedGameId = doc.activeElement?.closest('[data-island-game]')?.dataset.islandGame;
      const journey = exploration?.snapshot();
      const exploring = journey?.mode === 'explore';
      const nextId = journey?.unlocked.find(id => !journey.completed.includes(id));
      const nextPlace = LOCATIONS.find(l => l.gameId === nextId);
      const allOpen = journey && journey.unlocked.length >= LOCATIONS.filter(l => findGame(l.gameId)).length;
      host.dataset.journey = exploring ? (allOpen ? 'complete' : 'explore') : 'open';
      const pendingPlace = LOCATIONS.find(l => l.gameId === journey?.pending);
      const nextLockedPlace = LOCATIONS.find(l => l.gameId === journey?.order.find(id => !journey.unlocked.includes(id)));
      guidance.hidden = !exploring;
      guidance.innerHTML = !exploring ? '' : pendingPlace ? `<div class="island-discovery" role="status"><span class="island-mission-icon" aria-hidden="true">✦</span><div><strong>${e('A new place awaits!')}</strong><p>${e(pendingPlace.name)} · ${e('Your next adventure is ready.')}</p></div><button type="button" class="island-discovery-go">${e('Explore now')}</button><button type="button" class="island-discovery-later">${e('Later')}</button></div>` : `<div class="island-mission"><span class="island-mission-icon" aria-hidden="true">⚑</span><div><strong>${e(allOpen ? 'All places discovered!' : journey.unlocked.length === 1 ? 'Your first mission' : 'Your next discovery')}</strong><p>${e(allOpen ? 'Keep playing to help every home grow.' : 'Complete Level 1 to discover a new place.')}</p></div>${nextPlace ? `<button type="button" class="island-mission-go">${e('Start exploring')}</button>` : ''}</div>`;
      const previousPlace = LOCATIONS.find(l => l.gameId === journey?.completed[journey.completed.length - 1]);
      const missionCopy = guidance.querySelector('.island-mission p');
      if (missionCopy && nextLockedPlace) {
        const destination = doc.createElement('span'); destination.className = 'island-next-destination';
        destination.textContent = `${t('Next place')}: ${t(nextLockedPlace.name)}`;
        missionCopy.appendChild(destination);
      }
      routes.innerHTML = pendingPlace && previousPlace ? `<path d="M ${previousPlace.x} ${previousPlace.y} Q ${previousPlace.x} ${pendingPlace.y} ${pendingPlace.x} ${pendingPlace.y}"/>` : '';
      host.dataset.view = view;
      host.querySelector('.island-map-panel').hidden = view !== 'island';
      if (listHost) listHost.hidden = view !== 'list';
      for (const button of host.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === view));
      for (const node of host.querySelectorAll('[data-island-text]')) node.textContent = t(node.dataset.islandText);
      host.querySelector('.island-view-switch').setAttribute('aria-label', t('Hub view'));
      host.querySelector('.island-map-viewport').setAttribute('aria-label',t('Island exploration map'));
      host.querySelector('.island-dialog-close').setAttribute('aria-label',t('Close location'));
      previewSelect.value = String(preview);
      host.querySelector('.island-preview-note').hidden = !preview;
      const visible = visibleLocations();
      if (!visible.some(l=>l.gameId===selectedId)) selectedId = visible[0]?.gameId || LOCATIONS[0].gameId;
      const all = LOCATIONS.filter(l=>findGame(l.gameId));
      const explored = all.filter(l=>getProgress(l.gameId,storage,levels).explored).length;
      host.querySelector('.island-counter').textContent = exploring ? `${journey.unlocked.length} / ${all.length} ${t('places open')}` : `${explored} / ${all.length} ${t('places explored')}`;
      markers.innerHTML = visible.map(l=>{
        const game = findGame(l.gameId), p=getProgress(l.gameId,storage,levels), stage=preview||p.level;
        const locked = !unlocked(l.gameId);
        if (locked) return `<button type="button" class="island-location is-locked" data-island-game="${l.gameId}" data-stage="1" data-locked="true" style="left:${l.x}%;top:${l.y}%;--place-color:${l.color}" aria-label="${e(l.name)} · ${e('Still in the mist')}"><span class="island-mist-art" aria-hidden="true">${landmark(l.kind,1,l.color)}</span><span class="island-mist-cloud" aria-hidden="true"></span><span class="island-lock" aria-hidden="true">🔒</span><span class="island-locked-label">${e('Still in the mist')}</span></button>`;
        return `<button type="button" class="island-location ${p.explored?'is-explored':''} ${l.gameId === nextId && exploring ? 'is-next' : ''} ${l.gameId === journey?.pending ? 'is-discovered' : ''}" aria-disabled="false" data-island-game="${l.gameId}" data-stage="${stage}" style="left:${l.x}%;top:${l.y}%;--place-color:${l.color}" aria-label="${e(l.name)} · ${e(game.title)} · ${e(p.explored?'Highest level reached':'Not yet explored')}${p.explored?' '+p.level:''}">${landmark(l.kind,stage,l.color)}<span class="island-place-label">${e(l.name)}<small>${e(game.title)}</small><span class="island-stage-dots" aria-hidden="true">${[1,2,3,4,5].map(n=>`<i class="${n<=stage?'is-filled':''}"></i>`).join('')}<b>${preview?e('Preview'):p.explored?'LVL '+p.level:e('Explore')}</b></span></span></button>`;
      }).join('');
      locationSelect.innerHTML = visible.map(l=>`<option value="${l.gameId}">${e(l.name)} · ${e(findGame(l.gameId).title)}</option>`).join('');
      locationSelect.value = selectedId;
      renderDetail();
      if (focusedGameId && !dialog.open) markers.querySelector(`[data-island-game="${focusedGameId}"]`)?.focus({preventScroll:true});
    }
    function showLocation(id, invoker) {
      if (!visibleLocations().some(l=>l.gameId===id)) return;
      selectedId=id;locationSelect.value=id;renderDetail();
      if (!dialog.open) {
        dialogInvoker = invoker || doc.activeElement;
        launchingGame = false;
        dialog.showModal();
      }
    }
    function dialogClosed() {
      if (launchingGame) { launchingGame=false; return; }
      // Native close events are queued: a newer click/focus must take precedence.
      const current = doc.activeElement;
      if (dialog.open || (current && current !== doc.body && current !== doc.documentElement && current !== dialogInvoker && !dialog.contains(current))) return;
      const id = dialogInvoker?.dataset?.islandGame;
      const target = id ? markers.querySelector(`[data-island-game="${id}"]`) : dialogInvoker;
      if (target?.isConnected) target.focus({preventScroll:true});
    }
    function click(event) {
      const viewButton=event.target.closest('button[data-view]');
      if(viewButton){view=viewButton.dataset.view;try{storage?.setItem(VIEW_KEY,view);}catch(_){}render();return;}
      const place=event.target.closest('[data-island-game]');
      if(place){showLocation(place.dataset.islandGame,place);return;}
      if(event.target.closest('.island-dialog-close'))dialog.close();
      if(event.target.closest('.island-play-button')){
        const game=findGame(selectedId);
        if(!game||!unlocked(selectedId)||launchingGame)return;
        launchingGame=true;
        openGame(game,()=>{if(launchingGame)dialog.close();});
      }
      if(event.target.closest('.island-mission-go')) { focusNext(); const id = exploration?.snapshot().unlocked.find(id => !exploration.snapshot().completed.includes(id)); if(id)showLocation(id,event.target); }
      if(event.target.closest('.island-discovery-go')) { const id = exploration.snapshot().pending; exploration.dismissDiscovery();render();focusPlace(id);showLocation(id,markers.querySelector(`[data-island-game="${id}"]`)); }
      if(event.target.closest('.island-discovery-later')) { exploration.dismissDiscovery();render();focusNext(); }
      if(event.target===dialog) {
        const box=dialog.getBoundingClientRect();
        if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
      }
    }
    function change(event) {
      if(event.target===previewSelect){preview=Number(previewSelect.value);render();}
      if(event.target===locationSelect)showLocation(locationSelect.value,locationSelect);
    }
    function storageChanged(event) {
      if(event.key===VIEW_KEY){view=event.newValue==='list'?'list':'island';}
      render();
    }
    function recoverArt(event) {
      const image = event.target;
      if (!image.matches?.('img[data-island-art]')) return;
      const container = image.closest('[data-building-kind]');
      if (!container) return;
      const kind = container.dataset.buildingKind;
      const level = Number(container.dataset.buildingLevel);
      const color = LOCATIONS.find(location => location.kind === kind)?.color || '#7e8065';
      container.outerHTML = landmarkVector(kind, level, color).replace('<svg ', '<svg data-art-fallback="true" ');
    }
    const languageChanged=()=>render();
    function centerPlace(id) {
      const node = markers.querySelector(`[data-island-game="${id}"]`);
      if (!node) return;
      const viewport = host.querySelector('.island-map-viewport');
      viewport.scrollLeft = node.offsetLeft - viewport.clientWidth / 2;
      viewport.scrollTop = node.offsetTop - viewport.clientHeight / 2;
      return node;
    }
    function focusPlace(id) { centerPlace(id)?.focus({preventScroll:true}); }
    function resizeMap() {
      const journey = exploration?.snapshot();
      if (journey?.mode === 'explore') centerPlace(journey.pending || journey.unlocked.find(id => !journey.completed.includes(id)) || 'number-pop');
    }
    function focusNext() {
      const journey = exploration?.snapshot();
      const id = journey?.pending || journey?.unlocked.find(id => !journey.completed.includes(id)) || 'number-pop';
      focusPlace(id);
    }
    host.addEventListener('click',click);host.addEventListener('change',change);
    host.addEventListener('error',recoverArt,true);
    dialog.addEventListener('close',dialogClosed);
    root.addEventListener('toenow:languagechange',languageChanged);
    root.addEventListener('storage',storageChanged);
    root.addEventListener('resize',resizeMap);
    render();
    if (exploration?.snapshot().mode === 'explore') root.requestAnimationFrame(() => {
      // Position the mobile map without stealing focus from welcome/auth dialogs.
      const active = doc.activeElement; focusNext(); active?.focus({preventScroll:true});
    });
    return {
      showLocation, focusNext,
      refresh(next={}){if(next.games)games=next.games;if(next.category)category=next.category;render();},
      destroy(){dialog.removeEventListener('close',dialogClosed);dialog.close();host.removeEventListener('click',click);host.removeEventListener('change',change);host.removeEventListener('error',recoverArt,true);root.removeEventListener('toenow:languagechange',languageChanged);root.removeEventListener('storage',storageChanged);root.removeEventListener('resize',resizeMap);host.replaceChildren();if(listHost)listHost.hidden=false;}
    };
  }
  return {LOCATIONS,getProgress,getBuildingAsset,landmark,landmarkVector,mount};
});
