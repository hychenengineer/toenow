from pathlib import Path
p=Path('tools/verify-animal-trail-camp-browser.cjs');s=p.read_text(encoding='utf-8-sig');s=s.replace("click=async selector=>width<700?p.locator(selector).tap():p.locator(selector).click();", """click=async selector=>{
  if(selector==='[data-enter-camp]'&&await p.locator('#expedition').isVisible()&&!await p.locator('#location-dialog').isVisible())await p.locator('[data-location="home"]').click();
  if(selector==='[data-enter-trail="cache"]'&&!await p.locator('#location-dialog').isVisible())await p.locator('[data-location="cache"]').click();
  const el=p.locator(selector).filter({visible:true});return width<700?el.tap():el.click();};""");p.write_text(s,encoding='utf-8')
p=Path('tools/verify-animal-expedition-browser.cjs');s=p.read_text(encoding='utf-8-sig');s=s.replace("async function click(p,selector){const l=", "async function click(p,selector){if(selector==='[data-enter-camp]'&&await p.locator('#expedition').isVisible()&&!await p.locator('#location-dialog').isVisible())await p.locator('[data-location=\"home\"]').click();const l=");p.write_text(s,encoding='utf-8')
p=Path('tools/verify-animal-strategy-browser.cjs');s=p.read_text(encoding='utf-8');s=s.replace("    await p.locator('[data-enter-camp]').click();await p.locator('[data-building=\"beaver\"]').click();await p.locator('[data-recruit=\"beaver\"][data-amount=\"1\"]').click();", "    await p.locator('[data-location=\"home\"]').click();await p.locator('[data-enter-camp]').click();await p.locator('[data-building=\"beaver\"]').click();await p.locator('[data-recruit=\"beaver\"][data-amount=\"1\"]').click();")
# Map screenshots and menu interactions should happen with the location popup closed.
s=s.replace("    await p.locator('#expedition img').evaluateAll", "    await p.locator('#location-close').click();await p.locator('#expedition img').evaluateAll")
p.write_text(s,encoding='utf-8')
