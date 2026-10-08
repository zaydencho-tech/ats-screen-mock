import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 8003);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
await readFile(path.join(root, 'index.html')).catch(() => { throw new Error('먼저 npm run build를 실행하세요.'); });
const server = createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const url = new URL(req.url || '/', 'http://localhost');
    let name = decodeURIComponent(url.pathname);
    if (name === '/healthz') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, project: 'ats-screen-mock', screens: 5 })); return; }
    if (name === '/' || /^\/screens\/(dashboard|job-postings|apply|interviews|offers)\/?$/.test(name)) name = '/index.html';
    if (name === '/render' || name === '/render/') name = '/render/index.html';
    const filename = path.resolve(root, '.' + name);
    if (!filename.startsWith(root + path.sep)) { res.writeHead(404); res.end(); return; }
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('화면을 찾을 수 없습니다.'); }
});
server.listen(port, host, () => console.log(`ATS mock: http://${host}:${server.address().port} (5 original screens, local fixtures)`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
