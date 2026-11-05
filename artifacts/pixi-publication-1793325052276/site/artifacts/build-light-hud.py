from pathlib import Path
from html.parser import HTMLParser
import re

class Elements(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.text=text; self.stack=[]; self.nodes=[]
        self.lines=[0]
        for m in re.finditer('\n',text): self.lines.append(m.end())
        self.feed(text)
    def handle_starttag(self,tag,attrs):
        start=self.lines[self.getpos()[0]-1]+self.getpos()[1]
        n=dict(tag=tag,attrs=dict(attrs),start=start,inner=start+len(self.get_starttag_text()))
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'): self.stack.append(n)
    def handle_endtag(self,tag):
        if not any(n['tag']==tag for n in self.stack): return
        while self.stack:
            n=self.stack.pop()
            if n['tag']==tag: break
        n['close']=self.lines[self.getpos()[0]-1]+self.getpos()[1]
        n['end']=self.text.index('>',n['close'])+1
        self.nodes.append(n)
    def byid(self,id): return next(n for n in self.nodes if n['attrs'].get('id')==id)

configs={
 'number-pop':('hud-top-container',['hud-timer','hud-score','hud-combo'],['btn-mute','btn-pause','btn-restart-hud'],[]),
 'block-match':('hud-layer',['hud-timer','hud-score','hud-combo'],['btn-audio-hud','btn-pause-hud','btn-restart-hud'],[]),
 'add-up':('hud-layer',['hud-timer','hud-score'],['btn-clear-selection','btn-mute','btn-pause','btn-restart-hud'],[]),
 'ball-track':('hud-top',['hud-timer','hud-score'],['btn-mute','btn-pause','btn-restart-hud'],['hud-phase-text','hud-wave-target','hud-shields-pill']),
 'space-scale':('hud-layer',['hud-timer','hud-score'],['btn-mute','btn-pause','btn-restart-hud'],['directive-banner']),
 'tap-match':('hud-container',['hud-time','hud-score','hud-streak'],['btn-audio','btn-pause-hud','btn-reset'],['hud-target']),
 'spot-quick':('hudHeader',['live-time','hudScoreText','live-combo'],['btnAudioHud','btnPauseHud','btnRestartHud'],[]),
 'shadow-match':('hud-zone',['hud-timer','hud-score','hud-combo'],['btn-mute','btn-pause','btn-restart-quick'],[]),
}
for game,(root,metrics,controls,tasks) in configs.items():
    p=Path('games')/game/'index.html'; text=p.read_text(encoding='utf8')
    if game=='spot-quick':
        text=text.replace('<div class="hud-piped-bar" id="hudPipedText">','<span id="live-time">60.0s</span><span id="live-combo">0x</span><div class="hud-piped-bar" id="hudPipedText">')
        text=text.replace('hudScoreText.textContent = String(state.score);', 'hudScoreText.textContent = String(state.score);\n          document.getElementById("live-time").textContent = window.ToenowTutorials?.isActive("spot-quick") ? "∞" : timeStr + "s";\n          document.getElementById("live-combo").textContent = state.streak + "x";')
    tree=Elements(text); host=tree.byid(root)
    ids=metrics+controls+tasks
    nodes=[tree.byid(id) for id in ids]
    original=text[host['inner']:host['close']]
    for node in sorted(nodes,key=lambda n:n['start'],reverse=True):
        a=node['start']-host['inner']; b=node['end']-host['inner']
        original=original[:a]+original[b:]
    values=[]
    for i,id in enumerate(metrics):
        n=tree.byid(id); snippet=text[n['start']:n['end']]
        if 'class=' in snippet.split('>')[0]: snippet=re.sub(r'class="([^"]*)"',r'class="\1 island-hud-value"',snippet,count=1)
        else: snippet=snippet.replace('>', ' class="island-hud-value">',1)
        label=['TIME','SCORE','COMBO'][i]
        values.append(f'<div class="island-hud-metric"><span class="island-hud-label">{label}</span>{snippet}</div>')
    buttons=''.join(text[tree.byid(id)['start']:tree.byid(id)['end']] for id in controls)
    task=''.join('<div class="island-hud-task">'+text[tree.byid(id)['start']:tree.byid(id)['end']]+'</div>' for id in tasks)
    content=f'<div class="island-live-hud" data-metrics="{len(metrics)}">'+''.join(values)+'<div class="island-hud-controls">'+buttons+'</div>'+task+'</div><div class="island-hud-legacy" aria-hidden="true">'+original+'</div>'
    text=text[:host['inner']]+content+text[host['close']:]
    text=text.replace('</head>','<link rel="stylesheet" href="../../assets/toenow-game-hud.css">\n</head>')
    p.write_text(text,encoding='utf8',newline='\n')
    print('Updated',game)
