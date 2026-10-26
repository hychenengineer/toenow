from pathlib import Path
import re
p=Path('games/ball-track/index.html');s=p.read_text(encoding='utf8');hidden=[];shield=''
while '<div class="island-hud-task">' in s[:s.index('<div class="island-hud-legacy"')]:
 a=s.index('<div class="island-hud-task">');depth=0;b=None
 for m in re.finditer(r'</?div\b[^>]*>',s[a:]):
  depth+=-1 if m.group().startswith('</') else 1
  if depth==0: b=a+m.end();break
 part=s[a:b];s=s[:a]+s[b:]
 if 'hud-shields-pill' in part: shield=part
 else: hidden.append(part)
s=s.replace('<div class="island-hud-legacy" aria-hidden="true">','<div class="island-hud-legacy" aria-hidden="true">'+''.join(hidden),1)
s=s.replace('<div class="bottom-hud" id="bottom-hud">','<div class="bottom-hud" id="bottom-hud">'+shield,1)
p.write_text(s,encoding='utf8',newline='\n')
print('Ball HUD reduced to time, score and controls; shields retained below')
