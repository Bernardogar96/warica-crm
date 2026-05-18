# Backup Strategy — Warica CRM

## Capas de defensa

1. **Supabase managed backups**
   - Plan Free: backup diario, retenido 7 días, NO point-in-time.
   - Plan Pro ($25/mes): PITR de 7 días, restaurable al minuto.
   - **Recomendación:** subir a Pro. La diferencia entre "perdí 12h" y "perdí 30 segundos" justifica el costo.

2. **Export semanal a S3 / GCS (este repo)**
   - `scripts/weekly-backup.sh` corre cada lunes 03:00 UTC vía GitHub Actions.
   - Dump filtrado de tablas críticas: `employees, payroll_*, clients, opportunities, projects, invoices, purchase_*, suppliers`.
   - Comprimido + cifrado, subido a S3 Standard-IA.
   - Retención: 12 meses.
   - Costo estimado: < $1 USD/mes para volumen actual.

3. **Schema en git**
   - `supabase/migrations/*.sql` son el source of truth del esquema.
   - Permite recrear la DB desde cero en cualquier proyecto Supabase nuevo.

## Restore drill

Una vez al trimestre (recordatorio en calendario):

1. Crea proyecto Supabase temporal (`warica-restore-test`).
2. Aplica todas las migrations: `supabase db push`.
3. Descarga el último backup de S3.
4. Importa: `psql $RESTORE_DB_URL < backup.sql`.
5. Verifica que tablas críticas tienen datos. Cuenta filas.
6. Borra el proyecto temporal.

Si el drill falla, los backups NO sirven y hay que arreglar antes de necesitarlos en serio.
