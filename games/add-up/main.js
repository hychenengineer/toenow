ToenowScreens.mount("add-up");

      (function () {
        'use strict';
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { drawNutBag, renderArena } = window.ToenowGameModules['add-up'].renderer.createRenderer({
          get ctx() { return ctx; },
          get width() { return width; },
          get height() { return height; },
          get state() { return state; },
          get cameraTrauma() { return cameraTrauma; },
          get pointerX() { return pointerX; },
          get pointerY() { return pointerY; },
          get coreX() { return coreX; },
          get coreY() { return coreY; },
          get selectedNodes() { return selectedNodes; },
          get worldTime() { return worldTime; },
          get evaluateSelection() { return evaluateSelection; },
          get MAX_SHOCKWAVES() { return MAX_SHOCKWAVES; },
          get shockwaves() { return shockwaves; },
          get MAX_PARTICLES() { return MAX_PARTICLES; },
          get particlePool() { return particlePool; },
          get steamAlertTimer() { return steamAlertTimer; },
          get coreRadius() { return coreRadius; },
          get supplyDeliveryUntil() { return supplyDeliveryUntil; },
          get target() { return target; },
          get coreStatusText() { return coreStatusText; },
          get nodes() { return nodes; },
          get hoveredNode() { return hoveredNode; },
          get MAX_CALLOUTS() { return MAX_CALLOUTS; },
          get floatingCallouts() { return floatingCallouts; }
        });

const IS_HEADLESS =
          Boolean(navigator.webdriver) || /HeadlessChrome/i.test(navigator.userAgent || '');

        // --- Meta Progression Storage ---
        const STORAGE_KEY_BEST = 'overclock_reactor_best_v2';
        const STORAGE_KEY_CORES = 'overclock_reactor_cores_v2';

        function loadMeta() {
          let best = 0;
          let cores = 0;
          try {
            const rawBest = localStorage.getItem(STORAGE_KEY_BEST);
            best = rawBest ? parseInt(rawBest, 10) : 0;
            if (!Number.isFinite(best) || best < 0) best = 0;

            const rawCores = localStorage.getItem(STORAGE_KEY_CORES);
            cores = rawCores ? parseInt(rawCores, 10) : 0;
            if (!Number.isFinite(cores) || cores < 0) cores = 0;
          } catch (_) {}
          return { best: best, cores: cores };
        }

        function saveMeta(best, cores) {
          if (isPracticeMode) return;
          try {
            localStorage.setItem(STORAGE_KEY_BEST, String(Math.round(best)));
            localStorage.setItem(STORAGE_KEY_CORES, String(Math.round(cores)));
          } catch (_) {}
        }

        const meta = loadMeta();
        let bestScore = meta.best;
        let isPracticeMode = false;
        let totalLifetimeCores = meta.cores;

        // Initialize Toenow Game SDK
        const toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'add-up', category: 'math', gameTitle: 'Add Up' })
          : null;

        // --- Pure Addition Math Rules ---
        const { evaluateSelection, randInt, calculateTimeRefund, getChainMultiplier, getLevelInfoForWave, generateWaveData } = window.ToenowGameModules['add-up'].rules;

        // --- Native Web Audio API Synthesizer ---
        const { Sfx } = window.ToenowGameModules['add-up'].audio;

        // --- Zero-GC Pooled Particles & Shockwaves ---
        const MAX_PARTICLES = 360;
        const particlePool = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
          particlePool.push({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 2,
            life: 0,
            maxLife: 1,
            color: '#22d3ee',
            isSteam: false,
          });
        }
        let particleCursor = 0;

        function spawnParticle(x, y, vx, vy, radius, maxLife, color, isSteam) {
          const p = particlePool[particleCursor];
          particleCursor = (particleCursor + 1) % MAX_PARTICLES;
          p.active = true;
          p.x = x;
          p.y = y;
          p.vx = vx;
          p.vy = vy;
          p.radius = radius;
          p.life = maxLife;
          p.maxLife = maxLife;
          p.color = color;
          p.isSteam = Boolean(isSteam);
        }

        function spawnNodeSparkBurst(x, y, color, count) {
          const n = IS_HEADLESS ? Math.min(6, count) : count;
          for (let i = 0; i < n; i++) {
            const angle = (Math.PI * 2 * i) / n + (Math.random() * 0.35 - 0.175);
            const speed = 75 + Math.random() * 220;
            spawnParticle(
              x,
              y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              2 + Math.random() * 2.8,
              0.35 + Math.random() * 0.35,
              color,
              false
            );
          }
        }

        function spawnSteamPlume(coreX, coreY, coreRadius) {
          const count = IS_HEADLESS ? 8 : 28;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.3 - 0.15);
            const speed = 90 + Math.random() * 160;
            const sx = coreX + Math.cos(angle) * (coreRadius * 0.85);
            const sy = coreY + Math.sin(angle) * (coreRadius * 0.85);
            spawnParticle(
              sx,
              sy,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed - 35,
              6 + Math.random() * 8,
              0.45 + Math.random() * 0.3,
              'rgba(226, 232, 240, 0.75)',
              true
            );
          }
        }

        const MAX_SHOCKWAVES = 8;
        const shockwaves = [];
        for (let i = 0; i < MAX_SHOCKWAVES; i++) {
          shockwaves.push({
            active: false,
            x: 0,
            y: 0,
            radius: 0,
            maxRadius: 300,
            life: 0,
            maxLife: 0.45,
            color: '#22d3ee',
          });
        }

        function triggerShockwave(x, y, maxRadius, color) {
          for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            if (!shockwaves[i].active) {
              const sw = shockwaves[i];
              sw.active = true;
              sw.x = x;
              sw.y = y;
              sw.radius = 45;
              sw.maxRadius = maxRadius;
              sw.life = 0.52;
              sw.maxLife = 0.52;
              sw.color = color;
              return;
            }
          }
        }

        const MAX_CALLOUTS = 8;
        const floatingCallouts = [];
        for (let i = 0; i < MAX_CALLOUTS; i++) {
          floatingCallouts.push({
            active: false,
            x: 0,
            y: 0,
            text: '',
            subtext: '',
            color: '#67e8f9',
            life: 0,
            maxLife: 0.95,
          });
        }

        function spawnCallout(x, y, text, subtext, color) {
          for (let i = 0; i < MAX_CALLOUTS; i++) {
            if (!floatingCallouts[i].active) {
              const fc = floatingCallouts[i];
              fc.active = true;
              fc.x = x;
              fc.y = y;
              fc.text = text;
              fc.subtext = subtext || '';
              fc.color = color || '#67e8f9';
              fc.life = 1.0;
              fc.maxLife = 1.0;
              return;
            }
          }
        }

        // --- DOM Elements ---
        const canvas = document.getElementById('reactor-canvas');
        const ctx = canvas.getContext('2d');
        const accessibleNodeBank = document.getElementById('accessible-node-bank');
        const criticalVignette = document.getElementById('critical-vignette');

        const hudScoreEl = document.getElementById('hud-score');
        const hudBestEl = document.getElementById('hud-best');
        const hudWaveEl = document.getElementById('hud-wave');
        const hudCoresEl = document.getElementById('hud-cores');
        const hudTimerEl = document.getElementById('hud-timer');
        const hudTimerFillEl = document.getElementById('hud-timer-fill');
        const hudTimerGhostEl = document.getElementById('hud-timer-ghost');
        const titleScreenEl = document.getElementById('title-screen');
        const pauseScoreEl = document.getElementById('pause-score');
        const pauseWaveEl = document.getElementById('pause-wave');

        // --- Game State Variables ---
        const MAX_BANKED_TIME = 60.0;
        let state = 'title'; // 'title' | 'playing' | 'paused' | 'gameover'
        let width = window.innerWidth;
        let height = window.innerHeight;
        let dpr = 1;
        let coreX = width * 0.5;
        let coreY = height * 0.52;
        let coreRadius = 74;

        let score = 0;
        let wave = 1;
        let wavesStabilizedThisRun = 0;
        let target = 20;

        let timeLeft = MAX_BANKED_TIME;
        let ghostTimeLeft = MAX_BANKED_TIME;

        let hitstopTimer = 0;
        let cameraTrauma = 0;
        let steamAlertTimer = 0;
        let coreFlashTimer = 0;
        let coreStatusText = 'STABLE';
        let worldTime = 0;

        let pointerX = width * 0.5;
        let pointerY = height * 0.5;
        let hoveredNode = null;

        let nodes = [];
        let selectedNodes = [];

        function syncMetaUI() {
          hudBestEl.textContent = String(Math.round(bestScore));
          ToenowScreens.updateTitle('add-up', { bestScore: bestScore, bestWave: parseInt(localStorage.getItem('add_up_best_wave') || '1', 10) });
          hudCoresEl.textContent = String(totalLifetimeCores);
        }

        function getActiveCoreCenter() {
          const isCompact = width < 820;
          return { x: width * 0.5, y: isCompact ? height * 0.54 : height * 0.52 };
        }

        function computeNodeOrbitPosition(idx, count) {
          const isCompact = width < 820;
          const center = getActiveCoreCenter();
          const nodeRadius = isCompact
            ? Math.max(26, Math.min(32, Math.min(width, height) * 0.074))
            : Math.max(34, Math.min(43, Math.min(width, height) * 0.052));

          const orbitMin = coreRadius + nodeRadius + (isCompact ? 26 : 54);
          const availHalfW = width * 0.43;
          const availHalfH = height * (isCompact ? 0.33 : 0.37);
          const orbitMaxX = Math.max(orbitMin + 16, availHalfW - nodeRadius);
          const orbitMaxY = Math.max(orbitMin + 24, availHalfH - nodeRadius);

          const baseAngle = (Math.PI * 2 * idx) / Math.max(1, count) - Math.PI * 0.5;
          const ringFactor = idx % 2 === 0 ? 0.65 : 0.92;
          const rx = orbitMin + (orbitMaxX - orbitMin) * ringFactor;
          const ry = orbitMin + (orbitMaxY - orbitMin) * ringFactor;

          return {
            x: center.x + Math.cos(baseAngle) * rx,
            y: center.y + Math.sin(baseAngle) * ry,
            radius: nodeRadius,
            baseAngle: baseAngle,
          };
        }

        function repositionNodesForViewport() {
          if (!nodes || nodes.length === 0) return;
          const count = nodes.length;
          for (let i = 0; i < count; i++) {
            const orbit = computeNodeOrbitPosition(i, count);
            nodes[i].x = orbit.x;
            nodes[i].y = orbit.y;
            nodes[i].radius = orbit.radius;
          }
        }

        function updateCanvasSize() {
          const rect = canvas.getBoundingClientRect();
          const prevW = width;
          const prevH = height;
          width = Math.max(320, rect.width || window.innerWidth);
          height = Math.max(320, rect.height || window.innerHeight);
          dpr = IS_HEADLESS ? 1 : Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const isCompact = width < 820;
          coreRadius = isCompact
            ? Math.max(48, Math.min(62, Math.min(width, height) * 0.135))
            : Math.max(58, Math.min(82, Math.min(width, height) * 0.11));

          const center = getActiveCoreCenter();
          coreX = center.x;
          coreY = center.y;

          if (Math.abs(width - prevW) > 4 || Math.abs(height - prevH) > 4) {
            repositionNodesForViewport();
          }
        }

        updateCanvasSize();
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(function () {
            updateCanvasSize();
          });
          ro.observe(canvas);
        }
        window.addEventListener('resize', updateCanvasSize);

        function rebuildAccessibleNodeButtons() {
          accessibleNodeBank.innerHTML = '';
          nodes.forEach(function (node, idx) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.nodeIndex = String(idx);
            btn.textContent =
              'Plasma Node ' + (idx + 1) + ': ' + node.label + (node.selected ? ' (Linked)' : '');
            btn.addEventListener('click', function () {
              if (state === 'playing') {
                toggleNodeSelection(node);
              }
            });
            accessibleNodeBank.appendChild(btn);
          });
        }

        function spawnWaveNodes(waveNum) {
          if (window.ToenowAnimals) window.ToenowAnimals.setWave('add-up', waveNum);
          const waveData = generateWaveData(waveNum);
          wave = waveData.wave;
          target = waveData.target;
          coreStatusText = 'STABLE';
          selectedNodes = [];

          const center = getActiveCoreCenter();
          coreX = center.x;
          coreY = center.y;

          const count = waveData.items.length;
          nodes = waveData.items.map(function (item, idx) {
            const orbit = computeNodeOrbitPosition(idx, count);
            // Constant normal speed across all waves!
            const speed = 18 + Math.random() * 12;
            const velAngle = orbit.baseAngle + Math.PI * 0.5 + (Math.random() * 0.5 - 0.25);

            return {
              id: idx + 1,
              index: idx,
              op: 'add',
              value: item.value,
              label: item.label,
              x: orbit.x,
              y: orbit.y,
              vx: Math.cos(velAngle) * speed,
              vy: Math.sin(velAngle) * speed,
              radius: orbit.radius,
              selected: false,
              scaleX: 1,
              scaleY: 1,
              flash: 0,
              phase: idx * 0.9,
            };
          });

          rebuildAccessibleNodeButtons();
          updateHUD();
        }

        function setGameState(nextState) {
          const prevState = state;
          state = nextState;
          document.body.dataset.state = nextState;
          if (titleScreenEl) {
            titleScreenEl.classList.toggle('hidden', nextState !== 'title');
          }
          const center = getActiveCoreCenter();
          coreX = center.x;
          coreY = center.y;
          if (prevState !== nextState && (prevState === 'title' || nextState === 'title')) {
            repositionNodesForViewport();
          }
          if (document.activeElement && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }

        function startNewGame(startWave = 1, isPractice = false) {
          if (toenowSdk && !window.ToenowTutorials?.isActive('add-up')) toenowSdk.startRun({ wave: startWave, isPractice });
          isPracticeMode = Boolean(isPractice);
          score = 0;
          wave = startWave;
          wavesStabilizedThisRun = 0;
          timeLeft = MAX_BANKED_TIME;
          ghostTimeLeft = MAX_BANKED_TIME;

          hitstopTimer = 0;
          cameraTrauma = 0;
          steamAlertTimer = 0;
          coreFlashTimer = 0;
          coreStatusText = 'STABLE';

          criticalVignette.dataset.active = 'false';

          setGameState('playing');
          spawnWaveNodes(1);
          updateHUD();
        }

        function triggerGameOver() {
          if (window.ToenowTutorials?.isActive('add-up')) return;
          const finalScore = Math.round(score);
          if (!isPracticeMode && finalScore > bestScore) {
            bestScore = finalScore;
          }
          if (!isPracticeMode) {
            totalLifetimeCores += wavesStabilizedThisRun;
            saveMeta(bestScore, totalLifetimeCores);
            const curBestWave = parseInt(localStorage.getItem('add_up_best_wave') || '1', 10) || 1;
            if (wavesStabilizedThisRun > curBestWave) {
              try {
                localStorage.setItem('add_up_best_wave', String(wavesStabilizedThisRun));
              } catch (_) {}
            }
            syncMetaUI();
          }

          ToenowScreens.updateGameOver('add-up', { score: finalScore, bestScore, wave: wave, combo: null });
                    criticalVignette.dataset.active = 'false';
          Sfx.playGameOver();
          setGameState('gameover');

          // Toenow Game SDK Unified Lifecycle & Hub Contract
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: finalScore,
              wave: wavesStabilizedThisRun || 1,
              isPractice: isPracticeMode
            });
          } else {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(
                  {
                    type: 'GAME_OVER',
                    gameId: 'add-up',
                    category: 'math',
                    score: finalScore,
                    isPractice: Boolean(isPracticeMode),
                    wave: wavesStabilizedThisRun || 1
                  },
                  '*'
                );
              }
            } catch (_) {}
          }
        }

        function clearCurrentSelection(withSound) {
          if (selectedNodes.length === 0) return;
          for (let i = 0; i < nodes.length; i++) {
            nodes[i].selected = false;
          }
          selectedNodes = [];
          if (withSound) {
            Sfx.playDeselect();
          }
          rebuildAccessibleNodeButtons();
          updateHUD();
        }

        function toggleNodeSelection(node) {
          if (state !== 'playing' || !node) return;
          if (window.ToenowTutorials?.isActive('add-up') && window.ToenowTutorials?.isComplete('add-up')) return;

          if (node.selected) {
            node.selected = false;
            const idx = selectedNodes.indexOf(node);
            if (idx !== -1) selectedNodes.splice(idx, 1);
            node.scaleX = 0.88;
            node.scaleY = 1.12;
            Sfx.playDeselect();
            rebuildAccessibleNodeButtons();
            updateHUD();
            return;
          }

          // Select node
          node.selected = true;
          selectedNodes.push(node);
          node.scaleX = 1.24;
          node.scaleY = 0.82;
          node.flash = 1.0;

          spawnNodeSparkBurst(node.x, node.y, '#22d3ee', 10);
          Sfx.playSelect(selectedNodes.length - 1);

          const currentVal = evaluateSelection(selectedNodes);

          if (currentVal === target && selectedNodes.length >= 2) {
            if (window.ToenowTutorials?.isActive('add-up')) {
              coreStatusText = 'STABLE';
              Sfx.playValidBoom(selectedNodes.length);
              selectedNodes.forEach(sn => spawnNodeSparkBurst(sn.x, sn.y, '#67e8f9', 18));
              coreFlashTimer = 0.35;
              rebuildAccessibleNodeButtons();
              updateHUD();
              window.ToenowTutorials.complete('add-up');
              return;
            }
            // EXACT MATCH!
            if (window.ToenowAnimals) window.ToenowAnimals.feedback('add-up', true);
            supplyDeliveryUntil = performance.now() + 800;
            const usedCount = selectedNodes.length;

            // Score & Time Rules:
            // - 2 nodes: +0s, 1x score, no extra subtext
            // - 3 nodes: +5s, 2x score
            // - 4+ nodes: +10s, 3x score
            const chainMult = getChainMultiplier(usedCount);
            const refundSecs = calculateTimeRefund(usedCount);
            const basePoints = 100 + wave * 20;
            const pointsEarned = Math.round(basePoints * chainMult);

            score += pointsEarned;
            wavesStabilizedThisRun += 1;

            if (!isPracticeMode && score > bestScore) {
              bestScore = score;
              syncMetaUI();
            }

            if (refundSecs > 0) {
              timeLeft = Math.min(MAX_BANKED_TIME, timeLeft + refundSecs);
              ghostTimeLeft = Math.max(ghostTimeLeft, timeLeft);
            }

            Sfx.playValidBoom(usedCount);

            for (let i = 0; i < selectedNodes.length; i++) {
              const sn = selectedNodes[i];
              spawnNodeSparkBurst(sn.x, sn.y, '#67e8f9', usedCount >= 4 ? 32 : 18);
            }

            const shockColor = usedCount >= 4 ? '#fbbf24' : '#22d3ee';
            triggerShockwave(
              coreX,
              coreY,
              Math.max(width, height) * (usedCount >= 4 ? 0.65 : 0.45),
              shockColor
            );

            hitstopTimer = usedCount >= 4 ? 0.07 : 0.04;
            cameraTrauma = Math.min(1.0, cameraTrauma + (usedCount >= 4 ? 0.7 : 0.4));
            coreFlashTimer = 0.35;

            let subLabel = '';
            if (usedCount === 3) {
              subLabel = '2X SCORE · +5s';
            } else if (usedCount >= 4) {
              subLabel = '3X SCORE · +10s';
            }

            spawnCallout(
              coreX,
              coreY - coreRadius - 24,
              '+' + pointsEarned,
              subLabel,
              shockColor
            );

            // Advance to next wave
            spawnWaveNodes(wave + 1);
          } else if (currentVal > target) {
            // OVERSHOOT -> STEAM VENT & CLEAR!
            if (window.ToenowAnimals) window.ToenowAnimals.feedback('add-up', false);
            Sfx.playSteamVent();
            spawnSteamPlume(coreX, coreY, coreRadius);
            cameraTrauma = Math.min(1.0, cameraTrauma + 0.55);
            steamAlertTimer = 0.6;
            coreStatusText = 'OVERLOAD';

            for (let i = 0; i < nodes.length; i++) {
              if (nodes[i].selected) {
                nodes[i].selected = false;
                nodes[i].scaleX = 1.3;
                nodes[i].scaleY = 0.72;
                const dx = nodes[i].x - coreX;
                const dy = nodes[i].y - coreY;
                const dist = Math.hypot(dx, dy) || 1;
                nodes[i].vx += (dx / dist) * 85;
                nodes[i].vy += (dy / dist) * 85;
              }
            }
            selectedNodes = [];
            rebuildAccessibleNodeButtons();
            updateHUD();
          } else {
            coreStatusText = 'LINKING';
            rebuildAccessibleNodeButtons();
            updateHUD();
          }
        }

        function updateHUD() {
          hudScoreEl.textContent = String(Math.round(score));
          hudWaveEl.textContent = String(wave);
          hudCoresEl.textContent = String(totalLifetimeCores + wavesStabilizedThisRun);

          const secs = Math.max(0, Math.ceil(timeLeft));
          const isCrit = state === 'playing' && timeLeft <= 10.0;

          hudTimerEl.textContent = window.ToenowTutorials?.isActive('add-up') ? '∞' : secs + 's';
          hudTimerEl.dataset.critical = isCrit ? 'true' : 'false';
          hudTimerFillEl.dataset.critical = isCrit ? 'true' : 'false';
          criticalVignette.dataset.active = isCrit ? 'true' : 'false';

          const ratio = Math.max(0, Math.min(1, timeLeft / MAX_BANKED_TIME));
          const ghostRatio = Math.max(ratio, Math.min(1, ghostTimeLeft / MAX_BANKED_TIME));
          hudTimerFillEl.style.transform = 'scaleX(' + ratio.toFixed(3) + ')';
          hudTimerGhostEl.style.transform = 'scaleX(' + ghostRatio.toFixed(3) + ')';
        }

        // --- Coordinate Conversion & Hit Testing ---
        function screenToWorld(clientX, clientY) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: clientX - rect.left,
            y: clientY - rect.top,
          };
        }

        function findNodeAt(wx, wy) {
          let closest = null;
          let minDist = Infinity;
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const d = Math.hypot(wx - n.x, wy - n.y);
            if (d <= n.radius + 8 && d < minDist) {
              minDist = d;
              closest = n;
            }
          }
          return closest;
        }

        function handleCanvasPointer(clientX, clientY) {
          const pt = screenToWorld(clientX, clientY);
          pointerX = pt.x;
          pointerY = pt.y;
          hoveredNode = findNodeAt(pt.x, pt.y);
          if (state !== 'playing') return;

          if (hoveredNode) {
            toggleNodeSelection(hoveredNode);
          } else {
            const distToCore = Math.hypot(pt.x - coreX, pt.y - coreY);
            if (distToCore <= coreRadius && selectedNodes.length > 0) {
              clearCurrentSelection(true);
            }
          }
        }

        // Use one input stream: touch can emit a compatibility mousedown on
        // release, well after pointerdown, which would toggle the same bag twice.
        const canvasPressEvent = typeof window.PointerEvent === 'function' ? 'pointerdown' : 'mousedown';
        canvas.addEventListener(canvasPressEvent, function (e) {
          handleCanvasPointer(e.clientX, e.clientY);
        });

        window.addEventListener('pointermove', function (e) {
          const pt = screenToWorld(e.clientX, e.clientY);
          pointerX = pt.x;
          pointerY = pt.y;
          hoveredNode = findNodeAt(pt.x, pt.y);
        });

        // --- Keyboard Shortcuts ---
        const pressedKeys = new Set();
        window.addEventListener('keydown', function (e) {
          if (pressedKeys.has(e.code)) return;
          pressedKeys.add(e.code);

          if (state === 'title' || state === 'gameover') {
            if (e.code === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              startNewGame();
            }
            return;
          }

          if (e.code === 'KeyP' || e.code === 'Escape') {
            e.preventDefault();
            if (state === 'playing') {
              pauseScoreEl.textContent = String(Math.round(score));
              pauseWaveEl.textContent = String(wave);
              setGameState('paused');
            } else if (state === 'paused') {
              setGameState('playing');
            }
            return;
          }

          if (e.code === 'KeyM') {
            e.preventDefault();
            toggleMuteButton();
            return;
          }

          if (e.code === 'KeyR' && (state === 'playing' || state === 'paused')) {
            e.preventDefault();
            startNewGame();
            return;
          }

          if (state === 'playing') {
            if (e.code === 'Space' || e.code === 'Backspace') {
              e.preventDefault();
              clearCurrentSelection(true);
              return;
            }
            if (e.code.startsWith('Digit') || e.code.startsWith('Numpad')) {
              const num = parseInt(e.code.replace('Digit', '').replace('Numpad', ''), 10);
              if (num >= 1 && num <= nodes.length) {
                e.preventDefault();
                toggleNodeSelection(nodes[num - 1]);
              }
            }
          }
        });

        window.addEventListener('keyup', function (e) {
          pressedKeys.delete(e.code);
        });

        window.addEventListener('blur', function () {
          pressedKeys.clear();
        });

        document.addEventListener('visibilitychange', function () {
          if (document.hidden) pressedKeys.clear();
        });

        function toggleMuteButton() {
          const isMuted = Sfx.toggleMute();
          const svg = document.getElementById('svg-mute-icon');
          if (isMuted) {
            svg.innerHTML =
              '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />';
          } else {
            svg.innerHTML =
              '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />';
          }
        }

        // UI Buttons
        document.getElementById('btn-start-game').addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewGame();
        });
        document.getElementById('btn-clear-selection').addEventListener('click', function (e) {
          e.currentTarget.blur();
          clearCurrentSelection(true);
        });
        document.getElementById('btn-mute').addEventListener('click', function (e) {
          e.currentTarget.blur();
          toggleMuteButton();
        });
        document.getElementById('btn-pause').addEventListener('click', function (e) {
          e.currentTarget.blur();
          if (state === 'playing') {
            pauseScoreEl.textContent = String(Math.round(score));
            pauseWaveEl.textContent = String(wave);
            setGameState('paused');
          }
        });
        document.getElementById('btn-restart-hud').addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewGame();
        });
        document.getElementById('btn-resume').addEventListener('click', function (e) {
          e.currentTarget.blur();
          setGameState('playing');
        });
        document.getElementById('btn-pause-restart').addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewGame();
        });
        document.getElementById('btn-pause-title').addEventListener('click', function (e) {
          e.currentTarget.blur();
          setGameState('title');
          spawnWaveNodes(1);
        });

        document.getElementById('btn-retry').addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewGame();
        });
        document.getElementById('btn-gameover-title').addEventListener('click', function (e) {
          e.currentTarget.blur();
          setGameState('title');
          spawnWaveNodes(1);
        });

        // --- Simulation Physics Update (Constant Normal Speed) ---
        function updateSimulation(rawDt) {
          const dt = Math.min(rawDt, 0.05);
          worldTime += dt;

          cameraTrauma = Math.max(0, cameraTrauma - dt * 1.85);
          steamAlertTimer = Math.max(0, steamAlertTimer - dt);
          coreFlashTimer = Math.max(0, coreFlashTimer - dt);

          for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particlePool[i];
            if (!p.active) continue;
            p.life -= dt;
            if (p.life <= 0) {
              p.active = false;
              continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= p.isSteam ? 0.94 : 0.96;
            p.vy *= p.isSteam ? 0.94 : 0.96;
            if (p.isSteam) {
              p.radius += dt * 18;
            }
          }

          for (let i = 0; i < MAX_SHOCKWAVES; i++) {
            const sw = shockwaves[i];
            if (!sw.active) continue;
            sw.life -= dt;
            if (sw.life <= 0) {
              sw.active = false;
              continue;
            }
            const progress = 1 - sw.life / sw.maxLife;
            sw.radius = 45 + (sw.maxRadius - 45) * (1 - Math.pow(1 - progress, 3));
          }

          for (let i = 0; i < MAX_CALLOUTS; i++) {
            const fc = floatingCallouts[i];
            if (!fc.active) continue;
            fc.life -= dt;
            if (fc.life <= 0) {
              fc.active = false;
              continue;
            }
            fc.y -= dt * 26;
          }

          if (state === 'paused' || state === 'gameover') return;

          if (hitstopTimer > 0) {
            hitstopTimer = Math.max(0, hitstopTimer - dt);
            return;
          }

          if (state === 'playing' && !window.ToenowTutorials?.isActive('add-up')) {
            timeLeft = Math.max(0, timeLeft - dt);

            if (ghostTimeLeft > timeLeft) {
              ghostTimeLeft = Math.max(timeLeft, ghostTimeLeft - dt * 4.5);
            }
            if (timeLeft <= 0) {
              triggerGameOver();
              return;
            }

            updateHUD();
          }

          // Node physics (Constant Normal Drift Speed = 1.0x)
          const isCompact = width < 820;
          const topSafeY = isCompact ? 110 : 88;
          const bottomSafeY = height - 24;
          const leftSafeX = 18;
          const rightSafeX = width - 18;
          const coreClearance = coreRadius + (isCompact ? 18 : 24);

          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.scaleX += (1 - n.scaleX) * Math.min(1, dt * 14);
            n.scaleY += (1 - n.scaleY) * Math.min(1, dt * 14);
            n.flash = Math.max(0, n.flash - dt * 3.2);

            if (window.ToenowTutorials?.isActive('add-up')) {
              n.x = Math.max(leftSafeX + n.radius, Math.min(rightSafeX - n.radius, n.x));
              n.y = Math.max(topSafeY + n.radius, Math.min(bottomSafeY - n.radius, n.y));
              continue;
            }

            const bobX = Math.cos(worldTime * 1.4 + n.phase) * 5;
            const bobY = Math.sin(worldTime * 1.7 + n.phase) * 5;
            n.x += (n.vx + bobX) * dt;
            n.y += (n.vy + bobY) * dt;

            const spd = Math.hypot(n.vx, n.vy);
            const maxSpd = 38;
            const minSpd = 14;
            if (spd > maxSpd) {
              n.vx = (n.vx / spd) * maxSpd;
              n.vy = (n.vy / spd) * maxSpd;
            } else if (spd < minSpd && spd > 0.001) {
              n.vx = (n.vx / spd) * minSpd;
              n.vy = (n.vy / spd) * minSpd;
            }

            if (n.x - n.radius < leftSafeX) {
              n.x = leftSafeX + n.radius;
              n.vx = Math.abs(n.vx);
            } else if (n.x + n.radius > rightSafeX) {
              n.x = rightSafeX - n.radius;
              n.vx = -Math.abs(n.vx);
            }

            if (n.y - n.radius < topSafeY) {
              n.y = topSafeY + n.radius;
              n.vy = Math.abs(n.vy);
            } else if (n.y + n.radius > bottomSafeY) {
              n.y = bottomSafeY - n.radius;
              n.vy = -Math.abs(n.vy);
            }

            const dxCore = n.x - coreX;
            const dyCore = n.y - coreY;
            const distCore = Math.hypot(dxCore, dyCore) || 1;
            const minDistCore = coreClearance + n.radius;
            if (distCore < minDistCore) {
              const nx = dxCore / distCore;
              const ny = dyCore / distCore;
              const overlap = minDistCore - distCore;
              n.x += nx * overlap;
              n.y += ny * overlap;
              const dot = n.vx * nx + n.vy * ny;
              if (dot < 0) {
                n.vx -= 1.8 * dot * nx;
                n.vy -= 1.8 * dot * ny;
              }
            }
          }

          // Node collisions
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i];
              const b = nodes[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const dist = Math.hypot(dx, dy) || 1;
              const minDist = a.radius + b.radius + 10;
              if (dist < minDist) {
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = (minDist - dist) * 0.5;
                a.x -= nx * overlap;
                a.y -= ny * overlap;
                b.x += nx * overlap;
                b.y += ny * overlap;

                const dvx = b.vx - a.vx;
                const dvy = b.vy - a.vy;
                const relDot = dvx * nx + dvy * ny;
                if (relDot < 0) {
                  const impulse = relDot * 0.85;
                  a.vx += nx * impulse;
                  a.vy += ny * impulse;
                  b.vx -= nx * impulse;
                  b.vy -= ny * impulse;
                }
              }
            }
          }
        }

        // --- Canvas 2D Renderer ---
        let supplyDeliveryUntil = 0;

// Test & inspection hook
        window.__overclockReactor = {
          getState: function () {
            return {
              state: state,
              score: score,
              bestScore: bestScore,
              wave: wave,
              target: target,
              timeLeft: timeLeft,
              selectedSum: evaluateSelection(selectedNodes),
              nodes: nodes.map(function (n) {
                return {
                  id: n.id,
                  label: n.label,
                  op: n.op,
                  value: n.value,
                  selected: n.selected,
                  x: Math.round(n.x),
                  y: Math.round(n.y),
                };
              }),
            };
          },
          startNewGame: startNewGame,
          triggerGameOver: triggerGameOver,
          setWave: function (w) {
            wave = w;
            spawnWaveNodes(w);
          },
        };

        window.ToenowTutorials?.register('add-up', {
          start() {
            startNewGame(1, true);
            target = 5;
            nodes = nodes.slice(0, 3);
            nodes.forEach((node, i) => {
              const orbit = computeNodeOrbitPosition(i, 3);
              node.x = orbit.x;
              node.y = Math.max((width < 820 ? 110 : 88) + orbit.radius, Math.min(height - 24 - orbit.radius, orbit.y));
              node.radius = orbit.radius;
              node.value = [2, 3, 7][i];
              node.label = String(node.value);
              node.vx = node.vy = 0;
              node.selected = false;
            });
            selectedNodes = [];
            rebuildAccessibleNodeButtons();
            updateHUD();
          },
          stop() {
            isPracticeMode = false;
            score = wavesStabilizedThisRun = 0;
            selectedNodes = [];
            nodes = [];
            rebuildAccessibleNodeButtons();
            setGameState('title');
          },
          getGuide() {
            const node = nodes.find(n => n.value === 2 && !n.selected) || nodes.find(n => n.value === 3 && !n.selected);
            if (!node) return { done: true };
            const rect = canvas.getBoundingClientRect();
            return { prompt: 'Tap 2, then 3. Their sum matches the target 5.', rect: {
              x: rect.left + node.x - node.radius, y: rect.top + node.y - node.radius,
              width: node.radius * 2, height: node.radius * 2
            }};
          }
        });

        syncMetaUI();
        spawnWaveNodes(1);
        const params = new URLSearchParams(window.location.search);
        if (typeof ToenowLevels !== 'undefined' && ToenowLevels.setupPracticeMode) {
          ToenowLevels.setupPracticeMode({
            container: '#title-screen .unified-title-card',
            onStartGame: (startWave, isPractice) => {
              startNewGame(startWave, isPractice);
            }
          });
        }
        if (params.get('autostart') === '1') {
          startNewGame();
        } else {
          setGameState('title');
        }

        let lastFrameTime = performance.now();
        function frame(now) {
          const rawDt = Math.max(0.001, (now - lastFrameTime) / 1000);
          lastFrameTime = now;
          updateSimulation(rawDt);
          renderArena();

          if (IS_HEADLESS) {
            setTimeout(function () {
              requestAnimationFrame(frame);
            }, 50);
          } else {
            requestAnimationFrame(frame);
          }
        }
        requestAnimationFrame(frame);
      })();
    