// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['ball-track'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function drawArenaBackground() {
          const { cx, cy, innerRadius, outerRadius } = scene.getPlayboardGeometry();
          const maxSpan = Math.max(scene.viewportWidth, scene.viewportHeight) * 1.6;

          const grad = scene.ctx.createRadialGradient(cx, cy, 10, cx, cy, outerRadius * 1.45);
          grad.addColorStop(0, '#c5ded4');
          grad.addColorStop(0.6, '#d8e7d8');
          grad.addColorStop(1, '#f0ecd9');
          scene.ctx.fillStyle = grad;
          scene.ctx.fillRect(cx - maxSpan * 0.5, cy - maxSpan * 0.5, maxSpan, maxSpan);

          scene.ctx.save();
          scene.ctx.translate(cx, cy);

          // Outer Strict 1:1 Circular Orbit Ring
          scene.ctx.strokeStyle = scene.state.isOverdrive ? 'rgba(255, 120, 73, 0.28)' : 'rgba(77, 116, 86, 0.35)';
          scene.ctx.lineWidth = 1.5;
          scene.ctx.beginPath();
          scene.ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
          scene.ctx.stroke();

          // Inner Strict 1:1 Circular Orbit Ring (Visible in Dual Concentric Waves 10+)
          if (scene.state.mode !== 'title' && scene.state.config && scene.state.config.isDualRing) {
            scene.ctx.strokeStyle = scene.state.isOverdrive ? 'rgba(251, 191, 36, 0.32)' : 'rgba(20, 184, 166, 0.26)';
            scene.ctx.lineWidth = 1.5;
            scene.ctx.setLineDash([6, 6]);
            scene.ctx.beginPath();
            scene.ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
            scene.ctx.stroke();
            scene.ctx.setLineDash([]);
          }

          scene.ctx.restore();

          if (scene.state.mode !== 'title') {
            const slots = scene.computeLiveSlotCoordinates();
            const R = scene.getCapsuleRadius();
            const slotR = R + 5;
            for (let i = 0; i < slots.length; i++) {
              const shellAtSlot = scene.state.shells.find((s) => s.slotIndex === i);
              const isPendingTargetSlot =
                (scene.state.phase === 'lineup' || scene.state.phase === 'insert' || scene.state.phase === 'wave_ready') &&
                shellAtSlot &&
                shellAtSlot.hasCore;

              scene.ctx.save();
              if (isPendingTargetSlot) {
                scene.ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
                scene.ctx.lineWidth = 1.6;
                scene.ctx.setLineDash([4, 4]);
              } else {
                scene.ctx.strokeStyle = slots[i].ring === 'inner'
                  ? 'rgba(20, 184, 166, 0.18)'
                  : 'rgba(148, 163, 184, 0.15)';
                scene.ctx.lineWidth = 1;
              }
              scene.ctx.beginPath();
              scene.ctx.arc(slots[i].x, slots[i].y, slotR, 0, Math.PI * 2);
              scene.ctx.stroke();
              scene.ctx.restore();
            }
          }
        }
function drawTargetLineupPanel() {
          if (scene.state.mode !== 'playing') return;
          if (scene.state.phase !== 'lineup' && scene.state.phase !== 'insert' && scene.state.phase !== 'wave_ready') return;

          const { queueX, panelW, isMobile } = scene.getPlayboardGeometry();
          const targetCount = scene.state.config.targetCount;
          const lineupCoords = scene.computeTargetLineupPositions(targetCount);
          const R = scene.getCapsuleRadius();

          const fadeAlpha =
            scene.state.phase === 'insert'
              ? Math.max(0, 1 - scene.state.phaseElapsedMs / Math.max(1, scene.state.phaseDurationMs * 0.9))
              : 1;

          const topY = lineupCoords[0].y - R - (isMobile ? 30 : 36);
          const bottomY = lineupCoords[lineupCoords.length - 1].y + R + 14;
          const panelH = Math.max(82, bottomY - topY);
          const panelX = Math.min(scene.viewportWidth - panelW - 6, queueX - panelW * 0.5);

          scene.ctx.save();
          scene.ctx.globalAlpha = fadeAlpha;

          scene.ctx.fillStyle = '#fffaf0';
          scene.ctx.strokeStyle = '#8eb6a8';
          scene.ctx.lineWidth = 1.5;
          scene.ctx.beginPath();
          scene.ctx.roundRect(panelX, topY, panelW, panelH, 10);
          scene.ctx.fill();
          scene.ctx.stroke();

          scene.ctx.font = isMobile ? '800 10px "Outfit", sans-serif' : '800 12px "Outfit", sans-serif';
          scene.ctx.fillStyle = '#355f53';
          scene.ctx.textAlign = 'center';
          scene.ctx.fillText(typeof window!=='undefined'?(window.ToenowI18n?.t('Find the otter')||'Find the otter'):'Find the otter', panelX + panelW * 0.5, topY + 20);

          // Draw queue cradle rings & curved Bezier insertion preview arcs
          for (let i = 0; i < lineupCoords.length; i++) {
            const pt = lineupCoords[i];
            scene.ctx.strokeStyle = 'rgba(82, 127, 113, 0.35)';
            scene.ctx.lineWidth = 1.2;
            scene.ctx.beginPath();
            scene.ctx.arc(pt.x, pt.y, R + 4, 0, Math.PI * 2);
            scene.ctx.stroke();
          }

          for (const s of scene.state.shells) {
            if (!s.hasCore) continue;
            const cpx = (s.lineupX + s.baseX) * 0.5 - 34;
            const cpy = (s.lineupY + s.baseY) * 0.5 - 16;
            scene.ctx.save();
            scene.ctx.strokeStyle = scene.state.phase === 'insert'
              ? 'rgba(82, 127, 113, 0.42)'
              : 'rgba(82, 127, 113, 0.18)';
            scene.ctx.lineWidth = 1.4;
            scene.ctx.setLineDash([4, 5]);
            scene.ctx.beginPath();
            scene.ctx.moveTo(s.lineupX, s.lineupY);
            scene.ctx.quadraticCurveTo(cpx, cpy, s.baseX, s.baseY);
            scene.ctx.stroke();
            scene.ctx.restore();
          }

          scene.ctx.restore();
        }
function drawTrajectoryArcs() {
          if (scene.state.mode !== 'playing' || scene.state.phase !== 'shuffle' || !scene.state.activeSwap) return;
          const active = scene.state.activeSwap;
          if (!active.liveCurve) return;
          const lc = active.liveCurve;

          const baseAlpha = active.isDecelerationStep ? 0.28 : 0.15;
          const colorA = scene.state.isOverdrive
            ? `rgba(255, 120, 73, ${baseAlpha})`
            : active.isRadialHop
              ? `rgba(20, 184, 166, ${baseAlpha + 0.08})`
              : `rgba(56, 189, 248, ${baseAlpha})`;

          scene.ctx.save();
          scene.ctx.lineWidth = active.isDecelerationStep ? 2.2 : 1.5;
          scene.ctx.setLineDash([5, 6]);

          scene.ctx.strokeStyle = colorA;
          scene.ctx.beginPath();
          scene.ctx.moveTo(lc.startAX, lc.startAY);
          scene.ctx.quadraticCurveTo(lc.cpAX, lc.cpAY, lc.endAX, lc.endAY);
          scene.ctx.stroke();

          scene.ctx.beginPath();
          scene.ctx.moveTo(lc.startBX, lc.startBY);
          scene.ctx.quadraticCurveTo(lc.cpBX, lc.cpBY, lc.endBX, lc.endBY);
          scene.ctx.stroke();

          scene.ctx.setLineDash([]);
          if (active.isDecelerationStep) {
            const R = scene.getCapsuleRadius();
            scene.ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
            scene.ctx.lineWidth = 1.5;
            scene.ctx.beginPath();
            scene.ctx.arc(lc.endAX, lc.endAY, R + 7, 0, Math.PI * 2);
            scene.ctx.stroke();
            scene.ctx.beginPath();
            scene.ctx.arc(lc.endBX, lc.endBY, R + 7, 0, Math.PI * 2);
            scene.ctx.stroke();
          }
          scene.ctx.restore();
        }
function drawShellTrail(shell) {
          if (shell.trail.length < 2) return;
          scene.ctx.save();
          scene.ctx.lineCap = 'round';
          scene.ctx.lineJoin = 'round';

          const trailRGB = scene.state.isOverdrive ? '255, 120, 73' : '34, 211, 238';
          const R = scene.getCapsuleRadius();
          for (let i = 0; i < shell.trail.length - 1; i++) {
            const p0 = shell.trail[i];
            const p1 = shell.trail[i + 1];
            const ratio = 1 - i / shell.trail.length;
            scene.ctx.strokeStyle = `rgba(${trailRGB}, ${ratio * 0.32})`;
            scene.ctx.lineWidth = R * 0.48 * ratio;
            scene.ctx.beginPath();
            scene.ctx.moveTo(p0.x, p0.y);
            scene.ctx.lineTo(p1.x, p1.y);
            scene.ctx.stroke();
          }
          scene.ctx.restore();
        }
function drawShellCapsule(shell, timeSec) {
          const R = scene.getCapsuleRadius();
          // Covered leaves have identical paint, veins and orientation regardless of contents.
          // Residual shutter animation must never disclose identity in shuffle/select.
          const revealPhase = scene.state.mode === 'title' || ['lineup', 'wave_ready', 'insert','memorize'].includes(scene.state.phase);
          const revealed = shell.revealedState === 'correct' || shell.revealedState === 'missed';
          const visibleOtter = shell.hasCore && shell.shieldOpen > 0.15 && (revealPhase || revealed);
          scene.ctx.save();scene.ctx.translate(shell.x, shell.y);scene.ctx.scale(shell.scaleX, shell.scaleY);
          scene.ctx.fillStyle = 'rgba(63, 103, 94, .15)';
          scene.ctx.beginPath();scene.ctx.arc(0,R*.22,R*1.08,0,Math.PI*2);scene.ctx.fill();
          scene.ctx.fillStyle = '#88a979';scene.ctx.strokeStyle = '#4d7456';scene.ctx.lineWidth = 2;
          scene.ctx.beginPath();scene.ctx.moveTo(-R*.9,R*.55);
          scene.ctx.quadraticCurveTo(-R*1.25,-R*.8,R*.72,-R*.88);
          scene.ctx.quadraticCurveTo(R*1.25,R*.68,-R*.9,R*.55);scene.ctx.fill();scene.ctx.stroke();
          scene.ctx.strokeStyle = '#c2cda1';scene.ctx.lineWidth = 1.4;
          scene.ctx.beginPath();scene.ctx.moveTo(-R*.72,R*.42);scene.ctx.lineTo(R*.58,-R*.68);
          for(let i=0;i<3;i++) {
            const v=-R*.35+i*R*.28;
            scene.ctx.moveTo(v,-v*.8);scene.ctx.lineTo(v-R*.28,-v*.8-R*.28);
            scene.ctx.moveTo(v,-v*.8);scene.ctx.lineTo(v+R*.3,-v*.8+R*.18);
          }
          scene.ctx.stroke();
          if(visibleOtter) {
            scene.ctx.fillStyle='#e6edcd';scene.ctx.beginPath();scene.ctx.arc(0,0,R*.72,0,Math.PI*2);scene.ctx.fill();
            if(window.ToenowAnimals && window.ToenowAnimals.drawAnimal) {
              window.ToenowAnimals.drawAnimal(scene.ctx,'otter',0,0,R*1.35);
            } else {
              scene.ctx.fillStyle='#956d4c';scene.ctx.beginPath();scene.ctx.arc(0,0,R*.48,0,Math.PI*2);scene.ctx.fill();
              scene.ctx.fillStyle='#f0dfba';scene.ctx.beginPath();scene.ctx.arc(0,R*.15,R*.3,0,Math.PI*2);scene.ctx.fill();
              scene.ctx.fillStyle='#382f27';scene.ctx.beginPath();scene.ctx.arc(-R*.18,-R*.08,2,0,Math.PI*2);scene.ctx.arc(R*.18,-R*.08,2,0,Math.PI*2);scene.ctx.fill();
            }
          }
          if(shell.revealedState==='wrong') {
            scene.ctx.strokeStyle='#a34f42';scene.ctx.lineWidth=3;
            scene.ctx.beginPath();scene.ctx.moveTo(-R*.23,-R*.23);scene.ctx.lineTo(R*.23,R*.23);
            scene.ctx.moveTo(R*.23,-R*.23);scene.ctx.lineTo(-R*.23,R*.23);scene.ctx.stroke();
          }
          scene.ctx.restore();
        }
function drawParticlesAndPopups() {
          for (let i = 0; i < scene.MAX_PARTICLES; i++) {
            const p = scene.particlePool[i];
            if (!p.active) continue;
            scene.ctx.save();
            scene.ctx.globalAlpha = p.alpha;
            if (p.kind === 'ring') {
              scene.ctx.strokeStyle = p.color;
              scene.ctx.lineWidth = 2.5;
              scene.ctx.beginPath();
              scene.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              scene.ctx.stroke();
            } else if (p.kind === 'shard') {
              scene.ctx.translate(p.x, p.y);
              scene.ctx.rotate(p.rotation);
              scene.ctx.fillStyle = p.color;
              scene.ctx.beginPath();
              scene.ctx.moveTo(0, -p.size);
              scene.ctx.lineTo(p.size * 0.75, p.size);
              scene.ctx.lineTo(-p.size * 0.75, p.size);
              scene.ctx.closePath();
              scene.ctx.fill();
            } else {
              scene.ctx.fillStyle = p.color;
              scene.ctx.beginPath();
              scene.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              scene.ctx.fill();
            }
            scene.ctx.restore();
          }

          for (const pop of scene.floatingPopups) {
            const alpha = Math.max(0, Math.min(1, pop.life / pop.maxLife));
            scene.ctx.save();
            scene.ctx.globalAlpha = alpha;
            scene.ctx.textAlign = 'center';
            scene.ctx.font = '800 18px "JetBrains Mono", monospace';
            scene.ctx.fillStyle = pop.color;
            scene.ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            scene.ctx.shadowBlur = 8;
            scene.ctx.fillText(pop.text, pop.x, pop.y);

            if (pop.subtext) {
              scene.ctx.font = '700 10px "Space Grotesk", sans-serif';
              scene.ctx.fillStyle = '#f8fafc';
              scene.ctx.fillText(pop.subtext, pop.x, pop.y + 14);
            }
            scene.ctx.restore();
          }
        }
function renderScene(timeSec) {
          // Complete frame wipe every tick to guarantee zero smearing or ghosting
          scene.ctx.clearRect(0, 0, scene.viewportWidth, scene.viewportHeight);
          scene.ctx.fillStyle = '#0a0a12';
          scene.ctx.fillRect(0, 0, scene.viewportWidth, scene.viewportHeight);

          scene.ctx.save();
          if (scene.state.trauma > 0.001) {
            const shake = scene.state.trauma * scene.state.trauma * 10;
            const ox = (Math.random() - 0.5) * 2 * shake;
            const oy = (Math.random() - 0.5) * 2 * shake;
            scene.ctx.translate(ox, oy);
          }

          drawArenaBackground();
          drawTargetLineupPanel();
          drawTrajectoryArcs();

          for (const s of scene.state.shells) {
            drawShellTrail(s);
          }
          for (const s of scene.state.shells) {
            drawShellCapsule(s, timeSec);
          }

          drawParticlesAndPopups();
          scene.ctx.restore();
        }
    return { drawArenaBackground, drawTargetLineupPanel, drawTrajectoryArcs, drawShellTrail, drawShellCapsule, drawParticlesAndPopups, renderScene };
  }
  return { createRenderer };
});
