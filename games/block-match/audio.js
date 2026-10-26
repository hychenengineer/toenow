// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['block-match'] = games['block-match'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
function createAudio() {
var audioCtx = null;
        var audioOutput = null;
        var audioEnabled = true;

        function ensureAudio() {
          if (!audioEnabled) return null;
          if (!audioCtx) {
            var AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              try {
                audioCtx = new AudioContextClass();
                audioOutput = audioCtx.createGain();
                audioOutput.connect(audioCtx.destination);
              } catch (e) { audioCtx = null; audioOutput = null; }
            }
          }
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(function () {});
          }
          return audioCtx;
        }

        var PENTATONIC_FREQS = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

        function playSiliconTap(stepIndex) {
          var ctx = ensureAudio();
          if (!ctx) return;
          var now = ctx.currentTime;
          var idx = Math.min(stepIndex, PENTATONIC_FREQS.length - 1);
          var freq = PENTATONIC_FREQS[idx];

          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * 1.45, now);
          osc.frequency.exponentialRampToValueAtTime(freq, now + 0.075);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

          osc.connect(gain);
          gain.connect(audioOutput);
          osc.start(now);
          osc.stop(now + 0.09);

          var crunch = ctx.createOscillator();
          var cGain = ctx.createGain();
          crunch.type = 'square';
          crunch.frequency.setValueAtTime(1600, now);
          crunch.frequency.exponentialRampToValueAtTime(320, now + 0.022);
          cGain.gain.setValueAtTime(0.11, now);
          cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);
          crunch.connect(cGain);
          cGain.connect(audioOutput);
          crunch.start(now);
          crunch.stop(now + 0.026);
        }

        function playWaveSurge() {
          var ctx = ensureAudio();
          if (!ctx) return;
          var now = ctx.currentTime;

          var chord = [523.25, 659.25, 783.99, 1046.50];
          for (var i = 0; i < chord.length; i++) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            var t = now + i * 0.035;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(chord[i], t);
            g.gain.setValueAtTime(0.14, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            osc.connect(g);
            g.connect(audioOutput);
            osc.start(t);
            osc.stop(t + 0.3);
          }
        }

        function playBriefingAlert() {
          var ctx = ensureAudio();
          if (!ctx) return;
          var now = ctx.currentTime;
          var notes = [440, 554.37, 659.25, 880];
          for (var i = 0; i < notes.length; i++) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            var t = now + i * 0.055;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[i], t);
            g.gain.setValueAtTime(0.18, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
            osc.connect(g);
            g.connect(audioOutput);
            osc.start(t);
            osc.stop(t + 0.34);
          }
        }

        function playGlitchBuzz() {
          var ctx = ensureAudio();
          if (!ctx) return;
          var now = ctx.currentTime;
          var osc1 = ctx.createOscillator();
          var osc2 = ctx.createOscillator();
          var gain = ctx.createGain();

          osc1.type = 'sawtooth';
          osc2.type = 'square';
          osc1.frequency.setValueAtTime(115, now);
          osc1.frequency.linearRampToValueAtTime(72, now + 0.28);
          osc2.frequency.setValueAtTime(123, now);
          osc2.frequency.linearRampToValueAtTime(76, now + 0.28);

          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioOutput);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.31);
          osc2.stop(now + 0.31);
        }

        
function toggle() {
  audioEnabled = !audioEnabled;
  if (audioOutput && audioCtx) audioOutput.gain.setValueAtTime(audioEnabled ? 1 : 0, audioCtx.currentTime);
  if (audioEnabled) ensureAudio();
  return audioEnabled;
}
return { ensureAudio, playSiliconTap, playWaveSurge, playBriefingAlert, playGlitchBuzz, toggle };
}

  return { createAudio };
});
