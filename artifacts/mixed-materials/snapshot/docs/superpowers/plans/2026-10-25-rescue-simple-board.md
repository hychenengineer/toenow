# Animal Rescue Train simplified board

Goal: Implement the approved mobile mockup with no animal quantity text, visual queue order, green selection, ghost seats and a single panda instruction.

Architecture: Keep the existing engine, SDK, save format and documented shared-screen exception. Modify the game's HTML/renderer/CSS and the shared language catalog. Preserve unrelated working-tree edits. The approved conversation and generated mockup are the design specification.

1. Replace verbose board chrome with compact header, queues, inline panda and train seats. Keep the next three passengers visible, with nearest passenger at the bottom. Keep Level 5 rule acknowledgement and a persistent animal badge.
2. Shorten the menu to a visual three-animal example and expandable instructions. Localize all new copy. Preserve practice, undo, replay, share and save behavior.
3. Verify the actual browser DOM and geometry at mobile/desktop sizes in both languages and all five tiers; solve real puzzles, check incompatible moves, undo, reload, practice protection and iframe. Run npm test and shared screens regression. Inspect captured screenshots and fix issues.

Validation: tools/verify-rescue-simple-browser.cjs; tools/verify-rescue-success-browser.cjs; tools/verify-shared-screens-browser.cjs; npm test. Evidence under artifacts/animal-rescue-train/simple-board. No commits or deployment requested.

Progress: board, menu, language copy, generated scenery and actual-puzzle browser checks implemented. Initial matrix passed 407 checks; normal-play/Hub success runner passed 109; shared screen regression passed 36 standalone, 9 iframe, 9 practice cases; npm test passed 127.

Fresh focused review found one readability issue: old pale amber Help warning on new cream panel. A browser contrast assertion reproduced the failure, then the palette was corrected to #91612b. Final matrix including the contrast assertion passed 413 checks, with zero browser errors; npm test passed 127 again. Reviewer found no other important issues. Physical iPad Safari remains NOT VERIFIED.

Completed: IMPLEMENT -> TEST -> INSPECT -> FIX -> RETEST. Final browser evidence: artifacts/animal-rescue-train/simple-board/run-1792971878202/results.json; normal/iframe progression: artifacts/animal-rescue-simple-success-final.log; common screens: artifacts/animal-rescue-simple-shared.log; full suite: artifacts/animal-rescue-simple-npm-reviewed.log. Preview is served on loopback port 8789. No source commits, push or deployment performed.

Publication authorized by the user's subsequent "Publish" request. Before publication, npm test passed 127 again. Publish only these scoped changes, exclude remote attachments/local logs, preserve canonical generated background source, push GitHub main without rewriting history, and deploy the static runtime to the existing Cloudflare Pages project toenow. Verify live game/CSS/JS/background bytes and actual browser operation before claiming website publication.
