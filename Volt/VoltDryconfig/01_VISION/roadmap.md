# Roadmap & stato corrente

> Per il dettaglio completo vedi `docs/ROADMAP.md` nella codebase. Qui solo lo stato di alto livello.

## Stato attuale (2026-05-13)

**Fase 0 — Stabilizzazione** ✅ chiusa
**Fase 1 — Multi-tenancy & monetizzazione** ✅ codice fatto, mancano P.IVA + pagamenti
**Fase 2 — Differenziazione** ⏳ in corso (catalogo, sconti, viti smart, certificate match, finiture Q1-Q4 done)
**Configuratore V2** ✅ live, ridisegnato da zero con shadcn + cmdk + dnd-kit + 3D
**Dominio** ✅ `dryconfig.com` su Cloudflare → Vercel auto-deploy da `main`

## Cose chiuse di recente

- **F19** — Pipeline costi unificata (`computeStratigraphyCosts` ovunque, override netto dalla view). Vedi [[../04_BUGS/F19-cost-pipeline-divergence|F19 bug]]
- **F20** — Finitura usava listino, ora usa netto + sempre persistere `stud_spacing_mm`. Vedi [[../04_BUGS/F20-finish-cost-list-vs-net|F20 bug]]
- **F13** — Stampa RDA PDF A4 professionale
- **F14** — `/admin` smantellato, ridistribuito in `/settings`
- **F15** — Feature gates per piano (Members solo su Team, 3D solo Studio+)
- **F11** — Ruoli a 5 (owner/admin/supervisor/technician/viewer) + RLS

## Cose pending importanti

- **F12** — Sentry (bloccato: serve DSN da Fabrizio)
- **F16** — Dashboard KPI per cartongessista
- **F17** — Modulo controsoffitti (typology + configurator)
- **V2.4** — Vista 3D fotorealistica Three.js
- **Pagamenti**: Stripe vs Lemon Squeezy — bloccato su apertura P.IVA
- **Importer Knauf / Fassa** (oggi solo Saint-Gobain ha un parser dedicato)
- **Libreria certificate** condivisa multi-brand
- **PWA + mobile UX** (Fase 3)

## Roadmap di alto livello

| Fase | Focus | Tempo stimato |
|---|---|---|
| 0 | Stabilizzazione & branding | 1-2 sett — done |
| 1 | Multi-tenant + monetizzazione | 3-4 sett — codice done, billing pending |
| 2 | Funzionalità differenzianti | 4-6 sett — in corso |
| 3 | PWA & mobile | 2-3 sett |
| 4 | Marketing & launch | continuo |
