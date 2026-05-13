# Export RDA (Resoconto Avanzamento Cantiere)

PDF A4 professionale per il cantiere. Refactor F13 ha portato da 1014 righe (codice complesso) a ~350 righe (pulito).

## File

`src/utils/export/exportCompleteRDA.ts`

## Layout

1. **Cover** — header org, dati progetto, totale preventivo
2. **Per stratigrafia**:
   - Nome + descrizione
   - Tabella layer (composizione completa)
   - Breakdown costo €/m² (materiali, viti, manodopera, finitura, totale)
   - Dimensioni e quantità
3. **Riepilogo materiali** — lista acquisti aggregata con sfridi
4. **Totali finali** — subtotale, finitura, totale generale

## Libreria

- `jspdf` v3
- `jspdf-autotable` v5 (tabelle)
- Footer paginato automatico

## Trigger

- Bottone "Stampa RDA" in `EstimateDetail.tsx`
- Action menu di una riga preventivo
