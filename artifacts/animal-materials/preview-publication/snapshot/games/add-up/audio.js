// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['add-up'] = games['add-up'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
const Sfx = (function () {
          let ctx = null;
          let muted = false;

          function ensureCtx() {
            if (muted) return null;
            if (!ctx) {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                try {
                  ctx = new AudioCtx();
                } catch (_) {
                  ctx = null;
                }
              }
            }
            if (ctx && ctx.state === 'suspended') {
              ctx.resume().catch(function () {});
            }
            return ctx;
          }

          const chordIntervals = [261.63, 329.63, 392.0, 523.25, 587.33, 659.25, 783.99];

          function playSelect(chainIndex) {
            const ac = ensureCtx();
            if (!ac) return;
            const now = ac.currentTime;

            const noteIdx = Math.min(chainIndex, chordIntervals.length - 1);
            const freq = chordIntervals[noteIdx];

            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = chainIndex >= 3 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq * 0.98, now);
            osc.frequency.exponentialRampToValueAtTime(freq, now + 0.06);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(now);
            osc.stop(now + 0.19);
          }

          function playDeselect() {
            const ac = ensureCtx();
            if (!ac) return;
            const now = ac.currentTime;
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(now);
            osc.stop(now + 0.1);
          }

          function playValidBoom(nodeCount) {
            const ac = ensureCtx();
            if (!ac) return;
            const now = ac.currentTime;

            const sub = ac.createOscillator();
            const subGain = ac.createGain();
            const filter = ac.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(240, now);
            filter.frequency.exponentialRampToValueAtTime(45, now + 0.42);

            sub.type = 'sawtooth';
            sub.frequency.setValueAtTime(nodeCount >= 4 ? 110 : 85, now);
            sub.frequency.exponentialRampToValueAtTime(28, now + 0.45);

            const peakGain = nodeCount >= 4 ? 0.36 : 0.26;
            subGain.gain.setValueAtTime(0.001, now);
            subGain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            sub.connect(filter);
            filter.connect(subGain);
            subGain.connect(ac.destination);
            sub.start(now);
            sub.stop(now + 0.52);

            if (nodeCount >= 4) {
              const megaNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
              megaNotes.forEach(function (f, idx) {
                const mOsc = ac.createOscillator();
                const mGain = ac.createGain();
                mOsc.type = 'triangle';
                mOsc.frequency.setValueAtTime(f, now + idx * 0.03);
                mGain.gain.setValueAtTime(0.1, now + idx * 0.03);
                mGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.55);
                mOsc.connect(mGain);
                mGain.connect(ac.destination);
                mOsc.start(now + idx * 0.03);
                mOsc.stop(now + idx * 0.03 + 0.58);
              });
            } else if (nodeCount === 3) {
              const bells = [880.0, 1318.51];
              bells.forEach(function (f, idx) {
                const bOsc = ac.createOscillator();
                const bGain = ac.createGain();
                bOsc.type = 'sine';
                bOsc.frequency.setValueAtTime(f, now + idx * 0.04);
                bGain.gain.setValueAtTime(0.12, now + idx * 0.04);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.45);
                bOsc.connect(bGain);
                bGain.connect(ac.destination);
                bOsc.start(now + idx * 0.04);
                bOsc.stop(now + idx * 0.04 + 0.48);
              });
            }
          }

          function playSteamVent() {
            const ac = ensureCtx();
            if (!ac) return;
            const now = ac.currentTime;

            const bufferSize = Math.floor(ac.sampleRate * 0.36);
            const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
            }
            const noise = ac.createBufferSource();
            noise.buffer = buffer;

            const filter = ac.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1700, now);
            filter.frequency.exponentialRampToValueAtTime(620, now + 0.32);
            filter.Q.setValueAtTime(1.4, now);

            const nGain = ac.createGain();
            nGain.gain.setValueAtTime(0.001, now);
            nGain.gain.linearRampToValueAtTime(0.24, now + 0.02);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(ac.destination);
            noise.start(now);
            noise.stop(now + 0.36);
          }

          function playGameOver() {
            const ac = ensureCtx();
            if (!ac) return;
            const now = ac.currentTime;
            const notes = [440, 370, 311.13, 246.94];
            notes.forEach(function (f, idx) {
              const osc = ac.createOscillator();
              const gain = ac.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(f, now + idx * 0.12);
              gain.gain.setValueAtTime(0.1, now + idx * 0.12);
              gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
              osc.connect(gain);
              gain.connect(ac.destination);
              osc.start(now + idx * 0.12);
              osc.stop(now + idx * 0.12 + 0.38);
            });
          }

          return {
            playSelect: playSelect,
            playDeselect: playDeselect,
            playValidBoom: playValidBoom,
            playSteamVent: playSteamVent,
            playGameOver: playGameOver,
            toggleMute: function () {
              muted = !muted;
              return muted;
            },
          };
        })();

        
  return { Sfx };
});
