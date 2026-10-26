// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['spot-quick'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function renderOffscreenSpecimen(specimen, angle, clarity) {
          scene.specimenCtx.clearRect(0, 0, scene.SPECIMEN_BUFFER_SIZE, scene.SPECIMEN_BUFFER_SIZE);
          scene.specimenCtx.save();
          scene.specimenCtx.translate(scene.SPECIMEN_BUFFER_SIZE / 2, scene.SPECIMEN_BUFFER_SIZE / 2);
          scene.specimenCtx.rotate(angle);
          const scale = (scene.SPECIMEN_BUFFER_SIZE * 0.42) / 100;
          scene.specimenCtx.scale(scale, scale);

          scene.specimenCtx.fillStyle = clarity > 0.85 ? scene.PALETTE.lime : scene.PALETTE.cyan;
          specimen.render(scene.specimenCtx);
          scene.specimenCtx.restore();
        }
function drawObservationArchive(w, h) {
          const cx = scene.state.layout.spotlightX, cy = scene.state.layout.spotlightY, r = scene.state.layout.spotlightRadius;
          scene.ctx.save();
          window.ToenowAnimals?.drawAnimal?.(scene.ctx, 'owl', Math.min(w - 28, cx + r + 13), Math.max(34, cy - r - 17), 46);
          if (scene.state.mode === 'LOCKED_CORRECT') {
            const elapsed = Math.max(0, 1 - scene.state.confirmTimer / .38);
            scene.ctx.translate(cx + r * .38, cy + r * .65);
            scene.ctx.rotate(-.18);
            scene.ctx.globalAlpha = .92;
            scene.ctx.strokeStyle = '#8bba91'; scene.ctx.fillStyle = '#dce8cf'; scene.ctx.lineWidth = 3;
            scene.ctx.fillRect(-46, -15, 92, 30); scene.ctx.strokeRect(-46, -15, 92, 30);
            scene.ctx.fillStyle = '#2e6349'; scene.ctx.textAlign = 'center'; scene.ctx.textBaseline = 'middle';
            scene.ctx.font = 'bold 12px sans-serif';
            scene.ctx.fillText(window.ToenowI18n?.language?.startsWith('zh') ? '已歸檔 ✓' : 'FILED ✓', 0, 0);
          }
          scene.ctx.restore();
        }
function drawAnalyticalBackground(w, h, cx, cy, r) {
          const grad = scene.ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, Math.max(w, h) * 0.85);
          grad.addColorStop(0, '#a8b8a4');
          grad.addColorStop(1, '#dce1ca');
          scene.ctx.fillStyle = grad;
          scene.ctx.fillRect(0, 0, w, h);

          scene.ctx.save();
          scene.ctx.fillStyle = '#f8edda'; scene.ctx.strokeStyle = '#b5a17f'; scene.ctx.lineWidth = 2;
          scene.ctx.translate(cx, cy); scene.ctx.rotate(-.025);
          scene.ctx.fillRect(-r - 17, -r - 17, r * 2 + 34, r * 2 + 47);
          scene.ctx.strokeRect(-r - 17, -r - 17, r * 2 + 34, r * 2 + 47);
          scene.ctx.restore();
          scene.ctx.strokeStyle = "rgba(126, 142, 118, 0.15)";
          scene.ctx.lineWidth = 1;
          const step = 32;
          scene.ctx.beginPath();
          for (let x = step; x < w; x += step) {
            scene.ctx.moveTo(x, 0);
            scene.ctx.lineTo(x, h);
          }
          for (let y = step; y < h; y += step) {
            scene.ctx.moveTo(0, y);
            scene.ctx.lineTo(w, y);
          }
          scene.ctx.stroke();

          scene.ctx.strokeStyle = "rgba(26, 35, 50, 0.75)";
          scene.ctx.beginPath();
          scene.ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
          scene.ctx.stroke();

          scene.ctx.strokeStyle = scene.PALETTE.hullDark;
          scene.ctx.lineWidth = 1.5;
          const outer = r + 20;
          const inner = r + 8;
          scene.ctx.beginPath();
          scene.ctx.moveTo(cx - outer, cy);
          scene.ctx.lineTo(cx - inner, cy);
          scene.ctx.moveTo(cx + inner, cy);
          scene.ctx.lineTo(cx + outer, cy);
          scene.ctx.moveTo(cx, cy - outer);
          scene.ctx.lineTo(cx, cy - inner);
          scene.ctx.moveTo(cx, cy + inner);
          scene.ctx.lineTo(cx, cy + outer);
          scene.ctx.stroke();
        }
function drawObfuscatedMosaic(destX, destY, destSize, clarity) {
          // 1:1 Scale Specimen Silhouette:
          // The item is ALWAYS rendered at its full 1:1 real physical size from frame 1!
          // It starts with a 16x16 pixel grid covering its actual dimensions (~10-14 blocks along its height),
          // so players see the recognizable contour footprint (e.g. key length, head & teeth) rather than 2 giant blocks.
          // Then the resolution smoothly escalates as clarity increases toward crystal clarity.
          const minRes = 16;
          const maxRes = 180;
          const res = Math.min(
            scene.SPECIMEN_BUFFER_SIZE,
            Math.max(minRes, Math.round(minRes + Math.pow(clarity, 1.45) * (maxRes - minRes)))
          );

          scene.mosaicCanvas.width = res;
          scene.mosaicCanvas.height = res;

          scene.mosaicCtx.clearRect(0, 0, res, res);
          scene.mosaicCtx.imageSmoothingEnabled = true;
          scene.mosaicCtx.drawImage(scene.specimenCanvas, 0, 0, res, res);

          scene.ctx.save();
          if (clarity < 0.88) {
            scene.ctx.imageSmoothingEnabled = false;
            scene.ctx.drawImage(scene.mosaicCanvas, destX, destY, destSize, destSize);
          } else {
            // Smooth cross-fade to pristine vector contour as clarity hits 100%
            const t = Math.min(1.0, (clarity - 0.88) / 0.12);
            scene.ctx.imageSmoothingEnabled = false;
            scene.ctx.globalAlpha = 1.0 - t;
            scene.ctx.drawImage(scene.mosaicCanvas, destX, destY, destSize, destSize);
            scene.ctx.imageSmoothingEnabled = true;
            scene.ctx.globalAlpha = t;
            scene.ctx.drawImage(scene.specimenCanvas, destX, destY, destSize, destSize);
            scene.ctx.globalAlpha = 1.0;
          }
          scene.ctx.restore();
        }
function drawSpotlightViewport(cx, cy, r) {
          const isStaging = scene.state.mode === "STAGING";
          // During STAGING (READY -> GO), clarity is strictly 0.0 (maximum obfuscated blocks, zero premature reveal!)
          const clarity = isStaging ? 0.0 : scene.state.clarity;

          renderOffscreenSpecimen(scene.state.targetSpecimen, scene.state.subjectAngle, clarity);

          scene.ctx.save();
          scene.ctx.beginPath();
          scene.ctx.arc(cx, cy, r, 0, Math.PI * 2);
          scene.ctx.clip();

          scene.ctx.fillStyle = "#06090d";
          scene.ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

          scene.ctx.strokeStyle = "rgba(26, 35, 50, 0.45)";
          scene.ctx.lineWidth = 1;
          scene.ctx.beginPath();
          scene.ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
          scene.ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
          scene.ctx.moveTo(cx - r, cy);
          scene.ctx.lineTo(cx + r, cy);
          scene.ctx.moveTo(cx, cy - r);
          scene.ctx.lineTo(cx, cy + r);
          scene.ctx.stroke();

          const destSize = r * 2;
          const destX = cx - r;
          const destY = cy - r;

          drawObfuscatedMosaic(destX, destY, destSize, clarity);

          scene.ctx.restore();

          drawApertureRing(cx, cy, r);
        }
function drawApertureRing(cx, cy, r) {
          scene.ctx.strokeStyle = scene.PALETTE.hullDark;
          scene.ctx.lineWidth = 3;
          scene.ctx.beginPath();
          scene.ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
          scene.ctx.stroke();

          // Progress arc shows remaining total time relative to 60s cap
          const timeFraction = Math.max(0, Math.min(1, scene.state.timeRemaining / scene.MAX_TOTAL_TIME));
          let ringColor = scene.PALETTE.cyan;
          if (scene.state.mode === "LOCKED_CORRECT") {
            ringColor = scene.PALETTE.lime;
          } else if (scene.state.inputFreezeTimer > 0) {
            ringColor = scene.PALETTE.magenta;
          } else if (scene.state.timeRemaining < 10.0) {
            ringColor = scene.PALETTE.magenta;
          } else if (scene.state.timeRemaining < 25.0) {
            ringColor = scene.PALETTE.volt;
          }

          scene.ctx.strokeStyle = ringColor;
          scene.ctx.lineWidth = 2.5;
          scene.ctx.beginPath();
          scene.ctx.arc(
            cx,
            cy,
            r + 2,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * timeFraction
          );
          scene.ctx.stroke();

          const tickCount = 36;
          for (let i = 0; i < tickCount; i++) {
            const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
            const isMajor = i % 3 === 0;
            const innerR = r - (isMajor ? 7 : 4);
            const outerR = r - 1;
            scene.ctx.strokeStyle = isMajor ? ringColor : scene.PALETTE.hullDark;
            scene.ctx.lineWidth = isMajor ? 1.6 : 1;
            scene.ctx.beginPath();
            scene.ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            scene.ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            scene.ctx.stroke();
          }

          if (scene.state.mode === "STAGING") {
            const isReady = scene.state.stagingTimer > scene.state.stagingTotal * 0.45;
            const label = isReady ? "READY" : "GO!";
            const badgeColor = isReady ? scene.PALETTE.volt : scene.PALETTE.lime;

            scene.ctx.fillStyle = "rgba(7, 10, 14, 0.86)";
            scene.ctx.fillRect(cx - 72, cy - 22, 144, 44);
            scene.ctx.strokeStyle = badgeColor;
            scene.ctx.lineWidth = 1.5;
            scene.ctx.strokeRect(cx - 72, cy - 22, 144, 44);

            scene.ctx.fillStyle = badgeColor;
            scene.ctx.font = "700 20px 'JetBrains Mono', monospace";
            scene.ctx.textAlign = "center";
            scene.ctx.textBaseline = "middle";
            scene.ctx.fillText(label, cx, cy + 1);
          } else if (scene.state.mode === "LOCKED_CORRECT") {
            // Keep center clear so the user can see the actual, clear revealed specimen image
          }
        }
function drawCandidateButtons(w) {
          const isNarrow = w < 380;
          const labelFontSize = isNarrow ? 12 : 14;
          const indexFontSize = isNarrow ? 10 : 11;

          for (let i = 0; i < scene.state.candidates.length; i++) {
            const cand = scene.state.candidates[i];
            const r = cand.rect;
            if (!r || r.w <= 0) continue;

            scene.ctx.save();

            if (cand.depleted) {
              scene.ctx.strokeStyle = scene.PALETTE.hullDark;
              scene.ctx.lineWidth = 1.25;
              scene.ctx.setLineDash([4, 3]);
              scene.ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
              scene.ctx.setLineDash([]);

              scene.ctx.fillStyle = "rgba(122, 143, 166, 0.32)";
              scene.ctx.font = "500 " + labelFontSize + "px 'JetBrains Mono', monospace";
              scene.ctx.textAlign = "left";
              scene.ctx.textBaseline = "middle";
              scene.ctx.fillText(cand.id, r.x + 30, r.y + r.h / 2);

              scene.ctx.strokeStyle = scene.PALETTE.hullDark;
              scene.ctx.strokeRect(r.x + 8, r.y + r.h / 2 - 8, 16, 16);
            } else if (cand.selectedCorrect) {
              scene.ctx.fillStyle = "rgba(0, 255, 102, 0.14)";
              scene.ctx.fillRect(r.x, r.y, r.w, r.h);
              scene.ctx.strokeStyle = scene.PALETTE.lime;
              scene.ctx.lineWidth = 2;
              scene.ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

              scene.ctx.fillStyle = scene.PALETTE.lime;
              scene.ctx.fillRect(r.x + 8, r.y + r.h / 2 - 8, 16, 16);
              scene.ctx.fillStyle = scene.PALETTE.bgDeep;
              scene.ctx.font = "700 " + indexFontSize + "px 'JetBrains Mono', monospace";
              scene.ctx.textAlign = "center";
              scene.ctx.textBaseline = "middle";
              scene.ctx.fillText(String(i + 1), r.x + 16, r.y + r.h / 2 + 0.5);

              scene.ctx.fillStyle = scene.PALETTE.lime;
              scene.ctx.font = "700 " + labelFontSize + "px 'JetBrains Mono', monospace";
              scene.ctx.textAlign = "left";
              scene.ctx.textBaseline = "middle";
              scene.ctx.fillText(cand.id, r.x + 30, r.y + r.h / 2);
            } else {
              const isFrozen = scene.state.inputFreezeTimer > 0;
              scene.ctx.fillStyle = isFrozen ? "rgba(11, 15, 23, 0.65)" : scene.PALETTE.bgMid;
              scene.ctx.fillRect(r.x, r.y, r.w, r.h);

              scene.ctx.strokeStyle = isFrozen ? scene.PALETTE.magenta : scene.PALETTE.cyan;
              scene.ctx.lineWidth = 1.25;
              scene.ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

              scene.ctx.strokeStyle = isFrozen ? scene.PALETTE.magenta : scene.PALETTE.cyan;
              scene.ctx.lineWidth = 1;
              scene.ctx.strokeRect(r.x + 8, r.y + r.h / 2 - 8, 16, 16);

              scene.ctx.fillStyle = isFrozen ? scene.PALETTE.magenta : scene.PALETTE.cyan;
              scene.ctx.font = "600 " + indexFontSize + "px 'JetBrains Mono', monospace";
              scene.ctx.textAlign = "center";
              scene.ctx.textBaseline = "middle";
              scene.ctx.fillText(String(i + 1), r.x + 16, r.y + r.h / 2 + 0.5);

              scene.ctx.fillStyle = isFrozen ? scene.PALETTE.textMuted : scene.PALETTE.textPrimary;
              scene.ctx.font = "700 " + labelFontSize + "px 'JetBrains Mono', monospace";
              scene.ctx.textAlign = "left";
              scene.ctx.textBaseline = "middle";
              scene.ctx.fillText(cand.id, r.x + 30, r.y + r.h / 2);
            }

            scene.ctx.restore();
          }
        }
    return { renderOffscreenSpecimen, drawObservationArchive, drawAnalyticalBackground, drawObfuscatedMosaic, drawSpotlightViewport, drawApertureRing, drawCandidateButtons };
  }
  return { createRenderer };
});
