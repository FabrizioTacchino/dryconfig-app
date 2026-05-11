import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
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
