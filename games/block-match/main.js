ToenowScreens.mount("block-match");

      (function () {
        'use strict';
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { drawRoundedRect, drawSingleTopNotch, drawBackground, drawBoards, updateAndDrawParticles, drawScreenOverlays } = window.ToenowGameModules['block-match'].renderer.createRenderer({
          get ctx() { return ctx; },
          get dustParticles() { return dustParticles; },
          get layout() { return layout; },
          get board() { return board; },
          get electricArcTimer() { return electricArcTimer; },
          get MAX_SHARDS() { return MAX_SHARDS; },
          get shards() { return shards; },
          get MAX_POPUPS() { return MAX_POPUPS; },
          get popups() { return popups; },
          get redGlitchTimer() { return redGlitchTimer; },
          get MISTAKE_FREEZE_SECONDS() { return MISTAKE_FREEZE_SECONDS; }
        });

var isHeadless = Boolean(navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent || ''));
        var STORAGE_KEY_SCORE = 'chip_defrag_high_score_v5';
        var STORAGE_KEY_SHARDS = 'chip_defrag_total_shards_v5';

        function loadStorage(key) {
          try {
            var raw = window.localStorage.getItem(key);
            var val = parseInt(raw || '0', 10);
            return isFinite(val) && val > 0 ? val : 0;
          } catch (e) {
            return 0;
          }
        }

        function saveStorage(key, val) {
          try {
            window.localStorage.setItem(key, String(Math.floor(val)));
          } catch (e) {}
        }

        // --- Native Web Audio API Procedural Synthesizer ---
        const audio = window.ToenowGameModules['block-match'].audio.createAudio();
        const { ensureAudio, playSiliconTap, playWaveSurge, playBriefingAlert, playGlitchBuzz } = audio;
        // --- Staged Phase Transition Briefings (Before Waves 16, 31, and 46) ---
        const { PHASE_BRIEFINGS, getPhaseForWave, getGridSizeForWave, getWaveConfig, rotateMatrixCW, applySpatialTransform, generateProceduralTemplate, generateWaveBoard } = window.ToenowGameModules['block-match'].rules;

        // --- Constants & Session State ---
        var INITIAL_TIME_SECONDS = 100.0;
        var MAX_TIME_CAP_SECONDS = 100.0;
        var CORRECT_TAP_TIME_BONUS = 0.8;
        var WAVE_CLEAR_TIME_BONUS = 2.0;
        var PERFECT_WAVE_CLEAR_TIME_BONUS = 4.0;
        var WRONG_TAP_TIME_PENALTY = 1.5;
        var MISTAKE_FREEZE_SECONDS = 0.35;

        var state = {
          wave: 1,
          score: 0,
          highScore: loadStorage(STORAGE_KEY_SCORE),
          totalShards: loadStorage(STORAGE_KEY_SHARDS),
          combo: 1,
          peakCombo: 1,
          mistakesInWave: 0,
          wavesCleared: 0,
          timeLeft: INITIAL_TIME_SECONDS,
          elapsedTime: 0,
          freezeTimer: 0,
          successRemaining: 0,
          pendingBriefing: null
        };

        // Initialize Toenow Game SDK
        var toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'block-match', category: 'puzzle', gameTitle: 'Block Match' })
          : null;

        var board = generateWaveBoard(1, 0);
        var gameMode = 'title'; // 'title' | 'playing' | 'briefing' | 'gameover'

        // --- Particle Shards Ring Buffer ---
        var MAX_SHARDS = 300;
        var shards = [];
        var shardCursor = 0;
        for (var s = 0; s < MAX_SHARDS; s++) {
          shards.push({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 5,
            angle: 0,
            vAngle: 0,
            alpha: 1,
            decay: 1.7,
            color: '#00f0ff'
          });
        }

        function spawnShards(cx, cy, count, color) {
          for (var i = 0; i < count; i++) {
            var p = shards[shardCursor];
            shardCursor = (shardCursor + 1) % MAX_SHARDS;
            var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            var speed = 85 + Math.random() * 240;
            p.active = true;
            p.x = cx + (Math.random() - 0.5) * 14;
            p.y = cy + (Math.random() - 0.5) * 14;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed - 20;
            p.size = 3.5 + Math.random() * 5.5;
            p.angle = Math.random() * Math.PI * 2;
            p.vAngle = (Math.random() - 0.5) * 12;
            p.alpha = 1.0;
            p.decay = 1.65 + Math.random() * 0.85;
            p.color = color || '#00f0ff';
          }
        }

        // Floating Text Popups
        var MAX_POPUPS = 24;
        var popups = [];
        var popupCursor = 0;
        for (var f = 0; f < MAX_POPUPS; f++) {
          popups.push({ active: false, x: 0, y: 0, vy: -52, text: '', color: '#00f0ff', alpha: 0 });
        }

        function spawnPopup(x, y, text, color) {
          var p = popups[popupCursor];
          popupCursor = (popupCursor + 1) % MAX_POPUPS;
          p.active = true;
          p.x = x;
          p.y = y;
          p.vy = -54;
          p.text = text;
          p.color = color || '#00f0ff';
          p.alpha = 1.0;
        }

        // Subtle Matrix Background Dust
        var DUST_COUNT = 38;
        var dustParticles = [];
        for (var d = 0; d < DUST_COUNT; d++) {
          dustParticles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: 1 + Math.random() * 2,
            vy: -10 - Math.random() * 18,
            alpha: 0.14 + Math.random() * 0.3
          });
        }

        // --- DOM Elements ---
        var canvas = document.getElementById('game-canvas');
        var ctx = canvas.getContext('2d');

        var elHudScore = document.getElementById('hud-score');
        var elHudWave = document.getElementById('hud-wave');
        var elHudGrid = document.getElementById('hud-grid');
        var elHudCombo = document.getElementById('hud-combo');
        var elHudTimer = document.getElementById('hud-timer');

        var elTitleScreen = document.getElementById('title-screen');
        var elPauseScreen = document.getElementById('pause-screen');
        var elPauseScore = document.getElementById('pause-score');
        var elPauseWave = document.getElementById('pause-wave');
        var elPauseTimer = document.getElementById('pause-timer');
        var elBtnResume = document.getElementById('btn-resume');
        var elBtnRestartPause = document.getElementById('btn-restart-pause');
        var elBtnTitlePause = document.getElementById('btn-title-pause');

        var elBriefingScreen = document.getElementById('briefing-screen');
        var elBriefingTitle = document.getElementById('briefing-title');
        var elBriefingBadge = document.getElementById('briefing-badge');
        var elBriefingVisual = document.getElementById('briefing-visual');
        var elBriefingDesc = document.getElementById('briefing-desc');
        var elBtnEngagePhase = document.getElementById('btn-engage-phase');

        var elGameOverScreen = document.getElementById('gameover-screen');
          ToenowScreens.updateTitle('block-match', { bestScore: state.highScore, bestWave: parseInt(localStorage.getItem('block_match_best_wave') || '1', 10) });
        // Dynamic Visual Feedback Timers
        var shakeTrauma = 0;
        var electricArcTimer = 0;
        var redGlitchTimer = 0;

        // Layout Metrics
        var layout = {
          vw: window.innerWidth,
          vh: window.innerHeight,
          leftBox: { x: 0, y: 0, size: 300, cellSize: 80, pad: 16, gap: 8 },
          rightBox: { x: 0, y: 0, size: 220, cellSize: 60, pad: 14, gap: 6 }
        };

        function updateLayout() {
          var dpr = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2);
          var vw = window.innerWidth;
          var vh = window.innerHeight;
          canvas.width = Math.floor(vw * dpr);
          canvas.height = Math.floor(vh * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          layout.vw = vw;
          layout.vh = vh;

          var topSafe = Math.max(78, document.getElementById('hud-layer').getBoundingClientRect().bottom + 12);
          var bottomSafe = 24;
          var availH = Math.max(240, vh - topSafe - bottomSafe);
          var availW = Math.min(vw * 0.95, vw >= 768 ? 820 : 480);

          var n = board ? board.config.gridSize : 3;

          if (vw >= 768 && availH >= 360) {
            var gap = Math.min(48, Math.max(24, Math.floor(availW * 0.05)));
            // Both boards have equal size: leftSize === rightSize
            var maxBoardSize = Math.min(availH * 0.82, (availW - gap) * 0.48, 420);
            var boardSize = Math.max(180, Math.floor(maxBoardSize));
            var totalW = boardSize * 2 + gap;
            var startX = Math.floor((vw - totalW) * 0.5);
            var centerY = topSafe + Math.floor(availH * 0.52);

            layout.leftBox.size = boardSize;
            layout.leftBox.x = startX;
            layout.leftBox.y = Math.floor(centerY - boardSize * 0.5);

            layout.rightBox.size = boardSize;
            layout.rightBox.x = startX + boardSize + gap;
            layout.rightBox.y = Math.floor(centerY - boardSize * 0.5);
          } else {
            var gapY = 32;
            // Both boards have equal size in mobile/portrait vertical stack
            var maxMobileSize = Math.min(Math.floor((availH - gapY) * 0.48), Math.floor(availW * 0.94), 330);
            var boardMobileSize = Math.max(140, maxMobileSize);
            var totalH = boardMobileSize * 2 + gapY;
            var startY = topSafe + Math.max(12, Math.floor((availH - totalH) * 0.5));

            layout.rightBox.size = boardMobileSize;
            layout.rightBox.x = Math.floor((vw - boardMobileSize) * 0.5);
            layout.rightBox.y = startY;

            layout.leftBox.size = boardMobileSize;
            layout.leftBox.x = Math.floor((vw - boardMobileSize) * 0.5);
            layout.leftBox.y = startY + boardMobileSize + gapY;
          }

          var pad = Math.max(8, Math.floor(layout.leftBox.size * 0.045));
          var cellGap = Math.max(3, Math.floor(layout.leftBox.size * (n >= 6 ? 0.014 : 0.02)));

          layout.leftBox.pad = pad;
          layout.leftBox.gap = cellGap;
          layout.leftBox.cellSize = (layout.leftBox.size - pad * 2 - cellGap * (n - 1)) / n;

          layout.rightBox.pad = pad;
          layout.rightBox.gap = cellGap;
          layout.rightBox.cellSize = (layout.rightBox.size - pad * 2 - cellGap * (n - 1)) / n;
        }

        function setGameMode(next) {
          gameMode = next;
          document.getElementById('match-success').hidden = next !== 'playing' || !state.successRemaining;
          document.body.dataset.state = next;
          elTitleScreen.hidden = next !== 'title';
          if (next === 'title') {
          ToenowScreens.updateTitle('block-match', { bestScore: state.highScore, bestWave: parseInt(localStorage.getItem('block_match_best_wave') || '1', 10) });
          }
          if (elPauseScreen) {
            elPauseScreen.hidden = next !== 'paused';
            if (next === 'paused') {
              if (elPauseScore) elPauseScore.textContent = String(Math.round(state.score));
              if (elPauseWave) elPauseWave.textContent = state.wave + '/60';
              if (elPauseTimer) elPauseTimer.textContent = state.timeLeft.toFixed(1) + 's';
            }
          }
          elBriefingScreen.hidden = next !== 'briefing';
          elGameOverScreen.hidden = next !== 'gameover';
        }

        function togglePause() {
          if (gameMode === 'playing') {
            setGameMode('paused');
          } else if (gameMode === 'paused') {
            setGameMode('playing');
          }
        }

        function syncHud() {
          var n = board ? board.config.gridSize : 3;
          elHudScore.textContent = String(Math.round(state.score));
          elHudWave.textContent = state.wave + '/60';
          if(window.ToenowAnimals) window.ToenowAnimals.setWave('block-match', state.wave);
          elHudGrid.textContent = n + 'x' + n;
          elHudCombo.textContent = 'x' + state.combo;
          elHudTimer.textContent = window.ToenowTutorials?.isActive('block-match') ? '∞' : state.timeLeft.toFixed(1) + 's';
          elHudTimer.className = state.timeLeft <= 12 ? 'hud-value danger' : 'hud-value';
        }

        function openPhaseBriefing(spec) {
          state.pendingBriefing = spec;
          elBriefingTitle.textContent = spec.title;
          elBriefingBadge.textContent = spec.badge;
          elBriefingVisual.setAttribute('data-anim', spec.animType);
          elBriefingDesc.textContent = spec.briefing;
          elBtnEngagePhase.textContent = spec.buttonText;
          playBriefingAlert();
          setGameMode('briefing');
        }

        function resumeFromPhaseBriefing() {
          if (gameMode !== 'briefing') return;
          state.pendingBriefing = null;
          board.waveStartTime = state.elapsedTime;
          setGameMode('playing');
          syncHud();
          canvas.focus();
        }

        function startNewGame(startWave = 1, isPractice = false) {
          if (toenowSdk && !window.ToenowTutorials?.isActive('block-match')) toenowSdk.startRun({ wave: startWave, isPractice });
          state.isPractice = Boolean(isPractice);
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          ensureAudio();
          state.wave = 1;
          state.score = 0;
          state.highScore = loadStorage(STORAGE_KEY_SCORE);
          state.totalShards = loadStorage(STORAGE_KEY_SHARDS);
          state.combo = 1;
          state.peakCombo = 1;
          state.mistakesInWave = 0;
          state.wavesCleared = 0;
          state.timeLeft = INITIAL_TIME_SECONDS;
          state.elapsedTime = 0;
          state.freezeTimer = 0;
          state.pendingBriefing = null;

          shakeTrauma = 0;
          state.successRemaining = 0;
          electricArcTimer = 0;
          redGlitchTimer = 0;

          board = generateWaveBoard(1, 0);
          updateLayout();
          syncHud();
          setGameMode('playing');
          canvas.focus();
        }

        function triggerGameOver() {
          if (window.ToenowTutorials?.isActive('block-match')) return;
          state.timeLeft = 0;
          if (!state.isPractice && state.score > state.highScore) {
            state.highScore = state.score;
            saveStorage(STORAGE_KEY_SCORE, state.highScore);
          }
          saveStorage(STORAGE_KEY_SHARDS, state.totalShards);
          syncHud();
          playGlitchBuzz();

          const prevBW = parseInt(localStorage.getItem('block_match_best_wave') || '1', 10) || 1;
          if (!state.isPractice && state.wavesCleared > prevBW) localStorage.setItem('block_match_best_wave', String(state.wavesCleared));
          ToenowScreens.updateGameOver('block-match', { score: state.score, bestScore: state.highScore, wave: state.wave, combo: state.peakCombo });
                    setGameMode('gameover');

          // Toenow Game SDK Unified Lifecycle & Hub Contract
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: Math.round(state.score || 0),
              wave: state.wavesCleared || 1,
              isPractice: Boolean(state.isPractice),
              streak: state.peakCombo
            });
          } else {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                  type: 'GAME_OVER',
                  gameId: 'block-match',
                  category: 'puzzle',
                  score: Math.round(state.score || 0),
                  wave: state.wavesCleared || 1,
                  isPractice: Boolean(state.isPractice)
                }, '*');
              }
            } catch (_) {}
          }
        }

        function getCellCenter(box, r, c) {
          return {
            x: box.x + box.pad + c * (box.cellSize + box.gap) + box.cellSize * 0.5,
            y: box.y + box.pad + r * (box.cellSize + box.gap) + box.cellSize * 0.5
          };
        }

        function advanceAfterSuccess() {
          document.getElementById('match-success').hidden = true;
          state.wave++;
          board = generateWaveBoard(state.wave, state.elapsedTime);
          updateLayout();
          syncHud();
          var nextBriefing = PHASE_BRIEFINGS[state.wave];
          if (nextBriefing) openPhaseBriefing(nextBriefing);
        }

        function hitTestLeftGridPoint(x, y) {
          var b = layout.leftBox;
          var n = board.config.gridSize;
          if (x < b.x || x > b.x + b.size || y < b.y || y > b.y + b.size) return null;

          for (var r = 0; r < n; r++) {
            for (var c = 0; c < n; c++) {
              var cx = b.x + b.pad + c * (b.cellSize + b.gap);
              var cy = b.y + b.pad + r * (b.cellSize + b.gap);
              if (x >= cx && x <= cx + b.cellSize && y >= cy && y <= cy + b.cellSize) {
                return { r: r, c: c };
              }
            }
          }
          return null;
        }

        /**
         * Deliberate Single-Cell Tap Handler (No drag/brush slicing).
         */
        function handleSingleCellTap(r, c) {
          if (gameMode !== 'playing' || state.freezeTimer > 0 || state.successRemaining > 0) return;
          if (window.ToenowTutorials?.isActive('block-match') && window.ToenowTutorials?.isComplete('block-match')) return;
          var n = board.config.gridSize;
          if (r < 0 || r >= n || c < 0 || c >= n) return;

          var cell = board.activeGrid[r][c];
          if (cell === 0) return;

          var center = getCellCenter(layout.leftBox, r, c);

          if(window.ToenowAnimals) window.ToenowAnimals.feedback('block-match', cell === 2);
          if (cell === 2) {
            // Shatter excess block!
            board.activeGrid[r][c] = 0;
            board.remainingExcess--;
            board.blocksShatteredInWave++;

            if (window.ToenowTutorials?.isActive('block-match')) {
              spawnShards(center.x, center.y, 18, '#00f0ff');
              playSiliconTap(board.blocksShatteredInWave);
              if (board.remainingExcess <= 0) window.ToenowTutorials.complete('block-match');
              syncHud();
              return;
            }

            var blockScore = Math.round(50 * state.combo);
            state.score += blockScore;
            state.totalShards++;
            state.combo = Math.min(25, state.combo + 1);
            state.peakCombo = Math.max(state.peakCombo, state.combo);
            state.timeLeft = Math.min(MAX_TIME_CAP_SECONDS, state.timeLeft + CORRECT_TAP_TIME_BONUS);

            spawnShards(center.x, center.y, 18, '#00f0ff');
            spawnPopup(center.x, center.y - 10, '+' + blockScore + ' (+' + CORRECT_TAP_TIME_BONUS.toFixed(1) + 's)', '#00f0ff');
            shakeTrauma = Math.min(1.0, shakeTrauma + 0.26);
            playSiliconTap(board.blocksShatteredInWave);

            if (board.remainingExcess <= 0) {
              var isPerfect = state.mistakesInWave === 0;
              var waveBonus = Math.round(150 * state.combo);
              var clearTimeBonus = isPerfect ? PERFECT_WAVE_CLEAR_TIME_BONUS : WAVE_CLEAR_TIME_BONUS;

              state.score += waveBonus;
              state.timeLeft = Math.min(MAX_TIME_CAP_SECONDS, state.timeLeft + clearTimeBonus);
              state.wavesCleared++;
              if (!state.isPractice && !window.ToenowTutorials?.isActive('block-match')) toenowSdk?.reportProgress({ wave: state.wave + 1 });
              state.mistakesInWave = 0;

              electricArcTimer = 0.48;
              shakeTrauma = Math.min(1.0, shakeTrauma + 0.45);
              playWaveSurge();

              state.successRemaining = 1.2;
              document.getElementById('match-success').hidden = false;
            }

            if (state.score > state.highScore) {
              state.highScore = state.score;
              saveStorage(STORAGE_KEY_SCORE, state.highScore);
            }
            saveStorage(STORAGE_KEY_SHARDS, state.totalShards);
            syncHud();
            return;
          }

          // Tapping an essential core block triggers a 0.35s glitch penalty and resets combo
          if (window.ToenowTutorials?.isActive('block-match')) {
            redGlitchTimer = MISTAKE_FREEZE_SECONDS;
            playGlitchBuzz();
            return;
          }
          state.combo = 1;
          state.mistakesInWave++;
          state.timeLeft = Math.max(0, state.timeLeft - WRONG_TAP_TIME_PENALTY);
          state.freezeTimer = MISTAKE_FREEZE_SECONDS;
          redGlitchTimer = MISTAKE_FREEZE_SECONDS;
          shakeTrauma = Math.min(1.0, shakeTrauma + 0.6);

          spawnShards(center.x, center.y, 12, '#ff3b5c');
          spawnPopup(center.x, center.y - 10, 'CORE BLOCK! -' + WRONG_TAP_TIME_PENALTY.toFixed(1) + 's', '#ff3b5c');
          playGlitchBuzz();
          syncHud();

          if (state.timeLeft <= 0) {
            triggerGameOver();
          }
        }

        // --- Deliberate Single-Cell Tap Input (pointerdown only) ---
        canvas.addEventListener('pointerdown', function (e) {
          if (gameMode !== 'playing') return;
          e.preventDefault();
          var rect = canvas.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          var hit = hitTestLeftGridPoint(x, y);
          if (hit) {
            handleSingleCellTap(hit.r, hit.c);
          }
        });

        document.getElementById('btn-start').addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewGame();
        });
        elBtnEngagePhase.addEventListener('click', function (e) {
          e.currentTarget.blur();
          resumeFromPhaseBriefing();
        });

        document.getElementById('btn-retry').addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewGame();
        });
        document.getElementById('btn-title-gameover').addEventListener('click', function (e) {
          e.currentTarget.blur();
          setGameMode('title');
        });

        var elBtnPauseHud = document.getElementById('btn-pause-hud');
        var elBtnAudioHud = document.getElementById('btn-audio-hud');
        elBtnAudioHud.addEventListener('click', function (e) {
          e.currentTarget.blur();
          const audioEnabled = audio.toggle();
          elBtnAudioHud.dataset.muted = String(!audioEnabled);
          elBtnAudioHud.setAttribute('aria-pressed', String(audioEnabled));
        });
        document.getElementById('btn-restart-hud').addEventListener('click', function (e) {
          e.currentTarget.blur();
          startNewGame(1, state.isPractice);
        });
        if (elBtnPauseHud) {
          elBtnPauseHud.addEventListener('click', function (e) {
            e.currentTarget.blur();
            togglePause();
          });
        }

        if (elBtnResume) {
          elBtnResume.addEventListener('click', function (e) {
            e.currentTarget.blur();
            setGameMode('playing');
          });
        }
        if (elBtnRestartPause) {
          elBtnRestartPause.addEventListener('click', function (e) {
            e.currentTarget.blur();
            startNewGame();
          });
        }
        if (elBtnTitlePause) {
          elBtnTitlePause.addEventListener('click', function (e) {
            e.currentTarget.blur();
            setGameMode('title');
          });
        }

        window.addEventListener('keydown', function (e) {
          if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            e.preventDefault();
            togglePause();
            return;
          }
          if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
            if (gameMode === 'paused') {
              e.preventDefault();
              setGameMode('playing');
              return;
            }
            if (gameMode === 'briefing') {
              e.preventDefault();
              resumeFromPhaseBriefing();
            } else if (gameMode === 'title' || gameMode === 'gameover') {
              e.preventDefault();
              startNewGame();
            }
          }
        });

        window.addEventListener('resize', updateLayout);

        // --- Rendering Helpers ---

/**
         * Renders the single 12 o'clock hardware alignment notch on each board:
         * - Workboard (Left): permanently labeled "N"
         * - Blueprint (Right): labeled "N", "FLIP-H", "FLIP-V", or "FLIP-HV"
         */

// --- Main 60 FPS Loop (Timer 100% frozen when gameMode === 'briefing') ---
        var lastTime = performance.now();

        function frame(now) {
          var rawDt = (now - lastTime) / 1000;
          lastTime = now;
          var dt = Math.min(Math.max(rawDt, 0), 0.05);

          if (shakeTrauma > 0) shakeTrauma = Math.max(0, shakeTrauma - 2.8 * dt);
          if (electricArcTimer > 0) electricArcTimer = Math.max(0, electricArcTimer - dt);
          if (redGlitchTimer > 0) redGlitchTimer = Math.max(0, redGlitchTimer - dt);

          // Session timer ticks ONLY during active 'playing' state (100% frozen during 'briefing')
          if (window.ToenowTutorials?.isActive('block-match')) {
            // Keep rendering the real board and particles without session progression.
          } else if (gameMode === 'playing' && state.successRemaining > 0) {
            state.successRemaining = Math.max(0, state.successRemaining - dt);
            if (state.successRemaining === 0) advanceAfterSuccess();
          } else if (gameMode === 'playing') {
            state.elapsedTime += dt;
            if (state.freezeTimer > 0) {
              state.freezeTimer = Math.max(0, state.freezeTimer - dt);
            }

            state.timeLeft = Math.max(0, state.timeLeft - dt);
            syncHud();

            if (state.timeLeft <= 0) {
              triggerGameOver();
            }
          }

          ctx.save();
          if (shakeTrauma > 0.01) {
            var mag = shakeTrauma * shakeTrauma * 10;
            var ox = (Math.random() * 2 - 1) * mag;
            var oy = (Math.random() * 2 - 1) * mag;
            ctx.translate(ox, oy);
          }

          drawBackground(layout.vw, layout.vh);
          if (gameMode !== 'title') {
            drawBoards();
          }
          updateAndDrawParticles(dt);
          drawScreenOverlays(layout.vw, layout.vh);

          ctx.restore();
          window.requestAnimationFrame(frame);
        }

        // Inspection / Automated Testing Interface
        window.__CHIP_DEFRAG__ = {
          getState: function () {
            return {
              mode: gameMode,
              wave: state.wave,
              score: state.score,
              highScore: state.highScore,
              totalShards: state.totalShards,
              combo: state.combo,
              timeLeft: state.timeLeft,
              elapsedTime: state.elapsedTime,
              freezeTimer: state.freezeTimer,
              pendingBriefing: state.pendingBriefing,
              board: board,
              layout: layout
            };
          },
          clickCell: function (r, c) {
            handleSingleCellTap(r, c);
          },
          engagePhaseBriefing: function () {
            resumeFromPhaseBriefing();
          },
          jumpToWave: function (targetWave) {
            state.wave = targetWave;
            board = generateWaveBoard(state.wave, state.elapsedTime);
            updateLayout();
            syncHud();
          },
          forceGameOver: function () {
            triggerGameOver();
          }
        };

        updateLayout();
        syncHud();

        window.ToenowTutorials?.register('block-match', {
          start() {
            startNewGame(1, true);
            board.config = getWaveConfig(1);
            board.config.gridSize = 3;
            board.carvingTargetGrid = [[0,1,0],[1,1,1],[0,1,0]];
            board.blueprintGrid = board.carvingTargetGrid.map(row => row.slice());
            board.activeGrid = [[2,1,0],[1,1,1],[0,1,0]];
            board.remainingExcess = board.config.excessCount = 1;
            board.blocksShatteredInWave = 0;
            document.getElementById('match-success').hidden = true;
            updateLayout();
            syncHud();
          },
          stop() {
            state.isPractice = false;
            state.score = state.successRemaining = state.freezeTimer = 0;
            document.getElementById('match-success').hidden = true;
            setGameMode('title');
          },
          getGuide() {
            if (board.remainingExcess === 0) return { done: true };
            const point = getCellCenter(layout.leftBox, 0, 0);
            const rect = canvas.getBoundingClientRect();
            const size = layout.leftBox.cellSize;
            return { prompt: 'Tap away the extra tile', rect: {
              x: rect.left + point.x - size / 2, y: rect.top + point.y - size / 2, width: size, height: size
            }};
          }
        });

        var params = new URLSearchParams(window.location.search);
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
          setGameMode('title');
        }

        window.requestAnimationFrame(frame);
      })();
    