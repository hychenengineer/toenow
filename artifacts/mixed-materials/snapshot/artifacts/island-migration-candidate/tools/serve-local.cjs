// Static development server, loopback only. No cloud deployment or writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8765);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.webm': 'video/webm', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let filename;
  try {
    filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
    if (!fs.statSync(filename).isFile()) throw new Error('Not a file');
  } catch { res.writeHead(404).end('Not found'); return; }
  const size = fs.statSync(filename).size;
  const headers = { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
  let start = 0, end = size - 1, status = 200;
  if (req.headers.range) {
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (range && (range[1] || range[2])) {
      start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
    } else start = size;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end) {
      res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end(); return;
    }
    status = 206;headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  res.writeHead(status, { ...headers, 'Content-Length': Math.max(0, end - start + 1) });
  if (req.method === 'HEAD' || size === 0) { res.end(); return; }
  fs.createReadStream(filename, { start, end }).on('error', () => res.destroy()).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`TOENOW local preview: http://127.0.0.1:${server.address().port}/`));
