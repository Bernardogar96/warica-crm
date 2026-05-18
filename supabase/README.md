# Supabase — Warica CRM

El schema de la DB vive en este folder. **Source of truth**: los archivos en `migrations/`. No cambies cosas desde Studio sin reflejarlo aquí.

## Setup (primera vez)

```bash
npm install -g supabase
supabase login                # abre browser y autentica
supabase link --project-ref rijyyucrrbkcyovmxpby
```

## Flujos comunes

**Bajar cambios remotos al repo** (si alguien tocó la DB desde Studio):

```bash
supabase db pull
# Revisa el .sql generado en migrations/, commitea si está bien.
```

**Crear una migration nueva:**

```bash
supabase migration new agregar_columna_telefono_a_clients
# Edita supabase/migrations/<timestamp>_agregar_columna_telefono_a_clients.sql
# Ejemplo: ALTER TABLE clients ADD COLUMN telefono text;

supabase db push              # aplica al remoto
```

**Verificar que remoto y repo están en sync:**

```bash
supabase db diff --linked --schema public
# Si imprime algo, el remoto se desvió del repo. Decide: pull o push.
```

**Probar contra DB local (Docker):**

```bash
supabase start                # arranca Postgres + Studio en localhost
supabase db reset             # re-aplica TODAS las migrations en orden
supabase stop
```

## Migrations actuales

| Archivo | Qué hace |
|---|---|
| `20260517000000_enable_rls_all_tables.sql` | Habilita RLS y crea policies para profiles, crm_config, clients, opportunities, projects, invoices, employees, payroll_*, suppliers, purchase_*. Incluye fix anti-auto-promoción a admin. |
| `20260517000100_indexes_opportunities_jsonb.sql` | Índices funcionales sobre `opportunities.data->>'stage'`, salesperson, etc. + GIN sobre el blob completo. |
| `20260517000200_trigger_opportunity_won_creates_project.sql` | Trigger que crea project automáticamente cuando una opportunity entra a `cerrada_ganada`. Mueve la lógica fuera del cliente. |

## Auditar RLS

Corre `docs/security-audit.sql` (en la raíz del repo) en Supabase SQL Editor. Si **cualquier query devuelve filas**, hay algo que arreglar.

## Edge Functions

Deploy:

```bash
supabase functions deploy health --no-verify-jwt
supabase functions deploy approve-quote
supabase functions deploy gcal-create-event
```
