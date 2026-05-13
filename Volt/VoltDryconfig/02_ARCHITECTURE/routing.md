# Mappa pagine & route

## Pubbliche (no auth)

- `/` → redirect a `/dashboard` se loggato, altrimenti `/login`
- `/login`, `/signup`, `/auth/callback`
- `/invite/:token` → AcceptInvite (signup-then-join o join-existing)

## Authenticated

- `/dashboard` → KPI cantiere (F16 TODO: KPI utili)
- `/projects` → lista progetti
- `/projects/:id` → dettaglio progetto + preventivi
- `/estimates` → lista preventivi (cross-progetto)
- `/estimates/:id` → dettaglio preventivo (stratigrafie + riepilogo materiali)
- `/configurator` → builder stratigrafia (V2, default)
- `/configurator/:id` → edit di stratigrafia esistente
- `/stratigraphies` → lista stratigrafie catalogo (org + globali)
- `/materials` → catalogo materiali
- `/materials/import` → wizard import listini Excel (Saint-Gobain attivo)
- `/settings` → hub Settings
- `/settings/labor` → costo orario manodopera
- `/settings/finish-levels` → BOM Q1-Q4
- `/settings/waste` → sfridi per categoria
- `/settings/screws` → preferenze viti per board
- `/settings/suppliers` → gestione fornitori (admin+)
- `/settings/members` → gestione team (Team plan only)

## Feature-gated

- `/settings/members` → solo se `useHasFeature('members')` = piano Team
- Tab 3D nel configuratore → solo se `useHasFeature('view3d')` = Studio+

## Sidebar (`src/components/layout/AppSidebar.tsx`)

Voci dipendenti dal ruolo:
- `Importa listino` → solo se non-viewer
- `Fornitori` → solo owner/admin
- `Membri` → solo owner/admin + piano Team
