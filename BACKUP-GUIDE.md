# Guía de Backups — Warica CRM (Supabase Free)

## TL;DR

El plan Free de Supabase **no te da backups accesibles**. Si borras algo por error, lo perdiste. Haz tus propios backups manuales o automatízalos — es gratis y toma 10 minutos.

## Qué incluye cada plan

| Plan | Backups | Retención | Restauración |
|------|---------|-----------|--------------|
| **Free** | Snapshots internos de Supabase (no accesibles para ti) | — | Solo ellos los usan en desastres |
| **Pro ($25/mes)** | Diarios automáticos | 7 días | Desde el dashboard → Database → Backups |
| **Pro + PITR ($125/mes)** | Point-in-Time Recovery | 7–28 días | A cualquier segundo |

## Opción 1 — Backup manual desde el dashboard (la más rápida)

1. Entra a [supabase.com](https://supabase.com) → tu proyecto
2. Database → Backups
3. Descarga el `.sql` manual
4. Guárdalo en Google Drive o un folder local

**Frecuencia recomendada:** una vez por semana, o antes de cualquier cambio importante (migración, nueva tabla, deploy grande).

## Opción 2 — Backup automático con `pg_dump` (lo sólido)

Script para correr localmente o en cron:

```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  > warica-backup-$(date +%Y-%m-%d).sql
```

Reemplaza `[PASSWORD]` y `[PROJECT]` con los de tu proyecto (los encuentras en Supabase → Settings → Database).

## Opción 3 — GitHub Action programado (automatizado, gratis)

Un workflow que corre cada noche y guarda el dump en un repo privado o lo sube a Google Drive. Toma ~10 min configurarlo. Pídeselo a Claude cuando lo quieras armar.

## Cosas importantes que recordar

- **El plan Free pausa tu proyecto si no hay actividad en 7 días.** Los datos NO se borran, solo se duerme. Al reactivarlo desde el dashboard vuelve igual.
- **Los backups NO incluyen storage files** (imágenes, PDFs, etc. que subas al bucket). Eso es aparte.
- Guarda los backups **fuera de Supabase** (Google Drive, repo privado, tu disco). Un backup en el mismo lugar que los datos no es backup.
- Verifica al menos una vez que sepas restaurar un `.sql` — un backup que no has probado no es un backup.

## Cuándo conviene pasar a Pro

Si alguna de estas aplica:
- Warica ya depende del CRM para operar (un día sin datos = pérdida real)
- Pasaste los 500 MB de base de datos
- Te cansa hacer backups manuales y quieres que Supabase se encargue
- Quieres poder restaurar con un click desde el dashboard
