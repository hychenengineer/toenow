// Navigate the same popup controls a player uses before an existing test action.
async function prepareJourneyAction(p,selector){
  if(selector==='#menu'){await p.evaluate(()=>ToenowGameSDK.getInstance('animal-siege').pause());return true;}
  if(selector==='#end-turn'){await p.locator('#end-turn').click();if(await p.locator('#battle-order').isVisible())await p.locator('#order-accept').click();return true;}
  if((selector.includes('data-building')||selector==='#camp-exit'||selector==='#unit-guide-open')&&await p.locator('#camp-dialog').isVisible())await p.locator('#camp-dialog-close').click();
  if(selector==='#trail-exit'&&await p.locator('#trail-dialog').isVisible())await p.locator('#trail-dialog-close').click();
  if(/data-investigate|data-trail-fight|data-claim="cache"/.test(selector)&&await p.locator('#trail').isVisible()&&!await p.locator('#trail-dialog').isVisible())await p.locator('#trail-inspect').click();
  if(selector==='[data-enter-camp]'&&await p.locator('#trail').isVisible()&&!await p.locator('#trail-dialog').isVisible())await p.locator('#trail-inspect').click();
  return false;
}
module.exports={prepareJourneyAction};
