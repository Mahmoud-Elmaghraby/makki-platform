#!/usr/bin/env bash
# تثبيت استقرار السيرفر (يتشغّل مرة واحدة كـ root، وآمن لو اتشغّل تاني):
#  1) pm2-logrotate: عشان اللوجات متملّاش القرص
#  2) pm2 startup/save: عشان التطبيقات ترجع لوحدها بعد إعادة تشغيل السيرفر
#  3) swap 2GB لو مفيش: حماية من قتل العمليات (OOM) وقت تحويل الفيديو
#  4) cron: باك أب يومي لقاعدة البيانات الساعة 3:30
#  5) حدود لوج journald
set -uo pipefail
ROOT=/var/www/makki-platform

echo "== pm2-logrotate =="
if ! pm2 describe pm2-logrotate >/dev/null 2>&1; then
  pm2 install pm2-logrotate >/dev/null 2>&1 || echo "تعذّر تثبيت pm2-logrotate"
fi
pm2 set pm2-logrotate:max_size 20M >/dev/null 2>&1 || true
pm2 set pm2-logrotate:retain 7 >/dev/null 2>&1 || true
pm2 set pm2-logrotate:compress true >/dev/null 2>&1 || true

echo "== pm2 startup =="
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true
pm2 save >/dev/null 2>&1 || true

echo "== swap =="
if [ "$(swapon --show --noheadings | wc -l)" -eq 0 ]; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null
  fi
  swapon /swapfile && grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "swap اتفعّل"
else
  echo "swap موجود بالفعل"
fi

echo "== cron backup =="
chmod +x "$ROOT/scripts/backup-db.sh"
( crontab -l 2>/dev/null | grep -v 'backup-db.sh' ; echo "30 3 * * * $ROOT/scripts/backup-db.sh >> /var/log/makki-backup.log 2>&1" ) | crontab -

echo "== journald =="
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=300M\n' > /etc/systemd/journald.conf.d/makki.conf
systemctl restart systemd-journald 2>/dev/null || true

echo "== اختبار الباك أب الآن =="
"$ROOT/scripts/backup-db.sh" || echo "الباك أب فشل — ابعت الرسالة دي"

echo "== الحالة =="
free -h | head -2
df -h / | tail -1
pm2 jlist 2>/dev/null | python3 -c "import sys,json; [print(p['name'], 'restarts=%d'%p['pm2_env']['restart_time'], p['pm2_env']['status']) for p in json.load(sys.stdin)]" 2>/dev/null
echo HARDEN_DONE
