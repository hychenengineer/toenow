(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ToenowIslandStory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const STORAGE_KEY = 'toenow_island_story_v1';
  const copy = {
    guide: 'Rabbit, your island guide', skip: 'Skip story', next: 'Next', back: 'Back',
    choose: 'Choose an island', language: 'Language', guest: 'You can start playing without an account.'
  };
  const chapters = [
    {
      title: 'A new friend arrives',
      text: 'As your little boat reaches the shore, Rabbit is waiting at the dock.',
      speech: 'You made it! Welcome to TOENOW. Come, let me show you our islands.'
    },
    {
      title: 'Little adventures, your own pace',
      text: 'Some friends love a challenge and building their homes. Others grow crops, soak in warm springs, or set off into the mist.',
      speech: 'There is always something to discover. What would you like to do today?'
    },
    {
      title: 'Where shall we go first?',
      text: 'You can change islands any time. Start with whatever feels right today.'
    }
  ];
  const destinations = [
    { id: 'explore', name: 'Explore Island', image: 'assets/toenow-island-terrain.png',
      text: 'Play thinking games, collect materials, and help animal homes grow. New places open as you explore.', action: "Visit Rabbit's home" },
    { id: 'carefree', name: 'Carefree Island', image: 'assets/island-maps/carefree.webp',
      text: 'Grow crops at the farm or unwind in the capybara hot spring. Take your time.', action: 'Visit the hot spring and farm' },
    { id: 'expedition', name: 'Expedition Island', image: 'assets/island-maps/expedition.webp',
      text: 'Recruit animal friends at camp, explore the mist, and challenge enemy forts.', action: 'Visit the animal camp' }
  ];

  function createProgress(storage) {
    let sessionStatus = null;
    const finished = status => status === 'completed' || status === 'skipped';
    return {
      shouldShow(returning = false) {
        if (returning || finished(sessionStatus)) return false;
        try { return !finished(storage?.getItem(STORAGE_KEY)); } catch (_) { return true; }
      },
      finish(status = 'completed') {
        if (!finished(status)) return false;
        sessionStatus = status;
        try { storage?.setItem(STORAGE_KEY, status); } catch (_) { /* Keep this visit usable without storage. */ }
        return true;
      }
    };
  }

  function mount({ host, storage, onChoose, onSkip, onAccount }) {
    const doc = host.ownerDocument;
    const progress = createProgress(storage);
    let step = 0, returnFocus = null;
    const t = value => root.ToenowI18n?.t(value) || value;
    const e = value => String(t(value)).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    host.classList.remove('island-welcome');
    host.classList.add('island-story');
    host.setAttribute('data-i18n-ignore', '');
    host.setAttribute('aria-labelledby', 'welcomeHeading');
    host.setAttribute('aria-describedby', 'welcomeDescription');

    function render(focusHeading = false) {
      const focusedId = host.contains(doc.activeElement) ? doc.activeElement.id : null;
      const chapter = chapters[step];
      host.dataset.storyStep = String(step);
      host.innerHTML = `
        <div class="story-topbar">
          <span class="story-wordmark">${e('TOENOW Archipelago')}</span>
          <label class="story-language"><span class="story-sr-only">${e(copy.language)}</span>
            <select id="islandStoryLanguage" aria-label="${e(copy.language)}"><option value="en">English</option><option value="zh-Hant">繁體中文</option></select>
          </label>
        </div>
        <div class="story-reading ${step === 2 ? 'story-reading-choices' : ''}">
          ${step < 2 ? `<div class="story-cover" aria-hidden="true">
            <img class="story-landscape" src="assets/toenow-island-terrain.png" alt="">
            <div class="story-shore"></div>
            <img class="story-rabbit" src="assets/animal-island/rabbit-character.webp" alt="">
          </div>` : ''}
          <div class="story-copy">
            <p class="story-speaker">${e(copy.guide)}</p>
            <h1 id="welcomeHeading" tabindex="-1">${e(chapter.title)}</h1>
            <p id="welcomeDescription" class="story-description">${e(chapter.text)}</p>
            ${chapter.speech ? `<p class="story-speech">${e(chapter.speech)}</p>` : ''}
          </div>
          ${step === 2 ? `<div class="story-destinations">${destinations.map(destination => `
            <button type="button" class="story-destination" data-story-island="${destination.id}">
              <img src="${destination.image}" alt="">
              <span class="story-destination-copy"><strong>${e(destination.name)}</strong><span>${e(destination.text)}</span><b>${e(destination.action)} <span aria-hidden="true">→</span></b></span>
            </button>`).join('')}</div>` : ''}
        </div>
        <div class="story-footer">
          <div class="story-navigation">
            <button type="button" id="welcomeGuestBtn" class="story-skip">${e(copy.skip)}</button>
            <span class="story-progress" aria-label="${step + 1} / ${chapters.length}">${chapters.map((_, index) => `<i class="${index === step ? 'is-current' : ''}" aria-hidden="true"></i>`).join('')}<span>${step + 1} / ${chapters.length}</span></span>
            <div class="story-page-actions"><button type="button" id="islandStoryBack" class="story-back" ${step === 0 ? 'hidden' : ''}>${e(copy.back)}</button>
            <button type="button" id="islandStoryNext" class="story-next" ${step === 2 ? 'hidden' : ''}>${e(step === 1 ? copy.choose : copy.next)} <span aria-hidden="true">→</span></button></div>
          </div>
          <div class="story-account"><p>${e(copy.guest)}</p><div><button type="button" id="welcomeSigninBtn">${e('Sign In')}</button><span aria-hidden="true">·</span><button type="button" id="welcomeRegisterBtn">${e('Create account')}</button></div><small id="welcomeGuestNote">${e('Guest progress is saved in this browser.')}</small></div>
        </div>`;
      host.querySelector('#islandStoryLanguage').value = root.ToenowI18n?.language || 'en';
      if (host.open) {
        if (focusHeading) {
          host.scrollTop = 0;
          host.querySelector('#welcomeHeading').focus({ preventScroll: true });
        } else if (focusedId) {
          doc.getElementById(focusedId)?.focus({ preventScroll: true });
        }
      }
    }

    function close(restoreFocus = false) {
      host.close();
      if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }
    function skip() {
      if (!host.open) return;
      progress.finish('skipped');
      close(true);
      onSkip?.();
    }
    host.addEventListener('click', event => {
      const target = event.target.closest('button');
      if (!target || !host.contains(target) || !host.open) return;
      if (target.id === 'welcomeGuestBtn') { skip(); return; }
      if (target.id === 'islandStoryNext' && step < chapters.length - 1) { step++; render(true); return; }
      if (target.id === 'islandStoryBack' && step > 0) { step--; render(true); return; }
      if (target.id === 'welcomeSigninBtn' || target.id === 'welcomeRegisterBtn') {
        close(); onAccount?.(target.id === 'welcomeSigninBtn' ? 'signin' : 'register'); return;
      }
      const island = target.dataset.storyIsland;
      if (step === 2 && destinations.some(destination => destination.id === island)) {
        progress.finish('completed'); close(); onChoose?.(island);
      }
    });
    host.addEventListener('cancel', event => { event.preventDefault(); skip(); });
    host.addEventListener('change', event => {
      if (event.target.id === 'islandStoryLanguage') root.ToenowI18n?.setLanguage(event.target.value);
    });
    root.addEventListener('toenow:languagechange', () => render());
    render();
    return {
      shouldShow: returning => progress.shouldShow(returning),
      isOpen: () => host.open,
      show({ resume = false } = {}) {
        if (!resume) { step = 0; returnFocus = doc.activeElement; }
        render();
        if (!host.open) host.showModal();
        host.scrollTop = 0;
        host.querySelector('#welcomeHeading').focus({ preventScroll: true });
      }
    };
  }
  return { STORAGE_KEY, copy, chapters, destinations, createProgress, mount };
});
