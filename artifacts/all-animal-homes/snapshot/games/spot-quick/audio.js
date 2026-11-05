// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['spot-quick'] = games['spot-quick'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
function createAudio() {
let audioCtx = null;
        let audioOutput = null;
        let audioEnabled = true;

        function ensureAudioContext() {
          if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              audioCtx = new AudioContextClass();
              audioOutput = audioCtx.createGain();
              audioOutput.gain.value = audioEnabled ? 1 : 0;
              audioOutput.connect(audioCtx.destination);
            }
          }
          if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume().catch(function () {});
          }
        }

        function playCorrectBlip(clarityRatio) {
          if (!audioEnabled) return;
          ensureAudioContext();
          if (!audioCtx) return;
          try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            const gain = audioCtx.createGain();

            const baseFreq = 980 + Math.round((1 - clarityRatio) * 520);
            osc.type = "sine";
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + 0.09);

            filter.type = "bandpass";
            filter.frequency.setValueAtTime(baseFreq * 1.2, now);
            filter.Q.setValueAtTime(6.0, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioOutput);

            osc.start(now);
            osc.stop(now + 0.13);
          } catch (e) {}
        }

        function playIncorrectBuzz() {
          if (!audioEnabled) return;
          ensureAudioContext();
          if (!audioCtx) return;
          try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            const gain = audioCtx.createGain();

            osc.type = "square";
            osc.frequency.setValueAtTime(135, now);
            osc.frequency.linearRampToValueAtTime(98, now + 0.14);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(340, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.11, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.15);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioOutput);

            osc.start(now);
            osc.stop(now + 0.16);
          } catch (e) {}
        }

        
function toggle() {
  audioEnabled = !audioEnabled;
  if (audioOutput && audioCtx) audioOutput.gain.setValueAtTime(audioEnabled ? 1 : 0, audioCtx.currentTime);
  if (audioEnabled) ensureAudioContext();
  return audioEnabled;
}
return { ensureAudioContext, playCorrectBlip, playIncorrectBuzz, toggle };
}

  return { createAudio };
});
