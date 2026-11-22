// En liten webbserver för testerna: serverar public/ med samma huvuden som Netlify sätter
// enligt netlify.toml, så att testerna ser samma säkerhetspolicy som den riktiga sidan.
// Körs med: node tests/server.mjs <port>

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', 'public');

// Huvudena under [[headers]] for = "/*" i netlify.toml. Filen är enkel nog att läsa rad för rad.
export function netlifyHeaders(toml = readFileSync(path.resolve(here, '..', 'netlify.toml'), 'utf8')) {
  const headers = {};
  let inValues = false;
  let forAll = false;
  for (const raw of toml.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('[[headers]]')) { inValues = false; forAll = false; continue; }
    if (/^for\s*=\s*"\/\*"/.test(line)) { forAll = true; continue; }
    if (line === '[headers.values]') { inValues = forAll; continue; }
    if (line.startsWith('[')) { inValues = false; continue; }
    const m = inValues && line.match(/^([A-Za-z-]+)\s*=\s*"(.*)"$/);
    if (m) headers[m[1]] = m[2];
  }
  return headers;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8', '.task': 'application/octet-stream'
};

export function startServer(port) {
  const headers = netlifyHeaders();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { ...headers, 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404, { ...headers, 'content-type': 'text/plain' }).end('Finns inte');
    }
  });
  server.listen(port, '127.0.0.1');
  return server;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  startServer(Number(process.argv[2]) || 8123);
}
