// Drawing only. The controller supplies live values through scene getters.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ToenowGameModules['space-scale'].renderer = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function createRenderer(scene) {
function drawMysteryParcel(ctx, body, x, y, time, isHovered, collapseFactor) {
          ctx.save();ctx.translate(x,y);
          // Display size stays independent of the hidden weight, exactly as before.
          const r=Math.max(6,body.visualRadius*(collapseFactor===undefined?1:collapseFactor));
          ctx.fillStyle='#f2dfb9';ctx.strokeStyle=isHovered?'#ffffff':body.primaryColor;ctx.lineWidth=isHovered?4:2.5;
          ctx.beginPath();ctx.rect(-r*.83,-r*.84,r*1.66,r*1.68);ctx.fill();ctx.stroke();
          // A separate pattern and colour identify each parcel even without colour vision.
          ctx.save();ctx.beginPath();ctx.rect(-r*.78,-r*.79,r*1.56,r*1.58);ctx.clip();
          ctx.strokeStyle=body.primaryColor;ctx.fillStyle=body.primaryColor;ctx.lineWidth=2;
          const pattern = ['micro_hole','yellow_sun'].includes(body.archetype) ? 0 : ['neutron_star','nebula_bubble'].includes(body.archetype) ? 1 : body.archetype ? 2 : (body.keyIndex-1)%3;
          for(let i=-2;i<=2;i++) {
            if(pattern===0){ctx.beginPath();ctx.moveTo(-r,r*i*.45-r);ctx.lineTo(r,r*i*.45+r);ctx.stroke();}
            else if(pattern===1){for(let j=-2;j<=2;j++){ctx.beginPath();ctx.arc(i*r*.38,j*r*.38,r*.065,0,Math.PI*2);ctx.fill();}}
            else {ctx.beginPath();ctx.moveTo(i*r*.38,-r);ctx.lineTo(i*r*.38,r);ctx.moveTo(-r,i*r*.38);ctx.lineTo(r,i*r*.38);ctx.stroke();}
          }
          ctx.restore();
          // Crossed packing twine and a large unambiguous identifying tag.
          ctx.strokeStyle='#9b7551';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r*.84);ctx.lineTo(0,r*.84);ctx.moveTo(-r*.83,0);ctx.lineTo(r*.83,0);ctx.stroke();
          ctx.fillStyle='#fff9e9';ctx.beginPath();ctx.arc(0,0,r*.45,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#473c31';ctx.font='bold '+Math.round(r*.65)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(body.symbol,0,1);
          ctx.restore();
        }
function drawAsteroid(ctx, x, y, time, scaleFactor) {
          ctx.save();
          ctx.translate(x, y);
          const sf = scaleFactor || 1;
          const r = 16 * sf;
          // Shaded grey rocky sphere with craters (no text label)
          const grad = ctx.createRadialGradient(-4 * sf, -4 * sf, 2 * sf, 0, 0, r);
          grad.addColorStop(0, '#cbd5e1');
          grad.addColorStop(0.6, '#64748b');
          grad.addColorStop(1, '#334155');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Craters
          ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
          ctx.beginPath();
          ctx.arc(-4 * sf, -2 * sf, 3.5 * sf, 0, Math.PI * 2);
          ctx.arc(5 * sf, 4 * sf, 4 * sf, 0, Math.PI * 2);
          ctx.arc(-2 * sf, 7 * sf, 2.5 * sf, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
function drawScale(
          ctx,
          scale,
          slotCx,
          slotCy,
          baseBeamHalf,
          bodiesById,
          time,
          recordTargets,
          scaleIndex,
          scaleFactor
        ) {
          const sf = scaleFactor || 1;
          const angle = scale.currentAngle;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          // Every comparison uses the same arm length on both sides.
          const leftArmLen = baseBeamHalf;
          const rightArmLen = baseBeamHalf;
          const cx = slotCx;
          const cy = slotCy;

          const leftPivotX = cx - cosA * leftArmLen;
          const leftPivotY = cy - sinA * leftArmLen;
          const rightPivotX = cx + cosA * rightArmLen;
          const rightPivotY = cy + sinA * rightArmLen;

          ctx.save();

          // Degree arc & pedestal
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 38 * sf, Math.PI * 0.15, Math.PI * 0.85);
          ctx.stroke();

          const pillarH = Math.min(82, scene.canvasHeight * 0.11) * sf;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 3 * sf;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + pillarH);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 2 * sf;
          ctx.beginPath();
          ctx.moveTo(cx - 26 * sf, cy + pillarH);
          ctx.lineTo(cx + 26 * sf, cy + pillarH);
          ctx.stroke();

          // Balance Beam
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 4 * sf;
          ctx.beginPath();
          ctx.moveTo(leftPivotX, leftPivotY);
          ctx.lineTo(rightPivotX, rightPivotY);
          ctx.stroke();

          // Central Fulcrum Node
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 8 * sf, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Pans
          const panDrop = 74 * sf;
          const pans = [
            {
              x: leftPivotX,
              y: leftPivotY + panDrop,
              pivotY: leftPivotY,
              items: scale.leftItems,
              isHeavier: scale.leftTorque > scale.rightTorque,
            },
            {
              x: rightPivotX,
              y: rightPivotY + panDrop,
              pivotY: rightPivotY,
              items: scale.rightItems,
              isHeavier: scale.rightTorque > scale.leftTorque,
            },
          ];

          pans.forEach((pan) => {
            const count = pan.items.length;
            const panWidth = (count > 1 ? 142 : 84) * sf;

            ctx.strokeStyle = pan.isHeavier
              ? 'rgba(56, 189, 248, 0.42)'
              : 'rgba(148, 163, 184, 0.25)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(pan.x, pan.pivotY + 5);
            ctx.lineTo(pan.x, pan.y);
            ctx.stroke();
            ctx.setLineDash([]);

            if (pan.isHeavier) {
              ctx.save();
              ctx.scale(1, 0.32);
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
              ctx.lineWidth = 1.5;
              const rippleR = (24 + ((time * 22) % 20)) * sf;
              ctx.beginPath();
              ctx.arc(pan.x, (pan.y + 10 * sf) / 0.32, rippleR, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }

            pan.items.forEach((item, idx) => {
              const itemScale = (count > 1 ? 0.72 : 1) * sf;
              const offsetX = count === 1 ? 0 : (idx - (count - 1) / 2) * 70 * sf;
              const ix = pan.x + offsetX;

              if (item.type === 'asteroid') {
                const iy = pan.y - 20 * sf;
                drawAsteroid(ctx, ix, iy, time, itemScale);
              } else {
                const body = bodiesById[item.bodyId || item.id];
                if (!body) return;
                const drawnR = body.visualRadius * itemScale;
                const iy = pan.y - drawnR - 10 * sf;

                let collapseFactor = itemScale;
                if (scene.collapseAnim && scene.collapseAnim.bodyId === body.id) {
                  collapseFactor = itemScale * Math.max(0.05, 1 - scene.collapseAnim.progress * 1.4);
                }

                const isHovered = scene.hoveredBodyId === body.id;
                drawMysteryParcel(
                  ctx,
                  body,
                  ix,
                  iy,
                  time,
                  isHovered,
                  collapseFactor
                );

                if (recordTargets) {
                  scene.renderedBodyTargets.push({
                    bodyId: body.id,
                    x: ix,
                    y: iy,
                    hitRadius: Math.max(44, drawnR + 22),
                  });
                }
              }
            });

            // Cradle dish
            ctx.strokeStyle = pan.isHeavier ? '#38bdf8' : '#64748b';
            ctx.lineWidth = pan.isHeavier ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(pan.x - panWidth * 0.55, pan.y - 6 * sf);
            ctx.lineTo(pan.x - panWidth * 0.45, pan.y);
            ctx.lineTo(pan.x + panWidth * 0.45, pan.y);
            ctx.lineTo(pan.x + panWidth * 0.55, pan.y - 6 * sf);
            ctx.stroke();
          });

          ctx.restore();
        }
    return { drawMysteryParcel, drawAsteroid, drawScale };
  }
  return { createRenderer };
});
