import type { LayerV2 } from '../types';

/**
 * Normalizza i layer di uno snapshot preventivo (DB-shape, snake_case con
 * `materials` joined) verso la forma V2 (camelCase con `material`) richiesta
 * da `wallModel`, `MiniSectionPreview` e dal builder.
 *
 * Necessario quando si renderizza dallo snapshot: senza questo adapter
 * `wallModel.classifyMaterial(layer)` legge `layer.material` come undefined
 * → "Nessun layer" / preview vuota.
 *
 * Idempotente: se il layer è già in V2-shape (ha `material`), lo passa così com'è.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSnapshotLayers(rawLayers: any[] | null | undefined): LayerV2[] {
  if (!Array.isArray(rawLayers)) return [];
  return rawLayers.map((l, idx) => {
    // Già in V2-shape: pass-through (lieve normalizzazione di id/position)
    if (l?.material && typeof l.material === 'object') {
      return {
        id: l.id ?? `snap-${idx}`,
        position: Number(l.position ?? idx + 1),
        materialId: l.materialId ?? l.material_id ?? l.material?.id ?? null,
        material: l.material,
        thickness: Number(l.thickness ?? 0),
        interAxis: l.interAxis ?? l.inter_axis ?? undefined,
        screwMaterialId: l.screwMaterialId ?? l.screw_material_id ?? null,
        screwMaterial: l.screwMaterial ?? l.screw_materials ?? null,
        screwQuantity: l.screwQuantity ?? l.screw_quantity ?? undefined,
        screwCostPerSqm: l.screwCostPerSqm ?? l.screw_cost_per_sqm ?? undefined,
      } as LayerV2;
    }
    // DB-shape: rimappa `materials` → `material` e `screw_materials` → `screwMaterial`.
    return {
      id: l?.id ?? `snap-${idx}`,
      position: Number(l?.position ?? idx + 1),
      materialId: l?.material_id ?? l?.materials?.id ?? null,
      material: l?.materials ?? null,
      thickness: Number(l?.thickness ?? 0),
      interAxis: l?.inter_axis ?? undefined,
      screwMaterialId: l?.screw_material_id ?? null,
      screwMaterial: l?.screw_materials ?? null,
      screwQuantity: l?.screw_quantity ?? undefined,
      screwCostPerSqm: l?.screw_cost_per_sqm ?? undefined,
    } as LayerV2;
  });
}
