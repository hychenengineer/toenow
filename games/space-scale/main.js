ToenowScreens.mount("space-scale");

      (function () {
        'use strict';
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { drawMysteryParcel, drawAsteroid, drawScale } = window.ToenowGameModules['space-scale'].renderer.createRenderer({
          get canvasHeight() { return canvasHeight; },
          get collapseAnim() { return collapseAnim; },
          get hoveredBodyId() { return hoveredBodyId; },
          get renderedBodyTargets() { return renderedBodyTargets; }
        });

const IS_HEADLESS = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent || '');

        const STORAGE_BEST_SCORE = 'grav_anomaly_best_score_v2';
        const STORAGE_BEST_EXP = 'grav_anomaly_best_exp_v2';

        // Six parcel appearances. Original IDs and size ranges preserve puzzle generation.
        const { ARCHETYPES, GREEK_NAMES } = window.ToenowGameModules['space-scale'].data;

        const SYNAPSE_RANKS = [
          { level: 1, title: 'Cadet Analyst', reqExp: 0 },
          { level: 2, title: 'Gravimetric Scout', reqExp: 350 },
          { level: 3, title: 'Stellar Cartographer', reqExp: 850 },
          { level: 4, title: 'Astrometric Specialist', reqExp: 1600 },
          { level: 5, title: 'Relativistic Scholar', reqExp: 2600 },
          { level: 6, title: 'Singularity Master', reqExp: 4000 },
          { level: 7, title: 'Cosmic Architect', reqExp: 6000 },
        ];

        // Procedural Web Audio Synthesizer with Ratchet Tilt Sounds
        const { SoundEngine } = window.ToenowGameModules['space-scale'].audio;

        const sound = new SoundEngine();
        const unlockAudio = () => {
          sound.userInteracted = true;
        };
        window.addEventListener('pointerdown', unlockAudio, { passive: true });
        window.addEventListener('keydown', unlockAudio, { passive: true });
        window.addEventListener('click', unlockAudio, { passive: true });

        const { createRng, shuffleArray, getWaveDurationSec, getLevelForWave, getLevelTimeBonusSec, calculateWaveDuration, computeTorqueTiltAngle, generateOverhauledPuzzle } = window.ToenowGameModules['space-scale'].rules;

        // Particle pool
        const MAX_PARTICLES = 72;
        const particles = Array.from({ length: MAX_PARTICLES }, () => ({
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: 2,
          color: '#38bdf8',
          alpha: 1,
          life: 0,
          maxLife: 0.5,
        }));

        const shockwaves = Array.from({ length: 8 }, () => ({
          active: false,
          x: 0,
          y: 0,
          radius: 10,
          maxRadius: 180,
          color: '#38bdf8',
          alpha: 1,
          life: 0,
          maxLife: 0.45,
        }));

        function spawnSupernova(x, y, primaryColor, secondaryColor) {
          for (let i = 0; i < shockwaves.length; i++) {
            const sw = shockwaves[i];
            if (!sw.active) {
              sw.active = true;
              sw.x = x;
              sw.y = y;
              sw.radius = 6;
              sw.maxRadius = 195;
              sw.color = primaryColor;
              sw.life = 0;
              sw.maxLife = 0.48;
              break;
            }
          }
          let spawned = 0;
          for (let i = 0; i < MAX_PARTICLES && spawned < 32; i++) {
            const p = particles[i];
            if (!p.active) {
              const angle = (Math.PI * 2 * spawned) / 32 + (Math.random() - 0.5) * 0.2;
              const speed = 100 + Math.random() * 260;
              p.active = true;
              p.x = x;
              p.y = y;
              p.vx = Math.cos(angle) * speed;
              p.vy = Math.sin(angle) * speed;
              p.radius = 2 + Math.random() * 3.5;
              p.color = spawned % 2 === 0 ? primaryColor : secondaryColor;
              p.life = 0;
              p.maxLife = 0.35 + Math.random() * 0.3;
              p.alpha = 1;
              spawned++;
            }
          }
        }

        const STAR_COUNT = IS_HEADLESS ? 40 : 100;
        const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
          x: ((i * 7919) % 1000) / 1000,
          y: ((i * 6271) % 1000) / 1000,
          size: (i % 3) * 0.65 + 0.8,
          speed: 0.004 + (i % 5) * 0.002,
          alpha: 0.25 + (i % 7) * 0.1,
        }));

        // DOM elements
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        const hudScoreEl = document.getElementById('hud-score');
        const hudComboEl = document.getElementById('hud-combo');
        const hudBestEl = document.getElementById('hud-best');
        const hudRankEl = document.getElementById('hud-rank');
        const hudExpEl = document.getElementById('hud-exp');
        const hudExpFillEl = document.getElementById('hud-exp-fill');

        const directiveBannerEl = document.getElementById('directive-banner');
        const directiveActionLabelEl = document.getElementById('directive-action-label');
        const directiveBadgePillEl = document.getElementById('directive-badge-pill');
        const directiveSubEl = document.getElementById('directive-sub');

        const hudWaveEl = document.getElementById('hud-wave');
        const hudModeEl = document.getElementById('hud-mode');
        const hudTimerEl = document.getElementById('hud-timer');
        const dockButtonsEl = document.getElementById('dock-buttons');

const pauseScoreEl = document.getElementById('pause-score');
        const pauseWaveEl = document.getElementById('pause-wave');
        const pauseTimeEl = document.getElementById('pause-time');

        // State
        let gameState = 'title';
        let isPracticeMode = false;
        let score = 0;
        let bestScore = parseInt(localStorage.getItem(STORAGE_BEST_SCORE) || '0', 10) || 0;
        let totalExp = parseInt(localStorage.getItem(STORAGE_BEST_EXP) || '0', 10) || 0;

        // Initialize Toenow Game SDK
        const toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'space-scale', category: 'logic', gameTitle: 'Space Scale' })
          : null;
        let streak = 0;
        let peakStreak = 0;
        let globalTimeSec = ToenowTime.START_SECONDS;
        let wave = 1;
        let waveElapsedSec = 0;
        let currentPuzzle = generateOverhauledPuzzle(1, 101);

        let renderedBodyTargets = [];
        let hoveredBodyId = null;

        let hitstopTimer = 0;
        let collapseAnim = null;
        let cameraTrauma = 0;
        let redFlashAlpha = 0;
        let pointerNormX = 0;
        let pointerNormY = 0;

        function getSynapseRank(exp) {
          for (let i = SYNAPSE_RANKS.length - 1; i >= 0; i--) {
            if (exp >= SYNAPSE_RANKS[i].reqExp) {
              return SYNAPSE_RANKS[i];
            }
          }
          return SYNAPSE_RANKS[0];
        }

        function syncPersistentStatsUI() {
          ToenowScreens.updateTitle('space-scale', { bestScore: bestScore, bestWave: parseInt(localStorage.getItem('space_scale_best_wave') || '1', 10) });

          hudBestEl.textContent = String(Math.round(bestScore));
        }
        syncPersistentStatsUI();

        function setGameState(nextState) {
          gameState = nextState;
          document.body.dataset.state = nextState;
          if (nextState === 'playing') {
            if (document.activeElement && document.activeElement !== document.body) {
              document.activeElement.blur();
            }
          }
        }

        function updateExpUI(newExp) {
          totalExp = newExp;
          if (!isPracticeMode) localStorage.setItem(STORAGE_BEST_EXP, String(totalExp));
          const currentRank = getSynapseRank(totalExp);

          const nextRank = SYNAPSE_RANKS.find((r) => r.level === currentRank.level + 1);
          const baseExp = currentRank.reqExp;
          const targetExp = nextRank ? nextRank.reqExp : baseExp + 2500;
          const progress = Math.min(
            1,
            Math.max(0, (totalExp - baseExp) / Math.max(1, targetExp - baseExp))
          );

          hudRankEl.textContent = 'Rank ' + currentRank.level + ' · ' + currentRank.title;
          hudExpEl.textContent = totalExp + ' EXP';
          hudExpFillEl.style.width = (progress * 100).toFixed(1) + '%';

        }

        function buildDockButtons() {
          if (!dockButtonsEl) return;
          dockButtonsEl.innerHTML = '';
        }

        function syncDockHoverState() {
          if (!dockButtonsEl) return;
        }

        function syncHudDOM() {
          hudScoreEl.textContent = String(Math.round(score));
          hudBestEl.textContent = String(Math.round(bestScore));

          directiveBannerEl.dataset.directive = currentPuzzle.directive;
          if (currentPuzzle.directive === 'max') {
            directiveActionLabelEl.textContent = '▲ TAP THE HEAVIEST';
            directiveBadgePillEl.textContent = 'HEAVIEST';
            directiveSubEl.textContent = 'Choose the parcel with the MOST weight';
          } else if (currentPuzzle.directive === 'min') {
            directiveActionLabelEl.textContent = '▼ TAP THE LIGHTEST';
            directiveBadgePillEl.textContent = 'LIGHTEST';
            directiveSubEl.textContent = 'Choose the parcel with the LEAST weight';
          } else {
            directiveActionLabelEl.textContent = '◆ TAP THE MIDDLE WEIGHT';
            directiveBadgePillEl.textContent = 'MEDIAN';
            directiveSubEl.textContent = 'Choose the MIDDLE parcel (not heaviest, not lightest)';
          }

          hudWaveEl.textContent = 'WAVE ' + wave;
          hudModeEl.textContent = currentPuzzle.modeLabel;

          hudTimerEl.textContent = window.ToenowTutorials?.isActive?.('space-scale') ? '∞' : globalTimeSec.toFixed(1) + 's';
          if (globalTimeSec <= 10) {
            hudTimerEl.style.color = 'var(--accent-rose)';
          } else {
            hudTimerEl.style.color = 'var(--text-primary)';
          }

          document.body.dataset.wave = String(wave);
          document.body.dataset.score = String(Math.round(score));
        }

        function loadWave(nextWave) {
          if (window.ToenowAnimals) window.ToenowAnimals.setWave('space-scale', nextWave);
          wave = nextWave;
          currentPuzzle = generateOverhauledPuzzle(wave, Boolean(window.ToenowTutorials?.isActive?.('space-scale')) ? 1234 : Date.now());
          waveElapsedSec = 0;
          hoveredBodyId = null;
          collapseAnim = null;

          // Trigger attention pulse on directive banner so user immediately sees new target
          directiveBannerEl.classList.remove('pulse-wave');
          void directiveBannerEl.offsetWidth;
          directiveBannerEl.classList.add('pulse-wave');

          // Trigger springy tilt release ratchet sound!
          sound.playRatchetRelease();

          buildDockButtons();
          syncHudDOM();
        }

        function startNewGame(startWave = 1, isPractice = false) {
          if (!Boolean(window.ToenowTutorials?.isActive?.('space-scale')) && toenowSdk) toenowSdk.startRun({ wave: startWave, isPractice });
          isPracticeMode = Boolean(isPractice);
          score = 0;
          streak = 0;
          hudComboEl.textContent = '0x';
          peakStreak = 0;
          globalTimeSec = ToenowTime.START_SECONDS;
          cameraTrauma = 0;
          redFlashAlpha = 0;
          updateExpUI(totalExp);
          loadWave(startWave);
          setGameState('playing');
        }

        function triggerGameOver() {
          if (Boolean(window.ToenowTutorials?.isActive?.('space-scale'))) return;
          const finalScore = Math.round(score);
          if (!isPracticeMode) {
            const clearedWave = Math.max(1, wave - 1);
            const curBestWave = parseInt(localStorage.getItem('space_scale_best_wave') || '1', 10) || 1;
            if (clearedWave > curBestWave) {
              try {
                localStorage.setItem('space_scale_best_wave', String(clearedWave));
              } catch (_) {}
            }
            if (finalScore > bestScore) {
              bestScore = finalScore;
              try {
                localStorage.setItem(STORAGE_BEST_SCORE, String(bestScore));
              } catch (_) {}
            }
            syncPersistentStatsUI();
          }
          const levelInfo = ToenowLevels.getLevelInfo(wave);
          ToenowScreens.updateGameOver('space-scale', { score: finalScore, bestScore, wave, combo: peakStreak, reason: 'TIME EXPIRED' });
                    sound.playGameOver();
          setGameState('gameover');

          // Toenow Game SDK Unified Lifecycle & Hub Contract
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: finalScore,
              wave: Math.max(1, wave - 1),
              isPractice: isPracticeMode,
              rank: levelInfo.badgeText
            });
          } else {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(
                  {
                    type: 'GAME_OVER',
                    gameId: 'space-scale',
                    category: 'logic',
                    score: finalScore,
                    isPractice: Boolean(isPracticeMode),
                    wave: Math.max(1, wave - 1),
                    rank: levelInfo.badgeText
                  },
                  '*'
                );
              }
            } catch (_) {}
          }
        }

        function handleBodySelection(bodyId, tapX, tapY) {
          if (gameState !== 'playing' || collapseAnim || (Boolean(window.ToenowTutorials?.isActive?.('space-scale')) && Boolean(window.ToenowTutorials?.isComplete?.('space-scale')))) return;
          if (Boolean(window.ToenowTutorials?.isActive?.('space-scale'))) {
            if (bodyId === currentPuzzle.targetBodyId) {
              hoveredBodyId = bodyId; syncDockHoverState(); sound.playCollapseSuccess(1);
              window.ToenowTutorials.complete('space-scale');
            } else { sound.playShieldDamage(); }
            return;
          }

          const isCorrect = bodyId === currentPuzzle.targetBodyId;
          if (window.ToenowAnimals) window.ToenowAnimals.feedback('space-scale', isCorrect);

          if (isCorrect) {
            toenowSdk?.recordCorrectAnswer();
            globalTimeSec = ToenowTime.correct(globalTimeSec);
            streak++;
            hudComboEl.textContent = streak + 'x';
            peakStreak = Math.max(peakStreak, streak);
            const tierBase = wave <= 3 ? 120 : wave <= 6 ? 200 : 320;
            const speedRatio = Math.max(0, 1 - waveElapsedSec / currentPuzzle.waveDurationSec);
            const speedBonus = Math.round(speedRatio * 110);
            const streakBonus = Math.min(350, (streak - 1) * 40);
            const earnedScore = tierBase + speedBonus + streakBonus;
            score += earnedScore;

            if (score > bestScore) {
              bestScore = score;
              if (!isPracticeMode) localStorage.setItem(STORAGE_BEST_SCORE, String(bestScore));
            }

            const expGain = Math.round(100 + streak * 30 + speedRatio * 60);
            updateExpUI(totalExp + expGain);

            let targetX = tapX || canvasWidth * 0.5;
            let targetY = tapY || canvasHeight * 0.5;
            const foundTarget = renderedBodyTargets.find((t) => t.bodyId === bodyId);
            if (foundTarget) {
              targetX = foundTarget.x;
              targetY = foundTarget.y;
            }

            const chosenBody =
              currentPuzzle.bodies.find((b) => b.id === bodyId) || currentPuzzle.bodies[0];

            hitstopTimer = 0.045;
            cameraTrauma = 0.35;
            sound.playCollapseSuccess(streak);
            spawnSupernova(targetX, targetY, chosenBody.primaryColor, chosenBody.secondaryColor);

            collapseAnim = {
              bodyId,
              x: targetX,
              y: targetY,
              progress: 0,
              duration: 0.28,
              primaryColor: chosenBody.primaryColor,
              secondaryColor: chosenBody.secondaryColor,
            };

            syncHudDOM();
          } else {
            // A wrong answer costs run time.
            streak = 0;
            hudComboEl.textContent = '0x';
            globalTimeSec = ToenowTime.wrong(globalTimeSec);
            cameraTrauma = 0.95;
            redFlashAlpha = 0.65;
            sound.playShieldDamage();
            syncHudDOM();

            if (globalTimeSec <= 0) {
              triggerGameOver();
            }
          }
        }

        // Resize handling
        let canvasWidth = (window.ToenowTutorials?.getViewport?.().width || window.innerWidth);
        let canvasHeight = (window.ToenowTutorials?.getViewport?.().height || window.innerHeight);

        function resizeCanvas() {
          canvasWidth = (window.ToenowTutorials?.getViewport?.().width || window.innerWidth);
          canvasHeight = (window.ToenowTutorials?.getViewport?.().height || window.innerHeight);
          const dpr = IS_HEADLESS ? 1 : Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(canvasWidth * dpr);
          canvas.height = Math.floor(canvasHeight * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function getCanvasPoint(clientX, clientY) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: clientX - rect.left,
            y: clientY - rect.top,
          };
        }

        canvas.addEventListener('pointermove', (e) => {
          const pt = getCanvasPoint(e.clientX, e.clientY);
          pointerNormX = (pt.x / Math.max(1, canvasWidth) - 0.5) * 2;
          pointerNormY = (pt.y / Math.max(1, canvasHeight) - 0.5) * 2;

          if (gameState !== 'playing') return;
          let found = null;
          let bestDist = Infinity;
          for (let i = 0; i < renderedBodyTargets.length; i++) {
            const t = renderedBodyTargets[i];
            const dx = pt.x - t.x;
            const dy = pt.y - t.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= t.hitRadius && dist < bestDist) {
              bestDist = dist;
              found = t.bodyId;
            }
          }
          if (found !== hoveredBodyId) {
            hoveredBodyId = found;
            syncDockHoverState();
          }
        });

        canvas.addEventListener('pointerdown', (e) => {
          if (gameState !== 'playing' || collapseAnim) return;
          const pt = getCanvasPoint(e.clientX, e.clientY);
          let chosenTarget = null;
          let bestDist = Infinity;
          for (let i = 0; i < renderedBodyTargets.length; i++) {
            const t = renderedBodyTargets[i];
            const dx = pt.x - t.x;
            const dy = pt.y - t.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= t.hitRadius && dist < bestDist) {
              bestDist = dist;
              chosenTarget = t;
            }
          }
          if (chosenTarget) {
            e.preventDefault();
            handleBodySelection(chosenTarget.bodyId, chosenTarget.x, chosenTarget.y);
          }
        });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
          if (e.repeat) return;
          const key = e.key;

          if (gameState === 'title') {
            if (key === 'Enter' || key === ' ') {
              e.preventDefault();
              startNewGame();
            }
            return;
          }

          if (gameState === 'gameover') {
            if (key === 'Enter' || key === ' ' || key === 'r' || key === 'R') {
              e.preventDefault();
              startNewGame();
            }
            return;
          }

          if (key === 'Escape' || key === 'p' || key === 'P') {
            e.preventDefault();
            if (gameState === 'playing') {
              pauseScoreEl.textContent = String(Math.round(score));
              pauseWaveEl.textContent = String(wave);
              pauseTimeEl.textContent = globalTimeSec.toFixed(1) + 's';
              setGameState('paused');
            } else if (gameState === 'paused') {
              setGameState('playing');
            }
            return;
          }

          if (key === 'm' || key === 'M') {
            e.preventDefault();
            toggleMute();
            return;
          }

          if (key === 'r' || key === 'R') {
            e.preventDefault();
            startNewGame();
            return;
          }

          if (gameState === 'playing' && currentPuzzle) {
            const num = parseInt(key, 10);
            if (num >= 1 && num <= currentPuzzle.bodies.length) {
              e.preventDefault();
              const targetBody = currentPuzzle.bodies[num - 1];
              if (targetBody) {
                handleBodySelection(targetBody.id);
              }
            }
          }
        });

        function toggleMute() {
          sound.muted = !sound.muted;
          document.getElementById('icon-sound-on').style.display = sound.muted ? 'none' : 'block';
          document.getElementById('icon-sound-off').style.display = sound.muted ? 'block' : 'none';
        }

        if (typeof ToenowLevels !== 'undefined' && ToenowLevels.setupPracticeMode) {
          ToenowLevels.setupPracticeMode({
            container: '#title-screen .unified-title-card',
            onStartGame: (startWave, isPractice) => {
              startNewGame(startWave, isPractice);
            }
          });
        }

        document.getElementById('btn-start').addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

document.getElementById('btn-play-again').addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

        document.getElementById('btn-resume').addEventListener('click', (e) => {
          e.currentTarget.blur();
          setGameState('playing');
        });

        document.getElementById('btn-restart-pause').addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

        document.getElementById('btn-restart-hud').addEventListener('click', (e) => {
          e.currentTarget.blur();
          startNewGame();
        });

        document.getElementById('btn-title-pause').addEventListener('click', (e) => {
          e.currentTarget.blur();
          syncPersistentStatsUI();
          setGameState('title');
        });

        document.getElementById('btn-title-over').addEventListener('click', (e) => {
          e.currentTarget.blur();
          syncPersistentStatsUI();
          setGameState('title');
        });

        document.getElementById('btn-mute').addEventListener('click', (e) => {
          e.currentTarget.blur();
          toggleMute();
        });

        document.getElementById('btn-pause').addEventListener('click', (e) => {
          e.currentTarget.blur();
          if (gameState === 'playing') {
            pauseScoreEl.textContent = String(Math.round(score));
            pauseWaveEl.textContent = String(wave);
            pauseTimeEl.textContent = globalTimeSec.toFixed(1) + 's';
            setGameState('paused');
          } else if (gameState === 'paused') {
            setGameState('playing');
          }
        });

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autostart') === '1') {
          let w = Math.max(1, parseInt(urlParams.get('wave') || '1', 10) || 1);
          if (urlParams.get('level')) {
            const lvl = parseInt(urlParams.get('level'), 10);
            if (lvl === 1) w = 1;
            else if (lvl === 2) w = 4;
            else if (lvl === 3) w = 7;
            else if (lvl === 4) w = 10;
            else if (lvl >= 5) w = 13;
          }
          startNewGame();
          if (w > 1) loadWave(w);
        }

        // Mystery parcel and calibrated counterweight rendering

// Render Scale Beam with Centered Bounding Span & Adaptive Scale Factor (Prevents Overlap)

// Title Showcase demo scale
        const titleDemoBodies = {
          alpha: {
            id: 'alpha',
            label: 'VOID BLACK HOLE',
            symbol: 'α',
            keyIndex: 1,
            archetype: 'micro_hole',
            densityDesc: 'Sealed mystery parcel',
            visualRadius: 24,
            primaryColor: '#a855f7',
            secondaryColor: '#e879f9',
            mass: 140,
          },
          beta: {
            id: 'beta',
            label: 'RINGED SATURN',
            symbol: 'β',
            keyIndex: 2,
            archetype: 'gas_giant',
            densityDesc: 'Sealed mystery parcel',
            visualRadius: 42,
            primaryColor: '#f59e0b',
            secondaryColor: '#dc2626',
            mass: 30,
          },
        };
        const titleDemoScale = {
          id: 'title-scale',
          type: 'simple',
          leftItems: [{ type: 'body', id: 'beta', bodyId: 'beta', mass: 30 }],
          rightItems: [{ type: 'body', id: 'alpha', bodyId: 'alpha', mass: 140 }],
          leftDistance: 1.0,
          rightDistance: 1.0,
          leftTorque: 30,
          rightTorque: 140,
          targetAngle: 0.24,
          currentAngle: 0.24,
          angularVel: 0,
        };

        // Main 60 FPS Loop with Damped Spring Tilting Physics
        let lastFrameTime = performance.now();

        function tick(now) {
          const rawDt = (now - lastFrameTime) / 1000;
          lastFrameTime = now;
          const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
          const timeSec = now / 1000;

          cameraTrauma = Math.max(0, cameraTrauma - dt * 2.2);
          redFlashAlpha = Math.max(0, redFlashAlpha - dt * 1.8);
          if (gameState === 'playing' && !window.ToenowTutorials?.isActive?.('space-scale')) {
            globalTimeSec = Math.max(0, globalTimeSec - dt);
            syncHudDOM();
            if (globalTimeSec <= 0) triggerGameOver();
          }

          if (gameState === 'playing') {
            if (hitstopTimer > 0) {
              hitstopTimer = Math.max(0, hitstopTimer - dt);
            } else if (collapseAnim) {
              collapseAnim.progress += dt / collapseAnim.duration;
              if (collapseAnim.progress >= 1) {
                collapseAnim = null;
                loadWave(wave + 1);
              }
            } else {

              if (!Boolean(window.ToenowTutorials?.isActive?.('space-scale'))) waveElapsedSec += dt;
              syncHudDOM();

            }

            // Damped Spring Harmonic Tilting on spawn (settles in ~0.4s)
            if (currentPuzzle) {
              for (let i = 0; i < currentPuzzle.scales.length; i++) {
                const s = currentPuzzle.scales[i];
                const stiffness = 28;
                const damping = 9.2;
                const accel = (s.targetAngle - s.currentAngle) * stiffness - s.angularVel * damping;
                s.angularVel += accel * dt;
                s.currentAngle += s.angularVel * dt;
              }
            }
          }

          // Particles
          for (let i = 0; i < shockwaves.length; i++) {
            const sw = shockwaves[i];
            if (sw.active) {
              sw.life += dt;
              if (sw.life >= sw.maxLife) {
                sw.active = false;
              } else {
                const p = sw.life / sw.maxLife;
                sw.radius = 8 + (sw.maxRadius - 8) * (1 - Math.pow(1 - p, 3));
                sw.alpha = 1 - p;
              }
            }
          }

          for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (p.active) {
              p.life += dt;
              if (p.life >= p.maxLife) {
                p.active = false;
              } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.alpha = 1 - p.life / p.maxLife;
              }
            }
          }

          // Render
          ctx.save();
          ctx.fillStyle = '#2d4943';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

          if (cameraTrauma > 0.001) {
            const shake = cameraTrauma * cameraTrauma * 20;
            const sx = (Math.random() * 2 - 1) * shake;
            const sy = (Math.random() * 2 - 1) * shake;
            ctx.translate(sx, sy);
          }

          ctx.fillStyle='rgba(194,160,108,.12)';ctx.fillRect(0,canvasHeight-26,canvasWidth,26);
          ctx.strokeStyle='rgba(206,177,126,.18)';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(9,140);ctx.lineTo(9,canvasHeight);ctx.moveTo(canvasWidth-9,140);ctx.lineTo(canvasWidth-9,canvasHeight);ctx.stroke();
          if (gameState !== 'title' && window.ToenowAnimals) window.ToenowAnimals.drawAnimal(ctx,'fox',canvasWidth*.5,canvasHeight-40,62);
          // Fireflies above the weighhouse
          for (let i = 0; i < STAR_COUNT; i++) {
            const st = stars[i];
            const sy = ((st.y + timeSec * st.speed) % 1) * canvasHeight;
            const sx = st.x * canvasWidth;
            ctx.fillStyle = 'rgba(226, 232, 240, ' + st.alpha.toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(sx, sy, st.size, 0, Math.PI * 2);
            ctx.fill();
          }

          if (gameState === 'title') {
            // Title background demo scale hidden as requested
          } else if (currentPuzzle) {
            renderedBodyTargets = [];
            const bodiesById = {};
            for (let i = 0; i < currentPuzzle.bodies.length; i++) {
              const b = currentPuzzle.bodies[i];
              bodiesById[b.id] = b;
            }

            const scaleCount = currentPuzzle.scales.length;

            function getScaleLayout(count, W, H) {
              const isMobile = W < 768;
              const positions = [];
              let baseBeam = 0;
              let scaleFactor = 1.0;

              if (count === 1) {
                baseBeam = Math.min(190, W * (isMobile ? 0.28 : 0.24));
                scaleFactor = isMobile ? 0.92 : 1.0;
                positions.push({ x: W * 0.5, y: H * 0.52 });
              } else if (count === 2) {
                if (isMobile) {
                  baseBeam = Math.min(92, W * 0.22);
                  scaleFactor = 0.74;
                  positions.push({ x: W * 0.5, y: H * 0.36 });
                  positions.push({ x: W * 0.5, y: H * 0.70 });
                } else {
                  baseBeam = Math.min(125, W * 0.13);
                  scaleFactor = 0.84;
                  positions.push({ x: W * 0.27, y: H * 0.52 });
                  positions.push({ x: W * 0.73, y: H * 0.52 });
                }
              } else if (count === 3) {
                if (isMobile) {
                  baseBeam = Math.min(80, W * 0.19);
                  scaleFactor = 0.60;
                  positions.push({ x: W * 0.5, y: H * 0.30 });
                  positions.push({ x: W * 0.5, y: H * 0.53 });
                  positions.push({ x: W * 0.5, y: H * 0.76 });
                } else {
                  baseBeam = Math.min(98, W * 0.10);
                  scaleFactor = 0.72;
                  positions.push({ x: W * 0.22, y: H * 0.40 });
                  positions.push({ x: W * 0.50, y: H * 0.68 });
                  positions.push({ x: W * 0.78, y: H * 0.40 });
                }
              } else if (count === 4) {
                if (isMobile) {
                  baseBeam = Math.min(48, W * 0.12);
                  scaleFactor = 0.46;
                  positions.push({ x: W * 0.27, y: H * 0.37 });
                  positions.push({ x: W * 0.73, y: H * 0.37 });
                  positions.push({ x: W * 0.27, y: H * 0.71 });
                  positions.push({ x: W * 0.73, y: H * 0.71 });
                } else {
                  baseBeam = Math.min(90, W * 0.095);
                  scaleFactor = 0.66;
                  positions.push({ x: W * 0.28, y: H * 0.38 });
                  positions.push({ x: W * 0.72, y: H * 0.38 });
                  positions.push({ x: W * 0.28, y: H * 0.72 });
                  positions.push({ x: W * 0.72, y: H * 0.72 });
                }
              } else if (count === 5) {
                if (isMobile) {
                  baseBeam = Math.min(44, W * 0.11);
                  scaleFactor = 0.42;
                  positions.push({ x: W * 0.27, y: H * 0.28 });
                  positions.push({ x: W * 0.73, y: H * 0.28 });
                  positions.push({ x: W * 0.50, y: H * 0.52 });
                  positions.push({ x: W * 0.27, y: H * 0.76 });
                  positions.push({ x: W * 0.73, y: H * 0.76 });
                } else {
                  baseBeam = Math.min(80, W * 0.08);
                  scaleFactor = 0.60;
                  positions.push({ x: W * 0.20, y: H * 0.38 });
                  positions.push({ x: W * 0.50, y: H * 0.38 });
                  positions.push({ x: W * 0.80, y: H * 0.38 });
                  positions.push({ x: W * 0.35, y: H * 0.72 });
                  positions.push({ x: W * 0.65, y: H * 0.72 });
                }
              } else {
                // 6 scales
                if (isMobile) {
                  baseBeam = Math.min(42, W * 0.105);
                  scaleFactor = 0.40;
                  positions.push({ x: W * 0.27, y: H * 0.28 });
                  positions.push({ x: W * 0.73, y: H * 0.28 });
                  positions.push({ x: W * 0.27, y: H * 0.52 });
                  positions.push({ x: W * 0.73, y: H * 0.52 });
                  positions.push({ x: W * 0.27, y: H * 0.76 });
                  positions.push({ x: W * 0.73, y: H * 0.76 });
                } else {
                  baseBeam = Math.min(78, W * 0.078);
                  scaleFactor = 0.56;
                  positions.push({ x: W * 0.20, y: H * 0.38 });
                  positions.push({ x: W * 0.50, y: H * 0.38 });
                  positions.push({ x: W * 0.80, y: H * 0.38 });
                  positions.push({ x: W * 0.20, y: H * 0.72 });
                  positions.push({ x: W * 0.50, y: H * 0.72 });
                  positions.push({ x: W * 0.80, y: H * 0.72 });
                }
              }

              return { positions, baseBeam, scaleFactor };
            }

            const layout = getScaleLayout(scaleCount, canvasWidth, canvasHeight);
            for (let i = 0; i < scaleCount; i++) {
              const pos = layout.positions[i] || { x: canvasWidth * 0.5, y: canvasHeight * 0.5 };
              drawScale(
                ctx,
                currentPuzzle.scales[i],
                pos.x,
                pos.y,
                layout.baseBeam,
                bodiesById,
                timeSec,
                true,
                i,
                layout.scaleFactor
              );
            }

            // Cross-scale linkage arcs
            if (renderedBodyTargets.length > 2) {
              currentPuzzle.bodies.forEach((b) => {
                const matches = renderedBodyTargets.filter((t) => t.bodyId === b.id);
                if (matches.length >= 2) {
                  const isHov = hoveredBodyId === b.id;
                  ctx.save();
                  ctx.strokeStyle = isHov
                    ? 'rgba(56, 189, 248, 0.75)'
                    : 'rgba(148, 163, 184, 0.22)';
                  ctx.lineWidth = isHov ? 2 : 1.2;
                  ctx.setLineDash([5, 5]);
                  ctx.beginPath();
                  for (let m = 0; m < matches.length - 1; m++) {
                    const p1 = matches[m];
                    const p2 = matches[m + 1];
                    const midX = (p1.x + p2.x) * 0.5;
                    const midY = Math.min(p1.y, p2.y) - 40;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
                  }
                  ctx.stroke();
                  ctx.restore();
                }
              });
            }
          }

          // Shockwaves
          for (let i = 0; i < shockwaves.length; i++) {
            const sw = shockwaves[i];
            if (sw.active) {
              ctx.save();
              ctx.strokeStyle = sw.color;
              ctx.globalAlpha = Math.max(0, sw.alpha);
              ctx.lineWidth = 4 * sw.alpha + 1;
              ctx.beginPath();
              ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }

          // Burst particles
          for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (p.active) {
              ctx.save();
              ctx.fillStyle = p.color;
              ctx.globalAlpha = Math.max(0, p.alpha);
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // Red screen damage flash
          if (redFlashAlpha > 0.01) {
            ctx.fillStyle = 'rgba(239, 68, 68, ' + (redFlashAlpha * 0.38).toFixed(3) + ')';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          }

          ctx.restore();

          if (IS_HEADLESS) {
            setTimeout(() => requestAnimationFrame(tick), 60);
          } else {
            requestAnimationFrame(tick);
          }
        }

        window.ToenowTutorials?.register?.('space-scale', {
          start() { startNewGame(1, true); },
          stop() { isPracticeMode = false; collapseAnim = null; setGameState('title'); },
          getGuide() {
            const target = renderedBodyTargets.find(t => t.bodyId === currentPuzzle?.targetBodyId);
            const bounds = canvas.getBoundingClientRect();
            const directive = currentPuzzle?.directive === 'min' ? 'lighter' : 'heavier';
            return { prompt: 'The lower side is heavier. Tap the ' + directive + ' parcel.', rect: target ? { x: bounds.left + target.x - target.hitRadius, y: bounds.top + target.y - target.hitRadius, width: target.hitRadius * 2, height: target.hitRadius * 2 } : null, waiting: !target, done: Boolean(window.ToenowTutorials?.isComplete?.('space-scale')) };
          }
        });

        requestAnimationFrame(tick);
      })();
    