# Warica CRM — Runbook de Incidentes

Documento operativo para cuando algo se rompe en producción. Mantenlo corto y accionable; los detalles arquitectónicos viven en otro lado.

## Contactos de emergencia

| Rol | Quién | Cómo |
|---|---|---|
| Owner | Bernardo | bernygg96@gmail.com |
| Supabase support | — | https://supabase.com/dashboard/support/new |
| Vercel support | — | https://vercel.com/help |
| Apps Script | Bernardo | El script vive en la cuenta de Google personal del owner |

## Arquitectura express

```
Browser
  └─ crm.warica.com (Vercel, SPA Vite + React)
       ├─ @supabase/supabase-js → Supabase API (rijyyucrrbkcyovmxpby.supabase.co)
       │     ├─ PostgREST  (CRUD con anon key + RLS)
       │     ├─ GoTrue     (auth)
       │     └─ Edge Functions (health, approve-quote, gcal-create-event)
       └─ supabase.functions.invoke('gcal-create-event') → Apps Script → Google Calendar
```

---

## Incidente: la app está abajo

**Síntoma:** crm.warica.com no responde o pantalla blanca.

1. Verifica frontend en Vercel: https://vercel.com/dashboard → proyecto warica-crm → Deployments
   - ¿Último deploy falló? Promote el anterior verde.
2. Verifica Supabase: https://supabase.com/dashboard/project/rijyyucrrbkcyovmxpby
   - Banner rojo arriba = problema de la plataforma. Esperar.
   - Database → Roles & Connections: ¿hay > 60 conexiones? Probable connection storm; revisar pooler.
3. Verifica health endpoint:
   ```bash
   curl https://rijyyucrrbkcyovmxpby.functions.supabase.co/health
   ```
   - `{"status":"ok",...}` → DB y functions vivas.
   - `{"status":"error",...}` → DB inalcanzable.
4. Revisa Sentry: https://sentry.io → proyecto warica-crm. ¿Spike de errores? Abre el evento más reciente.

---

## Incidente: un usuario reporta datos perdidos

**Antes de tocar nada:** confirma alcance — ¿cuántas filas, qué tabla, en qué ventana de tiempo?

1. **Si fue en las últimas 7 días y tienes plan Pro:** Point-in-Time Recovery.
   - Supabase Dashboard → Database → Backups → Restore to point in time.
   - Restaura a un proyecto NUEVO (`warica-recovery`), exporta las filas afectadas con `pg_dump` filtrado, e importa a producción.
   - NUNCA restaures encima de producción directamente.
2. **Si fue antes de los 7 días:** usa los backups semanales en S3 (ver `scripts/weekly-backup.sh`).
3. Documenta el incidente: causa, alcance, qué se restauró, hora.

---

## Incidente: sospecha de brecha de seguridad

**Acción inmediata (en este orden):**

1. **Revoca el anon key actual:**
   - Supabase Dashboard → Settings → API → Reset anon key
   - Actualiza `VITE_SUPABASE_ANON_KEY` en Vercel y redeploy.
2. **Audita acceso reciente:**
   - Database → Logs → últimas 24 h. Filtra por IP sospechosa.
   - Auth → Users: ¿hay cuentas nuevas que no autorizaste?
3. **Revisa RLS:** corre `docs/security-audit.sql` y revisa que no haya nuevas policies `USING (true)`.
4. **Si confirmas brecha:**
   - Avisa a clientes afectados (LFPDPPP / GDPR si aplica).
   - Rota `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → Reset service_role).
   - Rota `GCAL_WEBHOOK_TOKEN` (`supabase secrets set GCAL_WEBHOOK_TOKEN=...`).
   - Cambia password de la cuenta admin de Apps Script.

---

## Incidente: un deploy rompió producción

1. Vercel Dashboard → Deployments → click el último verde → **Promote to Production**.
2. Identifica el PR culpable, marca `revert` en GitHub.
3. Si fue una migration mala:
   - Supabase Dashboard → Database → Migrations → revisa cuál se aplicó.
   - Escribe una migration nueva que la revierta (no edites la rota).
   - `supabase db push`.

---

## Operaciones rutinarias

### Promover un usuario a admin

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'fulano@warica.com';
```

(Las policies anti-auto-promoción solo se aplican al cliente. El service_role en SQL Editor sí puede.)

### Desactivar un usuario

```sql
UPDATE profiles SET active = false WHERE email = 'fulano@warica.com';
```

La app respeta `active=false` en el bootstrap y lo manda a pantalla de "cuenta desactivada".

### Resetear password de un usuario

Auth → Users → click el usuario → "Send password recovery". Llega email.

### Aplicar una migration nueva

```bash
supabase migration new <nombre>
# Edita el SQL
supabase db push
git commit -am "migration: <nombre>"
```

### Forzar redeploy de Vercel

Vercel Dashboard → Deployments → último → "..." → Redeploy.

---

## SLOs (objetivos no contractuales, solo guía interna)

- Uptime: 99.5% mensual (≈ 3.6 h de downtime permitido/mes).
- Tiempo de carga inicial (login): < 3 s p95.
- Tiempo de respuesta API (PostgREST): < 500 ms p95.
- MTTR de incidente crítico: < 1 h en horario laboral.

Cuando algo se aparte de esto, escribe un post-mortem corto en `docs/postmortems/YYYY-MM-DD-<slug>.md`.
