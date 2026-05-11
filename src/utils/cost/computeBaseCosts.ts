/**
 * Calcolo costi base condiviso fra:
 *  - useIntegratedStratigraphySave (salvataggio stratigrafia)
 *  - useBulkUpdateEstimateStratigraphyPrices (aggiorna prezzi preventivo, bulk)
 *  - useUpdateEstimateStratigraphy (single-row aggiorna)
 *
 * NOTA F4 (chiusura): il configuratore V2 (preview live) usa una formula
 * DIVERSA in `computeStratigraphyCosts` (category-aware: ml/m² montanti,
 * cover % isolante, ecc.). Quella è più sofisticata per il rendering del
 * breakdown, ma per il save i due flussi ora hanno la STESSA unità di
 * tempo (minuti). La divergenza residua sta solo nel modo di calcolare le
 * quantità (incidence_per_sqm flat qui vs category-aware là). Tollerabile
 * finché incidence_per_sqm dei materiali è ben popolato.
 *
 * Convenzione tempo posa:
 *  - `materials.installation_time_per_sqm` nel DB è in ORE per unità del
 *    materiale (es. 0.10 = 6 min/m² per una lastra). L'adapter converte
 *    in MINUTI per coerenza con il resto della formula.
 */

/** Minuti di posa per ogni vite (stima media; da rendere configurabile in futuro). */
export const SCREW_INSTALL_MIN_PER_PIECE = 0.03;

/**
 * Forma normalizzata di un layer per il calcolo costi.
 * - `material === null` → layer "vuoto", ignorato dai totali (e contato come invalid).
 * - Spessori 0 → ignorato dai totali.
 */
export interface CalcLayer {
  thickness: number;
  material: {
    unitPrice: number;
    incidencePerSqm: number;
    /** Minuti di posa per m² (interpretato come MINUTI, non ore). */
    installationTimeMinutes: number;
  } | null;
  /** Costo viti €/m² già pre-calcolato (computeScrewCostPerSqm) o 0. */
  screwCostPerSqm: number;
  /** Quantità viti per m² (per il calcolo manodopera viti). */
  screwQuantityPerSqm: number;
}

export interface BaseCostResult {
  /** Materiali €/m² (somma incidence × unit_price). */
  materialCost: number;
  /** Viti €/m² (somma screwCostPerSqm dei layer). */
  screwCost: number;
  /** Manodopera €/m² (installTime × costPerHour / 60). */
  laborCost: number;
  /** Tempo posa min/m² (materiali + viti). */
  installationTime: number;
  /** Costo totale arrotondato a 2 decimali (€/m²). */
  comprehensiveCost: number;
  /** Layer effettivamente conteggiati (material valido + thickness > 0). */
  validLayerCount: number;
  /** Layer ignorati (material null o thickness <= 0). */
  invalidLayerCount: number;
}

export function computeBaseCosts(
  layers: CalcLayer[],
  costPerHour: number,
): BaseCostResult {
  let materialCost = 0;
  let screwCost = 0;
  let laborCost = 0;
  let installationTime = 0;
  let validLayerCount = 0;
  let invalidLayerCount = 0;

  for (const layer of layers) {
    const isValid = !!layer.material && layer.thickness > 0;
    if (!isValid) {
      invalidLayerCount++;
      continue;
    }
    validLayerCount++;
    const m = layer.material!;

    materialCost += (m.unitPrice || 0) * (m.incidencePerSqm || 1);

    const baseInstallTime = m.installationTimeMinutes || 0;
    const screwInstallTime = (layer.screwQuantityPerSqm || 0) * SCREW_INSTALL_MIN_PER_PIECE;
    const layerInstallTime = baseInstallTime + screwInstallTime;
    installationTime += layerInstallTime;

    laborCost += (layerInstallTime * costPerHour) / 60;
    screwCost += layer.screwCostPerSqm || 0;
  }

  const comprehensiveCost = Math.round((materialCost + screwCost + laborCost) * 100) / 100;

  return {
    materialCost: Math.round(materialCost * 1000) / 1000,
    screwCost: Math.round(screwCost * 1000) / 1000,
    laborCost: Math.round(laborCost * 1000) / 1000,
    installationTime: Math.round(installationTime * 1000) / 1000,
    comprehensiveCost,
    validLayerCount,
    invalidLayerCount,
  };
}

/**
 * Adapter: layer in forma "DB joined" (snake_case, da query Supabase su
 * `layers` con join su `materials`) → CalcLayer normalizzato.
 *
 * Il record DB tipicamente ha:
 * - thickness, screw_cost_per_sqm, screw_quantity
 * - materials: { unit_price, incidence_per_sqm, installation_time_per_sqm }
 *
 * Il join può venire dall'embed `materials!layers_material_id_fkey(...)`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dbLayerToCalcLayer(dbLayer: any): CalcLayer {
  const mat = dbLayer?.materials ?? null;
  // installation_time_per_sqm nel DB è in ORE → converto in MINUTI.
  // Senza questa conversione la manodopera veniva sottostimata ~60x
  // (preview V2 aveva la formula giusta, save no — F4 chiusura).
  const installTimeHours = Number(mat?.installation_time_per_sqm ?? 0);
  const installTimeMinutes = installTimeHours * 60;
  return {
    thickness: Number(dbLayer?.thickness ?? 0),
    material: mat
      ? {
          unitPrice: Number(mat.unit_price ?? 0),
          incidencePerSqm: Number(mat.incidence_per_sqm ?? 1),
          installationTimeMinutes: installTimeMinutes,
        }
      : null,
    screwCostPerSqm: Number(dbLayer?.screw_cost_per_sqm ?? 0),
    screwQuantityPerSqm: Number(dbLayer?.screw_quantity ?? 0),
  };
}
