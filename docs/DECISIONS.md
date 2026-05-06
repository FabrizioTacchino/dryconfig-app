# DryConfig — Log decisioni (ADR-lite)

Ogni decisione architetturale o di prodotto è qui. Formato: data, scelta, motivazioni, alternative considerate.

---

## 2026-05-06 · Stack tecnico: React + Vite (no Flutter)

**Decisione**: Mantenere React 18 + Vite + TypeScript + shadcn-ui + Tailwind. Non riscrivere in Flutter.

**Motivazioni**:
- Codice già scritto da Lovable in 6 mesi (PDF/RDA, calcolo viti, configurator). Riscrivere = -6 mesi netti.
- React + PWA copre web, iOS e Android con una sola codebase.
- Se in futuro servirà presenza in App Store/Play Store, wrapper Capacitor in 1-2 settimane senza riscrivere.

**Alternative scartate**:
- Flutter: app native su iOS/Android/Web/Desktop, ma riscrittura completa.
- Native iOS + Android: due codebase separate, costo proibitivo.

---

## 2026-05-06 · Backend: Supabase

**Decisione**: Mantenere Supabase come backend (Postgres + Auth + RLS + Storage + Edge Functions).

**Motivazioni**:
- Già configurato e popolato.
- Postgres = zero lock-in vero (export sempre possibile).
- Scala bene fino a SaaS medio-grande (10k+ utenti).
- Auth, RLS, storage ed edge functions in un singolo posto = velocità di sviluppo.

**Quando rivalutare**: oltre 10.000 clienti paganti, valutare migrazione a infra dedicata.

---

## 2026-05-06 · Multi-lingua: una sola app, no cloni

**Decisione**: Per espansione estera useremo i18n + tabella `regulations` per normative paese-specifiche. **Non** cloneremo l'app per ogni paese.

**Motivazioni**:
- Cloni = manutenzione 2x, allineamento bugfix, divergenza features.
- i18n è uno standard, costo 1 giorno per aggiungere ogni lingua.
- `country_code` su certifications e regulations permette stratigrafie diverse per paese mantenendo logica unica.

---

## 2026-05-06 · Hosting: Vercel

**Decisione**: Vercel quando saremo pronti al deploy pubblico.

**Motivazioni**:
- Free tier generoso (100GB/mese di traffico).
- Deploy automatico ad ogni push, anteprime per branch.
- Integrazione perfetta con Vite.
- Dominio custom + SSL automatico.

**Alternative**:
- Netlify: simile ma leggermente meno performante per Vite.
- Lovable: scartato (non più usato).

**Stato**: Account da creare quando si arriva al deploy.

---

## 2026-05-06 · Pagamenti: decisione rimandata (Stripe vs Lemon Squeezy)

**Decisione**: Decisione rinviata alla Fase 1 (apertura P.IVA Fabrizio).

**Pre-analisi**:
- **Stripe**: commissioni più basse (~1.4-2.9%), gestione fiscale a carico del venditore, ecosistema enorme.
- **Lemon Squeezy**: Merchant of Record, gestisce loro IVA EU/sales tax USA, commissioni più alte (~5%), API più semplice. Vantaggio per chi non vuole gestire la fiscalità globale.

**Vincoli**:
- Senza P.IVA italiana né LS né Stripe possono operare. Apertura P.IVA è prerequisito (forfettaria al 5% se ricavi sotto €85k/anno).

---

## 2026-05-06 · Nome prodotto: DryConfig

**Decisione**: Manteniamo "DryConfig" (scelta utente).

**Motivazioni**:
- Internazionale (Dry = secco, riconoscibile in IT/EN/DE/FR/ES).
- Già il nome di lavoro.
- Brevità + leggibilità.
- L'identità visiva (logo, palette, tono) farà la differenza più del nome stesso.

**Alternative considerate**: Plak, Stratos, Murofy, Karton — scartate.

---

## 2026-05-06 · Repo GitHub: nuovo repo, mai più push sul vecchio

**Decisione**: Codice base su `https://github.com/FabrizioTacchino/dryconfig-app` (privato). Vecchio repo `FabrizioTacchino/dryconfig` archiviato (pieno di commit Lovable).

**Motivazioni**:
- Storia git pulita per nuovo capitolo.
- Visibilità privata = codice tutelato.
- Nessuna confusione con i commit auto-generati di Lovable.

---

## 2026-05-06 · Modifiche al DB: sempre via branch Supabase

**Decisione**: Nessuna modifica diretta al DB di produzione. Tutte le DDL/DML su un branch Supabase di sviluppo, poi merge dopo test.

**Motivazioni**:
- Il DB prod è LIVE (4 utenti, 5 stratigrafie, 82 materiali, 1 progetto).
- Errori in produzione = sito che cade per gli utenti reali.
- Branch Supabase costa ~$0.32/giorno: trascurabile per il rischio che riduce.

---

## 2026-05-06 · Ruoli aziendali piano Team (preliminari)

**Proposta** (da rifinire in Fase 1):
- `owner`: creatore dell'organization, gestisce billing
- `admin`: gestisce utenti e impostazioni
- `manager`: vede tutti i preventivi del team in sola lettura
- `technician` / `commercial`: crea preventivi e stratigrafie
- `viewer`: solo lettura

**Da decidere**: distinzione tra `technician` e `commercial` o un unico ruolo?

---

## Decisioni aperte / da prendere

- [ ] Logo: AI-generated (Looka/Brandmark/Midjourney) o tipografico via codice? **Per ora**: SVG tipografico provvisorio.
- [ ] Pagamenti: Stripe o Lemon Squeezy?
- [ ] Distinzione ruoli `technician` vs `commercial`?
- [ ] Free trial: solo carta richiesta o no? (Senza carta = più conversioni in trial, meno conversioni a paid; con carta = il contrario.)
- [ ] Storage listini: Supabase Storage o S3 esterno?
- [ ] Lingua di default per export PDF: italiano? Inglese?
