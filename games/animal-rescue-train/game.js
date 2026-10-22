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
  const storageKey = 'toenow_rescue_train_guest_v1';
  let storageAvailable = true;
  let saved = null;
  try { saved = RescueSession.restoreProgress(localStorage.getItem(storageKey), levels); }
  catch { storageAvailable = false; }
  let levelIndex = saved?.index ?? 0;
  let menuIndex = levelIndex;
  let game = saved?.game ?? new RescueTrain.Game(levels[levelIndex]);
  let actions = saved?.actions ?? [];
  let hasSave = Boolean(saved);
  let selected = null;
  const letter = index => String.fromCharCode(65 + index);

  function persist() {
    hasSave = true;
    try { localStorage.setItem(storageKey, JSON.stringify(RescueSession.saveProgress(levelIndex, levels[levelIndex], actions, game.canUndo))); }
    catch { storageAvailable = false; }
  }
  function renderMenu() {
    $('levels').innerHTML = levels.map((level, index) => `<button class="level ${index === menuIndex ? 'active' : ''}" data-level="${index}" aria-pressed="${index === menuIndex}" aria-label="Level ${level.tier}: ${level.tierName}, ${level.queues.length} queues and ${level.carCount} carriages"><span class="number">${level.tier}</span><span class="level-title">${level.tierName}<small>${level.queues.length} queues · ${level.carCount} carriages</small></span></button>`).join('');
    $('level-tip').textContent = levels[menuIndex].thinking;
    $('start').textContent = `Start level ${menuIndex + 1}`;
    $('continue').hidden = !hasSave;
    $('continue').textContent = `Continue level ${levelIndex + 1}`;
    $('save-notice').textContent = storageAvailable ? 'No account needed. Progress is saved in this browser.' : 'Saving is unavailable in this browser. Keep this tab open to continue.';
  }
  function showPlay() {
    $('menu-screen').hidden = true;
    $('play-screen').hidden = false;
    document.body.dataset.screen = 'play';
    render();
    window.scrollTo(0, 0);
  }
  function load(index) {
    levelIndex = menuIndex = index;
    game = new RescueTrain.Game(levels[index]);
    actions = [];
    selected = null;
    persist();
    showPlay();
  }
  function render(message) {
    const state = game.state;
    const level = levels[levelIndex];
    const playing = state.status === 'playing';
    document.body.dataset.tier = level.tier;
    $('queues').style.setProperty('--queue-count', state.queues.length);
    $('cars').style.setProperty('--car-count', state.cars.length);
    $('tier-label').textContent = `Level ${level.tier} · ${level.tierName}`;
    $('board-size').textContent = `${state.queues.length} queues · ${state.cars.length} carriages`;
    $('level-number').textContent = `LEVEL ${level.tier} / 5`;
    $('level-name').textContent = level.name;
    $('moves').textContent = state.moves;
    const total = Object.values(state.rescued).reduce((sum, count) => sum + count, 0);
    const target = Object.values(level.goals).reduce((sum, count) => sum + count, 0);
    $('total').textContent = `${total} / ${target} rescued`;
    $('goals').innerHTML = Object.entries(level.goals).map(([animal, count]) => {
      const rescued = state.rescued[animal] || 0;
      return `<div class="goal ${rescued >= count ? 'done' : ''}" aria-label="${animals[animal].name}: ${rescued} rescued, target ${count}">${face(animal)}<span class="label">${animals[animal].name}</span><strong>${rescued} / ${count}</strong>${rescued >= count ? '<span aria-hidden="true">✓</span>' : ''}</div>`;
    }).join('');
    $('queues').innerHTML = state.queues.map((queue, index) => `<div class="queue"><div class="queue-header"><strong>Queue ${letter(index)}</strong><span>${queue.length} left</span></div><button class="head" data-queue="${index}" aria-pressed="${selected === index}" aria-label="Queue ${letter(index)} head: ${queue.length ? animals[queue[0]].name : 'empty'}" ${!playing || !queue.length ? 'disabled' : ''}>${queue.length ? `<span class="head-label">Front</span>${face(queue[0])}<span class="animal-name">${animals[queue[0]].name}</span>` : '<span class="empty-head">All aboard ✓</span>'}</button><p class="preview-label">Next 1 → 2 → 3</p><div class="previews">${[1, 2, 3].map(position => `<span class="preview ${queue[position] ? '' : 'empty'}" role="img" aria-label="${queue[position] ? `Upcoming ${position}: ${animals[queue[position]].name}` : 'No more animals'}">${queue[position] ? face(queue[position]) : '·'}</span>`).join('')}</div></div>`).join('');
    $('cars').innerHTML = state.cars.map((car, index) => {
      const mixed = new Set(car).size > 1;
      const boardable = playing && selected !== null && car.length < 3;
      const hint = mixed ? 'Mixed · cannot depart' : car.length ? `Needs ${3 - car.length} more` : 'Empty carriage';
      return `<button class="car ${boardable ? 'boardable' : ''} ${mixed ? 'mixed' : ''} ${car.length === 3 ? 'full' : ''}" data-car="${index}" aria-label="Carriage ${index + 1}, ${car.length} of 3 seats, ${car.map(animal => animals[animal].name).join(', ') || 'empty'}${mixed ? ', mixed group cannot depart' : ''}" ${boardable ? '' : 'disabled'}><span class="car-title"><span>Car ${index + 1}</span><span>${car.length} / 3</span></span><span class="seats">${[0, 1, 2].map(seat => `<span class="seat ${car[seat] ? '' : 'free'}">${car[seat] ? face(car[seat]) : '<span aria-hidden="true">+</span>'}</span>`).join('')}</span><span class="car-hint">${hint}</span></button>`;
    }).join('');
    const prompt = selected === null ? 'Choose an animal, then a carriage.' : `${animals[state.queues[selected][0]].name} selected from queue ${letter(selected)}. Choose a carriage.`;
    $('instruction').textContent = message || (playing ? prompt : state.status === 'won' ? 'Every animal is safely home.' : 'Try a different boarding order.');
    $('undo').disabled = !game.canUndo;
    $('result').hidden = playing;
    $('result').className = `result ${state.status}`;
    if (!playing) $('result').innerHTML = state.status === 'won' ? `<h3>Rescue complete!</h3><p>${total} animals rescued. You are still on level ${level.tier}; replay here or choose a difficulty from the menu.</p>` : `<h3>Station blocked</h3><p>${state.queues.some(queue => queue.length) ? 'Every carriage is full.' : 'No passengers remain in the queues.'} The rescue targets are not complete. Undo a move or retry this puzzle.</p>`;
    $('replay').hidden = state.status !== 'won';
  }
  $('levels').addEventListener('click', event => {
    const button = event.target.closest('[data-level]');
    if (button) { menuIndex = Number(button.dataset.level); renderMenu(); }
  });
  $('start').addEventListener('click', () => load(menuIndex));
  $('continue').addEventListener('click', () => { selected = null; showPlay(); });
  $('menu').addEventListener('click', () => {
    persist(); menuIndex = levelIndex; selected = null; renderMenu();
    $('play-screen').hidden = true; $('menu-screen').hidden = false;
    document.body.dataset.screen = 'menu';
    $('continue').focus(); window.scrollTo(0, 0);
  });
  $('queues').addEventListener('click', event => {
    const button = event.target.closest('[data-queue]');
    if (!button || button.disabled) return;
    const index = Number(button.dataset.queue);
    selected = selected === index ? null : index;
    render();
    document.querySelector(`[data-queue="${index}"]`)?.focus({ preventScroll: true });
  });
  $('cars').addEventListener('click', event => {
    const button = event.target.closest('[data-car]');
    if (!button || button.disabled || selected === null) return;
    const queue = selected, carIndex = Number(button.dataset.car);
    if (!game.move(queue, carIndex)) return;
    actions.push([queue, carIndex]); selected = null; persist();
    const departure = game.state.departure;
    render(departure ? `${animals[departure.animal].name} carriage departed! Three rescued; an empty carriage is ready.` : undefined);
    if (departure) {
      const car = document.querySelector(`[data-car="${departure.car}"]`);
      const ghost = document.createElement('span');
      ghost.className = 'departure-ghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.textContent = '+3 rescued →';
      car.classList.add('departing'); car.append(ghost);
      ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
    }
    if (event.detail === 0) (document.querySelector('.head:not(:disabled)') || $('undo')).focus({ preventScroll: true });
  });
  $('undo').addEventListener('click', () => {
    if (game.undo()) { actions.pop(); selected = null; persist(); render('Last move undone. Choose a queue head.'); }
  });
  $('restart').addEventListener('click', () => load(levelIndex));
  $('replay').addEventListener('click', () => load(levelIndex));
  $('help-content').innerHTML = `${document.querySelector('.rules').outerHTML}<p class="warning">${document.querySelector('.warning').textContent}</p>`;
  $('help').addEventListener('click', () => $('help-dialog').showModal());
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  renderMenu();
  render();
})();
