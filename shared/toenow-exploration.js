(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./toenow-island.js').LOCATIONS, require('./toenow-security.js').GAME_PLAUSIBILITY_PROFILES);
  else root.ToenowExploration = factory(root.ToenowIsland.LOCATIONS, root.ToenowSecurity?.GAME_PLAUSIBILITY_PROFILES);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (locations, profiles) {
  'use strict';
  const STORAGE_KEY = 'toenow_exploration_v3';
  const LEGACY_STORAGE_KEY = 'toenow_exploration_v1';
  function create({ storage, levels, gameIds, ownerId = `${Date.now()}-${Math.random()}` }) {
    // Carefree games are always available and do not extend the Explorers route.
    const ids = [...new Set(gameIds)].filter(id => levels.GAME_STORAGE_KEYS[id]?.island !== 'carefree');
    const first = ids.includes('number-pop') ? 'number-pop' : ids[0];
    const route = [first];
    // Keep the established route independent of visual landmark placement.
    for (const id of ['number-pop', 'space-scale', 'add-up', 'flash-brain', 'ball-track', 'tap-match', 'block-match', 'spot-quick', 'shadow-match', 'animal-rescue-train']) {
      if (ids.includes(id) && !route.includes(id)) route.push(id);
    }
    for (const id of ids) if (!route.includes(id)) route.push(id);
    const read = key => { try { return storage?.getItem(key); } catch (_) { return null; } };
    const parse = key => { try { return JSON.parse(read(key)); } catch (_) { return null; } };
    const number = value => (typeof value === 'string' && value.trim() !== '') || typeof value === 'number' ? Number(value) : NaN;
    const validWave = value => Number.isSafeInteger(number(value)) && number(value) >= 1;
    const records = () => {
      const value = parse('toenow_game_scores');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    };
    const legacyGuards = () => {
      const saved = parse(LEGACY_STORAGE_KEY);
      return valid(saved) && saved.version < 3 ? saved : {};
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
      return [1, 2, 3].includes(value?.version) && ['legacy', 'explore'].includes(value.mode) &&
        Array.isArray(value.order) && value.order.length === ids.length && new Set(value.order).size === ids.length &&
        value.order.every(id => ids.includes(id)) && value.order[0] === (ids.includes('number-pop') ? 'number-pop' : ids[0]) &&
        Array.isArray(value.completed) && value.completed.every(id => ids.includes(id)) &&
        (value.activeRuns === undefined || value.activeRuns && typeof value.activeRuns === 'object' && !Array.isArray(value.activeRuns) &&
          Object.values(value.activeRuns).every(run => typeof run === 'string' ? ids.includes(run) : run && ids.includes(run.gameId) && typeof run.ownerId === 'string' && Number.isFinite(run.startedAt)));
    }
    let volatile = false;
    // Older tabs understand only versions 1/2 and can keep writing their old
    // state. Import it once into a separate key so they cannot revert this policy.
    let state = read(STORAGE_KEY) === null ? parse(LEGACY_STORAGE_KEY) : parse(STORAGE_KEY);
    if (!valid(state)) {
      state = { version: 3, mode: 'explore', order: [...route], opened: [first], completed: [], welcomed: hasHistory(), pending: null, createdAt: Date.now() };
      migrate(true);
    } else migrate();
    function earnedOpen() {
      const gap = route.findIndex(id => !state.completed.includes(id));
      return route.slice(0, gap < 0 ? route.length : gap + 1);
    }
    function migrate(importRecords = false) {
      const priorVersion = state.version, wasLegacy = state.mode === 'legacy';
      if (priorVersion < 3) state.importedRunIds = Object.keys(state.activeRuns || {});
      const knownOpen = Array.isArray(state.opened) ? state.opened : state.order.slice(0, state.completed.length + 1);
      if (priorVersion < 3 && !wasLegacy) state.completed = state.completed.filter(id => knownOpen.includes(id));
      state.completed = [...new Set(state.completed)].filter(id => ids.includes(id));
      if (importRecords || priorVersion < 3 || wasLegacy) {
        const all = records(), milestones = parse('toenow_game_milestones_v1');
        for (const id of ids) {
          if (state.completed.includes(id)) continue;
          const milestone = milestones?.[id];
          if (Number.isSafeInteger(milestone) && milestone >= 1 && milestone <= 5) { state.completed.push(id); continue; }
          const active = Object.values(state.activeRuns || {}).some(run => (typeof run === 'string' ? run : run?.gameId) === id);
          if (active) continue;
          const keys = levels.GAME_STORAGE_KEYS[id];
          const wave = Math.max(...[all[id]?.maxWave, read(keys?.wave)].filter(validWave).map(number), 1);
          const score = Math.max(Number(all[id]?.bestScore) || 0, Number(read(keys?.score)) || 0);
          const cap = profiles?.[id]?.maxPtsPerWave;
          const bonus = wave > 10 ? 1 + (wave - 10) * .15 : 1;
          if (wave < levels.LEVELS[1].startWave || !cap || !Number.isFinite(score) || score > wave * cap * bonus) continue;
          if (priorVersion >= 2 && wave <= (state.rejectedWaves?.[id] || 0)) continue;
          state.completed.push(id);
        }
      }
      const opened = earnedOpen();
      const changed = importRecords || priorVersion !== 3 || wasLegacy || state.order.join('|') !== route.join('|') ||
        !Array.isArray(state.opened) || state.opened.join('|') !== opened.join('|');
      state.order = [...route]; state.opened = opened; state.mode = 'explore'; state.version = 3;
      if (!opened.includes(state.pending)) state.pending = null;
      if (changed) persist();
    }
    function persist() { try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { volatile = true; } }
    function reload() {
      // If reads still work but quota/privacy blocks writes, an older saved blob
      // must not roll back the current session's guest choice or discoveries.
      if (volatile) return;
      const saved = parse(STORAGE_KEY);
      if (valid(saved)) { state = saved; migrate(); }
      state.completed = [...new Set(state.completed)].filter(id => ids.includes(id));
      if (!state.opened.includes(state.pending)) state.pending = null;
    }
    const unlocked = () => state.order.filter(id => state.opened.includes(id));
    const api = {
      snapshot() { reload(); return { ...state, order: [...state.order], opened: [...state.opened], completed: [...state.completed], unlocked: unlocked() }; },
      isUnlocked(id) { reload(); return unlocked().includes(id); },
      isLeaderboardUnlocked() { reload(); return ids.length > 0 && ids.every(id => state.completed.includes(id)); },
      shouldShowLeaderboardNotice() { return api.isLeaderboardUnlocked() && !state.leaderboardNoticeSeen; },
      dismissLeaderboardNotice() {
        if (!api.isLeaderboardUnlocked()) return;
        state.leaderboardNoticeSeen = true; persist();
      },
      beginRun(gameId) {
        reload();
        if (!unlocked().includes(gameId)) return null;
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
        if (isPractice || !Number.isSafeInteger(wave) || (!cleared && wave < levels.LEVELS[1].startWave) ||
          !unlocked().includes(gameId) || state.completed.includes(gameId)) return null;
        const previous = new Set(state.opened);
        state.completed.push(gameId); state.opened = earnedOpen();
        const next = state.opened.find(id => !previous.has(id) && !state.completed.includes(id)) || null;
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
        const older = legacyGuards();
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
          if ([...Object.values(state.activeRuns || {}), ...Object.values(older.activeRuns || {})]
            .some(run => (typeof run === 'string' ? run : run?.gameId) === id)) continue;
          const keys = levels.GAME_STORAGE_KEYS[id];
          const wave = Math.max(...[all[id]?.maxWave, read(keys?.wave)].filter(validWave).map(number), 1);
          if (wave <= Math.max(state.rejectedWaves?.[id] || 0, older.rejectedWaves?.[id] || 0)) continue;
          const next = api.complete({ gameId: id, wave });
          if (next) added.push(next);
        }
        return added;
      },
      chooseGuest() { reload(); state.welcomed = true; persist(); },
      dismissDiscovery() { reload(); state.pending = null; persist(); },
      // Compatibility for older cached Hub code; never restores all-access mode.
      adoptLegacy() { reload(); api.reconcile(); }
    };
    function recoverRuns(owned) {
      const older = legacyGuards();
      for (const [runId, run] of Object.entries(state.activeRuns || {})) {
        if (state.importedRunIds?.includes(runId) && !older.activeRuns?.[runId]) {
          const gameId = typeof run === 'string' ? run : run.gameId;
          const accepted = older.verifiedWaves?.[gameId];
          if (Number.isSafeInteger(accepted) && accepted >= 1) {
            if (!state.verifiedWaves) state.verifiedWaves = {};
            state.verifiedWaves[gameId] = Math.max(state.verifiedWaves[gameId] || 1, accepted);
            persist();
            if (older.completed?.includes(gameId)) api.complete({ gameId, wave: accepted });
          }
        }
        if ((state.importedRunIds?.includes(runId) && !older.activeRuns?.[runId]) ||
          typeof run === 'string' || (owned && run.ownerId === ownerId) ||
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
