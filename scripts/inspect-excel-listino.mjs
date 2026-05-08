// One-off script: inspects an Excel listino and reports structure.
// Run with:  node scripts/inspect-excel-listino.mjs <path-to-xlsx>

import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputPath = process.argv[2] ?? './docs/sample_listini/FV_Listino Gyproc_3Febbraio2025_Rev.1.xlsx';
const absPath = resolve(inputPath);

console.log(`\n=== Inspecting: ${absPath} ===\n`);

const buffer = readFileSync(absPath);
const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });

console.log(`Workbook sheets: ${wb.SheetNames.length}`);
wb.SheetNames.forEach((sheetName, idx) => {
  const ws = wb.Sheets[sheetName];
  const ref = ws['!ref'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  console.log(`\n--- Sheet ${idx + 1}: "${sheetName}" (range: ${ref}, rows: ${rows.length}) ---`);

  // First 5 rows raw
  console.log('First 5 rows:');
  rows.slice(0, 5).forEach((row, i) => {
    console.log(`  [${i}]`, JSON.stringify(row).slice(0, 250));
  });

  // Try to detect header row (first row with mostly strings)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i];
    if (!r) continue;
    const nonEmpty = r.filter(c => c !== null && c !== '').length;
    const stringCount = r.filter(c => typeof c === 'string').length;
    if (nonEmpty >= 3 && stringCount / nonEmpty >= 0.6) {
      headerIdx = i;
      break;
    }
  }
  console.log(`Detected header row: ${headerIdx}`);
  if (rows[headerIdx]) {
    const headers = rows[headerIdx].map(h => (h ?? '').toString().trim());
    console.log('Columns:', headers);
  }

  // Sample data rows (3 rows after header)
  console.log('Sample data rows (after header):');
  for (let i = headerIdx + 1; i <= headerIdx + 3 && i < rows.length; i++) {
    const r = rows[i];
    if (r && r.some(v => v !== null && v !== '')) {
      console.log(`  [${i}]`, JSON.stringify(r).slice(0, 350));
    }
  }
});
