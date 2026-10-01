// Kleine webserver: serveert de pagina en een /api/proposals endpoint.
// Het Airtable-token blijft op de server en komt nooit in de browser terecht.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { getProposals } from './lib/airtable.js';

const PORT = Number(process.env.PORT || 3000);
const CACHE_MS = Number(process.env.CACHE_SECONDS || 300) * 1000;

let cache = { data: null, fetchedAt: 0 };

async function cachedProposals() {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_MS) return cache;
  cache = { data: await getProposals(), fetchedAt: Date.now() };
  return cache;
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname === '/api/proposals') {
      const { data, fetchedAt } = await cachedProposals();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ proposals: data, updatedAt: new Date(fetchedAt).toISOString() }));
      return;
    }
    if (pathname === '/' || pathname === '/index.html') {
      const html = await readFile(new URL('./public/index.html', import.meta.url));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Niet gevonden');
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => console.log(`Stage-overzicht draait op http://localhost:${PORT}`));
