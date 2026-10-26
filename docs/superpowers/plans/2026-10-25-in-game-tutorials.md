# Real game tutorials

**Goal:** Replace the detached teaching illustrations with safe, short lessons using each of the ten games' actual renderer, state machine and input handlers.

**Approved design:** The user confirmed that players should practice on the same boards, characters, animations and interactions they will use in normal play. Guidance is a short instruction and a glow around a real target. No duplicate demonstration game.

**Architecture:** A shared coach owns first-play detection, versioned completion, replay/skip/cancel and nonblocking instruction/highlight UI. Each game registers an adapter inside its engine scope: `start()`, `stop()`, `getGuide()`. Adapters initialize a short beginner task using real engine state, freeze session countdown and scoring/storage/analytics, and report completion from the actual successful action. Observation and shuffle animations continue normally. The controller sets tutorial state before starting an adapter and keeps it active until engine cleanup completes.

**API:** `ToenowTutorials.register(gameId, adapter)`, `isActive(gameId)`, `isComplete(gameId)`, `complete(gameId)`. Guide data is `{prompt, rect, waiting?, done?}`; rect uses viewport CSS coordinates of a real target. No teaching UI duplicates board markup or draws game objects.

**Constraints:** Preserve all existing bests, practice protection, train saves and picker history. No SDK starts/results or analytics runs during lessons. No code copying of shared start/end screens. English/Traditional Chinese, touch/mouse/keyboard, standalone/iframe. New v2 completion keys require completion or explicit skip; old illustration completion does not hide the replacement lesson. No publish until separately requested.

## Tasks

- [x] Replace shared fake lesson model/rendering with registered game adapters and the coach overlay; test session lifecycle, state isolation and completion persistence.
- [x] Integrate Number Pop, Block Match and Add Up using their real canvases and actions.
- [x] Integrate Ball Track, Space Scale and Shadow Match using their real states and animations.
- [x] Integrate Tap Match, Spot Quick and Rescue Train, protecting original train saves/history.
- [x] Integrate Flash Brain's actual memory engine and React lifecycle.
- [x] Verify every lesson through actual mouse/touch input against the real canvas/DOM, all ten games/languages/dimensions, skip/replay/cancel/keyboard/iframe and record protection.
- [x] Run npm test and shared-screen regression; inspect actual gameplay screenshots and obtain an independent review.

## Verification ledger

- PASS npm test 133/133: `artifacts/in-game-tutorials-npm-final.log`.
- PASS full actual-game matrix: 40 lessons (10 games × EN/ZH × 390/1100), 10 skip/cancel scenarios, 10 iframe scenarios and keyboard/language checks: `artifacts/in-game-tutorials-browser.log`.
- PASS final mobile rerun across all ten games with SDK/result-call and storage-write interception, zero scores and unchanged existing records: `artifacts/in-game-tutorials-final-mobile.log`.
- PASS final Block Match/Train layout and real Close-button regression, keyboard train boarding, and a genuine pre-existing train save/history/carriage restoration fixture: `artifacts/in-game-tutorials-final-layout.log`.
- PASS shared-screen regression: 36 standalone, 9 iframe and 9 practice scenarios: `artifacts/in-game-tutorials-shared-screens.log`.
- PASS independent review; focused actual-button keyboard activation and Flash React title remount race were corrected and retested. No outstanding P1/P2 findings.
- Screenshots under `artifacts/in-game-tutorials/`; inspected actual Block Match, Flash Brain and Train mobile gameplay. Compact guidance leaves the Block Match target visible. The existing global language switch moves to a fixed 44px top position during lessons to avoid covering coach controls; selector specificity also overrides Train's later screen stylesheet.
- Flash Brain continues the original pre-flash/flash/retention/input pipeline, hit test and cell reducer; a readable game-local adapter prepares its short lesson and skips awards before original result processing. Real observation animation continues while the countdown is protected.
- NOT VERIFIED: physical iPad Safari. Changes remain local; no commit, push or deployment performed in this request.
