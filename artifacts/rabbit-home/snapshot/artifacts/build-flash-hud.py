from pathlib import Path
p=Path('games/flash-brain/assets/index-cr-6j3L1.js')
s=p.read_text(encoding='utf8'); a=s.index('le=({score:'); b=s.index(',ue=({onStart:',a); old=s[a:b]
start=old.index('(0,T.jsxs)(`div`,{className:`flex items-center gap-1 ml-1`')
end=old.index(']})]})]}),(a',start)+3
controls=old[start:end].replace('className:`flex items-center gap-1 ml-1`','className:`island-hud-controls`')
head=old[:old.index('=>')+2]
metric=lambda name,expr: '(0,T.jsxs)(`div`,{className:`island-hud-metric`,children:[(0,T.jsx)(`span`,{className:`island-hud-label`,children:`'+name+'`}),'+expr+']})'
timer='(0,T.jsx)(`span`,{ref:s,"data-testid":`hud-timer`,className:`island-hud-value`,children:`60.0s`})'
score='(0,T.jsx)(`span`,{"data-testid":`hud-score`,className:`island-hud-value`,children:C(e)})'
combo='(0,T.jsxs)(`span`,{"data-testid":`hud-combo`,className:`island-hud-value`,children:[t,`x`]})'
notice='(0,T.jsx)(`div`,{className:`island-hud-task`,"data-testid":`priority-notice`,role:`status`,"aria-live":`polite`,"aria-atomic":`true`,children:`Tap yellow 1 first, then the other blocks.`})'
new=head+'(0,T.jsxs)(`div`,{className:`island-live-hud`,"data-testid":`telemetry-hud`,children:['+','.join([metric('TIME',timer),metric('SCORE',score),metric('COMBO',combo),controls,'(0,T.jsx)(`div`,{className:`island-hud-legacy`,children:(0,T.jsx)(`div`,{ref:c})})','a&&i!==`PHASE_BREACH`&&'+notice])+']})'
s=s[:a]+new+s[b:]; p.write_text(s,encoding='utf8',newline='\n')
p=Path('games/flash-brain/index.html'); s=p.read_text(encoding='utf8').replace('</head>','<link rel="stylesheet" href="../../assets/toenow-game-hud.css">\n</head>');p.write_text(s,encoding='utf8',newline='\n')
# Expose the existing current streak; this game previously only showed it at settlement.
p=Path('games/space-scale/index.html');s=p.read_text(encoding='utf8')
s=s.replace('data-metrics="2"','data-metrics="3"',1)
s=s.replace('<div class="island-hud-controls">','<div class="island-hud-metric"><span class="island-hud-label">COMBO</span><span id="hud-combo" class="island-hud-value">0x</span></div><div class="island-hud-controls">',1)
s=s.replace('streak = 0;', 'streak = 0;\n        document.getElementById("hud-combo").textContent = "0x";')
# The declaration is let streak = 0; which also refreshes the initial display.
s=s.replace('streak++;','streak++;\n            document.getElementById("hud-combo").textContent = streak + "x";')
p.write_text(s,encoding='utf8',newline='\n')
print('Updated native React HUD and parcel streak')
