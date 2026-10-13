// Genereert een statische dist/index.html met de data ingebakken.
// Handig om op eender welke webhost (of Leho/Canvas) te zetten zonder server.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { getProposals } from './lib/airtable.js';

// E-mailadressen niet leesbaar in de broncode zetten, zodat spambots ze niet zomaar oppikken.
// De pagina decodeert ze in de browser (omgekeerde base64).
const hideEmail = (email) => email ? [...Buffer.from(email, 'utf8').toString('base64')].reverse().join('') : '';

const proposals = (await getProposals()).map(({ email, ...p }) => ({ ...p, emailEnc: hideEmail(email) }));
const template = await readFile(new URL('./public/index.html', import.meta.url), 'utf8');

// Versie op basis van de inhoud: verandert enkel als de data of de pagina zelf wijzigt.
// GitHub Pages laat browsers de pagina 10 minuten cachen; via data.json (altijd vers opgevraagd)
// ziet een verouderde pagina dat er een nieuwe versie is en laadt ze zichzelf opnieuw.
const buildId = createHash('sha256').update(JSON.stringify(proposals)).update(template).digest('hex').slice(0, 12);
const updatedAt = new Date().toISOString();

// Umami (anonieme, cookieloze statistieken): enkel in de gepubliceerde versie, enkel op het echte domein.
// Paginabezoeken tellen we zelf (auto-track uit), anders telt elke filterwijziging als bezoek.
const umamiId = process.env.UMAMI_WEBSITE_ID;
const analytics = umamiId
  ? `<script defer src="https://cloud.umami.is/script.js" data-website-id="${umamiId}" data-domains="howestdevine.github.io" data-auto-track="false"></script>`
  : '';

const payload = JSON.stringify({ proposals, updatedAt, buildId }).replace(/</g, '\\u003c');
const html = template.replace('<!-- analytics -->', analytics).replace(
  '<script id="embedded-data" type="application/json"></script>',
  `<script id="embedded-data" type="application/json">${payload}</script>`,
);

await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await writeFile(new URL('./dist/index.html', import.meta.url), html);
await writeFile(new URL('./dist/data.json', import.meta.url), JSON.stringify({ buildId, updatedAt }));
console.log(`dist/index.html gegenereerd met ${proposals.length} stagevoorstellen (versie ${buildId}).`);
