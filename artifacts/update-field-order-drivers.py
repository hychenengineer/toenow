from pathlib import Path
import re
for p in Path('tools').glob('verify-animal-*-browser.cjs'):
 s=p.read_text(encoding='utf-8-sig')
 s=re.sub(r"await (p|page|game)\.locator\('#menu'\)\.click\(\)",r"await \1.locator('#board').evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause())",s)
 if p.name=='verify-animal-journey-popup-browser.cjs':s=s.replace("await p.locator('#end-turn').click();", "await p.locator('#end-turn').click();await p.locator('#order-accept').click();")
 if p.name=='verify-animal-orders-browser.cjs':
  s=s.replace("el.closest('.command-panel')", "el.closest('#battle-order')")
  s=s.replace("await p.locator('#cancel-move').click();", "await p.locator('#order-cancel').click();await p.locator('#cancel-move').click();")
  s=s.replace("await p.locator('#end-turn').click();", "await p.locator('#end-turn').click();await p.locator('#order-accept').click();")
  s=s.replace("await p.locator('[data-cell=\"4,1\"]').click();assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'attack');", "await p.locator('[data-cell=\"4,1\"]').click();assert.equal(await p.locator('#battle-order').isVisible(),true);await p.locator('#order-cancel').click();assert.equal(await p.locator('#battle-coach').getAttribute('data-step'),'target');await p.locator('[data-cell=\"4,1\"]').click();")
  s=s.replace("document.getElementById('menu').click();", "ToenowGameSDK.getInstance('animal-siege').pause();")
  s=s.replace("await game.locator('#unit-guide-open').click();", "await game.locator('#order-cancel').click();await game.locator('#unit-guide-open').click();")
  s=s.replace("assert.match(await game.locator('#battle-coach-prompt').innerText(),/移動並攻擊/);", "assert.match(await game.locator('#battle-coach-prompt').innerText(),/紅色劍/);")
 p.write_text(s,encoding='utf-8')
