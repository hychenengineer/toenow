// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['add-up'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function drawNutBag(ctx, r, selected, hovered) {
          ctx.beginPath();ctx.moveTo(-r*.43,-r*.72);ctx.lineTo(r*.43,-r*.72);
          ctx.bezierCurveTo(r*.18,-r*.32,r*1.1,-r*.1,r*.83,r*.62);
          ctx.quadraticCurveTo(0,r*1.04,-r*.83,r*.62);
          ctx.bezierCurveTo(-r*1.1,-r*.1,-r*.18,-r*.32,-r*.43,-r*.72);
          ctx.closePath();ctx.fillStyle=selected?'#c7b982':'#ead8ac';ctx.fill();
          ctx.strokeStyle=selected?'#448365':'#9b7752';ctx.lineWidth=selected||hovered?4:2;ctx.stroke();
          ctx.beginPath();ctx.moveTo(-r*.44,-r*.49);ctx.lineTo(r*.44,-r*.49);ctx.stroke();
          ctx.fillStyle='#fff8df';ctx.beginPath();ctx.arc(0,2,r*.5,0,Math.PI*2);ctx.fill();
        }
function renderArena() {
          scene.ctx.save();
          scene.ctx.fillStyle = '#e5ddc7';
          scene.ctx.fillRect(0, 0, scene.width, scene.height);

          // In title screen state, hide the game arena behind the title card
          if (scene.state === 'title') {
            scene.ctx.restore();
            return;
          }

          if (scene.cameraTrauma > 0.001) {
            const shakeMag = scene.cameraTrauma * scene.cameraTrauma * 16;
            const sx = (Math.random() * 2 - 1) * shakeMag;
            const sy = (Math.random() * 2 - 1) * shakeMag;
            scene.ctx.translate(sx, sy);
          }

          const parallaxX = scene.state === 'title' ? ((scene.pointerX - scene.width * 0.5) / scene.width) * 18 : 0;
          const parallaxY = scene.state === 'title' ? ((scene.pointerY - scene.height * 0.5) / scene.height) * 18 : 0;
          const cx = scene.coreX + parallaxX;
          const cy = scene.coreY + parallaxY;

          // Depot floorboards frame the moving supplies without obscuring labels.
          scene.ctx.strokeStyle='rgba(140,107,70,.13)';scene.ctx.lineWidth=2;
          for(let y=0;y<scene.height;y+=75){scene.ctx.beginPath();scene.ctx.moveTo(0,y);scene.ctx.lineTo(scene.width,y);scene.ctx.stroke();}

          // 2. Real-time Laser Beams between Selected Nodes
          if (scene.selectedNodes.length >= 2) {
            scene.ctx.save();
            for (let i = 0; i < scene.selectedNodes.length - 1; i++) {
              const nA = scene.selectedNodes[i];
              const nB = scene.selectedNodes[i + 1];

              scene.ctx.strokeStyle = scene.selectedNodes.length >= 4 ? '#fef08a' : '#22d3ee';
              scene.ctx.globalAlpha = 0.5;
              scene.ctx.lineWidth = scene.selectedNodes.length >= 4 ? 8 : 5;
              scene.ctx.beginPath();
              scene.ctx.moveTo(nA.x, nA.y);
              scene.ctx.lineTo(nB.x, nB.y);
              scene.ctx.stroke();

              scene.ctx.globalAlpha = 0.95;
              scene.ctx.lineWidth = scene.selectedNodes.length >= 4 ? 3 : 2;
              scene.ctx.strokeStyle = '#ffffff';
              scene.ctx.beginPath();
              scene.ctx.moveTo(nA.x, nA.y);
              scene.ctx.lineTo(nB.x, nB.y);
              scene.ctx.stroke();

              if (scene.selectedNodes.length >= 4) {
                scene.ctx.strokeStyle = '#fef08a';
                scene.ctx.lineWidth = 1.6;
                scene.ctx.beginPath();
                scene.ctx.moveTo(nA.x, nA.y);
                const segs = 4;
                const ddx = nB.x - nA.x;
                const ddy = nB.y - nA.y;
                const perpX = -ddy / (Math.hypot(ddx, ddy) || 1);
                const perpY = ddx / (Math.hypot(ddx, ddy) || 1);
                for (let s = 1; s < segs; s++) {
                  const t = s / segs;
                  const jitt = Math.sin(scene.worldTime * 32 + s * 3.1 + i) * 9;
                  scene.ctx.lineTo(nA.x + ddx * t + perpX * jitt, nA.y + ddy * t + perpY * jitt);
                }
                scene.ctx.lineTo(nB.x, nB.y);
                scene.ctx.stroke();
              }
            }
            scene.ctx.restore();
          }

          // 3. Energy Tethers to Central Core
          const currentSum = scene.evaluateSelection(scene.selectedNodes);
          for (let i = 0; i < scene.selectedNodes.length; i++) {
            const sn = scene.selectedNodes[i];

            scene.ctx.save();
            scene.ctx.strokeStyle = '#22d3ee';
            scene.ctx.globalAlpha = 0.38;
            scene.ctx.lineWidth = 8;
            scene.ctx.beginPath();
            scene.ctx.moveTo(sn.x, sn.y);
            scene.ctx.lineTo(cx, cy);
            scene.ctx.stroke();

            scene.ctx.globalAlpha = 0.92;
            scene.ctx.lineWidth = 2.2;
            scene.ctx.strokeStyle = '#ffffff';
            scene.ctx.beginPath();
            scene.ctx.moveTo(sn.x, sn.y);
            const segs = 5;
            const dx = cx - sn.x;
            const dy = cy - sn.y;
            const perpX = -dy / (Math.hypot(dx, dy) || 1);
            const perpY = dx / (Math.hypot(dx, dy) || 1);
            for (let s = 1; s < segs; s++) {
              const t = s / segs;
              const jitt = Math.sin(scene.worldTime * 24 + s * 2.2 + i) * 5;
              scene.ctx.lineTo(sn.x + dx * t + perpX * jitt, sn.y + dy * t + perpY * jitt);
            }
            scene.ctx.lineTo(cx, cy);
            scene.ctx.stroke();

            const pulseT = (scene.worldTime * 2.8 + i * 0.25) % 1;
            scene.ctx.fillStyle = '#ffffff';
            scene.ctx.beginPath();
            scene.ctx.arc(sn.x + dx * pulseT, sn.y + dy * pulseT, 3.5, 0, Math.PI * 2);
            scene.ctx.fill();
            scene.ctx.restore();
          }

          // 4. Shockwaves
          for (let i = 0; i < scene.MAX_SHOCKWAVES; i++) {
            const sw = scene.shockwaves[i];
            if (!sw.active) continue;
            const alpha = Math.max(0, sw.life / sw.maxLife);
            scene.ctx.save();
            scene.ctx.strokeStyle = sw.color;
            scene.ctx.globalAlpha = alpha * 0.85;
            scene.ctx.lineWidth = 3 + (1 - alpha) * 8;
            scene.ctx.beginPath();
            scene.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            scene.ctx.stroke();
            scene.ctx.restore();
          }

          // 7. Particles
          for (let i = 0; i < scene.MAX_PARTICLES; i++) {
            const p = scene.particlePool[i];
            if (!p.active) continue;
            const alpha = Math.max(0, p.life / p.maxLife);
            scene.ctx.save();
            scene.ctx.globalAlpha = alpha;
            scene.ctx.fillStyle = p.color;
            scene.ctx.beginPath();
            scene.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            scene.ctx.fill();
            scene.ctx.restore();
          }


          // 5. Central Reactor Core
          scene.ctx.save();
          const coreAccent =
            scene.steamAlertTimer > 0
              ? '#f43f5e'
              : scene.selectedNodes.length > 0
                ? '#67e8f9'
                : '#22d3ee';

          // Wooden order board: the requested total remains at the same position.
          scene.ctx.fillStyle = '#70523d';scene.ctx.strokeStyle='#b69368';scene.ctx.lineWidth=6;
          scene.ctx.beginPath();scene.ctx.rect(cx-scene.coreRadius,cy-scene.coreRadius,scene.coreRadius*2,scene.coreRadius*2);scene.ctx.fill();scene.ctx.stroke();
          if (window.ToenowAnimals) {
            const delivered = performance.now() < scene.supplyDeliveryUntil;
            window.ToenowAnimals.drawAnimal(scene.ctx,'squirrel',cx+scene.coreRadius*.83,cy-scene.coreRadius*.83-(delivered?8:0),scene.coreRadius*.7);
          }

          scene.ctx.textAlign = 'center';
          scene.ctx.textBaseline = 'middle';
          const monoFont = getComputedStyle(document.documentElement).getPropertyValue('--font-mono');

          scene.ctx.fillStyle = '#94a3b8';
          scene.ctx.font = '700 9.5px ' + monoFont;
          scene.ctx.fillText(window.ToenowI18n ? window.ToenowI18n.t('Supply order') : 'Supply order', cx, cy - scene.coreRadius * 0.42);

          scene.ctx.fillStyle = '#f8fafc';
          const targetFontPx = Math.round(scene.coreRadius * 0.56);
          scene.ctx.font = '800 ' + targetFontPx + 'px ' + monoFont;
          scene.ctx.fillText(String(scene.target), cx, cy + 2);

          scene.ctx.fillStyle = scene.selectedNodes.length > 0 ? coreAccent : '#64748b';
          scene.ctx.font = '700 10px ' + monoFont;
          const sumLabel =
            scene.selectedNodes.length > 0 ? 'SUM: ' + currentSum : scene.coreStatusText;
          scene.ctx.fillText(sumLabel, cx, cy + scene.coreRadius * 0.46);
          scene.ctx.restore();

          // 6. Floating Plasma Battery Nodes (Pure Cyan Addition Cells)
          for (let i = 0; i < scene.nodes.length; i++) {
            const n = scene.nodes[i];
            scene.ctx.save();
            scene.ctx.translate(n.x + parallaxX * 0.4, n.y + parallaxY * 0.4);
            scene.ctx.scale(n.scaleX, n.scaleY);

            drawNutBag(scene.ctx, n.radius, n.selected, scene.hoveredNode === n);

            scene.ctx.textAlign = 'center';
            scene.ctx.textBaseline = 'middle';
            scene.ctx.fillStyle = '#4d3c29';
            const valFontPx = Math.round(n.radius * 0.54);
            scene.ctx.font = '700 ' + valFontPx + 'px ' + monoFont;
            scene.ctx.fillText(n.label, 0, 2);

            scene.ctx.fillStyle = n.selected ? '#276448' : '#6e5035';
            scene.ctx.font = '600 8.5px ' + monoFont;
            scene.ctx.fillText('[' + n.id + ']', 0, -n.radius * 0.54);

            scene.ctx.restore();
          }

          // 8. Floating Callouts
          for (let i = 0; i < scene.MAX_CALLOUTS; i++) {
            const fc = scene.floatingCallouts[i];
            if (!fc.active) continue;
            const alpha = Math.max(0, Math.min(1, (fc.life / fc.maxLife) * 1.4));
            scene.ctx.save();
            scene.ctx.globalAlpha = alpha;
            scene.ctx.textAlign = 'center';
            scene.ctx.textBaseline = 'middle';
            scene.ctx.font = '800 17px ' + monoFont;
            scene.ctx.fillStyle = '#e5ddc7';
            scene.ctx.fillText(fc.text, fc.x + 1, fc.y + 1);
            scene.ctx.fillStyle = fc.color;
            scene.ctx.fillText(fc.text, fc.x, fc.y);

            if (fc.subtext) {
              scene.ctx.font = '700 11.5px ' + monoFont;
              scene.ctx.fillStyle = '#e2e8f0';
              scene.ctx.fillText(fc.subtext, fc.x, fc.y + 18);
            }
            scene.ctx.restore();
          }

          scene.ctx.restore();
        }
    return { drawNutBag, renderArena };
  }
  return { createRenderer };
});
