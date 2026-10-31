# Straight horizontal river, obstacles and persistent pause — 2026-10-27

User changed the river direction to two straight banks while retaining horizontal scrolling. River projection now has a fixed center and heading; touch inversion, save schema, eddy and collection logic remain shared. Added sparse alternating rocks/driftwood: first at6 active flow seconds, then7-second intervals in alternating river positions. Contact consumes the obstacle once, gives a0.8-second surprised/cross-eye expression, stars, gentle tilt and small lateral bump (visual-only in the eddy). No score loss, no item/material credit, no forced ending; cooldown avoids continuous repeated hits. Existing saves receive safe defaults for hit/spawn state.

Root cause of disappearing pause: Hub hid the iframe original and mirrored it into a state-dependent toolbar. The original now remains visible as a named fixed Pause button at upper right, in title, play and result states, standalone and iframe. Hub actions also remain visible. Pause opens the same rest/continue/book/float/finish/Hub menu. Title pause restores title without creating progress; result pause restores results without saving a finished run or sending a second GAME_OVER. Background/explicit pause freeze flow, countdown and hit animation.

PASS npm test257/257:artifacts/capybara-straight-tests.log.
PASS full shared regression40standalone/10iframe/10practice:artifacts/capybara-straight-shared.log.
PASS original8journey scenarios and Hub launch/restart/pause/result/exit:artifacts/capybara-straight-journey.log.
PASS dedicated browser matrix8EN/zh-Hant cases at390x844,320x568,844x390,1100x850 plus realHub fixed in-frame pause on title/play/result:artifacts/capybara-straight-browser-final.log. Checks straight bank coordinates, real obstacle collision/animation/no score loss, pause/menu/frozen clocks, result finish idempotence.
PASS independent review; duplicate result settlement finding fixed and rechecked; no open findings. Scoped tracked git diff --check passed. Screenshots:artifacts/capybara-straight/.

Reloaded user's actual in-app Hub through browser tools and continued the existing save; visibly confirmed straight river and in-frame named Pause control. Existing saves and unrelated work preserved. No commit,push orpublication. Physical mobileSafari/touch hardware NOT VERIFIED; automatedbrowser checks are Edge synthetic touch.
