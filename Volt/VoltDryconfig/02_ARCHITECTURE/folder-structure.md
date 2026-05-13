# Struttura cartella src/

```
src/
├── components/
│   ├── ui/                          # shadcn primitives
│   ├── layout/                      # AppSidebar, Header, BackButton
│   ├── brand/                       # Logo
│   ├── configurator/                # V1 LEGACY (alcuni hook ancora usati)
│   ├── configurator-v2/             # V2 — quello attivo
│   │   ├── builder/                 # LayerCard, MaterialPickerDialog, ecc.
│   │   ├── list-view/               # StratigraphyCardV2, CompareStratigraphiesDialog
│   │   ├── estimates/               # AddToEstimateDialogV2
│   │   ├── tabs/                    # 3D, Costi, Pianta, Tecnico
│   │   ├── hooks/                   # computeStratigraphyCosts (SOURCE OF TRUTH)
│   │   └── types.ts                 # LayerV2, ConfiguratorV2State
│   ├── estimates/                   # EstimateStratigraphiesSection, BulkUpdateDialog
│   ├── settings/                    # LaborCostCard, FinishLevelsCard, WasteSettings, ScrewPreferences
│   ├── materials/                   # MaterialsTable, EditMaterialDialog
│   └── theme/                       # ThemeProvider, ThemeToggle (next-themes)
│
├── hooks/
│   ├── useStratigraphy.ts                          # LOAD single stratigrafia
│   ├── useIntegratedStratigraphySave.ts            # SAVE stratigrafia
│   ├── useCreateEstimateStratigraphy.tsx           # AGGIUNGI a preventivo
│   ├── useUpdateEstimateStratigraphy.tsx           # MODIFICA in preventivo
│   ├── useBulkUpdateEstimateStratigraphyPrices.tsx # AGGIORNA PREZZI preventivo
│   ├── useUpdateGeneralStratigraphyPrices.tsx      # AGGIORNA PREZZI catalogo
│   ├── useFinishLevels.ts                          # Q1-Q4 finiture
│   ├── useOrgPlan.ts                               # piano + feature gates
│   ├── useTeamManagement.ts                        # members + inviti
│   └── ...
│
├── pages/
│   ├── Auth.tsx, Login.tsx, Signup.tsx, AcceptInvite.tsx
│   ├── Dashboard.tsx
│   ├── Projects.tsx, ProjectDetail.tsx
│   ├── Estimates.tsx, EstimateDetail.tsx
│   ├── ConfiguratorV2.tsx                          # configuratore principale
│   ├── StratigraphiesList.tsx
│   ├── Materials.tsx, MaterialImport.tsx
│   ├── Settings.tsx (hub) + sub-pages
│   └── Members.tsx                                 # gestione team
│
├── contexts/
│   ├── AuthContext.tsx
│   └── OrganizationContext.tsx
│
├── integrations/
│   └── supabase/
│       ├── client.ts                               # supabase typed client
│       └── types.ts                                # generated
│
├── utils/
│   ├── cost/computeBaseCosts.ts                    # LEGACY V1 formula (non più usato dopo F19)
│   ├── export/                                     # PDF generators (RDA, preventivo)
│   └── ...
│
└── main.tsx                                        # entry React
```

## Convenzioni nomi file

- Hook: `useXxx.ts` (camelCase, prefisso `use`)
- Componente React: `XxxYyy.tsx` (PascalCase)
- Util: `xxxYyy.ts` (camelCase, lower)
- Type-only file: `xxxTypes.ts` o dentro `types.ts`

## File "single source of truth"

- 🎯 **`src/components/configurator-v2/hooks/computeStratigraphyCosts.ts`** — formula costo category-aware. USATA OVUNQUE dopo F19. Vedi [[../08_GOTCHAS/calcolo-costi|gotcha]].
- 🎯 **VIEW DB `materials_with_pricing`** — prezzo netto materiali per org corrente. Vedi [[../08_GOTCHAS/prezzo-netto|gotcha]].
