#!/usr/bin/env bash
# بيعرض كل دروس الفيديو وهل الفيديو بتاعها على السيرفر (محلي) ولا لسه على B2.
# بس قراءة — مفيش أي حذف أو تعديل.
set -euo pipefail
ENVFILE=/var/www/makki-platform/apps/api/.env
MEDIA=/var/www/makki-media/media/lessons
DBURL=$(grep -E '^DATABASE_URL=' "$ENVFILE" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" -e 's/?schema=.*$//')

printf '%-8s | %-28s | %-28s | %s\n' "المكان" "الكورس" "الدرس" "lessonId"
printf -- '---------+------------------------------+------------------------------+----------------------\n'
legacy=0; local_n=0; pending=0
while IFS='|' read -r id ready failed course title; do
  [ -z "$id" ] && continue
  if [ -f "$MEDIA/$id/hls/master.m3u8" ]; then where="السيرفر"; local_n=$((local_n+1))
  elif [ "$ready" = "t" ]; then where="B2 قديم"; legacy=$((legacy+1))
  elif [ "$failed" = "t" ]; then where="فاشل"; pending=$((pending+1))
  else where="مفيش/جاري"; pending=$((pending+1)); fi
  printf '%-8s | %-28s | %-28s | %s\n' "$where" "${course:0:28}" "${title:0:28}" "$id"
done < <(psql "$DBURL" -At -F '|' -c 'SELECT l.id, l."videoReady", l."videoFailed", c.title, l.title FROM "Lesson" l JOIN "Course" c ON c.id = l."courseId" WHERE l."storageKey" IS NOT NULL OR l."videoReady" ORDER BY c.title, l."order";')
echo
echo "على السيرفر: $local_n | على B2 (محتاج إعادة رفع): $legacy | فاشل/جاري: $pending"
