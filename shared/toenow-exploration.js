(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowExploration = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE_KEY = 'toenow_exploration_v1';
  function create({ storage, levels, gameIds, random = Math.random, ownerId = `${Date.now()}-${Math.random()}` }) {
    const ids = [...new Set(gameIds)];
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
      return value?.version === 1 && ['legacy', 'explore'].includes(value.mode) &&
        Array.isArray(value.order) && value.order.length === ids.length && new Set(value.order).size === ids.length &&
        value.order.every(id => ids.includes(id)) && value.order[0] === (ids.includes('number-pop') ? 'number-pop' : ids[0]) &&
        Array.isArray(value.completed) && value.completed.every(id => ids.includes(id)) &&
        (value.activeRuns === undefined || value.activeRuns && typeof value.activeRuns === 'object' && !Array.isArray(value.activeRuns) &&
          Object.values(value.activeRuns).every(run => typeof run === 'string' ? ids.includes(run) : run && ids.includes(run.gameId) && typeof run.ownerId === 'string' && Number.isFinite(run.startedAt)));
    }
    let volatile = false;
    let state = parse(STORAGE_KEY);
    if (!valid(state)) {
      const first = ids.includes('number-pop') ? 'number-pop' : ids[0];
      const rest = ids.filter(id => id !== first);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const legacy = hasHistory();
      state = { version: 1, mode: legacy ? 'legacy' : 'explore', order: [first, ...rest], completed: [], welcomed: legacy, pending: null, createdAt: Date.now() };
      persist();
    }
    function persist() { try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { volatile = true; } }
    function reload() {
      // If reads still work but quota/privacy blocks writes, an older saved blob
      // must not roll back the current session's guest choice or discoveries.
      if (volatile) return;
      const saved = parse(STORAGE_KEY);
      if (valid(saved)) state = saved;
      state.completed = [...new Set(state.completed)];
      if (!ids.includes(state.pending)) state.pending = null;
    }
    const unlocked = () => state.mode === 'legacy' ? [...state.order] : state.order.slice(0, Math.min(ids.length, state.completed.length + 1));
    const api = {
      snapshot() { reload(); return { ...state, order: [...state.order], completed: [...state.completed], unlocked: unlocked() }; },
      isUnlocked(id) { reload(); return unlocked().includes(id); },
      beginRun(gameId) {
        reload();
        if (state.mode === 'legacy' || !unlocked().includes(gameId)) return null;
        const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        if (!state.activeRuns || typeof state.activeRuns !== 'object') state.activeRuns = {};
        state.activeRuns[runId] = { gameId, ownerId, startedAt: Date.now() };
        persist(); return runId;
      },
      complete({ gameId, wave, isPractice = false, runId }) {
        reload();
        if (!isPractice && unlocked().includes(gameId) && Number.isSafeInteger(wave) && wave >= 1) {
          if (!state.verifiedWaves || typeof state.verifiedWaves !== 'object') state.verifiedWaves = {};
          state.verifiedWaves[gameId] = Math.max(state.verifiedWaves[gameId] || 1, wave);
          persist();
        }
        if (state.mode === 'legacy' || isPractice || !Number.isSafeInteger(wave) || wave < levels.LEVELS[1].startWave ||
          !unlocked().includes(gameId) || state.completed.includes(gameId)) return null;
        const before = unlocked().length;
        state.completed.push(gameId);
        const next = unlocked()[before] || null;
        if (next) state.pending = next;
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
        for (const id of unlocked()) {
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
