# Schema DB Supabase

> Project: `aifeyamngllcezkoxzxu` (DryConfigV2). ~25 tabelle. Tutto org-tenant via `organization_id` + RLS.

## Tabelle core

### Multi-tenancy
- `organizations` — anagrafica organization
- `organization_members` — link user ↔ org con `role` (organization_role enum)
- `invitations` — token + email per inviti
- `organization_role` enum: `owner`, `admin`, `supervisor`, `technician`, `viewer`

### Catalogo materiali
- `materials` — anagrafica materiale (60+ campi: EN 520, fire class, EPD, VOC, λ, Rw, ecc.)
  - `unit_price` ← **rilettura via vista `materials_with_pricing` (netto)**, NON direttamente
  - `organization_id NULL` = materiale catalogo globale (Saint-Gobain, Knauf, ecc.)
- `suppliers` — fornitori (global o per-org)
- `supplier_product_families` — famiglie listino (34 SG caricate)
- `customer_discounts` — sconti riservati per famiglia, array `discounts NUMERIC[]` per cumulativi N livelli
- `materials.extra_discount` — sconto aggiuntivo per singolo materiale (sopra famiglia)
- **VIEW `materials_with_pricing`** — calcola `net_price` live RLS-aware → SOURCE OF TRUTH per prezzi

### Stratigrafie
- `stratigraphies` — anagrafica stratigrafia (parete/controsoffitto)
- `layers` — strati di una stratigrafia (FK stratigraphy_id, position, material_id, screw_material_id, screw_quantity, screw_cost_per_sqm, inter_axis)
- `certifications` — fascicoli certificati (Rw, EI, λ misurati)
- `certified_stratigraphy_materials` — composizione certificata

### Preventivi
- `projects` — progetti
- `estimates` — preventivi (status: draft/pending/approved/contracted)
- `estimate_stratigraphies` — snapshot stratigrafia nel preventivo
- `estimate_walls` — pareti del preventivo

### Settings org
- `configurator_settings` — costo orario (key/value), ecc.
- `finish_levels` (Q1-Q4) + `finish_level_components` — BOM finiture
- `screw_preferences` — preferred_codes per categoria board (auto-suggest viti)
- `screw_length_rules`, `screw_spacing_rules` — regole UNI 11424:2015
- `waste_settings` — sfridi per categoria (override per-org)

## RLS pattern

- Tutti i CRUD su tabelle business filtrano via `is_member_of(organization_id)`
- Ruoli per-azione via `has_org_role(organization_id, role[])`
- Helper PostgreSQL: `is_member_of`, `has_org_role`, `default_org_id`
- Trigger `fill_organization_id` come safety net su INSERT senza org

## Trigger importanti

- `recompute_unit_price_for_material` — su modifica `customer_discounts` o `extra_discount`, ricalcola `materials.unit_price`.
  - ⚠️ **Filtra per `organization_id = m.organization_id`** → i materiali con `org=NULL` (catalogo globale) **non vengono mai ricomputati**. Per questo `materials.unit_price` raw = LISTINO per i globali.
  - Soluzione: leggi sempre `materials_with_pricing` (che applica gli sconti via RLS per l'org corrente). Vedi [[../08_GOTCHAS/rls-org-id|gotcha]].
