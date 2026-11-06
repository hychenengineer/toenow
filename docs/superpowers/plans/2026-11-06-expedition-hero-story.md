# Expedition Hero Story Implementation Plan

> **For agentic workers:** Use focused subagents for independent engine and presentation tasks, with explicit file ownership, then a fresh integration review. Steps use checkbox syntax.

**Goal:** Deliver a playable, saved five-chapter story with one off-board hero, factions, spells, talents and equipment.
**Architecture:** Keep classic campaign intact; story.js orchestrates an opt-in run using existing army/camp interfaces. hero.js owns commander progression and spells; engine.js applies opt-in squad modifiers. Story views and controller use existing shared SDK/screens.
**Tech Stack:** Existing buildless JavaScript, CSS, Node tests and installed Playwright runtime.
**Spec:** ../specs/2026-11-06-expedition-hero-story-design.md

## Global Constraints

- Preserve E.TYPES and unmodified battle results without commander metadata.
- Fixed hero, five sequential chapters; hero level separate from SDK wave tier.
- Shared title/end rendering only, practice isolation, bilingual text, full-row scenes, centered dialogs.
- Touch and keyboard, 320/390/1280 widths, standalone and iframe; local work only.

## Review Focus

- Duplicate/stale settlement must not grant rewards twice (story tests).
- Defeat, retreat and reload restore the pre-battle checkpoint (story and browser tests).
- Modal/pause/lesson/restart callbacks must not alter an inactive battle (browser tests).
- Status effects and enemy casts must expire correctly on both teams (hero tests).
- Corrupt storage, unavailable storage and practice must preserve existing user progress (story and browser tests).

## Task 1: Hero and opt-in battle rules

Files: create games/animal-siege/hero.js and tests/animal-siege-hero.test.cjs; modify engine.js only.

Interfaces: AnimalHero/CommonJS H exports FACTIONS, HERO, SPELLS, EQUIPMENT, TALENTS, createHero(level=1), stats(hero), levelUp(hero,level), chooseTalent(hero,id), equip(hero,id), toggleSpell(hero,id), attach(state,hero,enemyHero=null), spellCost(hero,id), canCast(state,id,targetId,team='player'), castSpell(state,id,targetId,team='player'), enemyCast(state). Hero fields: id, level, mana, knownSpells, loadout, inventory, equipment:{weapon,charm}, talent. state.commanders.player/enemy are detached hero snapshots. H.attach sets per-unit commander attack/defense/faction traits, maximum deployed HP and unit HP. H.attach must not alter original run hero. Expose engine settle for damaging spells. Spell status representation is owned entirely by this task.

- [x] Write and run failing tests for spell targeting/mana/once per round/no resurrection, effect expiry, equipment, talents, enemy casts and classic fixture preservation.
- [x] Implement helpers and opt-in engine hooks; document exact APIs and spell/status metadata for consumers.
- [x] Run node --test tests/animal-siege-hero.test.cjs tests/animal-siege.test.cjs tests/animal-siege-campaign.test.cjs; expect zero failures.

## Task 2: Sequential campaign and saves

Files: create games/animal-siege/story.js and tests/animal-siege-story.test.cjs.

Interfaces: AnimalHeroStory/CommonJS S exports CHAPTERS, STORAGE_KEY, create(wave=1), chapter(run), beginBattle(run), completeBattle(run,battle), advance(run), claimSupply(run,choice), save(storage,run), load(storage), score(run). Run reuses C.create army/gold/wood/upgrades plus story:{chapter:1..5,cleared:[],awaitingAdvance:false,supplies:[],completed:false}, hero, activeBattle. Chapter records supply bilingual title, intro, victory, faction, fortId (existing art id), terrain and enemy counts. state.storyChapter and state.storyFaction identify story fights. S.beginBattle creates checkpoint. Completion validates identity, result and actual survivors; defeat restores checkpoint, victory grants once. advance requires awaitingAdvance; final victory sets run.result='victory'. save excludes active battle and validates restored state.

- [x] Add red tests for gates, settlement, retry, army/hero reward progression, saves and corruption.
- [x] Implement five distinct chapter encounters with level-up and six equipment rewards across progression, and optional once-per-chapter supplies.
- [x] Simulate legal battles with existing test policy plus spells; tune finite campaign so both talent choices can complete without external mutations.
- [x] Run node --test tests/animal-siege-story.test.cjs; expect zero failures.

## Task 3: Player experience and integration

Files: create story-view.js, hero-story.css and shared/toenow-i18n-hero-story.js; modify main.js, index.html, shared/toenow-screen-config.js, package.json and relevant runtime tests. Reuse existing art; root owns story.js, engine worker owns hero.js/engine.js; UI worker owns this task's files.

- [x] Build chapter map with locked/current/completed nodes, fixed hero summary, camp access and focused current objective dialog; after victory display reward/next chapter flow.
- [x] Add central hero panel with four stats, fixed passive, once-only talent, two equipment slots and max-three spell selection. Explain locked unlocks and actual effects.
- [x] Integrate spell target/confirmation dialog, disabled states, enemy spell announcement and status badges; keep battle full width and existing lesson isolated.
- [x] Route default to story, ?mode=classic to original, ?mode=battle unchanged. Wire story settlement before classic capture. Persist safe checkpoints; continue/new game UI and practice isolation; use shared final screens and SDK exactly once.
- [x] Update title configuration/copy and new EN/ZH catalog. Update existing classic browser routes to mode=classic, shared-screen hook to target current story; do not weaken assertions.
- [x] Verify syntax/runtime and focused tests.

## Task 4: End-to-end verification and review

Files: create tools/verify-hero-story-browser.cjs; artifacts/hero-story for evidence.

- [x] Play the five chapters via UI including spell use, talent/equipment, reload continuation and final result, retry/share/title; cover EN/ZH desktop/mobile, keyboard modal/Escape, practice and iframe.
- [x] Run npm test and required shared screen browser regression; inspect screenshots at phone and desktop sizes, fix concrete failures.
- [x] Fresh independent review of full diff for spec compliance and lifecycle/save correctness; fix material findings and rerun affected checks.
- [x] Commit only scoped feature files, keep local preview usable, report exact checks and no deployment/physical-device claim.
