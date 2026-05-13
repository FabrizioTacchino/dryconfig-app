# Gotcha: trigger recompute filtra per organization_id

## Regola d'oro

**`materials.unit_price` per i materiali catalogo globale (org=NULL) NON viene mai aggiornato dai trigger.**

## Dettaglio

Il trigger `recompute_unit_price_for_material` ricalcola `materials.unit_price` quando cambia uno sconto in `customer_discounts` o `materials.extra_discount`. La sua clausola WHERE:

```sql
WHERE cd.organization_id = m.organization_id
```

Per i materiali globali (Saint-Gobain, Knauf, Fassa, ecc.) `m.organization_id IS NULL`. Quindi il join con `customer_discounts` (che ha sempre `cd.organization_id` valorizzato perché è uno sconto dell'org cliente) **non matcha mai**. Il trigger non scatta e `unit_price` resta uguale a `list_price`.

## Come è risolto a runtime

La VIEW `materials_with_pricing` non ha questa limitazione:
- Non filtra hard su `organization_id`
- È RLS-aware: ogni org vede solo i suoi sconti
- Joina lato view i `customer_discounts` dell'utente corrente con i materiali globali
- Risultato: `materials_with_pricing.unit_price` = netto applicando gli sconti dell'org corrente sui materiali globali

Quindi: **leggi sempre dalla vista**, vedi [[prezzo-netto]].

## Perché non sistemiamo il trigger?

Possibile, ma costoso:
- Ogni modifica a `customer_discounts` farebbe UPDATE su MIGLIAIA di materiali globali (Saint-Gobain ha 1066 record)
- Tipologicamente è impossibile avere un `unit_price` "univoco" per un materiale globale, perché ogni org ha sconti diversi
- La vista è semanticamente corretta: il netto è una funzione di (materiale, org)

Quindi la VIEW è il design giusto. Il trigger fa quello che può fare (materiali per-org).

## Materiali per-org vs globali

| Tipo | `organization_id` | Trigger ricomputa? | Vista mostra? |
|---|---|---|---|
| Catalogo globale (SG, Knauf, ecc.) | NULL | NO | SÌ (netto per org corrente) |
| Custom dell'org | valorizzato | SÌ | SÌ |

## Quando aggiungere un nuovo materiale catalogo globale

Se carichi un listino fornitore globale (es. nuovo brand), `organization_id` resta NULL. Lo sconto si applica via `customer_discounts` dell'org cliente. La vista lo gestisce. Niente da fare al trigger.
