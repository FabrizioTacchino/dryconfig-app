# Piani SaaS

> Per la matrice feature-completa vedi `docs/PRICING.md`. Qui i piani in sintesi.

| Piano | Prezzo | Utenti | Note |
|---|---|---|---|
| **Trial** | Gratis 7gg | 1 | Tutto incluso, scade dopo 7 giorni |
| **Solo** | €19/mese | 1 | Base — progetti illimitati, listini fornitori, preventivi |
| **Studio** | €49/mese | 1 | Pro — vista 3D, RDA, export Excel, supporto email |
| **Team** | €149/mese | 10 | Multi-utente, ruoli granulari, audit log, supporto prioritario |

## Feature-gate implementato

Tramite `useHasFeature('feature_name')` in `src/hooks/useOrgPlan.ts`:

- `members` → solo Team (multi-user)
- `view3d` → da Studio in su
- (altri da aggiungere quando definiti)

UI mostra **upsell card** ai piani inferiori (es. `Members.tsx` quando piano < Team).

## Pagamenti

**Decisione rimandata**: Stripe vs Lemon Squeezy. Vincolo: P.IVA italiana (forfettaria al 5% se < €85k/anno). Vedi [[../05_DECISIONS/2026-05-06-stack-react-no-flutter|decisioni stack]] (cerca "Pagamenti" in `docs/DECISIONS.md`).
