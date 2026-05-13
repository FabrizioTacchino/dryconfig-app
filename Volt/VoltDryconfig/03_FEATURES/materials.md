# Materiali & sconti

## Catalogo

- `materials` tabella centrale (~1100 record live, principalmente Saint-Gobain dopo import reale)
- Campi tecnici ricchi: EN 520, categoria, supplier, prezzo, peso/m², λ, Rw, fire class, EPD, VOC, dimensioni, box_pieces, installation_time_per_sqm, waste_percentage
- `organization_id` NULL = materiale catalogo globale (visibile a tutte le org)
- `organization_id` valorizzato = materiale custom dell'org

## Suppliers

- `suppliers` table (global + per-org)
- 4 fornitori global: Saint-Gobain, Knauf, Fassa Bortolo, DryCore (system, nascosto dalla UI)
- UI: `/settings/suppliers` — admin+ può aggiungere fornitori della propria org

## Sconti riservati (PRICING)

Sistema sconti a 3 livelli:

1. **Famiglia** (`customer_discounts` + `supplier_product_families`): l'org ha sconti per famiglia listino (es. Gyproc Standard 50%, Eurocoustic 35%). Array `discounts NUMERIC[]` per cumulativi N livelli.
2. **Extra per materiale** (`materials.extra_discount`): override aggiuntivo SOPRA la famiglia per un singolo materiale.
3. **Legacy `discount` TEXT**: deprecato, migrato a customer_discounts (F19 chain).

## Vista `materials_with_pricing` — CRITICAL

**Single source of truth per prezzo NETTO**.

```sql
-- Calcola net_price = list_price applicando customer_discounts (famiglia)
-- e extra_discount (materiale). RLS-aware: vede solo l'org corrente.
```

⚠️ Usare SEMPRE questa view, MAI `materials.unit_price` raw. Vedi [[../08_GOTCHAS/prezzo-netto|gotcha prezzo netto]].

## Importer Saint-Gobain

`/materials/import` — wizard 4-step:
1. Upload Excel (template SG)
2. Parsing 7 sheet → preview
3. Conferma upsert (per `code`, evitare duplicati)
4. Archive missing (materiali non in import → soft delete)

**Parser** in `src/utils/import/saintGobainParser.ts`. Estrae anche `width`, `sheet_thickness`, `length` dal nome per popolare campi tecnici.

## UI materiali

- `Materials.tsx` — lista con filtri (fornitore, categoria, tipologia)
- `EditMaterialDialog` — edit campo per campo (admin only)
- `MaterialPriceTag` — componente che mostra netto + listino barrato + % sconto
- Banner riepilogo risparmio org (totale listino vs netto)
