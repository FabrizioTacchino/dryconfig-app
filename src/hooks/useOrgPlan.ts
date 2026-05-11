import { useCurrentOrganization } from '@/contexts/OrganizationContext';

/**
 * Codici dei piani SaaS (vedi docs/PRICING.md).
 *  - trial:  prova 7 giorni gratuita (= studio illimitato fino a scadenza)
 *  - solo:   piano base €19/mese (1 utente, limiti su preventivi/fornitori)
 *  - studio: piano centrale €49/mese (3 utenti, tutto sbloccato salvo team mgmt)
 *  - team:   piano enterprise €149/mese (10 utenti, ruoli avanzati, multi-org)
 *  - past_due / cancelled: stati di pagamento (futuro Lemon Squeezy)
 */
export type PlanCode = 'trial' | 'solo' | 'studio' | 'team' | 'past_due' | 'cancelled';

export interface PlanInfo {
  code: PlanCode;
  /** Etichetta italiana per UI. */
  label: string;
  /** Variante del Badge shadcn. */
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
}

const PLAN_META: Record<string, PlanInfo> = {
  trial:     { code: 'trial',     label: 'Trial',     variant: 'secondary' },
  solo:      { code: 'solo',      label: 'Solo',      variant: 'outline' },
  studio:    { code: 'studio',    label: 'Studio',    variant: 'default' },
  team:      { code: 'team',      label: 'Team',      variant: 'default' },
  past_due:  { code: 'past_due',  label: 'Sospeso',   variant: 'destructive' },
  cancelled: { code: 'cancelled', label: 'Cancellato', variant: 'destructive' },
};

/**
 * Ritorna il piano corrente dell'organization attiva.
 *
 * Sorgente: `organizations.plan` (oggi un campo testo libero in DB).
 * Quando arriverà la tabella `subscriptions` (post-billing Lemon Squeezy),
 * questa funzione si ridireziona là senza cambiare il contratto.
 */
export function useOrgPlan(): PlanInfo {
  const { currentOrganization } = useCurrentOrganization();
  const planCode = String(currentOrganization?.plan ?? 'trial').toLowerCase();
  return PLAN_META[planCode] ?? PLAN_META.trial;
}

/**
 * Feature-gates per piano. Lookup booleano centralizzato.
 * Quando i piani saranno completamente definiti, sposterò questa mappa
 * nel DB (tabella `plans.features`).
 */
export const PLAN_FEATURES: Record<PlanCode, {
  members: boolean;        // pagina gestione membri team (multi-utente)
  view3d: boolean;         // vista 3D fotorealistica (V2.4)
  pdfBranding: boolean;    // logo cliente nei PDF (no watermark)
  technicalSheet: boolean; // export PDF scheda tecnica V2
  unlimitedEstimates: boolean;
  apiAccess: boolean;
}> = {
  trial:     { members: true,  view3d: true,  pdfBranding: true,  technicalSheet: true,  unlimitedEstimates: true,  apiAccess: false },
  solo:      { members: false, view3d: false, pdfBranding: false, technicalSheet: false, unlimitedEstimates: false, apiAccess: false },
  studio:    { members: false, view3d: true,  pdfBranding: true,  technicalSheet: true,  unlimitedEstimates: true,  apiAccess: false },
  team:      { members: true,  view3d: true,  pdfBranding: true,  technicalSheet: true,  unlimitedEstimates: true,  apiAccess: true  },
  past_due:  { members: false, view3d: false, pdfBranding: false, technicalSheet: false, unlimitedEstimates: false, apiAccess: false },
  cancelled: { members: false, view3d: false, pdfBranding: false, technicalSheet: false, unlimitedEstimates: false, apiAccess: false },
};

/** Hook helper: ritorna se la feature è disponibile nel piano corrente. */
export function useHasFeature(feature: keyof typeof PLAN_FEATURES.trial): boolean {
  const plan = useOrgPlan();
  return PLAN_FEATURES[plan.code]?.[feature] ?? false;
}
