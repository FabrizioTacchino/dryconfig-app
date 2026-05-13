import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

/**
 * Forma tipizzata di `organizations.settings` (JSONB).
 * Tutti i campi sono opzionali per retro-compatibilità con org create prima
 * di F22.
 */
export interface OrgSettings {
  // ====== Anagrafica & branding (F22) ======
  /** Public URL del logo (Supabase Storage bucket org-logos). */
  logo_url?: string;
  /** Ragione sociale completa (es. "Impresa B4T S.r.l."). Usata in RDA. */
  company_name?: string;
  /** Indirizzo (via, numero civico). */
  address_line?: string;
  /** Città. */
  city?: string;
  /** CAP. */
  zip_code?: string;
  /** Provincia (sigla 2 lettere, es. "MI"). */
  province?: string;
  /** Telefono di contatto. */
  phone?: string;
  /** Email pubblica/PEC. */
  email?: string;
  /** Sito web. */
  website?: string;

  // ====== Pricing engine (F23) ======
  /** Mark-up % sui materiali (default 25). */
  markup_materials_pct?: number;
  /** Mark-up % sulla manodopera (default 70). */
  markup_labor_pct?: number;
  /** Mark-up % sulla finitura (default 30). */
  markup_finish_pct?: number;
  /** Spese generali % sul costo totale (default 10). */
  overhead_pct?: number;
  /** Sicurezza/DPI/ponteggi % sul costo totale (default 0). */
  safety_pct?: number;
  /** Trasporto materiali a cantiere forfait € (default 0). */
  transport_flat?: number;
  /** Smaltimento rifiuti forfait € (default 0). */
  disposal_flat?: number;
  /** Sconto cliente default % applicato dopo i mark-up (default 0). */
  default_customer_discount_pct?: number;

  // ====== IVA & validità (F27) ======
  /** IVA default % (default 22, alcune ristrutturazioni 10). */
  iva_pct?: number;
  /** Validità offerta in giorni (default 30). */
  offer_validity_days?: number;
  /** Acconto richiesto all'ordine % (default 30). */
  payment_advance_pct?: number;
  /** Acconto a metà lavori % (default 40). */
  payment_mid_pct?: number;
  /** Saldo a fine lavori % (default 30). */
  payment_balance_pct?: number;
  /** Termini di consegna (testo libero). */
  delivery_terms?: string;
  /** Garanzia (testo libero). */
  warranty_terms?: string;
  /** Note legali / Termini & Condizioni del PDF (testo libero multi-riga). */
  terms_text?: string;

  // ====== Numerazione offerte (F25) ======
  /** Prefisso numerazione offerte (es. "OFF" -> "OFF-2026/001"). */
  offer_number_prefix?: string;
  /** Formato: 'YEAR_SLASH' (2026/001) o 'YEAR_DASH' (2026-001). */
  offer_number_format?: 'YEAR_SLASH' | 'YEAR_DASH';
}

/** Default valori pricing (usati se mancanti in settings). */
export const PRICING_DEFAULTS = {
  markup_materials_pct: 25,
  markup_labor_pct: 70,
  markup_finish_pct: 30,
  overhead_pct: 10,
  safety_pct: 0,
  transport_flat: 0,
  disposal_flat: 0,
  default_customer_discount_pct: 0,
  iva_pct: 22,
  offer_validity_days: 30,
  payment_advance_pct: 30,
  payment_mid_pct: 40,
  payment_balance_pct: 30,
  offer_number_prefix: 'OFF',
  offer_number_format: 'YEAR_SLASH' as const,
} satisfies Required<Pick<OrgSettings,
  | 'markup_materials_pct' | 'markup_labor_pct' | 'markup_finish_pct'
  | 'overhead_pct' | 'safety_pct' | 'transport_flat' | 'disposal_flat'
  | 'default_customer_discount_pct' | 'iva_pct' | 'offer_validity_days'
  | 'payment_advance_pct' | 'payment_mid_pct' | 'payment_balance_pct'
  | 'offer_number_prefix' | 'offer_number_format'
>>;

/**
 * Forma anagrafica completa dell'org (settings + colonne dedicate del DB).
 * Quello che vede l'utente nella form e che usano gli export PDF.
 */
export interface OrgProfile extends OrgSettings {
  /** Da `organizations.name`. */
  name: string;
  /** Da `organizations.vat_number`. Tenuto fuori da settings perché esiste colonna. */
  vat_number?: string | null;
}

/**
 * Fetcha il profilo completo dell'org corrente: nome + vat_number (colonne)
 * + tutto ciò che sta dentro `settings` JSONB.
 */
export function useOrgProfile() {
  const { currentOrganizationId } = useCurrentOrganization();
  return useQuery<OrgProfile | null>({
    queryKey: ['org-profile', currentOrganizationId],
    enabled: !!currentOrganizationId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!currentOrganizationId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('name, vat_number, settings')
        .eq('id', currentOrganizationId)
        .single();
      if (error) {
        console.error('[useOrgProfile] error:', error);
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = (data?.settings as any) ?? {};
      return {
        name: data?.name ?? '',
        vat_number: data?.vat_number ?? null,
        // Anagrafica
        logo_url: settings.logo_url,
        company_name: settings.company_name,
        address_line: settings.address_line,
        city: settings.city,
        zip_code: settings.zip_code,
        province: settings.province,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        // Pricing
        markup_materials_pct: settings.markup_materials_pct,
        markup_labor_pct: settings.markup_labor_pct,
        markup_finish_pct: settings.markup_finish_pct,
        overhead_pct: settings.overhead_pct,
        safety_pct: settings.safety_pct,
        transport_flat: settings.transport_flat,
        disposal_flat: settings.disposal_flat,
        default_customer_discount_pct: settings.default_customer_discount_pct,
        // IVA & validità
        iva_pct: settings.iva_pct,
        offer_validity_days: settings.offer_validity_days,
        payment_advance_pct: settings.payment_advance_pct,
        payment_mid_pct: settings.payment_mid_pct,
        payment_balance_pct: settings.payment_balance_pct,
        delivery_terms: settings.delivery_terms,
        warranty_terms: settings.warranty_terms,
        terms_text: settings.terms_text,
        // Numerazione
        offer_number_prefix: settings.offer_number_prefix,
        offer_number_format: settings.offer_number_format,
      };
    },
  });
}

interface UpdateOrgProfilePayload {
  name?: string;
  vat_number?: string | null;
  // Tutti gli altri sono dentro settings
  company_name?: string;
  address_line?: string;
  city?: string;
  zip_code?: string;
  province?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string | null;
  // Pricing
  markup_materials_pct?: number;
  markup_labor_pct?: number;
  markup_finish_pct?: number;
  overhead_pct?: number;
  safety_pct?: number;
  transport_flat?: number;
  disposal_flat?: number;
  default_customer_discount_pct?: number;
  // IVA & validità
  iva_pct?: number;
  offer_validity_days?: number;
  payment_advance_pct?: number;
  payment_mid_pct?: number;
  payment_balance_pct?: number;
  delivery_terms?: string;
  warranty_terms?: string;
  terms_text?: string;
  // Numerazione
  offer_number_prefix?: string;
  offer_number_format?: 'YEAR_SLASH' | 'YEAR_DASH';
}

export function useUpdateOrgProfile() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (patch: UpdateOrgProfilePayload) => {
      if (!currentOrganizationId) throw new Error('Nessuna organizzazione attiva');
      // Leggi le settings correnti per merge (no overwrite distruttivo)
      const { data: current, error: fetchErr } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', currentOrganizationId)
        .single();
      if (fetchErr) throw fetchErr;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentSettings = ((current?.settings as any) ?? {}) as OrgSettings;
      const settingsKeys: Array<keyof OrgSettings> = [
        // Anagrafica
        'company_name', 'address_line', 'city', 'zip_code', 'province',
        'phone', 'email', 'website', 'logo_url',
        // Pricing
        'markup_materials_pct', 'markup_labor_pct', 'markup_finish_pct',
        'overhead_pct', 'safety_pct', 'transport_flat', 'disposal_flat',
        'default_customer_discount_pct',
        // IVA & validità
        'iva_pct', 'offer_validity_days', 'payment_advance_pct',
        'payment_mid_pct', 'payment_balance_pct', 'delivery_terms',
        'warranty_terms', 'terms_text',
        // Numerazione
        'offer_number_prefix', 'offer_number_format',
      ];
      const newSettings: OrgSettings = { ...currentSettings };
      for (const k of settingsKeys) {
        if (k in patch) {
          const v = (patch as Record<string, unknown>)[k];
          // null/undefined → cancella; "" (string vuota) → cancella; 0 → ammesso.
          if (v == null || (typeof v === 'string' && v === '')) {
            delete newSettings[k];
          } else {
            (newSettings[k] as unknown) = v;
          }
        }
      }
      const updatePayload: Record<string, unknown> = { settings: newSettings };
      if ('name' in patch && patch.name) updatePayload.name = patch.name;
      if ('vat_number' in patch) updatePayload.vat_number = patch.vat_number || null;
      const { error: updateErr } = await supabase
        .from('organizations')
        .update(updatePayload)
        .eq('id', currentOrganizationId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile', currentOrganizationId] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      toast.success('Anagrafica organizzazione aggiornata');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}

/**
 * Upload del logo nel bucket `org-logos`. Il path è `{org_id}/logo.{ext}`,
 * con upsert (ogni nuovo upload sovrascrive il precedente). Ritorna il
 * public URL pronto per essere salvato in `settings.logo_url`.
 */
export function useUploadOrgLogo() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!currentOrganizationId) throw new Error('Nessuna organizzazione attiva');
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Logo troppo grande (max 2MB)');
      }
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!allowed.includes(file.type)) {
        throw new Error('Formato non supportato (usa PNG, JPG, SVG o WebP)');
      }
      // Estensione dal MIME (più robusto del nome file)
      const extByMime: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/svg+xml': 'svg',
        'image/webp': 'webp',
      };
      const ext = extByMime[file.type] ?? 'png';
      const path = `${currentOrganizationId}/logo.${ext}`;
      // upsert: sovrascrivi se esiste già
      const { error: uploadErr } = await supabase.storage
        .from('org-logos')
        .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
      if (uploadErr) throw uploadErr;
      // Public URL + cache-buster per forzare reload dopo upsert
      const { data: pub } = supabase.storage.from('org-logos').getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;
      // Aggiorna settings.logo_url sulla riga organizations
      const { data: current } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', currentOrganizationId)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSettings = { ...(current?.settings as any ?? {}), logo_url: publicUrl };
      const { error: updateErr } = await supabase
        .from('organizations')
        .update({ settings: newSettings })
        .eq('id', currentOrganizationId);
      if (updateErr) throw updateErr;
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile', currentOrganizationId] });
      toast.success('Logo caricato');
    },
    onError: (err: Error) => toast.error(`Errore upload: ${err.message}`),
  });
}

export function useRemoveOrgLogo() {
  const queryClient = useQueryClient();
  const { currentOrganizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async () => {
      if (!currentOrganizationId) throw new Error('Nessuna organizzazione attiva');
      // Elimina tutti i file nel folder dell'org (logo può avere ext diverse)
      const { data: files } = await supabase.storage
        .from('org-logos')
        .list(currentOrganizationId);
      if (files && files.length > 0) {
        const paths = files.map(f => `${currentOrganizationId}/${f.name}`);
        await supabase.storage.from('org-logos').remove(paths);
      }
      // Pulisci settings.logo_url
      const { data: current } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', currentOrganizationId)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSettings = { ...(current?.settings as any ?? {}) };
      delete newSettings.logo_url;
      const { error } = await supabase
        .from('organizations')
        .update({ settings: newSettings })
        .eq('id', currentOrganizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile', currentOrganizationId] });
      toast.success('Logo rimosso');
    },
    onError: (err: Error) => toast.error(`Errore: ${err.message}`),
  });
}
