#!/usr/bin/env bash
# تتبع تسريب: bash scripts/trace-student.sh "<جزء من الاسم أو آخر 4 أرقام>"
# بيعرض آخر 50 تشغيل للطالب (الدرس، الـ IP، الجهاز، الوقت).
set -euo pipefail
Q="${1:?usage: trace-student.sh <name-or-phone-fragment>}"
sudo -u postgres psql "${DB_NAME:-makki}" -c "
SELECT s.name, s.phone, l.title AS lesson, p.ip, left(p.\"userAgent\",60) AS ua, p.\"createdAt\"
FROM \"PlaybackLog\" p
JOIN \"Student\" s ON s.id = p.\"studentId\"
JOIN \"Lesson\" l ON l.id = p.\"lessonId\"
WHERE s.name ILIKE '%${Q//\'/}%' OR s.phone LIKE '%${Q//\'/}'
ORDER BY p.\"createdAt\" DESC LIMIT 50;"
