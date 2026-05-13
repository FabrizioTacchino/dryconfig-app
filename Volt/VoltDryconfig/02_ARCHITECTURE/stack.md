# Stack tecnico

## Frontend

- **Vite 5** + **React 18** + **TypeScript** strict
- **shadcn-ui** (componenti) + **Tailwind CSS** (utility)
- **react-router-dom** v6 (routing client-side)
- **@tanstack/react-query** v5 (state server, caching)
- **react-hook-form** + **zod** (form + validazione)
- **next-themes** (dark mode, no flash al reload)
- **dnd-kit** (drag&drop layer configuratore)
- **cmdk** (command palette / material picker)
- **lucide-react** (icone)
- **sonner** (toast)
- **three** + **@react-three/fiber** (vista 3D, in evoluzione)

## Backend / DB / Auth

- **Supabase**: Postgres 17 + Auth + RLS + Storage + Edge Functions
- **Project ID prod**: `aifeyamngllcezkoxzxu` (DryConfigV2)
- **URL**: `https://aifeyamngllcezkoxzxu.supabase.co`
- **Region**: eu-central-2

## Export

- **jspdf** + **jspdf-autotable v5** (PDF RDA, preventivi)
- **xlsx** (export Excel materiali)
- **html2canvas** (snapshot scheda tecnica V2)

## Hosting & infra

- **Vercel**: auto-deploy da `main` su `https://github.com/FabrizioTacchino/dryconfig-app`
- **Dominio**: `dryconfig.com` (registrato su Cloudflare)
- **DNS**: Cloudflare → CNAME flattening su apex + `www` → Vercel

## Tool che NON usiamo (e perché)

- **Flutter**: scartato (riscrittura intera, vedi decisione)
- **Lovable**: scartato (eravamo lì, ora su Claude Code in locale)
- **Netlify**: scartato per Vercel (integrazione Vite migliore)
- **Auth0/Clerk**: scartato per Supabase Auth (già inclusa)

## File chiave dove vivono le config

- `vite.config.ts` — bundler config (manualChunks, alias `@/`)
- `tailwind.config.ts` — theme + dark mode
- `src/integrations/supabase/client.ts` — client tipato + key from `import.meta.env`
- `src/main.tsx` — entry React + Providers (QueryClient, Theme, Org, Auth, Router)
- `supabase/config.toml` — project_id
