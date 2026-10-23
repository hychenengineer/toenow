(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ToenowGamePreviews = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  function createPlaybackController(options = {}) {
    const later = options.setTimeout || root.setTimeout.bind(root);
    const cancel = options.clearTimeout || root.clearTimeout.bind(root);
    let timer = null, current = null, revision = 0;
    function stop() {
      revision++;
      if (timer !== null) cancel(timer);
      timer = null;
      if (current) {
        current.video.pause();
        try { current.video.currentTime = 0; } catch (_) { /* No loaded metadata yet. */ }
        current.host.classList.remove('preview-playing');
        current = null;
      }
    }
    function request(video, host, delay = 400) {
      stop();
      const ticket = revision;
      current = { video, host };
      timer = later(async () => {
        timer = null;
        if (ticket !== revision) return;
        if (!video.src) video.src = video.dataset.src;
        try {
          await video.play();
          if (ticket === revision) host.classList.add('preview-playing');
          else if (current?.video !== video) video.pause();
        } catch (error) {
          if (ticket === revision) { stop(); options.onError?.(error); }
        }
      }, delay);
    }
    return { request, stop, isCurrent: video => current?.video === video };
  }
  function mount(grid) {
    const doc = grid.ownerDocument;
    const listeners = [];
    const listen = (target, event, fn) => { target.addEventListener(event, fn); listeners.push(() => target.removeEventListener(event, fn)); };
    const dialog = doc.createElement('dialog');
    dialog.className = 'game-preview-dialog';
    dialog.setAttribute('aria-labelledby', 'gamePreviewTitle');
    dialog.innerHTML = '<div class="game-preview-dialog-header"><h2 id="gamePreviewTitle"></h2><button type="button" class="game-preview-close" aria-label="Close preview">✕</button></div><video muted playsinline loop controls preload="none"></video><p class="game-preview-status" role="status"></p>';
    doc.body.appendChild(dialog);
    const large = dialog.querySelector('video'), status = dialog.querySelector('[role="status"]');
    const controller = createPlaybackController({ onError: () => {
      status.textContent = 'Preview unavailable. You can still open the game.';
    } });
    const reduced = root.matchMedia?.('(prefers-reduced-motion: reduce)');
    const cards = [...grid.querySelectorAll('.game-card')];
    const observer = root.IntersectionObserver ? new root.IntersectionObserver(entries => {
      entries.forEach(entry => { if (!entry.isIntersecting && controller.isCurrent(entry.target.querySelector('video'))) controller.stop(); });
    }) : null;
    cards.forEach(card => {
      const video = card.querySelector('video'), launch = card.querySelector('.game-launch');
      if (!video || !launch) return;
      listen(launch, 'pointerenter', event => { if (event.pointerType === 'mouse' && !reduced?.matches) controller.request(video, card); });
      listen(launch, 'pointerleave', () => { if (controller.isCurrent(video)) controller.stop(); });
      listen(launch, 'focus', () => { if (!reduced?.matches) controller.request(video, card); });
      listen(launch, 'blur', () => { if (controller.isCurrent(video)) controller.stop(); });
      listen(launch, 'click', controller.stop);
      listen(card.querySelector('.game-preview-button'), 'click', event => {
        event.stopPropagation();controller.stop();status.textContent = '';
        dialog.querySelector('h2').textContent = card.querySelector('h2').textContent;
        large.dataset.src = video.dataset.src;large.poster = card.querySelector('img').src;
        large.removeAttribute('src');large.load();dialog.showModal();controller.request(large, dialog, 0);
      });
      observer?.observe(card);
    });
    listen(dialog.querySelector('button'), 'click', () => dialog.close());
    listen(dialog, 'close', () => { controller.stop();large.removeAttribute('src');large.load();status.textContent = ''; });
    listen(doc, 'visibilitychange', () => { if (doc.hidden) controller.stop(); });
    listen(root, 'pagehide', controller.stop);
    if (reduced?.addEventListener) listen(reduced, 'change', controller.stop);
    return {
      stop: controller.stop,
      destroy() {
        controller.stop();observer?.disconnect();listeners.forEach(remove => remove());
        large.removeAttribute('src');large.load();dialog.remove();
      }
    };
  }
  return { createPlaybackController, mount };
});
