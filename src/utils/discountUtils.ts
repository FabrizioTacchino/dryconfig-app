/**
 * Calcola il prezzo finale applicando sconti cumulativi
 * @param price Prezzo di listino
 * @param discountStr Stringa di sconti separati da + (es. "50+25+5")
 * @returns Prezzo finale scontato
 */
export function applyCumulativeDiscounts(price: number, discountStr: string | null): number {
  if (!discountStr || discountStr.trim() === '') return price;
  
  try {
    return discountStr
      .split("+")
      .map(d => {
        const discount = parseFloat(d.trim());
        if (isNaN(discount) || discount < 0 || discount >= 100) {
          throw new Error(`Sconto non valido: ${d}`);
        }
        return discount / 100;
      })
      .reduce((acc, d) => acc * (1 - d), price);
  } catch (error) {
    console.warn('[discountUtils] ⚠️ Invalid discount format:', discountStr);
    return price; // Se lo sconto non è valido, usa il prezzo base
  }
}

/**
 * Valida una stringa di sconti
 * @param discountStr Stringa da validare
 * @returns true se valida, false altrimenti
 */
export function validateDiscountString(discountStr: string): boolean {
  if (!discountStr || discountStr.trim() === '') return true;
  
  try {
    const discounts = discountStr.split("+");
    return discounts.every(d => {
      const discount = parseFloat(d.trim());
      return !isNaN(discount) && discount >= 0 && discount < 100;
    });
  } catch {
    return false;
  }
}

/**
 * Calcola il prezzo finale da prezzo di listino e sconto
 * Se non c'è prezzo di listino, usa il prezzo unitario direttamente
 */
export function calculateFinalPrice(unitPrice: number, listPrice: number | null, discount: string | null): number {
  if (listPrice && discount) {
    return applyCumulativeDiscounts(listPrice, discount);
  } else if (listPrice && !discount) {
    return listPrice;
  }
  return unitPrice;
}