# Orders on the battlefield

Approved design: remove the battle's right column and expand the existing painted field. Show troop count, HP, health bar and action status on the animal itself. Blue reachable tiles, orange attack range and red attackable enemy marks remain authoritative.

Selecting an empty reachable tile previews movement without spending it. Small controls beside the selected/preview animal offer cancel, move only or defend. Selecting a reachable enemy opens a centered damage/loss confirmation; with a preview it confirms move and attack together. Cancelling retains the reversible preview. Move-only leaves an unacted squad able to attack. End turn stays available in a compact bottom row; its popup explains any pending movement and automatic defense.

Preserve exact combat calculations, LOS, terrain, enemy AI, one move/attack per turn, damage animation, expedition losses, tutorial rehearsal, shared screens and practice records. Native confirmation dialogs must clean up on scene/restart/title/results; pause temporarily closes and resume restores pending intent. Escape closes the dialog first, without committing an order.

No art generation, balancing, commit, push, publication or new worktree. Work in the existing authorized preview workspace and preserve unrelated changes.
