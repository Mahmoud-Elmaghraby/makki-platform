#!/usr/bin/env bash
# إعداد استضافة الفيديو على السيرفر (يتشغّل مرة واحدة كـ root، وآمن لو اتشغّل تاني).
# - بيعمل مجلد الميديا
# - بيكتب إعداد nginx للمقاطع الموقّعة (secure_link) ويضيفه للموقع
# - بيعمل backup ويرجّع الإعداد القديم لو nginx -t فشل
set -euo pipefail

SITE=/etc/nginx/sites-available/makki
ENVFILE=/var/www/makki-platform/apps/api/.env
MEDIA_BASE=/var/www/makki-media
SNIP=/etc/nginx/snippets/makki-media.conf

nginx -V 2>&1 | grep -q secure_link || { echo "ERROR: nginx مفيهوش secure_link module"; exit 1; }
[ -f "$SITE" ] || { echo "ERROR: $SITE مش موجود"; exit 1; }

JWT=$(grep -E '^JWT_SECRET=' "$ENVFILE" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
[ -n "$JWT" ] || { echo "ERROR: JWT_SECRET مش موجود في $ENVFILE"; exit 1; }
SECRET=$(printf 'media-v1' | openssl dgst -sha256 -hmac "$JWT" | awk '{print $NF}')

mkdir -p "$MEDIA_BASE/media/lessons" /etc/nginx/snippets /root/backups
chmod 755 "$MEDIA_BASE" "$MEDIA_BASE/media"

cat > "$SNIP" <<CONF
# مولّد بـ scripts/setup-media.sh — متعدّلوش يدويًا
location ^~ /media/ {
    if (\$uri !~ "^/media/lessons/[A-Za-z0-9_-]+/hls/[A-Za-z0-9]+/seg_[0-9]+\.ts\$") { return 404; }
    secure_link \$arg_s,\$arg_e;
    secure_link_md5 "\$secure_link_expires\$uri $SECRET";
    if (\$secure_link = "") { return 403; }
    if (\$secure_link = "0") { return 410; }
    root $MEDIA_BASE;
    types { video/mp2t ts; }
    add_header Cache-Control "private, max-age=3600";
    add_header X-Content-Type-Options nosniff;
    access_log off;
}
CONF
chmod 600 "$SNIP"

BACKUP=/root/backups/makki-nginx-$(date +%Y%m%d_%H%M%S).conf
cp "$SITE" "$BACKUP"

if ! grep -q 'snippets/makki-media.conf' "$SITE"; then
  python3 - "$SITE" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p).read()
m = re.search(r'^[ \t]*location\s+/api/?\s*\{', s, re.M)
if not m:
    sys.exit("ERROR: مش لاقي location /api/ في الإعداد")
s = s[:m.start()] + "    include /etc/nginx/snippets/makki-media.conf;\n\n" + s[m.start():]
open(p, 'w').write(s)
PY
fi

if nginx -t; then
  systemctl reload nginx
  echo "MEDIA_SETUP_OK  (backup: $BACKUP)"
else
  cp "$BACKUP" "$SITE"
  nginx -t || true
  echo "ERROR: nginx -t فشل، اتّرجّع الإعداد القديم"
  exit 1
fi
