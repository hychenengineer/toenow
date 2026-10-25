(() => {
  'use strict';
  const animals = {
    cat: { name: 'Cat', color: '#edbf88', ears: '<path d="M13 29 9 7 29 19M35 19 55 7 51 29" fill="#edbf88" stroke="#573e39" stroke-width="2"/><path d="m13 13 3 12 9-6m14 0 9 6 3-12" fill="#db8c88"/>', detail: '<path d="m12 39-9-3m10 9-10 2m48-8 10-3m-11 9 10 2" stroke="#573e39" stroke-width="2"/>' },
    dog: { name: 'Dog', color: '#c79772', ears: '<path d="M20 18C4 9 0 25 7 43l14-9m22-16C60 9 64 25 57 43L43 34" fill="#77584b" stroke="#493832" stroke-width="2"/>', detail: '<ellipse cx="23" cy="31" rx="7" ry="10" fill="#9d6b4f"/><path d="M29 45q3 11 7 0" fill="#e6a5a6"/>' },
    rabbit: { name: 'Rabbit', color: '#e6dceb', ears: '<ellipse cx="23" cy="16" rx="7" ry="15" fill="#e6dceb"/><ellipse cx="41" cy="16" rx="7" ry="15" fill="#e6dceb"/><ellipse cx="23" cy="15" rx="3" ry="10" fill="#d9a6b9"/><ellipse cx="41" cy="15" rx="3" ry="10" fill="#d9a6b9"/>', detail: '<path d="M30 46h4v5h-4z" fill="#fff"/>' },
    fox: { name: 'Fox', color: '#e18d5b', ears: '<path d="M12 31 9 5 30 19M34 19 55 5 52 31" fill="#e18d5b" stroke="#704437" stroke-width="2"/><path d="m14 14 3 13 10-6m10 0 10 6 3-13" fill="#5b4948"/>', detail: '<path d="M10 34Q11 54 32 57 53 54 54 34L32 43Z" fill="#fff0d8"/>' },
    panda: { name: 'Panda', color: '#e6ede5', ears: '<circle cx="15" cy="18" r="10" fill="#384551"/><circle cx="49" cy="18" r="10" fill="#384551"/>', detail: '<ellipse cx="22" cy="34" rx="9" ry="11" fill="#384551" transform="rotate(20 22 34)"/><ellipse cx="42" cy="34" rx="9" ry="11" fill="#384551" transform="rotate(-20 42 34)"/>' },
    pig: { name: 'Pig', color: '#edafb9', ears: '<path d="M13 30 7 8q18-3 20 13m10 0q2-16 20-13l-6 22" fill="#edafb9" stroke="#9c6178" stroke-width="2"/>', detail: '<ellipse cx="32" cy="43" rx="12" ry="8" fill="#d78098"/><circle cx="27" cy="43" r="2" fill="#845167"/><circle cx="37" cy="43" r="2" fill="#845167"/>' },
    owl: { name: 'Owl', color: '#ad9a79', ears: '<path d="m10 31 1-24 18 14m6 0L53 7l1 24" fill="#857157"/>', detail: '<ellipse cx="22" cy="34" rx="11" ry="13" fill="#fff0cf"/><ellipse cx="42" cy="34" rx="11" ry="13" fill="#fff0cf"/><path d="m28 42 4 9 4-9" fill="#e6af5e"/>' },
    bear: { name: 'Bear', color: '#ad7955', ears: '<circle cx="15" cy="18" r="10" fill="#ad7955"/><circle cx="49" cy="18" r="10" fill="#ad7955"/><circle cx="15" cy="18" r="5" fill="#75543f"/><circle cx="49" cy="18" r="5" fill="#75543f"/>', detail: '<ellipse cx="32" cy="44" rx="13" ry="10" fill="#e7c5a2"/>' }
  };
  function face(animal) {
    const a = animals[animal];
    return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${a.ears}<ellipse cx="32" cy="36" rx="23" ry="22" fill="${a.color}"/>${a.detail}<circle cx="23" cy="34" r="2.5" fill="${animal === 'panda' ? '#fff' : '#29323b'}"/><circle cx="41" cy="34" r="2.5" fill="${animal === 'panda' ? '#fff' : '#29323b'}"/><path d="m29 42 3 3 3-3z" fill="#573e46"/><path d="M32 45v3m-5-1q5 5 10 0" fill="none" stroke="#573e46" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  const $ = id => document.getElementById(id);
  const levels = RescueLevels;
  const storageKey = ToenowLevels.GAME_STORAGE_KEYS['animal-rescue-train'].session;
  let puzzleStorage;
  try { puzzleStorage = localStorage; } catch { /* Storage can be disabled by the browser. */ }
  const picker = RescuePicker.createPicker({ storage: puzzleStorage, key: ToenowLevels.GAME_STORAGE_KEYS['animal-rescue-train'].puzzles });
  let storageAvailable = true;
  let saved = null;
  try { saved = RescueSession.restoreProgress(localStorage.getItem(storageKey), levels, picker.resolve); }
  catch { storageAvailable = false; }
  let wave = saved?.wave ?? 1;
  let isPractice = saved?.isPractice ?? false;
  let levelIndex = ToenowLevels.getLevelInfo(wave).level - 1;
  let game = saved?.game ?? new RescueTrain.Game(picker.resolve(wave));
  let actions = saved?.actions ?? [];
  let scoreBefore = saved?.scoreBefore ?? 0;
  let elapsedBank = saved?.elapsedMs ?? 0;
  let runStarted = Date.now();
  let reported = saved?.reported ?? false;
  let hasSave = Boolean(saved);
  let selected = null;
  let paused = false;
  const successParts = ['result', 'next', 'btn-share-score', 'record-notice'].map(id => {
    const node = $(id);
    return { node, home: node.parentElement, before: node.nextSibling };
  });
  function closeSuccess() {
    if ($('success-dialog').open) $('success-dialog').close();
    successParts.forEach(({ node, home, before }) => {
      if (node.parentElement !== home) home.insertBefore(node, before);
    });
  }
  function syncSuccess() {
    if (game.state.status !== 'won' || document.body.dataset.screen !== 'play') { closeSuccess(); return; }
    const dialog = $('success-dialog');
    dialog.insertBefore($('result'), $('success-actions'));
    $('success-actions').insertBefore($('next'), $('success-menu'));
    dialog.appendChild($('btn-share-score'));
    dialog.appendChild($('record-notice'));
    if (!dialog.open) { dialog.showModal(); $('next').focus(); }
  }
  const letter = index => String.fromCharCode(65 + index);
  const elapsed = () => elapsedBank + Date.now() - runStarted;
  const rescued = () => Object.values(game.state.rescued).reduce((sum, count) => sum + count, 0);
  const sdk = new ToenowGameSDK({
    gameId: 'animal-rescue-train', category: 'logic', gameTitle: 'Animal Rescue Train',
    hasWaves: false, maxLevels: 5,
    onStart: begin, onRestart: retry,
    onPause: () => { if (document.body.dataset.screen === 'play' && !paused) { paused = true; $('pause-dialog').showModal(); } },
    onResume: () => { if ($('pause-dialog').open) $('pause-dialog').close(); if ($('help-dialog').open) $('help-dialog').close(); paused = $('last-animal-dialog').open; }
  });
  sdk.setPracticeMode(isPractice);

  function persist() {
    hasSave = true;
    try { localStorage.setItem(storageKey, JSON.stringify(RescueSession.saveProgress(levelIndex, game.level, actions, game.canUndo,
      { wave, isPractice, scoreBefore, elapsedMs: elapsed(), reported }))); }
    catch { storageAvailable = false; }
  }
  function renderMenu() {
    sdk.syncTitleUI();
    $('continue').hidden = !hasSave;
    const info = ToenowLevels.getLevelInfo(wave);
    $('continue').textContent = `Continue Level ${info.level}${isPractice ? ' (practice)' : ''}`;
    $('save-notice').textContent = storageAvailable ? 'No account needed. Guest progress is saved in this browser.' : 'Saving is unavailable. Keep this tab open to continue.';
  }
  function showPlay() {
    $('menu-screen').hidden = true; $('play-screen').hidden = false;
    document.body.dataset.screen = 'play'; document.body.dataset.state = 'playing';
    paused = false; render();
    window.scrollTo(0, 0);
    if (game.state.status === 'playing' && game.level.requiredLastAnimal) {
      const animal = game.level.requiredLastAnimal;
      $('last-animal-picture').innerHTML = face(animal);
      $('last-animal-rule').textContent = `${animals[animal].name} must be the last animal to depart.`;
      paused = true;
      if (!$('last-animal-dialog').open) $('last-animal-dialog').showModal();
      $('acknowledge-last-animal').focus();
    }
  }
  function begin(options) {
    wave = Math.max(1, Math.floor(options.wave || 1));
    isPractice = Boolean(options.isPractice);
    scoreBefore = 0; elapsedBank = 0; runStarted = Date.now();
    loadRound();
  }
  function loadRound() {
    closeSuccess();
    if ($('last-animal-dialog').open) $('last-animal-dialog').close();
    sdk.resume();
    levelIndex = ToenowLevels.getLevelInfo(wave).level - 1;
    game = new RescueTrain.Game(picker.pick(wave));
    actions = []; reported = false; selected = null;
    persist(); showPlay();
  }
  function retry() { sdk.startRun({ wave, isPractice }); loadRound(); }
  function reportResult() {
    if (game.state.status === 'playing' || reported) return;
    reported = true;
    const report = sdk.handleGameOver({ score: scoreBefore + rescued(), wave, isPractice, duration: elapsed() });
    if (report.isValid === false) $('record-notice').textContent = 'This attempt could not be recorded.';
  }
  function renderStationmaster() {
    const state = game.state;
    const stationmaster = $('stationmaster');
    if (stationmaster) {
      const zh = window.ToenowI18n?.language?.startsWith('zh');
      const task = state.status === 'won' ? (zh ? '熊貓站長：旅客都安全到家了！' : 'Panda stationmaster: everyone is safely home!')
        : state.status === 'lost' ? (zh ? '熊貓站長：試試另一個上車順序。' : 'Panda stationmaster: try another boarding order.')
        : selected !== null ? (zh ? '熊貓站長：幫這位旅客選一節車廂。' : 'Panda stationmaster: choose a carriage for this passenger.')
        : (zh ? '熊貓站長：選擇隊伍前方的旅客。' : 'Panda stationmaster: choose a passenger at the front.');
      if (!stationmaster.querySelector('svg')) stationmaster.innerHTML = face('panda') + '<span></span>';
      const label = stationmaster.querySelector('span');
      if (label) label.textContent = task;
      stationmaster.dataset.status = state.status;
    }
  }
  function render(message) {
    window.ToenowAnimals?.setWave('animal-rescue-train', wave);
    const state = game.state;
    const info = ToenowLevels.getLevelInfo(wave);
    const playing = state.status === 'playing';
    document.body.dataset.tier = info.level;
    $('queues').style.setProperty('--queue-count', state.queues.length);
    $('cars').style.setProperty('--car-count', state.cars.length);
    $('tier-label').textContent = `${info.badgeText}${isPractice ? ' · PRACTICE' : ''}`;
    $('board-size').textContent = `${state.queues.length} queues · ${state.cars.length} carriages`;
    $('level-number').textContent = `LEVEL ${info.level}`;
    $('level-name').textContent = levels[levelIndex].name;
    $('moves').textContent = state.moves;
    const target = Object.values(game.level.goals).reduce((sum, count) => sum + count, 0);
    $('total').textContent = `${rescued()} / ${target} rescued`;
    $('goals').innerHTML = Object.entries(game.level.goals).map(([animal, count]) => {
      const savedCount = state.rescued[animal] || 0;
      const isReq = game.level.requiredLastAnimal === animal;
      const labelBadge = isReq ? '<span class="last-animal-badge" style="display:inline-block;margin-left:4px;font-size:0.7em;background:#f59e0b;color:#000;padding:1px 5px;border-radius:4px;font-weight:700;">LAST</span>' : '';
      return `<div class="goal ${savedCount >= count ? 'done' : ''} ${isReq ? 'required-last-goal' : ''}" aria-label="${animals[animal].name}: ${savedCount} rescued, target ${count}">${face(animal)}<span class="label">${animals[animal].name}${labelBadge}</span><strong>${savedCount} / ${count}</strong>${savedCount >= count ? '<span aria-hidden="true">✓</span>' : ''}</div>`;
    }).join('');
    $('queues').innerHTML = state.queues.map((queue, index) => `<div class="queue"><div class="queue-header"><strong>Queue ${letter(index)}</strong><span>${queue.length} left</span></div><button class="head" data-queue="${index}" aria-pressed="${selected === index}" aria-label="Queue ${letter(index)} head: ${queue.length ? animals[queue[0]].name : 'empty'}" ${!playing || !queue.length ? 'disabled' : ''}>${queue.length ? `<span class="head-label">Front</span>${face(queue[0])}<span class="animal-name">${animals[queue[0]].name}</span>` : '<span class="empty-head">All aboard ✓</span>'}</button><p class="preview-label">Next 1 → 2 → 3</p><div class="previews">${[1, 2, 3].map(position => `<span class="preview ${queue[position] ? '' : 'empty'}" role="img" aria-label="${queue[position] ? `Upcoming ${position}: ${animals[queue[position]].name}` : 'No more animals'}">${queue[position] ? face(queue[position]) : '·'}</span>`).join('')}</div></div>`).join('');
    $('cars').innerHTML = state.cars.map((car, index) => {
      const boardable = selected !== null && RescueTrain.canBoard(state, selected, index);
      const hint = car.length ? `${animals[car[0]].name} only · needs ${3 - car.length}` : 'Any animal · empty';
      return `<button class="car ${boardable ? 'boardable' : ''} ${car.length === 3 ? 'full' : ''}" data-car="${index}" aria-label="Carriage ${index + 1}, ${car.length} of 3 seats, ${car.map(animal => animals[animal].name).join(', ') || 'empty'}" ${boardable ? '' : 'disabled'}><span class="car-title"><span>Car ${index + 1}</span><span>${car.length} / 3</span></span><span class="seats">${[0, 1, 2].map(seat => `<span class="seat ${car[seat] ? '' : 'free'}">${car[seat] ? face(car[seat]) : '<span aria-hidden="true">+</span>'}</span>`).join('')}</span><span class="car-hint">${hint}</span></button>`;
    }).join('');
    const isLastLevel = info.level >= 5;
    const reqName = game.level.requiredLastAnimal ? animals[game.level.requiredLastAnimal].name : null;
    const reqPrompt = reqName ? ` ${reqName} must be the last animal to depart.` : '';
    const prompt = selected === null ? ('Choose an animal, then a carriage.' + reqPrompt) : `${animals[state.queues[selected][0]].name} selected from queue ${letter(selected)}. Choose a carriage.`;
    renderStationmaster();
    $('instruction').textContent = message || (playing ? prompt : state.status === 'won' ? (isLastLevel ? 'All 5 levels complete! Every animal is safely home.' : 'Every animal is safely home.') : (reqName && (state.rescued[game.level.requiredLastAnimal] || 0) >= game.level.goals[game.level.requiredLastAnimal] ? `${reqName} departed too early! ${reqName} must depart last.` : 'Try a different boarding order.'));
    $('undo').disabled = !game.canUndo;
    $('result').hidden = playing; $('result').className = `result ${state.status}`;
    if (!playing) {
      if (state.status === 'won') {
        if (isLastLevel && !isPractice) {
          $('result').innerHTML = `<h3 id="result-title">Game Complete!</h3><p>Outstanding! You completed all 5 levels and rescued ${scoreBefore + rescued()} animals.</p>`;
        } else {
          $('result').innerHTML = `<h3 id="result-title">Level cleared!</h3><p>${rescued()} animals rescued. ${isPractice ? 'Practice level completed.' : 'Next level is unlocked!'}</p>`;
        }
      } else {
        const premature = reqName && (state.rescued[game.level.requiredLastAnimal] || 0) >= game.level.goals[game.level.requiredLastAnimal];
        $('result').innerHTML = premature
          ? `<h3>Mission Failed</h3><p>${reqName} was sent away too early! ${reqName} was designated to leave last. Undo a move or retry.</p>`
          : '<h3>Station blocked</h3><p>No animal can board before the targets are met. Undo a move or retry this puzzle.</p>';
      }
    }
    if (state.status === 'won') {
      if (isLastLevel && !isPractice) {
        $('next').textContent = 'Play Again ↻';
        $('next').hidden = false;
      } else {
        $('next').textContent = isPractice ? 'Next puzzle →' : 'Next level →';
        $('next').hidden = false;
      }
    } else {
      $('next').hidden = true;
    }
    $('btn-share-score').hidden = playing;
    if (playing) $('record-notice').textContent = '';
    syncSuccess();
  }
  $('btn-start-game').addEventListener('click', () => sdk.start({ wave: 1, isPractice: false }));
  sdk.setupPractice((startWave, practice) => sdk.start({ wave: startWave, isPractice: practice }));
  $('continue').addEventListener('click', () => { selected = null; sdk.startRun({ wave, isPractice }); showPlay(); });
  $('menu').addEventListener('click', () => {
    closeSuccess();
    sdk.resume(); persist(); selected = null; renderMenu();
    $('play-screen').hidden = true; $('menu-screen').hidden = false;
    document.body.dataset.screen = 'menu'; document.body.dataset.state = 'title';
    $('continue').focus();
  });
  $('queues').addEventListener('click', event => {
    const button = event.target.closest('[data-queue]');
    if (paused || !button || button.disabled) return;
    const index = Number(button.dataset.queue); selected = selected === index ? null : index;
    render(); document.querySelector(`[data-queue="${index}"]`)?.focus({ preventScroll: true });
  });
  $('cars').addEventListener('click', event => {
    const button = event.target.closest('[data-car]');
    if (paused || !button || button.disabled || selected === null) return;
    const queue = selected, carIndex = Number(button.dataset.car);
    if (!game.move(queue, carIndex)) return;
    window.ToenowAnimals?.feedback('animal-rescue-train', game.state.status !== 'lost');
    actions.push([queue, carIndex]); selected = null; render(); reportResult(); persist();
    const departure = game.state.departure;
    const stationmaster = $('stationmaster');
    if (stationmaster) {
      stationmaster.classList.remove('boarding-cheer');
      void stationmaster.offsetWidth;
      stationmaster.classList.add('boarding-cheer');
    }
    if (departure) {
      $('instruction').textContent = `${animals[departure.animal].name} carriage departed! Three rescued; an empty carriage is ready.`;
      const car = document.querySelector(`[data-car="${departure.car}"]`);
      const ghost = document.createElement('span'); ghost.className = 'departure-ghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.textContent = '+3 rescued →';
      car.classList.add('departing'); car.append(ghost); ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
    }
    if (event.detail === 0) (document.querySelector('.head:not(:disabled)') || $('undo')).focus({ preventScroll: true });
  });
  $('undo').addEventListener('click', () => {
    if (!paused && game.undo()) { actions.pop(); selected = null; reported = false; persist(); render('Last move undone. Choose a queue head.'); }
  });
  $('restart').addEventListener('click', () => { if (!paused) sdk.restart(); });
  $('next').addEventListener('click', () => {
    if (paused || game.state.status !== 'won') return;
    scoreBefore = isPractice ? 0 : scoreBefore + rescued();
    const info = ToenowLevels.getLevelInfo(wave);
    if (!isPractice && info.level >= 5) {
      // Completed all 5 levels, restart normal run from level 1
      wave = 1;
      scoreBefore = 0;
    } else {
      // Each level is exactly 1 step (next level's start wave)
      const nextLevel = info.level + 1;
      const nextLvlObj = ToenowLevels.LEVELS.find(l => l.level === nextLevel);
      wave = isPractice
        ? info.startWave
        : (nextLvlObj ? nextLvlObj.startWave : 1);
    }
    sdk.startRun({ wave, isPractice });
    loadRound();
  });
  $('btn-share-score').addEventListener('click', () => sdk.share({ gameTitle: 'Animal Rescue Train', score: scoreBefore + rescued(), wave }));
  $('success-menu').addEventListener('click', () => $('menu').click());
  $('success-dialog').addEventListener('cancel', event => event.preventDefault());
  $('help-content').innerHTML = `<ol class="rules">${$('rules-list').innerHTML}</ol><p class="warning">${$('mixed-warning').textContent}</p>`;
  $('help').addEventListener('click', () => { paused = true; $('help-dialog').showModal(); });
  $('close-help').addEventListener('click', () => sdk.resume());
  $('resume').addEventListener('click', () => sdk.resume());
  $('acknowledge-last-animal').addEventListener('click', () => {
    $('last-animal-dialog').close();
    paused = Boolean($('help-dialog').open || $('pause-dialog').open);
    document.querySelector('.head:not(:disabled)')?.focus({ preventScroll: true });
  });
  $('last-animal-dialog').addEventListener('cancel', event => event.preventDefault());
  ['help-dialog', 'pause-dialog', 'last-animal-dialog'].forEach(id => $(id).addEventListener('close', () => { paused = Boolean($('help-dialog').open || $('pause-dialog').open || $('last-animal-dialog').open); }));
  $('exit-title').addEventListener('click', () => sdk.exitToHub());
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    if (event.data?.type === 'GAME_RESTART') sdk.restart();
    if (event.data?.type === 'GAME_PAUSE') sdk.pause();
    if (event.data?.type === 'GAME_RESUME') sdk.resume();
  });
  window.addEventListener('toenow:languagechange', renderStationmaster);
  window.addEventListener('pagehide', () => { if (hasSave) persist(); });
  renderMenu(); render();
})();
