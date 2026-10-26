// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['shadow-match'] = games['shadow-match'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
class SoundEngine {
          constructor() {
            this.ctx = null;
            this.muted = false;
          }

          ensureContext() {
            if (this.muted) return null;
            if (!this.ctx) {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                try {
                  this.ctx = new AudioCtx();
                } catch (_e) {
                  this.ctx = null;
                }
              }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
              this.ctx.resume().catch(function () {});
            }
            return this.ctx;
          }

          // Subtle low-pass filtered synth hum pulse (220Hz -> 330Hz triangle, 90ms) on wave start
          playChamberPulse() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(330, now + 0.09);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(680, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.095);
          }

          // Sharp crimson alert double-chirp (880Hz -> 660Hz square wave, 110ms) when Level 5 Phantom Decoy appears
          playPhantomTag() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(660, now + 0.055);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.setValueAtTime(0.01, now + 0.048);
            gain.gain.setValueAtTime(0.08, now + 0.055);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.115);
          }

          // Ascending harmonic chord arpeggio (440Hz, 554.37Hz, 659.25Hz shifted by combo multiplier)
          playLockSuccess(combo) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const shift = 1 + Math.min(7, Math.max(0, (combo || 1) - 1)) * 0.055;
            const baseNotes = [440, 554.37, 659.25];

            baseNotes.forEach(function (freq, idx) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              const start = now + idx * 0.042;
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq * shift, start);

              gain.gain.setValueAtTime(0.001, start);
              gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
              gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(start);
              osc.stop(start + 0.17);
            });
          }

          // Detuned dual sawtooth buzzer (100Hz & 108Hz, 230ms)
          playFaultBuzz() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            [100, 108].forEach(function (freq) {
              const osc = ctx.createOscillator();
              const filter = ctx.createBiquadFilter();
              const gain = ctx.createGain();

              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(freq, now);

              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(420, now);

              gain.gain.setValueAtTime(0.09, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

              osc.connect(filter);
              filter.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 0.24);
            });
          }

          // Soft mechanical optical relay click (1200Hz bandpass burst, 25ms) during Level 5 strobe shutters
          playShutterClick() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.Q.setValueAtTime(4.5, now);

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.028);
          }

          // Crisp high-Q tick (900Hz normal, 1450Hz urgent under 10s)
          playTimerTick(urgent) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            const targetFreq = urgent ? 1450 : 900;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(targetFreq, now);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(targetFreq, now);
            filter.Q.setValueAtTime(8.0, now);

            gain.gain.setValueAtTime(urgent ? 0.07 : 0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.035);
          }
        }

        
  return { SoundEngine };
});
