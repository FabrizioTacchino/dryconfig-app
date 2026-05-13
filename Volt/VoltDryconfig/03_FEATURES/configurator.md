# Configuratore V2

Il **builder principale** di stratigrafie. Entry point: `/configurator` (o `/configurator/:id` per edit).

## Flusso

1. **Wizard 3-vie**: Cerca esistente / Parti da certificata / Da zero
2. **Builder**: drag&drop layer (dnd-kit), material picker (cmdk command palette filtrato), preview SVG live + 3D
3. **Tab**: Composizione, Costi (breakdown stile fattura), Pianta (vista top con interasse), Tecnico (scheda catalogo), 3D
4. **Salva** ▾: salva / salva e aggiungi a preventivo (split button)

## State

- `useConfiguratorState` (in `src/components/configurator-v2/hooks/useConfiguratorState.ts`)
- Holds: `id`, `name`, `description`, `layers: LayerV2[]`, `isDirty`, `isSaving`, `studSpacingMm`

## Calcolo costi (CRITICO)

**Single source of truth**: `src/components/configurator-v2/hooks/computeStratigraphyCosts.ts`.

Usata da:
- 📈 preview live (configuratore)
- 💾 save (`useIntegratedStratigraphySave`)
- 🔁 bulk update preventivo (`useBulkUpdateEstimateStratigraphyPrices`)
- 🔁 update catalogo (`useUpdateGeneralStratigraphyPrices`)

Formula category-aware:
- `board / ceiling_tile / finish`: 1 m²/m²
- `structure_frame` (montante): `1000 / studSpacingMm` ml/m²
- `structure_guide`: `2 / WALL_HEIGHT_M` ml/m² (default H=2.7m)
- `insulation`: cover factor `(passo - widthMont) / passo`
- `screw`: già `screwCostPerSqm` su layer

Manodopera: `installation_time_per_sqm` interpretato come **ORE** × 60 per minuti × quantity.

⚠️ Vedi [[../08_GOTCHAS/calcolo-costi|gotcha calcolo costi]].

## Stratigrafie certificate

Toggle `is_certified` + accordion 10 campi normativi (Rw, C, Ctr, EI, λ, U, R, max height, load).
Quando attivo, peso/Rw/EI/λ MISURATI dal test → sovrascrivono i calcolati.

## Auto-suggest viti (`screwIsAutoSuggested`)

Per ogni board layer, viene proposta una vite secondo le regole UNI 11424:2015 + preferences dell'org:
- Lunghezza minima = spessore lastre × N + 10mm penetrazione
- Spacing per categoria board
- Codice preferito dall'org (`screw_preferences.preferred_codes`)

Override manuale: utente può scegliere altra vite, `screwIsAutoSuggested=false`. "Riapplica suggerimento" lo rimette a true.
