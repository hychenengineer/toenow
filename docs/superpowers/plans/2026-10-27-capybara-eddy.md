# Winding river and optional eddy implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for engine and independent verification; presentation in primary workspace.

**Goal:** Curving river with optional whirlpool play; travel countdown stops inside, floating items continue, exit is always available.
**Architecture:** Separate route elapsed from active flow time in engine. Persist the eddy state and keep one-time featured/material flags. Use shared river geometry for projection and touch inversion; canvas draws the actual water pocket and orbit. Shared title/result remain intact.
**Spec:** User approved in-chat winding river + free-entry/exit eddy + tap interactions + paused countdown.
**Constraints:** No commit/publish, preserve current unrelated changes and saves. Practice writes nothing; max one construction resource per trip including long stays/reload. No difficulty levels.
**Review Focus:** Pause freezes simulation; mid-eddy reload; leave via swipe on small mobile; collision matches displayed orbit; bank/eddy stay on screen in portrait/landscape.

- [x] Add failing tests for winding geometry and projection/inversion across viewport ratios.
- [x] Add failing engine tests for entry/orbit/exit, frozen route time with flowing items, restore, bounded entities, practice and material cap; implement state and APIs.
- [x] Integrate shared geometry into river, item and capy drawing, pointer mapping, heading, eddy water/flower hints, optional tap splash/spin; add direct keyboard/accessible exit fallback and EN/ZH copy.
- [x] Browser-test actual touch entry, long stay, pickup/clock, free exit, pause, restore, actions, portrait/landscape + iframe; inspect screenshots. Run npm test and shared screens. Independent review, fix, retest, report.
