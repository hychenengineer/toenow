from pathlib import Path
import re
for name in ['trail-camp','expedition']:
 p=Path('tools/verify-animal-'+name+'-browser.cjs');s=p.read_text(encoding='utf-8');s="const {prepareJourneyAction}=require('./lib/animal-journey-driver.cjs');\n"+s
 if name=='expedition':s=s.replace("async function click(p,selector){", "async function click(p,selector){if(await prepareJourneyAction(p,selector))return;")
 else:s=s.replace('click=async selector=>{','click=async selector=>{if(await prepareJourneyAction(p,selector))return;')
 p.write_text(s,encoding='utf-8')
for name in ['map-dialog','strategy']:
 p=Path('tools/verify-animal-'+name+'-browser.cjs');s=p.read_text(encoding='utf-8');s="const {prepareJourneyAction}=require('./lib/animal-journey-driver.cjs');\n"+s
 needle="await p.goto(base+'/games/animal-siege/?mode=expedition');"
 s=s.replace(needle,"const uiClick=async selector=>{if(!await prepareJourneyAction(p,selector))await p.locator(selector).click();};"+needle)
 s=re.sub(r"await p\.locator\(('(?:[^']*)')\)\.click\(\);",r"await uiClick(\1);",s)
 p.write_text(s,encoding='utf-8')
