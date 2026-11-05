// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['ball-track'] = games['ball-track'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
class QuantumAudioEngine {
          constructor() {
            this.ctx = null;
            this.muted = false;
            this.masterGain = null;
          }

          ensureContext() {
            if (this.muted) return null;
            if (!this.ctx) {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (!AudioCtx) return null;
              this.ctx = new AudioCtx();
              this.masterGain = this.ctx.createGain();
              this.masterGain.gain.value = 0.28;
              this.masterGain.connect(this.ctx.destination);
            }
            if (this.ctx.state === 'suspended') {
              this.ctx.resume().catch(() => {});
            }
            return this.ctx;
          }

          toggleMute() {
            this.muted = !this.muted;
            if (this.masterGain && this.ctx) {
              this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime);
            }
            return this.muted;
          }

          playUiClick(freq = 540) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + 0.055);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.065);
          }

          playRevealHum(targetCount = 1) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const baseFreqs = [330, 440, 554.37, 659.25, 880];
            for (let i = 0; i < Math.min(targetCount + 1, baseFreqs.length); i++) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(baseFreqs[i], now + i * 0.04);
              gain.gain.setValueAtTime(0.001, now + i * 0.04);
              gain.gain.linearRampToValueAtTime(0.11, now + i * 0.04 + 0.06);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(now + i * 0.04);
              osc.stop(now + 0.48);
            }
          }

          playCoreLockLatch() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(360, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.085);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.095);
          }

          playReadyChime() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // Steady C5 mid tone
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.18, now + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.36);
          }

          playGoTone() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const notes = [659.25, 880, 1046.5]; // Ascending E5 -> A5 -> C6 launch chord
            notes.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now + idx * 0.025);
              osc.frequency.exponentialRampToValueAtTime(freq * 1.06, now + idx * 0.025 + 0.24);
              gain.gain.setValueAtTime(0.001, now + idx * 0.025);
              gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.025 + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.025 + 0.26);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(now + idx * 0.025);
              osc.stop(now + idx * 0.025 + 0.28);
            });
          }

          playSwapWhoosh(stepIdx = 0) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const startF = 180 + (stepIdx % 5) * 20;
            osc.frequency.setValueAtTime(startF, now);
            osc.frequency.exponentialRampToValueAtTime(startF * 1.35, now + 0.06);
            osc.frequency.exponentialRampToValueAtTime(startF * 0.85, now + 0.13);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.065, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.15);
          }

          playCorrectTap(comboIdx = 1) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            const base = notes[Math.min(notes.length - 1, comboIdx - 1)];

            [base, base * 1.25].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now + i * 0.035);
              osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + i * 0.035 + 0.18);
              gain.gain.setValueAtTime(0.2, now + i * 0.035);
              gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.22);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(now + i * 0.035);
              osc.stop(now + i * 0.035 + 0.23);
            });
          }

          playWaveClearChord() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const chord = [523.25, 659.25, 783.99, 1046.5];
            chord.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              const t0 = now + idx * 0.04;
              osc.frequency.setValueAtTime(freq, t0);
              gain.gain.setValueAtTime(0.001, t0);
              gain.gain.linearRampToValueAtTime(0.14, t0 + 0.03);
              gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.42);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(t0);
              osc.stop(t0 + 0.44);
            });
          }

          playPartialDecryptChime() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const chord = [440, 554.37, 659.25];
            chord.forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              const t0 = now + idx * 0.055;
              osc.frequency.setValueAtTime(freq, t0);
              gain.gain.setValueAtTime(0.14, t0);
              gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(t0);
              osc.stop(t0 + 0.34);
            });
          }

          playShieldCrackleAlarm() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            [210, 155].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sawtooth';
              const t0 = now + idx * 0.06;
              osc.frequency.setValueAtTime(freq, t0);
              osc.frequency.linearRampToValueAtTime(freq * 0.72, t0 + 0.16);
              gain.gain.setValueAtTime(0.16, t0);
              gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
              osc.connect(gain);
              gain.connect(this.masterGain);
              osc.start(t0);
              osc.stop(t0 + 0.19);
            });
          }

          playDefeatBuzz() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(58, now + 0.45);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.5);
          }

          playTimerTick(urgent = false) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(urgent ? 880 : 640, now);
            gain.gain.setValueAtTime(urgent ? 0.1 : 0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.045);
          }
        }

        
  return { QuantumAudioEngine };
});
