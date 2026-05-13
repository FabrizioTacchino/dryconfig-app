# 2026-05-06 — Stack: React + Vite (no Flutter)

**Decisione**: Manteniamo React 18 + Vite + TypeScript + shadcn-ui + Tailwind. Non riscriviamo in Flutter.

## Motivazioni

- Codebase già scritta da Lovable in ~6 mesi (PDF/RDA, calcolo viti, configurator). Riscrivere = -6 mesi netti.
- React + PWA copre web, iOS e Android con una sola codebase.
- Se in futuro servirà presenza in App Store/Play Store, wrapper Capacitor in 1-2 settimane senza riscrivere.

## Alternative scartate

- **Flutter**: app native su iOS/Android/Web/Desktop ma riscrittura completa. Costo: 4-6 mesi.
- **Native iOS + Android**: due codebase separate, costo proibitivo per uno sviluppatore solo.

## Quando rivalutare

Se la performance mobile su browser dovesse essere bloccante anche con PWA + Capacitor.
