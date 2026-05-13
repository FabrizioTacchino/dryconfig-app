# 2026-05-06 — Backend: Supabase

**Decisione**: Manteniamo Supabase (Postgres + Auth + RLS + Storage + Edge Functions).

## Motivazioni

- Già configurato e popolato.
- Postgres = zero lock-in vero (export sempre possibile).
- Scala bene fino a SaaS medio-grande (10k+ utenti).
- Auth, RLS, Storage ed Edge Functions in un singolo posto = velocità di sviluppo.

## Quando rivalutare

Oltre 10.000 clienti paganti, valutare migrazione a infra dedicata (Postgres self-hosted + Cognito/Clerk).
