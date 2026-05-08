# DryConfig — Istruzioni per Claude Code

> Questo file viene caricato automaticamente all'apertura di ogni chat di Claude Code in questa cartella. Contiene il contesto essenziale per non ripartire da zero ogni volta.

## Cosa è il progetto

**DryConfig** è un'applicazione web per la **configurazione e preventivazione di stratigrafie in cartongesso** (pareti a secco e controsoffitti). Obiettivo: trasformarla in un prodotto SaaS commerciale, alternativa a *Saint-Gobain MyPlanner* ma **multi-fornitore** (l'utente importa i listini di Knauf, Saint-Gobain, Fassa Bortolo, Siniat, Rigips, ecc.).

**Mercato**: Italia per primo, espansione internazionale in seconda battuta (multi-lingua + multi-normativa, **non** cloni separati).

**Modello di business**: SaaS B2B con piani Free trial 7 giorni / €19 base / €49 pro / €149 team.

**Owner**: Fabrizio Tacchino (`fabrizio.tacchino@gmail.com`) — sviluppa full-time insieme a Claude. Comunica in italiano. Viene da Lovable, ora su Claude Code. Non è uno sviluppatore full-time tradizionale: punta a un'esperienza guidata passo passo.

Per la visione completa, le fasi di sviluppo e le scelte tecniche/commerciali leggi `docs/ROADMAP.md` e `docs/DECISIONS.md`.

## Stack tecnico

- **Frontend**: Vite + React 18 + TypeScript + shadcn-ui + Tailwind CSS
- **Backend / DB / Auth**: Supabase (Postgres 17, region eu-central-2)
  - Project ID prod: `aifeyamngllcezkoxzxu` (DryConfigV2)
  - URL: `https://aifeyamngllcezkoxzxu.supabase.co`
- **Hosting** (futuro): Vercel collegato a `https://github.com/FabrizioTacchino/dryconfig-app`
- **Pagamenti** (futuro, Fase 1): Stripe vs Lemon Squeezy — decisione rimandata
- **Monitoraggio errori** (futuro): Sentry
- **Export documenti**: jspdf + jspdf-autotable v5 + xlsx

## Comandi utili

```powershell
# Dev server (hot reload)
npm run dev

# Build di produzione
npm run build

# Lint
npm run lint

# Preview build
npm run preview
```

## Struttura cartella

- `src/` — codice React (componenti, hooks, pages, integrations, utils)
- `src/integrations/supabase/` — client + types generati
- `src/components/configurator/` — cuore dell'app (configurazione stratigrafie)
- `src/components/estimates/` — gestione preventivi
- `src/utils/export/` — generatori PDF (RDA, preventivi, materiali)
- `supabase/config.toml` — project_id Supabase
- `docs/` — roadmap, decisioni, documentazione progetto
- `key.txt.txt` — chiavi Supabase (NON committare, è in .gitignore)

## Stato del DB Supabase (snapshot)

22 tabelle in produzione. Schema già ricco e professionale (60+ campi tecnici su `materials`: EN 520, fire class, EPD, VOC, λ, Rw, ecc.).

**Manca per il SaaS**:
- Tabella `organizations` + `organization_members` per multi-tenancy
- Colonna `organization_id` su tabelle business
- Tabelle `subscriptions`, `plans`, `usage_quotas` per billing
- Tabella `suppliers` separata + storage per listini

**Tech debt da pulire**:
- 6 tabelle senza RLS (lista in `docs/DECISIONS.md`)
- ~10 policy RLS duplicate su estimates/projects/wall_configurations

## Convenzioni di sviluppo

- **Lingua codice**: variabili e commenti in inglese, UI in italiano.
- **Stile**: TypeScript strict, no `any` quando evitabile.
- **Modifiche al DB prod**: SEMPRE prima sul branch Supabase di sviluppo, poi merge dopo test.
- **Commit**: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). Anche se non si pusha, aiuta a leggere lo storico.
- **Niente push diretti su main del repo** senza approvazione utente.

## Cose da NON fare

- ⚠️ Modifiche DB prod: PER ORA dirette ammesse (vedi DECISIONS.md), ma sempre con backup locale JSON dei dati toccati. Quando ci saranno utenti paganti reinstaurare la regola "solo via branch".
- ❌ NON committare file con chiavi/secret (`key.txt`, `.env`, ecc.).
- ❌ NON pushare su `FabrizioTacchino/dryconfig` (vecchio repo, archiviato). Usare `dryconfig-app`.
- ❌ NON suggerire di riscrivere in Flutter o cambiare stack (decisione presa, vedi `docs/DECISIONS.md`).
- ❌ NON salvare chiavi/secret nella memoria persistente (policy Claude).

## Accesso a Supabase

Claude ha accesso completo via MCP `claude.ai Supabase`:
- Lettura: `list_tables`, `execute_sql`, `get_logs`, `get_advisors`
- Schema: `apply_migration` per DDL, `list_migrations`
- Dati: `execute_sql` con DML (INSERT/UPDATE/DELETE)
- Edge Functions: deploy/get/list
- Branching: `create_branch`, `merge_branch`, `reset_branch`, `delete_branch`

Le chiavi (anon, publishable, service_role, sb_secret) sono in `key.txt.txt` se servono. Per il lavoro sul DB l'MCP basta — la service_role serve solo lato server (edge functions / script Node).

## Stato corrente del lavoro

Vedi le task attive con TaskList. La fase corrente è documentata in `docs/ROADMAP.md` (sezione "Stato corrente").
