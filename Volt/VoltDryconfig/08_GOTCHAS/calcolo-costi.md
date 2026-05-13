# Gotcha: calcolo costi stratigrafia

## Regola d'oro

**`computeStratigraphyCosts` è l'unica formula valida per i costi di una stratigrafia.**

Path: `src/components/configurator-v2/hooks/computeStratigraphyCosts.ts`

## Quando NON crearne un'altra

Mai. Tentazione tipica: "scrivo una mini-formula inline qui per fare X". → divergenza inevitabile.

Se serve un calcolo derivato (es. solo materiali, solo manodopera), **chiama `computeStratigraphyCosts` e poi estrai il sotto-totale**.

## Chi la usa oggi (dopo F19/F20)

- 📈 Preview configuratore (`ConfiguratorV2.tsx` → `breakdown.totalCost`)
- 💾 Save (`useIntegratedStratigraphySave.ts`)
- 🔁 Bulk update preventivo (`useBulkUpdateEstimateStratigraphyPrices.tsx`)
- 🔁 Update catalogo (`useUpdateGeneralStratigraphyPrices.tsx`)

Tutti **devono** convergere sullo stesso numero per la stessa stratigrafia (a meno di cambi prezzi catalogo tra save e update).

## Convenzioni unità

- `installation_time_per_sqm` nel DB è in **ORE** per unità del materiale. Internamente la formula converte in MINUTI (× 60). Mai trattarlo come minuti diretti — bug storico F19 / F4.
- `comprehensive_cost_per_sqm` salvato in DB **non include la finitura** (vive solo a livello stratigrafia, non preventivo).
- `unit_cost` in `estimate_stratigraphies` **include la finitura** (è il "prezzo finito al m²" che vede l'utente nel preventivo).

## Quando il valore preview ≠ valore DB

Casi legittimi:
- L'utente ha modificato la composizione nel configuratore ma non ha ancora salvato → preview ≠ DB
- Le tabelle prezzi sono cambiate dopo il save → DB stale, "Aggiorna prezzi" lo allinea
- `stud_spacing_mm` è NULL in DB ma la stratigrafia fu pensata per un passo specifico → bug F20.3 (risolto)

Casi ILLEGITTIMI:
- Stesso DB, stesso load → preview ≠ save = BUG, indagare subito.

## Test minimo dopo una modifica al costo

1. Crea stratigrafia di test (3+ layer con board, struttura, finitura)
2. Annota €/m² in preview
3. Salva → check lista catalogo
4. Riapri configuratore → check preview (deve essere uguale)
5. Aggiungi a preventivo → check unit_cost
6. "Aggiorna prezzi" sul preventivo → unit_cost non deve cambiare
