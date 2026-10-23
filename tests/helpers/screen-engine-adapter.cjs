// Engine unit tests use a minimal DOM. UI behavior is tested in the browser suite.
const screens = require('../../shared/toenow-screens.js');
exports.expand = (html, id) => id === 'animal-rescue-train' ? html : screens.expandHTML(html, id);
exports.adapter = doc => ({
  mount() {}, // Templates have already been expanded through the actual renderer.
  updateTitle() {}, // Only engine state is under test in this minimal DOM.
  updateGameOver(id, data) {
    const result = screens.normalizeResult(data);
    for (const [key, elementId] of Object.entries(screens.catalog[id].fields)) {
      const node = doc.getElementById(elementId);
      if (node) node.textContent = key === 'combo' ? result.combo == null ? '—' : 'x' + result.combo : typeof result[key] === 'number' ? result[key].toLocaleString() : result[key];
    }
    return result;
  }
});
