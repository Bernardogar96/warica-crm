# Staging Plan — Warica CRM

## Por qué

Hoy todo se mergea directo a `main` y va a producción. Cualquier bug en una migration o cambio de RLS afecta a usuarios reales. Necesitamos un entorno intermedio donde se puedan validar PRs antes de afectar producción.

## Setup (una sola vez)

1. **Crea segundo proyecto Supabase** (plan Free está bien al inicio):
   - Nombre: `warica-staging`
   - Anota el `project-ref` y `anon_key`.

2. **Aplica las mismas migrations:**
   ```bash
   supabase link --project-ref <ref-staging>
   supabase db push
   ```

3. **Siembra con datos dummy** (NO copies producción — tiene PII real):
   - Crea `supabase/seed.sql` con 5 clientes ficticios, 10 opportunities, 3 employees inventados.
   - `supabase db reset` aplica migrations + seed.

4. **Crea usuarios de prueba:**
   - `admin@warica.test` con role=admin
   - `ventas@warica.test` con role=user
   - `rh@warica.test` con role=rh

5. **Vercel:**
   - En el mismo proyecto Vercel, las Preview Branches usan automáticamente las variables `VITE_SUPABASE_URL`/`ANON_KEY` que pongas en *Preview* environment.
   - Settings → Environment Variables → asegura que **Production** apunta al Supabase real y **Preview** + **Development** apuntan a staging.

6. **GitHub Secrets** (Settings → Secrets → Actions):
   - `STAGING_SUPABASE_URL`
   - `STAGING_SUPABASE_ANON_KEY`
   - `E2E_USER_EMAIL` = admin@warica.test
   - `E2E_USER_PASSWORD` = <password>
   - `SUPABASE_ACCESS_TOKEN` (de `supabase login`)
   - `SUPABASE_DB_PASSWORD`
   - `SUPABASE_PROJECT_REF` = ref de producción (para el job de schema-drift)

## Flujo PR

```
feature-branch
  ↓ push
GitHub Actions: lint + typecheck + unit tests + build  (con anon key staging)
  ↓ ok
PR abierto
  ↓
GitHub Actions: schema-drift + Playwright E2E contra staging
  ↓ ok
Vercel deploya preview a https://warica-crm-<hash>.vercel.app/erp  (apunta a staging)
  ↓ review humano + smoke manual
Merge a main
  ↓
Vercel produce production deploy (apunta al Supabase real)
  ↓
Si la migration es destructiva, primero hace push a staging,
prueba, y solo después corre `supabase db push` contra producción.
```

## Reglas inflexibles

1. Nunca hacer `supabase db push` contra producción desde una laptop. Solo desde CI manual (`workflow_dispatch` con confirmación).
2. Nunca copiar datos de producción a staging. La PII no debe salir.
3. Las migrations destructivas (`DROP COLUMN`, `DROP TABLE`) requieren:
   - Test en staging.
   - Backup manual del bucket S3.
   - Migration de "abandonar" antes (renombrar a `__deprecated_xxx` por 30 días, después borrar).
