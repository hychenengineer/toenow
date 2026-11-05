// audio: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['tap-match'] = games['tap-match'] || {};
    game.audio = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
class SoundEngine {
          constructor() {
            this.ctx = null;
            this.enabled = true;
          }

          init() {
            if (!this.ctx) {
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (AudioCtx) {
                this.ctx = new AudioCtx();
              }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
              this.ctx.resume();
            }
          }

          toggle() {
            this.enabled = !this.enabled;
            return this.enabled;
          }

          // Short, crisp sine/triangle beep for valid node strikes
          // Overdrive / streak multiplier states remain 100% SILENT per spec.
          playHit() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(740, now);
            osc.frequency.exponentialRampToValueAtTime(1180, now + 0.055);

            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.07);
          }

          // Low-frequency sawtooth blip for misses/penalties
          playMiss() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(92, now + 0.11);

            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.125);
          }

          // Crisp sine pip for READY -> GO staging transition
          playStagePip(isGo) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(isGo ? 880 : 520, now);

            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.09 : 0.05));

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + (isGo ? 0.095 : 0.055));
          }
        }

        
  return { SoundEngine };
});
