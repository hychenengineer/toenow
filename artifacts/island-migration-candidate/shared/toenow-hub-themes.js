(function (root) {
  'use strict';
  // Apply the preference before first paint. This key never stores game records.
  const storageKey = 'toenow_hub_theme_v1';
  const themes = ['bright', 'arena', 'calm'];
  let selected = 'bright';
  try {
    const saved = root.localStorage.getItem(storageKey);
    if (themes.includes(saved)) selected = saved;
  } catch (_) { /* Private browsing can disable storage. Switching still works. */ }
  const doc = root.document;
  doc.documentElement.dataset.hubTheme = selected;

  const copy = {
    bright: {
      eyebrow: 'A LITTLE CHALLENGE. A NEW BEST.',
      heading: 'Your next breakthrough starts with a challenge.',
      description: 'Memory, numbers, observation and logic. Pick a challenge and see how far you can go.',
      action: 'Try a memory challenge',
      section: 'What will you challenge today?',
      feature: 'Start with a little curiosity'
    },
    arena: {
      eyebrow: 'TOENOW / CHALLENGE ARENA',
      heading: 'Push your limits. Beat your own best.',
      description: 'Focus on the next level. Put your memory, reactions and judgment to the test, one challenge at a time.',
      action: 'Take the memory challenge',
      section: 'Choose your next challenge',
      feature: 'NEXT CHALLENGE / MEMORY'
    },
    calm: {
      eyebrow: 'YOUR OWN PACE',
      heading: 'A little time for a focused mind.',
      description: 'Take it at your own pace. Choose a difficulty that suits you and explore one level at a time.',
      action: 'Explore a memory challenge',
      section: 'Start with something that interests you',
      feature: 'A moment to remember'
    }
  };
  function mount() {
    const picker = doc.getElementById('hubThemeSelect');
    if (!picker) return;
    const translate = text => root.ToenowI18n?.t(text) || text;
    function render() {
      doc.documentElement.dataset.hubTheme = selected;
      picker.value = selected;
      for (const option of picker.options) option.textContent = translate(option.dataset.source);
      doc.getElementById('hubThemeLabel').textContent = translate('Theme');
      picker.setAttribute('aria-label', translate('Homepage theme'));
      for (const node of doc.querySelectorAll('[data-hub-copy]')) {
        node.textContent = translate(copy[selected][node.dataset.hubCopy]);
      }
      for (const node of doc.querySelectorAll('[data-hub-source]')) node.textContent = translate(node.dataset.hubSource);
    }
    picker.addEventListener('change', () => {
      if (!themes.includes(picker.value)) return;
      selected = picker.value;
      try { root.localStorage.setItem(storageKey, selected); } catch (_) {}
      render();
    });
    root.addEventListener('toenow:languagechange', render);
    root.addEventListener('storage', event => {
      if (event.key !== storageKey && event.key !== null) return;
      selected = themes.includes(event.newValue) ? event.newValue : 'bright';
      render();
    });
    doc.getElementById('hubChallengeStart').addEventListener('click', () => {
      // Use the Hub's existing launcher, even when another category is selected.
      doc.querySelector('#categoryTabs [data-category="all"]').click();
      doc.querySelector('[data-game-id="flash-brain"] .game-launch')?.click();
    });
    render();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})(window);
