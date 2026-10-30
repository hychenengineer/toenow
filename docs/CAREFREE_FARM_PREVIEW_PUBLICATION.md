# Carefree Farm preview publication

User request: publish the farm to GitHub preview and place its Hub entrance immediately below Capybara Hot Spring Garden.

The publication tree is based on preview commit 099414839c02533885a7b5b7f15907a41afa379d. Only farm runtime/assets, farm integration and corresponding tests/docs are included. Other local timer/material/tutorial changes were excluded.

Validated before push:
- npm test: 7 garden pretests and 229 main tests passed.
- Farm browser: 14 groups, no page errors, including adjacent/below placement, iframe launch/restart, crops, purchases, offline growth and responsive bilingual views.
- Both failed-storage recovery regressions passed.
- Shared visit screens: 8 standalone, 2 iframe and 2 preview-mode cases passed for the farm and hot spring.
- git diff --check passed.

GitHub Pages is configured to serve preview at https://hychenengineer.github.io/toenow/. The commit uses the Cloudflare-supported [CF-Pages-Skip] prefix to omit Cloudflare deployment. The main branch is not a publication target. Physical iPad/Safari remains unverified.
