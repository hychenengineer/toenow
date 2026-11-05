(function (root, factory) {
  'use strict';
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else {
    let storage;
    try { storage = root.localStorage; } catch (_) {}
    let inherited;
    try { if (root.parent !== root) inherited = root.parent.ToenowI18n?.language; } catch (_) {}
    const api = exports.createI18n({ storage, languages: root.navigator?.languages || [root.navigator?.language], catalogs: root.ToenowI18nCatalogs || [], inherited });
    root.ToenowI18n = api;
    if (root.document?.createTreeWalker) exports.mount(root, api);
  }
})(globalThis, function () {
  'use strict';
  const STORAGE_KEY = 'toenow_language_v1';
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  function resolveLanguage(saved, languages) {
    if (saved === 'en' || saved === 'zh-Hant') return saved;
    const primary = (languages || []).find(language => typeof language === 'string' && language.length) || 'en';
    return /^zh(?:-|$)/i.test(primary) ? 'zh-Hant' : 'en';
  }
  function createI18n(options = {}) {
    let saved;
    try { saved = options.storage?.getItem(STORAGE_KEY); } catch (_) {}
    let language = resolveLanguage(options.inherited || saved, options.languages);
    const entries = Object.assign({}, ...(options.catalogs || []).map(catalog => catalog.entries));
    const patterns = (options.catalogs || []).flatMap(catalog => catalog.patterns || []);
    const listeners = new Set();
    const cache = new Map();
    const api = {
      get language() { return language; },
      t(text) {
        if (typeof text !== 'string' || language === 'en' || !/[a-z]/i.test(text)) return text;
        const key = normalize(text);
        let translated = entries[key];
        if (translated === undefined) {
          if (cache.has(key)) translated = cache.get(key);
          else {
            translated = key;
            for (const [pattern, render] of patterns) {
              const match = key.match(pattern);
              if (match) { translated = render(...match.slice(1)); break; }
            }
            // Bound caches for timers and continuously changing scores.
            if (cache.size >= 2000) cache.clear();
            cache.set(key, translated);
          }
        }
        if (translated === key) return text;
        return text.replace(/\S[\s\S]*\S|\S/, () => translated);
      },
      setLanguage(next, persist = true) {
        if (next !== 'en' && next !== 'zh-Hant') throw new TypeError('Unsupported language');
        if (persist) { try { options.storage?.setItem(STORAGE_KEY, next); } catch (_) {} }
        if (language === next) return;
        language = next;
        listeners.forEach(listener => listener(next, persist));
      },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
    };
    return api;
  }

  function mount(root, api) {
    const doc = root.document;
    const originals = new WeakMap();
    const attributes = new WeakMap();
    const ignored = 'script,style,code,pre,textarea,[data-i18n-ignore],.user-avatar-img';
    const attrNames = ['aria-label', 'title', 'placeholder', 'alt'];
    function translateNode(node) {
      if (node.nodeType === 3) {
        if (!node.parentElement || node.parentElement.closest(ignored)) return;
        const old = originals.get(node);
        const source = old && node.data === old.output ? old.source : node.data;
        const output = api.t(source);
        originals.set(node, { source, output });
        if (node.data !== output) node.data = output;
      } else if (node.nodeType === 1 && !node.closest(ignored)) {
        let saved = attributes.get(node);
        if (!saved) { saved = {}; attributes.set(node, saved); }
        for (const attr of attrNames) {
          const current = node.getAttribute(attr);
          if (current === null) continue;
          const old = saved[attr];
          const source = old && current === old.output ? old.source : current;
          const output = api.t(source);
          saved[attr] = { source, output };
          if (current !== output) node.setAttribute(attr, output);
        }
      }
    }
    function translateTree(node) {
      translateNode(node);
      if (node.nodeType !== 1 && node.nodeType !== 9) return;
      if (node.nodeType === 1 && node.closest(ignored)) return;
      const walker = doc.createTreeWalker(node, 5, {
        acceptNode(child) {
          return child.nodeType === 1 && child.matches(ignored) ? 2 : 1;
        }
      });
      while (walker.nextNode()) translateNode(walker.currentNode);
    }
    // Canvas games draw text outside the DOM. Keep numeric puzzle content intact.
    if (root.CanvasRenderingContext2D) {
      for (const method of ['fillText', 'strokeText', 'measureText']) {
        const original = root.CanvasRenderingContext2D.prototype[method];
        root.CanvasRenderingContext2D.prototype[method] = function (text, ...args) {
          return original.call(this, api.t(text), ...args);
        };
      }
    }
    let button;
    function placeSwitch() {
      if (!button || !doc.body) return;
      // Language selection belongs to the Hub header, including while a
      // game preview or other modal is open. Never move it into game dialogs.
      const parent = doc.querySelector('.site-header .action-bar');
      if (!parent) return;
      if (button.dataset.placement !== 'header') button.dataset.placement = 'header';
      if (button.parentElement !== parent) parent.appendChild(button);
      button.setAttribute('aria-pressed', String(api.language === 'zh-Hant'));
      button.setAttribute('aria-label', api.language === 'en' ? 'Switch to Chinese' : '切換至英文');
    }
    function broadcast(language) {
      try { if (root.parent !== root) root.parent.ToenowI18n?.setLanguage(language, false); } catch (_) {}
      for (const frame of doc.querySelectorAll('iframe')) {
        try { frame.contentWindow.ToenowI18n?.setLanguage(language, false); } catch (_) {}
      }
    }
    function refresh(language, persist) {
      doc.documentElement.lang = language;
      translateTree(doc.documentElement);
      placeSwitch();
      if (persist) broadcast(language);
      if (typeof root.renderHexagonRadar === 'function') root.renderHexagonRadar();
      root.dispatchEvent(new root.CustomEvent('toenow:languagechange', { detail: { language } }));
    }
    api.subscribe(refresh);
    root.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY) api.setLanguage(resolveLanguage(event.newValue, root.navigator.languages), false);
    });
    root.addEventListener('languagechange', () => {
      let saved;
      try { saved = root.localStorage.getItem(STORAGE_KEY); } catch (_) {}
      if (!saved) api.setLanguage(resolveLanguage(null, root.navigator.languages), false);
    });
    function boot() {
      const style = doc.createElement('link');
      style.rel = 'stylesheet';
      const script = [...doc.scripts].find(script => /\/toenow-i18n\.js(?:\?|$)/.test(script.src));
      style.href = new URL('../assets/toenow-language.css', script?.src || root.location.href).href;
      doc.head.appendChild(style);
      // Only the Hub offers language selection; games inherit its preference.
      if (doc.querySelector('.site-header .action-bar')) {
        button = doc.createElement('button');
        button.type = 'button';
        button.className = 'toenow-language-switch';
        button.dataset.i18nIgnore = '';
        button.textContent = '中文 / EN';
        // Game-level Enter/Space shortcuts must not consume native button activation.
        button.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
        });
        button.addEventListener('click', () => api.setLanguage(api.language === 'en' ? 'zh-Hant' : 'en'));
      }
      refresh(api.language, false);
      new root.MutationObserver(records => {
        for (const record of records) {
          if (record.type === 'characterData') translateNode(record.target);
          else if (record.type === 'attributes') translateNode(record.target);
          else record.addedNodes.forEach(translateTree);
        }
      }).observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attrNames });
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
  return { STORAGE_KEY, resolveLanguage, createI18n, mount };
});
