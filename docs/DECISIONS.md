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

## 2026-05-06 · Modifiche al DB: dirette in prod con backup locale (REVISIONE)

**Decisione**: Modifiche DDL/DML direttamente sul DB di produzione, dopo backup JSON locale dei dati esistenti.

**Motivazioni** (revisione della scelta iniziale):
- L'utente ha valutato che i dati attuali (4 utenti, 5 stratigrafie, 82 materiali, 1 progetto) sono "sacrificabili" — l'app è in fase di rifacimento profondo, eventuali perdite si reinseriscono.
- Branch Supabase costerebbe €0.32/giorno: piccolo ma evitabile in questa fase.
- Backup locale JSON è gratis e copre il rischio.

**Quando rivalutare**: appena ci sono utenti paganti reali, riattivare la regola "modifiche solo via branch". A quel punto il branch Supabase non è più un costo trascurabile, è una necessità.

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

## 2026-05-07 · Inviti membri: link copy-paste (no email automatica per ora)

**Decisione**: il sistema di inviti membri usa **token in URL** (`/invite/:token`). L'admin che crea l'invito ottiene il link e lo invia manualmente al destinatario (email/WhatsApp). L'invio automatico via email è rimandato.

**Motivazioni**:
- L'invio automatico richiede un provider email (Resend / SendGrid / Brevo) con dominio verificato (SPF/DKIM/DMARC) per evitare lo spam folder. Setup di mezza giornata, costo $20-30/mese, e va validato il dominio.
- Per la fase di sviluppo + beta privata bastano i 5-10 inviti manuali.
- Il design DB è già futuro-compatibile: aggiungere l'edge function di invio email è plug-and-play.

**Quando rivalutare**: appena passiamo a beta pubblica / lancio commerciale. Anche prima se inviti manuali diventano un collo di bottiglia.

---

## 2026-05-07 · Importatore listini: template per fornitore (no mapping universale)

**Decisione**: invece di un importer generico con UI di mapping colonne, costruiamo **template predefiniti** per i fornitori principali (Saint-Gobain, Knauf, Fassa Bortolo). Mapping manuale resta come fallback per fornitori esotici.

**Motivazioni**:
- I listini dei top fornitori sono **stabili** nel tempo: Saint-Gobain pubblica 2x/anno con stesso schema. Una volta scritto il parser, l'utente carica il file e basta.
- Mapping manuale richiede UI complessa (preview, drag-drop colonne, gestione tipi, ecc.). Per pochi fornitori target è overkill.
- Time-to-value molto migliore: l'utente non deve "imparare" il mapping, basta cliccare "Importa Saint-Gobain".

**Quando rivalutare**: se troviamo che ogni cliente ha fornitori unici (es. cliente con 5 fornitori esotici), il mapping manuale diventa pari priorità.

---

## 2026-05-07 · Sconti cliente: tabella dedicata, non testo libero su materials

**Decisione**: lo sconto NON è un campo TEXT su `materials` (come oggi: `"50+25+5"`), ma una tabella `customer_discounts` (organization × supplier × family). Calcolo `prezzo_netto = list_price × (1 − sconto1) × (1 − sconto2)`.

**Motivazioni**:
- Lo sconto è una proprietà del **rapporto commerciale** (l'org vs il fornitore), non del prodotto. Lo stesso codice articolo Saint-Gobain ha sconti diversi per ogni cliente.
- Saint-Gobain (e simili) danno sconti **per famiglia** (H01, H03, ecc.), non per singolo prodotto. La famiglia è il livello di aggregazione corretto.
- Permette di gestire date di scadenza per sconti (es. promozioni).

---

## 2026-05-07 · 4 famiglie Saint-Gobain aggiunte senza customer_discount

**Contesto**: durante il primo import reale dell'Excel listino Gyproc, sono emerse 4 famiglie non presenti nei 3 PDF condizioni: `H15` (Intonaci grezzi), `H17` (Vernici intumescenti Igniver), `H33` (Rasanti Activ'Air), `H35` (Rasanti finiture cemento).

**Decisione**: famiglie create con descrizione provvisoria (categoria=intonaci/sistemi). **Nessun customer_discount associato** → l'utente paga prezzo listino su questi 21 prodotti finché non avrà scheda condizioni dedicata.

**Quando rivalutare**: alla prossima fornitura di PDF condizioni Saint-Gobain estesi, oppure se il cliente B4T comincia a quotare frequentemente quei materiali.

---

## 2026-05-07 · Sconti cumulativi: array N-livelli, non più 2 colonne fisse

**Decisione**: la tabella `customer_discounts` aveva originariamente `discount_level1` e `discount_level2` (2 colonne fisse) sull'assunzione che i fornitori applichino al massimo 2 sconti cumulativi. Cambiata in `discounts NUMERIC(5,2)[]` (array di N livelli).

**Motivazioni**:
- Reali condizioni commerciali italiane usano spesso 3-4 sconti cumulativi (es. "50+15+10+5" → paghi il 36.34% del listino).
- Con 2 colonne fisse non potevamo modellare quei casi senza pre-collassare gli sconti (perdita di leggibilità).
- Array PostgreSQL è idiomatic e supporta N livelli senza modifiche di schema.

**Calcolo**: prezzo_netto = listino × ∏ᵢ (1 − dᵢ/100). Funzione PG `cumulative_discount_factor(NUMERIC[])` esposta a authenticated.

**UI**: input dinamici per livello (max 6), bottone "+" per aggiungere, "x" per rimuovere. Calcolo netto live mentre l'utente digita.

---

## 2026-05-07 · `unit_price` come cache del netto via trigger (single-org workaround)

**Decisione**: il campo `materials.unit_price` viene mantenuto sincronizzato con il prezzo netto calcolato per Impresa B4T tramite trigger PG su `customer_discounts`. Il configuratore esistente legge `unit_price` e quindi vede automaticamente il netto senza modifiche al frontend.

**Limitazione**: questo funziona finché c'è **una singola organization paying**. Quando saremo multi-org, lo stesso material avrà `unit_price` diversi per ogni cliente — impossibile con una colonna unica.

**Roadmap multi-org**: rimuoveremo il backfill di `unit_price` e migreremo il configuratore a leggere dalla view `materials_with_pricing`, che fa il calcolo per-org via RLS in tempo reale. Stima: 1-2 ore quando sarà rilevante (intorno al 5°-10° cliente paying).

---

## 2026-05-07 · Niente trigger DB di propagazione costi materiali → stratigrafie

**Decisione**: il ricalcolo dei costi salvati nelle stratigrafie quando cambiano i `materials.unit_price` (perché un listino è stato re-importato o uno sconto è cambiato) è **manuale via script/migration**, NON via trigger automatico in catena.

**Motivazioni**:
- Trigger in catena (customer_discounts → materials.unit_price → layers → stratigraphies) sono difficili da debuggare e possono causare lock di lunga durata su tabelle grandi (1000+ materiali, N×layers, M×stratigraphies).
- I costi salvati nelle stratigrafie sono per definizione "snapshot al momento del salvataggio". È coerente che non cambino fino a quando l'utente non ricalcola esplicitamente o salva di nuovo.
- I configuratori e preventivi LIVE (non salvati) leggono già `materials.unit_price` corrente, quindi mostrano sempre il prezzo aggiornato.

**Compromesso pratico**: quando importi un nuovo listino o cambi sconti significativi, lancia una migration di ricalcolo (script `D9` come template). 5 minuti di SQL, prezzi allineati su tutto.

**Quando rivalutare**: se in produzione ci troviamo a fare il ricalcolo molto spesso (>1 volta/settimana), valutare un trigger asincrono / job notturno.

---

## Decisioni aperte / da prendere

- [ ] Logo: AI-generated (Looka/Brandmark/Midjourney) o tipografico via codice? **Per ora**: SVG tipografico provvisorio.
- [ ] Pagamenti: Stripe o Lemon Squeezy?
- [ ] Distinzione ruoli `technician` vs `commercial`?
- [ ] Free trial: solo carta richiesta o no? (Senza carta = più conversioni in trial, meno conversioni a paid; con carta = il contrario.)
- [ ] Storage listini: Supabase Storage o S3 esterno?
- [ ] Lingua di default per export PDF: italiano? Inglese?
