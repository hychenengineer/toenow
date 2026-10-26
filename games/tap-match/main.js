ToenowScreens.mount("tap-match");

(function () {
        'use strict';
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { drawOuterShape, drawInnerGlyph, hexToRgba, drawTargetCriteriaPreview, drawPenguinPool, renderGame } = window.ToenowGameModules['tap-match'].renderer.createRenderer({
          get COLOR_MAP() { return COLOR_MAP; },
          get ctx() { return ctx; },
          get penguinCollection() { return penguinCollection; },
          get state() { return state; }
        });

// ==================================================
        // 1. CONSTANTS & CONFIGURATION
        // ==================================================
        const { SHAPES, GLYPHS, COLORS, COLOR_MAP } = window.ToenowGameModules['tap-match'].data;

        const TOUCH_HITBOX_PADDING = 15; // +15px radius per spec

        // ==================================================
        // 2. PROCEDURAL WEB AUDIO ENGINE (ZERO EXTERNAL ASSETS)
        // ==================================================
        const { SoundEngine } = window.ToenowGameModules['tap-match'].audio;

        const audio = new SoundEngine();

        // ==================================================
        // 3. DOM REFERENCES
        // ==================================================
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const hudContainer = document.getElementById('hud-container');

        const previewCanvas = document.getElementById('wave-preview-canvas');
        const previewCtx = previewCanvas.getContext('2d');

        const elWave = document.getElementById('hud-wave');
        const elTarget = document.getElementById('hud-target');
        const elStreak = document.getElementById('hud-streak');
        const elTime = document.getElementById('hud-time');
        const elScore = document.getElementById('hud-score');
        const elHits = document.getElementById('hud-hits');
        const elFaults = document.getElementById('hud-faults');

        const STORAGE_KEY_SCORE = 'whack_match_high_score_v1';
        const STORAGE_KEY_WAVE = 'whack_match_best_wave_v1';

        function loadBestWhackScore() {
          try {
            return parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || '0', 10) || 0;
          } catch (_) { return 0; }
        }
        function loadBestWhackWave() {
          try {
            return parseInt(localStorage.getItem(STORAGE_KEY_WAVE) || '1', 10) || 1;
          } catch (_) { return 1; }
        }
        function saveBestWhackRecords(score, wave) {
          try {
            if (state && state.isPractice) return;
            const curScore = loadBestWhackScore();
            const curWave = loadBestWhackWave();
            if (score > curScore) localStorage.setItem(STORAGE_KEY_SCORE, String(Math.round(score)));
            if (wave > curWave) localStorage.setItem(STORAGE_KEY_WAVE, String(wave));
          } catch (_) {}
        }

        // Initialize Toenow Game SDK
        const toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'tap-match', category: 'spatial', gameTitle: 'Tap Match' })
          : null;

          ToenowScreens.updateTitle('tap-match', { bestScore: loadBestWhackScore(), bestWave: loadBestWhackWave() });
        const btnAudio = document.getElementById('btn-audio');
        const btnReset = document.getElementById('btn-reset');
        const btnStartRun = document.getElementById('btn-start-run');
        const btnBeginWave = document.getElementById('btn-begin-wave');
        const btnRetry = document.getElementById('btn-retry');

        const modalStart = document.getElementById('modal-start');
        const modalWaveBrief = document.getElementById('modal-wave-brief');
        const modalGameOver = document.getElementById('modal-gameover');
        const modalPause = document.getElementById('modal-pause');
        const pauseScoreVal = document.getElementById('pause-score-val');
        const pauseWaveVal = document.getElementById('pause-wave-val');
        const pauseTimeVal = document.getElementById('pause-time-val');
        const btnResumeWhack = document.getElementById('btn-resume-whack');
        const btnRestartWhack = document.getElementById('btn-restart-whack');
        const btnTitleWhack = document.getElementById('btn-title-whack');
        const btnPauseHud = document.getElementById('btn-pause-hud');

        const elBriefKicker = document.getElementById('brief-kicker');
        const elBriefTargetName = document.getElementById('brief-target-name');
        const elBriefRuleDetail = document.getElementById('brief-rule-detail');
        const elBriefRuleSub = document.getElementById('brief-rule-sub');
        const elBriefGridSpeed = document.getElementById('brief-grid-speed');
        const elBriefQuota = document.getElementById('brief-quota');
        const elBriefTime = document.getElementById('brief-time');

        // ==================================================
        // 4. GAME STATE & 3x3 -> 4x4 -> 5x5 ESCALATION ENGINE
        // ==================================================
        const tutorialActive = () => Boolean(window.ToenowTutorials?.isActive?.('tap-match'));
        let tutorialSnapshot = null;
        const state = {
          phase: 'MENU', // 'MENU' | 'BRIEFING' | 'STAGING' | 'PLAYING' | 'GAMEOVER'
          wave: 1,
          score: 0,
          streak: 0,
          peakStreak: 0,
          waveHits: 0,
          waveQuota: 20,
          faults: 0,
          timeLeft: ToenowTime.START_SECONDS,
          stagingTimer: 0,
          stagingDuration: 1.6,
          stagingBeepStep: 0,

          // Telemetry for summary
          totalTaps: 0,
          validHits: 0,
          reactionSumMs: 0,

          // Current target criteria
          target: {
            mode: 'SHAPE',
            shape: 'DIAMOND',
            color: null,
            glyph: null,
            label: 'DIAMOND',
            rulePrimary: 'Tap any node with an outer <strong>DIAMOND</strong> shape.',
            ruleSecondary: 'Color and inner symbol do not matter (any color / symbol).',
            accentHex: '#f1f5f9',
            cssClass: 'hud-highlight-white'
          },

          // Spatial receptor matrix
          gridSize: 3, // Waves 1-3: 3x3, Waves 4-6: 4x4, Waves 7+: 5x5
          speedLabel: 'SLOW',
          nodes: [],
          spawnCooldown: 0,
          activeWindowMs: 2200,
          spawnIntervalMs: 800,
          maxConcurrentNodes: 3,
          guaranteedTargetCounter: 0,

          // Viewport & safe bounds layout
          width: 360,
          height: 600,
          dpr: 1,
          safeTopY: 20
        };

        // Structured 3-Wave Tiers:
        // Waves 1-3: 3x3 (Slow -> Medium -> Fast) · >= 20 hits per wave
        // Waves 4-6: 4x4 (Slow -> Medium -> Fast) · >= 22 hits per wave
        // Waves 7-9: 5x5 (Slow -> Medium -> Fast) · >= 25 hits per wave
        // Waves 10+: 5x5 Master Tiers (High Speed) · >= 30 hits per wave
        const { getWaveConfig, generateTargetCriteria, doesNodeMatchTarget, computeHitPoints } = window.ToenowGameModules['tap-match'].rules;

        function buildNodeMatrix() {
          const count = state.gridSize * state.gridSize;
          state.nodes = [];
          for (let i = 0; i < count; i++) {
            const row = Math.floor(i / state.gridSize);
            const col = i % state.gridSize;
            state.nodes.push({
              index: i,
              row,
              col,
              x: 0,
              y: 0,
              radius: 32,
              status: 'INACTIVE', // 'INACTIVE' | 'ACTIVE' | 'HIT_FEEDBACK' | 'DEPLETED'
              shape: 'CIRCLE',
              glyph: 'DOT',
              color: 'CYAN',
              isTarget: false,
              elapsedMs: 0,
              durationMs: state.activeWindowMs,
              feedbackMs: 0,
              feedbackLabel: '',
              feedbackType: 'NONE'
            });
          }
          layoutMatrixGeometry();
        }

        function layoutMatrixGeometry() {
          const stageRect = canvas.parentElement.getBoundingClientRect();
          const hudRect = hudContainer.getBoundingClientRect();
          const teaching = Boolean(window.ToenowTutorials?.isActive?.('tap-match'));

          state.width = Math.max(280, Math.floor(stageRect.width));
          state.height = Math.max(teaching ? 1 : 320, Math.floor(stageRect.height));
          state.dpr = Math.min(window.devicePixelRatio || 1, 2);

          canvas.width = state.width * state.dpr;
          canvas.height = state.height * state.dpr;
          ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

          // Safe Bounds rule:
          // Position the entire node matrix strictly below hudBottom + 20px.
          const overlapIntoCanvas = Math.max(0, hudRect.bottom - stageRect.top);
          const minSafeTop = overlapIntoCanvas + 20 + 48; // +48px for on-canvas target reference bar

          const padX = 14;
          const padBottom = 16;
          const availW = state.width - padX * 2;
          const availH = Math.max(teaching ? 1 : 200, state.height - minSafeTop - padBottom);

          const matrixSide = Math.min(availW, availH);
          const cellSpan = matrixSide / state.gridSize;
          const nodeRadius = Math.max(18, Math.floor(cellSpan * 0.38));

          const startX = (state.width - matrixSide) / 2 + cellSpan / 2;
          const startY = minSafeTop + (availH - matrixSide) / 2 + cellSpan / 2;

          state.safeTopY = overlapIntoCanvas + 20;

          for (let i = 0; i < state.nodes.length; i++) {
            const node = state.nodes[i];
            node.x = Math.round(startX + node.col * cellSpan);
            node.y = Math.round(startY + node.row * cellSpan);
            node.radius = nodeRadius;
          }
        }

        // ==================================================
        // 6. NODE SPAWNING & LIFECYCLE
        // ==================================================
        function spawnReceptorNode() {
          const inactiveNodes = state.nodes.filter((n) => n.status === 'INACTIVE');
          if (inactiveNodes.length === 0) return;

          const activeCount = state.nodes.filter((n) => n.status === 'ACTIVE').length;
          if (activeCount >= state.maxConcurrentNodes) return;

          const node = inactiveNodes[Math.floor(Math.random() * inactiveNodes.length)];
          const t = state.target;

          // Ensure valid targets spawn frequently so the player reaches 20+ hits without waiting
          const activeTargetCount = state.nodes.filter((n) => n.status === 'ACTIVE' && n.isTarget).length;
          const forceTarget = (activeTargetCount === 0 && state.guaranteedTargetCounter >= 1) || Math.random() < 0.60;

          if (forceTarget) {
            state.guaranteedTargetCounter = 0;
            node.shape = t.shape || SHAPES[Math.floor(Math.random() * SHAPES.length)];
            node.color = t.color || COLORS[Math.floor(Math.random() * COLORS.length)].id;
            node.glyph = t.glyph || GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            node.isTarget = true;
          } else {
            state.guaranteedTargetCounter++;
            let attempts = 0;
            do {
              node.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
              node.color = COLORS[Math.floor(Math.random() * COLORS.length)].id;
              node.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              attempts++;
            } while (doesNodeMatchTarget(node, t) && attempts < 20);
            node.isTarget = doesNodeMatchTarget(node, t);
          }

          node.status = 'ACTIVE';
          node.elapsedMs = 0;
          node.durationMs = state.activeWindowMs;
          node.feedbackMs = 0;
        }

        function triggerPenalty(node, reasonLabel, feedbackType) {
          if (tutorialActive()) return;
          window.ToenowAnimals?.feedback('tap-match', false);
          state.streak = 0;
          state.faults += 1;
          state.timeLeft = ToenowTime.wrong(state.timeLeft);

          if (node) {
            node.status = 'DEPLETED';
            node.feedbackMs = 460;
            node.feedbackLabel = reasonLabel;
            node.feedbackType = feedbackType;
          }

          audio.playMiss();
          syncHud();

          if (state.timeLeft <= 0) {
            endRun('TIME EXPIRED');
          }
        }

        function handlePointerDown(clientX, clientY) {
          if (tutorialActive() && window.ToenowTutorials.isComplete('tap-match')) return;
          if (state.phase === 'STAGING') {
            state.stagingTimer = 0;
            state.phase = 'PLAYING';
            audio.playStagePip(true);
            return;
          }

          if (state.phase !== 'PLAYING') return;

          const rect = canvas.getBoundingClientRect();
          const px = clientX - rect.left;
          const py = clientY - rect.top;

          // Find closest interactive node within (node.radius + 15px) expanded touch hit-box
          let hitNode = null;
          let minDist = Infinity;

          for (let i = 0; i < state.nodes.length; i++) {
            const node = state.nodes[i];
            const dx = px - node.x;
            const dy = py - node.y;
            const dist = Math.hypot(dx, dy);
            const hitLimit = node.radius + TOUCH_HITBOX_PADDING;

            if (dist <= hitLimit && dist < minDist) {
              minDist = dist;
              hitNode = node;
            }
          }

          if (!hitNode) return;

          if (hitNode.status === 'ACTIVE') {
            state.totalTaps++;
            if (hitNode.isTarget) {
              state.validHits++;
              state.reactionSumMs += hitNode.elapsedMs;
              state.streak++;
              if (state.streak > state.peakStreak) {
                state.peakStreak = state.streak;
              }

              const pts = computeHitPoints(state.wave, state.streak);
              if (!tutorialActive()) state.score += pts;
              state.waveHits++;
              if (!tutorialActive()) window.ToenowAnimals?.feedback('tap-match', true);
              penguinCollection.push({ x: hitNode.x, y: hitNode.y, shape: hitNode.shape, color: hitNode.color, glyph: hitNode.glyph, started: performance.now() });
              if (!tutorialActive()) state.timeLeft = ToenowTime.correct(state.timeLeft);

              hitNode.status = 'HIT_FEEDBACK';
              hitNode.feedbackMs = 240;
              hitNode.feedbackLabel = tutorialActive() ? '✓' : `+${pts}`;
              hitNode.feedbackType = 'HIT';

              audio.playHit();
              syncHud();

              if (tutorialActive()) {
                state.timeLeft = 60; window.ToenowTutorials.complete('tap-match');
              } else if (state.waveHits >= state.waveQuota) {
                prepareWaveBriefing(state.wave + 1);
              }
            } else {
              triggerPenalty(hitNode, 'WRONG', 'MISS');
            }
          }
        }

        // ==================================================
        // 7. WAVE BRIEFING MODAL & STAGING FLOW
        // ==================================================
        function renderWaveBriefingPreview() {
          const pw = previewCanvas.width;
          const ph = previewCanvas.height;
          previewCtx.clearRect(0, 0, pw, ph);

          previewCtx.fillStyle = '#263d35';
          previewCtx.fillRect(0, 0, pw, ph);

          // Subtle analytical grid guidelines
          previewCtx.strokeStyle = 'rgba(120, 148, 134, 0.25)';
          previewCtx.lineWidth = 1;
          previewCtx.beginPath();
          previewCtx.moveTo(pw / 2, 8);
          previewCtx.lineTo(pw / 2, ph - 8);
          previewCtx.moveTo(8, ph / 2);
          previewCtx.lineTo(pw - 8, ph / 2);
          previewCtx.stroke();

          const cx = pw / 2;
          const cy = ph / 2;
          const mode = state.target.mode;

          if (mode === 'COLOR') {
            // ONLY color matters: strictly remove circle contour to avoid confusing with Circle shape
            const colorHex = COLOR_MAP[state.target.color] || '#00f0ff';
            const sw = 114;
            const sh = 96;
            const sx = (pw - sw) / 2;
            const sy = (ph - sh) / 2;

            previewCtx.save();
            // Distinct rectangular color swatch card (zero circle contours)
            previewCtx.beginPath();
            if (previewCtx.roundRect) {
              previewCtx.roundRect(sx, sy, sw, sh, 8);
            } else {
              previewCtx.rect(sx, sy, sw, sh);
            }
            previewCtx.fillStyle = colorHex;
            previewCtx.fill();
            previewCtx.lineWidth = 2;
            previewCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            previewCtx.stroke();

            // Clear color identifier inside swatch card
            previewCtx.fillStyle = '#070a0e';
            previewCtx.textAlign = 'center';
            previewCtx.textBaseline = 'middle';
            previewCtx.font = '700 16px "JetBrains Mono", monospace';
            previewCtx.fillText(state.target.color, cx, cy - 8);

            previewCtx.font = '600 10px "JetBrains Mono", monospace';
            previewCtx.fillText('COLOR ONLY', cx, cy + 12);
            previewCtx.restore();
            return;
          }

          // Non-COLOR modes: only draw a circle if the shape itself is explicitly 'CIRCLE'
          drawTargetCriteriaPreview(previewCtx, cx, cy, 42, state.target);
        }

        function prepareWaveBriefing(waveNum) {
          state.wave = waveNum;
          window.ToenowAnimals?.setWave('tap-match', waveNum);
          penguinCollection.length = 0;
          const cfg = getWaveConfig(waveNum);
          state.gridSize = cfg.gridSize;
          state.speedLabel = cfg.speedLabel;
          state.activeWindowMs = cfg.activeWindowMs;
          state.spawnIntervalMs = cfg.spawnIntervalMs;
          state.maxConcurrentNodes = cfg.maxConcurrentNodes;
          state.waveQuota = cfg.waveQuota;
          state.waveHits = 0;
          // Carry the run clock across waves; briefing never resets it.
          state.spawnCooldown = 250;
          state.guaranteedTargetCounter = 2;

          state.target = generateTargetCriteria(waveNum);
          buildNodeMatrix();
          syncHud();

          // Populate Wave Briefing Modal
          elBriefKicker.textContent = `WAVE ${waveNum} · ${cfg.gridSize}x${cfg.gridSize} MATRIX · ${cfg.speedLabel} SPEED`;
          elBriefTargetName.textContent = `TARGET: ${state.target.label}`;
          elBriefTargetName.className = `wave-target-badge ${state.target.cssClass}`;
          elBriefRuleDetail.innerHTML = state.target.rulePrimary;
          elBriefRuleSub.textContent = state.target.ruleSecondary;

          const winSec = (cfg.activeWindowMs / 1000).toFixed(2);
          elBriefGridSpeed.textContent = `${cfg.gridSize}x${cfg.gridSize} · ${cfg.speedLabel} (${winSec}s display)`;
          elBriefQuota.textContent = `${cfg.waveQuota} Valid Hits`;
          elBriefTime.textContent = `${Math.ceil(state.timeLeft)}s`;
          btnBeginWave.textContent = `[BEGIN WAVE ${waveNum}]`;

          renderWaveBriefingPreview();

          state.phase = 'BRIEFING';
          modalWaveBrief.classList.remove('hidden');
        }

        function launchCurrentWaveFromBriefing() {
          audio.init();
          modalWaveBrief.classList.add('hidden');

          // Crisp READY -> GO! countdown with frozen timer before nodes appear
          state.phase = 'STAGING';
          state.stagingDuration = 1.6;
          state.stagingTimer = state.stagingDuration;
          state.stagingBeepStep = 2;
          audio.playStagePip(false);
        }

        function startNewRun(startWave = 1, isPractice = false) {
          if (tutorialActive()) return;
          if (toenowSdk) toenowSdk.startRun({ wave: startWave, isPractice });
          state.isPractice = Boolean(isPractice);
          audio.init();
          modalStart.classList.add('hidden');
          modalGameOver.classList.add('hidden');
          modalGameOver.classList.remove('active');

          state.score = 0;
          state.streak = 0;
          state.peakStreak = 0;
          state.faults = 0;
          state.timeLeft = ToenowTime.START_SECONDS;
          state.totalTaps = 0;
          state.validHits = 0;
          state.reactionSumMs = 0;

          prepareWaveBriefing(startWave);
        }

        function endRun(reasonText) {
          if (tutorialActive()) return;
          state.phase = 'GAMEOVER';
          modalWaveBrief.classList.add('hidden');
          const acc = state.totalTaps > 0 ? Math.round((state.validHits / state.totalTaps) * 100) : 0;
                    saveBestWhackRecords(state.score, state.wave);
          ToenowScreens.updateGameOver('tap-match', { score: state.score, bestScore: loadBestWhackScore(), wave: state.wave, combo: state.peakStreak, reason: 'TIME EXPIRED' });
          ToenowScreens.updateTitle('tap-match', { bestScore: loadBestWhackScore(), bestWave: loadBestWhackWave() });
          modalGameOver.classList.remove('hidden');
          modalGameOver.classList.add('active');

          // Toenow Game SDK Unified Lifecycle & Hub Contract
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: Math.round(state.score),
              wave: Number(state.wave) || 1,
              isPractice: Boolean(state.isPractice),
              accuracy: acc,
              streak: state.peakStreak
            });
          } else {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(
                  {
                    type: 'GAME_OVER',
                    gameId: 'tap-match',
                    category: 'spatial',
                    score: Math.round(state.score),
                    isPractice: Boolean(state.isPractice),
                    wave: Number(state.wave) || 1,
                    accuracy: acc
                  },
                  '*'
                );
              }
            } catch (_) {}
          }
        }

        function syncHud() {
          elWave.textContent = String(state.wave);
          elTarget.textContent = state.target.label;
          elTarget.className = state.target.cssClass;
          elStreak.textContent = String(state.streak);
          elTime.textContent = String(Math.ceil(state.timeLeft)).padStart(2, '0');
          elScore.textContent = state.score.toLocaleString();
          elHits.textContent = `${state.waveHits}/${state.waveQuota}`;
          elFaults.textContent = String(state.faults);
        }

        // ==================================================
        // 8. STRICT 1:1 VECTOR GEOMETRY RENDERER
        // ==================================================

// Unambiguous Criteria Vector Renderer:
        // - If only glyph is required: shows the glyph in neutral white, with NO color and NO circle/polygon shape.
        // - If only color is required: shows a rectangular color swatch chip, with NO circle contour.
        // - If only shape is required: shows the shape in neutral white, with NO color and NO inner glyph.

// ==================================================
        // 9. MAIN 60FPS UPDATE & RENDER LOOP
        // ==================================================
        const penguinCollection = [];
        
        let lastFrameTime = performance.now();

        function updateGame(dtMs) {
          const dtSec = dtMs / 1000;

          if (state.phase === 'STAGING') {
            state.stagingTimer -= dtSec;
            if (state.stagingTimer <= 0.7 && state.stagingBeepStep === 2) {
              state.stagingBeepStep = 1;
              audio.playStagePip(true);
            }
            if (state.stagingTimer <= 0) {
              state.phase = 'PLAYING';
            }
            return;
          }

          if (state.phase !== 'PLAYING') return;

          if (tutorialActive()) {
            elTime.textContent = '∞';
            for (const node of state.nodes) if (node.status === 'HIT_FEEDBACK') node.feedbackMs = Math.max(1, node.feedbackMs - dtMs);
            return;
          }
          // One run timer, carried across all waves
          state.timeLeft -= dtSec;
          if (state.timeLeft <= 0) {
            state.timeLeft = 0;
            syncHud();
            endRun('TIME EXPIRED');
            return;
          }

          elTime.textContent = String(Math.ceil(state.timeLeft)).padStart(2, '0');

          // Spawn cadence
          state.spawnCooldown -= dtMs;
          if (state.spawnCooldown <= 0) {
            spawnReceptorNode();
            state.spawnCooldown = state.spawnIntervalMs;
          }

          // Update individual receptor nodes
          for (let i = 0; i < state.nodes.length; i++) {
            const node = state.nodes[i];
            if (node.status === 'ACTIVE') {
              node.elapsedMs += dtMs;
              if (node.elapsedMs >= node.durationMs) {
                if (node.isTarget) {
                  triggerPenalty(node, 'EXPIRED', 'EXPIRED');
                  if (state.phase !== 'PLAYING') return;
                } else {
                  node.status = 'INACTIVE';
                }
              }
            } else if (node.status === 'HIT_FEEDBACK' || node.status === 'DEPLETED') {
              node.feedbackMs -= dtMs;
              if (node.feedbackMs <= 0) {
                node.status = 'INACTIVE';
              }
            }
          }
        }

function loop(now) {
          const dtMs = Math.min(50, Math.max(0, now - lastFrameTime));
          lastFrameTime = now;

          updateGame(dtMs);
          renderGame();

          requestAnimationFrame(loop);
        }

        // ==================================================
        // 10. EVENT LISTENERS & INITIALIZATION
        // ==================================================
        canvas.addEventListener(
          'pointerdown',
          (e) => {
            e.preventDefault();
            handlePointerDown(e.clientX, e.clientY);
          },
          { passive: false }
        );

        function togglePause() {
          if (tutorialActive()) return;
          if (state.phase === 'PLAYING' || state.phase === 'STAGING') {
            state.previousPhase = state.phase;
            state.phase = 'PAUSED';
            document.body.dataset.paused = 'true';
            if (pauseScoreVal) pauseScoreVal.textContent = state.score.toLocaleString();
            if (pauseWaveVal) pauseWaveVal.textContent = String(state.wave);
            if (pauseTimeVal) pauseTimeVal.textContent = Math.ceil(state.timeLeft) + 's';
            modalPause.classList.remove('hidden');
            modalPause.classList.add('active');
          } else if (state.phase === 'PAUSED') {
            state.phase = state.previousPhase || 'PLAYING';
            document.body.dataset.paused = 'false';
            modalPause.classList.remove('active');
            modalPause.classList.add('hidden');
          }
        }

        if (btnPauseHud) {
          btnPauseHud.addEventListener('click', () => togglePause());
        }
        if (btnResumeWhack) {
          btnResumeWhack.addEventListener('click', () => togglePause());
        }
        if (btnRestartWhack) {
          btnRestartWhack.addEventListener('click', () => {
            document.body.dataset.paused = 'false';
            modalPause.classList.remove('active');
            modalPause.classList.add('hidden');
            startNewRun();
          });
        }
        if (btnTitleWhack) {
          btnTitleWhack.addEventListener('click', () => {
            document.body.dataset.paused = 'false';
            modalPause.classList.remove('active');
            modalPause.classList.add('hidden');
            state.phase = 'MENU';
            modalStart.classList.remove('hidden');
          });
        }

        window.addEventListener('keydown', (e) => {
          if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            if (state.phase === 'PLAYING' || state.phase === 'STAGING' || state.phase === 'PAUSED') {
              e.preventDefault();
              togglePause();
              return;
            }
          }
          if (state.phase === 'PAUSED' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            togglePause();
            return;
          }
          if (state.phase === 'MENU' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            startNewRun();
            return;
          }
          if (state.phase === 'BRIEFING' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            launchCurrentWaveFromBriefing();
            return;
          }
          if (state.phase === 'GAMEOVER' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            startNewRun();
            return;
          }
        });

        btnStartRun.addEventListener('click', () => {
          startNewRun();
        });

        btnBeginWave.addEventListener('click', () => {
          launchCurrentWaveFromBriefing();
        });

        btnRetry.addEventListener('click', () => {
          startNewRun();
        });

        document.getElementById('btn-gameover-title').addEventListener('click', () => {
          modalGameOver.classList.remove('active');
          modalGameOver.classList.add('hidden');
          state.phase = 'MENU';
          modalStart.classList.remove('hidden');
        });

btnReset.addEventListener('click', () => {
          startNewRun();
        });

        btnAudio.addEventListener('click', () => {
          const isOn = audio.toggle();
          btnAudio.dataset.muted = String(!isOn);
          btnAudio.setAttribute('aria-pressed', String(isOn));
        });

        window.addEventListener('resize', () => {
          layoutMatrixGeometry();
        });

        window.ToenowTutorials?.register?.('tap-match', {
          start() {
            tutorialSnapshot = JSON.parse(JSON.stringify(state));
            Object.assign(state, { isPractice: true, score: 0, wave: 1, waveHits: 0, waveQuota: 1, faults: 0, streak: 0, peakStreak: 0, timeLeft: 60, gridSize: 3 });
            state.target = generateTargetCriteria(1); buildNodeMatrix();
            Object.assign(state.nodes[4], { status: 'ACTIVE', isTarget: true,
              shape: state.target.shape || 'CIRCLE', color: state.target.color || 'CYAN', glyph: state.target.glyph || 'DOT', elapsedMs: 100, durationMs: 2200 });
            state.phase = 'PLAYING'; penguinCollection.length = 0;
            [modalStart, modalGameOver, modalWaveBrief, modalPause].forEach(m => { m.classList.add('hidden'); m.classList.remove('active'); });
            syncHud(); elTime.textContent = '∞';
          },
          stop() {
            if (tutorialSnapshot) Object.assign(state, tutorialSnapshot);
            tutorialSnapshot = null; state.phase = 'MENU'; penguinCollection.length = 0;
            modalStart.classList.remove('hidden'); modalStart.classList.add('active');
            [modalGameOver, modalWaveBrief, modalPause].forEach(m => { m.classList.add('hidden'); m.classList.remove('active'); });
            layoutMatrixGeometry(); syncHud();
          },
          getGuide() {
            const node = state.nodes[4], box = canvas.getBoundingClientRect();
            return { prompt: 'Tap the card that matches the target above.', rect: { x: box.left + node.x - node.radius, y: box.top + node.y - node.radius, width: node.radius * 2, height: node.radius * 2 } };
          }
        });
        // Initial setup
        buildNodeMatrix();
        syncHud();
        if (typeof ToenowLevels !== 'undefined' && ToenowLevels.setupPracticeMode) {
          ToenowLevels.setupPracticeMode({
            container: '#modal-start .unified-title-card',
            onStartGame: (startWave, isPractice) => {
              startNewRun(startWave, isPractice);
            }
          });
        }
        requestAnimationFrame((t) => {
          lastFrameTime = t;
          loop(t);
        });
      })();
