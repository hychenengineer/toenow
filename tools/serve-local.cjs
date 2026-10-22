// Static development server, loopback only. No cloud deployment or writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8765);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
http.createServer((req, res) => {
  let filename;
  try {
    filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
    if (!fs.statSync(filename).isFile()) throw new Error('Not a file');
  } catch { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(filename).on('error', () => res.destroy()).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`TOENOW local preview: http://127.0.0.1:${port}/`));
