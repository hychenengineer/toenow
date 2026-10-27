ToenowScreens.mount("number-pop");

(function () {
        'use strict';
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { drawPolygon, drawCoreValueLabel, drawHarvestBasket, renderArena } = window.ToenowGameModules['number-pop'].renderer.createRenderer({
          get parseFractionLabel() { return parseFractionLabel; },
          get canvas() { return canvas; },
          get viewportW() { return viewportW; },
          get viewportH() { return viewportH; },
          get resizeCanvas() { return resizeCanvas; },
          get ctx() { return ctx; },
          get game() { return game; },
        });

const IS_HEADLESS = Boolean(
          navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent)
        );

        // LocalStorage Keys
        const STORAGE_HIGH_SCORE = 'qcc_high_score_v1';
        const STORAGE_BEST_WAVE = 'qcc_best_wave_v1';
        const STORAGE_SHARDS = 'qcc_quantum_shards_v1';
        const STORAGE_THEME = 'qcc_selected_theme_v1';
        const STORAGE_BEST_SURVIVAL = 'qcc_best_survival_v1';

        function loadHighScore() {
          try {
            return parseInt(localStorage.getItem(STORAGE_HIGH_SCORE) || '0', 10) || 0;
          } catch (_) {
            return 0;
          }
        }

        function loadBestWave() {
          try {
            return parseInt(localStorage.getItem(STORAGE_BEST_WAVE) || '1', 10) || 1;
          } catch (_) {
            return 1;
          }
        }

        function loadBestSurvival() {
          try {
            return parseFloat(localStorage.getItem(STORAGE_BEST_SURVIVAL) || '0') || 0;
          } catch (_) {
            return 0;
          }
        }

        function saveBestSurvival(duration) {
          try {
            const prev = loadBestSurvival();
            if (duration > prev) {
              localStorage.setItem(STORAGE_BEST_SURVIVAL, String(duration));
            }
          } catch (_) {}
        }

        function loadTotalShards() {
          try {
            return parseInt(localStorage.getItem(STORAGE_SHARDS) || '0', 10) || 0;
          } catch (_) {
            return 0;
          }
        }

        function saveTotalShards(shards) {
          try {
            localStorage.setItem(STORAGE_SHARDS, String(shards));
          } catch (_) {}
        }

        function loadSelectedTheme() {
          try {
            return localStorage.getItem(STORAGE_THEME) || 'cyan';
          } catch (_) {
            return 'cyan';
          }
        }

        function saveSelectedTheme(themeId) {
          try {
            localStorage.setItem(STORAGE_THEME, themeId);
          } catch (_) {}
        }

        function saveRecords(score, wave) {
          try {
            const prevScore = loadHighScore();
            const prevWave = loadBestWave();
            if (score > prevScore) {
              localStorage.setItem(STORAGE_HIGH_SCORE, String(score));
            }
            if (wave > prevWave) {
              localStorage.setItem(STORAGE_BEST_WAVE, String(wave));
            }
          } catch (_) {}
        }

        // ============================================================================
        // PROCEDURAL WEB AUDIO SYNTHESIZER
        // ============================================================================
        const { SoundSynth } = window.ToenowGameModules['number-pop'].audio;

        const sound = new SoundSynth();

        // ============================================================================
        // PERKS & THEMES CONFIGURATION
        // ============================================================================
        const ALL_PERKS = [
          {
            id: 'chrono_siphon',
            name: 'Chrono Siphon',
            desc: 'Correct clicks add +0.2s to timer.',
            icon: '⏳',
          },
          {
            id: 'quantum_radar',
            name: 'Quantum Radar',
            desc: 'Next target pulses with a scanner ring for 0.4s upon each pop.',
            icon: '📡',
          },
          {
            id: 'fever_overflow',
            name: 'Fever Overflow',
            desc: 'Max combo cap increases from 5x to 10x; drift speed +20%.',
            icon: '⚡',
          },
          {
            id: 'stabilizer_field',
            name: 'Stabilizer Field',
            desc: 'Reduces core floating speed by 30%.',
            icon: '🛡️',
          },
          {
            id: 'chain_reactor',
            name: 'Chain Reactor',
            desc: 'Every 3rd consecutive correct pop emits a shockwave (+150 score).',
            icon: '💥',
          },
        ];

        const THEMES = [
          {
            id: 'cyan',
            name: 'Default Cyan',
            cost: 0,
            primaryGlow: '#22d3ee',
            secondaryGlow: '#e879f9',
            accentBg: '#0891b2',
            desc: 'Classic neon cyan reactor matrix with plasma harmonics.',
          },
          {
            id: 'amber',
            name: 'Amber Overdrive',
            cost: 60,
            primaryGlow: '#fbbf24',
            secondaryGlow: '#f43f5e',
            accentBg: '#d97706',
            desc: 'Solar flare golden hues with heavy sub-bass resonance.',
          },
          {
            id: 'emerald',
            name: 'Emerald Singularity',
            cost: 150,
            primaryGlow: '#34d399',
            secondaryGlow: '#38bdf8',
            accentBg: '#059669',
            desc: 'Radioactive quantum green with high-frequency chime timbre.',
          },
        ];

        // ============================================================================
        // STRUCTURED PROGRESSIVE WAVE SEQUENCE (STRICT NUMERICAL CURRICULUM)
        // ============================================================================
        const { shouldTriggerPerkDraft, getWaveType, isBreatherWave, getTimerDecayMultiplier, getMaxBankableTime, getTimerStageInfo, formatSurvivalTime, getCoreCountForWave, getWaveTierName, parseFractionLabel, hasValueCollision, pickUniqueFromList, generateWaveItem, formatNearMissMessage } = window.ToenowGameModules['number-pop'].rules;

        // ============================================================================
        // GAME STATE & DOM REFERENCES
        // ============================================================================
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        const hudScore = document.getElementById('hud-score');
        const hudCombo = document.getElementById('hud-combo');
        const hudComboLabel = document.getElementById('hud-combo-label');
        const hudComboPips = Array.from(document.querySelectorAll('#hud-combo-pips .combo-pip'));
        const hudCenterCluster = document.getElementById('hud-center-cluster');
        const hudWave = document.getElementById('hud-wave');
        const hudWaveTier = document.getElementById('hud-wave-tier');
        const hudTimer = document.getElementById('hud-timer');
        const hudTimerBar = document.getElementById('hud-timer-bar');
        const hudRemaining = document.getElementById('hud-remaining');

        const hudStageLabel = document.getElementById('hud-stage-label');
        const hudSurvivalTimer = document.getElementById('hud-survival-timer');
        const hudCapLabel = document.getElementById('hud-cap-label');
        const singularityWarningBanner = document.getElementById('singularity-warning-banner');

        const titleScreen = document.getElementById('title-screen');
        const pauseScreen = document.getElementById('pause-screen');
        const gameoverScreen = document.getElementById('gameover-screen');

        // Initialize Toenow Game SDK
        const toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'number-pop', category: 'math', gameTitle: 'Number Pop' })
          : null;

const pauseScore = document.getElementById('pause-score');
        const pauseWave = document.getElementById('pause-wave');
        const pauseTime = document.getElementById('pause-time');

        const hudTopContainer = document.getElementById('hud-top-container');
        const TOUCH_HITBOX_EXPANSION = 20;

        let viewportW = Math.max(1, window.innerWidth || 360);
        let viewportH = Math.max(1, window.innerHeight || 640);

        function getHudBottom() {
          if (hudTopContainer) {
            const rect = hudTopContainer.getBoundingClientRect();
            if (rect && rect.bottom > 0) {
              return Math.min(viewportH * 0.45, Math.ceil(rect.bottom - canvas.getBoundingClientRect().top + 20));
            }
          }
          return (viewportW < 450 ? 128 : 142) + 20;
        }

        function getArenaBounds() {
          const hudBottom = getHudBottom();
          // Wide screens use the middle half; smaller screens keep at least 640px of play space when available.
          const sideInset = Math.max(15, Math.min(viewportW * 0.25, (viewportW - 640) * 0.5));
          return {
            left: sideInset,
            right: Math.max(60, viewportW - sideInset),
            top: hudBottom,
            bottom: Math.max(hudBottom + 80, viewportH - 15),
          };
        }

        function computeCoreScaleFactor(vw, count) {
          const isNarrowMobile = vw < 450;
          const isMobile = vw < 640;
          if (isNarrowMobile) return count >= 7 ? 0.72 : 0.78;
          if (isMobile) return count >= 8 ? 0.76 : 0.84;
          return count >= 8 ? 0.88 : 1.0;
        }

        function clampCoreToSafeArena(c, bounds) {
          const minX = bounds.left + c.radius;
          const maxX = Math.max(minX, bounds.right - c.radius);
          const minY = bounds.top + c.radius;
          const maxY = Math.max(minY, viewportH - c.radius - 15);

          if (c.x < minX) {
            c.x = minX;
            c.vx = Math.abs(c.vx);
          } else if (c.x > maxX) {
            c.x = maxX;
            c.vx = -Math.abs(c.vx);
          }

          if (c.y < minY) {
            c.y = minY;
            c.vy = Math.abs(c.vy);
          } else if (c.y > maxY) {
            c.y = maxY;
            c.vy = -Math.abs(c.vy);
          }
        }

        const BASE_GAME_TIME = 60.0;

        const game = {
          state: 'title', // 'title' | 'playing' | 'perk' | 'paused' | 'gameover'
          wave: 1,
          score: 0,
          combo: 0,
          maxCombo: 0,
          timeLeft: BASE_GAME_TIME,
          feverTimeLeft: 0,
          waveMistakes: 0,
          totalMistakes: 0,
          poppedInWave: 0,
          shardsEarnedThisRun: 0,
          empAvailable: true,
          perks: {},
          offeredPerks: [],
          currentTheme: loadSelectedTheme(),
          totalShards: loadTotalShards(),
          cores: [],
          harvests: [],
          shakeTrauma: 0,
          glitchTimer: 0,
          hitstopTimer: 0,
          waveTransitionTimer: 0,
          radarPulseTimer: 0,
          hoveredCoreId: null,
          pointerX: viewportW * 0.5,
          pointerY: viewportH * 0.5,
          timeElapsed: 0,
          runDuration: 0,
          highScoreBeforeRun: loadHighScore(),
          bestWaveBeforeRun: loadBestWave(),
        };

        function resizeCanvas() {
          const rect = canvas.getBoundingClientRect();
          const prevW = viewportW;
          const prevH = viewportH;
          const prevBounds = getArenaBounds();

          const measuredW = rect && rect.width > 0 ? Math.round(rect.width) : window.innerWidth;
          const measuredH = rect && rect.height > 0 ? Math.round(rect.height) : window.innerHeight;
          viewportW = Math.max(1, measuredW || 360);
          viewportH = Math.max(1, measuredH || 640);

          const dpr = IS_HEADLESS ? 1 : Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.max(1, Math.round(viewportW * dpr));
          canvas.height = Math.max(1, Math.round(viewportH * dpr));
          ctx.setTransform(canvas.width / viewportW, 0, 0, canvas.height / viewportH, 0, 0);

          if (Array.isArray(game.cores) && game.cores.length > 0) {
            const bounds = getArenaBounds();
            const scaleFactor = computeCoreScaleFactor(viewportW, game.cores.length);
            const sizeChanged = Math.abs(viewportW - prevW) > 4 || Math.abs(viewportH - prevH) > 4;

            for (let i = 0; i < game.cores.length; i++) {
              const c = game.cores[i];
              const baseRadius = 46 + ((c.id - 1) % 2) * 6;
              c.radius = Math.round(baseRadius * scaleFactor);

              if (sizeChanged && prevW > 0 && prevH > 0) {
                const prevMinX = prevBounds.left + c.radius;
                const prevMaxX = Math.max(prevMinX + 1, prevBounds.right - c.radius);
                const prevMinY = prevBounds.top + c.radius;
                const prevMaxY = Math.max(prevMinY + 1, prevH - c.radius - 15);

                const normX = Math.max(0, Math.min(1, (c.x - prevMinX) / (prevMaxX - prevMinX)));
                const normY = Math.max(0, Math.min(1, (c.y - prevMinY) / (prevMaxY - prevMinY)));

                const newMinX = bounds.left + c.radius;
                const newMaxX = Math.max(newMinX, bounds.right - c.radius);
                const newMinY = bounds.top + c.radius;
                const newMaxY = Math.max(newMinY, viewportH - c.radius - 15);

                c.x = newMinX + normX * (newMaxX - newMinX);
                c.y = newMinY + normY * (newMaxY - newMinY);
              }
              if (!c.popped) clampCoreToSafeArena(c, bounds);
            }
          }
        }

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 50));
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', resizeCanvas);
          window.visualViewport.addEventListener('scroll', resizeCanvas);
        }
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(() => resizeCanvas());
          ro.observe(canvas);
        }
        resizeCanvas();

        function applyTheme(themeId) {
          game.currentTheme = themeId || 'cyan';
          document.body.classList.remove('theme-cyan', 'theme-amber', 'theme-emerald');
        }

        applyTheme(game.currentTheme);

        function spawnWave(waveNum) {
          if (window.ToenowAnimals) window.ToenowAnimals.setWave('number-pop', waveNum);
          game.wave = waveNum;
          game.waveMistakes = 0;
          game.poppedInWave = 0;
          game.radarPulseTimer = game.perks.quantum_radar ? 0.4 : 0;

          // Update HUD text/banners first so getHudBottom() measures exact active HUD height
          syncHud();
          resizeCanvas();

          const count = getCoreCountForWave(waveNum, game.runDuration);
          const usedValues = new Set();
          const rawItems = [];

          while (rawItems.length < count) {
            const item = generateWaveItem(waveNum, rawItems.length, usedValues, game.runDuration);
            usedValues.add(item.value);
            rawItems.push(item);
          }

          const sortedByValue = [...rawItems].sort((a, b) => a.value - b.value);
          const scaleFactor = computeCoreScaleFactor(viewportW, count);

          const bounds = getArenaBounds();

          const themeHues = game.currentTheme === 'amber'
            ? [38, 48, 22, 12, 54, 30, 42, 18, 5]
            : game.currentTheme === 'emerald'
            ? [155, 170, 140, 180, 130, 162, 148, 175, 120]
            : [188, 285, 325, 160, 210, 42, 265, 195, 345];

          const newCores = [];

          sortedByValue.forEach((item, rankIndex) => {
            const radius = Math.round((46 + (rankIndex % 2) * 6) * scaleFactor);

            const minX = bounds.left + radius;
            const maxX = Math.max(minX, bounds.right - radius);
            const minY = bounds.top + radius + 6;
            const maxY = Math.max(minY, viewportH - radius - 18);

            // Keep initial spawn centered within a comfortable visual field on wide desktop monitors
            const halfSpanX = Math.min((maxX - minX) * 0.5, 380);
            const centerX = (minX + maxX) * 0.5;
            const spawnMinX = Math.max(minX, centerX - halfSpanX);
            const spawnMaxX = Math.min(maxX, centerX + halfSpanX);

            const halfSpanY = Math.min((maxY - minY) * 0.5, 310);
            const centerY = (minY + maxY) * 0.5;
            const spawnMinY = Math.max(minY, centerY - halfSpanY);
            const spawnMaxY = Math.min(maxY, centerY + halfSpanY);

            let x = centerX;
            let y = centerY;
            for (let attempt = 0; attempt < 110; attempt++) {
              const cx = spawnMinX + Math.random() * Math.max(0, spawnMaxX - spawnMinX);
              const cy = spawnMinY + Math.random() * Math.max(0, spawnMaxY - spawnMinY);
              let overlaps = false;
              for (let k = 0; k < newCores.length; k++) {
                const other = newCores[k];
                const dx = cx - other.x;
                const dy = cy - other.y;
                const minDist = radius + other.radius + 18;
                if (dx * dx + dy * dy < minDist * minDist) {
                  overlaps = true;
                  break;
                }
              }
              if (!overlaps) {
                x = cx;
                y = cy;
                break;
              }
            }

            x = Math.min(maxX, Math.max(minX, x));
            y = Math.min(maxY, Math.max(minY, y));

            const angle = Math.random() * Math.PI * 2;
            let speed = 46 + Math.min(waveNum * 3.8, 50);
            // Deep Late-Game Board Entropy: +35% core speed at 8+ minutes
            if (game.runDuration >= 480) {
              speed *= 1.35;
            }
            if (game.perks.stabilizer_field) {
              speed *= 0.7; // -30% speed
            }
            if (game.perks.fever_overflow) {
              speed *= 1.2; // +20% speed
            }

            newCores.push({
              id: rankIndex + 1,
              value: item.value,
              label: item.label,
              fractionGauge: item.fractionGauge,
              radius,
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              popped: false,
              hue: themeHues[rankIndex % themeHues.length],
              sides: rankIndex % 2 === 0 ? 6 : 8,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: (rankIndex % 2 === 0 ? 1 : -1) * (0.45 + Math.random() * 0.4),
              pulsePhase: Math.random() * Math.PI * 2,
              errorFlash: 0,
              freezeTimer: 0,
              spawnScale: 0.65,
            });
          });

          game.cores = newCores;
          syncHud();
        }

        function syncBodyAttributes() {
          document.body.dataset.state = game.state;
          document.body.dataset.wave = String(game.wave);
          document.body.dataset.score = String(game.score);
          document.body.dataset.combo = String(game.combo);
          document.body.dataset.fever = String(game.feverTimeLeft > 0);
          document.body.dataset.emp = String(game.empAvailable);
          document.body.dataset.duration = String(Math.floor(game.runDuration || 0));
          document.body.dataset.critical = String((game.runDuration || 0) >= 480 && game.state === 'playing');
        }

        function syncHud() {
          hudScore.textContent = game.score.toLocaleString();
          hudCombo.textContent = game.combo + 'x';

          const isHighCombo = game.combo >= 5;
          const effectiveCombo = Math.min(game.combo, 5);
          const comboMult = (1 + effectiveCombo * 0.15) * (isHighCombo ? 1.5 : 1);
          const multStr = comboMult.toFixed(1).replace(/\.0$/, '') + 'X';
          hudComboLabel.textContent = 'COMBO · ' + multStr;
          hudComboLabel.style.color = isHighCombo ? 'var(--secondary-glow)' : '';

          hudComboPips.forEach((pip, i) => {
            pip.classList.toggle('active', game.combo > i);
            pip.classList.toggle('fever', isHighCombo);
          });

          const runDur = game.runDuration || 0;
          const stageInfo = getTimerStageInfo(runDur);
          hudStageLabel.textContent = stageInfo.name;
          hudStageLabel.style.color = stageInfo.isCritical
            ? 'var(--crimson-glow)'
            : stageInfo.stage === 3
            ? 'var(--amber-glow)'
            : 'var(--primary-glow)';
          hudCapLabel.textContent = 'CAP: ' + stageInfo.maxBank.toFixed(0) + 's';
          hudSurvivalTimer.textContent = 'RUN: ' + formatSurvivalTime(runDur);

          singularityWarningBanner.classList.toggle('active', stageInfo.isCritical && game.state === 'playing');

          hudWave.textContent = 'WAVE ' + game.wave;
          hudWaveTier.textContent = getWaveTierName(game.wave, runDur);
          hudCenterCluster.classList.toggle('breather-mode', isBreatherWave(game.wave));

          const clampedTime = Math.max(0, game.timeLeft);
          hudTimer.textContent = window.ToenowTutorials?.isActive('number-pop') ? '∞' : clampedTime.toFixed(1) + 's';
          hudTimer.classList.toggle('warning', clampedTime <= 20 && clampedTime > 10);
          hudTimer.classList.toggle('critical', clampedTime <= 10 || stageInfo.isCritical);

          const maxCap = stageInfo.maxBank;
          const fillRatio = Math.max(0, Math.min(1, clampedTime / maxCap));
          hudTimerBar.style.transform = 'scaleX(' + fillRatio.toFixed(4) + ')';
          if (stageInfo.isCritical || clampedTime <= 10) {
            hudTimerBar.style.backgroundColor = 'var(--crimson-glow)';
          } else if (clampedTime <= 20) {
            hudTimerBar.style.backgroundColor = 'var(--amber-glow)';
          } else if (isHighCombo) {
            hudTimerBar.style.backgroundColor = 'var(--secondary-glow)';
          } else {
            hudTimerBar.style.backgroundColor = 'var(--primary-glow)';
          }

          const rem = game.cores.filter((c) => !c.popped).length;
          hudRemaining.textContent = rem + (rem === 1 ? ' BASKET LEFT' : ' BASKETS LEFT');

          syncBodyAttributes();
        }

        function setScreenState(nextState) {
          game.state = nextState;
          titleScreen.classList.toggle('visible', nextState === 'title');
          pauseScreen.classList.toggle('visible', nextState === 'paused');
          gameoverScreen.classList.toggle('visible', nextState === 'gameover');

          if (nextState === 'title') {
          ToenowScreens.updateTitle('number-pop', { bestScore: loadHighScore(), bestWave: loadBestWave() });

          }
          syncBodyAttributes();
        }

        function startGame(startWave = 1, isPractice = false) {
          if (toenowSdk && !window.ToenowTutorials?.isActive('number-pop')) toenowSdk.startRun({ wave: startWave, isPractice });
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          sound.ensureContext();
          sound.startDrone();

          game.highScoreBeforeRun = loadHighScore();
          game.bestWaveBeforeRun = loadBestWave();
          game.score = 0;
          game.combo = 0;
          game.maxCombo = 0;
          game.timeLeft = BASE_GAME_TIME;
          game.runDuration = 0;
          game.feverTimeLeft = 0;
          game.waveMistakes = 0;
          game.totalMistakes = 0;
          game.poppedInWave = 0;
          game.shardsEarnedThisRun = 0;
          game.harvests = [];
          game.empAvailable = false;
          game.perks = {};
          game.shakeTrauma = 0;
          game.glitchTimer = 0;
          game.hitstopTimer = 0;
          game.waveTransitionTimer = 0;
          game.radarPulseTimer = 0;
          game.isPractice = Boolean(isPractice);

          setScreenState('playing');
          syncHud();
          spawnWave(startWave);
        }

        function reportScoreToHub(score, wave, runDuration, isPractice = false) {
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: Math.round(Number(score) || 0),
              wave: Number(wave) || 1,
              duration: Math.round((Number(runDuration) || 0) * 1000),
              isPractice: Boolean(isPractice || game.isPractice)
            });
            return;
          }
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage(
                {
                  type: 'GAME_OVER',
                  gameId: 'number-pop',
                  category: 'math',
                  score: Math.round(Number(score) || 0),
                  wave: Number(wave) || 1,
                  runDuration: Number(runDuration) || 0,
                  duration: Math.round((Number(runDuration) || 0) * 1000),
                  isPractice: Boolean(isPractice || game.isPractice),
                },
                '*'
              );
            }
          } catch (_) {}
        }

        function triggerGameOver() {
          if (window.ToenowTutorials?.isActive('number-pop')) return;
          if (game.state === 'gameover') return;
          game.timeLeft = 0;
          sound.stopDrone();
          sound.playGameOver();

          const prevBest = game.highScoreBeforeRun;

          if (!game.isPractice) {
            saveRecords(game.score, game.wave);
            saveBestSurvival(game.runDuration);
          }

          game.totalShards += game.shardsEarnedThisRun;
          saveTotalShards(game.totalShards);

          const newBestScore = Math.max(prevBest, game.score);

          ToenowScreens.updateGameOver('number-pop', { score: game.score, bestScore: newBestScore, wave: game.wave, combo: game.maxCombo });
                    setScreenState('gameover');
          syncHud();

          // Toenow Hub Cross-Origin Runtime Contract
          reportScoreToHub(game.score, game.wave, game.runDuration);
        }

        function togglePause() {
          if (game.state === 'playing') {
            sound.stopDrone();
            pauseScore.textContent = game.score.toLocaleString();
            pauseWave.textContent = String(game.wave);
            pauseTime.textContent = game.timeLeft.toFixed(1) + 's';
            setScreenState('paused');
          } else if (game.state === 'paused') {
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
              document.activeElement.blur();
            }
            sound.startDrone();
            setScreenState('playing');
          }
        }

        function openPerkSelection() {}
        function selectPerk() {}
        function openThemesTerminal() {}
        function closeThemesTerminal() {}
        function renderThemesList() {}
        function activateEmpPurge() {}

        // ============================================================================
        // CORE SELECTION & HIT HANDLING
        // ============================================================================
        function getLowestUnpoppedCore() {
          let lowest = null;
          for (let i = 0; i < game.cores.length; i++) {
            const c = game.cores[i];
            if (!c.popped) {
              if (!lowest || c.value < lowest.value) {
                lowest = c;
              }
            }
          }
          return lowest;
        }

        function collectCore(core) {
          core.popped = true;
          // The short visual continues across wave changes; scoring is immediate.
          if (!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
            game.harvests.push({ ...core, elapsed: 0 });
          }
        }

        function handleCoreSelection(core) {
          if (!core || core.popped || game.state !== 'playing') return;
          if (window.ToenowTutorials?.isComplete('number-pop') && window.ToenowTutorials?.isActive('number-pop')) return;

          const lowestCore = getLowestUnpoppedCore();
          if (!lowestCore) return;

          if (Math.abs(core.value - lowestCore.value) < 1e-6) {
            if (window.ToenowTutorials?.isActive('number-pop')) {
              collectCore(core);
              game.poppedInWave++;
              sound.playPop(game.poppedInWave, false, 'cyan');

              if (!getLowestUnpoppedCore()) window.ToenowTutorials.complete('number-pop');
              syncHud();
              return;
            }
            // CORRECT ASCENDING CLICK (Musical chime + combo bonus, NO screen shake!)
            // Always allow popping the target lowest core immediately even if it had freezeTimer from an earlier misclick
            core.freezeTimer = 0;
            core.errorFlash = 0;
            collectCore(core);
            game.combo += 1;
            game.shardsEarnedThisRun += 1;

            if (game.combo > game.maxCombo) {
              game.maxCombo = game.combo;
            }

            const isHighCombo = game.combo >= 5;
            if (isHighCombo) {
              game.feverTimeLeft = 5.0;
            }

            const effectiveCombo = Math.min(game.combo, 5);
            const highComboBonus = isHighCombo ? 1.5 : 1.0;
            const comboFactor = 1 + effectiveCombo * 0.15;

            let pointsAdded = Math.round((100 + game.wave * 25) * comboFactor * highComboBonus);
            game.score += pointsAdded;

            sound.playPop(game.poppedInWave, false, 'cyan');
            game.poppedInWave += 1;

            // Explicitly NO screen shake and NO hitstop on correct clicks
            game.shakeTrauma = 0;
            game.hitstopTimer = 0;

            // Check Wave Clear
            const remaining = game.cores.filter((c) => !c.popped).length;
            if (remaining === 0) {
              if (!game.isPractice && !window.ToenowTutorials?.isActive('number-pop')) toenowSdk?.reportProgress({ wave: game.wave + 1 });
              const flawless = game.waveMistakes === 0;
              sound.playWaveClear(flawless);
              if (flawless) {
                const maxBank = getMaxBankableTime(game.runDuration);
                const addedBonus = 2.5;
                if (game.timeLeft + addedBonus > maxBank) {
                  const surplus = (game.timeLeft + addedBonus) - maxBank;
                  game.timeLeft = maxBank;
                  const surplusPts = Math.round(surplus * 250);
                  game.score += surplusPts;

                } else {
                  game.timeLeft += addedBonus;

                }
              }

              game.waveTransitionTimer = 0.1;
            }

            syncHud();
          } else {
            // If core is currently frozen from a recent misclick, ignore extra mistake spam
            if (window.ToenowTutorials?.isActive('number-pop')) {
              core.errorFlash = 0.4;
              core.freezeTimer = 0.35;
              sound.playMistakeGlitch();
              return;
            }
            if (core.freezeTimer > 0) return;

            if (window.ToenowAnimals) window.ToenowAnimals.feedback('number-pop', false);
            // MISTAKE: Slight screen shake + mistake sound
            game.combo = 0;
            game.feverTimeLeft = 0;
            game.waveMistakes += 1;
            game.totalMistakes += 1;

            core.errorFlash = 0.4;
            core.freezeTimer = 0.35;

            game.glitchTimer = 0.22;
            game.shakeTrauma = 0.35;
            sound.playMistakeGlitch();

            syncHud();
          }
        }

        function getPointerCanvasPos(clientX, clientY) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect && rect.width > 0 ? viewportW / rect.width : 1;
          const scaleY = rect && rect.height > 0 ? viewportH / rect.height : 1;
          return {
            x: (clientX - (rect ? rect.left : 0)) * scaleX,
            y: (clientY - (rect ? rect.top : 0)) * scaleY,
          };
        }

        function findHitCoreAt(px, py) {
          const lowestCore = getLowestUnpoppedCore();
          let bestCore = null;
          let minDistSq = Infinity;
          let lowestCoreMatched = false;

          for (let i = 0; i < game.cores.length; i++) {
            const c = game.cores[i];
            if (c.popped) continue;

            // Check both current position and 45ms lag-compensated position for moving targets
            const dxNow = px - c.x;
            const dyNow = py - c.y;
            const dSqNow = dxNow * dxNow + dyNow * dyNow;

            const prevX = c.x - c.vx * 0.045;
            const prevY = c.y - c.vy * 0.045;
            const dxPrev = px - prevX;
            const dyPrev = py - prevY;
            const dSqPrev = dxPrev * dxPrev + dyPrev * dyPrev;

            const dSq = Math.min(dSqNow, dSqPrev);
            const hitR = c.radius + TOUCH_HITBOX_EXPANSION;

            if (dSq <= hitR * hitR) {
              if (lowestCore && c.id === lowestCore.id) {
                lowestCoreMatched = true;
              }
              if (dSq < minDistSq) {
                minDistSq = dSq;
                bestCore = c;
              }
            }
          }

          // If the tap landed within the target lowest core's hitbox and isn't deep inside another core's center, favor the target core
          if (
            lowestCoreMatched &&
            lowestCore &&
            bestCore &&
            bestCore.id !== lowestCore.id &&
            minDistSq > bestCore.radius * bestCore.radius * 0.45
          ) {
            return lowestCore;
          }

          return bestCore;
        }

        // Pointer Down (with exact CSS-to-canvas coordinate scaling + 20px touch hitbox expansion)
        canvas.addEventListener('pointerdown', (e) => {
          if (game.state === 'playing' && game.waveTransitionTimer > 0) {
            // Complete transition immediately if player taps eagerly
            game.waveTransitionTimer = 0;
            spawnWave(game.wave + 1);
          }
          if (game.state !== 'playing') return;
          e.preventDefault();

          const pt = getPointerCanvasPos(e.clientX, e.clientY);
          game.pointerX = pt.x;
          game.pointerY = pt.y;

          const hitCore = findHitCoreAt(pt.x, pt.y);
          if (hitCore) {
            handleCoreSelection(hitCore);
          }
        });

        canvas.addEventListener('pointermove', (e) => {
          const pt = getPointerCanvasPos(e.clientX, e.clientY);
          game.pointerX = pt.x;
          game.pointerY = pt.y;

          const hoveredCore = findHitCoreAt(pt.x, pt.y);
          game.hoveredCoreId = hoveredCore ? hoveredCore.id : null;
          canvas.style.cursor = hoveredCore ? 'pointer' : 'crosshair';
        });

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
          if (e.repeat) return;

          if (e.code === 'Space' || e.code === 'Enter') {
            if (game.state === 'title' || game.state === 'gameover') {
              e.preventDefault();
              startGame();
              return;
            } else if (game.state === 'paused' && e.code === 'Space') {
              e.preventDefault();
              togglePause();
              return;
            }
          }

          if (e.code === 'KeyP' || e.code === 'Escape') {
            if (game.state === 'playing' || game.state === 'paused') {
              e.preventDefault();
              togglePause();
              return;
            }
          }

          if (e.code === 'KeyR') {
            if (game.state === 'playing' || game.state === 'paused' || game.state === 'gameover') {
              e.preventDefault();
              startGame();
              return;
            }
          }

          if (e.code === 'KeyM') {
            e.preventDefault();
            toggleMute();
            return;
          }
        });

        // Zero-latency UI Button Handler helper (responds immediately on pointerdown + click fallback)
        function bindFastButton(id, handler) {
          const el = document.getElementById(id);
          if (!el) return;
          let lastTriggered = -Infinity;
          const invoke = (e) => {
            const now = performance.now();
            if (now - lastTriggered < 250) return;
            lastTriggered = now;
            if (e.type === 'pointerdown') {
              e.preventDefault();
              e.stopPropagation();
            }
            if (typeof el.blur === 'function') el.blur();
            handler(e);
          };
          el.addEventListener('pointerdown', invoke);
          el.addEventListener('click', invoke);
        }

        function handleQuitOrRestartRun(nextAction) {
          if (!game.isPractice && game.score > 0) {
            saveRecords(game.score, game.wave);
            saveBestSurvival(game.runDuration);
            reportScoreToHub(game.score, game.wave, game.runDuration);
          }
          nextAction();
        }

        bindFastButton('btn-start', () => startGame());
        bindFastButton('btn-retry', () => startGame());
        bindFastButton('btn-resume', () => togglePause());
        bindFastButton('btn-pause-restart', () => handleQuitOrRestartRun(() => startGame()));
        bindFastButton('btn-pause-title', () => handleQuitOrRestartRun(() => setScreenState('title')));
        bindFastButton('btn-go-title', () => setScreenState('title'));
        bindFastButton('btn-pause', () => togglePause());
        bindFastButton('btn-restart-hud', () => handleQuitOrRestartRun(() => startGame()));

        // Also report score if browser tab / iframe unloads during an active run
        window.addEventListener('pagehide', () => {
          if (!game.isPractice && game.score > 0) {
            saveRecords(game.score, game.wave);
            saveBestSurvival(game.runDuration);
            reportScoreToHub(game.score, game.wave, game.runDuration);
          }
        });

        function toggleMute() {
          sound.muted = !sound.muted;
          document.getElementById('svg-unmuted').style.display = sound.muted ? 'none' : 'block';
          document.getElementById('svg-muted').style.display = sound.muted ? 'block' : 'none';
        }

        bindFastButton('btn-mute', () => toggleMute());

        // ============================================================================
        // SIMULATION UPDATE & RENDER LOOP
        // ============================================================================
        function updatePhysics(dt, simDt, visualDt = dt) {
          for (const basket of game.harvests) basket.elapsed += visualDt;
          game.harvests = game.harvests.filter(basket => basket.elapsed < 0.2);
          const bounds = getArenaBounds();
          const active = [];
          for (let i = 0; i < game.cores.length; i++) {
            const c = game.cores[i];
            if (!c.popped) active.push(c);
          }

          // Update cores position, border bounce, and rotation
          for (let i = 0; i < active.length; i++) {
            const c = active[i];

            // If core is frozen from misclick, decrement freeze timer and apply subtle vibration
            if (c.freezeTimer > 0) {
              c.freezeTimer = Math.max(0, c.freezeTimer - dt);
              c.errorFlash = Math.max(0, c.errorFlash - dt);
              c.rotation += (Math.random() - 0.5) * 0.1;
              clampCoreToSafeArena(c, bounds);
              continue; // Don't advance coordinates while frozen
            }

            c.x += c.vx * simDt;
            c.y += c.vy * simDt;
            c.rotation += c.rotSpeed * simDt;
            c.pulsePhase += dt * 3.8;
            if (c.spawnScale < 1) {
              c.spawnScale = Math.min(1, c.spawnScale + dt * 5.5);
            }
            if (c.errorFlash > 0) {
              c.errorFlash = Math.max(0, c.errorFlash - dt);
            }

            clampCoreToSafeArena(c, bounds);

          }

          // Soft-body mutual repulsion
          for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
              const a = active[i];
              const b = active[j];
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const distSq = dx * dx + dy * dy;
              const minDist = a.radius + b.radius + 14;

              if (distSq < minDist * minDist && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;

                const push = overlap * 0.5;
                a.x -= nx * push;
                a.y -= ny * push;
                b.x += nx * push;
                b.y += ny * push;

                const rvx = b.vx - a.vx;
                const rvy = b.vy - a.vy;
                const velAlongNormal = rvx * nx + rvy * ny;
                if (velAlongNormal < 0) {
                  const impulse = -velAlongNormal * 0.92;
                  a.vx -= impulse * nx;
                  a.vy -= impulse * ny;
                  b.vx += impulse * nx;
                  b.vy += impulse * ny;
                }
              }
            }
          }

          // Re-clamp strictly inside safe arena boundaries after mutual repulsion so no core ever enters HUD
          for (let i = 0; i < active.length; i++) {
            clampCoreToSafeArena(active[i], bounds);
          }
        }

// Main Animation Loop
        let lastFrameTime = performance.now();
        let lastHeadlessRender = 0;

        function frameLoop(now) {
          requestAnimationFrame(frameLoop);

          if (IS_HEADLESS && now - lastHeadlessRender < 48) {
            return;
          }
          lastHeadlessRender = now;

          const rawDt = (now - lastFrameTime) / 1000;
          lastFrameTime = now;
          const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
          game.timeElapsed += dt;

          if (game.shakeTrauma > 0) {
            game.shakeTrauma = Math.max(0, game.shakeTrauma - dt * 2.2);
          }
          if (game.glitchTimer > 0) {
            game.glitchTimer = Math.max(0, game.glitchTimer - dt);
          }
          if (game.radarPulseTimer > 0) {
            game.radarPulseTimer = Math.max(0, game.radarPulseTimer - dt);
          }

          let simDt = dt;
          if (game.hitstopTimer > 0) {
            game.hitstopTimer = Math.max(0, game.hitstopTimer - dt);
            simDt = 0;
          }

          if (game.state === 'playing') {
            if (game.waveTransitionTimer > 0) {
              game.waveTransitionTimer -= dt;
              if (game.waveTransitionTimer <= 0) {
                spawnWave(game.wave + 1);
              }
            } else if (!window.ToenowTutorials?.isActive('number-pop')) {
              game.runDuration += dt;
              const decayMultiplier = getTimerDecayMultiplier(game.runDuration);
              game.timeLeft = Math.max(0, game.timeLeft - dt * decayMultiplier);

              // Shrinking time bank ceiling check & overflow
              const maxBank = getMaxBankableTime(game.runDuration);
              if (game.timeLeft > maxBank) {
                const surplus = game.timeLeft - maxBank;
                game.timeLeft = maxBank;
                game.score += Math.round(surplus * 250);
              }

              if (game.feverTimeLeft > 0) {
                game.feverTimeLeft = Math.max(0, game.feverTimeLeft - dt);
              }
              sound.updateDrone(game.runDuration, game.runDuration >= 480);
              syncHud();

              if (game.timeLeft <= 0) {
                triggerGameOver();
              }
            }
            updatePhysics(dt, simDt, rawDt);
          } else if (game.state === 'title' || game.state === 'perk') {
            updatePhysics(dt, dt * 0.55, rawDt);
          }

          renderArena();
        }

        // Expose inspection & testing methods
        window.__QUANTUM_GAME__ = {
          getState: () => ({
            state: game.state,
            wave: game.wave,
            waveType: getWaveType(game.wave),
            score: game.score,
            combo: game.combo,
            maxCombo: game.maxCombo,
            timeLeft: game.timeLeft,
            runDuration: game.runDuration,
            decayMultiplier: getTimerDecayMultiplier(game.runDuration),
            maxBank: getMaxBankableTime(game.runDuration),
            shakeTrauma: game.shakeTrauma,
            hudBottom: getHudBottom(),
            arenaBounds: getArenaBounds(),
            touchHitboxExpansion: TOUCH_HITBOX_EXPANSION,
            cores: game.cores.map((c) => ({
              id: c.id,
              value: c.value,
              label: c.label,
              parsedFraction: parseFractionLabel(c.label),
              fractionGauge: c.fractionGauge,
              radius: c.radius,
              hitRadius: c.radius + TOUCH_HITBOX_EXPANSION,
              x: c.x,
              y: c.y,
              popped: c.popped,
              freezeTimer: c.freezeTimer,
            })),
          }),
          setRunDuration: (seconds) => {
            game.runDuration = seconds;
            syncHud();
          },
          getRunDuration: () => game.runDuration,
          popLowestCore: () => {
            const lowest = getLowestUnpoppedCore();
            if (lowest) handleCoreSelection(lowest);
            return lowest ? lowest.value : null;
          },
          clickHighestCoreForMistake: () => {
            const unpopped = game.cores
              .filter((c) => !c.popped)
              .sort((a, b) => b.value - a.value);
            if (unpopped.length > 1) {
              handleCoreSelection(unpopped[0]);
              return unpopped[0].value;
            }
            return null;
          },
          setWave: (w) => {
            spawnWave(w);
          },
          forceGameOver: () => {
            triggerGameOver();
          },
        };
        window.__TEST_HOOKS__ = window.__QUANTUM_GAME__;

        window.ToenowTutorials?.register('number-pop', {
          start() {
            startGame(1, true);
            game.cores = game.cores.slice(0, 3);
            const bounds = getArenaBounds();
            game.cores.forEach((core, i) => {
              core.value = i + 1;
              core.label = String(i + 1);
              core.fractionGauge = null;
              core.radius = Math.min(42, (bounds.right - bounds.left) / 8);
              core.x = bounds.left + (bounds.right - bounds.left) * (i + 1) / 4;
              core.y = bounds.top + (viewportH - bounds.top) * 0.55;
              core.vx = core.vy = 0;
            });
            syncHud();
          },
          stop() {
            sound.stopDrone();
            game.isPractice = false;
            game.score = game.combo = game.maxCombo = game.shardsEarnedThisRun = 0;
            game.waveTransitionTimer = 0;
            game.cores = [];
            setScreenState('title');
          },
          getGuide() {
            const core = getLowestUnpoppedCore();
            if (!core) return { done: true };
            const rect = canvas.getBoundingClientRect();
            const sx = rect.width / viewportW, sy = rect.height / viewportH;
            return { prompt: 'Tap the baskets from smallest to largest: 1, 2, 3.', rect: {
              x: rect.left + (core.x - core.radius) * sx, y: rect.top + (core.y - core.radius) * sy,
              width: core.radius * 2 * sx, height: core.radius * 2 * sy
            }};
          }
        });

        // Initial Boot
          ToenowScreens.updateTitle('number-pop', { bestScore: loadHighScore(), bestWave: loadBestWave() });

        spawnWave(1);

        const params = new URLSearchParams(window.location.search);
        if (typeof ToenowLevels !== 'undefined' && ToenowLevels.setupPracticeMode) {
          ToenowLevels.setupPracticeMode({
            container: '#title-screen .unified-title-card',
            onStartGame: (startWave, isPractice) => {
              startGame(startWave, isPractice);
            }
          });
        }

        if (params.get('autostart') === '1') {
          startGame();
        } else {
          setScreenState('title');
        }

        requestAnimationFrame(frameLoop);
      })();
