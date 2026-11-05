# Animal materials implementation plan

**Goal:** Complete a first playable collection/building loop for the ten explorer games, without coins.

**Architecture:** A browser/Node shared materials ledger owns balances, five construction stages and optional two-material decorations. The SDK awards exactly once per actively started normal run. Island UI spends materials, reuses existing five-stage art and keeps challenge records separate.

**Constraints:** Preserve existing dirty work and saves. No commits or publication. Practice and previews never award or spend. Carefree capybara is separate. English/Traditional Chinese inherit Hub language. Keep the shared result renderer and train exception.

**Execution:** Implement inline in the current workspace because the user's current uncommitted game changes are necessary context; do not create a checkout that omits them.

- [x] Add failing economy tests: ten isolated materials, valid/repeated/practice/short/implausible runs, insufficient/duplicate purchases, reload, old-stage migration, storage failure and sequential clients.
- [x] Implement ledger under `toenow_materials_v1`, SDK lifecycle integration and shared reward banner. Use 4–8 items per normal result; no raw-score conversion. Upgrade costs 16/32/56/88. One 4-item own-material decoration and one 12-own + 4-partner cooperation per home.
- [x] Add island collection strip, build panel, recipe source navigation, visible/toggleable decorations and manual upgrade controls; preserve legacy building stages once.
- [x] Run focused tests and `npm test`; browser check all ten game award paths, standalone/iframe, practice/duplicates, save reload, spending, EN/ZH, desktop/mobile and shared screens. Inspect screenshots and fix failures.
- [x] Report evidence and remaining limits. Saves are browser-local; physical iPad Safari needs separate verification.

**Review focus:** old records must not demote homes; active game replay must clear old reward; denied storage must not claim a reward; locked partner navigation must explain discovery; preview art must not enable spending.
