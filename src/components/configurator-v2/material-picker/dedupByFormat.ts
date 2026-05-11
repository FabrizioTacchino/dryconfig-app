import type { DatabaseMaterial } from '@/hooks/useMaterials';

/**
 * Raggruppa i materiali "tecnicamente identici" (stesso nome, fornitore,
 * categoria, spessore, material_type, en_520, board_typology, width) ma con
 * formati diversi (length).
 *
 * Esempio reale: "Gyproc Wallboard 10" esiste in 4 codici Saint-Gobain con
 * length 2000/2500/2800/3000 e prezzo €/mq identico. Per il configuratore
 * (che ragiona in €/mq) sono UNA SOLA scelta — la differenza di codice è
 * dettaglio del BOM finale, non della stratigrafia.
 *
 * Il representative è la variante più lunga (più diffusa in cantiere); le
 * varianti restano accessibili in `MaterialGroup.variants` per pickare il
 * codice esatto al momento della distinta materiali.
 */
export interface MaterialGroup {
  representative: DatabaseMaterial;
  variants: DatabaseMaterial[];
  /** Etichette formato leggibili: ["2.0 m", "2.5 m", "3.0 m"]. Vuoto se nessun length. */
  formats: string[];
}

function canonicalKey(m: DatabaseMaterial): string {
  return [
    (m.name ?? '').toLowerCase().trim(),
    m.supplier ?? '',
    m.category ?? '',
    String(m.thickness ?? ''),
    m.material_type ?? '',
    m.en_520_type ?? '',
    m.board_typology ?? '',
    String(m.width ?? ''),
  ].join('|');
}

function formatLabel(lengthMm: number | null | undefined): string | null {
  if (!lengthMm || lengthMm <= 0) return null;
  return `${(Number(lengthMm) / 1000).toFixed(1)} m`;
}

export function groupByFormat(materials: DatabaseMaterial[]): MaterialGroup[] {
  const map = new Map<string, DatabaseMaterial[]>();
  for (const m of materials) {
    const key = canonicalKey(m);
    const arr = map.get(key);
    if (arr) arr.push(m);
    else map.set(key, [m]);
  }

  return Array.from(map.values()).map(group => {
    const sorted = [...group].sort((a, b) => (Number(b.length) || 0) - (Number(a.length) || 0));
    const rep = sorted[0];
    const formats = Array.from(
      new Set(group.map(m => formatLabel(m.length)).filter((x): x is string => Boolean(x))),
    ).sort();
    return { representative: rep, variants: group, formats };
  });
}
