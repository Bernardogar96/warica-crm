import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Solo en builds locales con ANALYZE=1 npm run build
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  build: {
    sourcemap: mode === 'production' ? 'hidden' : true,
    rollupOptions: {
      output: {
        // rolldown (Vite 8) exige que manualChunks sea función, no objeto.
        // Separar libs pesadas para que la primera carga (login) no las pague.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            id.includes('/react-router-dom/') ||
            id.includes('/react-router/') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          ) return 'react-vendor';
          if (id.includes('/recharts/')) return 'recharts';
          if (id.includes('/@supabase/supabase-js/')) return 'supabase';
          if (id.includes('/@tanstack/react-query/')) return 'react-query';
        },
      },
    },
  },
}));
