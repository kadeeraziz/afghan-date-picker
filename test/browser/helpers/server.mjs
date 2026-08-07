import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const ROOT = resolve(process.cwd());
const PORT = Number(process.argv.find((_, i) => process.argv[i - 1] === '--port') ?? 4311);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);
    const requested = resolve(join(ROOT, pathname));
    if (requested !== ROOT && !requested.startsWith(ROOT + sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const contents = await readFile(requested);
    res.writeHead(200, { 'Content-Type': MIME[extname(requested)] ?? 'application/octet-stream' });
    res.end(contents);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`afghan-date-picker test server listening on http://127.0.0.1:${PORT}`);
});