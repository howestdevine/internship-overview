// Haalt de records uit de Airtable-view op en zet ze om naar een eenvoudig formaat.

const KNOWN_FIELDS = {
  firstName: 'Contactpersoon voornaam',
  lastName: 'Contactpersoon naam',
  email: 'E-mailadres',
  website: 'Website URL',
  description: 'Omschrijving stagevoorstel',
  tags: 'Tags',
  country: 'Land',
  city: 'Regio',
};

const TITLE_CANDIDATES = ['Bedrijf/Organisatie', 'Bedrijf', 'Bedrijfsnaam', 'Naam bedrijf', 'Bedrijf naam', 'Naam', 'Name'];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Ontbrekende configuratie: ${name} (zie .env.example)`);
  return value;
}

async function fetchAllRecords() {
  const token = requireEnv('AIRTABLE_TOKEN');
  // Een geplakt URL-pad (app…/tbl…/viw…) wordt ook aanvaard
  const ids = requireEnv('AIRTABLE_BASE_ID');
  const baseId = ids.match(/app[A-Za-z0-9]+/)?.[0] ?? ids;
  const table = ids.match(/tbl[A-Za-z0-9]+/)?.[0] ?? requireEnv('AIRTABLE_TABLE');
  const view = ids.match(/viw[A-Za-z0-9]+/)?.[0] ?? (process.env.AIRTABLE_VIEW || 'Overzicht');

  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set('view', view);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable gaf ${res.status}: ${body}`);
    }
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

function pickTitle(fields) {
  if (process.env.TITLE_FIELD) return fields[process.env.TITLE_FIELD];
  for (const name of TITLE_CANDIDATES) if (fields[name]) return fields[name];
  // Terugval: eerste tekstveld dat geen van de gekende velden is
  const known = new Set(Object.values(KNOWN_FIELDS));
  const entry = Object.entries(fields).find(([k, v]) => !known.has(k) && typeof v === 'string' && v.length < 120);
  return entry ? entry[1] : '';
}

function normalizeUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function toProposal(record) {
  const f = record.fields;
  const tags = f[KNOWN_FIELDS.tags];
  return {
    id: record.id,
    company: String(pickTitle(f) || '').trim(),
    contact: [f[KNOWN_FIELDS.firstName], f[KNOWN_FIELDS.lastName]].filter(Boolean).join(' ').trim(),
    email: (f[KNOWN_FIELDS.email] || '').trim(),
    website: normalizeUrl(f[KNOWN_FIELDS.website]),
    description: (f[KNOWN_FIELDS.description] || '').trim(),
    country: (f[KNOWN_FIELDS.country] || '').trim(),
    city: (f[KNOWN_FIELDS.city] || '').trim(),
    created: f.Created || record.createdTime,
    tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
  };
}

export async function getProposals() {
  let records = await fetchAllRecords();

  const statusField = process.env.STATUS_FIELD;
  const statusValue = process.env.STATUS_VALUE;
  if (statusField && statusValue) {
    const wanted = statusValue.toLowerCase();
    records = records.filter((r) => String(r.fields[statusField] ?? '').toLowerCase() === wanted);
  }

  return records.map(toProposal).filter((p) => p.company || p.description);
}
