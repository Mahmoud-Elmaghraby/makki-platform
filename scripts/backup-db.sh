#!/usr/bin/env bash
# نسخة احتياطية يومية لقاعدة البيانات (بتتشغّل بالـ cron). بتحتفظ بآخر 7 أيام.
# الفيديوهات المحوّلة مش بتتنسخ هنا (الأصول الأصلية محفوظة عند صاحب المنصة).
set -euo pipefail
ENVFILE=/var/www/makki-platform/apps/api/.env
DIR=/root/backups/db
mkdir -p "$DIR"
DBURL=$(grep -E '^DATABASE_URL=' "$ENVFILE" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" -e 's/?schema=.*$//')
[ -n "$DBURL" ] || { echo "DATABASE_URL مش موجود"; exit 1; }
OUT="$DIR/makki_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump "$DBURL" | gzip -9 > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"
# تأكد إن الملف مش فاضي
[ "$(stat -c%s "$OUT")" -gt 1000 ] || { echo "الباك أب صغير بشكل مريب"; exit 1; }
find "$DIR" -name 'makki_*.sql.gz' -mtime +7 -delete
echo "BACKUP_OK $OUT"
