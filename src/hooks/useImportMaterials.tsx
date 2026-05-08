import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import type { ParsedMaterial } from '@/lib/import/saintGobainParser';
import { toast } from 'sonner';

export interface ImportProgress {
  step: 'resolving_families' | 'upserting' | 'archiving' | 'done';
  processed: number;
  total: number;
  message?: string;
}

export interface ImportSummary {
  inserted: number;
  updated: number;
  archived: number;
  failed: number;
  failures: { code: string; reason: string }[];
}

interface ImportArgs {
  supplier_id: string;
  rows: ParsedMaterial[];
  /** If true, materials of this supplier whose code is no longer in the file
   *  are archived (is_active = false). */
  archive_missing: boolean;
  onProgress?: (p: ImportProgress) => void;
}

const CHUNK = 100;

const chunk = <T,>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export const useImportMaterials = () => {
  const { currentOrganizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplier_id,
      rows,
      archive_missing,
      onProgress,
    }: ImportArgs): Promise<ImportSummary> => {
      const summary: ImportSummary = { inserted: 0, updated: 0, archived: 0, failed: 0, failures: [] };

      // 1) Resolve family_id for every distinct family_code in the file
      const distinctCodes = Array.from(new Set(rows.map(r => r.family_code)));
      onProgress?.({ step: 'resolving_families', processed: 0, total: distinctCodes.length });

      const { data: families, error: famErr } = await supabase
        .from('supplier_product_families')
        .select('id, code')
        .eq('supplier_id', supplier_id)
        .in('code', distinctCodes);
      if (famErr) throw famErr;

      const familyMap = new Map((families ?? []).map(f => [f.code, f.id as string]));
      const unknownCodes = distinctCodes.filter(c => !familyMap.has(c));
      if (unknownCodes.length > 0) {
        // We let the caller decide: rows with unknown family will fail the upsert below
        console.warn('Family codes not found in DB:', unknownCodes);
      }

      // 2) Find which codes already exist (to count insert vs update)
      const codes = rows.map(r => r.code);
      const existing = new Set<string>();
      for (const c of chunk(codes, 200)) {
        const { data: ex, error: exErr } = await supabase
          .from('materials')
          .select('code')
          .in('code', c);
        if (exErr) throw exErr;
        ex?.forEach(r => existing.add(r.code));
      }

      // 3) Build payloads
      const payloads = rows.map(r => ({
        code: r.code,
        name: r.name,
        description: r.description,
        category: r.category,
        supplier: 'Saint Gobain',          // legacy text field
        supplier_id,
        family_id: familyMap.get(r.family_code) ?? null,
        family_code: r.family_code,
        unit: r.unit,
        list_price: r.list_price,
        unit_price: r.list_price,           // for now: net price computed elsewhere; legacy field
        thickness: r.thickness ?? 0,
        length: r.length,
        width: r.width,
        weight_per_sqm: r.weight_per_sqm ?? 0,
        weight_per_ml: r.weight_per_ml,
        ean_code: r.ean_code,
        delivery_indicator: r.delivery_indicator,
        // Classification fields (popolati dal classifier saintGobainParser)
        material_type: r.material_type,
        board_type: r.board_type,
        en_520_type: r.en_520_type,
        humidity_resistance_class: r.humidity_resistance_class,
        fire_class: r.fire_class,
        board_typology: r.board_typology,
        profile_type: r.profile_type,
        sheet_thickness: r.sheet_thickness,
        is_active: true,
      }));

      // 4) Upsert in chunks (onConflict: 'code')
      onProgress?.({ step: 'upserting', processed: 0, total: payloads.length });
      let processed = 0;
      for (const c of chunk(payloads, CHUNK)) {
        const { error } = await supabase
          .from('materials')
          .upsert(c, { onConflict: 'code' });
        if (error) {
          // try one-by-one to capture which row(s) caused the error
          for (const p of c) {
            const { error: e1 } = await supabase
              .from('materials')
              .upsert([p], { onConflict: 'code' });
            if (e1) {
              summary.failed++;
              summary.failures.push({ code: p.code, reason: e1.message });
            }
          }
        }
        processed += c.length;
        onProgress?.({ step: 'upserting', processed, total: payloads.length });
      }

      // 5) Compute insert vs update from the existing set
      for (const r of rows) {
        if (summary.failures.some(f => f.code === r.code)) continue;
        if (existing.has(r.code)) summary.updated++;
        else summary.inserted++;
      }

      // 6) Archive missing materials of this supplier (optional)
      if (archive_missing) {
        onProgress?.({ step: 'archiving', processed: 0, total: 0 });
        const codeSet = new Set(codes);
        const { data: allOfSupplier, error: supErr } = await supabase
          .from('materials')
          .select('id, code')
          .eq('supplier_id', supplier_id)
          .eq('is_active', true);
        if (supErr) throw supErr;
        const toArchive = (allOfSupplier ?? []).filter(m => !codeSet.has(m.code));
        if (toArchive.length > 0) {
          for (const c of chunk(toArchive, CHUNK)) {
            const ids = c.map(x => x.id);
            const { error: archErr } = await supabase
              .from('materials')
              .update({ is_active: false })
              .in('id', ids);
            if (archErr) throw archErr;
            summary.archived += c.length;
          }
        }
      }

      onProgress?.({ step: 'done', processed: payloads.length, total: payloads.length });
      return summary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials', null] });
      toast.success('Import completato.');
    },
    onError: (e: any) => toast.error(`Errore import: ${e.message}`),
  });
};
