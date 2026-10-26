// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['number-pop'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function drawPolygon(ctx, cx, cy, radius, sides, rotation) {
          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const theta = rotation + (i * Math.PI * 2) / sides;
            const px = cx + Math.cos(theta) * radius;
            const py = cy + Math.sin(theta) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
function drawCoreValueLabel(ctx, c, drawX, drawY, r) {
          const parsedFraction = scene.parseFractionLabel(c.label);
          if (parsedFraction) {
            // Render stacked fraction: Numerator on top, Horizontal Fraction Bar in middle, Denominator on bottom
            const maxDigits = Math.max(
              parsedFraction.numerator.length,
              parsedFraction.denominator.length
            );
            const isCompact = parsedFraction.isSignedNegative || maxDigits >= 2;
            const fontSize = Math.max(11, Math.round(r * (isCompact ? 0.34 : 0.38)));
            ctx.font = '800 ' + fontSize + "px 'JetBrains Mono', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Optical vertical adjustment for uppercase/numeric glyphs in Canvas textBaseline='middle'
            const opticalY = Math.round(fontSize * 0.06);
            const vOffset = Math.max(8, Math.round(r * 0.24));
            const barHalfW = Math.max(
              Math.round(r * 0.21),
              Math.round(maxDigits * fontSize * 0.34)
            );

            let fracX = drawX;
            if (parsedFraction.isSignedNegative) {
              const minusWidth = Math.round(fontSize * 0.5);
              const gap = Math.round(fontSize * 0.16);
              const shift = Math.round((minusWidth + gap) * 0.5);
              fracX = drawX + shift;
              const minusX = fracX - barHalfW - gap - Math.round(minusWidth * 0.5);
              ctx.lineWidth = 4;
              ctx.strokeStyle = 'rgba(6, 8, 15, 0.92)';
              ctx.strokeText('-', minusX, drawY + opticalY);
              ctx.fillStyle = '#f8fafc';
              ctx.fillText('-', minusX, drawY + opticalY);
            }

            // 1. Numerator (Top)
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(6, 8, 15, 0.92)';
            ctx.strokeText(parsedFraction.numerator, fracX, drawY - vOffset + opticalY);
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(parsedFraction.numerator, fracX, drawY - vOffset + opticalY);

            // 2. Horizontal Fraction Bar (Middle "—")
            ctx.save();
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(fracX - barHalfW, drawY);
            ctx.lineTo(fracX + barHalfW, drawY);
            ctx.lineWidth = 4.6;
            ctx.strokeStyle = 'rgba(6, 8, 15, 0.92)';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(fracX - barHalfW, drawY);
            ctx.lineTo(fracX + barHalfW, drawY);
            ctx.lineWidth = 2.4;
            ctx.strokeStyle = '#f8fafc';
            ctx.stroke();
            ctx.restore();

            // 3. Denominator (Bottom)
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(6, 8, 15, 0.92)';
            ctx.strokeText(parsedFraction.denominator, fracX, drawY + vOffset + opticalY);
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(parsedFraction.denominator, fracX, drawY + vOffset + opticalY);
          } else {
            // Standard Integer or Decimal Label
            const labelLen = c.label.length;
            const fontSize = Math.max(
              15,
              Math.round(r * (labelLen >= 5 ? 0.44 : labelLen >= 4 ? 0.5 : 0.58))
            );
            const opticalY = Math.round(fontSize * 0.06);
            ctx.font = '800 ' + fontSize + "px 'JetBrains Mono', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(6, 8, 15, 0.92)';
            ctx.strokeText(c.label, drawX, drawY + opticalY);

            ctx.fillStyle = '#f8fafc';
            ctx.fillText(c.label, drawX, drawY + opticalY);
          }
        }
function drawHarvestBasket(ctx, x, y, r, error, hovered) {
          ctx.save();
          ctx.strokeStyle = error ? '#bc4555' : '#82573b';
          ctx.lineWidth = hovered ? 4 : 2.5;
          // The basket stays inside the original circular hit area.
          ctx.beginPath(); ctx.arc(x, y - r * 0.06, r * 0.75, Math.PI, Math.PI * 2); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x-r*.92,y-r*.4); ctx.lineTo(x+r*.92,y-r*.4);
          ctx.lineTo(x+r*.72,y+r*.76); ctx.lineTo(x-r*.72,y+r*.76); ctx.closePath();
          ctx.fillStyle = error ? '#eaa79b' : '#d8ad72'; ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(114,78,45,.3)'; ctx.lineWidth = 1;
          for (let i=-2;i<=2;i++) { ctx.beginPath(); ctx.moveTo(x+i*r*.27,y-r*.35);ctx.lineTo(x+i*r*.22,y+r*.7);ctx.stroke(); }
          for (let i=0;i<3;i++) { ctx.beginPath();ctx.moveTo(x-r*.78,y+i*r*.22);ctx.lineTo(x+r*.78,y+i*r*.22);ctx.stroke(); }
          // Carrot tops identify the harvest while leaving the mathematical label clear.
          for (const side of [-1,1]) {
            const tipX=x+side*r*.68;
            ctx.fillStyle='#d98a46';ctx.beginPath();ctx.moveTo(tipX-r*.1,y-r*.48);ctx.lineTo(tipX+r*.1,y-r*.48);ctx.lineTo(tipX,y-r*.18);ctx.closePath();ctx.fill();
            ctx.strokeStyle='#608652';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tipX,y-r*.48);ctx.lineTo(tipX-r*.12,y-r*.74);ctx.moveTo(tipX,y-r*.48);ctx.lineTo(tipX+r*.12,y-r*.74);ctx.stroke();
          }
          // An opaque label protects fractions, exponents and operations from the weave.
          ctx.fillStyle = '#26382e';ctx.beginPath();ctx.arc(x,y,r*.69,0,Math.PI*2);ctx.fill();
          ctx.restore();
        }
function renderArena() {
          const cw = scene.canvas.clientWidth;
          const ch = scene.canvas.clientHeight;
          if (cw > 0 && ch > 0 && (Math.abs(cw - scene.viewportW) > 1 || Math.abs(ch - scene.viewportH) > 1)) {
            scene.resizeCanvas();
          }

          scene.ctx.setTransform(scene.canvas.width / scene.viewportW, 0, 0, scene.canvas.height / scene.viewportH, 0, 0);
          scene.ctx.save();

          scene.ctx.fillStyle = '#dce8cf';
          scene.ctx.fillRect(0, 0, scene.viewportW, scene.viewportH);

          // Apply Subtle Screen Shake (Triggered ONLY on Mistake, never on correct click or combo)
          if (scene.game.shakeTrauma > 0.001) {
            const shakeMag = scene.game.shakeTrauma * scene.game.shakeTrauma * 14;
            const ox = (Math.random() * 2 - 1) * shakeMag;
            const oy = (Math.random() * 2 - 1) * shakeMag;
            scene.ctx.translate(ox, oy);
          }


          // Soft garden paths and planted borders stay outside the number labels.
          scene.ctx.strokeStyle = 'rgba(132,150,92,.18)'; scene.ctx.lineWidth = 18;
          for (let y=90;y<scene.viewportH;y+=110) { scene.ctx.beginPath();scene.ctx.moveTo(0,y);scene.ctx.lineTo(scene.viewportW,y);scene.ctx.stroke(); }
          // Render Active Quantum Cores
          for (let i = 0; i < scene.game.cores.length; i++) {
            const c = scene.game.cores[i];
            if (c.popped) continue;

            const pulse = 1 + Math.sin(c.pulsePhase) * 0.035;
            const r = c.radius * pulse * c.spawnScale;
            const isHovered = scene.game.hoveredCoreId === c.id;
            const coreHue = c.errorFlash > 0 ? 350 : c.hue;

            scene.ctx.save();

            // Glitch vibration offset if frozen from mistake
            let drawX = c.x;
            let drawY = c.y;
            if (c.freezeTimer > 0) {
              drawX += (Math.random() - 0.5) * 4;
              drawY += (Math.random() - 0.5) * 4;
            }

            drawHarvestBasket(scene.ctx, drawX, drawY, r, c.errorFlash > 0, isHovered);

            // Intuitive Fraction Rim Gauge (Visual Pie Arc along outer rim)
            if (c.fractionGauge !== undefined && c.fractionGauge > 0) {
              scene.ctx.save();
              const gaugeRadius = r * 0.96;
              const startAngle = -Math.PI / 2;
              const endAngle = startAngle + Math.PI * 2 * c.fractionGauge;

              // Glowing pie wedge fill
              scene.ctx.beginPath();
              scene.ctx.moveTo(drawX, drawY);
              scene.ctx.arc(drawX, drawY, gaugeRadius, startAngle, endAngle);
              scene.ctx.closePath();
              scene.ctx.fillStyle = 'hsla(' + coreHue + ', 95%, 65%, 0.16)';
              scene.ctx.fill();

              // Glowing outer arc stroke
              scene.ctx.beginPath();
              scene.ctx.arc(drawX, drawY, gaugeRadius, startAngle, endAngle);
              scene.ctx.lineWidth = 3.2;
              scene.ctx.strokeStyle = 'hsla(' + coreHue + ', 95%, 78%, 0.85)';
              scene.ctx.stroke();
              scene.ctx.restore();
            }

            // Typographic Value Label (Vertical Stacked Fraction or Number)
            drawCoreValueLabel(scene.ctx, c, drawX, drawY, r);

            scene.ctx.restore();
          }

          // A small press, then a local lift and fade: no trails or score text.
          for (const basket of scene.game.harvests || []) {
            const press = Math.min(1, basket.elapsed / 0.045);
            const lift = Math.max(0, Math.min(1, (basket.elapsed - 0.045) / 0.155));
            const easedLift = 1 - (1 - lift) * (1 - lift);
            const scale = (1 - press * 0.1) * (1 - easedLift * 0.5);
            const r = basket.radius * basket.spawnScale;
            scene.ctx.save();
            scene.ctx.globalAlpha = 1 - easedLift;
            scene.ctx.translate(basket.x, basket.y - easedLift * 16);
            scene.ctx.scale(scale, scale);
            drawHarvestBasket(scene.ctx, 0, 0, r, false, false);
            drawCoreValueLabel(scene.ctx, basket, 0, 0, r);
            scene.ctx.restore();
          }

          // Red Mistake Glitch Overlay
          if (scene.game.glitchTimer > 0) {
            const gAlpha = Math.min(0.24, scene.game.glitchTimer);
            scene.ctx.fillStyle = 'rgba(244, 63, 94, ' + gAlpha.toFixed(3) + ')';
            scene.ctx.fillRect(0, 0, scene.viewportW, scene.viewportH);
          }

          // Critical Overload Emergency Dark-Red Vignette Border (8+ Minutes)
          if (scene.game.runDuration >= 480) {
            const pulse = 0.5 + 0.5 * Math.sin(scene.game.timeElapsed * 7);
            const vGrad = scene.ctx.createRadialGradient(
              scene.viewportW * 0.5,
              scene.viewportH * 0.5,
              Math.min(scene.viewportW, scene.viewportH) * 0.38,
              scene.viewportW * 0.5,
              scene.viewportH * 0.5,
              Math.max(scene.viewportW, scene.viewportH) * 0.72
            );
            vGrad.addColorStop(0, 'rgba(159, 18, 57, 0)');
            vGrad.addColorStop(1, 'rgba(225, 29, 72, ' + (0.22 + pulse * 0.18).toFixed(3) + ')');
            scene.ctx.fillStyle = vGrad;
            scene.ctx.fillRect(0, 0, scene.viewportW, scene.viewportH);

            scene.ctx.strokeStyle = 'rgba(244, 63, 94, ' + (0.5 + pulse * 0.45).toFixed(3) + ')';
            scene.ctx.lineWidth = 4;
            scene.ctx.strokeRect(2, 2, scene.viewportW - 4, scene.viewportH - 4);
          }

          scene.ctx.restore();
        }
    return { drawPolygon, drawCoreValueLabel, drawHarvestBasket, renderArena };
  }
  return { createRenderer };
});
