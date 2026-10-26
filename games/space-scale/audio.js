// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['space-scale'] = games['space-scale'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
class SoundEngine {
          constructor() {
            this.ctx = null;
            this.muted = false;
            this.userInteracted = false;
          }

          ensureContext() {
            if (this.muted || !this.userInteracted) return null;
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
              this.ctx.resume().catch(() => {});
            }
            return this.ctx;
          }

          playRatchetRelease() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            // Rapid metallic clicks slowing down as spring settles
            const clickCount = 6;
            for (let i = 0; i < clickCount; i++) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sawtooth';
              const t = now + i * 0.045 + Math.pow(i / clickCount, 2) * 0.08;
              osc.frequency.setValueAtTime(480 - i * 35, t);

              gain.gain.setValueAtTime(0.001, t);
              gain.gain.linearRampToValueAtTime(0.08, t + 0.004);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.03);
            }
          }

          playCollapseSuccess(streak) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            // Sub-bass singularity implosion drop
            const bass = ctx.createOscillator();
            const bassGain = ctx.createGain();
            bass.type = 'sine';
            bass.frequency.setValueAtTime(125, now);
            bass.frequency.exponentialRampToValueAtTime(26, now + 0.36);
            bassGain.gain.setValueAtTime(0.001, now);
            bassGain.gain.linearRampToValueAtTime(0.32, now + 0.02);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            bass.connect(bassGain);
            bassGain.connect(ctx.destination);
            bass.start(now);
            bass.stop(now + 0.42);

            // Supernova chime
            const streakMult = Math.min(1.6, 1 + (streak - 1) * 0.04);
            [880 * streakMult, 1320 * streakMult, 1760 * streakMult].forEach((f, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = idx === 1 ? 'triangle' : 'sine';
              const t = now + 0.05 + idx * 0.03;
              osc.frequency.setValueAtTime(f, t);
              gain.gain.setValueAtTime(0.001, t);
              gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), t + 0.015);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.32);
            });
          }

          playShieldDamage() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            // Harsh alarm buzz + low thump
            [160, 110].forEach((freq) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(freq, now);
              osc.frequency.linearRampToValueAtTime(freq * 0.65, now + 0.28);
              gain.gain.setValueAtTime(0.001, now);
              gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 0.32);
            });
          }

          playLevelUp() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((f, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              const t = now + idx * 0.08;
              osc.frequency.setValueAtTime(f, t);
              gain.gain.setValueAtTime(0.001, t);
              gain.gain.linearRampToValueAtTime(0.14, t + 0.015);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.28);
            });
          }

          playGameOver() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            [370, 311, 261.6, 185].forEach((f, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              const t = now + idx * 0.1;
              osc.frequency.setValueAtTime(f, t);
              gain.gain.setValueAtTime(0.001, t);
              gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(t);
              osc.stop(t + 0.32);
            });
          }
        }

        
  return { SoundEngine };
});
