# Timed shield games

Scope: remove all per-wave answer deadlines. Space Scale and Ball Track used shield lives; Tap Match reset its countdown each wave. Other games were inspected: their remaining timing controls are run countdowns, reaction-target lifetimes, memory reveals or animations. Preserve existing work in the Hub and language runtime.

Final rules: start a run with 60 seconds; a correct selection adds 3 seconds, capped at 60; a wrong selection removes 5 seconds; zero remaining run time ends the game. Show only total run time. Remove all per-wave deadlines and timer refills. Pause, tutorials and explicit inter-wave briefings/perk choices do not consume time; active gameplay, including automatic reveal/shuffle animations, does. Remove Space Scale's rank promotion banner. Keep practice storage isolation and shared title/result rendering.

User steering: first clarified the original Fox wave-duration rule, then requested only total time, then explicitly removed every per-wave time limit. This replaces the original proposal to display/preserve per-wave deadlines. Speed-based scoring incentives may remain; they never expire a wave or penalize an unanswered wave.

- [x] Add a shared time adjustment rule and test its boundaries before implementation.
- [x] Space Scale: replace ten-minute/shield rules, remove wave timeout and promotion banner, update pause and instructions.
- [x] Ball Track: add run timer, remove answer-window timeout, replace shield failures and shield perk with time, update pause and instructions.
- [x] Tap Match: carry one sixty-second clock across waves; faults affect seconds without a separate lives limit.
- [x] Browser checks: correct/wrong/cap, waiting beyond the former wave deadline, natural expiry, pause, practice and restart at desktop/mobile sizes in both languages.
- [x] Run final npm test and shared-screen regression, inspect screenshots, and review diff.

Evidence: npm test 160/160; shared screens 36 standalone, 9 iframe, 9 practice checks; timed-game browser matrix 12 desktop/mobile and EN/ZH scenarios including real answer handlers, six mistakes without lives defeat, no wave expiry, natural total expiry, restart, pause, practice protection, iframe and time perk. Tutorials also advanced past 60 seconds without time loss or record writes. Independent review found no gameplay defect; its two test coverage gaps were added and passed.

GitHub publication subsequently requested by the user. Keep validation logs, screenshots and attachments local.
