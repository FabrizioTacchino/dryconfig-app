# Configurator V2

Editor visuale di stratigrafie per pareti a secco.

Vedi `docs/mockupui.md` per il design completo.

## Struttura

- `header/` — barra superiore (nome, codice sistema, azioni, filtro fornitore)
- `composition/` — pannello sinistro (lista layer drag&drop, zone semantiche)
- `material-picker/` — modal di selezione materiali (cmdk + filtri faceted)
- `visualization/` — pannello destro (preview SVG sezione/pianta, costi, riepilogo tecnico)
- `empty-states/` — schermate iniziali e template W11x
- `hooks/` — state machine, dnd, codice sistema, performance calc
- `templates/` — definizioni sistemi standard (W111, W112, D111, ecc.)

## Stack

- `@dnd-kit/core` + `@dnd-kit/sortable` per drag&drop verticale layer
- `cmdk` per il combobox di selezione materiali con fuzzy search
- SVG nativo (no Canvas, no Three.js) per il preview tecnico
- Riusa hook backend esistenti: `useStratigraphy`, `useIntegratedStratigraphySave`,
  `useScrewRecommendation`, `useAutoSuggestStructure`, `useStratigraphyComprehensiveCost`

## Stato

V2.0 — Foundation in corso (vedi TaskList).
