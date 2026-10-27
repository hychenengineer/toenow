# Rabbit home implementation plan

**Goal:** Turn Rabbit Harvest Garden into the approved visitable starter scene with real play, short conversations and fixed-position building/decorating.

**Architecture:** A new `ToenowRabbitHome` module supplies a pure view model, short contextual dialogue and scene markup. The existing island dialog owns navigation and lifecycle; the materials ledger remains the single spending/save authority. Illustrated background, rabbit and transparent building atlas are separate assets. Initial stage 1 has only the cottage and one starter patch; each existing construction stage reveals a different object in the yard. Other nine homes keep their current detail interface.

**Approved scope:** Together harvest (Number Pop), chat, build/decorate. Four sequential own-material projects reuse the existing 16/32/56/88 upgrade costs. Existing basket/cart craft costs and placement state are preserved. No new currency, friendship grind, forced conversation or cloud save. Use English/Traditional Chinese and accessible touch/keyboard controls. Preserve the dirty workspace and source art. Publish only to preview; Cloudflare must skip this commit.

- [ ] Add failing tests for starter/built projects, costs and locked projects, contextual dialogue, real scene controls and stored decoration state.
- [ ] Produce scene background/rabbit/building atlas matching the approved concept; store canonical PNGs and runtime WebP with provenance.
- [ ] Implement scene model/markup and responsive CSS. Integrate rabbit-only dialog, short chats, game and material-source launch, sequential project preview/confirmation and decoration toggles through existing ledger.
- [ ] Verify fresh and returning saves, genuine game reward return, insufficient/duplicate spending, all five stages, EN/ZH, 1440/390/320 and landscape, keyboard focus, art loading and no unintended construction.
- [ ] Run npm test, affected browser regressions and an independent review. Fix and retest. Publish a scoped preview commit and verify live bytes/interactions and Cloudflare skipped status.

**Execution:** Inline in the existing workspace, preserving all unrelated local changes. No reset, clean, automatic main merge or production deployment.
