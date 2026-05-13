# DryConfig — Secondo cervello (MOC)

> **Aggiornato**: 2026-05-13
> **Owner**: Fabrizio Tacchino (`fabrizio.tacchino@gmail.com`)
> **Repo**: https://github.com/FabrizioTacchino/dryconfig-app
> **Prod**: https://dryconfig.com
> **DB**: Supabase project `aifeyamngllcezkoxzxu` (DryConfigV2)

Questo vault è il **secondo cervello** del progetto. Quando apri una nuova conversazione con Claude da un altro PC, fagli leggere questo file per primo (vedi [[99_META/claude-prompts|prompt template]]).

---

## 🧭 Mappa

### Visione & business
- [[01_VISION/product|Cos'è DryConfig]] — prodotto, target, differenziazione
- [[01_VISION/roadmap|Roadmap & stato corrente]]
- [[01_VISION/pricing|Piani SaaS: Trial/Solo/Studio/Team]]

### Architettura
- [[02_ARCHITECTURE/stack|Stack tecnico]]
- [[02_ARCHITECTURE/schema-db|Schema DB Supabase]]
- [[02_ARCHITECTURE/folder-structure|Mappa cartelle src/]]
- [[02_ARCHITECTURE/routing|Mappa pagine & route]]

### Funzionalità
- [[03_FEATURES/configurator|Configuratore V2]]
- [[03_FEATURES/estimates|Preventivi & workflow]]
- [[03_FEATURES/materials|Materiali & sconti]]
- [[03_FEATURES/team-members|Team & inviti]]
- [[03_FEATURES/export-rda|Export RDA PDF]]

### Bug log & root cause
- [[04_BUGS/F19-cost-pipeline-divergence|F19 — Costi: 5 valori diversi per stessa stratigrafia]]
- [[04_BUGS/F20-finish-cost-list-vs-net|F20 — Finitura usava listino invece di netto]]
- [[04_BUGS/F20.6-bulk-skip-finish-labor|F20.6 — Bulk update saltava labor finitura con BOM vuoto]]
- [[04_BUGS/F20.7-rounding-mismatch-create-vs-bulk|F20.7 — Arrotondamento mismatch (€0.05 di delta)]]

### Decisioni
- [[05_DECISIONS/2026-05-06-stack-react-no-flutter|Stack React + Vite (no Flutter)]]
- [[05_DECISIONS/2026-05-06-backend-supabase|Backend Supabase]]
- [[05_DECISIONS/2026-05-06-multi-lingua-no-cloni|Multi-lingua senza cloni]]

### Stato del lavoro
- [[06_TASKS/active|Task attivi & pending]]
- [[07_SESSIONS/2026-05-13|Sessione 2026-05-13 — Fix costi (F19+F20)]]

### ⚠️ Gotchas (regole da non dimenticare MAI)
- [[08_GOTCHAS/calcolo-costi|computeStratigraphyCosts è la single source of truth]]
- [[08_GOTCHAS/prezzo-netto|materials_with_pricing > materials.unit_price]]
- [[08_GOTCHAS/rls-org-id|Trigger recompute filtra org_id, materiali globali vanno overridati]]

### Meta
- [[99_META/claude-prompts|Prompt da dare a Claude inizio/fine sessione]]
