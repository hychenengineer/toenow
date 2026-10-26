// shapes: game-specific code. See README.md for responsibilities and load order.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    const games = root.ToenowGameModules = root.ToenowGameModules || {};
    const game = games['spot-quick'] = games['spot-quick'] || {};
    game.shapes = factory(root);
  }
})(typeof window !== 'undefined' ? window : globalThis, function (window) {
  'use strict';
function cutout(ctx, drawFn) {
          ctx.save();
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "#000";
          ctx.strokeStyle = "#000";
          drawFn();
          ctx.restore();
        }

        const SPECIMEN_POOL = [
          // ---------------- 1. LAND (4) ----------------
          {
            id: "CAT",
            cluster: "LAND",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-6, 30, 34, 48, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-6, -28, 30, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-34, -40);
              ctx.lineTo(-28, -78);
              ctx.lineTo(-8, -54);
              ctx.closePath();
              ctx.moveTo(22, -40);
              ctx.lineTo(16, -78);
              ctx.lineTo(-4, -54);
              ctx.closePath();
              ctx.fill();
              ctx.save();
              ctx.lineCap = "round";
              ctx.lineWidth = 14;
              ctx.strokeStyle = ctx.fillStyle;
              ctx.beginPath();
              ctx.moveTo(20, 64);
              ctx.bezierCurveTo(68, 64, 72, 6, 48, -10);
              ctx.stroke();
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(-32, -26);
              ctx.lineTo(-64, -32);
              ctx.moveTo(-32, -20);
              ctx.lineTo(-66, -18);
              ctx.moveTo(20, -26);
              ctx.lineTo(52, -32);
              ctx.moveTo(20, -20);
              ctx.lineTo(54, -18);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(-17, -30, 5, 7, -0.15, 0, Math.PI * 2);
                ctx.ellipse(5, -30, 5, 7, 0.15, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "RABBIT",
            cluster: "LAND",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-6, 34, 38, 42, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-18, -14, 26, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(-26, -58, 10, 32, -0.12, 0, Math.PI * 2);
              ctx.ellipse(-6, -58, 10, 32, 0.15, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(36, 48, 16, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-26, -18, 6, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "ELEPHANT",
            cluster: "LAND",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(18, 12, 48, 38, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-18, 28, 18, 46);
              ctx.fillRect(6, 28, 18, 46);
              ctx.fillRect(30, 28, 18, 46);
              ctx.fillRect(50, 28, 16, 46);
              ctx.beginPath();
              ctx.arc(-32, -8, 28, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 15;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-52, -4);
              ctx.bezierCurveTo(-80, 10, -84, 54, -56, 54);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-40, -14, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 4.5;
                ctx.beginPath();
                ctx.arc(-12, -6, 20, -1.1, 1.3);
                ctx.stroke();
              });
            }
          },
          {
            id: "BEAR",
            cluster: "LAND",
            render: function (ctx) {
              // Round bear face & bust
              ctx.beginPath();
              ctx.arc(0, 8, 52, 0, Math.PI * 2);
              ctx.fill();
              // Two round bear ears
              ctx.beginPath();
              ctx.arc(-42, -38, 22, 0, Math.PI * 2);
              ctx.arc(42, -38, 22, 0, Math.PI * 2);
              ctx.fill();
              // Shoulders
              ctx.beginPath();
              ctx.ellipse(0, 68, 58, 26, 0, Math.PI, 0, false);
              ctx.fill();
              cutout(ctx, function () {
                // Inner ear circles
                ctx.beginPath();
                ctx.arc(-42, -38, 9, 0, Math.PI * 2);
                ctx.arc(42, -38, 9, 0, Math.PI * 2);
                // Eyes
                ctx.arc(-20, -6, 6, 0, Math.PI * 2);
                ctx.arc(20, -6, 6, 0, Math.PI * 2);
                ctx.fill();
                // Snout ring & nose
                ctx.lineWidth = 4.5;
                ctx.beginPath();
                ctx.ellipse(0, 18, 20, 15, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(0, 13, 8, 5, 0, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 2. SEA (4) ----------------
          {
            id: "FISH",
            cluster: "SEA",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-12, 0, 56, 36, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(34, 0);
              ctx.lineTo(84, -44);
              ctx.lineTo(68, 0);
              ctx.lineTo(84, 44);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-22, -32);
              ctx.quadraticCurveTo(4, -68, 20, -28);
              ctx.closePath();
              ctx.moveTo(-10, 32);
              ctx.quadraticCurveTo(10, 62, 22, 26);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-44, -8, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.arc(-20, 0, 22, -0.7, 0.7);
                ctx.stroke();
              });
            }
          },
          {
            id: "OCTOPUS",
            cluster: "SEA",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, -26, 42, 46, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 13;
              ctx.lineCap = "round";
              const paths = [
                [[-24, 10], [-68, 28], [-76, 62]],
                [[-14, 14], [-42, 52], [-48, 78]],
                [[0, 16], [-10, 58], [-14, 82]],
                [[14, 14], [18, 58], [22, 82]],
                [[24, 10], [48, 50], [56, 76]],
                [[30, 4], [70, 26], [78, 58]]
              ];
              for (let i = 0; i < paths.length; i++) {
                const p = paths[i];
                ctx.beginPath();
                ctx.moveTo(p[0][0], p[0][1]);
                ctx.quadraticCurveTo(p[1][0], p[1][1], p[2][0], p[2][1]);
                ctx.stroke();
              }
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-16, -18, 7, 0, Math.PI * 2);
                ctx.arc(16, -18, 7, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "CRAB",
            cluster: "SEA",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 12, 48, 30, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 11;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-30, -8);
              ctx.lineTo(-48, -40);
              ctx.moveTo(30, -8);
              ctx.lineTo(48, -40);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.arc(-52, -56, 20, 0, Math.PI * 2);
              ctx.arc(52, -56, 20, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 8;
              ctx.lineCap = "round";
              for (let i = 0; i < 3; i++) {
                const y = 2 + i * 14;
                ctx.beginPath();
                ctx.moveTo(-42, y);
                ctx.lineTo(-76, y + 12);
                ctx.lineTo(-82, y + 28);
                ctx.moveTo(42, y);
                ctx.lineTo(76, y + 12);
                ctx.lineTo(82, y + 28);
                ctx.stroke();
              }
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.moveTo(-52, -56);
                ctx.lineTo(-40, -78);
                ctx.lineTo(-64, -78);
                ctx.closePath();
                ctx.moveTo(52, -56);
                ctx.lineTo(40, -78);
                ctx.lineTo(64, -78);
                ctx.closePath();
                ctx.arc(-16, -4, 5, 0, Math.PI * 2);
                ctx.arc(16, -4, 5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "STARFISH",
            cluster: "SEA",
            render: function (ctx) {
              // 5-pointed starfish
              ctx.beginPath();
              const spikes = 5;
              const outerR = 84;
              const innerR = 34;
              for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const ang = (i * Math.PI) / spikes - Math.PI / 2;
                const x = Math.cos(ang) * r;
                const y = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                for (let i = 0; i < 5; i++) {
                  const ang = (i * Math.PI * 2) / 5 - Math.PI / 2;
                  ctx.moveTo(Math.cos(ang) * 38, Math.sin(ang) * 38);
                  ctx.arc(Math.cos(ang) * 38, Math.sin(ang) * 38, 5, 0, Math.PI * 2);
                }
                ctx.fill();
              });
            }
          },

          // ---------------- 3. SKY (4) ----------------
          {
            id: "OWL",
            cluster: "SKY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 18, 46, 56, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -32, 38, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-36, -46);
              ctx.lineTo(-48, -78);
              ctx.lineTo(-16, -62);
              ctx.closePath();
              ctx.moveTo(36, -46);
              ctx.lineTo(48, -78);
              ctx.lineTo(16, -62);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-18, 74, 10, 0, Math.PI * 2);
              ctx.arc(18, 74, 10, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(-16, -32, 13, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(16, -32, 13, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -24);
                ctx.lineTo(-7, -14);
                ctx.lineTo(0, -4);
                ctx.lineTo(7, -14);
                ctx.closePath();
                ctx.fill();
              });
            }
          },
          {
            id: "DUCK",
            cluster: "SKY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(10, 28, 54, 34, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(46, 10);
              ctx.lineTo(78, -14);
              ctx.lineTo(62, 34);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-28, -28, 26, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-42, -16, 34, 34);
              ctx.beginPath();
              ctx.ellipse(-64, -24, 20, 9, 0.08, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-34, -32, 5.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.arc(12, 24, 24, 0.2, Math.PI - 0.3);
                ctx.stroke();
              });
            }
          },
          {
            id: "PENGUIN",
            cluster: "SKY",
            render: function (ctx) {
              // Upright penguin body
              ctx.beginPath();
              ctx.ellipse(0, 14, 42, 60, 0, 0, Math.PI * 2);
              ctx.fill();
              // Head
              ctx.beginPath();
              ctx.arc(0, -44, 30, 0, Math.PI * 2);
              ctx.fill();
              // Side flippers
              ctx.beginPath();
              ctx.ellipse(-44, 14, 12, 36, 0.28, 0, Math.PI * 2);
              ctx.ellipse(44, 14, 12, 36, -0.28, 0, Math.PI * 2);
              ctx.fill();
              // Feet
              ctx.beginPath();
              ctx.ellipse(-18, 74, 14, 8, 0, 0, Math.PI * 2);
              ctx.ellipse(18, 74, 14, 8, 0, 0, Math.PI * 2);
              ctx.fill();
              // Belly, eyes & beak cutout
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(0, 24, 24, 40, 0, 0, Math.PI * 2);
                ctx.arc(-11, -48, 4.5, 0, Math.PI * 2);
                ctx.arc(11, -48, 4.5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "SWAN",
            cluster: "SKY",
            render: function (ctx) {
              // Floating swan body & raised wing feathers
              ctx.beginPath();
              ctx.ellipse(16, 36, 52, 28, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(24, 14, 34, Math.PI * 0.9, Math.PI * 1.95);
              ctx.fill();
              // Long graceful S-curve neck
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-22, 30);
              ctx.bezierCurveTo(-52, 10, -14, -46, -42, -62);
              ctx.stroke();
              ctx.restore();
              // Head & beak
              ctx.beginPath();
              ctx.arc(-46, -60, 13, 0, Math.PI * 2);
              ctx.moveTo(-56, -64);
              ctx.lineTo(-76, -56);
              ctx.lineTo(-56, -52);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.lineWidth = 4.5;
                ctx.beginPath();
                ctx.arc(20, 24, 22, -0.4, Math.PI * 0.8);
                ctx.stroke();
              });
            }
          },

          // ---------------- 4. BUGS (4) ----------------
          {
            id: "BUTTERFLY",
            cluster: "BUGS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-40, -24, 42, 30, -0.45, 0, Math.PI * 2);
              ctx.ellipse(40, -24, 42, 30, 0.45, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(-32, 32, 30, 26, 0.4, 0, Math.PI * 2);
              ctx.ellipse(32, 32, 30, 26, -0.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(0, 4, 8, 52, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 4;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-3, -44);
              ctx.quadraticCurveTo(-18, -76, -34, -74);
              ctx.moveTo(3, -44);
              ctx.quadraticCurveTo(18, -76, 34, -74);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-44, -26, 12, 0, Math.PI * 2);
                ctx.arc(44, -26, 12, 0, Math.PI * 2);
                ctx.arc(-32, 32, 8, 0, Math.PI * 2);
                ctx.arc(32, 32, 8, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "SNAIL",
            cluster: "BUGS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(14, -6, 44, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(-8, 40, 66, 16, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-58, 24, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-64, 12);
              ctx.lineTo(-76, -18);
              ctx.moveTo(-52, 12);
              ctx.lineTo(-56, -20);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.arc(-76, -20, 6, 0, Math.PI * 2);
              ctx.arc(-56, -22, 6, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.lineWidth = 5;
                ctx.lineCap = "round";
                ctx.beginPath();
                for (let t = 0; t < Math.PI * 3.5; t += 0.15) {
                  const rad = 3.2 * t;
                  const sx = 14 + Math.cos(t) * rad;
                  const sy = -6 + Math.sin(t) * rad;
                  if (t === 0) ctx.moveTo(sx, sy);
                  else ctx.lineTo(sx, sy);
                }
                ctx.stroke();
              });
            }
          },
          {
            id: "LADYBUG",
            cluster: "BUGS",
            render: function (ctx) {
              // Round domed body
              ctx.beginPath();
              ctx.arc(0, 12, 52, 0, Math.PI * 2);
              ctx.fill();
              // Head
              ctx.beginPath();
              ctx.arc(0, -44, 24, 0, Math.PI * 2);
              ctx.fill();
              // Antennae & 6 short legs
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-10, -60);
              ctx.lineTo(-24, -78);
              ctx.moveTo(10, -60);
              ctx.lineTo(24, -78);
              for (let i = -1; i <= 1; i++) {
                const y = 10 + i * 24;
                ctx.moveTo(-48, y);
                ctx.lineTo(-72, y + i * 8);
                ctx.moveTo(48, y);
                ctx.lineTo(72, y + i * 8);
              }
              ctx.stroke();
              ctx.restore();
              // Center wing split & 6 round spots cutout
              cutout(ctx, function () {
                ctx.lineWidth = 4.5;
                ctx.beginPath();
                ctx.moveTo(0, -34);
                ctx.lineTo(0, 66);
                ctx.stroke();
                const spots = [
                  [-24, -10], [24, -10],
                  [-30, 14], [30, 14],
                  [-20, 38], [20, 38]
                ];
                ctx.beginPath();
                for (let i = 0; i < spots.length; i++) {
                  ctx.moveTo(spots[i][0], spots[i][1]);
                  ctx.arc(spots[i][0], spots[i][1], 8, 0, Math.PI * 2);
                }
                ctx.fill();
              });
            }
          },
          {
            id: "BEE",
            cluster: "BUGS",
            render: function (ctx) {
              // Plump oval bee body
              ctx.beginPath();
              ctx.ellipse(0, 16, 38, 52, 0, 0, Math.PI * 2);
              ctx.fill();
              // Stinger at bottom
              ctx.beginPath();
              ctx.moveTo(-8, 64);
              ctx.lineTo(0, 84);
              ctx.lineTo(8, 64);
              ctx.closePath();
              ctx.fill();
              // Side wings
              ctx.beginPath();
              ctx.ellipse(-48, -6, 32, 18, -0.35, 0, Math.PI * 2);
              ctx.ellipse(48, -6, 32, 18, 0.35, 0, Math.PI * 2);
              ctx.fill();
              // Antennae
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 5;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-10, -34);
              ctx.lineTo(-24, -58);
              ctx.moveTo(10, -34);
              ctx.lineTo(24, -58);
              ctx.stroke();
              ctx.restore();
              // 3 bold horizontal bee stripes cutout
              cutout(ctx, function () {
                ctx.fillRect(-38, -2, 76, 10);
                ctx.fillRect(-38, 18, 76, 10);
                ctx.fillRect(-34, 38, 68, 10);
              });
            }
          },

          // ---------------- 5. REPTILE (4) ----------------
          {
            id: "TURTLE",
            cluster: "REPTILE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(6, 12, 52, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-46, 6, 104, 14);
              ctx.beginPath();
              ctx.ellipse(-64, 2, 20, 14, -0.15, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-36, 18, 18, 28);
              ctx.fillRect(22, 18, 18, 28);
              ctx.beginPath();
              ctx.moveTo(56, 10);
              ctx.lineTo(78, 18);
              ctx.lineTo(56, 20);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-70, -2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-42, 6);
                ctx.lineTo(54, 6);
                ctx.moveTo(-14, 6);
                ctx.lineTo(-22, -34);
                ctx.moveTo(22, 6);
                ctx.lineTo(28, -34);
                ctx.stroke();
              });
            }
          },
          {
            id: "FROG",
            cluster: "REPTILE",
            render: function (ctx) {
              // Wide frog head & body
              ctx.beginPath();
              ctx.ellipse(0, 16, 52, 42, 0, 0, Math.PI * 2);
              ctx.fill();
              // Two big bulging eyes on top of head
              ctx.beginPath();
              ctx.arc(-28, -28, 22, 0, Math.PI * 2);
              ctx.arc(28, -28, 22, 0, Math.PI * 2);
              ctx.fill();
              // Folded hind legs on sides
              ctx.beginPath();
              ctx.ellipse(-54, 34, 18, 28, -0.3, 0, Math.PI * 2);
              ctx.ellipse(54, 34, 18, 28, 0.3, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                // Big eye pupils & wide frog smile
                ctx.beginPath();
                ctx.arc(-28, -30, 9, 0, Math.PI * 2);
                ctx.arc(28, -30, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 5.5;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.arc(0, -2, 34, 0.25, Math.PI - 0.25);
                ctx.stroke();
              });
            }
          },
          {
            id: "SNAKE",
            cluster: "REPTILE",
            render: function (ctx) {
              // Coiled cobra hood & S-body
              ctx.beginPath();
              ctx.ellipse(0, -32, 38, 34, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 20;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(0, -4);
              ctx.bezierCurveTo(0, 34, 56, 26, 48, 56);
              ctx.bezierCurveTo(40, 78, -56, 74, -52, 48);
              ctx.stroke();
              // Forked tongue at top
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(0, -66);
              ctx.lineTo(0, -82);
              ctx.lineTo(-10, -90);
              ctx.moveTo(0, -82);
              ctx.lineTo(10, -90);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-14, -38, 5.5, 0, Math.PI * 2);
                ctx.arc(14, -38, 5.5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "DINO",
            cluster: "REPTILE",
            render: function (ctx) {
              // Classic long-neck Sauropod dinosaur
              ctx.beginPath();
              ctx.ellipse(8, 22, 42, 28, 0, 0, Math.PI * 2);
              ctx.fill();
              // Four legs
              ctx.fillRect(-24, 36, 16, 40);
              ctx.fillRect(-2, 36, 15, 40);
              ctx.fillRect(22, 36, 16, 40);
              // Long neck & head on left, tapering tail on right
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 18;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-22, 12);
              ctx.quadraticCurveTo(-44, -28, -42, -64);
              ctx.stroke();
              ctx.lineWidth = 14;
              ctx.beginPath();
              ctx.moveTo(42, 22);
              ctx.quadraticCurveTo(78, 30, 86, 8);
              ctx.stroke();
              ctx.restore();
              // Head snout
              ctx.beginPath();
              ctx.ellipse(-52, -64, 18, 12, 0, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-54, -66, 4, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 6. FLORA (4) ----------------
          {
            id: "CACTUS",
            cluster: "FLORA",
            render: function (ctx) {
              // Main vertical saguaro trunk + 2 raised side arms
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.lineWidth = 34;
              ctx.beginPath();
              ctx.moveTo(0, -68);
              ctx.lineTo(0, 74);
              ctx.stroke();
              ctx.lineWidth = 22;
              ctx.beginPath();
              ctx.moveTo(-16, 14);
              ctx.lineTo(-54, 14);
              ctx.lineTo(-54, -36);
              ctx.moveTo(16, -4);
              ctx.lineTo(54, -4);
              ctx.lineTo(54, -48);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(0, -64);
                ctx.lineTo(0, 68);
                ctx.stroke();
              });
            }
          },
          {
            id: "MUSHROOM",
            cluster: "FLORA",
            render: function (ctx) {
              // Wide dome toadstool cap
              ctx.beginPath();
              ctx.arc(0, 2, 68, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              // Rounded bottom of cap
              ctx.beginPath();
              ctx.ellipse(0, 2, 68, 14, 0, 0, Math.PI * 2);
              ctx.fill();
              // Sturdy stem
              ctx.beginPath();
              ctx.moveTo(-22, 8);
              ctx.lineTo(-28, 76);
              ctx.quadraticCurveTo(0, 86, 28, 76);
              ctx.lineTo(22, 8);
              ctx.closePath();
              ctx.fill();
              // Classic toadstool spots cutout
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -38, 12, 0, Math.PI * 2);
                ctx.arc(-36, -20, 10, 0, Math.PI * 2);
                ctx.arc(36, -20, 10, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "PINE TREE",
            cluster: "FLORA",
            render: function (ctx) {
              // 3-tier evergreen pine tree + trunk
              const tiers = [
                [-78, -42, 42, -16],
                [-46, -58, 58, 20],
                [-12, -74, 74, 54]
              ];
              for (let i = 0; i < tiers.length; i++) {
                const t = tiers[i];
                ctx.beginPath();
                ctx.moveTo(0, t[0]);
                ctx.lineTo(t[1], t[3]);
                ctx.lineTo(t[2], t[3]);
                ctx.closePath();
                ctx.fill();
              }
              ctx.fillRect(-14, 50, 28, 34);
            }
          },
          {
            id: "TULIP",
            cluster: "FLORA",
            render: function (ctx) {
              // Tulip cup head with 3 pointed petals
              ctx.beginPath();
              ctx.arc(0, -28, 38, 0, Math.PI, false);
              ctx.lineTo(-38, -68);
              ctx.lineTo(-14, -46);
              ctx.lineTo(0, -74);
              ctx.lineTo(14, -46);
              ctx.lineTo(38, -68);
              ctx.closePath();
              ctx.fill();
              // Stem
              ctx.fillRect(-6, 8, 12, 72);
              // Two side leaves
              ctx.beginPath();
              ctx.ellipse(-28, 48, 28, 12, 0.55, 0, Math.PI * 2);
              ctx.ellipse(28, 48, 28, 12, -0.55, 0, Math.PI * 2);
              ctx.fill();
            }
          },

          // ---------------- 7. FRUIT (4) ----------------
          {
            id: "APPLE",
            cluster: "FRUIT",
            render: function (ctx) {
              // Classic twin-lobed apple silhouette
              ctx.beginPath();
              ctx.arc(-18, 12, 40, 0, Math.PI * 2);
              ctx.arc(18, 12, 40, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(0, 32, 44, 34, 0, 0, Math.PI * 2);
              ctx.fill();
              // Stem & leaf at top
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 8;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(0, -22);
              ctx.quadraticCurveTo(2, -52, 12, -64);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.ellipse(-20, -48, 22, 10, 0.45, 0, Math.PI * 2);
              ctx.fill();
              // Highlight cutout
              cutout(ctx, function () {
                ctx.lineWidth = 6;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.arc(-20, 10, 22, Math.PI * 0.9, Math.PI * 1.35);
                ctx.stroke();
              });
            }
          },
          {
            id: "BANANA",
            cluster: "FRUIT",
            render: function (ctx) {
              // Iconic crescent banana curve
              ctx.beginPath();
              ctx.moveTo(-64, -52);
              ctx.bezierCurveTo(-52, 54, 24, 86, 76, 28);
              ctx.bezierCurveTo(34, 48, -18, 18, -42, -58);
              ctx.closePath();
              ctx.fill();
              // Stem tip
              ctx.fillRect(-66, -68, 18, 18);
            }
          },
          {
            id: "PINEAPPLE",
            cluster: "FRUIT",
            render: function (ctx) {
              // Oval pineapple body
              ctx.beginPath();
              ctx.ellipse(0, 22, 42, 50, 0, 0, Math.PI * 2);
              ctx.fill();
              // Spiky leaf crown on top
              ctx.beginPath();
              ctx.moveTo(0, -82);
              ctx.lineTo(-16, -24);
              ctx.lineTo(16, -24);
              ctx.closePath();
              ctx.moveTo(-36, -68);
              ctx.lineTo(-28, -22);
              ctx.lineTo(0, -24);
              ctx.closePath();
              ctx.moveTo(36, -68);
              ctx.lineTo(0, -24);
              ctx.lineTo(28, -22);
              ctx.closePath();
              ctx.fill();
              // Diamond cross-hatch cutout on body
              cutout(ctx, function () {
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-32, -6);
                ctx.lineTo(32, 50);
                ctx.moveTo(-36, 18);
                ctx.lineTo(18, 66);
                ctx.moveTo(-18, -22);
                ctx.lineTo(36, 26);
                ctx.moveTo(32, -6);
                ctx.lineTo(-32, 50);
                ctx.moveTo(36, 18);
                ctx.lineTo(-18, 66);
                ctx.moveTo(18, -22);
                ctx.lineTo(-36, 26);
                ctx.stroke();
              });
            }
          },
          {
            id: "CHERRY",
            cluster: "FRUIT",
            render: function (ctx) {
              // Two round cherries
              ctx.beginPath();
              ctx.arc(-34, 42, 28, 0, Math.PI * 2);
              ctx.arc(34, 42, 28, 0, Math.PI * 2);
              ctx.fill();
              // Twin stems joining at top
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 7;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-34, 18);
              ctx.quadraticCurveTo(-24, -34, 6, -68);
              ctx.moveTo(34, 18);
              ctx.quadraticCurveTo(28, -28, 6, -68);
              ctx.stroke();
              ctx.restore();
              // Top leaf
              ctx.beginPath();
              ctx.ellipse(30, -56, 24, 11, 0.35, 0, Math.PI * 2);
              ctx.fill();
              // Shine cutouts on cherries
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-42, 34, 6, 0, Math.PI * 2);
                ctx.arc(26, 34, 6, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 8. SPACE (4) ----------------
          {
            id: "ROCKET",
            cluster: "SPACE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -84);
              ctx.quadraticCurveTo(24, -40, 22, 28);
              ctx.lineTo(-22, 28);
              ctx.quadraticCurveTo(-24, -40, 0, -84);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-22, 10);
              ctx.lineTo(-64, 46);
              ctx.lineTo(-22, 46);
              ctx.closePath();
              ctx.moveTo(22, 10);
              ctx.lineTo(64, 46);
              ctx.lineTo(22, 46);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-14, 28, 28, 12);
              ctx.beginPath();
              ctx.moveTo(-12, 40);
              ctx.lineTo(0, 78);
              ctx.lineTo(12, 40);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -22, 12, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "PLANET",
            cluster: "SPACE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 46, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.beginPath();
              ctx.ellipse(0, 0, 84, 26, -0.42, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(0, 0, 72, 22, -0.42, 0, Math.PI * 2);
                ctx.stroke();
              });
            }
          },
          {
            id: "CRESCENT",
            cluster: "SPACE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-8, 0, 64, -Math.PI * 0.45, Math.PI * 0.45, false);
              ctx.arc(22, 0, 54, Math.PI * 0.4, -Math.PI * 0.4, true);
              ctx.closePath();
              ctx.fill();
              const sx = 44, sy = -28;
              ctx.beginPath();
              ctx.moveTo(sx, sy - 24);
              ctx.quadraticCurveTo(sx, sy, sx + 24, sy);
              ctx.quadraticCurveTo(sx, sy, sx, sy + 24);
              ctx.quadraticCurveTo(sx, sy, sx - 24, sy);
              ctx.quadraticCurveTo(sx, sy, sx, sy - 24);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "ASTRONAUT",
            cluster: "SPACE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -22, 44, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(0, 56, 54, 34, 0, Math.PI, 0, false);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(0, -22, 30, 20, 0, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 9. VEHICLE (4) ----------------
          {
            id: "CAR",
            cluster: "VEHICLE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-74, 30);
              ctx.lineTo(-76, 8);
              ctx.quadraticCurveTo(-46, 6, -34, -18);
              ctx.lineTo(24, -18);
              ctx.quadraticCurveTo(46, 8, 76, 12);
              ctx.lineTo(76, 30);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-42, 32, 18, 0, Math.PI * 2);
              ctx.arc(42, 32, 18, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-28, -14, 22, 16);
                ctx.fillRect(-2, -14, 24, 16);
                ctx.beginPath();
                ctx.arc(-42, 32, 7, 0, Math.PI * 2);
                ctx.arc(42, 32, 7, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "AIRPLANE",
            cluster: "VEHICLE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 0, 16, 76, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-84, 12);
              ctx.lineTo(0, -18);
              ctx.lineTo(84, 12);
              ctx.lineTo(84, 0);
              ctx.lineTo(0, -26);
              ctx.lineTo(-84, 0);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-36, 64);
              ctx.lineTo(0, 52);
              ctx.lineTo(36, 64);
              ctx.lineTo(36, 56);
              ctx.lineTo(0, 46);
              ctx.lineTo(-36, 56);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -54, 5.5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "SAILBOAT",
            cluster: "VEHICLE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-72, 34);
              ctx.lineTo(68, 34);
              ctx.quadraticCurveTo(54, 62, -48, 62);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-4, -72, 7, 106);
              ctx.beginPath();
              ctx.moveTo(6, -66);
              ctx.lineTo(62, 24);
              ctx.lineTo(6, 24);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-8, -58);
              ctx.lineTo(-58, 24);
              ctx.lineTo(-8, 24);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "BICYCLE",
            cluster: "VEHICLE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-52, 28, 28, 0, Math.PI * 2);
              ctx.arc(52, 28, 28, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-52, 28, 21, 0, Math.PI * 2);
                ctx.arc(52, 28, 21, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 7;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-52, 28);
              ctx.lineTo(0, 28);
              ctx.lineTo(38, -28);
              ctx.moveTo(0, 28);
              ctx.lineTo(-18, -22);
              ctx.lineTo(38, -22);
              ctx.moveTo(52, 28);
              ctx.lineTo(38, -28);
              ctx.lineTo(44, -44);
              ctx.lineTo(26, -44);
              ctx.moveTo(-18, -22);
              ctx.lineTo(-24, -34);
              ctx.lineTo(-8, -34);
              ctx.stroke();
              ctx.restore();
            }
          },

          // ---------------- 10. OBJECTS (4) ----------------
          {
            id: "BELL",
            cluster: "OBJECTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -66, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-20, -54);
              ctx.quadraticCurveTo(-26, 0, -62, 38);
              ctx.lineTo(62, 38);
              ctx.quadraticCurveTo(26, 0, 20, -54);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-66, 38, 132, 12);
              ctx.beginPath();
              ctx.arc(0, 56, 15, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -66, 6, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "KEY",
            cluster: "OBJECTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -48, 32, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-8, -20, 16, 92);
              ctx.fillRect(8, 38, 30, 14);
              ctx.fillRect(8, 60, 24, 12);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -48, 15, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "CUP",
            cluster: "OBJECTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-42, -18);
              ctx.lineTo(-38, 48);
              ctx.quadraticCurveTo(-36, 68, -14, 68);
              ctx.lineTo(14, 68);
              ctx.quadraticCurveTo(36, 68, 38, 48);
              ctx.lineTo(42, -18);
              ctx.closePath();
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.beginPath();
              ctx.arc(42, 16, 26, -Math.PI * 0.45, Math.PI * 0.45);
              ctx.stroke();
              ctx.lineWidth = 5;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-18, -26);
              ctx.quadraticCurveTo(-26, -46, -16, -68);
              ctx.moveTo(8, -26);
              ctx.quadraticCurveTo(0, -46, 12, -68);
              ctx.stroke();
              ctx.restore();
            }
          },
          {
            id: "ANCHOR",
            cluster: "OBJECTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -62, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-7, -46, 14, 94);
              ctx.fillRect(-48, -38, 96, 12);
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 16;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.arc(0, 12, 58, 0.2, Math.PI - 0.2);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.moveTo(-58, 20);
              ctx.lineTo(-76, 2);
              ctx.lineTo(-44, 2);
              ctx.closePath();
              ctx.moveTo(58, 20);
              ctx.lineTo(76, 2);
              ctx.lineTo(44, 2);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -62, 8, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 11. MUSIC (4) ----------------
          {
            id: "GUITAR",
            cluster: "MUSIC",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 36, 42, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -10, 30, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-24, -10);
              ctx.lineTo(24, -10);
              ctx.lineTo(38, 36);
              ctx.lineTo(-38, 36);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-6, -76, 12, 68);
              ctx.fillRect(-10, -88, 20, 14);
              ctx.fillRect(-16, -85, 6, 3);
              ctx.fillRect(-16, -78, 6, 3);
              ctx.fillRect(10, -85, 6, 3);
              ctx.fillRect(10, -78, 6, 3);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -6, 11, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "DRUM",
            cluster: "MUSIC",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, -22, 64, 18, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(0, 36, 64, 18, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-64, -22, 128, 58);
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.moveTo(-44, -18); ctx.lineTo(-30, 38);
              ctx.moveTo(-16, -16); ctx.lineTo(0, 42);
              ctx.moveTo(16, -16); ctx.lineTo(30, 38);
              ctx.moveTo(44, -18); ctx.lineTo(54, 34);
              ctx.stroke();
              ctx.lineWidth = 6;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-54, -72); ctx.lineTo(38, -32);
              ctx.moveTo(54, -72); ctx.lineTo(-38, -32);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(0, -22, 54, 12, 0, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "HEADPHONES",
            cluster: "MUSIC",
            render: function (ctx) {
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.arc(0, -10, 54, Math.PI, 0, false);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.ellipse(-54, 14, 16, 28, 0, 0, Math.PI * 2);
              ctx.ellipse(54, 14, 16, 28, 0, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(-54, 14, 8, 16, 0, 0, Math.PI * 2);
                ctx.ellipse(54, 14, 8, 16, 0, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "NOTE",
            cluster: "MUSIC",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-38, 42, 22, 16, -0.38, 0, Math.PI * 2);
              ctx.ellipse(32, 22, 22, 16, -0.38, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-22, -48, 8, 84);
              ctx.fillRect(48, -68, 8, 84);
              ctx.beginPath();
              ctx.moveTo(-24, -48);
              ctx.lineTo(56, -68);
              ctx.lineTo(56, -50);
              ctx.lineTo(-24, -30);
              ctx.closePath();
              ctx.fill();
            }
          },

          // ---------------- 12. TOOLS (4) ----------------
          {
            id: "HAMMER",
            cluster: "TOOLS",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.35);
              ctx.fillRect(-10, -20, 20, 100);
              ctx.beginPath();
              ctx.arc(0, 80, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-48, -48, 64, 28);
              ctx.beginPath();
              ctx.moveTo(16, -48);
              ctx.quadraticCurveTo(46, -44, 48, -14);
              ctx.lineTo(34, -20);
              ctx.quadraticCurveTo(34, -34, 16, -34);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          },
          {
            id: "WRENCH",
            cluster: "TOOLS",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(-0.55);
              ctx.fillRect(-11, -54, 22, 108);
              ctx.beginPath();
              ctx.arc(0, -54, 26, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, 54, 26, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-12, -78, 24, 30);
                ctx.fillRect(-12, 48, 24, 30);
              });
              ctx.restore();
            }
          },
          {
            id: "SCISSORS",
            cluster: "TOOLS",
            render: function (ctx) {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(-6, -10);
              ctx.lineTo(-14, -82);
              ctx.lineTo(-2, -82);
              ctx.lineTo(8, -6);
              ctx.closePath();
              ctx.moveTo(6, -10);
              ctx.lineTo(14, -82);
              ctx.lineTo(2, -82);
              ctx.lineTo(-8, -6);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -6, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-26, 42, 22, 0, Math.PI * 2);
              ctx.arc(26, 42, 22, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-26, 42, 12, 0, Math.PI * 2);
                ctx.arc(26, 42, 12, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.restore();
            }
          },
          {
            id: "SWORD",
            cluster: "TOOLS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -88);
              ctx.lineTo(12, -70);
              ctx.lineTo(12, 20);
              ctx.lineTo(-12, 20);
              ctx.lineTo(-12, -70);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-44, 20, 88, 12);
              ctx.fillRect(-7, 32, 14, 34);
              ctx.beginPath();
              ctx.arc(0, 72, 10, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-2, -70, 4, 82);
              });
            }
          },

          // ---------------- 13. FOOD (4) ----------------
          {
            id: "BURGER",
            cluster: "FOOD",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -18, 54, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-58, -14, 116, 8);
              ctx.beginPath();
              ctx.arc(-46, 8, 8, Math.PI * 0.5, Math.PI * 1.5, false);
              ctx.arc(46, 8, 8, -Math.PI * 0.5, Math.PI * 0.5, false);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-52, 22, 104, 18);
              ctx.beginPath();
              ctx.arc(0, 32, 52, 0, Math.PI, false);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-22, -32, 3, 0, Math.PI * 2);
                ctx.arc(0, -42, 3.5, 0, Math.PI * 2);
                ctx.arc(22, -32, 3, 0, Math.PI * 2);
                ctx.arc(-10, -24, 3, 0, Math.PI * 2);
                ctx.arc(12, -24, 3, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "PIZZA",
            cluster: "FOOD",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-52, -52);
              ctx.quadraticCurveTo(0, -62, 52, -52);
              ctx.lineTo(0, 72);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-56, -66, 112, 12);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -22, 11, 0, Math.PI * 2);
                ctx.arc(-18, 12, 9, 0, Math.PI * 2);
                ctx.arc(16, 20, 9, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "ICECREAM",
            cluster: "FOOD",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-32, 2);
              ctx.lineTo(32, 2);
              ctx.lineTo(0, 82);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -24, 38, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-22, 2, 12, 0, Math.PI * 2);
              ctx.arc(0, 4, 13, 0, Math.PI * 2);
              ctx.arc(22, 2, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -68, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 4;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(0, -76);
              ctx.quadraticCurveTo(12, -88, 18, -82);
              ctx.stroke();
              ctx.restore();
            }
          },
          {
            id: "DONUT",
            cluster: "FOOD",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 58, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-34, -28, 10, 4);
                ctx.fillRect(24, -30, 4, 10);
                ctx.fillRect(-28, 22, 4, 10);
                ctx.fillRect(26, 18, 10, 4);
                ctx.fillRect(-2, -44, 10, 4);
                ctx.fillRect(-2, 40, 10, 4);
              });
            }
          },

          // ---------------- 14. CLOTHING (4) ----------------
          {
            id: "SHIRT",
            cluster: "CLOTHING",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-28, -62);
              ctx.lineTo(-76, -32);
              ctx.lineTo(-58, 0);
              ctx.lineTo(-38, -12);
              ctx.lineTo(-38, 72);
              ctx.lineTo(38, 72);
              ctx.lineTo(38, -12);
              ctx.lineTo(58, 0);
              ctx.lineTo(76, -32);
              ctx.lineTo(28, -62);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -62, 18, 0, Math.PI, false);
                ctx.fill();
              });
            }
          },
          {
            id: "HAT",
            cluster: "CLOTHING",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 42, 72, 14, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-36, -64, 72, 98);
              ctx.beginPath();
              ctx.arc(0, -60, 36, Math.PI, 0, false);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-36, 22, 72, 8);
              });
            }
          },
          {
            id: "BOOT",
            cluster: "CLOTHING",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-34, -72);
              ctx.lineTo(12, -72);
              ctx.lineTo(12, -8);
              ctx.quadraticCurveTo(18, 12, 54, 30);
              ctx.lineTo(54, 52);
              ctx.lineTo(-34, 52);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-34, 52, 24, 16);
              ctx.fillRect(-34, 52, 88, 8);
              cutout(ctx, function () {
                ctx.fillRect(-10, 52, 28, 16);
              });
            }
          },
          {
            id: "GLASSES",
            cluster: "CLOTHING",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-40, 0, 30, 0, Math.PI * 2);
              ctx.arc(40, 0, 30, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-16, -6, 32, 10);
              ctx.fillRect(-76, -8, 18, 8);
              ctx.fillRect(58, -8, 18, 8);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-40, 0, 20, 0, Math.PI * 2);
                ctx.arc(40, 0, 20, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 15. SPORTS (4) ----------------
          {
            id: "BASKETBALL",
            cluster: "SPORTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 58, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.save();
                ctx.lineWidth = 4.5;
                ctx.beginPath();
                ctx.moveTo(-58, 0);
                ctx.lineTo(58, 0);
                ctx.moveTo(0, -58);
                ctx.lineTo(0, 58);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(-52, 0, 48, -0.9, 0.9);
                ctx.arc(52, 0, 48, Math.PI - 0.9, Math.PI + 0.9);
                ctx.stroke();
                ctx.restore();
              });
            }
          },
          {
            id: "TROPHY",
            cluster: "SPORTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-42, -54);
              ctx.lineTo(42, -54);
              ctx.quadraticCurveTo(42, 6, 0, 18);
              ctx.quadraticCurveTo(-42, 6, -42, -54);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-10, 18, 20, 28);
              ctx.fillRect(-38, 46, 76, 20);
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 10;
              ctx.beginPath();
              ctx.arc(-42, -26, 18, -Math.PI * 0.45, Math.PI * 0.45, true);
              ctx.arc(42, -26, 18, -Math.PI * 0.55, Math.PI * 0.55, false);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -20, 8, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "BOWLING",
            cluster: "SPORTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -48, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-11, -38);
              ctx.quadraticCurveTo(-6, -14, -34, 32);
              ctx.quadraticCurveTo(-34, 68, 0, 68);
              ctx.quadraticCurveTo(34, 68, 34, 32);
              ctx.quadraticCurveTo(6, -14, 11, -38);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-14, -20, 28, 5);
                ctx.fillRect(-16, -10, 32, 5);
              });
            }
          },
          {
            id: "SKATEBOARD",
            cluster: "SPORTS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-74, -14);
              ctx.quadraticCurveTo(-62, 0, -44, 0);
              ctx.lineTo(44, 0);
              ctx.quadraticCurveTo(62, 0, 74, -14);
              ctx.lineTo(76, -6);
              ctx.quadraticCurveTo(62, 10, 42, 10);
              ctx.lineTo(-42, 10);
              ctx.quadraticCurveTo(-62, 10, -76, -6);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-42, 28, 14, 0, Math.PI * 2);
              ctx.arc(42, 28, 14, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-42, 28, 5, 0, Math.PI * 2);
                ctx.arc(42, 28, 5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 16. WEATHER (4) ----------------
          {
            id: "SUN",
            cluster: "WEATHER",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 34, 0, Math.PI * 2);
              ctx.fill();
              for (let a = 0; a < 8; a++) {
                const angle = (a * Math.PI) / 4;
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(-8, -48);
                ctx.lineTo(0, -76);
                ctx.lineTo(8, -48);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
              }
            }
          },
          {
            id: "CLOUD",
            cluster: "WEATHER",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-34, -4, 26, 0, Math.PI * 2);
              ctx.arc(0, -26, 36, 0, Math.PI * 2);
              ctx.arc(36, -6, 26, 0, Math.PI * 2);
              ctx.fillRect(-34, -4, 70, 32);
              ctx.fill();
              const drops = [-30, 0, 30];
              for (let i = 0; i < drops.length; i++) {
                const dx = drops[i];
                ctx.beginPath();
                ctx.ellipse(dx, 52, 6, 14, -0.2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          },
          {
            id: "LIGHTNING",
            cluster: "WEATHER",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(14, -84);
              ctx.lineTo(-34, -6);
              ctx.lineTo(-4, -6);
              ctx.lineTo(-22, 84);
              ctx.lineTo(34, 6);
              ctx.lineTo(4, 6);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "SNOWFLAKE",
            cluster: "WEATHER",
            render: function (ctx) {
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.lineCap = "round";
              for (let i = 0; i < 6; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI) / 3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -72);
                ctx.moveTo(0, -42); ctx.lineTo(-18, -60);
                ctx.moveTo(0, -42); ctx.lineTo(18, -60);
                ctx.moveTo(0, -22); ctx.lineTo(-14, -36);
                ctx.moveTo(0, -22); ctx.lineTo(14, -36);
                ctx.stroke();
                ctx.restore();
              }
              ctx.restore();
            }
          },

          // ---------------- 17. MEDIEVAL (4) ----------------
          {
            id: "CASTLE",
            cluster: "MEDIEVAL",
            render: function (ctx) {
              ctx.fillRect(-62, -24, 124, 88);
              ctx.fillRect(-70, -68, 30, 132);
              ctx.fillRect(40, -68, 30, 132);
              ctx.fillRect(-22, -54, 44, 40);
              ctx.fillRect(-68, -80, 8, 12);
              ctx.fillRect(-50, -80, 8, 12);
              ctx.fillRect(42, -80, 8, 12);
              ctx.fillRect(60, -80, 8, 12);
              ctx.fillRect(-18, -64, 8, 10);
              ctx.fillRect(10, -64, 8, 10);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 38, 16, Math.PI, 0, false);
                ctx.lineTo(16, 64);
                ctx.lineTo(-16, 64);
                ctx.closePath();
                ctx.fill();
              });
            }
          },
          {
            id: "CROWN",
            cluster: "MEDIEVAL",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-60, 48);
              ctx.lineTo(-64, -18);
              ctx.lineTo(-32, 8);
              ctx.lineTo(0, -46);
              ctx.lineTo(32, 8);
              ctx.lineTo(64, -18);
              ctx.lineTo(60, 48);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-60, 48, 120, 14);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 24, 8, 0, Math.PI * 2);
                ctx.arc(-32, 28, 6, 0, Math.PI * 2);
                ctx.arc(32, 28, 6, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "SHIELD",
            cluster: "MEDIEVAL",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-54, -68);
              ctx.lineTo(54, -68);
              ctx.lineTo(54, 8);
              ctx.quadraticCurveTo(54, 68, 0, 84);
              ctx.quadraticCurveTo(-54, 68, -54, 8);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-8, -48, 16, 96);
                ctx.fillRect(-38, -24, 76, 16);
              });
            }
          },
          {
            id: "BOW",
            cluster: "MEDIEVAL",
            render: function (ctx) {
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 10;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.arc(-24, 0, 74, -Math.PI * 0.45, Math.PI * 0.45);
              ctx.stroke();
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(28, -72);
              ctx.lineTo(-8, 0);
              ctx.lineTo(28, 72);
              ctx.stroke();
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.moveTo(-8, 0);
              ctx.lineTo(-64, 0);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(-64, 0);
              ctx.lineTo(-48, -12);
              ctx.lineTo(-48, 12);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          },

          // ---------------- 18. FARM (4) ----------------
          {
            id: "HORSE",
            cluster: "FARM",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-36, 68);
              ctx.lineTo(-14, 0);
              ctx.lineTo(-24, -42);
              ctx.lineTo(-14, -68);
              ctx.lineTo(-4, -42);
              ctx.lineTo(38, -18);
              ctx.lineTo(54, 8);
              ctx.lineTo(38, 22);
              ctx.lineTo(16, 14);
              ctx.lineTo(18, 68);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-28, -28, 12, 14);
              ctx.fillRect(-34, -4, 14, 16);
              ctx.fillRect(-40, 22, 14, 18);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(8, -16, 4.5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "PIG",
            cluster: "FARM",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 8, 58, 42, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(54, 8, 16, 12, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(22, -32);
              ctx.lineTo(44, -48);
              ctx.lineTo(36, -20);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-38, 42, 14, 24);
              ctx.fillRect(18, 42, 14, 24);
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(-62, -4, 10, 0, Math.PI * 1.6);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(26, -10, 4, 0, Math.PI * 2);
                ctx.arc(58, 6, 2.5, 0, Math.PI * 2);
                ctx.arc(58, 12, 2.5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "COW",
            cluster: "FARM",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -18, 38, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(0, 28, 44, 26, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-32, -44);
              ctx.quadraticCurveTo(-52, -72, -40, -78);
              ctx.quadraticCurveTo(-34, -58, -20, -48);
              ctx.closePath();
              ctx.moveTo(32, -44);
              ctx.quadraticCurveTo(52, -72, 40, -78);
              ctx.quadraticCurveTo(34, -58, 20, -48);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(-52, -26, 20, 10, -0.4, 0, Math.PI * 2);
              ctx.ellipse(52, -26, 20, 10, 0.4, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-18, -18, 5, 0, Math.PI * 2);
                ctx.arc(18, -18, 5, 0, Math.PI * 2);
                ctx.arc(-14, 28, 5, 0, Math.PI * 2);
                ctx.arc(14, 28, 5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "ROOSTER",
            cluster: "FARM",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 18, 36, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(14, 18);
              ctx.lineTo(24, -38);
              ctx.lineTo(0, -38);
              ctx.lineTo(-8, 18);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(6, -48, 8, 0, Math.PI * 2);
              ctx.arc(16, -54, 9, 0, Math.PI * 2);
              ctx.arc(26, -48, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(24, -34);
              ctx.lineTo(44, -28);
              ctx.lineTo(24, -22);
              ctx.closePath();
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 8;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-18, 8); ctx.quadraticCurveTo(-64, -28, -68, 38);
              ctx.moveTo(-18, 14); ctx.quadraticCurveTo(-54, -48, -48, -8);
              ctx.stroke();
              ctx.restore();
              ctx.fillRect(-6, 50, 6, 24);
              ctx.fillRect(8, 50, 6, 24);
            }
          },

          // ---------------- 19. TECH (4) ----------------
          {
            id: "PHONE",
            cluster: "TECH",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-26, -64, 10, Math.PI, Math.PI * 1.5);
              ctx.arc(26, -64, 10, Math.PI * 1.5, 0);
              ctx.arc(26, 64, 10, 0, Math.PI * 0.5);
              ctx.arc(-26, 64, 10, Math.PI * 0.5, Math.PI);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-28, -52, 56, 104);
                ctx.fillRect(-8, -68, 16, 3);
                ctx.beginPath();
                ctx.arc(0, 62, 5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "LAPTOP",
            cluster: "TECH",
            render: function (ctx) {
              ctx.fillRect(-52, -62, 104, 72);
              ctx.beginPath();
              ctx.moveTo(-74, 32);
              ctx.lineTo(74, 32);
              ctx.lineTo(60, 14);
              ctx.lineTo(-60, 14);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-74, 32, 148, 8);
              cutout(ctx, function () {
                ctx.fillRect(-44, -54, 88, 56);
                ctx.fillRect(-16, 20, 32, 8);
              });
            }
          },
          {
            id: "ROBOT",
            cluster: "TECH",
            render: function (ctx) {
              ctx.fillRect(-44, -38, 88, 76);
              ctx.fillRect(-4, -68, 8, 30);
              ctx.beginPath();
              ctx.arc(0, -74, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-54, -14, 10, 24);
              ctx.fillRect(44, -14, 10, 24);
              cutout(ctx, function () {
                ctx.fillRect(-30, -22, 20, 18);
                ctx.fillRect(10, -22, 20, 18);
                ctx.fillRect(-28, 14, 56, 10);
              });
            }
          },
          {
            id: "CAMERA",
            cluster: "TECH",
            render: function (ctx) {
              ctx.fillRect(-64, -28, 128, 76);
              ctx.fillRect(-22, -44, 44, 16);
              ctx.fillRect(-48, -38, 16, 10);
              ctx.beginPath();
              ctx.arc(0, 10, 36, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 10, 26, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.beginPath();
              ctx.arc(0, 10, 14, 0, Math.PI * 2);
              ctx.fill();
            }
          },

          // ---------------- 20. NATURE (4) ----------------
          {
            id: "MOUNTAIN",
            cluster: "NATURE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-10, -76);
              ctx.lineTo(68, 64);
              ctx.lineTo(-68, 64);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(34, -42);
              ctx.lineTo(84, 64);
              ctx.lineTo(-6, 64);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.moveTo(-10, -76);
                ctx.lineTo(-28, -34);
                ctx.lineTo(-14, -40);
                ctx.lineTo(-2, -32);
                ctx.lineTo(10, -42);
                ctx.lineTo(24, -36);
                ctx.closePath();
                ctx.fill();
              });
            }
          },
          {
            id: "FLAME",
            cluster: "NATURE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -82);
              ctx.quadraticCurveTo(46, -34, 44, 22);
              ctx.quadraticCurveTo(42, 68, 0, 72);
              ctx.quadraticCurveTo(-42, 68, -44, 22);
              ctx.quadraticCurveTo(-46, -34, 0, -82);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.moveTo(0, -28);
                ctx.quadraticCurveTo(24, 0, 22, 38);
                ctx.quadraticCurveTo(20, 62, 0, 64);
                ctx.quadraticCurveTo(-20, 62, -22, 38);
                ctx.quadraticCurveTo(-24, 0, 0, -28);
                ctx.closePath();
                ctx.fill();
              });
            }
          },
          {
            id: "DROPLET",
            cluster: "NATURE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -82);
              ctx.quadraticCurveTo(52, -18, 50, 28);
              ctx.arc(0, 28, 50, 0, Math.PI, false);
              ctx.quadraticCurveTo(-52, -18, 0, -82);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(-18, 22, 10, 24, 0.4, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "LEAF",
            cluster: "NATURE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -84);
              ctx.quadraticCurveTo(62, -42, 54, 26);
              ctx.quadraticCurveTo(34, 66, 0, 68);
              ctx.quadraticCurveTo(-34, 66, -54, 26);
              ctx.quadraticCurveTo(-62, -42, 0, -84);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-3, 68, 6, 20);
              cutout(ctx, function () {
                ctx.save();
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(0, -72);
                ctx.lineTo(0, 62);
                ctx.moveTo(0, -32); ctx.lineTo(24, -48);
                ctx.moveTo(0, -32); ctx.lineTo(-24, -48);
                ctx.moveTo(0, 4); ctx.lineTo(28, -12);
                ctx.moveTo(0, 4); ctx.lineTo(-28, -12);
                ctx.moveTo(0, 38); ctx.lineTo(22, 24);
                ctx.moveTo(0, 38); ctx.lineTo(-22, 24);
                ctx.stroke();
                ctx.restore();
              });
            }
          },

          // ---------------- 21. COSMETICS (3) ----------------
          {
            id: "LIPSTICK",
            cluster: "COSMETICS",
            render: function (ctx) {
              ctx.fillRect(-22, -10, 44, 82);
              ctx.fillRect(-18, -32, 36, 22);
              ctx.beginPath();
              ctx.moveTo(-16, -32);
              ctx.lineTo(16, -32);
              ctx.lineTo(16, -58);
              ctx.lineTo(-16, -82);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-22, 28, 44, 8);
              });
            }
          },
          {
            id: "PERFUME",
            cluster: "COSMETICS",
            render: function (ctx) {
              ctx.fillRect(-36, -14, 72, 84);
              ctx.fillRect(-12, -32, 24, 18);
              ctx.beginPath();
              ctx.arc(0, -44, 16, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(36, -32, 14, 0, Math.PI * 2);
              ctx.stroke();
              ctx.moveTo(12, -32);
              ctx.lineTo(24, -32);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.fillRect(-24, 8, 48, 40);
              });
            }
          },
          {
            id: "COMB",
            cluster: "COSMETICS",
            render: function (ctx) {
              ctx.fillRect(-72, -42, 144, 30);
              ctx.fillRect(-72, -42, 28, 100);
              for (let i = -38; i <= 66; i += 8) {
                ctx.fillRect(i, -12, 4.5, 68);
              }
            }
          },

          // ---------------- 22. KITCHEN (3) ----------------
          {
            id: "KNIFE",
            cluster: "KITCHEN",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.42);
              ctx.beginPath();
              ctx.moveTo(-12, -84);
              ctx.lineTo(16, -84);
              ctx.lineTo(16, 18);
              ctx.quadraticCurveTo(16, -38, -12, -84);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-8, 18, 16, 68);
              ctx.fillRect(-12, 18, 24, 6);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 36, 2.5, 0, Math.PI * 2);
                ctx.arc(0, 56, 2.5, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.restore();
            }
          },
          {
            id: "FORK",
            cluster: "KITCHEN",
            render: function (ctx) {
              ctx.fillRect(-5, 0, 10, 82);
              ctx.beginPath();
              ctx.moveTo(-22, -18);
              ctx.lineTo(22, -18);
              ctx.lineTo(14, 4);
              ctx.lineTo(-14, 4);
              ctx.closePath();
              ctx.fill();
              for (let x = -20; x <= 20; x += 13.3) {
                ctx.fillRect(x - 2, -78, 4, 60);
              }
            }
          },
          {
            id: "TEAPOT",
            cluster: "KITCHEN",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 12, 48, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-22, -44, 44, 12);
              ctx.beginPath();
              ctx.arc(0, -50, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(38, -6);
              ctx.quadraticCurveTo(68, -26, 72, -42);
              ctx.lineTo(62, -42);
              ctx.quadraticCurveTo(58, -18, 38, 14);
              ctx.closePath();
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 12;
              ctx.beginPath();
              ctx.arc(-42, 6, 22, -Math.PI * 0.45, Math.PI * 0.45, true);
              ctx.stroke();
              ctx.restore();
            }
          },

          // ---------------- 23. STATIONERY (3) ----------------
          {
            id: "PENCIL",
            cluster: "STATIONERY",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.55);
              ctx.fillRect(-12, -48, 24, 108);
              ctx.fillRect(-12, -62, 24, 14);
              ctx.beginPath();
              ctx.arc(0, -62, 12, Math.PI, 0, false);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-12, 60);
              ctx.lineTo(12, 60);
              ctx.lineTo(0, 92);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-12, -50, 24, 4);
              });
              ctx.restore();
            }
          },
          {
            id: "RULER",
            cluster: "STATIONERY",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(-0.55);
              ctx.fillRect(-68, -16, 136, 32);
              cutout(ctx, function () {
                for (let x = -56; x <= 56; x += 10) {
                  const len = (x % 20 === 0) ? 14 : 8;
                  ctx.fillRect(x, -16, 3, len);
                }
              });
              ctx.restore();
            }
          },
          {
            id: "PAPERCLIP",
            cluster: "STATIONERY",
            render: function (ctx) {
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 10;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-16, 42);
              ctx.lineTo(-16, -42);
              ctx.arc(0, -42, 16, Math.PI, 0, false);
              ctx.lineTo(16, 52);
              ctx.arc(0, 52, 16, 0, Math.PI, false);
              ctx.lineTo(-24, -28);
              ctx.stroke();
              ctx.restore();
            }
          },

          // ---------------- 24. FURNITURE (3) ----------------
          {
            id: "CHAIR",
            cluster: "FURNITURE",
            render: function (ctx) {
              ctx.fillRect(-32, -72, 12, 84);
              ctx.fillRect(-32, -72, 64, 14);
              ctx.fillRect(-32, -44, 64, 10);
              ctx.fillRect(-36, 12, 72, 12);
              ctx.fillRect(-32, 24, 10, 56);
              ctx.fillRect(22, 24, 10, 56);
            }
          },
          {
            id: "TABLE",
            cluster: "FURNITURE",
            render: function (ctx) {
              ctx.fillRect(-64, -12, 128, 16);
              ctx.fillRect(-52, 4, 14, 72);
              ctx.fillRect(38, 4, 14, 72);
              ctx.fillRect(-44, 28, 88, 8);
            }
          },
          {
            id: "LAMP",
            cluster: "FURNITURE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-46, 0);
              ctx.lineTo(46, 0);
              ctx.lineTo(26, -56);
              ctx.lineTo(-26, -56);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-6, 0, 12, 68);
              ctx.beginPath();
              ctx.ellipse(0, 68, 38, 12, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          },

          // ---------------- 25. JEWELRY (3) ----------------
          {
            id: "DIAMOND",
            cluster: "JEWELRY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-54, -24);
              ctx.lineTo(-28, -62);
              ctx.lineTo(28, -62);
              ctx.lineTo(54, -24);
              ctx.lineTo(0, 68);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.save();
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-54, -24); ctx.lineTo(54, -24);
                ctx.moveTo(-28, -62); ctx.lineTo(-14, -24); ctx.lineTo(0, 68);
                ctx.moveTo(28, -62); ctx.lineTo(14, -24); ctx.lineTo(0, 68);
                ctx.stroke();
                ctx.restore();
              });
            }
          },
          {
            id: "RING",
            cluster: "JEWELRY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 16, 44, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-18, -28);
              ctx.lineTo(18, -28);
              ctx.lineTo(26, -48);
              ctx.lineTo(0, -74);
              ctx.lineTo(-26, -48);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 16, 32, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "WATCH",
            cluster: "JEWELRY",
            render: function (ctx) {
              ctx.fillRect(-22, -82, 44, 164);
              ctx.beginPath();
              ctx.arc(0, 0, 48, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(48, -8, 8, 16);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 0, 36, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.fillRect(-3, -22, 6, 26);
              ctx.fillRect(-3, -3, 20, 6);
            }
          },

          // ---------------- 26. BEVERAGE (3) ----------------
          {
            id: "COFFEE",
            cluster: "BEVERAGE",
            render: function (ctx) {
              ctx.fillRect(-38, -12, 76, 74);
              ctx.beginPath();
              ctx.arc(0, 62, 38, 0, Math.PI, false);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 12;
              ctx.beginPath();
              ctx.arc(38, 18, 20, -Math.PI * 0.45, Math.PI * 0.45);
              ctx.stroke();
              ctx.lineWidth = 4;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-18, -20); ctx.quadraticCurveTo(-26, -38, -16, -56);
              ctx.moveTo(4, -20); ctx.quadraticCurveTo(-4, -38, 6, -56);
              ctx.stroke();
              ctx.restore();
            }
          },
          {
            id: "WINE",
            cluster: "BEVERAGE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-34, -62);
              ctx.lineTo(34, -62);
              ctx.lineTo(34, -14);
              ctx.quadraticCurveTo(34, 18, 0, 22);
              ctx.quadraticCurveTo(-34, 18, -34, -14);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-5, 22, 10, 44);
              ctx.beginPath();
              ctx.ellipse(0, 66, 32, 10, 0, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-28, -62, 56, 12);
              });
            }
          },
          {
            id: "BOBA",
            cluster: "BEVERAGE",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-36, -34);
              ctx.lineTo(36, -34);
              ctx.lineTo(26, 68);
              ctx.lineTo(-26, 68);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -34, 36, Math.PI, 0, false);
              ctx.fill();
              ctx.save();
              ctx.rotate(0.2);
              ctx.fillRect(-6, -78, 12, 52);
              ctx.restore();
              cutout(ctx, function () {
                const pearls = [[-14, 48], [4, 46], [-4, 32], [14, 34], [-12, 18], [8, 18]];
                for (let i = 0; i < pearls.length; i++) {
                  ctx.beginPath();
                  ctx.arc(pearls[i][0], pearls[i][1], 6, 0, Math.PI * 2);
                  ctx.fill();
                }
              });
            }
          },

          // ---------------- 27. CARNIVAL (3) ----------------
          {
            id: "BALLOON",
            cluster: "CARNIVAL",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, -22, 42, 54, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-6, 32);
              ctx.lineTo(6, 32);
              ctx.lineTo(0, 38);
              ctx.closePath();
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(0, 38);
              ctx.quadraticCurveTo(-14, 52, 0, 68);
              ctx.quadraticCurveTo(14, 82, 0, 94);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(18, -38, 8, 16, 0.4, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "TENT",
            cluster: "CARNIVAL",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -72);
              ctx.lineTo(64, -14);
              ctx.lineTo(-64, -14);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-58, -14, 116, 78);
              ctx.fillRect(-3, -88, 6, 18);
              ctx.beginPath();
              ctx.moveTo(3, -88); ctx.lineTo(24, -80); ctx.lineTo(3, -72);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.moveTo(0, 8);
                ctx.lineTo(24, 64);
                ctx.lineTo(-24, 64);
                ctx.closePath();
                ctx.fill();
              });
            }
          },
          {
            id: "POPCORN",
            cluster: "CARNIVAL",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-44, -12);
              ctx.lineTo(44, -12);
              ctx.lineTo(32, 68);
              ctx.lineTo(-32, 68);
              ctx.closePath();
              ctx.fill();
              const p = [[-32, -22, 16], [0, -28, 20], [32, -22, 16], [-16, -42, 18], [16, -42, 18]];
              for (let i = 0; i < p.length; i++) {
                ctx.beginPath();
                ctx.arc(p[i][0], p[i][1], p[i][2], 0, Math.PI * 2);
                ctx.fill();
              }
              cutout(ctx, function () {
                ctx.fillRect(-18, -12, 10, 80);
                ctx.fillRect(8, -12, 10, 80);
              });
            }
          },

          // ---------------- 28. BUILDINGS (3) ----------------
          {
            id: "HOUSE",
            cluster: "BUILDINGS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -74);
              ctx.lineTo(64, -20);
              ctx.lineTo(-64, -20);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(28, -62, 14, 28);
              ctx.fillRect(-52, -20, 104, 84);
              cutout(ctx, function () {
                ctx.fillRect(-14, 24, 28, 40);
                ctx.fillRect(-38, -6, 20, 20);
                ctx.fillRect(18, -6, 20, 20);
              });
            }
          },
          {
            id: "LIGHTHOUSE",
            cluster: "BUILDINGS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-18, -42);
              ctx.lineTo(18, -42);
              ctx.lineTo(36, 68);
              ctx.lineTo(-36, 68);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-24, -42, 48, 10);
              ctx.fillRect(-16, -64, 32, 22);
              ctx.beginPath();
              ctx.arc(0, -64, 18, Math.PI, 0, false);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-12, -58, 24, 14);
                ctx.fillRect(-18, -14, 36, 8);
                ctx.fillRect(-24, 22, 48, 8);
              });
            }
          },
          {
            id: "WINDMILL",
            cluster: "BUILDINGS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-16, -18);
              ctx.lineTo(16, -18);
              ctx.lineTo(34, 68);
              ctx.lineTo(-34, 68);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -18, 16, Math.PI, 0, false);
              ctx.fill();
              for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.translate(0, -18);
                ctx.rotate((i * Math.PI) / 2);
                ctx.fillRect(4, -8, 54, 16);
                ctx.restore();
              }
            }
          },

          // ---------------- 29. OCEAN_DEEP (3) ----------------
          {
            id: "SHARK",
            cluster: "OCEAN_DEEP",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-74, -4);
              ctx.quadraticCurveTo(-14, -36, 42, -4);
              ctx.lineTo(76, -34);
              ctx.lineTo(58, -4);
              ctx.lineTo(76, 26);
              ctx.quadraticCurveTo(-14, 36, -74, -4);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-14, -20);
              ctx.lineTo(-6, -64);
              ctx.lineTo(16, -16);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-54, -6, 3, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "JELLYFISH",
            cluster: "OCEAN_DEEP",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -14, 52, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.lineCap = "round";
              for (let x = -36; x <= 36; x += 18) {
                ctx.beginPath();
                ctx.moveTo(x, -14);
                ctx.quadraticCurveTo(x + 14, 22, x, 52);
                ctx.quadraticCurveTo(x - 14, 72, x, 88);
                ctx.stroke();
              }
              ctx.restore();
            }
          },
          {
            id: "SEAHORSE",
            cluster: "OCEAN_DEEP",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-8, -48, 22, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-28, -46, 22, 8);
              ctx.beginPath();
              ctx.ellipse(0, 4, 26, 40, 0.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(8, 38);
              ctx.quadraticCurveTo(18, 72, -4, 76);
              ctx.arc(-8, 64, 12, Math.PI * 0.5, Math.PI * 1.8, false);
              ctx.stroke();
              ctx.restore();
            }
          },

          // ---------------- 30. DESERT (3) ----------------
          {
            id: "CAMEL",
            cluster: "DESERT",
            render: function (ctx) {
              ctx.fillRect(-38, 0, 76, 44);
              ctx.beginPath();
              ctx.arc(-18, 0, 20, Math.PI, 0, false);
              ctx.arc(18, 0, 20, Math.PI, 0, false);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(28, 14);
              ctx.quadraticCurveTo(52, -18, 48, -52);
              ctx.lineTo(64, -48);
              ctx.lineTo(54, -28);
              ctx.lineTo(38, 28);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-32, 42, 10, 44);
              ctx.fillRect(22, 42, 10, 44);
            }
          },
          {
            id: "SCORPION",
            cluster: "DESERT",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 12, 28, 40, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 12;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-18, -12); ctx.lineTo(-44, -36);
              ctx.moveTo(18, -12); ctx.lineTo(44, -36);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(0, 46);
              ctx.quadraticCurveTo(-46, 78, -42, 0);
              ctx.quadraticCurveTo(-40, -48, -14, -64);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.arc(-10, -66, 9, 0, Math.PI * 2);
              ctx.fill();
            }
          },
          {
            id: "OASIS",
            cluster: "DESERT",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 48, 64, 20, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 10;
              ctx.beginPath();
              ctx.moveTo(0, 48);
              ctx.quadraticCurveTo(-14, 0, 0, -42);
              ctx.stroke();
              ctx.restore();
              for (let a = -0.8; a <= 0.8; a += 0.4) {
                ctx.save();
                ctx.translate(0, -42);
                ctx.rotate(a);
                ctx.beginPath();
                ctx.ellipse(0, -22, 10, 32, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          },

          // ---------------- 31. ARCTIC (3) ----------------
          {
            id: "POLAR_BEAR",
            cluster: "ARCTIC",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-8, 12, 54, 40, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(42, -18, 22, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(48, -16, 18, 16);
              ctx.beginPath();
              ctx.arc(38, -36, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-44, 42, 18, 38);
              ctx.fillRect(18, 42, 18, 38);
            }
          },
          {
            id: "WALRUS",
            cluster: "ARCTIC",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 12, 62, 44, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-42, -14, 26, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-52, 6, 8, 42);
              ctx.fillRect(-38, 6, 8, 42);
              ctx.beginPath();
              ctx.ellipse(54, 38, 26, 12, 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
          },
          {
            id: "IGLOO",
            cluster: "ARCTIC",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 32, 64, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(44, 32, 24, Math.PI, 0, false);
              ctx.fill();
              cutout(ctx, function () {
                ctx.save();
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 32, 44, Math.PI, 0, false);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(44, 32, 16, Math.PI, 0, false);
                ctx.fill();
                ctx.restore();
              });
            }
          },

          // ---------------- 32. SAVANNA (3) ----------------
          {
            id: "LION",
            cluster: "SAVANNA",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 58, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 4, 34, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.beginPath();
              ctx.arc(0, 6, 30, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-12, -2, 4, 0, Math.PI * 2);
                ctx.arc(12, -2, 4, 0, Math.PI * 2);
                ctx.arc(0, 16, 5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "GIRAFFE",
            cluster: "SAVANNA",
            render: function (ctx) {
              ctx.fillRect(-16, -72, 24, 116);
              ctx.beginPath();
              ctx.arc(-4, -72, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-14, -90, 5, 20);
              ctx.fillRect(2, -90, 5, 20);
              ctx.beginPath();
              ctx.arc(-11, -90, 5, 0, Math.PI * 2);
              ctx.arc(5, -90, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-48, 32, 72, 38);
              ctx.fillRect(-44, 68, 10, 24);
              ctx.fillRect(14, 68, 10, 24);
            }
          },
          {
            id: "RHINO",
            cluster: "SAVANNA",
            render: function (ctx) {
              ctx.fillRect(-54, -8, 108, 56);
              ctx.beginPath();
              ctx.moveTo(48, -8);
              ctx.lineTo(84, 14);
              ctx.lineTo(48, 48);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(68, 4);
              ctx.lineTo(88, -26);
              ctx.lineTo(58, -12);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-48, 48, 18, 38);
              ctx.fillRect(18, 48, 18, 38);
            }
          },

          // ---------------- 33. FOREST (3) ----------------
          {
            id: "DEER",
            cluster: "FOREST",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 14, 28, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-12, 38, 24, 46);
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 7;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-12, -6); ctx.lineTo(-38, -62);
              ctx.moveTo(-24, -34); ctx.lineTo(-44, -38);
              ctx.moveTo(-32, -48); ctx.lineTo(-18, -64);
              ctx.moveTo(12, -6); ctx.lineTo(38, -62);
              ctx.moveTo(24, -34); ctx.lineTo(44, -38);
              ctx.moveTo(32, -48); ctx.lineTo(18, -64);
              ctx.stroke();
              ctx.restore();
            }
          },
          {
            id: "FOX",
            cluster: "FOREST",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, 38);
              ctx.lineTo(-48, -18);
              ctx.lineTo(48, -18);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-38, -16); ctx.lineTo(-38, -64); ctx.lineTo(-14, -16);
              ctx.closePath();
              ctx.moveTo(38, -16); ctx.lineTo(38, -64); ctx.lineTo(14, -16);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-14, 38, 28, 46);
            }
          },
          {
            id: "SQUIRREL",
            cluster: "FOREST",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-14, 22, 26, 38, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-14, -22, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 26;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-14, 46);
              ctx.quadraticCurveTo(46, 52, 42, -18);
              ctx.quadraticCurveTo(38, -68, 14, -68);
              ctx.stroke();
              ctx.restore();
            }
          },

          // ---------------- 34. FANTASY (3) ----------------
          {
            id: "DRAGON",
            cluster: "FANTASY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-24, 52);
              ctx.lineTo(24, 52);
              ctx.lineTo(14, -38);
              ctx.lineTo(-14, -38);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(0, -32);
              ctx.lineTo(76, -72);
              ctx.lineTo(58, -14);
              ctx.lineTo(74, 18);
              ctx.closePath();
              ctx.moveTo(0, -32);
              ctx.lineTo(-76, -72);
              ctx.lineTo(-58, -14);
              ctx.lineTo(-74, 18);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "UNICORN",
            cluster: "FANTASY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-36, 68);
              ctx.lineTo(-14, 0);
              ctx.lineTo(-14, -48);
              ctx.lineTo(38, -18);
              ctx.lineTo(52, 12);
              ctx.lineTo(18, 68);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-8, -48);
              ctx.lineTo(34, -88);
              ctx.lineTo(6, -38);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "WAND",
            cluster: "FANTASY",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.55);
              ctx.fillRect(-6, -24, 12, 108);
              ctx.save();
              ctx.translate(0, -48);
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * 26, -Math.sin(((18 + i * 72) * Math.PI) / 180) * 26);
                ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * 12, -Math.sin(((54 + i * 72) * Math.PI) / 180) * 12);
              }
              ctx.closePath();
              ctx.fill();
              ctx.restore();
              ctx.restore();
            }
          },

          // ---------------- 35. HORROR (3) ----------------
          {
            id: "GHOST",
            cluster: "HORROR",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -28, 44, Math.PI, 0, false);
              ctx.lineTo(44, 46);
              ctx.lineTo(22, 32);
              ctx.lineTo(0, 48);
              ctx.lineTo(-22, 32);
              ctx.lineTo(-44, 46);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.ellipse(-16, -26, 7, 12, 0, 0, Math.PI * 2);
                ctx.ellipse(16, -26, 7, 12, 0, 0, Math.PI * 2);
                ctx.ellipse(0, -2, 6, 10, 0, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "BAT",
            cluster: "HORROR",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 16, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-10, -22, 7, 14);
              ctx.fillRect(3, -22, 7, 14);
              ctx.beginPath();
              ctx.moveTo(-14, 0);
              ctx.quadraticCurveTo(-46, -48, -78, -32);
              ctx.quadraticCurveTo(-62, 0, -48, 24);
              ctx.quadraticCurveTo(-34, 8, -14, 0);
              ctx.moveTo(14, 0);
              ctx.quadraticCurveTo(46, -48, 78, -32);
              ctx.quadraticCurveTo(62, 0, 48, 24);
              ctx.quadraticCurveTo(34, 8, 14, 0);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "SKULL",
            cluster: "HORROR",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -18, 48, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-26, 18, 52, 38);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-18, -10, 14, 0, Math.PI * 2);
                ctx.arc(18, -10, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, 12); ctx.lineTo(-6, 24); ctx.lineTo(6, 24);
                ctx.closePath();
                ctx.fill();
                ctx.fillRect(-18, 42, 6, 12);
                ctx.fillRect(-6, 42, 6, 12);
                ctx.fillRect(6, 42, 6, 12);
              });
            }
          },

          // ---------------- 36. CELEBRATION (3) ----------------
          {
            id: "GIFT",
            cluster: "CELEBRATION",
            render: function (ctx) {
              ctx.fillRect(-48, -14, 96, 78);
              ctx.fillRect(-54, -28, 108, 16);
              ctx.beginPath();
              ctx.ellipse(-18, -44, 16, 10, -0.4, 0, Math.PI * 2);
              ctx.ellipse(18, -44, 16, 10, 0.4, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-8, -28, 16, 92);
                ctx.fillRect(-48, 18, 96, 14);
                ctx.beginPath();
                ctx.ellipse(-18, -44, 8, 4, -0.4, 0, Math.PI * 2);
                ctx.ellipse(18, -44, 8, 4, 0.4, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "PARTY_HAT",
            cluster: "CELEBRATION",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -68);
              ctx.lineTo(46, 52);
              ctx.quadraticCurveTo(0, 68, -46, 52);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -74, 10, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.save();
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 56, 32, Math.PI, 0, false);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 16, 20, Math.PI, 0, false);
                ctx.stroke();
                ctx.restore();
              });
            }
          },
          {
            id: "FIREWORK",
            cluster: "CELEBRATION",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 12, 0, Math.PI * 2);
              ctx.fill();
              for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                ctx.save();
                ctx.rotate(angle);
                ctx.fillRect(-3, 24, 6, 28);
                ctx.beginPath();
                ctx.arc(0, 68, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          },

          // ---------------- 37. PIRATE (3) ----------------
          {
            id: "HOOK",
            cluster: "PIRATE",
            render: function (ctx) {
              ctx.fillRect(-28, 24, 56, 42);
              ctx.beginPath();
              ctx.ellipse(0, 24, 28, 10, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 16;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(0, 24);
              ctx.lineTo(0, -18);
              ctx.arc(18, -18, 18, Math.PI, 0, false);
              ctx.arc(18, -32, 18, 0, Math.PI, true);
              ctx.stroke();
              ctx.restore();
            }
          },
          {
            id: "CHEST",
            cluster: "PIRATE",
            render: function (ctx) {
              ctx.fillRect(-54, -4, 108, 68);
              ctx.beginPath();
              ctx.arc(0, -4, 54, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-54, -6, 108, 6);
                ctx.fillRect(-8, 6, 16, 22);
                ctx.beginPath();
                ctx.arc(0, 14, 4, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "CANNON",
            cluster: "PIRATE",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(-0.35);
              ctx.beginPath();
              ctx.moveTo(-52, -18);
              ctx.lineTo(52, -12);
              ctx.lineTo(52, 12);
              ctx.lineTo(-52, 18);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(52, -16, 10, 32);
              ctx.beginPath();
              ctx.arc(-52, 0, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
              ctx.beginPath();
              ctx.arc(0, 36, 26, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 36, 10, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 38. GAMING (3) ----------------
          {
            id: "GAMEPAD",
            cluster: "GAMING",
            render: function (ctx) {
              ctx.beginPath();
              ctx.roundRect(-64, -28, 128, 68, [24, 24, 38, 38]);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-44, -12, 24, 8);
                ctx.fillRect(-36, -20, 8, 24);
                ctx.beginPath();
                ctx.arc(28, -8, 5, 0, Math.PI * 2);
                ctx.arc(42, -8, 5, 0, Math.PI * 2);
                ctx.arc(35, 6, 5, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "JOYSTICK",
            cluster: "GAMING",
            render: function (ctx) {
              ctx.fillRect(-48, 18, 96, 44);
              ctx.fillRect(-7, -42, 14, 64);
              ctx.beginPath();
              ctx.arc(0, -48, 22, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(24, 38, 6, 0, Math.PI * 2);
                ctx.arc(-24, 38, 6, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "DICE",
            cluster: "GAMING",
            render: function (ctx) {
              ctx.beginPath();
              ctx.roundRect(-46, -46, 92, 92, 18);
              ctx.fill();
              cutout(ctx, function () {
                const dots = [[0, 0], [-22, -22], [22, -22], [-22, 22], [22, 22]];
                for (let i = 0; i < dots.length; i++) {
                  ctx.beginPath();
                  ctx.arc(dots[i][0], dots[i][1], 8, 0, Math.PI * 2);
                  ctx.fill();
                }
              });
            }
          },

          // ---------------- 39. MEDICINE (3) ----------------
          {
            id: "PILL",
            cluster: "MEDICINE",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.68);
              ctx.beginPath();
              ctx.roundRect(-24, -64, 48, 128, 24);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-24, -4, 48, 8);
              });
              ctx.restore();
            }
          },
          {
            id: "SYRINGE",
            cluster: "MEDICINE",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.78);
              ctx.fillRect(-12, -42, 24, 76);
              ctx.fillRect(-18, 34, 36, 8);
              ctx.fillRect(-4, 42, 8, 28);
              ctx.fillRect(-14, 70, 28, 8);
              ctx.fillRect(-1.5, -78, 3, 36);
              cutout(ctx, function () {
                ctx.fillRect(-12, -22, 10, 4);
                ctx.fillRect(-12, -4, 10, 4);
                ctx.fillRect(-12, 14, 10, 4);
              });
              ctx.restore();
            }
          },
          {
            id: "STETHOSCOPE",
            cluster: "MEDICINE",
            render: function (ctx) {
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 8;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.arc(-22, -48, 16, Math.PI, 0, false);
              ctx.arc(22, -48, 16, Math.PI, 0, false);
              ctx.moveTo(-6, -48);
              ctx.quadraticCurveTo(0, -18, 0, 12);
              ctx.moveTo(6, -48);
              ctx.quadraticCurveTo(0, -18, 0, 12);
              ctx.quadraticCurveTo(0, 56, 36, 44);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.arc(36, 44, 16, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(36, 44, 8, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },

          // ---------------- 40. GARDEN (3) ----------------
          {
            id: "WATER_CAN",
            cluster: "GARDEN",
            render: function (ctx) {
              ctx.fillRect(-38, -6, 68, 62);
              ctx.beginPath();
              ctx.arc(-4, -6, 34, Math.PI, 0, false);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 12;
              ctx.beginPath();
              ctx.arc(-38, 20, 24, -Math.PI * 0.45, Math.PI * 0.45, true);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(26, 12); ctx.lineTo(64, -28);
              ctx.stroke();
              ctx.restore();
              ctx.beginPath();
              ctx.arc(68, -32, 10, 0, Math.PI * 2);
              ctx.fill();
            }
          },
          {
            id: "SHOVEL",
            cluster: "GARDEN",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.38);
              ctx.fillRect(-5, -62, 10, 84);
              ctx.beginPath();
              ctx.arc(0, -68, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-24, 22);
              ctx.lineTo(24, 22);
              ctx.lineTo(22, 62);
              ctx.lineTo(0, 84);
              ctx.lineTo(-22, 62);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -68, 6, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.restore();
            }
          },
          {
            id: "SUNFLOWER",
            cluster: "GARDEN",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -14, 24, 0, Math.PI * 2);
              ctx.fill();
              for (let i = 0; i < 12; i++) {
                const a = (i * Math.PI) / 6;
                ctx.save();
                ctx.translate(0, -14);
                ctx.rotate(a);
                ctx.beginPath();
                ctx.ellipse(0, -36, 7, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
              ctx.fillRect(-4, 10, 8, 68);
              ctx.beginPath();
              ctx.ellipse(18, 42, 18, 8, 0.4, 0, Math.PI * 2);
              ctx.fill();
            }
          },

          // ---------------- 41. CAMPING (3) ----------------
          {
            id: "CAMPFIRE",
            cluster: "CAMPING",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.35); ctx.fillRect(-44, 42, 88, 14); ctx.restore();
              ctx.save();
              ctx.rotate(-0.35); ctx.fillRect(-44, 42, 88, 14); ctx.restore();
              ctx.beginPath();
              ctx.moveTo(0, -78);
              ctx.quadraticCurveTo(48, -24, 42, 38);
              ctx.lineTo(-42, 38);
              ctx.quadraticCurveTo(-48, -24, 0, -78);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.moveTo(0, -28);
                ctx.quadraticCurveTo(24, 0, 20, 36);
                ctx.lineTo(-20, 36);
                ctx.quadraticCurveTo(-24, 0, 0, -28);
                ctx.closePath();
                ctx.fill();
              });
            }
          },
          {
            id: "FLASHLIGHT",
            cluster: "CAMPING",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.55);
              ctx.fillRect(-14, -18, 28, 88);
              ctx.beginPath();
              ctx.moveTo(-14, -18);
              ctx.lineTo(14, -18);
              ctx.lineTo(26, -58);
              ctx.lineTo(-26, -58);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-28, -66, 56, 8);
              ctx.fillRect(-18, 12, 6, 16);
              ctx.restore();
            }
          },
          {
            id: "COMPASS",
            cluster: "CAMPING",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 56, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -56, 12, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 0, 44, 0, Math.PI * 2);
                ctx.arc(0, -56, 6, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.beginPath();
              ctx.moveTo(0, -36);
              ctx.lineTo(12, 0);
              ctx.lineTo(0, 36);
              ctx.lineTo(-12, 0);
              ctx.closePath();
              ctx.fill();
            }
          },

          // ---------------- 42. MARITIME (3) ----------------
          {
            id: "SUBMARINE",
            cluster: "MARITIME",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 14, 74, 34, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-18, -26, 36, 40);
              ctx.fillRect(-4, -48, 8, 24);
              ctx.fillRect(-4, -48, 18, 6);
              ctx.fillRect(70, -2, 10, 32);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-36, 14, 7, 0, Math.PI * 2);
                ctx.arc(0, 14, 7, 0, Math.PI * 2);
                ctx.arc(36, 14, 7, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "LIFEBUOY",
            cluster: "MARITIME",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 58, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 0, 28, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-8, -58, 16, 30);
                ctx.fillRect(-8, 28, 16, 30);
                ctx.fillRect(-58, -8, 30, 16);
                ctx.fillRect(28, -8, 30, 16);
              });
            }
          },
          {
            id: "HELM_WHEEL",
            cluster: "MARITIME",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 48, 0, Math.PI * 2);
              ctx.fill();
              for (let i = 0; i < 8; i++) {
                ctx.save();
                ctx.rotate((i * Math.PI) / 4);
                ctx.fillRect(-4, -74, 8, 28);
                ctx.restore();
              }
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 0, 36, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.beginPath();
              ctx.arc(0, 0, 16, 0, Math.PI * 2);
              ctx.fill();
            }
          },

          // ---------------- 43. AVIATION (3) ----------------
          {
            id: "HELICOPTER",
            cluster: "AVIATION",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(-14, 4, 38, 28, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(20, -2, 54, 10);
              ctx.fillRect(68, -18, 6, 26);
              ctx.fillRect(-18, -26, 8, 30);
              ctx.fillRect(-68, -26, 108, 6);
              ctx.fillRect(-32, 34, 48, 6);
              ctx.fillRect(-22, 24, 6, 14);
              ctx.fillRect(4, 24, 6, 14);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-30, 0, 12, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "PARACHUTE",
            cluster: "AVIATION",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -32, 62, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(-58, -32); ctx.lineTo(0, 54);
              ctx.moveTo(-22, -32); ctx.lineTo(0, 54);
              ctx.moveTo(22, -32); ctx.lineTo(0, 54);
              ctx.moveTo(58, -32); ctx.lineTo(0, 54);
              ctx.stroke();
              ctx.restore();
              ctx.fillRect(-10, 54, 20, 20);
            }
          },
          {
            id: "DRONE",
            cluster: "AVIATION",
            render: function (ctx) {
              ctx.beginPath();
              ctx.roundRect(-22, -22, 44, 44, 10);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(-20, -20); ctx.lineTo(-48, -48);
              ctx.moveTo(20, -20); ctx.lineTo(48, -48);
              ctx.moveTo(-20, 20); ctx.lineTo(-48, 48);
              ctx.moveTo(20, 20); ctx.lineTo(48, 48);
              ctx.stroke();
              ctx.restore();
              const rots = [[-48, -48], [48, -48], [-48, 48], [48, 48]];
              for (let i = 0; i < rots.length; i++) {
                ctx.fillRect(rots[i][0] - 22, rots[i][1] - 4, 44, 8);
              }
            }
          },

          // ---------------- 44. RAILWAY (3) ----------------
          {
            id: "LOCOMOTIVE",
            cluster: "RAILWAY",
            render: function (ctx) {
              ctx.fillRect(-62, -18, 76, 52);
              ctx.fillRect(14, -48, 48, 82);
              ctx.fillRect(-48, -48, 18, 30);
              ctx.beginPath();
              ctx.moveTo(-62, 34); ctx.lineTo(-82, 46); ctx.lineTo(-62, 46);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-34, 48, 14, 0, Math.PI * 2);
              ctx.arc(6, 48, 14, 0, Math.PI * 2);
              ctx.arc(44, 48, 14, 0, Math.PI * 2);
              ctx.fill();
            }
          },
          {
            id: "METRO",
            cluster: "RAILWAY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.roundRect(-42, -58, 84, 116, [24, 24, 8, 8]);
              ctx.fill();
              ctx.fillRect(-38, 58, 16, 8);
              ctx.fillRect(22, 58, 16, 8);
              cutout(ctx, function () {
                ctx.fillRect(-30, -42, 60, 36);
                ctx.beginPath();
                ctx.arc(-20, 16, 6, 0, Math.PI * 2);
                ctx.arc(20, 16, 6, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          },
          {
            id: "CABOOSE",
            cluster: "RAILWAY",
            render: function (ctx) {
              ctx.fillRect(-58, -18, 116, 56);
              ctx.fillRect(-22, -38, 44, 20);
              ctx.fillRect(-64, -22, 128, 6);
              ctx.beginPath();
              ctx.arc(-34, 48, 12, 0, Math.PI * 2);
              ctx.arc(34, 48, 12, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.fillRect(-44, -6, 18, 18);
                ctx.fillRect(26, -6, 18, 18);
              });
            }
          },

          // ---------------- 45. CONSTRUCTION (3) ----------------
          {
            id: "TRAFFIC_CONE",
            cluster: "CONSTRUCTION",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(-10, -74);
              ctx.lineTo(10, -74);
              ctx.lineTo(38, 48);
              ctx.lineTo(-38, 48);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-54, 48, 108, 16);
              cutout(ctx, function () {
                ctx.fillRect(-24, -24, 48, 18);
                ctx.fillRect(-34, 14, 68, 18);
              });
            }
          },
          {
            id: "HARD_HAT",
            cluster: "CONSTRUCTION",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 54, Math.PI, 0, false);
              ctx.closePath();
              ctx.fill();
              ctx.fillRect(-68, 0, 136, 16);
              ctx.fillRect(-8, -58, 16, 58);
            }
          },
          {
            id: "CRANE_HOOK",
            cluster: "CONSTRUCTION",
            render: function (ctx) {
              ctx.fillRect(-24, -78, 48, 44);
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 16;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(0, -34);
              ctx.lineTo(0, 12);
              ctx.arc(-16, 12, 22, 0, Math.PI, false);
              ctx.arc(-16, 2, 22, Math.PI, 0, true);
              ctx.stroke();
              ctx.restore();
            }
          },

          // ---------------- 46. ASTRONOMY (3) ----------------
          {
            id: "TELESCOPE",
            cluster: "ASTRONOMY",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(-0.55);
              ctx.fillRect(-16, -64, 32, 108);
              ctx.fillRect(-22, -74, 44, 12);
              ctx.fillRect(-10, 44, 20, 22);
              ctx.restore();
              ctx.fillRect(-5, 0, 10, 78);
              ctx.save();
              ctx.rotate(0.35); ctx.fillRect(-4, 0, 8, 78); ctx.restore();
              ctx.save();
              ctx.rotate(-0.35); ctx.fillRect(-4, 0, 8, 78); ctx.restore();
            }
          },
          {
            id: "COMET",
            cluster: "ASTRONOMY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-34, 34, 26, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(-44, 14);
              ctx.lineTo(68, -64);
              ctx.lineTo(54, -48);
              ctx.lineTo(76, -56);
              ctx.lineTo(-14, 44);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "SATURN_RING",
            cluster: "ASTRONOMY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 0, 42, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.beginPath();
              ctx.ellipse(0, 0, 82, 22, -0.45, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(0, 0, 68, 18, -0.45, 0, Math.PI * 2);
                ctx.stroke();
              });
            }
          },

          // ---------------- 47. BABY (3) ----------------
          {
            id: "PACIFIER",
            cluster: "BABY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, -6, 44, 26, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(0, -28, 16, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 10;
              ctx.beginPath();
              ctx.arc(0, 24, 22, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          },
          {
            id: "RATTLE",
            cluster: "BABY",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.45);
              ctx.beginPath();
              ctx.arc(0, -34, 34, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-6, 0, 12, 64);
              ctx.beginPath();
              ctx.arc(0, 68, 14, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 68, 6, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.restore();
            }
          },
          {
            id: "TEDDY",
            cluster: "BABY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, -18, 30, 0, Math.PI * 2);
              ctx.arc(-26, -42, 14, 0, Math.PI * 2);
              ctx.arc(26, -42, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(0, 32, 38, 44, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-36, 18, 12, 0, Math.PI * 2);
              ctx.arc(36, 18, 12, 0, Math.PI * 2);
              ctx.arc(-22, 64, 14, 0, Math.PI * 2);
              ctx.arc(22, 64, 14, 0, Math.PI * 2);
              ctx.fill();
            }
          },

          // ---------------- 48. PETS (3) ----------------
          {
            id: "DOG_BONE",
            cluster: "PETS",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.48);
              ctx.fillRect(-38, -12, 76, 24);
              ctx.beginPath();
              ctx.arc(-38, -14, 14, 0, Math.PI * 2);
              ctx.arc(-38, 14, 14, 0, Math.PI * 2);
              ctx.arc(38, -14, 14, 0, Math.PI * 2);
              ctx.arc(38, 14, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          },
          {
            id: "FISHBOWL",
            cluster: "PETS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 8, 54, 0, Math.PI * 2);
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 8, 44, 0, Math.PI * 2);
                ctx.fill();
              });
              ctx.beginPath();
              ctx.ellipse(0, 18, 22, 12, 0, 0, Math.PI * 2);
              ctx.moveTo(20, 18); ctx.lineTo(34, 10); ctx.lineTo(34, 26);
              ctx.closePath();
              ctx.fill();
            }
          },
          {
            id: "CAT_PAW",
            cluster: "PETS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.ellipse(0, 18, 36, 28, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-32, -18, 13, 0, Math.PI * 2);
              ctx.arc(-11, -34, 14, 0, Math.PI * 2);
              ctx.arc(11, -34, 14, 0, Math.PI * 2);
              ctx.arc(32, -18, 13, 0, Math.PI * 2);
              ctx.fill();
            }
          },

          // ---------------- 49. FITNESS (3) ----------------
          {
            id: "DUMBBELL",
            cluster: "FITNESS",
            render: function (ctx) {
              ctx.save();
              ctx.rotate(0.55);
              ctx.fillRect(-44, -7, 88, 14);
              ctx.beginPath();
              ctx.roundRect(-58, -26, 16, 52, 6);
              ctx.roundRect(42, -26, 16, 52, 6);
              ctx.fill();
              ctx.fillRect(-64, -20, 8, 40);
              ctx.fillRect(56, -20, 8, 40);
              ctx.restore();
            }
          },
          {
            id: "KETTLEBELL",
            cluster: "FITNESS",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(0, 20, 48, 0, Math.PI * 2);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.beginPath();
              ctx.arc(0, -18, 34, Math.PI, 0, false);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, -18, 20, Math.PI, 0, false);
                ctx.fill();
              });
            }
          },
          {
            id: "JUMP_ROPE",
            cluster: "FITNESS",
            render: function (ctx) {
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(0, -10, 54, 0.2, Math.PI - 0.2);
              ctx.stroke();
              ctx.restore();
              ctx.fillRect(-62, -48, 16, 42);
              ctx.fillRect(46, -48, 16, 42);
            }
          },

          // ---------------- 50. SECURITY (3) ----------------
          {
            id: "PADLOCK",
            cluster: "SECURITY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.roundRect(-42, -8, 84, 76, 12);
              ctx.fill();
              ctx.save();
              ctx.strokeStyle = ctx.fillStyle;
              ctx.lineWidth = 14;
              ctx.beginPath();
              ctx.arc(0, -8, 28, Math.PI, 0, false);
              ctx.stroke();
              ctx.restore();
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(0, 22, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-3, 22, 6, 20);
              });
            }
          },
          {
            id: "BADGE",
            cluster: "SECURITY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.moveTo(0, -68);
              ctx.lineTo(54, -42);
              ctx.lineTo(44, 28);
              ctx.lineTo(0, 74);
              ctx.lineTo(-44, 28);
              ctx.lineTo(-54, -42);
              ctx.closePath();
              ctx.fill();
              cutout(ctx, function () {
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                  ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * 26, -Math.sin(((18 + i * 72) * Math.PI) / 180) * 26);
                  ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * 12, -Math.sin(((54 + i * 72) * Math.PI) / 180) * 12);
                }
                ctx.closePath();
                ctx.fill();
              });
            }
          },
          {
            id: "HANDCUFFS",
            cluster: "SECURITY",
            render: function (ctx) {
              ctx.beginPath();
              ctx.arc(-34, 6, 28, 0, Math.PI * 2);
              ctx.arc(34, 6, 28, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-14, 0, 28, 12);
              cutout(ctx, function () {
                ctx.beginPath();
                ctx.arc(-34, 6, 16, 0, Math.PI * 2);
                ctx.arc(34, 6, 16, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          }
        ];

        
  return { SPECIMEN_POOL };
});
