// Sanity check on the Saint-Gobain parser without touching the DB.
// Run: node scripts/test-saintgobain-parser.mjs

import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

const FILE = './docs/sample_listini/FV_Listino Gyproc_3Febbraio2025_Rev.1.xlsx';

const norm = (v) => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
const findCol = (headers, patterns) => {
  for (const p of patterns) {
    const idx = headers.findIndex(h => norm(h).includes(norm(p)));
    if (idx >= 0) return idx;
  }
  return -1;
};
const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};
const toStr = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
};
const parseUnit = (v) => {
  const s = norm(v);
  if (s.includes('m²') || s.includes('m2') || s.includes('mq')) return 'mq';
  if (s.includes('ml')) return 'ml';
  if (s.includes('scatola')) return 'scatola';
  if (s.includes('sacco') || s.includes('flacone') || s.includes('cartuccia') || s.includes('secchio')) return 'pz';
  if (s.includes('kg')) return 'kg';
  if (/\bm\b/.test(s) && !s.includes('m²') && !s.includes('ml')) return 'm';
  if (s.includes('pezzo') || s.includes('pz')) return 'pz';
  return 'pz';
};

const SHEET_CONFIGS = [
  { match: ['lastre'], category: 'board' },
  { match: ['controsoffitti'], category: 'board' },
  { match: ['intonaci', 'stucchi'], category: 'other' },
  { match: ['profili'], category: 'structure_frame' },
  { match: ['accessori', 'sistemi'], category: 'accessory' },
];

const buf = readFileSync(FILE);
const wb = XLSX.read(buf, { type: 'buffer' });

let totalValid = 0, totalErrors = 0, totalWarnings = 0;
const familyCodes = new Set();
const samples = [];

for (const sheetName of wb.SheetNames) {
  const cfg = SHEET_CONFIGS.find(c => c.match.some(p => norm(sheetName).includes(p)));
  if (!cfg) {
    console.log(`Sheet "${sheetName}": SKIPPED (non riconosciuta)`);
    continue;
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const headers = rows[0].map(h => String(h ?? ''));

  const cols = {
    family: findCol(headers, ['fam. sconto', 'fam.sconto', 'famiglia']),
    code:   findCol(headers, ['codice articolo', 'codice']),
    name:   findCol(headers, ['prodotto', 'nome']),
    price:  findCol(headers, ['prezzo listino']),
    um:     findCol(headers, ['prezzo u.m.', 'prezzo um']),
    ean:    findCol(headers, ['ean']),
  };

  let valid = 0, errors = 0, warnings = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === null || c === '')) continue;
    const family = toStr(r[cols.family]);
    const code = toStr(r[cols.code]);
    const name = toStr(r[cols.name]);
    const price = toNum(r[cols.price]);

    if (!family || !code || !name) { errors++; continue; }
    if (price === null) { warnings++; continue; }

    familyCodes.add(family);
    valid++;
    if (samples.length < 3) {
      samples.push({ sheet: sheetName, family, code, name, price, unit: parseUnit(r[cols.um]), ean: toStr(r[cols.ean]) });
    }
  }
  totalValid += valid; totalErrors += errors; totalWarnings += warnings;
  console.log(`Sheet "${sheetName}" [${cfg.category}]: ${valid} validi, ${warnings} senza prezzo, ${errors} errori (su ${rows.length - 1} righe)`);
}

console.log(`\n=== TOTALE: ${totalValid} prodotti validi, ${totalWarnings} senza prezzo, ${totalErrors} errori ===`);
console.log(`Famiglie distinte trovate (${familyCodes.size}):`, [...familyCodes].sort().join(', '));
console.log(`\nPrimi 3 prodotti parsati:`);
samples.forEach(s => console.log('  ', s));
