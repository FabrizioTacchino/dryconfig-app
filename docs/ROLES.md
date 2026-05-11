# Ruoli e permessi — analisi preliminare

> Documento di lavoro. Mappa lo **stato attuale** del sistema ruoli/RLS in produzione (DryConfigV2) e propone le **decisioni aperte** prima di esporlo all'utente finale come "Gestione utenti".
>
> Ultimo aggiornamento: 2026-05-11

## 1. Ruoli definiti

L'enum Postgres `organization_role` ha **5 valori**:

| Ruolo | Pensato per | Usato oggi? |
|---|---|---|
| `owner` | Titolare dell'organizzazione, fatturazione, eliminazione org | Sì (creato al signup) |
| `admin` | Co-amministratore: gestisce utenti, fornitori, sconti, configurazioni | Sì (assegnabile manualmente) |
| `manager` | Project manager: gestisce progetti/preventivi ma non l'org | **No — orfano**, nessuna policy lo cita |
| `technician` | Operatore: configura stratigrafie e compila preventivi | Sì |
| `viewer` | Sola consultazione, niente write | Sì (de facto, equivalente a "non listato" nelle policy write) |

## 2. Matrice azioni × ruoli (stato attuale)

Estratta dalle RLS policy in produzione. ✓ = permesso, — = negato.

| Azione | owner | admin | manager | technician | viewer |
|---|:-:|:-:|:-:|:-:|:-:|
| **Org** | | | | | |
| Vedere org / membri / inviti | ✓ | ✓ | ✓ | ✓ | ✓ |
| Modificare org (nome, settings) | ✓ | ✓ | — | — | — |
| Gestire membri / inviti | ✓ | ✓ | — | — | — |
| **Catalogo & sconti** | | | | | |
| Vedere materiali / fornitori | ✓ | ✓ | ✓ | ✓ | ✓ |
| Modificare materiali / fornitori | ✓ | ✓ | — | ✓ | — |
| Gestire sconti cliente | ✓ | ✓ | — | — | — |
| **Stratigrafie** | | | | | |
| Vedere stratigrafie certificate + proprie | ✓ | ✓ | ✓ | ✓ | ✓ |
| Creare/modificare stratigrafie custom | ✓ | ✓ | — | ✓ | — |
| **Progetti & preventivi** | | | | | |
| Vedere progetti / preventivi | ✓ | ✓ | ✓ | ✓ | ✓ |
| Creare/modificare progetti | ✓ | ✓ | — | ✓ | — |
| Eliminare progetti | ✓ | ✓ | — | — | — |
| Creare/modificare preventivi | ✓ | ✓ | — | ✓ | — |
| Eliminare preventivi | ✓ | ✓ | — | ✓ | — |
| **Settings configuratore** | | | | | |
| Sfridi, finiture, preferenze viti | ✓ | ✓ | ✓ | ✓ | ✓ |

> ⚠️ **Anomalia**: i Settings (sfridi/finiture/viti) sono attualmente write per **qualsiasi** membro, perché le loro RLS policy usano `is_member_of` invece di `has_org_role`. Da rivedere.

## 3. Gap rilevati

### 3.1 `manager` è orfano
Definito nell'enum ma nessuna policy lo cita nelle write. De facto si comporta come `viewer` (solo read).

**Decisioni aperte:**
- **A.** Rimuoverlo dall'enum (cleanup).
- **B.** Promuoverlo a "PM": come `technician` + può eliminare progetti/preventivi (oggi può solo `admin`).
- **C.** Lasciarlo orfano e nasconderlo nella UI fino a quando serve.

### 3.2 `viewer` non è esplicito nelle policy
Nessuna policy positiva sui `viewer` per le write — funziona "per esclusione". OK ma sarebbe più chiaro un commento `WHERE role <> 'viewer'` esplicito nelle SELECT? In realtà no: tutti vedono tutto grazie a `is_member_of`. La granularità "viewer non vede i prezzi" non è implementata. Se serve, va aggiunta come **column-level RLS** o vista filtrata.

### 3.3 Settings configuratore aperti a tutti
`waste_factors`, `finish_levels`, `screw_preferences` usano `is_member_of` per write → anche `viewer` può modificare gli sfridi. Probabilmente non voluto. **Proposta**: passare a `has_org_role(['owner','admin'])` per write, mantenere read per tutti.

### 3.4 Eliminazione preventivi
Oggi `technician` può eliminare preventivi. Tipicamente è un'azione "amministrativa" da limitare a `admin+owner`. Da confermare col business.

### 3.5 Nessuna distinzione "preventivo proprio" vs "preventivo altrui"
`technician` può modificare/eliminare qualsiasi preventivo della propria org, non solo i suoi. In team piccoli (3-5 persone) va bene; in team più grandi serve un campo `created_by` + policy che restringe write ai propri record per `technician`.

## 4. Proposta ruoli "finali"

Per il lancio SaaS suggerirei di **partire con 3 ruoli** (semplifica UI e onboarding) e tenere gli altri come opzionali avanzati:

| Ruolo pubblico | Mapping enum DB | Cosa fa |
|---|---|---|
| **Titolare** | `owner` | Tutto, incluso fatturazione, cancellazione org |
| **Collaboratore** | `technician` | Configura, preventiva, gestisce catalogo |
| **Sola lettura** | `viewer` | Vede tutto, modifica nulla |

`admin` e `manager` restano nell'enum per quando serviranno (es. piano Team con admin separato dal titolare). Non esposti in UI per ora.

## 5. Implementazione consigliata

1. **Fix RLS Settings** (waste_factors, finish_levels, screw_preferences) → role-gated invece di member-only.
2. **Decidere manager**: rimuoverlo o promuoverlo? (decisione tua).
3. **UI gestione membri**: dropdown ruolo con i 3 ruoli pubblici + tooltip "ruoli avanzati disponibili su piano Team".
4. **Test scenari**: 1 owner, 1 technician, 1 viewer in un'org test → verificare per ogni pagina cosa vedono / cosa possono fare. Fissare bug eventuali.
5. **Feature gate "vedi prezzi"** (opzionale): se serve un ruolo "venditore senza prezzi", servirà nuova architettura (column-level RLS o view).

## 6. Decisioni aperte da te

- [ ] Eliminare `manager` dall'enum o promuoverlo a "PM" (vedi §3.1)?
- [ ] Eliminazione preventivi solo admin/owner, o anche technician (oggi)?
- [ ] Per il lancio: 3 ruoli pubblici (semplice) o 5 (granulare)?
- [ ] "Viewer senza prezzi" è una feature da prevedere subito o post-lancio?
