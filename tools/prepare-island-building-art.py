"""Validate original alpha sprites and encode runtime copies; preserve every source PNG."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets' / 'island-buildings'
KINDS = ['observatory', 'lighthouse', 'station', 'music', 'workshop', 'garden', 'arch', 'lookout', 'temple', 'orbit']

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    entries = []
    manifest_path = DEST / 'manifest.json'
    previous = {entry['source']: entry for entry in json.loads(manifest_path.read_text(encoding='utf-8'))['assets']} if manifest_path.exists() else {}
    for kind in KINDS:
        for level in range(1, 6):
            stem = f'{kind}-level{level}'
            source = DEST / 'sources' / f'{stem}.png'
            provenance = DEST / 'sources' / f'{stem}.provenance.json'
            if not source.is_file() or not provenance.is_file():
                raise RuntimeError(f'Missing source/provenance: {stem}')
            with Image.open(source) as original:
                original.load()
                if original.mode != 'RGBA':
                    raise RuntimeError(f'Expected true alpha: {stem}')
                alpha = original.getchannel('A')
                if alpha.getextrema() != (0, 255):
                    raise RuntimeError(f'No transparent surroundings or opaque building: {stem}')
                bbox = alpha.getbbox()
                if not bbox or original.width < 800 or original.height < 800:
                    raise RuntimeError(f'Incomplete/high-resolution source missing: {stem}')
                # Technical texture encoding only: no crops, recolors or artistic modifications.
                runtime = original.copy()
                runtime.thumbnail((640, 640), Image.Resampling.LANCZOS)
                target = DEST / f'{stem}.webp'
                source_hash = sha(source)
                cached = previous.get(f'assets/island-buildings/sources/{stem}.png', {})
                if not (target.exists() and cached.get('sourceSha256') == source_hash and cached.get('runtimeSha256') == sha(target)):
                    runtime.save(target, 'WEBP', quality=88, method=6)
                with Image.open(target) as check:
                    check.load()
                    if check.mode != 'RGBA' or check.getchannel('A').getextrema() != (0, 255):
                        raise RuntimeError(f'Alpha lost in runtime texture: {stem}')
                entries.append({
                    'kind': kind, 'level': level,
                    'source': f'assets/island-buildings/sources/{stem}.png',
                    'runtime': f'assets/island-buildings/{stem}.webp',
                    'provenance': f'assets/island-buildings/sources/{stem}.provenance.json',
                    'sourceSize': list(original.size), 'runtimeSize': list(runtime.size),
                    'alphaBounds': list(bbox), 'sourceSha256': source_hash,
                    'runtimeSha256': sha(target), 'sourceBytes': source.stat().st_size,
                    'runtimeBytes': target.stat().st_size
                })
    if len({entry['sourceSha256'] for entry in entries}) != 50:
        raise RuntimeError('Every growth state must be a distinct illustration')
    manifest = {'version': 1, 'method': 'built-in image_gen', 'count': len(entries),
                'sourceBytes': sum(e['sourceBytes'] for e in entries),
                'runtimeBytes': sum(e['runtimeBytes'] for e in entries), 'assets': entries}
    (DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in manifest.items() if key != 'assets'}))

if __name__ == '__main__':
    main()
