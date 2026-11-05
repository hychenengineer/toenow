// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['block-match'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function drawRoundedRect(x, y, w, h, r) {
          var radius = Math.min(r, w * 0.5, h * 0.5);
          scene.ctx.beginPath();
          scene.ctx.moveTo(x + radius, y);
          scene.ctx.arcTo(x + w, y, x + w, y + h, radius);
          scene.ctx.arcTo(x + w, y + h, x, y + h, radius);
          scene.ctx.arcTo(x, y + h, x, y, radius);
          scene.ctx.arcTo(x, y, x + w, y, radius);
          scene.ctx.closePath();
        }
function drawSingleTopNotch(box, label, borderColor, textColor, bgFill) {
          scene.ctx.save();
          scene.ctx.font = '900 11.5px system-ui, sans-serif';
          var textMetrics = scene.ctx.measureText(label);
          var notchW = Math.max(36, Math.ceil(textMetrics.width) + 20);
          var notchH = 22;
          var nx = box.x + box.size * 0.5 - notchW * 0.5;
          var ny = box.y - notchH * 0.55;

          scene.ctx.fillStyle = bgFill;
          drawRoundedRect(nx, ny, notchW, notchH, 5);
          scene.ctx.fill();

          scene.ctx.lineWidth = 1.8;
          scene.ctx.strokeStyle = borderColor;
          scene.ctx.stroke();

          scene.ctx.fillStyle = textColor;
          scene.ctx.textAlign = 'center';
          scene.ctx.textBaseline = 'middle';
          scene.ctx.shadowColor = textColor;
          scene.ctx.shadowBlur = 8;
          scene.ctx.fillText(label, box.x + box.size * 0.5, ny + notchH * 0.52);
          scene.ctx.restore();
        }
function drawBackground(vw, vh) {
          scene.ctx.fillStyle = '#eee8d7';
          scene.ctx.fillRect(0, 0, vw, vh);

          scene.ctx.strokeStyle = 'rgba(111, 87, 55, 0.06)';
          scene.ctx.lineWidth = 1;
          var step = 48;
          scene.ctx.beginPath();
          for (var x = 0; x < vw; x += step) {
            scene.ctx.moveTo(x, 0); scene.ctx.lineTo(x, vh);
          }
          for (var y = 0; y < vh; y += step) {
            scene.ctx.moveTo(0, y); scene.ctx.lineTo(vw, y);
          }
          scene.ctx.stroke();

          scene.ctx.fillStyle = '#b69b66';
          for (var i = 0; i < scene.dustParticles.length; i++) {
            var p = scene.dustParticles[i];
            p.y += p.vy * 0.016;
            if (p.y < -10) p.y = vh + 10;
            scene.ctx.globalAlpha = p.alpha;
            scene.ctx.fillRect(p.x, p.y, p.size, p.size);
          }
          scene.ctx.globalAlpha = 1.0;
        }
function drawBoards() {
          var lBox = scene.layout.leftBox;
          var rBox = scene.layout.rightBox;
          var n = scene.board.config.gridSize;
          scene.ctx.fillStyle='#916c48';
          scene.ctx.fillRect(lBox.x-6,lBox.y+lBox.size+5,lBox.size+12,7);

          // --- WORKBOARD (Left, Static, No 'N' Notch) ---
          scene.ctx.fillStyle = '#a78057';
          drawRoundedRect(lBox.x, lBox.y, lBox.size, lBox.size, 10);
          scene.ctx.fill();
          scene.ctx.lineWidth = 1.8;
          scene.ctx.strokeStyle = scene.electricArcTimer > 0 ? '#b6cc8f' : '#74583b';
          scene.ctx.stroke();

          for (var r = 0; r < n; r++) {
            for (var c = 0; c < n; c++) {
              var cx = lBox.x + lBox.pad + c * (lBox.cellSize + lBox.gap);
              var cy = lBox.y + lBox.pad + r * (lBox.cellSize + lBox.gap);
              var cs = lBox.cellSize;
              var cellVal = scene.board.activeGrid[r][c];

              scene.ctx.fillStyle = '#e0ccaa';
              drawRoundedRect(cx, cy, cs, cs, 4);
              scene.ctx.fill();
              scene.ctx.lineWidth = 1;
              scene.ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
              scene.ctx.stroke();

              if (cellVal === 1 || cellVal === 2) {
                var pad = 1.2;
                var bx = cx + pad;
                var by = cy + pad;
                var bs = cs - pad * 2;

                var grad = scene.ctx.createLinearGradient(bx, by, bx + bs, by + bs);
                grad.addColorStop(0, '#d3a970');
                grad.addColorStop(1, '#ab7948');
                scene.ctx.fillStyle = grad;
                drawRoundedRect(bx, by, bs, bs, 3.5);
                scene.ctx.fill();

                scene.ctx.lineWidth = 1.3;
                scene.ctx.strokeStyle = '#795432';
                drawRoundedRect(bx, by, bs, bs, 3.5);
                scene.ctx.stroke();

                var inset = bs * 0.23;
                scene.ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
                scene.ctx.lineWidth = 1;
                // Wood grain is identical for cells 1 and 2: the blueprint supplies the answer.
                scene.ctx.beginPath();
                for(var grain=0;grain<3;grain++) {
                  var gy=by+bs*(.24+grain*.25);
                  scene.ctx.moveTo(bx+bs*.12,gy);scene.ctx.lineTo(bx+bs*.87,gy+bs*.04);
                }
                scene.ctx.stroke();
              }
            }
          }

          // --- TARGET BLUEPRINT (Right, Static, Only shows modifier notch for FLIP-H / FLIP-V / FLIP-HV) ---
          scene.ctx.fillStyle = '#e6eddf';
          drawRoundedRect(rBox.x, rBox.y, rBox.size, rBox.size, 10);
          scene.ctx.fill();
          scene.ctx.lineWidth = 1.8;
          scene.ctx.strokeStyle = '#638263';
          scene.ctx.stroke();

          if (scene.board.config.compassNotch && scene.board.config.compassNotch !== 'N') {
            drawSingleTopNotch(rBox, scene.board.config.compassNotch, '#fbbf24', '#fbbf24', '#1c140a');
          }

          for (var tr = 0; tr < n; tr++) {
            for (var tc = 0; tc < n; tc++) {
              var tx = rBox.x + rBox.pad + tc * (rBox.cellSize + rBox.gap);
              var ty = rBox.y + rBox.pad + tr * (rBox.cellSize + rBox.gap);
              var ts = rBox.cellSize;
              var isTarget = scene.board.blueprintGrid[tr][tc] === 1;

              scene.ctx.fillStyle = isTarget ? '#94ae91' : '#d7e2d0';
              drawRoundedRect(tx, ty, ts, ts, 3);
              scene.ctx.fill();

              if (isTarget) {
                scene.ctx.lineWidth = 1.5;
                scene.ctx.strokeStyle = '#496c53';
                drawRoundedRect(tx + 1, ty + 1, ts - 2, ts - 2, 3);
                scene.ctx.stroke();

                var tInset = ts * 0.24;
                scene.ctx.lineWidth = 1;
                scene.ctx.strokeStyle = '#54795c';
                scene.ctx.strokeRect(tx + tInset, ty + tInset, ts - tInset * 2, ts - tInset * 2);
              } else {
                scene.ctx.lineWidth = 1;
                scene.ctx.strokeStyle = 'rgba(245, 158, 11, 0.11)';
                drawRoundedRect(tx, ty, ts, ts, 3);
                scene.ctx.stroke();
              }
            }
          }

          // Paint the builder last, entirely inside the gap when boards stack on mobile.
          // Board bounds and hit targets stay untouched.
          if(window.ToenowAnimals && window.ToenowAnimals.drawAnimal) {
            var portraitSize = 42;
            // Watercolor sprites use 1.35 times the nominal size as their drawn height.
            var portraitY = lBox.y - 5 - portraitSize * 1.35 * 0.5;
            if(lBox.y >= rBox.y + rBox.size) {
              var boardGap = lBox.y - rBox.y - rBox.size;
              portraitSize = Math.max(0, Math.min(42, (boardGap - 10) / 1.35));
              portraitY = rBox.y + rBox.size + boardGap * 0.5;
            }
            if(portraitSize > 0) window.ToenowAnimals.drawAnimal(scene.ctx, 'beaver', lBox.x + lBox.size - 28, portraitY, portraitSize);
          }

          if (scene.electricArcTimer > 0) {
            scene.ctx.save();
            scene.ctx.strokeStyle = 'rgba(255, 255, 255, ' + (scene.electricArcTimer / 0.48) + ')';
            scene.ctx.lineWidth = 3.5;
            drawRoundedRect(lBox.x - 2, lBox.y - 2, lBox.size + 4, lBox.size + 4, 11);
            scene.ctx.stroke();
            scene.ctx.restore();
          }
        }
function updateAndDrawParticles(dt) {
          for (var i = 0; i < scene.MAX_SHARDS; i++) {
            var p = scene.shards[i];
            if (!p.active) continue;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 340 * dt;
            p.vx *= 1 - 1.5 * dt;
            p.angle += p.vAngle * dt;
            p.alpha -= p.decay * dt;

            if (p.alpha <= 0) {
              p.active = false;
              continue;
            }

            scene.ctx.save();
            scene.ctx.translate(p.x, p.y);
            scene.ctx.rotate(p.angle);
            scene.ctx.globalAlpha = Math.max(0, p.alpha);
            scene.ctx.fillStyle = p.color;
            scene.ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
            scene.ctx.restore();
          }

          scene.ctx.font = '800 13px system-ui, sans-serif';
          scene.ctx.textAlign = 'center';
          for (var j = 0; j < scene.MAX_POPUPS; j++) {
            var pop = scene.popups[j];
            if (!pop.active) continue;
            pop.y += pop.vy * dt;
            pop.alpha -= 1.25 * dt;
            if (pop.alpha <= 0) {
              pop.active = false;
              continue;
            }
            scene.ctx.save();
            scene.ctx.globalAlpha = Math.max(0, pop.alpha);
            scene.ctx.fillStyle = '#eee8d7';
            scene.ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
            scene.ctx.fillStyle = pop.color;
            scene.ctx.fillText(pop.text, pop.x, pop.y);
            scene.ctx.restore();
          }
        }
function drawScreenOverlays(vw, vh) {
          if (scene.redGlitchTimer > 0) {
            var gAlpha = Math.min(1, scene.redGlitchTimer / scene.MISTAKE_FREEZE_SECONDS);
            scene.ctx.fillStyle = 'rgba(255, 59, 92, ' + gAlpha * 0.22 + ')';
            scene.ctx.fillRect(0, 0, vw, vh);

            scene.ctx.fillStyle = 'rgba(255, 59, 92, ' + gAlpha * 0.45 + ')';
            for (var s = 0; s < 4; s++) {
              var barY = Math.random() * vh;
              var barH = 3 + Math.random() * 10;
              scene.ctx.fillRect(0, barY, vw, barH);
            }
          }
        }
    return { drawRoundedRect, drawSingleTopNotch, drawBackground, drawBoards, updateAndDrawParticles, drawScreenOverlays };
  }
  return { createRenderer };
});
