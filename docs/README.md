# Warica CRM — Docs

Documentación operativa del proyecto. Para arquitectura y stack mira el README de la raíz; aquí vive solo lo que necesitas cuando algo se rompe o cuando vas a hacer un cambio sensible.

| Archivo | Para qué |
|---|---|
| [`runbook.md`](./runbook.md) | Pasos cuando hay un incidente (app caída, datos perdidos, sospecha de brecha). |
| [`security-audit.sql`](./security-audit.sql) | Queries para auditar RLS en Supabase. Correr trimestralmente. |
| [`backup-strategy.md`](./backup-strategy.md) | Cómo están configurados los backups y cómo hacer un restore drill. |
| [`staging-plan.md`](./staging-plan.md) | Cómo montar y operar el entorno de staging. |

## Plan de endurecimiento (fases)

Ejecución en `supabase/migrations/`, `src/`, `.github/workflows/`. Estado al 2026-05-17:

- [x] **Fase 0** — RLS en todas las tablas + fix anti-auto-promoción + script de audit. (`20260517000000_enable_rls_all_tables.sql`)
- [x] **Fase 1** — ErrorBoundary, BootError, try/catch en bootstrap, ESLint cubriendo .ts/.tsx, tipos alineados.
- [x] **Fase 2** — Sentry scaffolded (no-op sin DSN), Edge Function `health` para uptime monitors.
- [x] **Fase 3** — `supabase/config.toml`, README de workflow de migrations, schema versionado.
- [x] **Fase 4** — Edge Functions `approve-quote` y `gcal-create-event`; trigger DB que crea project al ganar opportunity.
- [x] **Fase 5** — CI: lint + typecheck + unit + build + schema-drift + Playwright. Vitest config. Playwright config.
- [x] **Fase 6** — Code-splitting (React.lazy) por módulo, manualChunks en vite.config, bundle visualizer opcional, índices SQL.
- [x] **Fase 7** — Runbook, backup script semanal, plan de staging, backup-strategy.

## Pendiente (requiere credenciales / acción humana)

1. Correr `supabase login` + `supabase link --project-ref rijyyucrrbkcyovmxpby`.
2. Correr `supabase db push` para aplicar las 3 migrations al remoto.
3. Configurar GitHub Secrets (ver `staging-plan.md`).
4. Crear proyecto Supabase staging.
5. Configurar Vercel env vars (Production vs Preview).
6. Crear cuenta Sentry → poner DSN en Vercel.
7. Mover el webhook URL/token de GCal a `supabase secrets set GCAL_WEBHOOK_URL=... GCAL_WEBHOOK_TOKEN=...` y deploy de `gcal-create-event`.
8. **Refactor cliente:** cambiar `useEffect + supabase.from(...)` por `useQuery` en los hooks `useOpportunities`, `useClients`, etc. (Fase 6.3 — beneficio grande, riesgo bajo, pendiente porque toca muchos archivos.)
9. **Refactor AdminView:** quitar el UPDATE directo de `profiles.role/active`; reemplazarlo por una Edge Function `update-profile-role` que valide rol del caller. (Aunque ya queda bloqueado por RLS, mejor que el cliente ni lo intente.)
