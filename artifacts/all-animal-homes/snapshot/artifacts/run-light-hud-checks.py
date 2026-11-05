import subprocess,os,pathlib,json
root=pathlib.Path.cwd()
node=r'C:\Users\HsinYuChen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
env=os.environ.copy();env['NODE_PATH']=r'C:\Users\HsinYuChen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
print('NODE',node,flush=True)
mode=__import__('sys').argv[1] if len(__import__('sys').argv)>1 else 'unit'
if mode=='serve':
 env['PORT']='8774';subprocess.run([node,'tools/serve-local.cjs'],env=env)
else:
 args={'unit':['--test']+json.loads((root/'package.json').read_text())['scripts']['test'].split()[2:],
 'browser':['tools/verify-light-hud-browser.cjs'],
 'screens':['tools/verify-shared-screens-browser.cjs']}[mode]
 env['TOENOW_TEST_URL']='http://127.0.0.1:8774'
 if mode=='unit':
  # npm's installed project runtime is Node 20; its navigator mock is not a Node 24 mock.
  node=r'C:\Program Files\nodejs\node.exe'
  args=[r'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js','test']
 if len(__import__('sys').argv)>2: env['TOENOW_TEST_GAMES']=__import__('sys').argv[2]
 temporary=None
 if mode=='screens':
  # Network-independent local screen regression; production game code stays intact.
  temporary=root/'tools/.light-hud-shared-screens.cjs'
  source=(root/'tools/verify-shared-screens-browser.cjs').read_text(encoding='utf8')
  source=source.replace('async function instrument(page, id) {', "async function instrument(page, id) {\n  await page.route('https://**',route=>route.abort());")
  source=source.replace("await embedded.goto(base+'/');", "await embedded.goto(base+'/',{waitUntil:'domcontentloaded'});")
  source=source.replace("await page.goto(base+'/games/'+id+'/');", "await page.goto(base+'/games/'+id+'/',{waitUntil:'domcontentloaded'});")
  source=source.replace("const page = await browser.newPage({viewport:{width,height:850}});", "console.log('CHECK shared '+id+' '+width+' '+lang); const page = await browser.newPage({viewport:{width,height:850}});")
  temporary.write_text(source,encoding='utf8');args=[str(temporary)]
  if len(__import__('sys').argv)>2: env['TOENOW_TEST_GAMES']=__import__('sys').argv[2]
 with open(root/f'artifacts/light-hud-{mode}.log','w',encoding='utf8') as log:
  result=subprocess.run([node]+args,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=600)
 if temporary: temporary.unlink()
 print((root/f'artifacts/light-hud-{mode}.log').read_text(encoding='utf8')[-5000:],flush=True)
 raise SystemExit(result.returncode)
