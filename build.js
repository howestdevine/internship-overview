// Genereert een statische dist/index.html met de data ingebakken.
// Handig om op eender welke webhost (of Leho/Canvas) te zetten zonder server.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { getProposals } from './lib/airtable.js';

// E-mailadressen niet leesbaar in de broncode zetten, zodat spambots ze niet zomaar oppikken.
// De pagina decodeert ze in de browser (omgekeerde base64).
const hideEmail = (email) => email ? [...Buffer.from(email, 'utf8').toString('base64')].reverse().join('') : '';

const proposals = (await getProposals()).map(({ email, ...p }) => ({ ...p, emailEnc: hideEmail(email) }));
const payload = JSON.stringify({ proposals, updatedAt: new Date().toISOString() }).replace(/</g, '\\u003c');

const template = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');
const html = template.replace(
  '<script id="embedded-data" type="application/json"></script>',
  `<script id="embedded-data" type="application/json">${payload}</script>`,
);

await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await writeFile(new URL('./dist/index.html', import.meta.url), html);
console.log(`dist/index.html gegenereerd met ${proposals.length} stagevoorstellen.`);
