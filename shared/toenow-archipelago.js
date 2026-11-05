(function (root) {
  'use strict';
  function mount() {
    const buttons = Array.from(root.document.querySelectorAll('[data-island-select]'));
    const panels = Array.from(root.document.querySelectorAll('[data-island-panel]'));
    const explorer = root.document.getElementById('islandExplorer');
    const list = root.document.getElementById('hubListView');
    function select(id) {
      if (!buttons.some(button => button.dataset.islandSelect === id)) return;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.islandSelect === id)));
      panels.forEach(panel => { panel.hidden = panel.dataset.islandPanel !== id; });
      explorer.hidden = id !== 'explore';
      // Exploration owns its map/list mode; its list is never used on the other islands.
      if (list) list.hidden = true;
    }
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.islandSelect)));
    select('explore');
    return {
      select,
      selectGame(game) {
        select(game.island === 'expedition' ? 'expedition' : game.category === 'relax' ? 'carefree' : 'explore');
      }
    };
  }
  root.ToenowArchipelago = { mount };
})(globalThis);
