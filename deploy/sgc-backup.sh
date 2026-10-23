#!/bin/bash
# Respaldo diario SGC Portal: pg_dump local + copia OFF-SITE cifrada a Backblaze B2.
# Instalar como /etc/cron.daily/sgc-backup (chmod +x). Requiere remote rclone "b2crypt-sgc".
set -e
LOG=/var/log/sgc-backup.log
DIR=/root/backups/sgc
mkdir -p "$DIR"
{
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) starting backup ==="
  F="$DIR/sgc-$(date -u +%Y%m%d-%H%M).dump"
  docker exec sgc-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$F"
  docker exec -i sgc-db pg_restore --list < "$F" >/dev/null && echo "dump OK: $(du -h "$F" | cut -f1) $F"
  # Retención local: últimos 14
  ls -1t "$DIR"/sgc-*.dump | tail -n +15 | xargs -r rm -f
  # OFF-SITE cifrado
  rclone copy "$DIR" b2crypt-sgc: --include 'sgc-*.dump' --max-age 2d --transfers 2 -q
  # Retención remota: 30 días
  rclone delete b2crypt-sgc: --include 'sgc-*.dump' --min-age 30d -q || true
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) done ==="
} >>"$LOG" 2>&1
