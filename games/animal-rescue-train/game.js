(() => {
  'use strict';
  const animals = {
    cat: { name: '貓咪', color: '#edbf88', ears: '<path d="M13 29 9 7 29 19M35 19 55 7 51 29" fill="#edbf88" stroke="#573e39" stroke-width="2"/><path d="m13 13 3 12 9-6m14 0 9 6 3-12" fill="#db8c88"/>', detail: '<path d="m12 39-9-3m10 9-10 2m48-8 10-3m-11 9 10 2" stroke="#573e39" stroke-width="2"/>' },
    dog: { name: '小狗', color: '#c79772', ears: '<path d="M20 18C4 9 0 25 7 43l14-9m22-16C60 9 64 25 57 43L43 34" fill="#77584b" stroke="#493832" stroke-width="2"/>', detail: '<ellipse cx="23" cy="31" rx="7" ry="10" fill="#9d6b4f"/><path d="M29 45q3 11 7 0" fill="#e6a5a6"/>' },
    rabbit: { name: '兔兔', color: '#e6dceb', ears: '<ellipse cx="23" cy="16" rx="7" ry="15" fill="#e6dceb"/><ellipse cx="41" cy="16" rx="7" ry="15" fill="#e6dceb"/><ellipse cx="23" cy="15" rx="3" ry="10" fill="#d9a6b9"/><ellipse cx="41" cy="15" rx="3" ry="10" fill="#d9a6b9"/>', detail: '<path d="M30 46h4v5h-4z" fill="#fff"/>' },
    fox: { name: '狐狸', color: '#e18d5b', ears: '<path d="M12 31 9 5 30 19M34 19 55 5 52 31" fill="#e18d5b" stroke="#704437" stroke-width="2"/><path d="m14 14 3 13 10-6m10 0 10 6 3-13" fill="#5b4948"/>', detail: '<path d="M10 34Q11 54 32 57 53 54 54 34L32 43Z" fill="#fff0d8"/>' },
    panda: { name: '熊貓', color: '#e6ede5', ears: '<circle cx="15" cy="18" r="10" fill="#384551"/><circle cx="49" cy="18" r="10" fill="#384551"/>', detail: '<ellipse cx="22" cy="34" rx="9" ry="11" fill="#384551" transform="rotate(20 22 34)"/><ellipse cx="42" cy="34" rx="9" ry="11" fill="#384551" transform="rotate(-20 42 34)"/>' }
  };
  function face(animal) {
    const a = animals[animal];
    return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${a.ears}<ellipse cx="32" cy="36" rx="23" ry="22" fill="${a.color}"/>${a.detail}<circle cx="23" cy="34" r="2.5" fill="${animal === 'panda' ? '#fff' : '#29323b'}"/><circle cx="41" cy="34" r="2.5" fill="${animal === 'panda' ? '#fff' : '#29323b'}"/><path d="m29 42 3 3 3-3z" fill="#573e46"/><path d="M32 45v3m-5-1q5 5 10 0" fill="none" stroke="#573e46" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  const $ = id => document.getElementById(id);
  const levels = RescueLevels;
  let levelIndex = 0;
  let game = new RescueTrain.Game(levels[0]);
  let selected = null;
  const completed = new Set();

  function load(index) {
    levelIndex = index;
    game = new RescueTrain.Game(levels[index]);
    selected = null;
    render();
  }
  function render(message) {
    const focusKey = document.activeElement?.dataset.focus;
    const state = game.state;
    const level = levels[levelIndex];
    const playing = state.status === 'playing';
    $('levels').innerHTML = levels.map((item, index) => `<button class="level ${index === levelIndex ? 'active' : ''}" data-level="${index}" data-focus="level-${index}" ${index === levelIndex ? 'aria-current="step"' : ''} aria-label="第 ${index + 1} 關：${item.name}${completed.has(index) ? '，已完成' : ''}"><span class="number">${index + 1}</span><span class="level-title">${item.name}<small>${item.queues.flat().length} 隻旅客 · ${Object.keys(item.goals).length} 種動物</small></span>${completed.has(index) ? '<span class="check" aria-hidden="true">✓</span>' : ''}</button>`).join('');
    $('level-number').textContent = `STATION 0${levelIndex + 1} / 05`;
    $('level-name').textContent = level.name;
    $('level-subtitle').textContent = level.subtitle;
    $('level-tip').textContent = level.tip;
    $('moves').textContent = state.moves;
    const rescuedTotal = Object.values(state.rescued).reduce((sum, count) => sum + count, 0);
    $('total').textContent = `${rescuedTotal} / ${Object.values(level.goals).reduce((sum, count) => sum + count, 0)} 隻已救援`;
    $('goals').innerHTML = Object.entries(level.goals).map(([animal, count]) => {
      const saved = state.rescued[animal] || 0;
      return `<div class="goal ${saved >= count ? 'done' : ''}" aria-label="${animals[animal].name}：已救援 ${saved} 隻，目標 ${count} 隻">${face(animal)}<span class="label">${animals[animal].name}</span><strong>${saved} / ${count}</strong>${saved >= count ? '<span aria-hidden="true">✓</span>' : ''}</div>`;
    }).join('');
    $('queues').innerHTML = state.queues.map((queue, index) => `<div class="queue"><div class="queue-header"><strong>隊伍 ${'ABC'[index]}</strong><span>${queue.length} 隻</span></div><button class="head" data-queue="${index}" data-focus="queue-${index}" aria-pressed="${selected === index}" aria-label="隊伍 ${'ABC'[index]} 隊首：${queue.length ? animals[queue[0]].name : '已清空'}" ${!queue.length || !playing ? 'disabled' : ''}>${queue.length ? `<span class="head-label">隊首</span>${face(queue[0])}<span class="animal-name">${animals[queue[0]].name}</span>` : '<span class="empty-head">全員進站 ✓</span>'}</button><p class="preview-label">接下來 1 → 2 → 3</p><div class="previews">${[1, 2, 3].map(position => `<span class="preview ${queue[position] ? '' : 'empty'}" role="img" aria-label="${queue[position] ? `後方第 ${position} 隻：${animals[queue[position]].name}` : '沒有更多旅客'}">${queue[position] ? face(queue[position]) : '·'}</span>`).join('')}</div></div>`).join('');
    $('cars').innerHTML = state.cars.map((car, index) => {
      const mixed = new Set(car).size > 1;
      const boardable = selected !== null && car.length < 3 && playing;
      const hint = mixed ? '混乘 · 不會出發' : car.length ? `再接 ${3 - car.length} 隻${animals[car[0]].name}` : '空車廂 · 歡迎上車';
      return `<button class="car ${boardable ? 'boardable' : ''} ${mixed ? 'mixed' : ''} ${car.length === 3 ? 'full' : ''}" data-car="${index}" data-focus="car-${index}" aria-label="車廂 ${index + 1}，${car.length} / 3 席，${car.map(a => animals[a].name).join('、') || '空車廂'}${mixed ? '，混乘不會出發' : ''}" ${!boardable ? 'disabled' : ''}><span class="car-title"><span>車廂 0${index + 1}</span><span>${car.length} / 3</span></span><span class="seats">${[0, 1, 2].map(seat => `<span class="seat ${car[seat] ? '' : 'free'}">${car[seat] ? face(car[seat]) : '<span aria-hidden="true">+</span>'}</span>`).join('')}</span><span class="car-hint">${hint}</span></button>`;
    }).join('');
    const instruction = selected === null ? '先點選一隻隊首，再點車廂上車。' : `已選隊伍 ${'ABC'[selected]} 的${animals[state.queues[selected][0]].name}，請點選有空位的車廂。`;
    $('instruction').textContent = message || (playing ? instruction : state.status === 'won' ? '全體旅客，平安抵達。謝謝你的安排！' : '月台暫停接客，可以撤銷一步或重新開始。');
    $('undo').disabled = !game.canUndo;
    $('result').hidden = playing;
    $('result').className = `result ${state.status}`;
    if (!playing) {
      const won = state.status === 'won';
      $('result').innerHTML = `<h3>${won ? (levelIndex === 4 ? '五站完成，救援成功！' : '本站救援成功！') : '車站卡住了'}</h3><p>${won ? `救援 ${rescuedTotal} 隻動物，共走了 ${state.moves} 步。${levelIndex === 4 ? '所有關卡都已挑戰完成，歡迎再走一次路線。' : '下一站還有旅客在等你。'}` : (state.queues.some(q => q.length) ? '車廂已滿，沒有合法的上車位置。混乘車廂不會出發，試著保留空位。' : '隊伍已清空，但救援目標尚未完成。') + ' 撤銷最後一步，或重新安排這一站。'}</p>`;
      // Finishing the last station directly is allowed; do not claim all five are completed.
      if (won && levelIndex === 4 && completed.size < 5) $('result').innerHTML = '<h3>本站救援成功！</h3><p>星夜大救援完成了！你也可以從救援路線選擇其他關卡。</p>';
    }
    $('next').hidden = state.status !== 'won' || levelIndex === 4;
    $('replay').hidden = state.status !== 'won' || levelIndex !== 4;
    if (focusKey) document.querySelector(`[data-focus="${focusKey}"]:not(:disabled)`)?.focus({ preventScroll: true });
  }

  $('levels').addEventListener('click', event => {
    const button = event.target.closest('[data-level]');
    if (button) load(Number(button.dataset.level));
  });
  $('queues').addEventListener('click', event => {
    const button = event.target.closest('[data-queue]');
    if (!button || button.disabled) return;
    const index = Number(button.dataset.queue);
    selected = selected === index ? null : index;
    render();
  });
  $('cars').addEventListener('click', event => {
    const button = event.target.closest('[data-car]');
    if (!button || button.disabled || selected === null) return;
    if (!game.move(selected, Number(button.dataset.car))) return;
    selected = null;
    if (game.state.status === 'won') completed.add(levelIndex);
    const departure = game.state.departure;
    render(departure ? `${animals[departure.animal].name}列車出發！救援 +3 隻，空車廂已補上。` : undefined);
    if (departure) {
      const car = document.querySelector(`[data-car="${departure.car}"]`);
      car.classList.add('departing');
      const ghost = document.createElement('span');
      ghost.className = 'departure-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.textContent = `${animals[departure.animal].name} +3 →`;
      car.append(ghost);
      ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
    }
  });
  $('undo').addEventListener('click', () => {
    if (game.undo()) { selected = null; render('已撤銷最後一步，請重新選擇隊首。'); }
  });
  $('restart').addEventListener('click', () => load(levelIndex));
  $('next').addEventListener('click', () => { if (levelIndex < levels.length - 1) load(levelIndex + 1); });
  $('replay').addEventListener('click', () => load(0));
  render();
})();
