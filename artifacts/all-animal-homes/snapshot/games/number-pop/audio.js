// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['number-pop'] = games['number-pop'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
class SoundSynth {
          constructor() {
            this.ctx = null;
            this.muted = false;
            this.droneOsc = null;
            this.droneGain = null;
            this.droneLfo = null;
            // Pentatonic ascending frequencies: C4 -> D4 -> E4 -> G4 -> A4 -> C5 -> D5 -> E5 -> G5 -> A5
            this.pentatonic = [
              261.63, 293.66, 329.63, 392.0, 440.0,
              523.25, 587.33, 659.25, 783.99, 880.0
            ];
          }

          ensureContext() {
            if (this.muted) return null;
            if (!this.ctx) {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                try {
                  this.ctx = new AudioCtx();
                } catch (_) {
                  return null;
                }
              }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
              this.ctx.resume().catch(() => {});
            }
            return this.ctx;
          }

          playPop(pitchIndex, isFever, themeId) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const themeMultiplier = themeId === 'amber' ? 0.94 : themeId === 'emerald' ? 1.08 : 1.0;
            const freq = this.pentatonic[pitchIndex % this.pentatonic.length] * (isFever ? 1.25 : 1.0) * themeMultiplier;

            // Primary chime oscillator (clean sine/triangle, no harsh sawtooth buzz)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = themeId === 'emerald' ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.03, now + 0.14);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.24, now + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.29);

            // Harmonic overtone
            const subOsc = ctx.createOscillator();
            const subGain = ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(freq * 2, now);
            subGain.gain.setValueAtTime(0.001, now);
            subGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
            subGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.19);

            subOsc.connect(subGain);
            subGain.connect(ctx.destination);
            subOsc.start(now);
            subOsc.stop(now + 0.2);
          }

          playWaveClear(flawless) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const notes = flawless
              ? [261.63, 329.63, 392.0, 523.25, 659.25]
              : [261.63, 329.63, 392.0, 523.25];

            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              const start = now + idx * 0.055;
              osc.frequency.setValueAtTime(freq, start);
              osc.frequency.exponentialRampToValueAtTime(freq * 1.015, start + 0.35);

              gain.gain.setValueAtTime(0.001, start);
              gain.gain.linearRampToValueAtTime(0.16, start + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.42);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(start);
              osc.stop(start + 0.44);
            });
          }

          playFeverTrigger() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(261.63, now);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.16, now + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.29);
          }

          playEmpBlast() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            const bass = ctx.createOscillator();
            const bassGain = ctx.createGain();
            bass.type = 'sine';
            bass.frequency.setValueAtTime(140, now);
            bass.frequency.exponentialRampToValueAtTime(32, now + 0.48);

            bassGain.gain.setValueAtTime(0.32, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            bass.connect(bassGain);
            bassGain.connect(ctx.destination);
            bass.start(now);
            bass.stop(now + 0.52);

            const sweep = ctx.createOscillator();
            const sweepGain = ctx.createGain();
            sweep.type = 'triangle';
            sweep.frequency.setValueAtTime(440, now);
            sweep.frequency.exponentialRampToValueAtTime(880, now + 0.18);
            sweep.frequency.exponentialRampToValueAtTime(220, now + 0.42);

            sweepGain.gain.setValueAtTime(0.001, now);
            sweepGain.gain.linearRampToValueAtTime(0.16, now + 0.025);
            sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

            sweep.connect(sweepGain);
            sweepGain.connect(ctx.destination);
            sweep.start(now);
            sweep.stop(now + 0.46);
          }

          playPerkSelect() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            [392.0, 523.25, 659.25, 783.99].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              const t = now + idx * 0.045;
              osc.frequency.setValueAtTime(freq, t);
              gain.gain.setValueAtTime(0.12, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.26);
            });
          }

          playMistakeGlitch() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Soft low-pitched damped tap instead of harsh sawtooth buzz
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(95, now + 0.14);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.16, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
          }

          playGameOver() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const freqs = [392.0, 349.23, 311.13, 261.63];
            freqs.forEach((f, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              const t = now + i * 0.11;
              osc.frequency.setValueAtTime(f, t);
              osc.frequency.linearRampToValueAtTime(f * 0.96, t + 0.22);

              gain.gain.setValueAtTime(0.12, t);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.25);
            });
          }

          startDrone() {
            // Continuous background drone disabled to prevent buzzing noise
          }

          updateDrone() {
            // Continuous background drone disabled
          }

          stopDrone() {
            if (this.droneOsc) {
              try {
                this.droneOsc.stop();
                this.droneOsc.disconnect();
              } catch (_) {}
              this.droneOsc = null;
            }
            if (this.droneLfo) {
              try {
                this.droneLfo.stop();
                this.droneLfo.disconnect();
              } catch (_) {}
              this.droneLfo = null;
            }
          }
        }

        
  return { SoundSynth };
});
