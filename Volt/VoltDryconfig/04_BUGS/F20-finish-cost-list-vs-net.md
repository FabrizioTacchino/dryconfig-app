# F20 — Finitura usava listino invece di netto

**Data risoluzione**: 2026-05-13
**Severità**: 🟠 alta (dopo F19, residuava divergenza su "Aggiorna prezzi")
**Commit**: `d3d88d2` — `fix(F20): coerenza prezzo netto finitura + persistenza stud_spacing_mm`

## Sintomo

Dopo aver chiuso F19, l'utente vedeva ancora il valore cambiare cliccando "Aggiorna prezzi" sul preventivo.

## Root cause

Tre punti residui che usavano `materials.unit_price` raw (listino) invece di `materials_with_pricing` (netto), oppure non persistivano metadata critici:

### 1. `useFinishLevels.computeFinishLevelCost`
Il preview costo finitura nel dialog "Aggiungi a preventivo" leggeva il LISTINO dal join FK. Il bulk update invece refetcha materiali da `materials_with_pricing`. → Preview ≠ bulk update.

### 2. `fetchFinishCostSnapshot` (in useCreateEstimateStratigraphy)
Anche il salvataggio dello snapshot finitura usava listino. Quando poi "Aggiorna prezzi" rifaceva il calcolo coi prezzi NETTO, `unit_cost` cambiava anche se nessun listino era stato toccato.

### 3. `useIntegratedStratigraphySave.stud_spacing_mm`
Scriveva il campo solo se passato esplicitamente. Stratigrafia salvata senza valore → NULL in DB → bulk update defaultava a 600 → costo struttura diverso dal preview (che usava il valore corretto in memoria).

## Fix

- `useFinishLevels.ts`: dopo il join finish_level_components, override `unit_price` dei materiali con quelli da `materials_with_pricing`.
- `useCreateEstimateStratigraphy.tsx` (`fetchFinishCostSnapshot`): stesso override.
- `useIntegratedStratigraphySave.ts`: scrivi sempre `stud_spacing_mm` con default 600.

## Convenzione `unit_cost` (confermata)

```
unit_cost = comprehensive + finish
total_cost = unit_cost × area × quantity
finish_cost_per_sqm = finish (separato per audit)
```

Identica in `useCreateEstimateStratigraphy` (create) e `useBulkUpdateEstimateStratigraphyPrices` (update).

## Lezioni

- Ogni volta che un join FK su `materials` viene usato per calcolare prezzi, **deve seguire un override da `materials_with_pricing`**. Vedi [[../08_GOTCHAS/prezzo-netto|gotcha]].
- I metadata che servono per ricostruire il calcolo (stud_spacing_mm, finish_components_data, screw_quantity) devono essere **persistiti SEMPRE** con un default sicuro, non condizionalmente.
