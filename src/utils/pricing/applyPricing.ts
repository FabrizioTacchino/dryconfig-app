import type { OrgSettings } from '@/hooks/useOrgSettings';
import { PRICING_DEFAULTS } from '@/hooks/useOrgSettings';

/**
 * Costo di base di un preventivo (somma di tutte le voci di costo PRIMA dei
 * mark-up). Le tre componenti sono separate perché applichiamo mark-up
 * diversi (i materiali tipicamente +25%, la manodopera +70%).
 */
export interface CostBase {
  /** Costo materiali + viti netto (€). */
  materials: number;
  /** Costo manodopera netto (€). */
  labor: number;
  /** Costo finitura (materiali finitura + labor finitura) netto (€). */
  finish: number;
  /** Superficie totale del preventivo, m². Serve per spalmare i forfait. */
  totalArea?: number;
}

/**
 * Risultato del calcolo prezzo vendita: scomposto per audit e per il PDF.
 * Tutti i valori sono in €.
 */
export interface SellingBreakdown {
  // ====== Costi base (input) ======
  costMaterials: number;
  costLabor: number;
  costFinish: number;
  costBase: number; // somma

  // ====== Mark-up sui costi diretti ======
  markupMaterials: number;
  markupLabor: number;
  markupFinish: number;
  markupTotal: number;

  // ====== Costi accessori (applicati DOPO i mark-up) ======
  overhead: number;     // % sul subtotale (cost + markup)
  safety: number;       // % sul subtotale
  transport: number;    // forfait
  disposal: number;     // forfait
  accessoriesTotal: number;

  // ====== Prezzo lordo (prima dello sconto cliente) ======
  grossPrice: number;   // costBase + markupTotal + accessoriesTotal

  // ====== Sconto cliente ======
  customerDiscountPct: number;
  customerDiscount: number;

  // ====== Imponibile (prezzo offerta IVA esclusa) ======
  netPrice: number;     // grossPrice - customerDiscount

  // ====== IVA ======
  ivaPct: number;
  ivaAmount: number;

  // ====== Totale finale (IVA inclusa) ======
  totalPrice: number;
}

function pct(base: number, percent: number): number {
  return base * (percent / 100);
}

/**
 * Applica la pipeline di pricing al costo base di un preventivo.
 *
 * Flusso:
 *   costo materiali  + markup materiali %  -> mat_finale
 *   costo manodopera + markup manodopera % -> lab_finale
 *   costo finitura   + markup finitura %   -> fin_finale
 *   subtotale = mat_finale + lab_finale + fin_finale
 *   + overhead % (spese generali)
 *   + safety % (sicurezza/DPI/ponteggi)
 *   + trasporto forfait
 *   + smaltimento forfait
 *   = grossPrice (prezzo lordo)
 *   - sconto cliente %
 *   = netPrice (imponibile IVA esclusa)
 *   + IVA %
 *   = totalPrice (totale fattura)
 *
 * Tutte le percentuali vengono lette da `settings` con fallback a defaults
 * tipici cartongesso (vedi PRICING_DEFAULTS).
 *
 * `customerDiscountOverride` permette di passare uno sconto specifico per il
 * preventivo (es. promo cliente) invece di usare quello default dell'org.
 */
export function applyPricing(
  base: CostBase,
  settings: OrgSettings | null | undefined,
  customerDiscountOverride?: number,
): SellingBreakdown {
  const s = settings ?? {};
  const getPct = (key: keyof typeof PRICING_DEFAULTS, fallback: number): number => {
    const v = s[key as keyof OrgSettings];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    return fallback;
  };

  const costMaterials = Number(base.materials) || 0;
  const costLabor = Number(base.labor) || 0;
  const costFinish = Number(base.finish) || 0;
  const costBase = costMaterials + costLabor + costFinish;

  // Mark-up
  const mMat = getPct('markup_materials_pct', PRICING_DEFAULTS.markup_materials_pct);
  const mLab = getPct('markup_labor_pct', PRICING_DEFAULTS.markup_labor_pct);
  const mFin = getPct('markup_finish_pct', PRICING_DEFAULTS.markup_finish_pct);
  const markupMaterials = pct(costMaterials, mMat);
  const markupLabor = pct(costLabor, mLab);
  const markupFinish = pct(costFinish, mFin);
  const markupTotal = markupMaterials + markupLabor + markupFinish;

  // Subtotale (costi + markup)
  const subtotal = costBase + markupTotal;

  // Costi accessori
  const oPct = getPct('overhead_pct', PRICING_DEFAULTS.overhead_pct);
  const sPct = getPct('safety_pct', PRICING_DEFAULTS.safety_pct);
  const overhead = pct(subtotal, oPct);
  const safety = pct(subtotal, sPct);
  const transport = Number(s.transport_flat ?? PRICING_DEFAULTS.transport_flat) || 0;
  const disposal = Number(s.disposal_flat ?? PRICING_DEFAULTS.disposal_flat) || 0;
  const accessoriesTotal = overhead + safety + transport + disposal;

  // Prezzo lordo
  const grossPrice = subtotal + accessoriesTotal;

  // Sconto cliente
  const customerDiscountPct = customerDiscountOverride != null
    ? Number(customerDiscountOverride) || 0
    : getPct('default_customer_discount_pct', PRICING_DEFAULTS.default_customer_discount_pct);
  const customerDiscount = pct(grossPrice, customerDiscountPct);

  // Imponibile
  const netPrice = grossPrice - customerDiscount;

  // IVA
  const ivaPct = getPct('iva_pct', PRICING_DEFAULTS.iva_pct);
  const ivaAmount = pct(netPrice, ivaPct);

  // Totale
  const totalPrice = netPrice + ivaAmount;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    costMaterials: round2(costMaterials),
    costLabor: round2(costLabor),
    costFinish: round2(costFinish),
    costBase: round2(costBase),
    markupMaterials: round2(markupMaterials),
    markupLabor: round2(markupLabor),
    markupFinish: round2(markupFinish),
    markupTotal: round2(markupTotal),
    overhead: round2(overhead),
    safety: round2(safety),
    transport: round2(transport),
    disposal: round2(disposal),
    accessoriesTotal: round2(accessoriesTotal),
    grossPrice: round2(grossPrice),
    customerDiscountPct,
    customerDiscount: round2(customerDiscount),
    netPrice: round2(netPrice),
    ivaPct,
    ivaAmount: round2(ivaAmount),
    totalPrice: round2(totalPrice),
  };
}
