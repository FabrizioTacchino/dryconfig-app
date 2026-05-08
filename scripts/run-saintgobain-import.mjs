// One-shot import of Saint-Gobain listino into Supabase using service_role key.
// Reuses the same parsing logic as src/lib/import/saintGobainParser.ts
// Run: node scripts/run-saintgobain-import.mjs

import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const FILE = './docs/sample_listini/FV_Listino Gyproc_3Febbraio2025_Rev.1.xlsx';
const SUPPLIER_SLUG = 'saint-gobain';
const ARCHIVE_MISSING = true;

// --- Read service key from env (or key.txt.txt as fallback) ---
let serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!serviceKey) {
  try {
    const keyContent = readFileSync('./key.txt.txt', 'utf-8');
    serviceKey = keyContent.match(/service_role:\s*([^\s\n]+)/)?.[1];
  } catch { /* file missing */ }
}
const url = 'https://aifeyamngllcezkoxzxu.supabase.co';
if (!serviceKey) {
  console.error('Service role key mancante. Setta SUPABASE_SERVICE_KEY env var o crea key.txt.txt');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// --- Parser helpers (mirror of saintGobainParser.ts) ---
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
const parseDelivery = (v) => {
  const s = norm(v);
  if (s.includes('verde')) return 'verde';
  if (s.includes('giallo')) return 'giallo';
  if (s.includes('bianco')) return 'bianco';
  return null;
};
const parseUnit = (v) => {
  const s = norm(v);
  if (s.includes('m²') || s.includes('m2') || s.includes('mq')) return 'mq';
  if (s.includes('ml')) return 'ml';
  if (s.includes('scatola')) return 'scatola';
  if (s.includes('sacco') || s.includes('flacone') || s.includes('cartuccia') || s.includes('secchio')) return 'pz';
  if (s.includes('kg')) return 'kg';
  if (/\bm\b/.test(s) && !s.includes('m²') && !s.includes('ml')) return 'm';
  return 'pz';
};

const SHEET_CONFIGS = [
  { match: ['lastre'], category: 'board' },
  { match: ['controsoffitti'], category: 'board' },
  { match: ['intonaci', 'stucchi'], category: 'other' },
  { match: ['profili'], category: 'structure_frame' },
  { match: ['accessori', 'sistemi'], category: 'accessory' },
];

const buildCols = (headers) => ({
  family_code: findCol(headers, ['fam. sconto', 'fam.sconto', 'famiglia']),
  code:        findCol(headers, ['codice articolo', 'codice']),
  name:        findCol(headers, ['prodotto', 'nome']),
  delivery:    findCol(headers, ['tempo fornitura', 'tempo']),
  length:      findCol(headers, ['lunghezza']),
  width:       findCol(headers, ['larghezza']),
  thickness:   findCol(headers, ['spessore']),
  weight:      findCol(headers, ['peso']),
  list_price:  findCol(headers, ['prezzo listino']),
  price_um:    findCol(headers, ['prezzo u.m.', 'prezzo um']),
  ean:         findCol(headers, ['ean']),
  bordo:       findCol(headers, ['bordo']),
  dimensioni:  findCol(headers, ['dimensioni']),
  modulo:      findCol(headers, ['modulo']),
  sezione:     findCol(headers, ['sezione']),
});

// --- Parse file ---
console.log(`[1/5] Lettura file: ${FILE}`);
const buf = readFileSync(FILE);
const wb = XLSX.read(buf, { type: 'buffer' });

const parsed = [];
const warnings = [];
const errors = [];

for (const sheetName of wb.SheetNames) {
  const cfg = SHEET_CONFIGS.find(c => c.match.some(p => norm(sheetName).includes(p)));
  if (!cfg) {
    console.log(`  Sheet "${sheetName}" ignorata`);
    continue;
  }
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (rows.length < 2) continue;

  const headers = rows[0].map(h => String(h ?? ''));
  const cols = buildCols(headers);
  const isProfile = cfg.category === 'structure_frame';

  let valid = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === null || c === '')) continue;

    const family_code = toStr(r[cols.family_code]);
    const code = toStr(r[cols.code]);
    const name = toStr(r[cols.name]);
    const list_price = toNum(r[cols.list_price]);

    if (!family_code || !code || !name) {
      errors.push({ sheet: sheetName, row: i + 1, reason: 'campi obbligatori mancanti' });
      continue;
    }
    if (list_price === null) {
      warnings.push(`${sheetName} riga ${i + 1}: ${code} senza prezzo, saltato`);
      continue;
    }

    const descParts = [];
    if (cols.bordo >= 0)      { const v = toStr(r[cols.bordo]);     if (v) descParts.push(`Bordo: ${v}`); }
    if (cols.dimensioni >= 0) { const v = toStr(r[cols.dimensioni]); if (v) descParts.push(`Dim.: ${v}`); }
    if (cols.modulo >= 0)     { const v = toStr(r[cols.modulo]);    if (v) descParts.push(`Modulo: ${v}`); }
    if (cols.sezione >= 0)    { const v = toStr(r[cols.sezione]);   if (v) descParts.push(`Sezione: ${v}`); }

    const weight = toNum(r[cols.weight]);
    parsed.push({
      family_code,
      code,
      name,
      category: cfg.category,
      list_price,
      unit: parseUnit(r[cols.price_um]),
      thickness: toNum(r[cols.thickness]),
      length: toNum(r[cols.length]),
      width: toNum(r[cols.width]),
      weight_per_sqm: isProfile ? null : weight,
      weight_per_ml:  isProfile ? weight : null,
      ean_code: toStr(r[cols.ean]),
      delivery_indicator: parseDelivery(r[cols.delivery]),
      description: descParts.length ? descParts.join(' · ') : null,
    });
    valid++;
  }
  console.log(`  Sheet "${sheetName}": ${valid} prodotti validi`);
}

console.log(`\n[2/5] Parser: ${parsed.length} validi, ${warnings.length} warning, ${errors.length} errori`);

// --- Resolve supplier_id ---
const { data: sup, error: supErr } = await supabase
  .from('suppliers')
  .select('id, name')
  .eq('slug', SUPPLIER_SLUG)
  .is('organization_id', null)
  .single();
if (supErr) throw supErr;
console.log(`[3/5] Supplier: ${sup.name} (${sup.id})`);

// --- Resolve family ids ---
const distinctCodes = [...new Set(parsed.map(p => p.family_code))];
const { data: families, error: famErr } = await supabase
  .from('supplier_product_families')
  .select('id, code')
  .eq('supplier_id', sup.id)
  .in('code', distinctCodes);
if (famErr) throw famErr;
const familyMap = new Map(families.map(f => [f.code, f.id]));
const unknown = distinctCodes.filter(c => !familyMap.has(c));
console.log(`[4/5] Famiglie: ${familyMap.size} risolte, ${unknown.length} sconosciute (${unknown.join(', ')})`);

// --- Build payloads ---
const payloads = parsed.map(r => ({
  code: r.code,
  name: r.name,
  description: r.description,
  category: r.category,
  supplier: 'Saint Gobain',
  supplier_id: sup.id,
  family_id: familyMap.get(r.family_code) ?? null,
  family_code: r.family_code,
  unit: r.unit,
  list_price: r.list_price,
  unit_price: r.list_price,
  thickness: r.thickness ?? 0,
  length: r.length,
  width: r.width,
  weight_per_sqm: r.weight_per_sqm ?? 0,
  weight_per_ml: r.weight_per_ml,
  ean_code: r.ean_code,
  delivery_indicator: r.delivery_indicator,
  is_active: true,
}));

// --- Upsert in chunks ---
console.log(`[5/5] Upsert ${payloads.length} prodotti in chunk di 100...`);
const CHUNK = 100;
let inserted = 0, updated = 0, failed = 0;
const failures = [];

// First, snapshot existing codes to count insert vs update
const allCodes = payloads.map(p => p.code);
const existingCodes = new Set();
for (let i = 0; i < allCodes.length; i += 500) {
  const batch = allCodes.slice(i, i + 500);
  const { data: ex, error: exErr } = await supabase
    .from('materials')
    .select('code')
    .in('code', batch);
  if (exErr) throw exErr;
  ex.forEach(r => existingCodes.add(r.code));
}

for (let i = 0; i < payloads.length; i += CHUNK) {
  const slice = payloads.slice(i, i + CHUNK);
  const { error } = await supabase.from('materials').upsert(slice, { onConflict: 'code' });
  if (error) {
    // Retry one by one
    for (const p of slice) {
      const { error: e1 } = await supabase.from('materials').upsert([p], { onConflict: 'code' });
      if (e1) {
        failed++;
        failures.push({ code: p.code, reason: e1.message });
      }
    }
  }
  process.stdout.write(`\r  Importati ${Math.min(i + CHUNK, payloads.length)}/${payloads.length}…`);
}
console.log();

for (const r of parsed) {
  if (failures.some(f => f.code === r.code)) continue;
  if (existingCodes.has(r.code)) updated++; else inserted++;
}

// --- Archive missing ---
let archived = 0;
if (ARCHIVE_MISSING) {
  const codeSet = new Set(allCodes);
  const { data: allActive, error: arErr } = await supabase
    .from('materials')
    .select('id, code')
    .eq('supplier_id', sup.id)
    .eq('is_active', true);
  if (arErr) throw arErr;
  const toArchive = allActive.filter(m => !codeSet.has(m.code));
  if (toArchive.length > 0) {
    for (let i = 0; i < toArchive.length; i += CHUNK) {
      const ids = toArchive.slice(i, i + CHUNK).map(x => x.id);
      const { error } = await supabase.from('materials').update({ is_active: false }).in('id', ids);
      if (error) throw error;
      archived += ids.length;
    }
  }
}

console.log(`\n=== RIEPILOGO ===`);
console.log(`  Inseriti:   ${inserted}`);
console.log(`  Aggiornati: ${updated}`);
console.log(`  Archiviati: ${archived}`);
console.log(`  Falliti:    ${failed}`);
if (failures.length > 0) {
  console.log(`\nPrime 10 fail:`);
  failures.slice(0, 10).forEach(f => console.log(`  ${f.code}: ${f.reason}`));
}
console.log(`\nFamiglie sconosciute (prodotti caricati ma SENZA sconto):`);
unknown.forEach(c => {
  const sample = parsed.find(p => p.family_code === c);
  console.log(`  ${c}: es. "${sample?.name}"`);
});
