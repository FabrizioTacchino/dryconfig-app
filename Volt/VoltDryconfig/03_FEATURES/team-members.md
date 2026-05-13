# Team & inviti

## Ruoli (5)

Definiti come enum PostgreSQL `organization_role`:

| Ruolo | Capacità |
|---|---|
| `owner` | Pieni poteri, billing, eliminazione organizzazione |
| `admin` | Gestione team, fornitori, sconti, impostazioni org |
| `supervisor` | Approva eliminazione progetti/preventivi, gestisce flussi |
| `technician` | Crea/modifica progetti, preventivi, stratigrafie (no delete) |
| `viewer` | Sola lettura su tutto |

History: prima erano 4 (`owner/admin/manager/technician/viewer`), `manager` rinominato a `supervisor` in F11 (migration `20260511160000`).

## Inviti

- Owner/admin generano link invito (`/settings/members`)
- Token + email salvati in `invitations`
- Link copy-paste (inviato manualmente via WhatsApp/email)
- Scadenza 14 giorni
- Accept: `/invite/:token` → signup-then-join o join-existing
- Email automatica TODO Fase 2 (richiede Resend/SendGrid)

## Feature gate

- Pagina `Members.tsx` accessibile **solo** se `useHasFeature('members')` = piano **Team**
- Trial: vede tutto in anteprima (per provare)
- Solo/Studio: vedono solo upsell card

## Hook chiave

- `useTeamManagement` — `useOrganizationMembers`, `useUpdateMemberRole`, `useRemoveMember`, `useOrganizationInvitations`, `useInviteMember`, `useRevokeInvitation`
- `useOrgPlan` — esporta `useHasFeature(featureName)`
