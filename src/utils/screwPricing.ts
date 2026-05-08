/**
 * Calcolo prezzo viti — utility centralizzata.
 *
 * Le viti sono vendute a SCATOLA (es. €7,00 / scatola da 1000 pz),
 * ma in stratigrafia si consumano A NUMERO (es. 17 viti/m²).
 *
 * Senza dividere per box_pieces, moltiplicare unit_price (€/scatola) per
 * la quantità a m² produrrebbe un costo enormemente sovrastimato.
 *
 * Esempio: TN25 €7/scatola da 1000 pz, 17 viti/m²
 *   prezzo per pezzo = 7 / 1000 = €0,007/pz
 *   costo per m²    = 0,007 × 17 = €0,119/m²
 *
 * Senza box_pieces: 7 × 17 = €119/m² (sbagliato di 1000×).
 */

interface ScrewLike {
  unit?: string | null;
  unit_price?: number | null;
  list_price?: number | null;
  box_pieces?: number | null;
  net_price?: number | null;
}

/**
 * Prezzo per pezzo (€/pz). Se l'unità è "scatola" e box_pieces è valorizzato,
 * divide il prezzo della scatola per il numero di pezzi. Altrimenti restituisce
 * il prezzo unitario così com'è (assunto già €/pz).
 */
export function getScrewPricePerPiece(screw: ScrewLike | null | undefined): number {
  if (!screw) return 0;
  // net_price arriva dalla view materials_with_pricing (è il netto reale per l'org).
  // unit_price come fallback per chiamanti che non passano dalla view.
  const boxPrice = Number(screw.net_price ?? screw.unit_price ?? screw.list_price ?? 0);
  if (!Number.isFinite(boxPrice) || boxPrice <= 0) return 0;

  const unit = String(screw.unit ?? '').toLowerCase().trim();
  const box = Number(screw.box_pieces ?? 0);

  if (unit === 'scatola' && box > 0) {
    return boxPrice / box;
  }
  return boxPrice;
}

/**
 * Costo viti per m² in funzione della densità (viti/m²).
 *   cost_per_sqm = price_per_piece × screws_per_sqm
 */
export function computeScrewCostPerSqm(
  screw: ScrewLike | null | undefined,
  screwsPerSqm: number,
): number {
  const pricePerPiece = getScrewPricePerPiece(screw);
  const qty = Number(screwsPerSqm) || 0;
  if (!Number.isFinite(pricePerPiece) || !Number.isFinite(qty) || qty <= 0) return 0;
  return pricePerPiece * qty;
}

/** Formattazione € per pz con 4 decimali (le viti costano frazioni di centesimo). */
export function formatPiecePrice(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return '€0,0000';
  return `€${price.toFixed(4)}`;
}
