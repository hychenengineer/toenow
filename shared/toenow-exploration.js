(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./toenow-island.js').LOCATIONS, require('./toenow-security.js').GAME_PLAUSIBILITY_PROFILES);
  else root.ToenowExploration = factory(root.ToenowIsland.LOCATIONS, root.ToenowSecurity?.GAME_PLAUSIBILITY_PROFILES);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (locations, profiles) {
  'use strict';
  const STORAGE_KEY = 'toenow_exploration_v1';
  function create({ storage, levels, gameIds, ownerId = `${Date.now()}-${Math.random()}` }) {
    const ids = [...new Set(gameIds)];
    const first = ids.includes('number-pop') ? 'number-pop' : ids[0];
    const route = [first];
    const remaining = locations.filter(place => ids.includes(place.gameId) && ![first, 'animal-rescue-train'].includes(place.gameId));
    while (remaining.length) {
      const prior = locations.find(place => place.gameId === route[route.length - 1]);
      remaining.sort((a, b) => Math.hypot(a.x - prior.x, a.y - prior.y) - Math.hypot(b.x - prior.x, b.y - prior.y) || a.gameId.localeCompare(b.gameId));
      route.push(remaining.shift().gameId);
    }
    if (ids.includes('animal-rescue-train')) route.push('animal-rescue-train');
    for (const id of ids) if (!route.includes(id)) route.push(id);
    const read = key => { try { return storage?.getItem(key); } catch (_) { return null; } };
    const parse = key => { try { return JSON.parse(read(key)); } catch (_) { return null; } };
    const number = value => (typeof value === 'string' && value.trim() !== '') || typeof value === 'number' ? Number(value) : NaN;
    const validWave = value => Number.isSafeInteger(number(value)) && number(value) >= 1;
    const records = () => {
      const value = parse('toenow_game_scores');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    };
    function hasHistory() {
      const all = records();
      return ids.some(id => {
        const entry = all[id], keys = levels.GAME_STORAGE_KEYS[id];
        return (entry && typeof entry === 'object' &&
          (Number.isFinite(entry.lastScore) && entry.lastScore >= 0 || number(entry.bestScore) > 0 || validWave(entry.maxWave))) ||
          number(read(keys?.score)) > 0 || number(read(keys?.wave)) > 1;
      });
    }
    function valid(value) {
      return [1, 2].includes(value?.version) && ['legacy', 'explore'].includes(value.mode) &&
        Array.isArray(value.order) && value.order.length === ids.length && new Set(value.order).size === ids.length &&
        value.order.every(id => ids.includes(id)) && value.order[0] === (ids.includes('number-pop') ? 'number-pop' : ids[0]) &&
        Array.isArray(value.completed) && value.completed.every(id => ids.includes(id)) &&
        (value.activeRuns === undefined || value.activeRuns && typeof value.activeRuns === 'object' && !Array.isArray(value.activeRuns) &&
          Object.values(value.activeRuns).every(run => typeof run === 'string' ? ids.includes(run) : run && ids.includes(run.gameId) && typeof run.ownerId === 'string' && Number.isFinite(run.startedAt)));
    }
    let volatile = false;
    let state = parse(STORAGE_KEY);
    if (!valid(state)) {
      const legacy = hasHistory();
      state = { version: 2, mode: legacy ? 'legacy' : 'explore', order: [...route], opened: [first], completed: [], welcomed: legacy, pending: null, createdAt: Date.now() };
      persist();
    } else migrate();
    function migrate() {
      if (state.version === 2 && state.order.join('|') === route.join('|') && Array.isArray(state.opened) &&
        state.opened.includes(first) && state.opened.every(id => ids.includes(id)) && new Set(state.opened).size === state.opened.length) return;
      const priorOpen = Array.isArray(state.opened) ? state.opened : state.order.slice(0, Math.min(ids.length, new Set(state.completed).size + 1));
      state.opened = [...new Set([first, ...priorOpen.filter(id => ids.includes(id))])];
      // Version 1 could quarantine a legitimate normal save when the iframe
      // closed before GAME_OVER arrived. Credit only previously open places,
      // and retain the existing score-per-wave bound for impossible records.
      if (state.version === 1 && state.mode === 'explore') {
        const all = records();
        for (const id of priorOpen) {
          const keys = levels.GAME_STORAGE_KEYS[id];
          const wave = Math.max(...[all[id]?.maxWave, read(keys?.wave)].filter(validWave).map(number), 1);
          const score = Math.max(Number(all[id]?.bestScore) || 0, Number(read(keys?.score)) || 0);
          const cap = profiles?.[id]?.maxPtsPerWave;
          const bonus = wave > 10 ? 1 + (wave - 10) * .15 : 1;
          if (wave < levels.LEVELS[1].startWave || !cap || !Number.isFinite(score) || score > wave * cap * bonus || state.completed.includes(id)) continue;
          state.completed.push(id);
          const next = route.find(candidate => !state.opened.includes(candidate));
          if (next) { state.opened.push(next); state.pending = next; }
        }
      }
      state.order = [...route]; state.version = 2; persist();
    }
    function persist() { try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { volatile = true; } }
    function reload() {
      // If reads still work but quota/privacy blocks writes, an older saved blob
      // must not roll back the current session's guest choice or discoveries.
      if (volatile) return;
      const saved = parse(STORAGE_KEY);
      if (valid(saved)) { state = saved; migrate(); }
      state.completed = [...new Set(state.completed)].filter(id => state.opened.includes(id));
      if (!state.opened.includes(state.pending)) state.pending = null;
    }
    const unlocked = () => state.mode === 'legacy' ? [...state.order] : state.order.filter(id => state.opened.includes(id));
    const api = {
      snapshot() { reload(); return { ...state, order: [...state.order], opened: [...state.opened], completed: [...state.completed], unlocked: unlocked() }; },
      isUnlocked(id) { reload(); return unlocked().includes(id); },
      beginRun(gameId) {
        reload();
        if (state.mode === 'legacy' || !unlocked().includes(gameId)) return null;
        const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        if (!state.activeRuns || typeof state.activeRuns !== 'object') state.activeRuns = {};
        state.activeRuns[runId] = { gameId, ownerId, startedAt: Date.now() };
        persist(); return runId;
      },
      complete({ gameId, wave, isPractice = false, completedLevel }) {
        reload();
        if (!isPractice && unlocked().includes(gameId) && Number.isSafeInteger(wave) && wave >= 1) {
          if (!state.verifiedWaves || typeof state.verifiedWaves !== 'object') state.verifiedWaves = {};
          state.verifiedWaves[gameId] = Math.max(state.verifiedWaves[gameId] || 1, wave);
          persist();
        }
        const cleared = Number.isSafeInteger(completedLevel) && completedLevel >= 1 && completedLevel <= 5;
        if (state.mode === 'legacy' || isPractice || !Number.isSafeInteger(wave) || (!cleared && wave < levels.LEVELS[1].startWave) ||
          !unlocked().includes(gameId) || state.completed.includes(gameId)) return null;
        state.completed.push(gameId);
        const next = state.order.find(id => !state.opened.includes(id)) || null;
        if (next) { state.opened.push(next); state.pending = next; }
        persist(); return next;
      },
      reject({ gameId, wave, runId }) {
        reload();
        if (!ids.includes(gameId) || !Number.isSafeInteger(wave) || wave < 1) return;
        if (!state.rejectedWaves || typeof state.rejectedWaves !== 'object') state.rejectedWaves = {};
        state.rejectedWaves[gameId] = Math.max(Number(state.rejectedWaves[gameId]) || 0, wave);
        persist();
      },
      endRun(runId) {
        reload();
        const active = state.activeRuns?.[runId];
        const gameId = typeof active === 'string' ? active : active?.gameId;
        if (!gameId) return;
        const keys = levels.GAME_STORAGE_KEYS[gameId];
        const wave = Math.max(...[records()[gameId]?.maxWave, read(keys?.wave)].filter(validWave).map(number), 1);
        if (wave > (state.verifiedWaves?.[gameId] || 1)) {
          if (!state.rejectedWaves || typeof state.rejectedWaves !== 'object') state.rejectedWaves = {};
          state.rejectedWaves[gameId] = Math.max(state.rejectedWaves[gameId] || 0, wave);
        }
        delete state.activeRuns[runId]; persist();
      },
      suspendRun(runId) {
        reload();
        const active = state.activeRuns?.[runId];
        if (active && typeof active === 'object') { active.closedAt = Date.now(); persist(); }
      },
      reconcile() {
        reload();
        recoverRuns(false);
        const all = records(), added = [];
        const savedMilestones = parse('toenow_game_milestones_v1');
        for (const id of unlocked()) {
          const completedLevel = savedMilestones?.[id];
          if (Number.isSafeInteger(completedLevel) && completedLevel >= 1 && completedLevel <= 5) {
            const next = api.complete({ gameId: id, wave: levels.LEVELS[1].startWave, completedLevel });
            if (next) added.push(next);
            continue;
          }
          // Iframe games save before reporting. Other Hub tabs must wait for
          // the accepted/rejected outcome, rather than trust an in-flight write.
          if (Object.values(state.activeRuns || {}).some(run => (typeof run === 'string' ? run : run?.gameId) === id)) continue;
          const keys = levels.GAME_STORAGE_KEYS[id];
          const wave = Math.max(...[all[id]?.maxWave, read(keys?.wave)].filter(validWave).map(number), 1);
          if (wave <= (state.rejectedWaves?.[id] || 0)) continue;
          const next = api.complete({ gameId: id, wave });
          if (next) added.push(next);
        }
        return added;
      },
      chooseGuest() { reload(); state.welcomed = true; persist(); },
      dismissDiscovery() { reload(); state.pending = null; persist(); },
      adoptLegacy() { reload(); state.mode = 'legacy'; state.welcomed = true; state.pending = null; persist(); }
    };
    function recoverRuns(owned) {
      for (const [runId, run] of Object.entries(state.activeRuns || {})) {
        if (typeof run === 'string' || (owned && run.ownerId === ownerId) ||
          (run.closedAt && Date.now() - run.closedAt >= 2000) || Date.now() - run.startedAt > 12 * 60 * 60 * 1000) api.endRun(runId);
      }
    }
    // sessionStorage ownership survives reload, while other live tabs keep their
    // guard. Closed/crashed tabs also have bounded recovery on the next refresh.
    recoverRuns(true);
    return api;
  }
  return { STORAGE_KEY, create };
});
