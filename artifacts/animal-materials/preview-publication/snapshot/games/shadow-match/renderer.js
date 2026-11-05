// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['shadow-match'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function renderFrame() {
          const dpr = scene.state.dpr;
          const W = scene.canvas.width;
          const H = scene.canvas.height;

          // 1. Clear main canvas every frame at 60 FPS (Zero motion-blur trails)
          scene.ctx.setTransform(1, 0, 0, 1, 0, 0);
          scene.ctx.clearRect(0, 0, W, H);

          scene.ctx.save();
          scene.ctx.scale(dpr, dpr);

          // Fill Outer Void Canvas (#070a0e)
          scene.ctx.fillStyle = '#e7e6d4';
          scene.ctx.fillRect(0, 0, scene.state.frameWidth, scene.state.frameHeight);

          renderForestTheater();
          renderOpticalChamber();
          if (scene.state.mode !== 'title') {
            renderCandidateDockCards();
          }

          scene.ctx.restore();
        }
function renderForestTheater() {
          const r=scene.state.chamberRect;
          // Framing remains outside the optical area: exact puppet geometry is unchanged.
          scene.ctx.fillStyle='#8a674a';
          scene.ctx.fillRect(r.x-9,r.y-8,r.width+18,8);
          scene.ctx.fillRect(r.x-9,r.y,8,r.height+8);
          scene.ctx.fillRect(r.x+r.width+1,r.y,8,r.height+8);
          scene.ctx.fillRect(r.x-9,r.y+r.height,r.width+18,8);
          scene.ctx.fillStyle='#6d8c68';
          scene.ctx.beginPath();scene.ctx.moveTo(r.x-10,r.y-8);scene.ctx.lineTo(r.x+r.width*.5,r.y-23);
          scene.ctx.lineTo(r.x+r.width+10,r.y-8);scene.ctx.closePath();scene.ctx.fill();
          const puppetX=r.x+r.width*.8, puppetY=Math.max(26,r.y-54);
          scene.ctx.strokeStyle='#a78559';scene.ctx.lineWidth=1.5;
          scene.ctx.beginPath();scene.ctx.moveTo(puppetX-13,puppetY+9);scene.ctx.lineTo(r.x+12,r.y-3);
          scene.ctx.moveTo(puppetX+13,puppetY+9);scene.ctx.lineTo(r.x+r.width-12,r.y-3);scene.ctx.stroke();
          if(window.ToenowAnimals && window.ToenowAnimals.drawAnimal) {
            window.ToenowAnimals.drawAnimal(scene.ctx,'raccoon',puppetX,puppetY,40);
          }
        }
function renderOpticalChamber() {
          const rect = scene.state.chamberRect;
          const dpr = scene.state.dpr;
          const spec = scene.state.setup ? scene.state.setup.spec : scene.getLevelSpecForWave(1);

          // Determine Level 5 Strobe Eclipse Shutter state (dims for 0.30s every 1.20s)
          let shutterDimmed = false;
          if (
            scene.state.mode === 'playing' &&
            scene.state.transitionType === 'none' &&
            spec.level === 5
          ) {
            const cyclePhase = scene.state.waveElapsed % 1.2;
            if (cyclePhase >= 0.9) {
              shutterDimmed = true;
            }
          }

          scene.ctx.save();
          // Chamber Backlight Fill (#0d2230 normal, dimmed during eclipse shutter)
          scene.ctx.fillStyle = shutterDimmed ? '#575e51' : '#e4d8ae';
          scene.ctx.beginPath();
          scene.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
          scene.ctx.fill();
          scene.ctx.clip();

          // Subtle #16384d calibration grid lines
          scene.ctx.strokeStyle = shutterDimmed ? 'rgba(90, 91, 68, .15)' : 'rgba(112, 107, 78, .13)';
          scene.ctx.lineWidth = 1;
          const gridStep = 28;
          scene.ctx.beginPath();
          for (let gx = rect.x + gridStep; gx < rect.x + rect.width; gx += gridStep) {
            scene.ctx.moveTo(gx, rect.y);
            scene.ctx.lineTo(gx, rect.y + rect.height);
          }
          for (let gy = rect.y + gridStep; gy < rect.y + rect.height; gy += gridStep) {
            scene.ctx.moveTo(rect.x, gy);
            scene.ctx.lineTo(rect.x + rect.width, gy);
          }
          scene.ctx.stroke();

          // Center optical calibration crosshair
          const midX = rect.x + rect.width * 0.5;
          const midY = rect.y + rect.height * 0.5;
          scene.ctx.strokeStyle = 'rgba(100, 109, 78, .1)';
          scene.ctx.beginPath();
          scene.ctx.arc(midX, midY, Math.min(rect.width, rect.height) * 0.34, 0, Math.PI * 2);
          scene.ctx.moveTo(midX - 18, midY);
          scene.ctx.lineTo(midX + 18, midY);
          scene.ctx.moveTo(midX, midY - 18);
          scene.ctx.lineTo(midX, midY + 18);
          scene.ctx.stroke();

          // Offscreen Unified Shadow Occlusion Compositing
          scene.shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
          scene.shadowCtx.clearRect(0, 0, scene.shadowBuffer.width, scene.shadowBuffer.height);

          scene.rimCtx.setTransform(1, 0, 0, 1, 0, 0);
          scene.rimCtx.clearRect(0, 0, scene.rimBuffer.width, scene.rimBuffer.height);

          const isCorrectFlash = scene.state.transitionType === 'correct';
          const isFaultFlash = scene.state.transitionType === 'fault';
          const activeRimColor = isCorrectFlash
            ? '#00ff88'
            : isFaultFlash
            ? '#ff2a5f'
            : '#5d7355';

          scene.shadowCtx.save();
          scene.shadowCtx.scale(dpr, dpr);
          scene.shadowCtx.globalCompositeOperation = 'source-over';
          scene.shadowCtx.fillStyle = isCorrectFlash ? '#07291c' : '#05070a';

          scene.rimCtx.save();
          scene.rimCtx.scale(dpr, dpr);
          scene.rimCtx.globalCompositeOperation = 'source-over';
          scene.rimCtx.fillStyle = activeRimColor;
          scene.rimCtx.strokeStyle = activeRimColor;
          scene.rimCtx.lineWidth = 4; // 2px extends outside fill boundary; interior is masked by shadowBuffer
          scene.rimCtx.lineJoin = 'round';

          let phantomTagTarget = null;

          scene.state.drifters.forEach(function (d) {
            // Level 5 initial 0.35s Crimson Phantom Tagging Window
            if (d.isPhantom && scene.state.waveElapsed < 0.35 && scene.state.transitionType === 'none') {
              phantomTagTarget = d;
              return;
            }
            // During the 0.25s correct match confirmation freeze, hide the phantom decoy so the player sees the clean target set
            if (d.isPhantom && isCorrectFlash) {
              return;
            }

            const drawR = d.baseRadius * d.scale;

            // 1. Draw onto rimBuffer (fill + 4px stroke)
            scene.rimCtx.save();
            scene.rimCtx.translate(d.x, d.y);
            scene.rimCtx.rotate(d.rotation);
            scene.traceShapePath(scene.rimCtx, d.shapeId, drawR);
            scene.rimCtx.fill('evenodd');
            scene.rimCtx.stroke();
            scene.rimCtx.restore();

            // 2. Draw onto shadowBuffer (solid #05070a fill only, zero individual stroke)
            scene.shadowCtx.save();
            scene.shadowCtx.translate(d.x, d.y);
            scene.shadowCtx.rotate(d.rotation);
            scene.traceShapePath(scene.shadowCtx, d.shapeId, drawR);
            scene.shadowCtx.fill('evenodd');
            scene.shadowCtx.restore();
          });

          scene.rimCtx.restore();
          scene.shadowCtx.restore();

          // Composite unified rim layer + unified pitch-obsidian shadow layer onto chamber
          scene.ctx.save();
          if (!scene.IS_HEADLESS) {
            scene.ctx.shadowColor = activeRimColor;
            scene.ctx.shadowBlur = 8;
          }
          scene.ctx.drawImage(scene.rimBuffer, rect.x, rect.y, rect.width, rect.height);
          scene.ctx.restore();

          scene.ctx.drawImage(scene.shadowBuffer, rect.x, rect.y, rect.width, rect.height);

          // Render Level 5 Phantom Decoy during its initial 0.35s Crimson Tagging Window (#ff2a5f)
          if (phantomTagTarget) {
            const p = phantomTagTarget;
            const pR = p.baseRadius * p.scale;
            scene.ctx.save();
            scene.ctx.translate(rect.x + p.x, rect.y + p.y);
            scene.ctx.rotate(p.rotation);
            scene.ctx.fillStyle = '#ff2a5f';
            scene.ctx.strokeStyle = '#eef6ff';
            scene.ctx.lineWidth = 2;
            scene.traceShapePath(scene.ctx, p.shapeId, pR);
            scene.ctx.fill('evenodd');
            scene.ctx.stroke();
            scene.ctx.restore();

            // Telemetry tag bracket around Crimson Phantom
            scene.ctx.save();
            scene.ctx.strokeStyle = '#ff2a5f';
            scene.ctx.lineWidth = 1.5;
            const boxR = pR * 1.15;
            scene.ctx.strokeRect(rect.x + p.x - boxR, rect.y + p.y - boxR, boxR * 2, boxR * 2);
            scene.ctx.fillStyle = '#ff2a5f';
            scene.ctx.font = '700 10px Consolas, monospace';
            scene.ctx.textAlign = 'center';
            scene.ctx.fillText('PHANTOM DECOY', rect.x + p.x, rect.y + p.y - boxR - 5);
            scene.ctx.restore();
          }

          // Level 5 Strobe Shutter HUD Notice
          if (shutterDimmed) {
            scene.ctx.fillStyle = 'rgba(255, 170, 0, 0.85)';
            scene.ctx.font = '700 11px Consolas, monospace';
            scene.ctx.textAlign = 'right';
            scene.ctx.fillText('ECLIPSE SHUTTER ACTIVE', rect.x + rect.width - 12, rect.y + 20);
          }

          scene.ctx.restore();

          // Crisp #00f3ff Outer Bezel & Technical Corner Reticles
          scene.ctx.save();
          scene.ctx.strokeStyle = activeRimColor;
          scene.ctx.lineWidth = 2;
          scene.ctx.beginPath();
          scene.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
          scene.ctx.stroke();

          // Corner Reticle Ticks
          const tick = 10;
          scene.ctx.strokeStyle = '#eef6ff';
          scene.ctx.lineWidth = 2;
          scene.ctx.beginPath();
          // Top-Left
          scene.ctx.moveTo(rect.x + 4, rect.y + 4 + tick);
          scene.ctx.lineTo(rect.x + 4, rect.y + 4);
          scene.ctx.lineTo(rect.x + 4 + tick, rect.y + 4);
          // Top-Right
          scene.ctx.moveTo(rect.x + rect.width - 4 - tick, rect.y + 4);
          scene.ctx.lineTo(rect.x + rect.width - 4, rect.y + 4);
          scene.ctx.lineTo(rect.x + rect.width - 4, rect.y + 4 + tick);
          // Bottom-Left
          scene.ctx.moveTo(rect.x + 4, rect.y + rect.height - 4 - tick);
          scene.ctx.lineTo(rect.x + 4, rect.y + rect.height - 4);
          scene.ctx.lineTo(rect.x + 4 + tick, rect.y + rect.height - 4);
          // Bottom-Right
          scene.ctx.moveTo(rect.x + rect.width - 4 - tick, rect.y + rect.height - 4);
          scene.ctx.lineTo(rect.x + rect.width - 4, rect.y + rect.height - 4);
          scene.ctx.lineTo(rect.x + rect.width - 4, rect.y + rect.height - 4 - tick);
          scene.ctx.stroke();
          scene.ctx.restore();
        }
function renderCandidateDockCards() {
          if (!scene.state.setup) return;
          scene.updateCardRects();
          if (scene.state.cardRects.length === 0) return;
          const cards = scene.state.setup.cards;

          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const r = scene.state.cardRects[i];
            if (!r || r.width <= 0 || r.height <= 0) continue;

            let fillStyle = '#f3ebd7';
            let borderStyle = '#9a8764';
            let borderWidth = 1.5;
            let iconStroke = '#50694e';

            if (scene.state.transitionType === 'correct' && i === scene.state.selectedCardIndex) {
              fillStyle = 'rgba(0, 255, 136, 0.16)';
              borderStyle = '#00ff88';
              borderWidth = 2.5;
              iconStroke = '#00ff88';
            } else if (scene.state.transitionType === 'fault') {
              if (i === scene.state.selectedCardIndex) {
                fillStyle = 'rgba(255, 42, 95, 0.18)';
                borderStyle = '#ff2a5f';
                borderWidth = 2.5;
                iconStroke = '#ff2a5f';
              } else if (card.isCorrect) {
                // Outline correct dock card in Amber (#ffaa00) for 0.45s on fault
                fillStyle = 'rgba(255, 170, 0, 0.14)';
                borderStyle = '#ffaa00';
                borderWidth = 2.5;
                iconStroke = '#ffaa00';
              }
            }

            scene.ctx.save();
            scene.ctx.fillStyle = fillStyle;
            scene.ctx.strokeStyle = borderStyle;
            scene.ctx.lineWidth = borderWidth;
            scene.ctx.beginPath();
            scene.ctx.roundRect(r.x, r.y, r.width, r.height, 6);
            scene.ctx.fill();
            scene.ctx.stroke();

            // Key index badge [1]-[6] in top-left corner of card
            scene.ctx.fillStyle = '#7fa6c4';
            scene.ctx.font = '700 10px Consolas, monospace';
            scene.ctx.textAlign = 'left';
            scene.ctx.textBaseline = 'top';
            scene.ctx.fillText('[' + (i + 1) + ']', r.x + 7, r.y + 6);

            // Render N upright (0 deg rotation) mini-silhouettes side-by-side
            const count = card.shapes.length;
            const innerPadX = 10;
            const availW = Math.max(40, r.width - innerPadX * 2);
            const slotW = availW / count;
            const maxIconR = Math.min(slotW * 0.39, r.height * 0.29, 24);
            const centerY = r.y + r.height * 0.54;

            for (let s = 0; s < count; s++) {
              const shapeId = card.shapes[s];
              const centerX = r.x + innerPadX + slotW * (s + 0.5);

              scene.ctx.save();
              scene.ctx.translate(centerX, centerY);
              scene.ctx.fillStyle = '#05070a';
              scene.ctx.strokeStyle = iconStroke;
              scene.ctx.lineWidth = 1.75;
              scene.ctx.lineJoin = 'round';
              scene.traceShapePath(scene.ctx, shapeId, maxIconR);
              scene.ctx.fill('evenodd');
              scene.ctx.stroke();
              scene.ctx.restore();
            }

            scene.ctx.restore();
          }
        }
    return { renderFrame, renderForestTheater, renderOpticalChamber, renderCandidateDockCards };
  }
  return { createRenderer };
});
