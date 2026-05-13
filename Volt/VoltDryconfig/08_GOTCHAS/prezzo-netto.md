# Gotcha: prezzo netto vs listino

## Regola d'oro

**Per il prezzo unitario di un materiale, leggi sempre dalla VIEW `materials_with_pricing`. MAI da `materials.unit_price` raw.**

## Perché

Il DB ha:
- `materials.list_price` — listino del fornitore
- `materials.unit_price` — netto post-sconti, ricomputato da trigger
- VIEW `materials_with_pricing` — applica gli sconti dell'org corrente via RLS

Sembra che `materials.unit_price` sia sempre il netto, ma c'è un cavillo (vedi [[rls-org-id]]):

> Il trigger `recompute_unit_price_for_material` filtra `WHERE cd.organization_id = m.organization_id`. I materiali catalogo globale hanno `organization_id = NULL`, quindi il trigger NON scatta mai per loro. Risultato: `unit_price = list_price` per i materiali globali.

## Eccezione: hook che già usa la vista

`useMaterials` legge direttamente da `materials_with_pricing` → safe.

Tutti gli altri hook che fanno **join FK su `materials`** (`materials!layers_material_id_fkey(...)`) prendono `unit_price` raw → DEVONO fare un override post-fetch.

## Pattern override

```ts
// Dopo il join FK, raccogli gli ID e refetcha la VIEW
const matIds = layers
  .map(l => l.materials?.id)
  .filter((x): x is string => !!x);

const { data: pricing } = await supabase
  .from('materials_with_pricing' as any)
  .select('id, unit_price')
  .in('id', Array.from(new Set(matIds)));

const priceMap = new Map<string, number>();
for (const p of (pricing ?? []) as any[]) {
  priceMap.set(p.id, Number(p.unit_price ?? 0));
}

// Applica override
for (const l of layers) {
  if (l.materials?.id && priceMap.has(l.materials.id)) {
    l.materials.unit_price = priceMap.get(l.materials.id);
  }
}
```

## Hook con override applicato (dopo F19/F20)

- `useStratigraphy.ts` (load)
- `useBulkUpdateEstimateStratigraphyPrices.tsx`
- `useUpdateGeneralStratigraphyPrices.tsx`
- `useFinishLevels.ts` (preview finitura)
- `useCreateEstimateStratigraphy.tsx` (`fetchFinishCostSnapshot`)

## Quando aggiungere un nuovo hook che legge materiali

Checklist:
- [ ] Stai facendo join FK su `materials`? → aggiungi override da `materials_with_pricing`
- [ ] Stai leggendo direttamente da `materials_with_pricing`? → safe, niente override
- [ ] Stai mostrando un prezzo in UI? → deve essere il NETTO

## Display UX

Il componente `MaterialPriceTag` mostra: netto in evidenza + listino barrato + % sconto.
L'utente finale **non deve mai vedere solo il listino** senza contesto. Il prezzo "finito al m²" è la metrica che gli serve davvero.
