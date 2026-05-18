#!/usr/bin/env bash
# scripts/weekly-backup.sh
#
# Dump semanal de tablas críticas a S3.
# Pensado para correr en GitHub Actions con `on: schedule: - cron: '0 3 * * 1'`.
#
# Requiere los siguientes env vars / secrets:
#   SUPABASE_DB_URL        postgres://postgres:<pw>@db.<ref>.supabase.co:5432/postgres
#   AWS_ACCESS_KEY_ID
#   AWS_SECRET_ACCESS_KEY
#   AWS_REGION             (ej: us-east-1)
#   BACKUP_BUCKET          (ej: warica-backups)
#   BACKUP_ENCRYPTION_KEY  (passphrase para gpg --symmetric)
#
# Uso local:
#   export SUPABASE_DB_URL=...
#   export AWS_ACCESS_KEY_ID=...
#   ...
#   bash scripts/weekly-backup.sh
set -euo pipefail

TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
WORKDIR=$(mktemp -d)
DUMP="$WORKDIR/warica-$TIMESTAMP.sql"
ENCRYPTED="$DUMP.gpg"

echo "[backup] Dumping tablas críticas a $DUMP"
pg_dump "$SUPABASE_DB_URL" \
  --no-owner --no-acl \
  --schema=public \
  --table=employees \
  --table=payroll_periods \
  --table=payroll_entries \
  --table=clients \
  --table=opportunities \
  --table=projects \
  --table=invoices \
  --table=suppliers \
  --table=purchase_requests \
  --table=purchase_quotes \
  --table=purchase_orders \
  --table=profiles \
  --table=crm_config \
  -f "$DUMP"

echo "[backup] Cifrando con gpg --symmetric (AES256)"
echo "$BACKUP_ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 \
  --symmetric --cipher-algo AES256 --output "$ENCRYPTED" "$DUMP"

# Borra el dump sin cifrar inmediatamente
rm -f "$DUMP"

S3_KEY="weekly/$TIMESTAMP.sql.gpg"
echo "[backup] Subiendo a s3://$BACKUP_BUCKET/$S3_KEY"
aws s3 cp "$ENCRYPTED" "s3://$BACKUP_BUCKET/$S3_KEY" \
  --storage-class STANDARD_IA \
  --metadata "source=warica-crm,timestamp=$TIMESTAMP"

echo "[backup] ✓ Hecho. Limpiando workdir."
rm -rf "$WORKDIR"

# Limpia objetos de más de 12 meses
echo "[backup] Limpiando backups de más de 365 días"
aws s3 ls "s3://$BACKUP_BUCKET/weekly/" | \
  awk '{print $4}' | \
  while read -r key; do
    [ -z "$key" ] && continue
    age_days=$(( ( $(date +%s) - $(date -d "$(aws s3api head-object --bucket "$BACKUP_BUCKET" --key "weekly/$key" --query LastModified --output text)" +%s) ) / 86400 ))
    if [ "$age_days" -gt 365 ]; then
      echo "[backup] eliminando $key (edad: ${age_days}d)"
      aws s3 rm "s3://$BACKUP_BUCKET/weekly/$key"
    fi
  done

echo "[backup] Done."
