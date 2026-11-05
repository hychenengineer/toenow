# Animal Siege presentation

User direction, 2026-11-04:

- Give maps and illustrated locations the full available row. Keep their complete image boundaries visible; avoid a permanent side information panel.
- Open location, building and exploration details in a centered popup when the player selects the relevant destination or object. Apply this pattern to future location screens.
- Popups support close, backdrop and Escape, restore focus, and close on scene changes, restart and results. Preserve the selected content across language changes and pause/resume.
- Show current army composition and counts on the expedition map and in camp; include zero-strength squads and update counts from actual surviving HP after recruitment and combat.
- Use nameplates for building selection; no outline around a building's transparent hit area.
- Keep map headings concise. Do not restore the removed subtitle, slogan, yellow guidance strip or topbar Menu button.
- Battles also use a full-row field without a roster/sidebar. Show count, HP, health bar and action state on each animal; use animal-local move/defend controls and a centered confirmation for attacks or ending the turn. Local controls must not cover legal movement or target cells.
- A move preview can lead directly into one combined move/attack confirmation. Cancelling preserves the preview; move-only still permits a later attack. End-turn confirmation explains pending movement and automatic defense.
