const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('preview package includes playable site files and excludes local snapshots', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'toenow-preview-'));
  try {
    const source = path.join(temp, 'source');
    const output = path.join(temp, 'output');
    const files = ['index.html', '.nojekyll', 'assets/vendor/pixi.js', 'games/example/main.js',
      'shared/toenow-sdk.js', 'artifacts/nested/snapshot/index.html', 'docs/report.md',
      '.codex-attachments/reference.png', '.env', 'tools/dev.cjs'];
    for (const file of files) {
      const target = path.join(source, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file);
    }
    fs.mkdirSync(output);
    fs.writeFileSync(path.join(output, 'stale.txt'), 'old deployment');
    const result = spawnSync(process.execPath, [path.join(__dirname, '../tools/build-preview-site.cjs'), source, output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    for (const file of files.slice(0, 5).filter(file => file !== '.nojekyll')) {
      assert.equal(fs.readFileSync(path.join(output, file), 'utf8'), file);
    }
    for (const excluded of ['artifacts', 'docs', '.codex-attachments', '.env', 'tools', 'stale.txt']) {
      assert.equal(fs.existsSync(path.join(output, excluded)), false, excluded + ' excluded');
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('Pages applies exclusions instead of publishing development snapshots', () => {
  const root = path.join(__dirname, '..');
  assert.equal(fs.existsSync(path.join(root, '.nojekyll')), false, 'Jekyll exclusions must be enabled');
  const config = JSON.parse(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'));
  for (const directory of ['artifacts', 'docs', 'tests', 'tools', 'node_modules']) {
    assert.ok(config.exclude.includes(directory), directory + ' excluded from Pages');
  }
  for (const runtime of ['assets', 'games', 'shared', 'index.html']) {
    assert.equal(config.exclude.includes(runtime), false, runtime + ' remains published');
  }
});
