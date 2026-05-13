# Preventivi & workflow

## Flusso

1. **Crea progetto** → un progetto raccoglie più preventivi (versioni / cantieri)
2. **Crea preventivo** dentro un progetto (status `draft`)
3. **Aggiungi stratigrafie** dal configuratore o dalla lista catalogo
4. **Workflow stati**: `draft` → `pending` → `approved` → `contracted`
5. **Contracted = freeze**: niente più modifiche prezzi/composizione

## Snapshot pattern

`estimate_stratigraphies` è uno **snapshot**: contiene la composizione e i prezzi al momento dell'aggiunta. Se il catalogo cambia, lo snapshot **non cambia automaticamente** — l'utente clicca "Aggiorna prezzi" per ricalcolare.

Campi snapshot:
- `unit_cost` — €/m² **finito** (comprehensive + finitura)
- `total_cost` — `unit_cost × area × quantity`
- `stratigraphy_data` — JSON snapshot della stratigrafia originale
- `layers_data` — JSON snapshot layer + materiali joined
- `finish_level` (Q1-Q4) + `finish_cost_per_sqm` + `finish_components_data` (BOM)
- `prices_updated_at`

## Convenzioni costo

- **`unit_cost`** = comprehensive (parete) + finish (BOM finitura)
- **`finish_cost_per_sqm`** = solo finitura (separato per audit)
- **`total_cost`** = `unit_cost × area × quantity` (precomputed)

⚠️ La convenzione deve essere identica fra `useCreateEstimateStratigraphy` e `useBulkUpdateEstimateStratigraphyPrices`. Storica divergenza vedi [[../04_BUGS/F20-finish-cost-list-vs-net|F20]].

## Aggiorna prezzi

Funzioni:
- **Single-row** (icona ↻ sulla riga): `updateStratigraphyPrices` in `useEstimateStratigraphies` — delega al bulk con 1 elemento + toast specifico
- **Bulk** (bottone "Aggiorna prezzi" sopra la lista): `useBulkUpdateEstimateStratigraphyPrices` — itera + report strutturato

Skip-reason possibili (mostrate nel dialog risultato):
- `no_original_stratigraphy`: snapshot orfano senza FK
- `original_not_found`: la stratigrafia originale è stata eliminata dal catalogo
- `zero_cost_recalc`: ricalcolo darebbe 0€ (composizione corrotta) — non sovrascrive
- `no_valid_layers`: tutti i layer senza materiale/spessore

## Stratigrafia orfana

Se l'utente elimina la stratigrafia catalogo originale:
- La riga preventivo resta (snapshot)
- Indicatore "originale eliminata" + dialog "Ricollega al catalogo" (composition match via fingerprint)
- Escape valve: "Crea stratigrafia da snapshot orfano" → ricrea nel catalogo
- Edit prezzo manuale per row orfana

## Riepilogo materiali

Pagina dedicata che aggrega tutti i layer del preventivo + viti + finitura, applica sfridi per categoria/materiale, e produce lista acquisti. Vedi `useMaterialsSummary`.

## RDA (Resoconto Avanzamento Cantiere)

Export PDF A4 professionale: cover + per-stratigrafia detail + materiali summary + totali. Vedi [[export-rda]].
