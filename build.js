// Genereert een statische dist/index.html met de data ingebakken.
// Handig om op eender welke webhost (of Leho/Canvas) te zetten zonder server.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { getProposals } from './lib/airtable.js';

const proposals = await getProposals();
const payload = JSON.stringify({ proposals, updatedAt: new Date().toISOString() }).replace(/</g, '\\u003c');

const template = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');
const html = template.replace(
  '<script id="embedded-data" type="application/json"></script>',
  `<script id="embedded-data" type="application/json">${payload}</script>`,
);

await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await writeFile(new URL('./dist/index.html', import.meta.url), html);
console.log(`dist/index.html gegenereerd met ${proposals.length} stagevoorstellen.`);
