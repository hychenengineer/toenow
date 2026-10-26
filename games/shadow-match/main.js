ToenowScreens.mount("shadow-match");

(function () {
        'use strict';
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { renderFrame, renderForestTheater, renderOpticalChamber, renderCandidateDockCards } = window.ToenowGameModules['shadow-match'].renderer.createRenderer({
          get state() { return state; },
          get canvas() { return canvas; },
          get ctx() { return ctx; },
          get getLevelSpecForWave() { return getLevelSpecForWave; },
          get shadowCtx() { return shadowCtx; },
          get shadowBuffer() { return shadowBuffer; },
          get rimCtx() { return rimCtx; },
          get rimBuffer() { return rimBuffer; },
          get traceShapePath() { return traceShapePath; },
          get IS_HEADLESS() { return IS_HEADLESS; },
          get updateCardRects() { return updateCardRects; }
        });

// Detect headless environment for software-rendering budget optimization
        const IS_HEADLESS = Boolean(
          navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent || '')
        );

        // ============================================================================
        // 1. ZERO-ASSET PROCEDURAL WEB AUDIO API (SoundEngine)
        // ============================================================================
        const { SoundEngine } = window.ToenowGameModules['shadow-match'].audio;

        const sound = new SoundEngine();

        // ============================================================================
        // 2. PROCEDURAL SILHOUETTE VOCABULARY (14 SHAPES IN [-1, 1] LOCAL COORDS)
        // ============================================================================
        const { SHAPE_VOCABULARY, ALL_SHAPE_IDS } = window.ToenowGameModules['shadow-match'].shapes;

        const { randomFloat, traceShapePath, getLevelSpecForWave, shuffleArray, canonicalKey, generateWaveSetup, resolveCapacitiveCardHit, getCognitiveTierBadge } = window.ToenowGameModules['shadow-match'].rules;

        const arcadeFrame = document.getElementById('arcade-frame');
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        // Offscreen buffers for True Unified Shadow Occlusion
        const shadowBuffer = document.createElement('canvas');
        const shadowCtx = shadowBuffer.getContext('2d');
        const rimBuffer = document.createElement('canvas');
        const rimCtx = rimBuffer.getContext('2d');

        // HUD & Overlay Elements
        const hudScoreEl = document.getElementById('hud-score');
        const hudComboEl = document.getElementById('hud-combo');
        const hudTimerEl = document.getElementById('hud-timer');
        const hudTimerBarEl = document.getElementById('hud-timer-bar');
        const hudLevelEl = document.getElementById('hud-level');
        const hudWaveEl = document.getElementById('hud-wave');
        const hudBannerWrapEl = document.getElementById('hud-banner-wrap');
        const hudStatusTextEl = document.getElementById('hud-status-text');
        const hudFeedbackTagEl = document.getElementById('hud-feedback-tag');

        const chamberZoneEl = document.getElementById('chamber-zone');
        const dockZoneEl = document.getElementById('dock-zone');
        const dockGridEl = document.getElementById('dock-grid');
        const dockTargetCountEl = document.getElementById('dock-target-count');

        const titleOverlayEl = document.getElementById('title-overlay');
        const pauseOverlayEl = document.getElementById('pause-overlay');
        const gameoverOverlayEl = document.getElementById('gameover-overlay');

        const btnMute = document.getElementById('btn-mute');
        const iconSoundOn = document.getElementById('icon-sound-on');
        const iconSoundOff = document.getElementById('icon-sound-off');
        const btnPause = document.getElementById('btn-pause');
        const btnRestartQuick = document.getElementById('btn-restart-quick');
        const btnInitOptics = document.getElementById('btn-init-optics');
        const btnResume = document.getElementById('btn-resume');
        const btnPauseRestart = document.getElementById('btn-pause-restart');
        const btnPauseTitle = document.getElementById('btn-pause-title');
        const btnRebootOptics = document.getElementById('btn-reboot-optics');
        const btnGameoverTitle = document.getElementById('btn-gameover-title');
        const pauseStatScoreEl = document.getElementById('pause-stat-score');
        const pauseStatWaveEl = document.getElementById('pause-stat-wave');
        const pauseStatTimeEl = document.getElementById('pause-stat-time');

        const STORAGE_KEY_SCORE = 'shadow_match_best_score_v1';
        const STORAGE_KEY_WAVE = 'shadow_match_best_wave_v1';

        // Initialize Toenow Game SDK
        const toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'shadow-match', category: 'puzzle', gameTitle: 'Shadow Match' })
          : null;

        function loadBestRecords() {
          let s = 0, w = 1;
          try {
            s = parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || '0', 10) || 0;
            w = parseInt(localStorage.getItem(STORAGE_KEY_WAVE) || '1', 10) || 1;
          } catch (_) {}
          return { bestScore: s, bestWave: w };
        }

        function saveBestRecords(score, wave) {
          if (state && state.isPractice) return;
          if (window.ToenowTutorials?.isActive?.('shadow-match')) return;
          try {
            const current = loadBestRecords();
            const newScore = Math.max(current.bestScore, Math.round(score));
            const newWave = Math.max(current.bestWave, wave);
            localStorage.setItem(STORAGE_KEY_SCORE, String(newScore));
            localStorage.setItem(STORAGE_KEY_WAVE, String(newWave));
          } catch (_) {}
        }

        function updateTitleScreenRecords() {
          const rec = loadBestRecords();
          ToenowScreens.updateTitle('shadow-match', { bestScore: rec.bestScore, bestWave: rec.bestWave });
        }

        // ============================================================================
        // 5. GAME STATE & KINETIC BODY SIMULATION
        // ============================================================================
        const state = {
          mode: 'title', // 'title' | 'playing' | 'paused' | 'gameover'
          score: 0,
          combo: 1,
          peakCombo: 1,
          timeRemaining: 60.0,
          wave: 1,
          wavesResolved: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          waveElapsed: 0,
          lastTickSecond: 60,
          lastShutterCycle: -1,
          setup: null,
          drifters: [],
          // Feedback transition window ('none' | 'correct' | 'fault')
          transitionType: 'none',
          transitionTimer: 0,
          selectedCardIndex: -1,
          feedbackBannerTimer: 0,
          feedbackBannerText: '',
          feedbackBannerColor: '#ffaa00',
          // Geometry layout cache in frame-local CSS pixels
          frameWidth: 420,
          frameHeight: 740,
          dpr: 1,
          chamberRect: { x: 14, y: 120, width: 392, height: 290 },
          cardRects: [],
          cardButtons: []
        };

        function setGameState(nextMode) {
          state.mode = nextMode;
          document.body.dataset.state = nextMode;

          titleOverlayEl.classList.toggle('hidden', nextMode !== 'title');
          pauseOverlayEl.classList.toggle('hidden', nextMode !== 'paused');
          gameoverOverlayEl.classList.toggle('hidden', nextMode !== 'gameover');

          if (nextMode === 'title') {
            updateTitleScreenRecords();
          } else if (nextMode === 'paused') {
            if (pauseStatScoreEl) pauseStatScoreEl.textContent = String(Math.floor(state.score));
            if (pauseStatWaveEl) pauseStatWaveEl.textContent = String(state.wave);
            if (pauseStatTimeEl) pauseStatTimeEl.textContent = Math.max(0, state.timeRemaining).toFixed(1) + 's';
          }

          if (nextMode === 'playing' && document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
        }

        function measureLayout() {
          const frameBounds = arcadeFrame.getBoundingClientRect();
          const chamberBounds = chamberZoneEl.getBoundingClientRect();
          const dpr = IS_HEADLESS ? 1 : Math.min(window.devicePixelRatio || 1, 2.5);

          state.frameWidth = Math.max(300, frameBounds.width);
          state.frameHeight = Math.max(480, frameBounds.height);
          state.dpr = dpr;

          canvas.width = Math.round(state.frameWidth * dpr);
          canvas.height = Math.round(state.frameHeight * dpr);

          const padX = 14;
          const padY = 8;
          const cX = padX;
          const cY = chamberBounds.top - frameBounds.top + padY;
          const cW = Math.max(200, state.frameWidth - padX * 2);
          const cH = Math.max(140, chamberBounds.height - padY * 2);

          state.chamberRect = { x: cX, y: cY, width: cW, height: cH };

          shadowBuffer.width = Math.max(1, Math.round(cW * dpr));
          shadowBuffer.height = Math.max(1, Math.round(cH * dpr));
          rimBuffer.width = Math.max(1, Math.round(cW * dpr));
          rimBuffer.height = Math.max(1, Math.round(cH * dpr));

          updateCardRects();
        }

        function updateCardRects() {
          const frameBounds = arcadeFrame.getBoundingClientRect();
          state.cardRects = state.cardButtons.map(function (btn) {
            const r = btn.getBoundingClientRect();
            return {
              x: r.left - frameBounds.left,
              y: r.top - frameBounds.top,
              width: r.width,
              height: r.height
            };
          });
        }

        function spawnDriftersForSetup(setup) {
          const cW = state.chamberRect.width;
          const cH = state.chamberRect.height;
          const baseRadius = Math.min(cW, cH) * 0.21;
          const spec = setup.spec;

          const allItems = setup.targetShapes.map(function (shapeId) {
            return { shapeId: shapeId, isPhantom: false };
          });
          if (setup.phantomShape) {
            allItems.push({ shapeId: setup.phantomShape, isPhantom: true });
          }

          const total = allItems.length;
          const randomAngleOffset = randomFloat() * Math.PI * 2;
          state.drifters = allItems.map(function (item, idx) {
            const angle = (idx / total) * Math.PI * 2 + randomAngleOffset;
            const spread = Math.min(cW, cH) * (spec.level === 1 ? 0.16 : 0.14);
            const startX = cW * 0.5 + Math.cos(angle) * spread;
            const startY = cH * 0.5 + Math.sin(angle) * spread;

            // Randomize opposing velocity vectors so silhouettes drift across the center and overlap uniquely each wave
            const jitter = (randomFloat() - 0.5) * 0.45;
            const velAngle = angle + Math.PI + (idx % 2 === 0 ? 0.32 : -0.32) + jitter;
            const vx = Math.cos(velAngle) * spec.speedPxPerSec;
            const vy = Math.sin(velAngle) * spec.speedPxPerSec;
            const spinDir = idx % 2 === 0 ? 1 : -1;
            const spinRate = spec.spinRadPerSec * spinDir;

            // Separation target coordinates used during the 0.25s match confirmation freeze
            const sepCols = total <= 3 ? total : Math.ceil(total / 2);
            const sepRows = total <= 3 ? 1 : 2;
            const col = idx % sepCols;
            const row = Math.floor(idx / sepCols);
            const sepX = ((col + 0.5) / sepCols) * (cW * 0.76) + cW * 0.12;
            const sepY =
              sepRows === 1
                ? cH * 0.5
                : ((row + 0.5) / sepRows) * (cH * 0.64) + cH * 0.18;

            return {
              shapeId: item.shapeId,
              isPhantom: item.isPhantom,
              x: startX,
              y: startY,
              vx: vx,
              vy: vy,
              rotation: spec.level === 1 ? 0 : randomFloat() * Math.PI * 2,
              spin: spinRate,
              scale: 1.0,
              baseRadius: baseRadius,
              phase: randomAngleOffset + (idx * Math.PI * 2) / total,
              freqX: 1 + (idx % 2),
              freqY: 2 + (idx % 3 === 0 ? 1 : 0),
              sepX: sepX,
              sepY: sepY
            };
          });
        }

        function buildDockDOM(setup) {
          const is6 = setup.spec.cardCount === 6;
          dockGridEl.className = is6 ? 'grid-3x2' : 'grid-2x2';
          dockGridEl.innerHTML = '';
          state.cardButtons = [];

          dockTargetCountEl.textContent =
            setup.spec.targetCount +
            ' TARGETS' +
            (setup.spec.hasPhantom ? ' · 1 PHANTOM' : '');

          setup.cards.forEach(function (card, idx) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dock-card-btn';
            btn.dataset.cardIndex = String(idx);
            const readableNames = card.shapes
              .map(function (id) {
                return SHAPE_VOCABULARY[id].label;
              })
              .join(' + ');
            btn.setAttribute(
              'aria-label',
              'Schematic Card ' + (idx + 1) + ': ' + readableNames
            );

            const srSpan = document.createElement('span');
            srSpan.className = 'sr-only';
            srSpan.textContent = 'Card ' + (idx + 1) + ': ' + readableNames;
            btn.appendChild(srSpan);

            btn.addEventListener('click', function (e) {
              e.preventDefault();
              handleCardSelection(idx);
            });

            dockGridEl.appendChild(btn);
            state.cardButtons.push(btn);
          });

          updateCardRects();
        }

        function loadWave(waveNum) {
          state.wave = waveNum;
          if(window.ToenowAnimals) window.ToenowAnimals.setWave('shadow-match', waveNum);
          state.waveElapsed = 0;
          state.lastShutterCycle = -1;
          state.transitionType = 'none';
          state.transitionTimer = 0;
          state.selectedCardIndex = -1;

          const setup = generateWaveSetup(waveNum);
          state.setup = setup;

          buildDockDOM(setup);
          spawnDriftersForSetup(setup);
          syncHUD();

          if (state.mode === 'playing') {
            sound.playChamberPulse();
            if (setup.spec.hasPhantom) {
              sound.playPhantomTag();
            }
          }
        }

        function syncHUD() {
          const spec = state.setup ? state.setup.spec : getLevelSpecForWave(state.wave);
          hudScoreEl.textContent = String(Math.floor(state.score)).padStart(6, '0');
          hudComboEl.textContent = state.combo + 'x';
          hudComboEl.classList.toggle('combo-hot', state.combo >= 4);

          const clampedTime = Math.max(0, state.timeRemaining);
          hudTimerEl.textContent = Boolean(window.ToenowTutorials?.isActive?.('shadow-match')) ? '∞' : clampedTime.toFixed(1) + 's';
          hudTimerEl.classList.toggle('timer-warn', clampedTime < 15.0 && clampedTime >= 5.0);
          hudTimerEl.classList.toggle('timer-critical', clampedTime < 5.0);

          const barRatio = Math.max(0, Math.min(1, clampedTime / 60.0));
          hudTimerBarEl.style.transform = 'scaleX(' + barRatio.toFixed(4) + ')';
          if (clampedTime < 5.0) {
            hudTimerBarEl.style.backgroundColor = '#ff2a5f';
          } else if (clampedTime < 15.0) {
            hudTimerBarEl.style.backgroundColor = '#ffaa00';
          } else {
            hudTimerBarEl.style.backgroundColor = '#00f3ff';
          }

          hudLevelEl.textContent = String(spec.level);
          hudWaveEl.textContent = String(state.wave);

          hudStatusTextEl.textContent = spec.statusBanner;
          hudBannerWrapEl.classList.toggle('banner-phantom', spec.level === 5);

          if (state.feedbackBannerTimer > 0) {
            hudFeedbackTagEl.textContent = state.feedbackBannerText;
            hudFeedbackTagEl.style.color = state.feedbackBannerColor;
          } else {
            const clearProgress = spec.requiredClears
              ? 'CLEAR ' + spec.clearsInLevel + '/' + spec.requiredClears + ' · '
              : 'CLEAR ' + spec.clearsInLevel + ' · ';
            hudFeedbackTagEl.textContent =
              clearProgress + 'PAR ' + spec.parSeconds.toFixed(1) + 's';
            hudFeedbackTagEl.style.color = '#7fa6c4';
          }
        }

        function startNewRun(startWave = 1, isPractice = false) {
          if (!Boolean(window.ToenowTutorials?.isActive?.('shadow-match')) && toenowSdk) toenowSdk.startRun({ wave: startWave, isPractice });
          state.isPractice = Boolean(isPractice);
          state.score = 0;
          state.combo = 1;
          state.peakCombo = 1;
          state.timeRemaining = 60.0;
          state.wave = 1;
          state.wavesResolved = 0;
          state.totalAttempts = 0;
          state.correctAttempts = 0;
          state.lastTickSecond = 60;
          state.feedbackBannerTimer = 0;

          setGameState('playing');
          measureLayout();
          loadWave(1);
        }

        function triggerGameOver() {
          if (Boolean(window.ToenowTutorials?.isActive?.('shadow-match'))) return;
          state.timeRemaining = 0;
          syncHUD();

          const accuracyPct =
            state.totalAttempts > 0
              ? Math.round((state.correctAttempts / state.totalAttempts) * 100)
              : 100;

                    saveBestRecords(state.score, state.wave);
          ToenowScreens.updateGameOver('shadow-match', { score: state.score, bestScore: loadBestRecords().bestScore, wave: state.wave, combo: state.peakCombo });
          updateTitleScreenRecords();

          setGameState('gameover');

          // Toenow Game SDK Unified Lifecycle & Hub Contract
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: Math.round(state.score),
              wave: Number(state.wave) || 1,
              isPractice: Boolean(state.isPractice),
              streak: Number(state.peakCombo) || 0,
              accuracy: accuracyPct
            });
          } else {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(
                  {
                    type: 'GAME_OVER',
                    gameId: 'shadow-match',
                    category: 'puzzle',
                    score: Math.round(state.score),
                    isPractice: Boolean(state.isPractice),
                    wave: Number(state.wave) || 1,
                    streak: Number(state.peakCombo) || 0
                  },
                  '*'
                );
              }
            } catch (_) {}
          }
        }

        function handleCardSelection(cardIdx) {
          if (state.mode !== 'playing' || (Boolean(window.ToenowTutorials?.isActive?.('shadow-match')) && Boolean(window.ToenowTutorials?.isComplete?.('shadow-match')))) return;
          if (state.transitionType !== 'none') return;
          if (!state.setup || cardIdx < 0 || cardIdx >= state.setup.cards.length) return;

          state.selectedCardIndex = cardIdx;
          if (Boolean(window.ToenowTutorials?.isActive?.('shadow-match'))) {
            if (state.setup.cards[cardIdx].isCorrect) {
              sound.playLockSuccess(1); window.ToenowTutorials.complete('shadow-match');
            } else { sound.playFaultBuzz(); }
            return;
          }
          state.totalAttempts += 1;

          const chosenCard = state.setup.cards[cardIdx];
          const spec = state.setup.spec;

          if(window.ToenowAnimals) window.ToenowAnimals.feedback('shadow-match', chosenCard.isCorrect);
          if (chosenCard.isCorrect) {
            state.correctAttempts += 1;
            state.wavesResolved += 1;

            // Award (400 * level * combo) points
            const pointsEarned = 400 * spec.level * state.combo;
            state.score += pointsEarned;

            // Increment combo up to 8x
            state.combo = Math.min(8, state.combo + 1);
            if (state.combo > state.peakCombo) {
              state.peakCombo = state.combo;
            }

            // +1.5s time bonus if solved faster than Level Par Time
            const beatPar = state.waveElapsed <= spec.parSeconds;
            if (beatPar) {
              state.timeRemaining = Math.min(99.9, state.timeRemaining + 1.5);
              state.feedbackBannerText = '+1.5s PAR BONUS · +' + pointsEarned;
              state.feedbackBannerColor = '#00ff88';
            } else {
              state.feedbackBannerText = 'LOCK CONFIRMED · +' + pointsEarned;
              state.feedbackBannerColor = '#00ff88';
            }
            state.feedbackBannerTimer = 1.4;

            // Freeze & separate upper silhouettes for 0.25s in Neon Lime
            state.transitionType = 'correct';
            state.transitionTimer = 0.25;

            sound.playLockSuccess(state.combo);
            syncHUD();
          } else {
            // Wrong Card Tap (Optical Fault):
            // Reset combo to 1x, deduct -3.0s, flash Crimson, outline correct card in Amber for 0.45s
            state.combo = 1;
            state.timeRemaining = Math.max(0, state.timeRemaining - 3.0);

            state.feedbackBannerText = 'OPTICAL FAULT -3.0s · RETRY STAGE';
            state.feedbackBannerColor = '#ff2a5f';
            state.feedbackBannerTimer = 1.5;

            state.transitionType = 'fault';
            state.transitionTimer = 0.45;

            sound.playFaultBuzz();
            syncHUD();
          }
        }

        // ============================================================================
        // 6. CAPACITIVE TOUCH HIT-BOX EXPANSION (+15px FORGIVENESS) & INPUT BINDINGS
        // ============================================================================
        function onDockPointerTrigger(clientX, clientY, eventObj) {
          if (state.mode !== 'playing' || state.transitionType !== 'none') return;
          updateCardRects();
          const frameBounds = arcadeFrame.getBoundingClientRect();
          const localX = clientX - frameBounds.left;
          const localY = clientY - frameBounds.top;

          const dockBounds = dockZoneEl.getBoundingClientRect();
          if (clientY < dockBounds.top - 15 || clientY > dockBounds.bottom + 15) return;

          const hitIndex = resolveCapacitiveCardHit(localX, localY, state.cardRects, 15);
          if (hitIndex !== -1) {
            if (eventObj && eventObj.cancelable) {
              eventObj.preventDefault();
            }
            handleCardSelection(hitIndex);
          }
        }

        dockZoneEl.addEventListener(
          'touchstart',
          function (e) {
            if (e.changedTouches && e.changedTouches.length > 0) {
              const t = e.changedTouches[0];
              onDockPointerTrigger(t.clientX, t.clientY, e);
            }
          },
          { passive: false }
        );

        dockZoneEl.addEventListener('mousedown', function (e) {
          if (e.button !== 0) return;
          onDockPointerTrigger(e.clientX, e.clientY, e);
        });

        // Utility & Overlay Button Handlers
        btnInitOptics.addEventListener('click', function () {
          startNewRun();
        });

        btnRebootOptics.addEventListener('click', function () {
          startNewRun();
        });

        btnGameoverTitle.addEventListener('click', function () {
          setGameState('title');
          loadWave(1);
        });

        btnPause.addEventListener('click', function (e) {
          e.currentTarget.blur();
          if (state.mode === 'playing') {
            setGameState('paused');
          } else if (state.mode === 'paused') {
            setGameState('playing');
          }
        });

        btnResume.addEventListener('click', function () {
          if (state.mode === 'paused') {
            setGameState('playing');
          }
        });

        btnPauseRestart.addEventListener('click', function () {
          startNewRun();
        });

        btnPauseTitle.addEventListener('click', function () {
          setGameState('title');
          loadWave(1);
        });

        btnRestartQuick.addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewRun();
        });

        btnMute.addEventListener('click', function (e) {
          e.currentTarget.blur();
          sound.muted = !sound.muted;
          iconSoundOn.style.display = sound.muted ? 'none' : 'block';
          iconSoundOff.style.display = sound.muted ? 'block' : 'none';
        });

        // Keyboard shortcuts: Enter/Space to Start, 1-6 for Dock Cards, P/Escape for Pause, M for Mute, R for Restart
        window.addEventListener('keydown', function (e) {
          if (e.repeat) return;
          const key = e.key;

          if (state.mode === 'title' || state.mode === 'gameover') {
            if (key === 'Enter' || key === ' ') {
              e.preventDefault();
              startNewRun();
              return;
            }
          }

          if (key === 'Escape' || key === 'p' || key === 'P') {
            if (state.mode === 'playing') {
              e.preventDefault();
              setGameState('paused');
            } else if (state.mode === 'paused') {
              e.preventDefault();
              setGameState('playing');
            }
            return;
          }

          if (key === 'm' || key === 'M') {
            sound.muted = !sound.muted;
            iconSoundOn.style.display = sound.muted ? 'none' : 'block';
            iconSoundOff.style.display = sound.muted ? 'block' : 'none';
            return;
          }

          if (key === 'r' || key === 'R') {
            if (state.mode === 'playing' || state.mode === 'paused') {
              e.preventDefault();
              startNewRun();
              return;
            }
          }

          if (state.mode === 'playing' && state.transitionType === 'none') {
            const num = parseInt(key, 10);
            if (num >= 1 && num <= 6 && state.setup && num <= state.setup.cards.length) {
              e.preventDefault();
              handleCardSelection(num - 1);
            }
          }
        });

        // Resize handling
        window.addEventListener('resize', function () {
          measureLayout();
        });

        // ============================================================================
        // 7. SIMULATION STEP (CLAMPED DT, 5-TIER MOTION PATTERNS, TIMER)
        // ============================================================================
        function updateSimulation(dt) {
          if (Boolean(window.ToenowTutorials?.isActive?.('shadow-match')) && Boolean(window.ToenowTutorials?.isComplete?.('shadow-match'))) return;
          // Keep ambient silhouette motion alive on the Title screen background
          if (state.mode === 'title') {
            state.waveElapsed += dt;
            stepDrifters(dt);
            return;
          }

          if (state.mode !== 'playing') return;

          if (state.feedbackBannerTimer > 0) {
            state.feedbackBannerTimer = Math.max(0, state.feedbackBannerTimer - dt);
          }

          // Handle match / fault transition freeze window
          if (state.transitionType !== 'none') {
            state.transitionTimer -= dt;
            if (state.transitionType === 'correct') {
              // Smoothly separate silhouettes toward un-occluded confirmation slots during 0.25s freeze
              const lerpAlpha = Math.min(1, dt * 16);
              state.drifters.forEach(function (d) {
                d.x += (d.sepX - d.x) * lerpAlpha;
                d.y += (d.sepY - d.y) * lerpAlpha;
                d.rotation *= 0.72;
                d.scale += (0.85 - d.scale) * lerpAlpha;
              });
            }

            if (state.transitionTimer <= 0) {
              const wasCorrect = state.transitionType === 'correct';
              if (state.timeRemaining <= 0) {
                triggerGameOver();
              } else {
                // Only advance wave & level progression when the player passes the current stage!
                loadWave(wasCorrect ? state.wave + 1 : state.wave);
              }
            }
            return;
          }

          // Global 60.0s countdown clock
          if (!Boolean(window.ToenowTutorials?.isActive?.('shadow-match'))) state.timeRemaining = Math.max(0, state.timeRemaining - dt);
          state.waveElapsed += dt;

          const currentWholeSec = Math.ceil(state.timeRemaining);
          if (currentWholeSec < state.lastTickSecond && currentWholeSec > 0) {
            state.lastTickSecond = currentWholeSec;
            if (currentWholeSec <= 15) {
              sound.playTimerTick(currentWholeSec <= 10);
            }
          }

          // Level 5 strobe shutter click audio cue every 1.20s
          if (state.setup && state.setup.spec.level === 5) {
            const cycleIdx = Math.floor(state.waveElapsed / 1.2);
            const cyclePhase = state.waveElapsed % 1.2;
            if (cyclePhase >= 0.9 && state.lastShutterCycle !== cycleIdx) {
              state.lastShutterCycle = cycleIdx;
              sound.playShutterClick();
            }
          }

          stepDrifters(dt);
          syncHUD();

          if (state.timeRemaining <= 0) {
            triggerGameOver();
          }
        }

        function stepDrifters(dt) {
          if (!state.setup) return;
          const spec = state.setup.spec;
          const cW = state.chamberRect.width;
          const cH = state.chamberRect.height;
          const cx = cW * 0.5;
          const cy = cH * 0.5;
          const t = state.waveElapsed;

          state.drifters.forEach(function (d, idx) {
            const margin = d.baseRadius * 0.92;
            d.rotation += d.spin * dt;

            if (spec.motionPattern === 'linear_bounce') {
              // Level 1: Upright steady drift with soft center attraction + wall bounce
              d.x += d.vx * dt;
              d.y += d.vy * dt;
              d.scale = 1.0;
              if (d.x < margin) {
                d.x = margin;
                d.vx = Math.abs(d.vx);
              } else if (d.x > cW - margin) {
                d.x = cW - margin;
                d.vx = -Math.abs(d.vx);
              }
              if (d.y < margin) {
                d.y = margin;
                d.vy = Math.abs(d.vy);
              } else if (d.y > cH - margin) {
                d.y = cH - margin;
                d.vy = -Math.abs(d.vy);
              }
            } else if (spec.motionPattern === 'center_cross') {
              // Level 2: Periodic center intersection harmonic paths
              const rx = Math.max(36, cW * 0.32);
              const ry = Math.max(30, cH * 0.28);
              const omega = spec.speedPxPerSec / 65;
              d.x = cx + Math.cos(t * omega + d.phase) * rx;
              d.y = cy + Math.sin(t * omega * 1.5 + d.phase) * ry;
              d.scale = 1.0;
            } else if (spec.motionPattern === 'scale_breathing') {
              // Level 3: Sinusoidal Scale Breathing (0.75x - 1.25x) + sweeping orbits
              d.x += d.vx * dt;
              d.y += d.vy * dt;
              d.scale = 1.0 + 0.25 * Math.sin(t * 2.8 + d.phase);
              if (d.x < margin) {
                d.x = margin;
                d.vx = Math.abs(d.vx);
              } else if (d.x > cW - margin) {
                d.x = cW - margin;
                d.vx = -Math.abs(d.vx);
              }
              if (d.y < margin) {
                d.y = margin;
                d.vy = Math.abs(d.vy);
              } else if (d.y > cH - margin) {
                d.y = cH - margin;
                d.vy = -Math.abs(d.vy);
              }
            } else if (spec.motionPattern === 'orbital_vortex') {
              // Level 4: Orbital Vortex keeping shapes 60%-80% overlapped near center with brief apogee separations
              const apogeePulse = 0.22 + 0.78 * Math.pow(Math.sin(t * 1.35), 4);
              const maxR = Math.min(cW, cH) * 0.31;
              const r = maxR * apogeePulse;
              const angle = t * 1.45 * (idx % 2 === 0 ? 1 : -1) + d.phase;
              d.x = cx + Math.cos(angle) * r;
              d.y = cy + Math.sin(angle) * r * 0.82;
              d.scale = 0.96 + 0.1 * Math.cos(t * 2.2 + d.phase);
            } else if (spec.motionPattern === 'lissajous_strobe') {
              // Level 5: High-speed Lissajous figure-8 orbits
              const rx = Math.max(42, cW * 0.34);
              const ry = Math.max(34, cH * 0.31);
              const omega = 1.65;
              d.x = cx + Math.sin(t * omega * d.freqX + d.phase) * rx;
              d.y = cy + Math.sin(t * omega * d.freqY + d.phase * 1.3) * ry;
              d.scale = 0.95 + 0.12 * Math.sin(t * 3.1 + d.phase);
            }
          });
        }

        // ============================================================================
        // 8. CANVAS RENDERER (TRUE UNIFIED SHADOW OCCLUSION + DOCK SCHEMATICS)
        // ============================================================================

// ============================================================================
        // 9. MAIN ANIMATION LOOP & DETERMINISTIC TEST API
        // ============================================================================
        let lastFrameTime = performance.now();
        let headlessAccumulator = 0;

        function frameLoop(now) {
          const rawDt = Math.max(0, (now - lastFrameTime) / 1000);
          lastFrameTime = now;
          const clampedDt = Math.min(rawDt, 0.05);

          if (IS_HEADLESS) {
            headlessAccumulator += clampedDt;
            if (headlessAccumulator >= 0.06) {
              updateSimulation(headlessAccumulator);
              renderFrame();
              headlessAccumulator = 0;
            }
          } else {
            updateSimulation(clampedDt);
            renderFrame();
          }

          requestAnimationFrame(frameLoop);
        }

        // Expose clean programmatic hook for automated verification
        window.__ECLIPSE_DRIFT__ = {
          getState: function () {
            return {
              mode: state.mode,
              score: state.score,
              combo: state.combo,
              peakCombo: state.peakCombo,
              timeRemaining: state.timeRemaining,
              wave: state.wave,
              level: state.setup ? state.setup.spec.level : 1,
              correctCardIndex: state.setup ? state.setup.correctCardIndex : 0,
              targetShapes: state.setup ? state.setup.targetShapes : [],
              phantomShape: state.setup ? state.setup.phantomShape : null
            };
          },
          selectCard: function (idx) {
            handleCardSelection(idx);
          },
          loadWave: function (waveNum) {
            loadWave(waveNum);
          },
          setTimeRemaining: function (sec) {
            state.timeRemaining = sec;
            if (sec <= 0) triggerGameOver();
            else syncHUD();
          }
        };

        window.ToenowTutorials?.register?.('shadow-match', {
          start() { startNewRun(1, true); },
          stop() { state.isPractice = false; state.transitionType = 'none'; setGameState('title'); },
          getGuide() {
            const button = state.cardButtons[state.setup?.correctCardIndex], bounds = button?.getBoundingClientRect();
            return { prompt: 'Look at the shadows above. Tap the card with the same shapes.', rect: bounds ? { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height } : null, waiting: !bounds, done: Boolean(window.ToenowTutorials?.isComplete?.('shadow-match')) };
          }
        });

        // Initialize layout, Wave 1 preview, and handle ?autostart=1
        measureLayout();
        loadWave(1);
        const params = new URLSearchParams(window.location.search);
        if (typeof ToenowLevels !== 'undefined' && ToenowLevels.setupPracticeMode) {
          ToenowLevels.setupPracticeMode({
            container: '#title-overlay .unified-title-card',
            onStartGame: (startWave, isPractice) => {
              startNewRun(startWave, isPractice);
            }
          });
        }
        if (params.get('autostart') === '1') {
          startNewRun();
        } else {
          setGameState('title');
        }
        renderFrame();
        requestAnimationFrame(frameLoop);
      })();
    