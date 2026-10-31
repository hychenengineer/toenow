ToenowScreens.mount("spot-quick");

(function () {
        "use strict";
        // Getters preserve current dimensions, state and buffers across resize/restart.
        const { renderOffscreenSpecimen, drawObservationArchive, drawAnalyticalBackground, drawObfuscatedMosaic, drawSpotlightViewport, drawApertureRing, drawCandidateButtons } = window.ToenowGameModules['spot-quick'].renderer.createRenderer({
          get specimenCtx() { return specimenCtx; },
          get SPECIMEN_BUFFER_SIZE() { return SPECIMEN_BUFFER_SIZE; },
          get PALETTE() { return PALETTE; },
          get state() { return state; },
          get ctx() { return ctx; },
          get mosaicCanvas() { return mosaicCanvas; },
          get mosaicCtx() { return mosaicCtx; },
          get specimenCanvas() { return specimenCanvas; },
          get MAX_TOTAL_TIME() { return MAX_TOTAL_TIME; }
        });

// ==================================================
        // 1. COLOR PALETTE & CONSTANTS
        // ==================================================
        const PALETTE = {
          bgDeep: "#070a0e",
          bgMid: "#0b0f17",
          hullDark: "#1a2332",
          cyan: "#00f0ff",
          volt: "#ffe600",
          magenta: "#ff0055",
          lime: "#00ff66",
          textPrimary: "#e8f1f8",
          textMuted: "#7a8fa6"
        };

        // ==================================================
        // 2. PROCEDURAL WEB AUDIO SYNTHESIZER (ZERO EXTERNAL FILES)
        // ==================================================
        const audio = window.ToenowGameModules['spot-quick'].audio.createAudio();
        const { ensureAudioContext, playCorrectBlip, playIncorrectBuzz } = audio;
        // ==================================================
        // 3. 28 ICONIC SILHOUETTES ACROSS 7 CATEGORIES
        // ==================================================
        // Categories: LAND, SEA, SKY, BUGS, REPTILE, FLORA, FRUIT
        const { SPECIMEN_POOL } = window.ToenowGameModules['spot-quick'].shapes;

        // ==================================================
        // 4. DOM REFERENCES & OFFSCREEN CANVAS BUFFERS
        // ==================================================
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        const canvasStage = document.getElementById("canvasStage");

        const hudPipedText = document.getElementById("hudPipedText");
        const hudScoreText = document.getElementById("hudScoreText");
        const hudCatText = document.getElementById("hudCatText");
        const hudTierText = document.getElementById("hudTierText");

        const briefingModal = document.getElementById("briefingModal");
        const gameOverModal = document.getElementById("gameOverModal");
        const pauseModal = document.getElementById("pauseModal");
        const pauseScoreVal = document.getElementById("pauseScoreVal");
        const pauseWaveVal = document.getElementById("pauseWaveVal");
        const pauseTimeVal = document.getElementById("pauseTimeVal");
        const btnResumeFocus = document.getElementById("btnResumeFocus");
        const btnRestartFocus = document.getElementById("btnRestartFocus");
        const btnTitleFocus = document.getElementById("btnTitleFocus");
        const btnPauseHud = document.getElementById("btnPauseHud");
        const STORAGE_KEY_SCORE = "fast_focus_high_score_v1";
        const STORAGE_KEY_WAVE = "fast_focus_best_wave_v1";

        function loadBestFocusScore() {
          try {
            return parseInt(localStorage.getItem(STORAGE_KEY_SCORE) || "0", 10) || 0;
          } catch (_) { return 0; }
        }
        function loadBestFocusWave() {
          try {
            return parseInt(localStorage.getItem(STORAGE_KEY_WAVE) || "1", 10) || 1;
          } catch (_) { return 1; }
        }
        function saveBestFocusRecords(score, wave) {
          if (state && state.isPractice) return;
          try {
            const curScore = loadBestFocusScore();
            const curWave = loadBestFocusWave();
            if (score > curScore) localStorage.setItem(STORAGE_KEY_SCORE, String(Math.round(score)));
            if (wave > curWave) localStorage.setItem(STORAGE_KEY_WAVE, String(wave));
          } catch (_) {}
        }

        // Initialize Toenow Game SDK
        const toenowSdk = typeof ToenowGameSDK !== 'undefined'
          ? new ToenowGameSDK({ gameId: 'spot-quick', category: 'puzzle', gameTitle: 'Spot Quick' })
          : null;

        const startAnalysisBtn = document.getElementById("startAnalysisBtn");
        const retryBtn = document.getElementById("retryBtn");

        const gameOverReason = document.getElementById("gameOverReason");
        const finalScoreVal = document.getElementById("finalScoreVal");
        const finalWaveVal = document.getElementById("finalWaveVal");
        const finalStreakVal = document.getElementById("finalStreakVal");
        const finalSpecimenVal = document.getElementById("finalSpecimenVal");

        const domCandBtns = [
          document.getElementById("candBtn0"),
          document.getElementById("candBtn1"),
          document.getElementById("candBtn2"),
          document.getElementById("candBtn3")
        ];

        const SPECIMEN_BUFFER_SIZE = 240;
        const specimenCanvas = document.createElement("canvas");
        specimenCanvas.width = SPECIMEN_BUFFER_SIZE;
        specimenCanvas.height = SPECIMEN_BUFFER_SIZE;
        const specimenCtx = specimenCanvas.getContext("2d");

        const mosaicCanvas = document.createElement("canvas");
        const mosaicCtx = mosaicCanvas.getContext("2d");

        // ==================================================
        // 5. GAME STATE & 5 PROGRESSIVE TIERS (MAX 60s TIME CAP)
        // ==================================================
        const INITIAL_TOTAL_TIME = 60.0;
        const MAX_TOTAL_TIME = 60.0; // Hard cap: total time never exceeds 60s
        const CORRECT_TIME_BONUS = 2.0;
        const WRONG_TIME_PENALTY = 1.5;

        const tutorialActive = () => Boolean(window.ToenowTutorials?.isActive?.('spot-quick'));
        let tutorialSnapshot = null;
        const { TIERS, getTierForWave, getCurrentScoreTier, shuffleArray, generateCandidatesForTier } = window.ToenowGameModules['spot-quick'].rules;
        const state = {
          mode: "BRIEFING", // "BRIEFING" | "STAGING" | "ACTIVE" | "LOCKED_CORRECT" | "GAME_OVER"
          wave: 1,
          score: 0,
          streak: 0,
          peakStreak: 0,
          timeRemaining: INITIAL_TOTAL_TIME,
          currentTier: TIERS[0],
          focusWindow: TIERS[0].focusWindow,
          elapsedInWave: 0.0,
          clarity: 0.0, // 0.0 to 1.0
          stagingTimer: 0.0,
          stagingTotal: 0.42, // Brief READY -> GO!
          confirmTimer: 0.0,
          inputFreezeTimer: 0.0, // 300ms freeze on wrong answer
          lastAwardedPts: 0,
          targetSpecimen: SPECIMEN_POOL[0],
          candidates: [],
          subjectAngle: 0,
          subjectAngularVel: 0,
          lastHistoryIds: [],
          layout: {
            width: 360,
            height: 600,
            dpr: 1,
            spotlightX: 180,
            spotlightY: 200,
            spotlightRadius: 110,
            gridTop: 360
          }
        };

        function setupWave(waveNum) {
          if (!tutorialActive()) window.ToenowAnimals?.setWave('spot-quick', waveNum);
          state.wave = waveNum;
          const tier = getTierForWave(waveNum);
          state.currentTier = tier;
          state.focusWindow = tier.focusWindow; // 10s, 20s, 30s, 40s, or 50s
          state.elapsedInWave = 0;
          state.clarity = 0;
          state.inputFreezeTimer = 0;
          state.lastAwardedPts = 0;

          const availableTargets = SPECIMEN_POOL.filter(function (s) {
            return state.lastHistoryIds.indexOf(s.id) === -1;
          });
          const poolToPick = availableTargets.length > 0 ? availableTargets : SPECIMEN_POOL;
          const target = poolToPick[Math.floor(Math.random() * poolToPick.length)];
          state.targetSpecimen = target;

          state.lastHistoryIds.push(target.id);
          if (state.lastHistoryIds.length > 8) {
            state.lastHistoryIds.shift();
          }

          const allOptions = generateCandidatesForTier(target, tier);
          state.candidates = allOptions.map(function (spec, idx) {
            return {
              index: idx,
              id: spec.id,
              cluster: spec.cluster,
              correct: spec.id === target.id,
              depleted: false,
              selectedCorrect: false,
              rect: { x: 0, y: 0, w: 0, h: 0 }
            };
          });

          // Dynamic orientation: never show the same angle every time!
          // Every wave picks a distinct random angle across full 360 degrees,
          // plus gentle subtle drift so the silhouette is never static or repetitive.
          state.subjectAngle = Math.random() * Math.PI * 2;
          const dir = Math.random() < 0.5 ? -1 : 1;
          state.subjectAngularVel = dir * (0.04 + Math.random() * 0.08);

          state.mode = "STAGING";
          state.stagingTimer = state.stagingTotal;

          updateLayoutMetrics();
          updateHudDOM();
        }

        // ==================================================
        // 6. SAFE BOUNDS & RESPONSIVE LAYOUT METRICS
        // ==================================================
        function updateLayoutMetrics() {
          const rect = canvasStage.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = Math.max(260, Math.floor(rect.width));
          const teaching = Boolean(window.ToenowTutorials?.isActive?.('spot-quick'));
          const h = Math.max(teaching ? 1 : 340, Math.floor(rect.height));

          if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
          }

          state.layout.width = w;
          state.layout.height = h;
          state.layout.dpr = dpr;

          const bottomPad = 14;
          const sidePad = 8;
          const gap = 10;
          const btnH = Math.max(46, Math.min(60, Math.floor(h * 0.105)));
          const gridTotalH = btnH * 2 + gap;
          const gridTop = h - bottomPad - gridTotalH;

          // Safe Bounds: Central spotlight sits strictly below hudBottom + 20px
          const minSpotlightTop = 22;
          const maxSpotlightBottom = gridTop - 18;
          const availableSpotlightH = Math.max(teaching ? 40 : 120, maxSpotlightBottom - minSpotlightTop);
          const maxDiameter = Math.min(w - 28, availableSpotlightH);
          const radius = Math.max(teaching ? 20 : 56, Math.min(132, Math.floor(maxDiameter / 2)));

          const spotlightX = Math.floor(w / 2);
          const spotlightY = Math.floor(minSpotlightTop + availableSpotlightH / 2);

          state.layout.spotlightX = spotlightX;
          state.layout.spotlightY = spotlightY;
          state.layout.spotlightRadius = radius;
          state.layout.gridTop = gridTop;

          const colW = Math.floor((w - sidePad * 2 - gap) / 2);
          for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const bx = sidePad + col * (colW + gap);
            const by = gridTop + row * (btnH + gap);

            if (state.candidates[i]) {
              state.candidates[i].rect = { x: bx, y: by, w: colW, h: btnH };
            }

            const domBtn = domCandBtns[i];
            if (domBtn) {
              domBtn.style.left = Math.max(0, bx - 6) + "px";
              domBtn.style.top = Math.max(0, by - 6) + "px";
              domBtn.style.width = colW + 12 + "px";
              domBtn.style.height = btnH + 12 + "px";
              if (state.candidates[i]) {
                domBtn.textContent = state.candidates[i].id;
                domBtn.setAttribute("aria-label", state.candidates[i].id);
                domBtn.disabled = state.candidates[i].depleted || state.mode !== "ACTIVE";
              }
            }
          }
        }

        window.addEventListener("resize", updateLayoutMetrics);

        // ==================================================
        // 7. HUD & GAME FLOW HANDLERS
        // ==================================================
        function updateHudDOM() {
          const clarityPct = Math.min(100, Math.max(0, Math.round(state.clarity * 100)));
          const timeStr = Math.max(0, state.timeRemaining).toFixed(1);
          const tier = state.currentTier || getTierForWave(state.wave);
          hudPipedText.textContent =
            "WAVE " +
            state.wave +
            " [" +
            tier.name +
            "] | CLARITY: " +
            clarityPct +
            "% | STREAK: " +
            state.streak +
            " | TIME: " +
            timeStr +
            "s";

          hudScoreText.textContent = String(state.score);
          document.getElementById("live-time").textContent = window.ToenowTutorials?.isActive("spot-quick") ? "∞" : timeStr + "s";
          document.getElementById("live-combo").textContent = state.streak + "x";
          hudCatText.textContent = "L" + tier.level + " " + tier.name;

          if (state.inputFreezeTimer > 0) {
            hudTierText.textContent = "PENALTY: -1.5s";
            hudTierText.style.color = PALETTE.magenta;
          } else {
            const tierPts = getCurrentScoreTier(state.elapsedInWave, state.focusWindow);
            hudTierText.textContent = "+" + tierPts + " PTS · +2.0s";
            hudTierText.style.color = tierPts === 100 ? PALETTE.cyan : PALETTE.volt;
          }
        }

        function startGame(startWave = 1, isPractice = false) {
          if (tutorialActive()) return;
          if (toenowSdk) toenowSdk.startRun({ wave: startWave, isPractice });
          state.isPractice = Boolean(isPractice);
          ensureAudioContext();
          briefingModal.classList.add("hidden");
          gameOverModal.classList.add("hidden");
          gameOverModal.classList.remove("active");
          state.score = 0;
          state.streak = 0;
          state.peakStreak = 0;
          state.timeRemaining = INITIAL_TOTAL_TIME;
          state.lastHistoryIds = [];
          setupWave(startWave);
        }

        function triggerGameOver(reasonText) {
          if (tutorialActive()) return;
          if (state.mode === "GAME_OVER") return;
          state.timeRemaining = 0;
          state.mode = "GAME_OVER";
          for (let i = 0; i < domCandBtns.length; i++) {
            domCandBtns[i].disabled = true;
          }

                    saveBestFocusRecords(state.score, state.wave);
          ToenowScreens.updateGameOver('spot-quick', { score: state.score, bestScore: loadBestFocusScore(), wave: state.wave, combo: state.peakStreak });
          ToenowScreens.updateTitle('spot-quick', { bestScore: loadBestFocusScore(), bestWave: loadBestFocusWave() });
          gameOverModal.classList.remove("hidden");
          gameOverModal.classList.add("active");
          updateHudDOM();

          // Toenow Game SDK Unified Lifecycle & Hub Contract
          if (toenowSdk) {
            toenowSdk.reportGameOver({
              score: Math.round(state.score),
              wave: Number(state.wave) || 1,
              streak: Number(state.peakStreak) || 0,
              isPractice: Boolean(state.isPractice)
            });
          } else {
            try {
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(
                  {
                    type: 'GAME_OVER',
                    gameId: 'spot-quick',
                    category: 'puzzle',
                    score: Math.round(state.score),
                    wave: Number(state.wave) || 1,
                    streak: Number(state.peakStreak) || 0
                  },
                  '*'
                );
              }
            } catch (_) {}
          }
        }

        function handleCandidateSelection(index) {
          if (tutorialActive()) {
            if (window.ToenowTutorials.isComplete('spot-quick')) return;
            const candidate = state.candidates[index];
            if (!candidate?.correct) { playIncorrectBuzz(); return; }
            candidate.selectedCorrect = true; state.clarity = 1; state.mode = 'LOCKED_CORRECT';
            playCorrectBlip(1); updateHudDOM(); window.ToenowTutorials.complete('spot-quick'); return;
          }
          if (state.mode !== "ACTIVE") return;
          if (state.inputFreezeTimer > 0) return;

          const cand = state.candidates[index];
          if (!cand || cand.depleted) return;

          if (cand.correct) {
            toenowSdk?.recordCorrectAnswer();
            const basePts = getCurrentScoreTier(state.elapsedInWave, state.focusWindow);
            const streakBonus = Math.min(state.streak, 4) * 5;
            const totalAward = basePts + streakBonus;

            state.score += totalAward;
            state.lastAwardedPts = totalAward;
            state.streak += 1;
            if (state.streak > state.peakStreak) {
              state.peakStreak = state.streak;
            }

            // Correct answer adds +2.0 seconds, strictly capped at MAX_TOTAL_TIME (60.0s)
            state.timeRemaining = Math.min(MAX_TOTAL_TIME, state.timeRemaining + CORRECT_TIME_BONUS);

            cand.selectedCorrect = true;
            state.clarity = 1.0;
            state.mode = "LOCKED_CORRECT";
            state.confirmTimer = 0.38;
            window.ToenowAnimals?.feedback('spot-quick', true);

            playCorrectBlip(state.clarity);
            updateHudDOM();
          } else {
            // Penalty: -1.5s time deduction, 300ms input freeze, depleted hollow wireframe button
            cand.depleted = true;
            if (domCandBtns[index]) {
              domCandBtns[index].disabled = true;
            }
            state.streak = 0;
            state.inputFreezeTimer = 0.30;
            state.timeRemaining = Math.max(0, state.timeRemaining - WRONG_TIME_PENALTY);

            window.ToenowAnimals?.feedback('spot-quick', false);
            playIncorrectBuzz();
            updateHudDOM();

            if (state.timeRemaining <= 0) {
              triggerGameOver("TIME DEPLETED");
            }
          }
        }

        startAnalysisBtn.addEventListener("click", function (e) {
          e.preventDefault();
          startGame();
        });

        retryBtn.addEventListener("click", function (e) {
          e.preventDefault();
          startGame();
        });

        domCandBtns.forEach(function (btn, idx) {
          btn.addEventListener("pointerdown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleCandidateSelection(idx);
          });
          btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleCandidateSelection(idx);
          });
        });

        // Direct Canvas Pointer Hit Detection (+15px hit area padding)
        canvas.addEventListener("pointerdown", function (e) {
          if (state.mode !== "ACTIVE") return;
          const rect = canvas.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          const hitPad = 15;

          let bestIdx = -1;
          let bestDist = Infinity;

          for (let i = 0; i < state.candidates.length; i++) {
            const r = state.candidates[i].rect;
            if (
              px >= r.x - hitPad &&
              px <= r.x + r.w + hitPad &&
              py >= r.y - hitPad &&
              py <= r.y + r.h + hitPad
            ) {
              const cx = r.x + r.w / 2;
              const cy = r.y + r.h / 2;
              const dist = Math.hypot(px - cx, py - cy);
              if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
              }
            }
          }

          if (bestIdx !== -1) {
            e.preventDefault();
            handleCandidateSelection(bestIdx);
          }
        });

        function togglePause() {
          if (tutorialActive()) return;
          if (state.mode === "ACTIVE" || state.mode === "STAGING") {
            state.previousMode = state.mode;
            state.mode = "PAUSED";
            document.body.dataset.paused = "true";
            pauseScoreVal.textContent = String(Math.round(state.score));
            pauseWaveVal.textContent = String(state.wave);
            pauseTimeVal.textContent = state.timeRemaining.toFixed(1) + "s";
            pauseModal.classList.remove("hidden");
            pauseModal.classList.add("active");
            for (let i = 0; i < domCandBtns.length; i++) {
              domCandBtns[i].disabled = true;
            }
          } else if (state.mode === "PAUSED") {
            state.mode = state.previousMode || "ACTIVE";
            document.body.dataset.paused = "false";
            pauseModal.classList.remove("active");
            pauseModal.classList.add("hidden");
            if (state.mode === "ACTIVE") {
              for (let i = 0; i < domCandBtns.length; i++) {
                domCandBtns[i].disabled = state.candidates[i] ? state.candidates[i].depleted : false;
              }
            }
          }
        }

        if (btnPauseHud) {
          btnPauseHud.addEventListener("click", function (e) {
            e.currentTarget.blur();
            togglePause();
          });
        }
        document.getElementById("btnAudioHud").addEventListener("click", function (e) {
          e.currentTarget.blur();
          const audioEnabled = audio.toggle();
          e.currentTarget.dataset.muted = String(!audioEnabled);
          e.currentTarget.setAttribute("aria-pressed", String(audioEnabled));
        });
        document.getElementById("btnRestartHud").addEventListener("click", function (e) {
          e.currentTarget.blur();
          document.body.dataset.paused = "false";
          pauseModal.classList.remove("active");
          pauseModal.classList.add("hidden");
          startGame(1, state.isPractice);
        });
        document.getElementById('btn-gameover-title').addEventListener('click', () => {
          gameOverModal.classList.add('hidden'); gameOverModal.classList.remove('active');
          state.mode = 'BRIEFING'; briefingModal.classList.remove('hidden'); updateHudDOM();
        });
        if (btnResumeFocus) {
          btnResumeFocus.addEventListener("click", function (e) {
            e.currentTarget.blur();
            togglePause();
          });
        }
        if (btnRestartFocus) {
          btnRestartFocus.addEventListener("click", function (e) {
            e.currentTarget.blur();
            pauseModal.classList.add("hidden");
            startGame();
          });
        }
        if (btnTitleFocus) {
          btnTitleFocus.addEventListener("click", function (e) {
            e.currentTarget.blur();
            pauseModal.classList.add("hidden");
            state.mode = "BRIEFING";
            briefingModal.classList.remove("hidden");
            updateHudDOM();
          });
        }

        window.addEventListener("keydown", function (e) {
          if (e.key === "p" || e.key === "P" || e.key === "Escape") {
            if (state.mode === "ACTIVE" || state.mode === "STAGING" || state.mode === "PAUSED") {
              e.preventDefault();
              togglePause();
              return;
            }
          }
          if (state.mode === "PAUSED" && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            togglePause();
            return;
          }
          if (state.mode === "BRIEFING" && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            startGame();
            return;
          }
          if (state.mode === "GAME_OVER" && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            startGame();
            return;
          }
          if (state.mode === "ACTIVE") {
            if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
              handleCandidateSelection(parseInt(e.key, 10) - 1);
            }
          }
        });

        // ==================================================
        // 8. CANVAS RENDERING & GENTLE DE-BLURRING ENGINE
        // ==================================================

// ==================================================
        // 9. 60 FPS REQUESTANIMATIONFRAME LOOP WITH DELTA-TIME
        // ==================================================
        let lastFrameTime = performance.now();

        function gameLoop(now) {
          const rawDt = (now - lastFrameTime) / 1000;
          lastFrameTime = now;
          const dt = Math.min(0.1, Math.max(0.0, rawDt));

          if (tutorialActive()) {
            state.subjectAngle += state.subjectAngularVel * dt; updateHudDOM(); hudPipedText.textContent = 'LEVEL 1 | TIME: ∞';
          } else if (state.mode === "STAGING") {
            state.stagingTimer -= dt;
            state.elapsedInWave = 0;
            state.clarity = 0.0;
            if (state.stagingTimer <= 0) {
              state.mode = "ACTIVE";
              state.elapsedInWave = 0;
              state.clarity = 0.0;
              for (let i = 0; i < domCandBtns.length; i++) {
                domCandBtns[i].disabled = state.candidates[i] ? state.candidates[i].depleted : false;
              }
            }
            updateHudDOM();
          } else if (state.mode === "ACTIVE") {
            if (state.inputFreezeTimer > 0) {
              state.inputFreezeTimer = Math.max(0, state.inputFreezeTimer - dt);
            }

            state.timeRemaining = Math.max(0, state.timeRemaining - dt);
            state.elapsedInWave += dt;
            state.clarity = Math.min(1.0, Math.max(0, state.elapsedInWave / state.focusWindow));

            state.subjectAngle += state.subjectAngularVel * dt;

            updateHudDOM();

            if (state.timeRemaining <= 0) {
              triggerGameOver("TIME EXPIRED");
            }
          } else if (state.mode === "LOCKED_CORRECT") {
            state.confirmTimer -= dt;
            if (state.confirmTimer <= 0) {
              setupWave(state.wave + 1);
            }
          }

          const w = state.layout.width;
          const h = state.layout.height;
          const dpr = state.layout.dpr;

          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);

          drawAnalyticalBackground(
            w,
            h,
            state.layout.spotlightX,
            state.layout.spotlightY,
            state.layout.spotlightRadius
          );
          drawSpotlightViewport(
            state.layout.spotlightX,
            state.layout.spotlightY,
            state.layout.spotlightRadius
          );
          drawCandidateButtons(w);
          drawObservationArchive(w, h);
          window.__OWL_OBSERVATION_STATE = { mode: state.mode, wave: state.wave, specimenCount: SPECIMEN_POOL.length,
            categories: Array.from(new Set(SPECIMEN_POOL.map(s => s.cluster))),
            target: state.targetSpecimen.id, candidates: state.candidates.map(c => ({ correct: c.correct, depleted: c.depleted })) };

          ctx.restore();

          if (typeof ToenowLevels !== 'undefined' && ToenowLevels.setupPracticeMode) {
          ToenowLevels.setupPracticeMode({
            container: '#briefingModal .unified-title-card',
            onStartGame: (startWave, isPractice) => {
              startGame(startWave, isPractice);
            }
          });
        }
        requestAnimationFrame(gameLoop);
        }

        setupWave(1);
        state.mode = "BRIEFING";
        updateLayoutMetrics();
        updateHudDOM();
          ToenowScreens.updateTitle('spot-quick', { bestScore: loadBestFocusScore(), bestWave: loadBestFocusWave() });
        requestAnimationFrame(gameLoop);
        window.ToenowTutorials?.register?.('spot-quick', {
          start() {
            tutorialSnapshot = { ...state, candidates: state.candidates.map(c => ({ ...c, rect: { ...c.rect } })), layout: { ...state.layout }, lastHistoryIds: [...state.lastHistoryIds] };
            Object.assign(state, { isPractice: true, score: 0, streak: 0, peakStreak: 0 }); setupWave(1);
            Object.assign(state, { mode: 'ACTIVE', clarity: 1, subjectAngle: 0, subjectAngularVel: 0, elapsedInWave: state.focusWindow });
            [briefingModal, gameOverModal].forEach(m => { m.classList.add('hidden'); m.classList.remove('active'); });
            updateLayoutMetrics(); updateHudDOM();
          },
          stop() {
            if (tutorialSnapshot) Object.assign(state, tutorialSnapshot);
            tutorialSnapshot = null; state.mode = 'BRIEFING';
            briefingModal.classList.remove('hidden'); briefingModal.classList.add('active');
            gameOverModal.classList.add('hidden'); gameOverModal.classList.remove('active'); updateLayoutMetrics(); updateHudDOM();
          },
          getGuide() {
            const c = state.candidates.find(candidate => candidate.correct), box = canvas.getBoundingClientRect();
            return { prompt: 'Match the picture in the spotlight to a card below.', rect: { x: box.left + c.rect.x, y: box.top + c.rect.y, width: c.rect.w, height: c.rect.h } };
          }
        });
      })();
