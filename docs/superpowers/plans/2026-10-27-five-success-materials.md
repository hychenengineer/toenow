# Five successful answers per material

> Implement inline using superpowers:executing-plans and test-driven-development.

Goal: Apply the approved rule to all ten material games: five successful actions
earn one item, no per-run reward ceiling, wrong answers never subtract earned
progress, and remainders carry between completed normal runs.

Architecture: The materials ledger counts explicit successful gameplay events
under its existing one-use run token. SDK adapters report those events; score and
wave heuristics no longer determine collectible earnings. Version-1 saves retain
balances, buildings and decorations, adding per-game remainders of 0–4.

Constraints: Practice/tutorial/preview runs earn nothing. Interrupted and duplicate
receipts cannot earn twice. Preserve existing local changes and do not commit or
publish. Capybara remains outside the ten-material economy. Shared title/end
screens continue using ToenowScreens. Include English and Traditional Chinese.

Success units: Number Pop basket; Ball Track correct shell; Block Match correct
block; Add Up valid sum; Space Scale correct answer; Tap Match valid target;
Spot Quick correct target; Shadow Match correct card; Flash Brain correct target;
Rescue Train successfully departed animal, with a per-round high-water mark to
exclude undo/replay of the same departure and pre-existing rescued animals.

- [x] Ledger/SDK: failing tests for 1+wrong, 12 successes, 50 successes, cross-run
  carry, per-game isolation, duplicate tokens, exclusions, and old-save migration.
  Implement recordSuccess(token,key), SDK recordCorrectAnswer(key), and settlement.
- [x] Connect each real success branch, including Flash's adapter and train undo
  handling. Verify actual controller input for all ten games, not fake scores.
- [x] Result UI: show earned quantity and successful-answer remainder, including
  zero-material runs with saved progress, in both languages.
- [x] Run npm test, actual-game browser regressions and shared-screen checks;
  inspect screenshots and refresh the idle local preview without losing saves.


Verification: npm test 228 passed; ten controller-success browser cases passed;
Fox real controller cases 1+wrong spam, 4, 12 and 50 successes passed; train
undo/reboarding and Menu/Continue passed; SDK lifecycle 14 checks passed; shared
screens 40 standalone, 10 iframe, 10 practice cases passed. Result screenshots
inspected in English/Traditional Chinese at phone width. Existing IAB save and
its eight ribbons remained present after reload. No publication or commit.

Review: one read-only fresh reviewer found train in-page continuation loss and
Number Pop restart partial reporting. Both fixed and rechecked, no remaining
important findings. Completed-run-only settlement preserves the prior pagehide,
restart and title-interruption exclusion; prior settled remainders remain saved.
