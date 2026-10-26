ToenowScreens.mount("ball-track");

(function () {
        'use strict';
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { drawArenaBackground, drawTargetLineupPanel, drawTrajectoryArcs, drawShellTrail, drawShellCapsule, drawParticlesAndPopups, renderScene } = window.ToenowGameModules['ball-track'].renderer.createRenderer({
          get getPlayboardGeometry() { return getPlayboardGeometry; },
          get viewportWidth() { return viewportWidth; },
          get viewportHeight() { return viewportHeight; },
          get ctx() { return ctx; },
          get state() { return state; },
          get computeLiveSlotCoordinates() { return computeLiveSlotCoordinates; },
          get getCapsuleRadius() { return getCapsuleRadius; },
          get computeTargetLineupPositions() { return computeTargetLineupPositions; },
          get MAX_PARTICLES() { return MAX_PARTICLES; },
          get particlePool() { return particlePool; },
          get floatingPopups() { return floatingPopups; }
        });

// --- Persistent High Score Storage ---
        const STORAGE_KEY_SCORE = 'quantum_shell_best_score_v5';
        const STORAGE_KEY_WAVE = 'quantum_shell_best_wave_v5';

        // Initialize Toenow Game SDK
        const toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'ball-track', category: 'spatial', gameTitle: 'Target Track' })
          : null;

        let bestScore = 0;
        let bestWave = 1;
        try {
          bestScore = Math.max(0, parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || '0', 10) || 0);
          bestWave = Math.max(1, parseInt(localStorage.getItem(STORAGE_KEY_WAVE) || '1', 10) || 1);
        } catch (_e) {
          bestScore = 0;
          bestWave = 1;
        }

        function saveRecords(score, wave) {
          if (state && state.isPractice) return;
          if (window.ToenowTutorials?.isActive?.('ball-track')) return;
          if (score > bestScore) bestScore = score;
          if (wave > bestWave) bestWave = wave;
          try {
            localStorage.setItem(STORAGE_KEY_SCORE, String(bestScore));
            localStorage.setItem(STORAGE_KEY_WAVE, String(bestWave));
          } catch (_e) {
            // Ignore storage errors in restricted iframes
          }
        }

        // --- Native Web Audio API Synthesizer (100% Silent Overdrive, Discrete Event Chimes Only) ---
        const { QuantumAudioEngine } = window.ToenowGameModules['ball-track'].audio;

        const audio = new QuantumAudioEngine();

        // --- Calibrated Wave 1-9 Points & Wave 10+ Concentric Architecture ---
        const { EARLY_WAVE_TABLE, getWaveConfig, calculateWaveClearScore, calculateSpeedMultiplier, calculateOverdriveMultiplier, generateSwapSchedule } = window.ToenowGameModules['ball-track'].rules;

        // --- DOM References ---
        const bodyEl = document.body;
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        const hudScoreEl = document.getElementById('hud-score');
        const hudMultEl = document.getElementById('hud-mult');
        const hudOverdriveMultEl = document.getElementById('hud-overdrive-mult');
        const hudBestEl = document.getElementById('hud-best');
        const hudPhaseTextEl = document.getElementById('hud-phase-text');
        const hudTimerEl = document.getElementById('hud-timer');
        const hudWaveTargetEl = document.getElementById('hud-wave-target');
        const hudGaugeFillEl = document.getElementById('hud-gauge-fill');

        const btnOverdrive = document.getElementById('btn-overdrive');
        const btnConfirmMemory = document.getElementById('btn-confirm-memory');
        const overdriveMultReadoutEl = document.getElementById('overdrive-mult-readout');

        const waveBannerEl = document.getElementById('wave-banner');
        const waveBannerTitleEl = document.getElementById('wave-banner-title');

        const screenTitleEl = document.getElementById('screen-title');
        const screenPauseEl = document.getElementById('screen-pause');
        const screenGameoverEl = document.getElementById('screen-gameover');


        const pauseStatScoreEl = document.getElementById('pause-stat-score');
        const pauseStatWaveEl = document.getElementById('pause-stat-wave');
        const pauseStatTimeEl = document.getElementById('pause-stat-time');

        const btnStartGame = document.getElementById('btn-start-game');
        const btnResumeGame = document.getElementById('btn-resume-game');
        const btnRestartPause = document.getElementById('btn-restart-pause');
        const btnTitlePause = document.getElementById('btn-title-pause');
        const btnTryAgain = document.getElementById('btn-try-again');
        const btnTitleGameover = document.getElementById('btn-title-gameover');
        const btnMute = document.getElementById('btn-mute');
        const btnPause = document.getElementById('btn-pause');
        const btnRestartHud = document.getElementById('btn-restart-hud');
        const iconSoundOn = document.getElementById('icon-sound-on');
        const iconSoundOff = document.getElementById('icon-sound-off');

        // --- Viewport & Strict 1:1 Circular Geometry ---
        let viewportWidth = (window.ToenowTutorials?.getViewport?.().width || window.innerWidth);
        let viewportHeight = (window.ToenowTutorials?.getViewport?.().height || window.innerHeight);
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        let hexPatternCanvas = null;
        function buildHexPattern() {
          const pCanvas = document.createElement('canvas');
          const w = 52;
          const h = 90;
          pCanvas.width = w;
          pCanvas.height = h;
          const pCtx = pCanvas.getContext('2d');
          pCtx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
          pCtx.lineWidth = 1;

          function drawHex(cx, cy, r) {
            pCtx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i + Math.PI / 6;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              if (i === 0) pCtx.moveTo(x, y);
              else pCtx.lineTo(x, y);
            }
            pCtx.closePath();
            pCtx.stroke();
          }

          drawHex(w / 2, h / 4, 24);
          drawHex(0, (h * 3) / 4, 24);
          drawHex(w, (h * 3) / 4, 24);
          hexPatternCanvas = pCanvas;
        }

        function resizeCanvas() {
          viewportWidth = (window.ToenowTutorials?.getViewport?.().width || window.innerWidth);
          viewportHeight = (window.ToenowTutorials?.getViewport?.().height || window.innerHeight);
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(viewportWidth * dpr);
          canvas.height = Math.floor(viewportHeight * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          buildHexPattern();
          recomputeShellSlotPositions();
          if (waveBannerEl) {
            const { cx, cy } = getPlayboardGeometry();
            waveBannerEl.style.left = `${cx}px`;
            waveBannerEl.style.top = `${cy}px`;
          }
        }

        window.addEventListener('resize', resizeCanvas);

        // --- Object-Pooled Particle & Popup System ---
        const MAX_PARTICLES = 180;
        const particlePool = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
          particlePool.push({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 2,
            alpha: 1,
            life: 0,
            maxLife: 1,
            color: '#22d3ee',
            kind: 'spark',
            rotation: 0,
            vRot: 0,
          });
        }

        function spawnParticle(x, y, vx, vy, size, maxLife, color, kind = 'spark') {
          for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particlePool[i];
            if (!p.active) {
              p.active = true;
              p.x = x;
              p.y = y;
              p.vx = vx;
              p.vy = vy;
              p.size = size;
              p.alpha = 1;
              p.life = maxLife;
              p.maxLife = maxLife;
              p.color = color;
              p.kind = kind;
              p.rotation = Math.random() * Math.PI * 2;
              p.vRot = (Math.random() - 0.5) * 10;
              return;
            }
          }
        }

        function triggerCoreCrackBurst(x, y, isSuccess) {
          const primaryColor = isSuccess ? '#79b4a3' : '#f43f5e';
          const secondaryColor = isSuccess ? '#e1c987' : '#fda4af';

          spawnParticle(x, y, 0, 0, 14, 0.36, primaryColor, 'ring');

          const count = isSuccess ? 8 : 22;
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
            const speed = isSuccess ? 30 + Math.random() * 55 : 75 + Math.random() * 210;
            const color = i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? primaryColor : secondaryColor;
            const kind = i % 4 === 0 ? 'shard' : 'spark';
            spawnParticle(
              x,
              y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              isSuccess ? 2 + Math.random() * 2 : kind === 'shard' ? 4 + Math.random() * 4 : 2 + Math.random() * 3,
              0.28 + Math.random() * 0.34,
              color,
              kind
            );
          }
        }

        const floatingPopups = [];
        function spawnPopup(x, y, text, subtext, color = '#22d3ee') {
          floatingPopups.push({
            x,
            y,
            text,
            subtext,
            color,
            life: 0.9,
            maxLife: 0.9,
          });
        }

        // --- Game State ---
        const state = {
          mode: 'title', // 'title' | 'playing' | 'paused' | 'gameover'
          phase: 'idle', // 'idle' | 'wave_ready' | 'lineup' | 'insert' | 'ready_banner' | 'go_banner' | 'shuffle' | 'select' | 'wave_clear' | 'resolve' | 'defeat_beat'
          wave: 1,
          score: 0,
          waveStartScore: 0,
          waveTargetScore: 100,
          waveAwardedSoFar: 0,
          streak: 0,
          currentMult: 1,
          runTimeSec: ToenowTime.START_SECONDS,
          mistakesThisWave: 0,
          bonusTimeBufferMs: 0,
          // Overdrive Acceleration State
          isOverdrive: false,
          overdriveHeldDurationMs: 0,
          overdriveMultiplier: 1.0,
          // Orbital Rotation Angles
          boardRotationAngle: 0,
          innerRingAngle: 0,
          outerRingAngle: 0,
          config: getWaveConfig(1, 0, 0),
          shells: [],
          swapSchedule: [],
          currentSwapIndex: 0,
          swapElapsedMs: 0,
          phaseElapsedMs: 0,
          phaseDurationMs: 1200,
          activeSwap: null,
          trauma: 0,
          hitstopMs: 0,
          lastTickSecond: -1,
          pointerX: -999,
          pointerY: -999,
          frozenSnapshot: {
            score: 0,
            wave: 1,
            best: 0,
            reason: '',
          },
        };

        // Responsive Capsule Radius scaled for up to 10 capsules & mobile screens
        function getCapsuleRadius() {
          const stageSpan = Math.min(viewportWidth, viewportHeight, 640);
          const count = state.config ? state.config.shellCount : 3;
          const isDual = state.config ? state.config.isDualRing : false;
          const isMobile = viewportWidth < 480;

          if (isDual) {
            if (count >= 10) {
              return Math.max(15, Math.min(23, stageSpan * (isMobile ? 0.043 : 0.036)));
            }
            if (count >= 8) {
              return Math.max(16, Math.min(25, stageSpan * (isMobile ? 0.046 : 0.039)));
            }
            return Math.max(18, Math.min(27, stageSpan * (isMobile ? 0.05 : 0.042)));
          }

          if (count >= 9) {
            return Math.max(15, Math.min(24, stageSpan * (isMobile ? 0.045 : 0.038)));
          }
          if (count >= 7) {
            return Math.max(18, Math.min(27, stageSpan * (isMobile ? 0.052 : 0.044)));
          }
          if (count >= 5) {
            return Math.max(20, Math.min(30, stageSpan * (isMobile ? 0.058 : 0.048)));
          }
          return Math.max(22, Math.min(33, stageSpan * (isMobile ? 0.064 : 0.052)));
        }

        /**
         * Computes playboard geometry:
         * - Coaxially centered orbit (`cx = viewportWidth * 0.5`) aligned with Top & Bottom HUD
         * - Bounded central arcade stage (`max-width: 580px`) so preview and published full-screen match
         * - Top-Right anchored "TARGET" vertical lineup coordinates (`queueX`, `queueTopY`)
         */
        function getPlayboardGeometry() {
          const isMobile = viewportWidth < 520;
          const hudEl = document.getElementById('hud-top');
          const canvasTop = canvas.getBoundingClientRect().top;
          const measuredHudBottom =
            hudEl && state.mode !== 'title' ? hudEl.getBoundingClientRect().bottom - canvasTop : 0;
          let hudTopClearance = Math.max(isMobile ? 148 : 118, measuredHudBottom + 10);
          const bottomHud = document.getElementById('bottom-hud');
          const bottomTop = bottomHud ? bottomHud.getBoundingClientRect().top - canvasTop : viewportHeight;
          const hudBottomClearance = Math.max(isMobile ? 84 : 90,viewportHeight-bottomTop+12);
          const availH = Math.max(window.ToenowTutorials?.isActive?.('ball-track') ? 80 : 200, viewportHeight - hudTopClearance - hudBottomClearance);

          const stageW = Math.min(viewportWidth * 0.94, 580);
          const stageRight = viewportWidth * 0.5 + stageW * 0.5;
          const panelW = isMobile ? 66 : 86;
          const queueColW = panelW + (isMobile ? 8 : 14);

          // Keep orbit horizontally centered with the Top HUD & Bottom Overdrive button
          const cx = viewportWidth * 0.5;
          const cy = hudTopClearance + availH * (isMobile ? 0.55 : 0.52);

          const R = getCapsuleRadius();
          // Ensure centered orbit never collides with the top-right TARGET queue inside the stage
          const halfStageClear = Math.max(115, stageW * 0.5 - panelW - (isMobile ? 6 : 14));
          const maxRadiusFromStage = halfStageClear - R * 0.85;
          const maxRadiusFromHeight = availH * 0.41;
          const outerRadius = Math.max(
            R * 2.25,
            Math.min(162, maxRadiusFromStage, maxRadiusFromHeight)
          );
          const innerRadius = Math.max(R * 1.6, outerRadius * 0.52);

          const queueX = stageRight - panelW * 0.5;
          // Anchor TARGET queue at the top-right of the bounded stage below the HUD
          const queueTopY = hudTopClearance + R + (isMobile ? 34 : 40);

          return {
            cx,
            cy,
            innerRadius,
            outerRadius,
            queueX,
            queueTopY,
            queueColW,
            panelW,
            hudTopClearance,
            isMobile,
          };
        }

        // Compute Top-Right Vertical Target Lineup Coordinates downwards
        function computeTargetLineupPositions(targetCount) {
          const { queueX, queueTopY, isMobile } = getPlayboardGeometry();
          const R = getCapsuleRadius();
          const count = Math.max(1, targetCount);
          const gap = Math.max(R * (isMobile ? 2.02 : 2.12), isMobile ? 36 : 44);
          const coords = [];
          for (let i = 0; i < count; i++) {
            coords.push({
              x: queueX,
              y: queueTopY + i * gap,
              index: i,
            });
          }
          return coords;
        }

        // Strict 1:1 Circular Orbit Slot Coordinates
        function computeLiveSlotCoordinates() {
          const { cx, cy, innerRadius, outerRadius } = getPlayboardGeometry();
          const cfg = state.config;
          const coords = [];

          if (cfg && cfg.isDualRing) {
            const innerCount = Math.max(1, cfg.innerRingCount);
            const outerCount = Math.max(1, cfg.outerRingCount);

            for (let i = 0; i < innerCount; i++) {
              const baseAngle = -Math.PI / 2 + (i * Math.PI * 2) / innerCount;
              const angle = baseAngle + state.innerRingAngle;
              coords.push({
                x: cx + Math.cos(angle) * innerRadius,
                y: cy + Math.sin(angle) * innerRadius,
                ring: 'inner',
                ringIndex: i,
              });
            }

            for (let j = 0; j < outerCount; j++) {
              const baseAngle = -Math.PI / 2 + Math.PI / outerCount + (j * Math.PI * 2) / outerCount;
              const angle = baseAngle + state.outerRingAngle;
              coords.push({
                x: cx + Math.cos(angle) * outerRadius,
                y: cy + Math.sin(angle) * outerRadius,
                ring: 'outer',
                ringIndex: j,
              });
            }

            return coords;
          }

          const count = state.shells.length || (cfg ? cfg.shellCount : 3);
          for (let i = 0; i < count; i++) {
            const baseAngle = -Math.PI / 2 + (i * Math.PI * 2) / count;
            const angle = baseAngle + state.boardRotationAngle;
            coords.push({
              x: cx + Math.cos(angle) * outerRadius,
              y: cy + Math.sin(angle) * outerRadius,
              ring: 'single',
              ringIndex: i,
            });
          }
          return coords;
        }

        function recomputeShellSlotPositions() {
          if (!state.shells.length) return;
          const slots = computeLiveSlotCoordinates();
          const lineupCoords = computeTargetLineupPositions(state.config.targetCount);
          for (const shell of state.shells) {
            const slot = slots[shell.slotIndex] || slots[0];
            shell.baseX = slot.x;
            shell.baseY = slot.y;
            shell.ring = slot.ring;
            if (shell.hasCore && typeof shell.targetOrder === 'number' && lineupCoords[shell.targetOrder]) {
              shell.lineupX = lineupCoords[shell.targetOrder].x;
              shell.lineupY = lineupCoords[shell.targetOrder].y;
            }
            if (state.phase === 'lineup' || state.phase === 'wave_ready') {
              if (shell.hasCore) {
                shell.x = shell.lineupX;
                shell.y = shell.lineupY;
              } else {
                shell.x = slot.x;
                shell.y = slot.y;
              }
            } else if (state.phase !== 'shuffle' && state.phase !== 'insert') {
              shell.x = slot.x;
              shell.y = slot.y;
            }
          }
        }

        function createTitleShowcaseShells() {
          state.config = getWaveConfig(1, 0, 0);
          state.boardRotationAngle = 0;
          state.innerRingAngle = 0;
          state.outerRingAngle = 0;
          state.shells = [];
          for (let i = 0; i < 3; i++) {
            state.shells.push({
              id: i,
              slotIndex: i,
              ring: 'single',
              hasCore: i === 0,
              targetOrder: i === 0 ? 0 : -1,
              picked: false,
              x: 0,
              y: 0,
              baseX: 0,
              baseY: 0,
              lineupX: 0,
              lineupY: 0,
              shieldOpen: i === 0 ? 1 : 0,
              scaleX: 1,
              scaleY: 1,
              flash: 0,
              revealedState: 'none',
              trail: [],
            });
          }
          const slots = computeLiveSlotCoordinates();
          for (let i = 0; i < state.shells.length; i++) {
            state.shells[i].x = slots[i].x;
            state.shells[i].y = slots[i].y;
            state.shells[i].baseX = slots[i].x;
            state.shells[i].baseY = slots[i].y;
          }
        }

        function setBodyState(mode, phase) {
          state.mode = mode;
          state.phase = phase;
          btnConfirmMemory.hidden = mode !== 'playing' || phase !== 'memorize' || Boolean(window.ToenowTutorials?.isActive?.('ball-track'));
          btnOverdrive.disabled = mode !== 'playing' || phase !== 'shuffle';
          bodyEl.setAttribute('data-mode', mode);
          bodyEl.setAttribute('data-phase', phase);

          screenTitleEl.classList.toggle('active', mode === 'title');
          screenPauseEl.classList.toggle('active', mode === 'paused');
          screenGameoverEl.classList.toggle('active', mode === 'gameover');

          // Show wave/staging banner centered at (cx, cy) during wave_ready, ready_banner, or go_banner
          const showBanner =
            mode === 'playing' &&
            (phase === 'wave_ready' || phase === 'ready_banner' || phase === 'go_banner');
          if (showBanner) {
            const { cx, cy } = getPlayboardGeometry();
            waveBannerEl.style.left = `${cx}px`;
            waveBannerEl.style.top = `${cy}px`;
          }
          waveBannerEl.classList.toggle('visible', showBanner);
          waveBannerEl.classList.toggle('ready-mode', phase === 'ready_banner');
          waveBannerEl.classList.toggle('go-mode', phase === 'go_banner');
        }

        function syncRunTime() {
          hudTimerEl.textContent = window.ToenowTutorials?.isActive?.('ball-track') ? '∞' : state.runTimeSec.toFixed(1) + 's';
        }

        function endTimedRun() {
          if (state.mode !== 'playing' || window.ToenowTutorials?.isActive?.('ball-track')) return;
          state.runTimeSec = 0;
          syncRunTime();
          saveRecords(state.score, state.wave);
          state.frozenSnapshot = { score: Math.round(state.score), wave: state.wave, best: Math.round(bestScore), reason: 'TIME EXPIRED' };
          showGameOverModal();
        }

        function updateHudReadouts() {
          hudScoreEl.textContent = String(Math.round(state.score));
          hudMultEl.textContent = state.currentMult.toFixed(1).replace(/\.0$/, '') + 'x';
          hudOverdriveMultEl.textContent = state.overdriveMultiplier.toFixed(1) + 'x';
          hudBestEl.textContent = String(Math.round(bestScore));
          ToenowScreens.updateTitle('ball-track', { bestScore: bestScore, bestWave: bestWave });
          // Exact required indicator format: "WAVE [X] | TARGET: [Y]"
          hudWaveTargetEl.textContent = `WAVE ${state.wave} | TARGET: ${state.config.targetCount}`;
          syncRunTime();
        }

        // Overdrive State Setter (100% Silent — Zero Audio Oscillator)
        function setOverdriveState(active) {
          const canOverdrive = state.mode === 'playing' && state.phase === 'shuffle';
          const nextState = Boolean(active && canOverdrive);
          if (state.isOverdrive === nextState) return;
          state.isOverdrive = nextState;
          btnOverdrive.classList.toggle('active', nextState);
        }

        // Strict Timer Gate Helper: Timer stays 100% FROZEN until "GO!"
        function setFrozenTimerHud(phaseLabel, colorHex = '#22d3ee') {
          hudPhaseTextEl.textContent = phaseLabel;
          hudPhaseTextEl.style.color = colorHex;
          syncRunTime();
          hudGaugeFillEl.style.transform = 'scaleX(1)';
          hudGaugeFillEl.style.backgroundColor = colorHex;
        }

        // --- Initialize Wave with Top-Right "TARGET" Lineup & READY -> GO! Staging ---
        function initWave(waveNum, showWaveBanner = true) {
          state.wave = waveNum;
          if (window.ToenowAnimals) window.ToenowAnimals.setWave('ball-track', waveNum);
          state.config = getWaveConfig(
            waveNum,
            state.bonusTimeBufferMs
          );
          state.bonusTimeBufferMs = 0;
          state.mistakesThisWave = 0;
          state.waveStartScore = state.score;
          state.waveAwardedSoFar = 0;

          state.isOverdrive = false;
          state.overdriveHeldDurationMs = 0;
          state.overdriveMultiplier = 1.0;
          state.boardRotationAngle = 0;
          state.innerRingAngle = 0;
          state.outerRingAngle = 0;
          btnOverdrive.classList.remove('active');
          overdriveMultReadoutEl.textContent = 'BET MULTIPLIER: 1.0x -> 3.5x';
          hudOverdriveMultEl.textContent = '1.0x';

          const indices = [];
          for (let i = 0; i < state.config.shellCount; i++) indices.push(i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = indices[i];
            indices[i] = indices[j];
            indices[j] = tmp;
          }
          const targetSet = new Set(indices.slice(0, state.config.targetCount));

          state.shells = [];
          for (let i = 0; i < state.config.shellCount; i++) {
            state.shells.push({
              id: i,
              slotIndex: i,
              ring: 'single',
              hasCore: targetSet.has(i),
              targetOrder: -1,
              picked: false,
              x: 0,
              y: 0,
              baseX: 0,
              baseY: 0,
              lineupX: 0,
              lineupY: 0,
              shieldOpen: targetSet.has(i) ? 1 : 0,
              scaleX: 1,
              scaleY: 1,
              flash: 0,
              revealedState: 'none',
              trail: [],
            });
          }

          // Assign vertical lineup order (0..targetCount-1) for target capsules in the top-right "TARGET" queue
          const slots = computeLiveSlotCoordinates();
          const targetShells = state.shells.filter((s) => s.hasCore);
          targetShells.sort((a, b) => slots[a.slotIndex].y - slots[b.slotIndex].y);
          const lineupCoords = computeTargetLineupPositions(state.config.targetCount);

          targetShells.forEach((s, idx) => {
            s.targetOrder = idx;
            s.lineupX = lineupCoords[idx].x;
            s.lineupY = lineupCoords[idx].y;
          });

          for (let i = 0; i < state.shells.length; i++) {
            const s = state.shells[i];
            const slot = slots[s.slotIndex];
            s.baseX = slot.x;
            s.baseY = slot.y;
            s.ring = slot.ring;
            if (s.hasCore) {
              // Target capsules start in the top-right TARGET lineup
              s.x = s.lineupX;
              s.y = s.lineupY;
            } else {
              // Decoy capsules sit on the circular track as dimmed neutral hulls
              s.x = slot.x;
              s.y = slot.y;
            }
          }

          state.swapSchedule = generateSwapSchedule(state.config);
          state.currentSwapIndex = 0;
          state.swapElapsedMs = 0;
          state.activeSwap = null;
          state.lastTickSecond = -1;

          saveRecords(state.score, state.wave);
          updateHudReadouts();

          if (showWaveBanner) {
            waveBannerTitleEl.textContent = `WAVE ${state.wave}`;
            state.phaseElapsedMs = 0;
            // Wave 1 display duration increased by +1.5s (520ms + 1500ms = 2020ms)
            state.phaseDurationMs = state.wave === 1 ? 2020 : 1200;
            setBodyState('playing', 'wave_ready');
            setFrozenTimerHud(`WAVE ${state.wave}`, '#22d3ee');
          } else {
            enterLineupPhase();
          }
        }

        function enterLineupPhase() {
          state.phaseElapsedMs = 0;
          state.phaseDurationMs = state.config.lineupDurationMs;
          setBodyState('playing', 'lineup');
          setFrozenTimerHud(`TARGET LINEUP (${state.config.targetCount})`, '#22d3ee');
          audio.playRevealHum(state.config.targetCount);
        }

        function confirmMemory() {
          if(state.mode !== 'playing' || state.phase !== 'memorize')return;
          for(const shell of state.shells)shell.shieldOpen=0;
          waveBannerTitleEl.textContent='READY';
          state.phaseElapsedMs=0;
          state.phaseDurationMs=state.config.readyDurationMs;
          setBodyState('playing','ready_banner');
          setFrozenTimerHud('READY','#527f71');
          audio.playReadyChime();
        }
        btnConfirmMemory.addEventListener('click',confirmMemory);

        function beginShuffleStep(stepIndex) {
          if (stepIndex >= state.swapSchedule.length) {
            setOverdriveState(false);
            state.activeSwap = null;
            state.phaseElapsedMs = 0;
            state.phaseDurationMs = state.config.selectDurationMs;
            setBodyState('playing', 'select');

            // Strict Selection State Reset: All capsules look 100% uniform and neutral until tapped
            const slots = computeLiveSlotCoordinates();
            for (const s of state.shells) {
              const slot = slots[s.slotIndex] || slots[0];
              s.baseX = slot.x;
              s.baseY = slot.y;
              s.x = slot.x;
              s.y = slot.y;
              s.shieldOpen = 0;
              s.scaleX = 1;
              s.scaleY = 1;
              s.flash = 0;
              s.revealedState = 'none';
              s.trail.length = 0;
            }

            hudPhaseTextEl.textContent = `TAP TARGETS (${state.config.targetCount})`;
            hudPhaseTextEl.style.color = '#22d3ee';
            hudGaugeFillEl.style.backgroundColor = '#22d3ee';
            hudGaugeFillEl.style.transform = 'scaleX(1)';
            return;
          }

          const step = state.swapSchedule[stepIndex];
          const shellA = state.shells.find((s) => s.slotIndex === step.pairA);
          const shellB = state.shells.find((s) => s.slotIndex === step.pairB);

          if (!shellA || !shellB) {
            state.currentSwapIndex += 1;
            beginShuffleStep(state.currentSwapIndex);
            return;
          }

          const fromSlotA = shellA.slotIndex;
          const fromSlotB = shellB.slotIndex;
          shellA.slotIndex = fromSlotB;
          shellB.slotIndex = fromSlotA;

          const liveSlots = computeLiveSlotCoordinates();
          shellA.baseX = liveSlots[shellA.slotIndex].x;
          shellA.baseY = liveSlots[shellA.slotIndex].y;
          shellA.ring = liveSlots[shellA.slotIndex].ring;
          shellB.baseX = liveSlots[shellB.slotIndex].x;
          shellB.baseY = liveSlots[shellB.slotIndex].y;
          shellB.ring = liveSlots[shellB.slotIndex].ring;

          state.activeSwap = {
            shellA,
            shellB,
            fromSlotA,
            toSlotA: shellA.slotIndex,
            fromSlotB,
            toSlotB: shellB.slotIndex,
            durationMs: step.durationMs,
            curve: step.curve,
            isDecelerationStep: step.isDecelerationStep,
            isRadialHop: step.isRadialHop,
          };

          state.swapElapsedMs = 0;
          audio.playSwapWhoosh(stepIndex);
        }

        function startNewGame(startWave = 1, isPractice = false) {
          if (!Boolean(window.ToenowTutorials?.isActive?.('ball-track')) && toenowSdk) toenowSdk.startRun({ wave: startWave, isPractice });
          audio.playUiClick(580);
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          state.score = 0;
          state.streak = 0;
          state.currentMult = 1;
          state.runTimeSec = ToenowTime.START_SECONDS;
          state.isPractice = Boolean(isPractice);

          state.mistakesThisWave = 0;
          state.bonusTimeBufferMs = 0;
          state.overdriveMultiplier = 1.0;
          state.overdriveHeldDurationMs = 0;
          state.isOverdrive = false;
          state.trauma = 0;
          state.hitstopMs = 0;
          floatingPopups.length = 0;
          initWave(startWave, true);
        }

        // --- Capsule Selection (Direct Click / Tap Only) ---
        function handleShellSelection(shell) {
          if (state.mode !== 'playing' || state.phase !== 'select') return;
          if (!shell || shell.picked || (Boolean(window.ToenowTutorials?.isActive?.('ball-track')) && Boolean(window.ToenowTutorials?.isComplete?.('ball-track')))) return;
          if (Boolean(window.ToenowTutorials?.isActive?.('ball-track'))) {
            if (!shell.hasCore) { audio.playUiClick(320); return; }
            shell.picked = true; shell.revealedState = 'correct'; shell.shieldOpen = 1; shell.flash = 0.25;
            audio.playCorrectTap(1); updateHudReadouts();
            if (state.shells.every(s => !s.hasCore || s.picked)) window.ToenowTutorials.complete('ball-track');
            return;
          }

          const remainingMs = Math.max(0, state.phaseDurationMs - state.phaseElapsedMs);

          // 1. Wrong / Empty Shell Selected -> Open shutter to show empty dark interior (ZERO light / ZERO flash)
          if (!shell.hasCore) {
            shell.picked = true;
            shell.revealedState = 'wrong';
            if (window.ToenowAnimals) window.ToenowAnimals.feedback('ball-track', false);
            shell.shieldOpen = 1;
            shell.flash = 0;
            shell.scaleX = 0.94;
            shell.scaleY = 0.94;

            state.runTimeSec = ToenowTime.wrong(state.runTimeSec);
            state.mistakesThisWave += 1;
            state.streak = 0;
            state.currentMult = 1;
            state.hitstopMs = 45;
            state.trauma = Math.min(1, state.trauma + 0.35);

            audio.playShieldCrackleAlarm();
            syncRunTime();
            updateHudReadouts();

            spawnPopup(
              shell.x,
              shell.y - 44,
              'WRONG · -5s',
              state.runTimeSec.toFixed(1) + 's',
              '#f43f5e'
            );

            if (state.runTimeSec <= 0) { endTimedRun(); return; }

            hudPhaseTextEl.textContent = 'WRONG · -5s';
            hudPhaseTextEl.style.color = '#f43f5e';
            return;
          }

          // 2. Correct Target Capsule Selected! (Opens to reveal glowing cyan core)
          shell.picked = true;
          shell.revealedState = 'correct';
          if (window.ToenowAnimals) window.ToenowAnimals.feedback('ball-track', true);
          shell.shieldOpen = 1;
          shell.flash = 0.25;
          shell.scaleX = 1.14;
          shell.scaleY = 0.88;

          state.runTimeSec = ToenowTime.correct(state.runTimeSec);
          state.streak += 1;
          const mult = calculateSpeedMultiplier(
            remainingMs,
            state.phaseDurationMs,
            state.streak
          );
          state.currentMult = mult;

          // Compute total wave clear reward using the calibrated Wave 1-9 (<4,800 cap) / Wave 10+ formula
          const scoreCalc = calculateWaveClearScore({
            wave: state.wave,
            baseWavePoints: state.config.baseWavePoints,
            currentTotalScore: state.waveStartScore,
            overdriveMultiplier: state.overdriveMultiplier,
            mistakesThisWave: state.mistakesThisWave,
          });

          const totalTargets = Math.max(1, state.config.targetCount);
          const pickedTargetsNow = state.shells.filter((s) => s.hasCore && s.picked).length;
          const unpickedTargets = totalTargets - pickedTargetsNow;

          if (unpickedTargets === 0) {
            state.score = scoreCalc.newTotalScore;
          } else {
            const share = Math.floor(scoreCalc.waveScore / totalTargets);
            state.waveAwardedSoFar += share;
            state.score = state.waveStartScore + state.waveAwardedSoFar;
          }

          saveRecords(state.score, state.wave);
          updateHudReadouts();

          state.hitstopMs = 45;
          triggerCoreCrackBurst(shell.x, shell.y, true);

          if (unpickedTargets === 0) {
            audio.playWaveClearChord();
          } else {
            audio.playCorrectTap(state.streak);
          }

          if (unpickedTargets === 0) {
            hudPhaseTextEl.textContent = 'WAVE CLEAR';
            hudPhaseTextEl.style.color = '#14b8a6';
            hudGaugeFillEl.style.backgroundColor = '#14b8a6';
            state.phaseElapsedMs = 0;
            state.phaseDurationMs = 760;
            setBodyState('playing', 'wave_clear');
          }
        }

        function showGameOverModal() {
          if (Boolean(window.ToenowTutorials?.isActive?.('ball-track'))) return;
          ToenowScreens.updateGameOver('ball-track', { score: state.frozenSnapshot.score, bestScore: state.frozenSnapshot.best, wave: state.frozenSnapshot.wave, combo: null, reason: 'TIME EXPIRED' });
                    setBodyState('gameover', 'idle');

          // Toenow Game SDK Unified Lifecycle & Hub Contract
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: Math.round(state.frozenSnapshot.score || state.score || 0),
              wave: state.frozenSnapshot.wave || state.wave || 1,
              isPractice: Boolean(state.isPractice)
            });
          } else {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(
                  {
                    type: 'GAME_OVER',
                    gameId: 'ball-track',
                    category: 'spatial',
                    score: Math.round(state.frozenSnapshot.score || state.score || 0),
                    wave: state.frozenSnapshot.wave || state.wave || 1,
                    isPractice: Boolean(state.isPractice)
                  },
                  '*'
                );
              }
            } catch (_) {}
          }
        }

        function togglePause() {
          audio.playUiClick(460);
          if (state.mode === 'playing') {
            pauseStatScoreEl.textContent = String(Math.round(state.score));
            pauseStatWaveEl.textContent = String(state.wave);
            pauseStatTimeEl.textContent = state.runTimeSec.toFixed(1) + 's';
            setOverdriveState(false);
            setBodyState('paused', state.phase);
          } else if (state.mode === 'paused') {
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
              document.activeElement.blur();
            }
            setBodyState('playing', state.phase);
          }
        }

        function returnToTitle() {
          audio.playUiClick(420);
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          setOverdriveState(false);
          createTitleShowcaseShells();
          updateHudReadouts();
          setBodyState('title', 'idle');
        }

        function screenToWorld(clientX, clientY) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: clientX - rect.left,
            y: clientY - rect.top,
          };
        }

        function findShellAtPoint(wx, wy) {
          const R = getCapsuleRadius();
          const hitRadius = Math.max(32, R * 1.42);
          let closest = null;
          let bestDist = hitRadius;

          for (const s of state.shells) {
            const dx = wx - s.x;
            const dy = wy - s.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= bestDist) {
              bestDist = dist;
              closest = s;
            }
          }
          return closest;
        }

        canvas.addEventListener(
          'pointermove',
          (e) => {
            const pt = screenToWorld(e.clientX, e.clientY);
            state.pointerX = pt.x;
            state.pointerY = pt.y;
          },
          { passive: true }
        );

        canvas.addEventListener('pointerdown', (e) => {
          const pt = screenToWorld(e.clientX, e.clientY);
          state.pointerX = pt.x;
          state.pointerY = pt.y;
          if (state.mode === 'playing' && state.phase === 'select') {
            const picked = findShellAtPoint(pt.x, pt.y);
            if (picked) {
              handleShellSelection(picked);
            }
          }
        });

        // Player-Controlled Overdrive Hold Listeners (100% Silent Visual-Only Feedback)
        btnOverdrive.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          setOverdriveState(true);
        });
        window.addEventListener('pointerup', () => {
          if (state.isOverdrive) setOverdriveState(false);
        });
        window.addEventListener('pointercancel', () => {
          if (state.isOverdrive) setOverdriveState(false);
        });

        // Keyboard Controls: Shift for Overdrive, P/Escape for Pause, M for Mute, R for Restart
        // (No Tab or keyboard capsule pre-selection)
        window.addEventListener('keydown', (e) => {
          const key = e.key;

          if (e.shiftKey || key === 'Shift') {
            if (state.mode === 'playing' && state.phase === 'shuffle') {
              setOverdriveState(true);
            }
          }

          if (e.repeat) return;

          if (state.mode === 'title') {
            if (key === 'Enter' || key === ' ') {
              e.preventDefault();
              startNewGame();
            }
            return;
          }

          if (state.mode === 'gameover') {
            if (key === 'Enter' || key === ' ') {
              e.preventDefault();
              startNewGame();
            }
            return;
          }

          if (key === 'Escape' || key === 'p' || key === 'P') {
            e.preventDefault();
            togglePause();
            return;
          }

          if (key === 'm' || key === 'M') {
            e.preventDefault();
            const isMuted = audio.toggleMute();
            iconSoundOn.style.display = isMuted ? 'none' : 'block';
            iconSoundOff.style.display = isMuted ? 'block' : 'none';
            return;
          }

          if (key === 'r' || key === 'R') {
            e.preventDefault();
            startNewGame();
          }
        });

        window.addEventListener('keyup', (e) => {
          if (e.key === 'Shift') {
            setOverdriveState(false);
          }
        });

        window.addEventListener('blur', () => {
          setOverdriveState(false);
        });

        btnStartGame.addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

        btnTryAgain.addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

        btnResumeGame.addEventListener('click', (e) => {
          e.currentTarget.blur();
          togglePause();
        });

        btnRestartPause.addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

        btnRestartHud.addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

        btnPause.addEventListener('click', (e) => {
          e.currentTarget.blur();
          togglePause();
        });

        btnMute.addEventListener('click', (e) => {
          e.currentTarget.blur();
          const isMuted = audio.toggleMute();
          iconSoundOn.style.display = isMuted ? 'none' : 'block';
          iconSoundOff.style.display = isMuted ? 'block' : 'none';
        });

        btnTitlePause.addEventListener('click', (e) => {
          e.currentTarget.blur();
          returnToTitle();
        });

        btnTitleGameover.addEventListener('click', (e) => {
          e.currentTarget.blur();
          returnToTitle();
        });


        function easeInOutCubic(t) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function easeOutCubic(t) {
          return 1 - Math.pow(1 - t, 3);
        }

        function evaluateQuadraticBezier(startX, startY, cpX, cpY, endX, endY, t) {
          const inv = 1 - t;
          return {
            x: inv * inv * startX + 2 * inv * t * cpX + t * t * endX,
            y: inv * inv * startY + 2 * inv * t * cpY + t * t * endY,
          };
        }

        function enforceCapsuleSeparation(shellA, shellB) {
          const R = getCapsuleRadius();
          const minSep = R * 2.04;

          const abDx = shellB.x - shellA.x;
          const abDy = shellB.y - shellA.y;
          const abDist = Math.hypot(abDx, abDy) || 1;
          if (abDist < minSep) {
            const push = (minSep - abDist) * 0.5;
            const nx = abDx / abDist;
            const ny = abDy / abDist;
            shellA.x -= nx * push;
            shellA.y -= ny * push;
            shellB.x += nx * push;
            shellB.y += ny * push;
          }

          for (const other of state.shells) {
            if (other.id === shellA.id || other.id === shellB.id) continue;
            for (const moving of [shellA, shellB]) {
              const dx = moving.x - other.x;
              const dy = moving.y - other.y;
              const dist = Math.hypot(dx, dy) || 1;
              if (dist < minSep) {
                const push = minSep - dist;
                moving.x += (dx / dist) * push;
                moving.y += (dy / dist) * push;
              }
            }
          }
        }

        // --- Simulation Update Loop ---
        function updateSimulation(dtSeconds) {
          if (Boolean(window.ToenowTutorials?.isActive?.('ball-track')) && Boolean(window.ToenowTutorials?.isComplete?.('ball-track'))) return;
          if (state.mode === 'playing' && !['wave_ready','lineup','insert','memorize'].includes(state.phase) && !window.ToenowTutorials?.isActive?.('ball-track')) {
            state.runTimeSec = Math.max(0, state.runTimeSec - dtSeconds);
            syncRunTime();
            if (state.runTimeSec <= 0) { endTimedRun(); return; }
          }
          const realDtMs = dtSeconds * 1000;
          let dtMs = realDtMs;

          if (state.mode === 'playing' && state.phase === 'shuffle' && state.isOverdrive) {
            dtMs *= 1.8;
            state.overdriveHeldDurationMs += realDtMs;
            state.overdriveMultiplier = calculateOverdriveMultiplier(state.overdriveHeldDurationMs);
            hudOverdriveMultEl.textContent = `${state.overdriveMultiplier.toFixed(1)}x`;
          }

          // Orbital Rotation Updates strictly during Shuffle Phase (after GO!)
          if (state.mode === 'playing' && state.phase === 'shuffle') {
            const rotFactor = state.isOverdrive ? 1.8 : 1.0;
            if (state.config.isDualRing) {
              state.innerRingAngle += state.config.innerRingSpeedRad * rotFactor * dtSeconds;
              state.outerRingAngle += state.config.outerRingSpeedRad * rotFactor * dtSeconds;
            } else if (state.config.hasBoardRotation) {
              state.boardRotationAngle += state.config.boardRotationSpeedRad * rotFactor * dtSeconds;
            }
          }

          state.trauma = Math.max(0, state.trauma - dtSeconds * 1.8);

          // Particles
          for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particlePool[i];
            if (!p.active) continue;
            p.life -= dtSeconds;
            if (p.life <= 0) {
              p.active = false;
              continue;
            }
            if (p.kind === 'ring') {
              p.size += dtSeconds * 210;
            } else {
              p.x += p.vx * dtSeconds;
              p.y += p.vy * dtSeconds;
              p.vx *= 0.94;
              p.vy *= 0.94;
              p.rotation += p.vRot * dtSeconds;
            }
            p.alpha = Math.max(0, p.life / p.maxLife);
          }

          // Floating Popups
          for (let i = floatingPopups.length - 1; i >= 0; i--) {
            const pop = floatingPopups[i];
            pop.life -= dtSeconds;
            pop.y -= dtSeconds * 34;
            if (pop.life <= 0) {
              floatingPopups.splice(i, 1);
            }
          }

          if (state.hitstopMs > 0) {
            state.hitstopMs = Math.max(0, state.hitstopMs - realDtMs);
            return;
          }

          if (state.mode === 'title') {
            const slots = computeLiveSlotCoordinates();
            for (let i = 0; i < state.shells.length; i++) {
              const s = state.shells[i];
              s.x = slots[i].x;
              s.y = slots[i].y;
              s.shieldOpen = i === 0 ? 1 : 0;
            }
            return;
          }

          if (state.mode !== 'playing') return;

          const liveSlots = computeLiveSlotCoordinates();
          const lineupCoords = computeTargetLineupPositions(state.config.targetCount);

          for (const s of state.shells) {
            s.scaleX += (1 - s.scaleX) * Math.min(1, dtSeconds * 14);
            s.scaleY += (1 - s.scaleY) * Math.min(1, dtSeconds * 14);
            s.flash = Math.max(0, s.flash - dtSeconds * 4.5);

            const slot = liveSlots[s.slotIndex] || liveSlots[0];
            s.baseX = slot.x;
            s.baseY = slot.y;
            s.ring = slot.ring;

            if (s.hasCore && typeof s.targetOrder === 'number' && lineupCoords[s.targetOrder]) {
              s.lineupX = lineupCoords[s.targetOrder].x;
              s.lineupY = lineupCoords[s.targetOrder].y;
            }

            const targetOpen =
              (['lineup','wave_ready','insert','memorize'].includes(state.phase) && s.hasCore) ||
              s.revealedState === 'correct' ||
              s.revealedState === 'wrong' ||
              s.revealedState === 'missed'
                ? 1
                : 0;
            s.shieldOpen += (targetOpen - s.shieldOpen) * Math.min(1, dtSeconds * 14);

            if (state.phase === 'lineup' || state.phase === 'wave_ready') {
              if (s.hasCore) {
                s.x = s.lineupX;
                s.y = s.lineupY;
              } else {
                s.x = slot.x;
                s.y = slot.y;
              }
              s.trail.length = 0;
            } else if (state.phase === 'insert') {
              if (s.hasCore) {
                const rawInsertT = Math.min(1, state.phaseElapsedMs / Math.max(1, state.phaseDurationMs));
                const t = easeInOutCubic(rawInsertT);
                const cpx = (s.lineupX + slot.x) * 0.5 - 34;
                const cpy = (s.lineupY + slot.y) * 0.5 - 16;
                const pos = evaluateQuadraticBezier(s.lineupX, s.lineupY, cpx, cpy, slot.x, slot.y, t);
                s.x = pos.x;
                s.y = pos.y;
                s.trail.unshift({ x: s.x, y: s.y });
                if (s.trail.length > 9) s.trail.pop();
              } else {
                s.x = slot.x;
                s.y = slot.y;
                s.trail.length = 0;
              }
            } else {
              const isSwapping =
                state.phase === 'shuffle' &&
                state.activeSwap &&
                (state.activeSwap.shellA.id === s.id || state.activeSwap.shellB.id === s.id);

              if (!isSwapping) {
                s.x = slot.x;
                s.y = slot.y;
                if (s.trail.length > 0) {
                  s.trail.length = 0;
                }
              } else {
                s.trail.unshift({ x: s.x, y: s.y });
                if (s.trail.length > 10) s.trail.pop();

                if (state.isOverdrive && Math.random() < 0.3) {
                  spawnParticle(
                    s.x + (Math.random() - 0.5) * 12,
                    s.y + (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 48,
                    (Math.random() - 0.5) * 48,
                    2 + Math.random() * 2,
                    0.2,
                    '#ffedd5',
                    'spark'
                  );
                }
              }
            }
          }

          if (state.phase !== 'memorize' && !(Boolean(window.ToenowTutorials?.isActive?.('ball-track')) && state.phase === 'select')) state.phaseElapsedMs += dtMs;

          if (state.phase === 'wave_ready') {
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              enterLineupPhase();
            }
          } else if (state.phase === 'lineup') {
            // 1.2s top-right TARGET lineup (Timer strictly FROZEN)
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              state.phaseElapsedMs = 0;
              state.phaseDurationMs = state.config.insertDurationMs;
              setBodyState('playing', 'insert');
              setFrozenTimerHud('INSERTING TARGETS', '#38bdf8');
            }
          } else if (state.phase === 'insert') {
            // Smooth Bezier glide from top-right TARGET lineup into circular orbit slots (Timer strictly FROZEN)
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              for (const s of state.shells) {
                s.x = s.baseX;
                s.y = s.baseY;
                s.shieldOpen = s.hasCore ? 1 : 0;
                s.trail.length = 0;
                if (s.hasCore) {
                  s.scaleX = 1.08;
                  s.scaleY = 0.92;
                  s.flash = 0;
                }
              }
              audio.playCoreLockLatch();
              state.phaseElapsedMs = 0;
              state.phaseDurationMs = Infinity;
              setBodyState('playing', 'memorize');
              setFrozenTimerHud('Remember the leaf hiding the otter.','#527f71');
            }
          } else if (state.phase === 'ready_banner') {
            // "READY" (0.6s) -> Flash "GO!" (0.4s) in the center in vibrant yellow with ascending tone
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              waveBannerTitleEl.textContent = 'GO!';
              state.phaseElapsedMs = 0;
              state.phaseDurationMs = state.config.goDurationMs;
              setBodyState('playing', 'go_banner');
              hudPhaseTextEl.textContent = 'GO!';
              hudPhaseTextEl.style.color = '#facc15';
              hudGaugeFillEl.style.backgroundColor = '#facc15';
              audio.playGoTone();
            }
          } else if (state.phase === 'go_banner') {
            // Timer starts ticking upon "GO!"
            const goRatio = Math.max(0, 1 - (state.phaseElapsedMs / Math.max(1, state.phaseDurationMs)) * 0.08);
            hudGaugeFillEl.style.transform = `scaleX(${goRatio.toFixed(3)})`;
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              setBodyState('playing', 'shuffle');
              hudPhaseTextEl.textContent = state.config.isDualRing
                ? 'DUAL RINGS · TRACK'
                : state.config.hasBoardRotation
                  ? 'ORBIT SPIN · TRACK'
                  : 'TRACK MOVEMENT';
              hudPhaseTextEl.style.color = '#38bdf8';
              hudGaugeFillEl.style.backgroundColor = '#22d3ee';
              state.currentSwapIndex = 0;
              beginShuffleStep(0);
            }
          } else if (state.phase === 'shuffle') {
            const active = state.activeSwap;
            if (!active) {
              beginShuffleStep(state.currentSwapIndex);
              return;
            }

            state.swapElapsedMs += dtMs;
            const rawT = Math.min(1, state.swapElapsedMs / Math.max(1, active.durationMs));
            const t = active.isDecelerationStep ? easeOutCubic(rawT) : easeInOutCubic(rawT);

            const startA = liveSlots[active.fromSlotA] || liveSlots[0];
            const endA = liveSlots[active.toSlotA] || liveSlots[0];
            const startB = liveSlots[active.fromSlotB] || liveSlots[0];
            const endB = liveSlots[active.toSlotB] || liveSlots[0];

            const midX = (startA.x + endA.x) * 0.5;
            const midY = (startA.y + endA.y) * 0.5;
            const dx = endA.x - startA.x;
            const dy = endA.y - startA.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = -dy / dist;
            const ny = dx / dist;

            const isWide = active.curve === 'bezier_wide_cw' || active.curve === 'bezier_wide_ccw';
            const dir = active.curve.endsWith('_ccw') ? -1 : 1;
            const bowHeight = active.isRadialHop
              ? Math.max(54, Math.min(105, dist * 0.38))
              : isWide
                ? Math.max(85, Math.min(155, dist * 0.48))
                : Math.max(70, Math.min(130, dist * 0.42));

            const cpAX = midX + dir * nx * bowHeight;
            const cpAY = midY + dir * ny * bowHeight;
            const cpBX = midX - dir * nx * bowHeight;
            const cpBY = midY - dir * ny * bowHeight;

            active.liveCurve = {
              startAX: startA.x,
              startAY: startA.y,
              endAX: endA.x,
              endAY: endA.y,
              cpAX,
              cpAY,
              startBX: startB.x,
              startBY: startB.y,
              endBX: endB.x,
              endBY: endB.y,
              cpBX,
              cpBY,
            };

            const posA = evaluateQuadraticBezier(
              startA.x,
              startA.y,
              cpAX,
              cpAY,
              endA.x,
              endA.y,
              t
            );
            const posB = evaluateQuadraticBezier(
              startB.x,
              startB.y,
              cpBX,
              cpBY,
              endB.x,
              endB.y,
              t
            );

            active.shellA.x = posA.x;
            active.shellA.y = posA.y;
            active.shellB.x = posB.x;
            active.shellB.y = posB.y;

            if (rawT > 0.05 && rawT < 0.95) {
              enforceCapsuleSeparation(active.shellA, active.shellB);
            }

            const totalProgress =
              (state.currentSwapIndex + rawT) / Math.max(1, state.swapSchedule.length);
            hudGaugeFillEl.style.transform = `scaleX(${(1 - totalProgress).toFixed(3)})`;
            syncRunTime();

            if (rawT >= 1) {
              active.shellA.x = endA.x;
              active.shellA.y = endA.y;
              active.shellB.x = endB.x;
              active.shellB.y = endB.y;
              active.shellA.trail.length = 0;
              active.shellB.trail.length = 0;
              state.currentSwapIndex += 1;
              beginShuffleStep(state.currentSwapIndex);
            }
          } else if (state.phase === 'select') {
            const rem = Math.max(0, state.phaseDurationMs - state.phaseElapsedMs);
            syncRunTime();
            hudGaugeFillEl.style.transform = `scaleX(${(state.runTimeSec / 60).toFixed(3)})`;

            const liveMult = calculateSpeedMultiplier(
              rem,
              state.phaseDurationMs,
              state.streak + 1
            );
            hudMultEl.textContent = liveMult.toFixed(1).replace(/\.0$/, '') + 'x';

} else if (state.phase === 'wave_clear') {
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              initWave(state.wave + 1, true);
            }
          } else if (state.phase === 'resolve') {
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              const pickedCount = state.shells.filter((s) => s.hasCore && s.picked).length;
              const nextWave = pickedCount >= 1 ? state.wave + 1 : state.wave;
              initWave(nextWave, true);
            }
          } else if (state.phase === 'defeat_beat') {
            if (state.phaseElapsedMs >= state.phaseDurationMs) {
              showGameOverModal();
            }
          }
        }

        // --- Canvas 2D Renderer (Strict 1:1 Circular Orbits + Top-Right "TARGET" Queue) ---

// Top-Right "TARGET" Vertical Lineup Queue Panel during Inspection & Insertion

// Draw Trajectory Arcs & Ease-Out Deceleration Cues

// Render Motion Trails ONLY on the two actively swapping capsules (zero smearing)

// --- Main 60 FPS Animation Loop ---
        let lastFrameTime = performance.now();
        function frameLoop(now) {
          const dtSeconds = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
          lastFrameTime = now;

          updateSimulation(dtSeconds);
          renderScene(now / 1000);

          requestAnimationFrame(frameLoop);
        }

        // --- Deterministic Test & Verification Hooks ---
        window.__QUANTUM_SHELL__ = {
          getState: () => ({
            mode: state.mode,
            phase: state.phase,
            wave: state.wave,
            tier: state.config.tier,
            tierName: state.config.tierName,
            isDualRing: state.config.isDualRing,
            innerRingCount: state.config.innerRingCount,
            outerRingCount: state.config.outerRingCount,
            score: state.score,
            bestScore,
            bestWave,
            streak: state.streak,
            runTimeSec: state.runTimeSec,
            mistakesThisWave: state.mistakesThisWave,
            isOverdrive: state.isOverdrive,
            overdriveMultiplier: state.overdriveMultiplier,
            targetCount: state.config.targetCount,
            shellCount: state.config.shellCount,
            shells: state.shells.map((s) => ({
              id: s.id,
              slotIndex: s.slotIndex,
              ring: s.ring,
              hasCore: s.hasCore,
              targetOrder: s.targetOrder,
              picked: s.picked,
              x: s.x,
              y: s.y,
              lineupX: s.lineupX,
              lineupY: s.lineupY,
              revealedState: s.revealedState,
            })),
          }),
          startNewGame,
          jumpToWave: (waveNum) => {
            initWave(waveNum, false);
          },
          setOverdrive: (active) => {
            setOverdriveState(active);
          },
          forceSelectPhase: () => {
            if (state.mode === 'playing') {
              beginShuffleStep(state.swapSchedule.length);
            }
          },
          pickShellById: (id) => {
            const target = state.shells.find((s) => s.id === id);
            if (target) handleShellSelection(target);
          },
        };

        window.ToenowTutorials?.register?.('ball-track', {
          start() { startNewGame(1, true); },
          stop() { state.isPractice = false; returnToTitle(); },
          getGuide() {
            if(state.phase==='memorize')return {edge:'bottom',prompt:'Remember the leaf hiding the otter. Then hold Shift or the accelerate button to speed up movement.',waiting:true,action:{label:'I remember — start moving',run:confirmMemory}};
            if(state.phase==='shuffle')return {edge:'bottom',prompt:'Follow the otter’s leaf. Hold Shift or the accelerate button to speed up.',waiting:true};
            if (state.phase !== 'select') return {edge:'bottom', prompt: 'Watch the otter settle under a leaf.', rect: null, waiting: true };
            const target = state.shells.find(s => s.hasCore && !s.picked) || state.shells.find(s => s.hasCore);
            const bounds = canvas.getBoundingClientRect(), radius = getCapsuleRadius();
            return {edge:'bottom', prompt: 'Tap the leaf hiding the otter.', rect: target ? { x: bounds.left + target.x - radius, y: bounds.top + target.y - radius, width: radius * 2, height: radius * 2 } : null, done: Boolean(window.ToenowTutorials?.isComplete?.('ball-track')) };
          }
        });

        // Initialize
        resizeCanvas();
        createTitleShowcaseShells();
        updateHudReadouts();

        const params = new URLSearchParams(window.location.search);
        if (typeof ToenowLevels !== 'undefined' && ToenowLevels.setupPracticeMode) {
          ToenowLevels.setupPracticeMode({
            container: '#screen-title .unified-title-card',
            onStartGame: (startWave, isPractice) => {
              startNewGame(startWave, isPractice);
            }
          });
        }

        if (params.get('autostart') === '1') {
          startNewGame();
        }

        requestAnimationFrame(frameLoop);
      })();
