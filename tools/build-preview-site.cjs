const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const output = path.resolve(process.argv[3] || path.join(source, '_site'));
if (source === output || source.startsWith(output + path.sep) || output === path.parse(output).root) {
  throw new Error('Preview output must be separate from the source and its parent directories');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
// Publish runtime files only. Keep reports, reference snapshots and development
// attachments in Git without including them in the Pages download.
for (const entry of ['index.html', 'assets', 'games', 'shared']) {
  fs.cpSync(path.join(source, entry), path.join(output, entry), { recursive: true });
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
for (const entry of ['CNAME', 'robots.txt', 'favicon.ico']) {
  if (fs.existsSync(path.join(source, entry))) {
    fs.copyFileSync(path.join(source, entry), path.join(output, entry));
  }
}
function bytes(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((sum, entry) => {
    const file = path.join(directory, entry.name);
    return sum + (entry.isDirectory() ? bytes(file) : fs.statSync(file).size);
  }, 0);
}
const size = bytes(output);
if (size > 1_000_000_000) throw new Error('Preview exceeds the GitHub Pages 1 GB site limit');
console.log('Preview package: ' + (size / 1_000_000).toFixed(1) + ' MB at ' + output);
