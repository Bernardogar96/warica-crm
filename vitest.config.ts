import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'dist', 'tests/e2e/**', 'playwright.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'supabase/',
        '**/*.config.*',
        '**/*.test.*',
        'src/test/**',
      ],
      thresholds: {
        // Empezamos bajo. Subir conforme se vayan agregando tests.
        lines: 5,
        functions: 5,
        branches: 5,
        statements: 5,
      },
    },
  },
});
