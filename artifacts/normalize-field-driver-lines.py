from pathlib import Path
for p in Path('tools').glob('verify-animal-*-browser.cjs'):
 data=p.read_bytes();p.write_bytes(data.replace(b'\r\n',b'\n'))
