// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['tap-match'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function drawOuterShape(c, x, y, r, shape, strokeHex, fillRgba, lineWidth, dashed) {
          c.save();
          c.beginPath();
          if (dashed) {
            c.setLineDash([4, 4]);
          }

          if (shape === 'CIRCLE') {
            c.arc(x, y, r, 0, Math.PI * 2);
          } else if (shape === 'DIAMOND') {
            c.moveTo(x, y - r * 1.06);
            c.lineTo(x + r * 1.06, y);
            c.lineTo(x, y + r * 1.06);
            c.lineTo(x - r * 1.06, y);
            c.closePath();
          } else if (shape === 'SQUARE') {
            const half = r * 0.84;
            c.rect(x - half, y - half, half * 2, half * 2);
          } else if (shape === 'HEXAGON') {
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 6;
              const vx = x + r * 1.02 * Math.cos(angle);
              const vy = y + r * 1.02 * Math.sin(angle);
              if (i === 0) c.moveTo(vx, vy);
              else c.lineTo(vx, vy);
            }
            c.closePath();
          }

          if (fillRgba) {
            c.fillStyle = fillRgba;
            c.fill();
          }
          c.lineWidth = lineWidth;
          c.strokeStyle = strokeHex;
          c.stroke();
          c.restore();
        }
function drawInnerGlyph(c, x, y, r, glyph, colorHex) {
          const gr = r * 0.36;
          c.save();
          c.strokeStyle = colorHex;
          c.fillStyle = colorHex;
          c.lineWidth = 2.4;
          c.lineCap = 'square';

          if (glyph === 'DOT') {
            c.beginPath();
            c.arc(x, y, gr * 0.55, 0, Math.PI * 2);
            c.fill();
          } else if (glyph === 'CROSS') {
            c.beginPath();
            c.moveTo(x - gr, y);
            c.lineTo(x + gr, y);
            c.moveTo(x, y - gr);
            c.lineTo(x, y + gr);
            c.stroke();
          } else if (glyph === 'DELTA') {
            c.beginPath();
            c.moveTo(x, y - gr * 1.05);
            c.lineTo(x + gr * 1.02, y + gr * 0.82);
            c.lineTo(x - gr * 1.02, y + gr * 0.82);
            c.closePath();
            c.stroke();
          } else if (glyph === 'SLASH') {
            c.beginPath();
            c.moveTo(x - gr * 0.85, y + gr * 0.85);
            c.lineTo(x + gr * 0.85, y - gr * 0.85);
            c.stroke();
          }

          c.restore();
        }
function hexToRgba(hex, alpha) {
          if (hex === '#00f0ff') return `rgba(0, 240, 255, ${alpha})`;
          if (hex === '#ffe600') return `rgba(255, 230, 0, ${alpha})`;
          if (hex === '#ff0055') return `rgba(255, 0, 85, ${alpha})`;
          if (hex === '#00ff66') return `rgba(0, 255, 102, ${alpha})`;
          return `rgba(139, 155, 180, ${alpha})`;
        }
function drawTargetCriteriaPreview(c, cx, cy, r, target) {
          const mode = target.mode;
          const isColorReq = mode === 'COLOR' || mode === 'COLOR_SHAPE' || mode === 'COLOR_GLYPH';
          const colorHex = isColorReq && target.color ? scene.COLOR_MAP[target.color] : '#f1f5f9';

          c.save();

          if (mode === 'COLOR') {
            // Only color matters: draw a distinct rectangular color swatch chip (zero circle contours)
            const chipW = r * 1.8;
            const chipH = r * 1.15;
            c.beginPath();
            if (c.roundRect) {
              c.roundRect(cx - chipW / 2, cy - chipH / 2, chipW, chipH, 2.5);
            } else {
              c.rect(cx - chipW / 2, cy - chipH / 2, chipW, chipH);
            }
            c.fillStyle = colorHex;
            c.fill();
            c.lineWidth = 1;
            c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            c.stroke();
          } else if (mode === 'GLYPH') {
            // Only inner symbol matters: draw only the white glyph in the center, zero circle contours
            drawInnerGlyph(c, cx, cy, r * 1.25, target.glyph, '#f1f5f9');
          } else if (mode === 'SHAPE') {
            // Only shape matters: white shape outline, NO color, NO inner glyph
            drawOuterShape(
              c,
              cx,
              cy,
              r,
              target.shape,
              '#f1f5f9',
              'rgba(241, 245, 249, 0.12)',
              2.6,
              false
            );
          } else if (mode === 'COLOR_SHAPE') {
            // Both color and shape matter: colored shape with NO inner glyph
            drawOuterShape(
              c,
              cx,
              cy,
              r,
              target.shape,
              colorHex,
              hexToRgba(colorHex, 0.2),
              2.8,
              false
            );
          } else if (mode === 'SHAPE_GLYPH') {
            // Shape and glyph matter, but NO color: white shape + white glyph
            drawOuterShape(
              c,
              cx,
              cy,
              r,
              target.shape,
              '#f1f5f9',
              'rgba(241, 245, 249, 0.12)',
              2.5,
              false
            );
            drawInnerGlyph(c, cx, cy, r, target.glyph, '#f1f5f9');
          } else if (mode === 'COLOR_GLYPH') {
            // Color and glyph matter, no specific shape: draw colored glyph without any circle contour
            drawInnerGlyph(c, cx, cy, r * 1.25, target.glyph, colorHex);
          }

          c.restore();
        }
function drawPenguinPool(w, h, bannerY) {
          const keeperX = w - 38, keeperY = bannerY + 70;
          scene.ctx.save();
          scene.ctx.fillStyle = '#e7d8b9';
          scene.ctx.beginPath(); scene.ctx.ellipse(keeperX, keeperY + 17, 31, 8, 0, 0, Math.PI * 2); scene.ctx.fill();
          window.ToenowAnimals?.drawAnimal?.(scene.ctx, 'penguin', keeperX, keeperY, 44);
          const now = performance.now();
          for (let i = scene.penguinCollection.length - 1; i >= 0; i--) {
            const card = scene.penguinCollection[i], t = Math.min(1, (now - card.started) / 560);
            if (t >= 1) { scene.penguinCollection.splice(i, 1); continue; }
            const x = card.x + (keeperX - card.x) * t;
            const y = card.y + (keeperY - card.y) * t - Math.sin(t * Math.PI) * 45;
            scene.ctx.save(); scene.ctx.translate(x, y); scene.ctx.rotate(t * .3);
            scene.ctx.globalAlpha = 1 - t * .5;
            scene.ctx.fillStyle = '#fff4dc'; scene.ctx.strokeStyle = '#bca47b'; scene.ctx.lineWidth = 2;
            scene.ctx.fillRect(-17, -21, 34, 42); scene.ctx.strokeRect(-17, -21, 34, 42);
            drawOuterShape(scene.ctx, 0, 0, 10, card.shape, scene.COLOR_MAP[card.color] || '#496e83', null, 2, false);
            drawInnerGlyph(scene.ctx, 0, 0, 10, card.glyph, '#425362'); scene.ctx.restore();
          }
          scene.ctx.restore();
        }
function renderGame() {
          window.__PENGUIN_POOL_STATE = { phase: scene.state.phase, wave: scene.state.wave, hits: scene.state.waveHits, faults: scene.state.faults,
            cardsInFlight: scene.penguinCollection.length, nodes: scene.state.nodes.map(n => ({x:n.x,y:n.y,status:n.status,isTarget:n.isTarget})) };
          const w = scene.state.width;
          const h = scene.state.height;

          // 1. Strict full-frame clear on every tick to guarantee zero ghosting
          scene.ctx.clearRect(0, 0, w, h);

          // 2. Watercolor matching pool
          scene.ctx.fillStyle = '#325b68';
          scene.ctx.fillRect(0, 0, w, h);

          // 3. Faint analytical grid coordinates overlaying backdrop
          scene.ctx.save();
          scene.ctx.strokeStyle = 'rgba(189, 218, 214, 0.14)';
          scene.ctx.lineWidth = 1;
          const gridStep = 40;
          scene.ctx.beginPath();
          for (let gx = gridStep; gx < w; gx += gridStep) {
            scene.ctx.moveTo(gx, 0);
            scene.ctx.lineTo(gx, h);
          }
          for (let gy = gridStep; gy < h; gy += gridStep) {
            scene.ctx.moveTo(0, gy);
            scene.ctx.lineTo(w, gy);
          }
          scene.ctx.stroke();

          // Subtle coordinate tick labels along bottom edge
          scene.ctx.fillStyle = 'rgba(139, 155, 180, 0.28)';
          scene.ctx.font = '10px "JetBrains Mono", monospace';
          scene.ctx.textAlign = 'left';
          scene.ctx.fillText(`GRID: ${scene.state.gridSize}x${scene.state.gridSize} (${scene.state.speedLabel})`, 12, h - 8);
          scene.ctx.textAlign = 'right';
          scene.ctx.fillText(`WINDOW: ${(scene.state.activeWindowMs / 1000).toFixed(2)}s`, w - 12, h - 8);
          scene.ctx.restore();

          // 4. Persistent Target Banner Strip inside safe area top
          const bannerY = Math.max(12, scene.state.safeTopY - 12);
          scene.ctx.save();
          scene.ctx.fillStyle = '#0b0f17';
          scene.ctx.strokeStyle = '#243044';
          scene.ctx.lineWidth = 1;
          scene.ctx.fillRect(14, bannerY, w - 28, 38);
          scene.ctx.strokeRect(14, bannerY, w - 28, 38);

          // Draw live mini target preview on left of banner
          const previewX = 34;
          const previewY = bannerY + 19;
          drawTargetCriteriaPreview(scene.ctx, previewX, previewY, 11, scene.state.target);

          scene.ctx.font = '600 12px "JetBrains Mono", monospace';
          scene.ctx.fillStyle = '#8b9bb4';
          scene.ctx.textAlign = 'left';
          scene.ctx.textBaseline = 'middle';
          scene.ctx.fillText('TAP:', 54, previewY);

          scene.ctx.fillStyle = scene.state.target.accentHex;
          scene.ctx.fillText(scene.state.target.label, 90, previewY);

          // Right side wave progress counter
          scene.ctx.textAlign = 'right';
          scene.ctx.fillStyle = '#f1f5f9';
          scene.ctx.fillText(`${scene.state.waveHits}/${scene.state.waveQuota}`, w - 24, previewY);
          scene.ctx.restore();

          // 5. Render Spatial Node Receptors
          for (let i = 0; i < scene.state.nodes.length; i++) {
            const node = scene.state.nodes[i];
            const { x, y, radius } = node;

            // Base dimmed neutral hull ring (#1a2332)
            scene.ctx.save();
            scene.ctx.beginPath();
            scene.ctx.arc(x, y, radius, 0, Math.PI * 2);
            scene.ctx.fillStyle = '#24444e';
            scene.ctx.fill();
            scene.ctx.lineWidth = 1.5;
            scene.ctx.strokeStyle = '#abc6ba';
            scene.ctx.stroke();

            // Corner analytical reticle ticks
            const tickOffset = radius * 0.78;
            const tickLen = 4;
            scene.ctx.strokeStyle = '#161e2b';
            scene.ctx.lineWidth = 1;
            scene.ctx.beginPath();
            scene.ctx.moveTo(x - tickOffset, y - tickOffset + tickLen);
            scene.ctx.lineTo(x - tickOffset, y - tickOffset);
            scene.ctx.lineTo(x - tickOffset + tickLen, y - tickOffset);
            scene.ctx.moveTo(x + tickOffset, y + tickOffset - tickLen);
            scene.ctx.lineTo(x + tickOffset, y + tickOffset);
            scene.ctx.lineTo(x + tickOffset - tickLen, y + tickOffset);
            scene.ctx.stroke();
            scene.ctx.restore();

            if (node.status === 'ACTIVE') {
              const colorHex = scene.COLOR_MAP[node.color] || '#00f0ff';
              const remainRatio = Math.max(0, 1 - node.elapsedMs / node.durationMs);

              const popScale = Math.min(1, node.elapsedMs / 75);
              const drawR = radius * 0.68 * (0.75 + 0.25 * popScale);

              // Outer countdown arc around receptor perimeter
              scene.ctx.save();
              scene.ctx.beginPath();
              scene.ctx.arc(
                x,
                y,
                radius - 2,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * remainRatio
              );
              scene.ctx.strokeStyle = hexToRgba(colorHex, 0.55);
              scene.ctx.lineWidth = 2;
              scene.ctx.stroke();
              scene.ctx.restore();

              // Active geometric shape + inner glyph
              drawOuterShape(
                scene.ctx,
                x,
                y,
                drawR,
                node.shape,
                colorHex,
                hexToRgba(colorHex, 0.14),
                2.5,
                false
              );
              drawInnerGlyph(scene.ctx, x, y, drawR, node.glyph, colorHex);
            } else if (node.status === 'HIT_FEEDBACK') {
              const ratio = Math.max(0, node.feedbackMs / 240);
              const ringR = radius * (0.72 + (1 - ratio) * 0.25);
              scene.ctx.save();
              scene.ctx.beginPath();
              scene.ctx.arc(x, y, ringR, 0, Math.PI * 2);
              scene.ctx.strokeStyle = hexToRgba('#00ff66', ratio);
              scene.ctx.lineWidth = 2;
              scene.ctx.stroke();

              scene.ctx.font = '700 13px "JetBrains Mono", monospace';
              scene.ctx.fillStyle = hexToRgba('#00ff66', Math.min(1, ratio * 1.4));
              scene.ctx.textAlign = 'center';
              scene.ctx.textBaseline = 'middle';
              scene.ctx.fillText(node.feedbackLabel, x, y);
              scene.ctx.restore();
            } else if (node.status === 'DEPLETED') {
              const ratio = Math.max(0, node.feedbackMs / 460);
              const wireColor = `rgba(255, 0, 85, ${0.85 * ratio})`;
              drawOuterShape(
                scene.ctx,
                x,
                y,
                radius * 0.64,
                node.shape,
                wireColor,
                null,
                1.5,
                true
              );

              scene.ctx.save();
              scene.ctx.font = '600 10px "JetBrains Mono", monospace';
              scene.ctx.fillStyle = wireColor;
              scene.ctx.textAlign = 'center';
              scene.ctx.textBaseline = 'middle';
              scene.ctx.fillText(node.feedbackLabel, x, y);
              scene.ctx.restore();
            }
          }

          drawPenguinPool(w, h, bannerY);

          // 6. Staging "READY -> GO!" Transition Overlay (with frozen timer)
          if (scene.state.phase === 'STAGING') {
            const isGoPhase = scene.state.stagingTimer <= 0.65;
            scene.ctx.save();
            scene.ctx.fillStyle = 'rgba(7, 10, 14, 0.72)';
            scene.ctx.fillRect(0, 0, w, h);

            const boxW = Math.min(w - 40, 300);
            const boxH = 114;
            const boxX = (w - boxW) / 2;
            const boxY = (h - boxH) / 2;

            scene.ctx.fillStyle = '#0e1420';
            scene.ctx.strokeStyle = isGoPhase ? '#00ff66' : '#00f0ff';
            scene.ctx.lineWidth = 1.5;
            scene.ctx.fillRect(boxX, boxY, boxW, boxH);
            scene.ctx.strokeRect(boxX, boxY, boxW, boxH);

            scene.ctx.textAlign = 'center';
            scene.ctx.textBaseline = 'middle';

            scene.ctx.font = '600 11px "JetBrains Mono", monospace';
            scene.ctx.fillStyle = '#8b9bb4';
            scene.ctx.fillText(`WAVE ${scene.state.wave} · ${scene.state.gridSize}x${scene.state.gridSize} (${scene.state.speedLabel})`, w / 2, boxY + 26);

            scene.ctx.font = '700 28px "Outfit", sans-serif';
            scene.ctx.fillStyle = isGoPhase ? '#00ff66' : '#f1f5f9';
            scene.ctx.fillText(isGoPhase ? 'GO!' : 'READY', w / 2, boxY + 58);

            scene.ctx.font = '600 12px "JetBrains Mono", monospace';
            scene.ctx.fillStyle = scene.state.target.accentHex;
            scene.ctx.fillText(`TAP: ${scene.state.target.label}`, w / 2, boxY + 90);
            scene.ctx.restore();
          }
        }
    return { drawOuterShape, drawInnerGlyph, hexToRgba, drawTargetCriteriaPreview, drawPenguinPool, renderGame };
  }
  return { createRenderer };
});
