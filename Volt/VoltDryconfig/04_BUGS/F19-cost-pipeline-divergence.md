# F19 — Costi: 5 valori diversi per stessa stratigrafia

**Data risoluzione**: 2026-05-13
**Severità**: 🔴 critica (rompeva fiducia nel prodotto)
**Commit**: `f747d1d` — `fix(F19): unify cost calculation across configurator pipeline`

## Sintomo

Stessa stratigrafia mostrava 5 valori €/m² diversi:
- Preview configuratore: €5.84
- Lista catalogo: €2.44
- Riapertura: €11.73
- Add to estimate: €7.44
- Dopo "Aggiorna prezzi": €11.28

## Root cause (3 bug concatenati)

### A) save sottostimava manodopera 60×
`useIntegratedStratigraphySave` aveva una formula custom inline che leggeva `installation_time_per_sqm` come **MINUTI**. Il preview invece lo leggeva come **ORE** (correttamente, × 60 per minuti). Risultato: la manodopera salvata era 1/60 del preview.

### B) reload leggeva listino, non netto
Il join Supabase via FK (`materials!layers_material_id_fkey`) carica `materials.unit_price` raw. Per i materiali catalogo globale (`organization_id = NULL`), il trigger `recompute_unit_price_for_material` non scatta mai perché filtra `WHERE cd.organization_id = m.organization_id`. Quindi `unit_price` resta uguale a `list_price`. La VIEW `materials_with_pricing` invece applica gli sconti via RLS dell'org corrente, e dava il NETTO.

### C) bulk update aveva una terza formula
`useBulkUpdateEstimateStratigraphyPrices` aveva una sua formula category-blind (incidence flat) diversa sia dal save sia dal preview.

## Fix

Tutti convergono su **`computeStratigraphyCosts`** (la funzione del preview V2, category-aware):
- `useIntegratedStratigraphySave.ts` — usa computeStratigraphyCosts
- `useBulkUpdateEstimateStratigraphyPrices.tsx` — idem + override unit_price con materials_with_pricing
- `useUpdateGeneralStratigraphyPrices.tsx` — idem
- `useStratigraphy.ts` (load) — override unit_price con materials_with_pricing dopo il join

## Lezioni

- **Single source of truth** per i calcoli ovunque. Formule duplicate divergono inevitabilmente.
- **VIEW > raw column** per prezzi che dipendono da RLS context.
- **Test cross-surface**: una modifica al calc costo va verificata su preview + save + reload + bulk + display.

Vedi anche [[F20-finish-cost-list-vs-net|F20]] per il fix finitura che è seguito.
