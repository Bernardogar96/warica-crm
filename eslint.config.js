import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'coverage',
    'playwright-report',
    'test-results',
    'supabase/.branches',
    'supabase/.temp',
    // Deno runtime — los lintea otra herramienta (deno lint)
    'supabase/functions/**',
    // Google Apps Script — corre en otro runtime, no en Node
    'google-*-webhook.js',
    // Shell scripts
    'scripts/**',
  ]),

  // ── Código de la app (browser) ──────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        // Mucho código pre-existente usa `React.CSSProperties` sin importar
        // React. Funciona en tiempo de build gracias a jsx:react-jsx; tratamos
        // a React como global aquí para no obligar a refactor masivo.
        React: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React-hooks v7 trae varias reglas nuevas muy estrictas. Las dejamos
      // como warnings: flag-ean patrones legítimos pero no son bugs.
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': 'off',
    },
  },

  // ── Tests (browser + node) ──────────────────────────────────────
  {
    files: ['src/test/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // ── Config files de Node (vite, vitest, playwright, eslint) ──────
  {
    files: ['*.config.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
])
