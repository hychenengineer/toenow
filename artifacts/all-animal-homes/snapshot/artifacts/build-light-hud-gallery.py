from pathlib import Path
import html,json
base=Path('artifacts/light-hud');runs=sorted(base.glob('run-*'),reverse=True)
names={'number-pop':'數字泡泡','ball-track':'水獺追蹤','block-match':'木作工坊','add-up':'松鼠補給站','space-scale':'狐狸秤重','tap-match':'企鵝配對','spot-quick':'貓頭鷹觀察','shadow-match':'浣熊影子劇場','flash-brain':'大象記憶花園'}
cards=[]
for id,name in names.items():
 p=next((r/f'{id}-390-zh-Hant.png' for r in runs if (r/f'{id}-390-zh-Hant.png').exists()),None)
 if p is None: raise RuntimeError('Missing screenshot '+id)
 src=html.escape(p.relative_to(base).as_posix())
 cards.append(f'<article><h2>{name}</h2><a href="{src}" target="_blank"><img src="{src}" alt="{name}實際遊戲畫面" loading="lazy"></a></article>')
page='''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>遊戲資訊列預覽</title><style>body{margin:0;padding:24px;background:#e8eddf;color:#304d43;font-family:system-ui,sans-serif}h1{font-size:26px;margin:0 0 8px}p{margin:0 0 24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}article{padding:12px;background:#fffaf0;border:1px solid #bccab1;border-radius:18px}h2{font-size:18px;margin:4px 4px 12px}img{display:block;width:100%;height:auto;border-radius:12px}a:focus-visible{outline:3px solid #527442}</style><h1>遊戲資訊列預覽</h1><p>實際手機尺寸畫面：時間、分數與連擊，保留聲音、暫停、重新開始。沒有連擊機制的遊戲顯示時間與分數。點圖片可放大。</p><main>'''+''.join(cards)+'</main></html>'
(base/'gallery.html').write_text(page,encoding='utf8')
print('Gallery ready: '+str(base/'gallery.html'))
