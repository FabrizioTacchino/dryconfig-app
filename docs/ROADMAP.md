# DryConfig — Roadmap

Ultimo aggiornamento: 2026-05-06

## Visione

**Il configuratore di stratigrafie in cartongesso che ti serve davvero.**

Configurare e preventivare pareti e controsoffitti a secco con **i materiali che vuoi tu** — di Knauf, Saint-Gobain, Fassa Bortolo, Siniat, Rigips, o di chiunque altro — non solo quelli di un singolo produttore. Stratigrafie certificate verificate, calcoli tecnici corretti (EI, Rw, λ), preventivi pronti da inviare al cliente, esportazione RDA completa per il cantiere.

**Target**: cartongessisti, piccole/medie imprese di costruzione, studi di architettura, distributori di materiali.

**Differenziazione vs MyPlanner Saint-Gobain**:
- Multi-fornitore (non solo un brand)
- Importazione listini fornitori (Excel/CSV) con sconti riservati
- Libreria stratigrafie certificate condivisa (non solo del produttore)
- Calcoli tecnici trasparenti
- Preventivazione professionale + RDA cantiere

## Modello commerciale

| Piano | Prezzo | Caratteristiche (preliminari, da rifinire) |
|---|---|---|
| **Trial** | Gratis 7 giorni | Tutto il piano Pro per provare |
| **Base** | €19/mese | 1 utente, max N progetti, libreria stratigrafie certificate, preventivi base, export PDF |
| **Pro** | €49/mese | 1 utente, progetti illimitati, listini multipli, RDA completa, export Excel, supporto email |
| **Team** | €149/mese | Fino a 5 utenti, vista manager su tutti i preventivi del team, ruoli aziendali (owner/admin/manager/technician/viewer), supporto prioritario |

Pagamento: **Stripe** o **Lemon Squeezy** (decisione in Fase 1, dopo apertura P.IVA).

## Fasi di sviluppo

### Fase 0 — Stabilizzazione & Branding (1-2 settimane) — IN CORSO
- [x] Recovery codice da GitHub remoto (codice locale era 6 mesi indietro)
- [x] Allineamento client.ts e DB Supabase
- [x] Fix conflitto dipendenze (jspdf-autotable v5)
- [x] App locale funzionante con dati DB reali
- [ ] Documentazione progetto (CLAUDE.md, ROADMAP, DECISIONS)
- [ ] Setup git con nuovo repo dryconfig-app
- [ ] Branch Supabase di sviluppo
- [ ] Pulizia DB: RLS sulle 6 tabelle aperte + dedup policy
- [ ] Logo SVG provvisorio + theme shadcn personalizzato
- [ ] Setup deploy Vercel
- [ ] Sentry + backup DB automatici
- [ ] Merge branch dev → prod

### Fase 1 — Multi-tenancy & Monetizzazione (3-4 settimane)
- [ ] Schema DB: `organizations` + `organization_members` + colonna `organization_id` ovunque
- [ ] Migrazione dati: ogni utente esistente → propria organization personale
- [ ] Riscrittura RLS basata su `is_member_of_org()`
- [ ] Ruoli aziendali: owner/admin/manager/technician/viewer
- [ ] Apertura P.IVA (lato Fabrizio)
- [ ] Decisione Stripe vs Lemon Squeezy (vedi DECISIONS.md)
- [ ] Tabelle: `subscriptions`, `plans`, `usage_quotas`
- [ ] Pagina pricing pubblica
- [ ] Checkout + portale clienti (gestione abbonamento)
- [ ] Onboarding nuovo utente (email verifica → setup org → tutorial)
- [ ] Free trial 7 giorni nativo

### Fase 2 — Funzionalità differenzianti (4-6 settimane)
- [ ] Tabella `suppliers` separata
- [ ] Storage Supabase per allegati listini (PDF / Excel)
- [ ] **Importatore listini fornitori**: Excel/CSV con mapping colonne
- [ ] **Libreria stratigrafie certificate** condivisa: digitalizzazione fascicoli pubblici (Knauf W11x, Saint-Gobain Gyproc Wall Solutions, Siniat LaDura/Pregybel, Fassa Bortolo, Rigips)
- [ ] Calcoli tecnici certificati: EI (EN 13501), Rw (EN ISO 717), λ (EN 12667)
- [ ] Esportazioni: RDA cantiere migliorata, capitolato tecnico, schede prodotto
- [ ] Workflow approvazione preventivi (draft → pending → approved → contracted)
- [ ] Vista comparativa preventivi (versioning)

### Fase 3 — Mobile & UX (2-3 settimane)
- [ ] Trasformazione in **PWA** (manifest, service worker, icone, splash)
- [ ] UX mobile: layout responsive completo, gestures, ottimizzazione touch
- [ ] Test su dispositivi reali (iOS Safari, Android Chrome)
- [ ] (Opzionale) Wrapper Capacitor per pubblicazione su App Store / Play Store

### Fase 4 — Lancio (2-3 settimane)
- [ ] Sito vetrina (landing page con pricing, demo video, testimonianze)
- [ ] Tutorial / video / documentazione utente
- [ ] Email transazionali professionali
- [ ] Beta privata con 5-10 utenti pilota (cartongessisti)
- [ ] Onboarding feedback loop
- [ ] Lancio pubblico

### Fase 5 — Crescita (continuativa)
- [ ] Integrazioni dirette con produttori (API listini con sconti riservati)
- [ ] Espansione internazionale (DE / FR / ES)
- [ ] Affiliazione / referral program
- [ ] Ottimizzazioni AI: suggerimento stratigrafie ottimali per requisiti, OCR su schede tecniche

## Tempistica realistica

- **Fase 0**: 1-2 settimane → MVP stabile e brandizzato per uso interno
- **Fase 0 + 1**: 4-6 settimane → SaaS commercializzabile in beta
- **Fase 0 + 1 + 2**: 2-3 mesi → prodotto competitivo lanciabile pubblicamente
- **Fase 0 → Fase 4**: 4-6 mesi totali full-time

## Stato corrente

**Fase 0** in corso. Ultimo step completato: clone fresco da GitHub + dipendenze installate + app funzionante in locale con DB reale. Prossimo step: documentazione (questo file) + setup git nuovo repo + branch Supabase.

Per task granulari attive in chat, usa `TaskList`.

## Concorrenza monitorata

- **Saint-Gobain MyPlanner** ([sg-myplanner.it](https://www.sg-myplanner.it/)) — riferimento principale. Limite: solo prodotti Saint-Gobain.
- **Knauf Building Solutions** — solo Knauf, UX datata.
- **Siniat Calc** — solo Siniat, focus tecnico.
- **Excel artigianali** — il vero competitor reale: ogni cartongessista fa preventivi in Excel a mano. Da spiazzare con UX e velocità.
