# Pacchetti SaaS — analisi preliminare

> Documento di lavoro per definire i piani tariffari e le feature-gate.
> Parte dai 4 piani indicati in CLAUDE.md (Free 7gg / €19 / €49 / €149)
> e propone i contenuti di ciascuno.
>
> Obiettivo: arrivare a una matrice "piano × feature" che diventi il
> contratto per implementare `subscriptions` + `usage_quotas` nel DB.
>
> Ultimo aggiornamento: 2026-05-11

## 1. Premessa di posizionamento

DryConfig si posiziona come **alternativa multi-fornitore a MyPlanner Saint-Gobain**, rivolta a installatori cartongessisti italiani. Il valore principale per il cliente:

- **Risparmio tempo**: stratigrafia certificata in 30 sec invece di 10 min su carta
- **Margine reale**: prezzo netto dei listini fornitori applicato in tempo reale (oggi MyPlanner usa solo prezzi Saint-Gobain a listino, niente sconti)
- **Multi-fornitore**: lavorare con Knauf, Saint-Gobain, Fassa, Siniat senza saltare tra 4 software
- **Documenti finali**: PDF di scheda tecnica + preventivo cliente

Il target tipico è **micro-impresa** (1-5 dipendenti). Pochissimi clienti avranno team > 10. La struttura prezzi va calibrata su questo.

## 2. Piani proposti

| | **Trial** | **Solo** | **Studio** | **Team** |
|---|---|---|---|---|
| **Prezzo** | gratis 7 giorni | €19/mese | €49/mese | €149/mese |
| **Target** | "Voglio provare" | Installatore singolo | Studio 2-5 persone | Impresa strutturata |
| **Utenti** | 1 | 1 | 3 | 10 |
| **Progetti/mese** | illimitati | 5 | illimitati | illimitati |
| **Preventivi/mese** | 10 | 10 | illimitati | illimitati |
| **Fornitori importabili** | tutti | 1 | tutti | tutti |
| **Catalogo certificato** | ✓ | ✓ | ✓ | ✓ |
| **Stratigrafie custom** | ✓ | ✓ | ✓ | ✓ |
| **Sfridi/finiture/viti preferenze** | ✓ | base | ✓ | ✓ |
| **Export PDF preventivo cliente** | ✓ | con watermark | ✓ | ✓ |
| **Export PDF scheda tecnica** | ✓ | — | ✓ | ✓ |
| **Logo cliente nei PDF** | — | — | ✓ | ✓ |
| **Vista 3D** *(post V2.4)* | ✓ | — | ✓ | ✓ |
| **Ruoli avanzati (admin/manager)** | — | — | — | ✓ |
| **Multi-organizzazione** | — | — | — | ✓ |
| **API access** *(futuro)* | — | — | — | ✓ |
| **Supporto** | email | email | email prioritaria | email + telefono |

### Razionale

- **Solo €19** è il "freemium" pagato: limita preventivi e fornitori per spingere all'upgrade. Il watermark PDF è la pressione principale (l'installatore non lo manda al cliente con scritto "fatto con DryConfig — versione gratuita").
- **Studio €49** è il piano centrale di riferimento. Margine sano per noi (target principale di adozione), tutto sbloccato salvo team management avanzato.
- **Team €149** parte dal fatto che 10 utenti × €19 = €190 quindi €149 è uno sconto volume del 22%. Aggiunge ruoli + multi-org per le imprese con più sedi.
- **Trial 7 giorni** = Studio senza limiti, senza carta di credito. Dopo 7gg si downgrade automaticamente al Solo con watermark (forza l'upgrade ma non perde il dato).

## 3. Feature-gate concrete da implementare

### 3.1 Quote conteggiate
- `projects_created_this_month` (mensile, reset al 1° del mese)
- `estimates_created_this_month` (mensile)
- `imported_supplier_ids[]` (cumulativo, finché non si sblocca)
- `org_members_count` (live, count da `organization_members`)

### 3.2 Boolean gates
- `pdf_watermark` (true su Solo, false su Studio+)
- `pdf_branding_custom` (true su Studio+)
- `technical_sheet_export` (true su Studio+)
- `viewer_3d_enabled` (post V2.4, true su Studio+)
- `advanced_roles` (true su Team)
- `multi_org` (true su Team)

### 3.3 Soft-block UX
Quando l'utente sfora una quota:
- **Non lo blocchi** a metà operazione (es. salvataggio preventivo).
- Mostri un dialog "Hai raggiunto il limite del piano Solo (10 preventivi). Aggiorna a Studio per continuare." con CTA upgrade.
- Le azioni "viewer" (consultazione progetti esistenti) restano sempre disponibili.

## 4. Schema DB richiesto

Tabelle da aggiungere (oggi mancanti — vedi `docs/DECISIONS.md`):

```sql
plans              -- tabella di lookup: code, name, monthly_price_eur, features (jsonb)
subscriptions      -- una per org: plan_code, status, current_period_start, current_period_end, trial_ends_at, stripe_customer_id
usage_quotas       -- snapshot consumo per org+mese: estimates_created, projects_created, etc.
```

Helper functions:
- `current_org_plan(org_id uuid) RETURNS plan_code` — cached lookup
- `org_can_create_estimate(org_id uuid) RETURNS boolean` — controlla quota
- `org_has_feature(org_id uuid, feature_key text) RETURNS boolean` — controlla boolean gate

RLS:
- `subscriptions`: lettura per membri org, scrittura solo via service_role (webhook Stripe)
- `usage_quotas`: lettura per membri org, scrittura automatica (trigger su INSERT su estimates/projects)

## 5. Pagamenti

Da CLAUDE.md: decisione **Stripe vs Lemon Squeezy** rimandata.

**Stripe**: standard del mercato, fee 1.5% + €0.25 EU, tu gestisci la fattura. Customer Portal incluso (cliente fa upgrade/downgrade/cancel da solo).

**Lemon Squeezy**: Merchant of Record — paga le tasse al posto tuo (VAT MOSS gestito), fee 5% + $0.50. Più costoso ma azzera la complicazione IVA UE. Sensato se vendi cross-border senza partita IVA strutturata.

**Mia raccomandazione**: per il lancio in Italia, **Stripe** + commercialista che gestisce la fatturazione elettronica B2B. È la scelta professionale lunga. Lemon Squeezy ha senso se vendi globalmente a privati.

## 6. Decisioni aperte da te

- [ ] I limiti che ho proposto (10 preventivi/mese su Solo, 5 progetti/mese, 1 fornitore) sono realistici? O troppo stretti?
- [ ] Il "watermark sul PDF" sul piano Solo è la leva giusta o preferisci un'altra (es. limite numero pagine, blocco logo cliente come ora)?
- [ ] Trial 7gg con downgrade automatico a "Solo con watermark" oppure scadenza secca (l'app si chiude e devi pagare per rientrare)?
- [ ] Stripe o Lemon Squeezy?
- [ ] La vista 3D (V2.4) la consideriamo *premium feature* (Studio+) o l'aggiungiamo a tutti?
- [ ] Piano annuale con sconto (es. -20% se paghi l'anno intero)? Standard nel SaaS, leva acquisizione.

## 7. Sequenza implementazione consigliata

Da fare DOPO il lancio del MVP (cioè: NON è un blocker per partire).

1. **Schema DB** plans + subscriptions + usage_quotas
2. **Helper functions** + RLS
3. **Settings → Piano**: pagina che mostra il piano corrente + uso quote + bottone upgrade
4. **Stripe integration**: checkout + webhook su edge function
5. **Soft-block UX** ai punti critici (creazione preventivo/progetto/import)
6. **Trial flow**: signup → 7gg pieni → countdown → fine
7. **Customer portal** Stripe per gestione carta/downgrade/cancel
