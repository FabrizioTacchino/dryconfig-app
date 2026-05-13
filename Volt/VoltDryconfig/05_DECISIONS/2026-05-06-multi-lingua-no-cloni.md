# 2026-05-06 — Multi-lingua: una sola app, no cloni

**Decisione**: Per espansione estera useremo **i18n** + tabella `regulations` per normative paese-specifiche. **Non** cloneremo l'app per ogni paese.

## Motivazioni

- Cloni = manutenzione 2x, allineamento bugfix, divergenza features inevitabile.
- i18n è uno standard maturo, costo ~1 giorno per aggiungere ogni lingua.
- `country_code` su `certifications` e `regulations` permette stratigrafie diverse per paese mantenendo logica unica.

## Implicazioni

- Tutte le UI strings devono passare per i18n key (non hardcoded). TODO quando arriva la prima lingua diversa dall'italiano.
- Normative paese-specifiche: tabella `regulations` con `country_code`, applicabile a stratigrafie (es. EN 1364 in EU, ASTM E119 in US).
