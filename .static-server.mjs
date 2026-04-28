import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.css':'text/css; charset=utf-8' };
const server = http.createServer((req,res)=>{
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
    if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    const stream = createReadStream(file);
    stream.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end('error'); });
    stream.pipe(res);
  } catch (error) {
    res.writeHead(500); res.end(error.message);
  }
});
server.listen(8081, '0.0.0.0', () => console.log('static server listening on 8081'));
