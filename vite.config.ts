import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // strictPort: se 8080 e` occupata, Vite si rifiuta di partire invece di
    // fallback-are su 8081/8082/... Quelle porte non sono in CORS allowed
    // origins di Supabase → tutte le query DB fallirebbero silenziosamente
    // (dashboard piatta, ecc.). Meglio errore chiaro all'avvio.
    strictPort: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Sentry source maps upload: attivo SOLO in build prod e SOLO se
    // SENTRY_AUTH_TOKEN è impostato (su Vercel come secret). Senza,
    // il build passa lo stesso ma le stack trace su Sentry restano minified.
    mode === 'production' && process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Carica i source maps ma non li espone in produzione (rimossi a fine
      // build dal plugin stesso quando `sourcemaps.assets` non è custom).
      sourcemaps: {
        assets: './dist/**',
      },
      release: {
        name: process.env.VERCEL_GIT_COMMIT_SHA,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Source maps necessari per Sentry — il plugin sopra li carica e poi il
    // server di Vercel non li serve perché restano nella dist locale del build.
    sourcemap: true,
    // Spezziamo le dipendenze pesanti in chunk vendor separati per migliorare
    // il time-to-interactive iniziale (oggi index.js ~2.5MB → ~700kB gzip).
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          // PDF + canvas: pesanti, caricati solo quando si esporta
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) {
            return 'vendor-pdf';
          }
          if (id.includes('xlsx')) return 'vendor-xlsx';
          // UI primitives Radix
          if (id.includes('@radix-ui')) return 'vendor-radix';
          // Supabase
          if (id.includes('@supabase')) return 'vendor-supabase';
          // TanStack Query / Table
          if (id.includes('@tanstack')) return 'vendor-tanstack';
          // Drag & drop
          if (id.includes('@dnd-kit')) return 'vendor-dnd';
          // Charts (recharts, d3, ecc.)
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          // Icone
          if (id.includes('lucide-react')) return 'vendor-icons';
          // React + react-dom + router restano nell'index per evitare
          // problemi di hoisting e di tree-shaking.
          return undefined;
        },
      },
    },
    // Alziamo il warning a 1MB (i chunk legittimamente grandi tipo vendor-radix
    // sono ~700kB e non vogliamo essere infastiditi).
    chunkSizeWarningLimit: 1000,
  },
}));
