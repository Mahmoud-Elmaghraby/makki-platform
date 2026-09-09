# سكريبت تشغيل كل حاجة محليًا مرة واحدة، بدل ما تفتح 3 تيرمينالات يدويًا
# كل مرة (راجع docs/setup-local.md للتفاصيل الكاملة والخطوات الأولى لمرة
# واحدة زي إعداد الـ .env وعمل migration).
#
# الاستخدام: من جذر المشروع (makki-platform) شغّل:
#   .\dev.ps1
#
# لو ظهرت رسالة "لا يمكن تشغيل السكريبتات" (execution policy)، شغّل مرة واحدة بس:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

$root = $PSScriptRoot

function Test-ServicePort {
    param([string]$HostName, [int]$Port, [string]$Label)
    $result = Test-NetConnection -ComputerName $HostName -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    if (-not $result) {
        Write-Host "تحذير: $Label مش شغالة على ${HostName}:${Port}." -ForegroundColor Yellow
        return $false
    }
    Write-Host "$Label شغالة (${HostName}:${Port})." -ForegroundColor Green
    return $true
}

Write-Host "== بيتأكد إن Redis شغال (container: makki-redis) ==" -ForegroundColor Cyan
docker start makki-redis 2>$null | Out-Null
Start-Sleep -Seconds 1

Write-Host "== بيتفحص إن قاعدة البيانات والـ Redis شغالين ==" -ForegroundColor Cyan
$dbOk = Test-ServicePort -HostName "localhost" -Port 5432 -Label "PostgreSQL"
$redisOk = Test-ServicePort -HostName "localhost" -Port 6379 -Label "Redis"

if (-not $dbOk -or -not $redisOk) {
    Write-Host ""
    Write-Host "شغّل Postgres و/أو Redis الأول (راجع docs/setup-local.md)، وبعدين شغّل .\dev.ps1 تاني." -ForegroundColor Red
    Read-Host "اضغط Enter عشان تقفل"
    exit 1
}

Write-Host ""
Write-Host "== بيشغّل الـ API، الـ Worker، والفرونت إند — كل واحد في نافذة منفصلة ==" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\api'; pnpm start:dev"
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\api'; pnpm worker:dev"
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\frontend'; pnpm dev"

Write-Host ""
Write-Host "اتشغّل! هيتفتح لك 3 نوافذ PowerShell (API / Worker / Frontend)." -ForegroundColor Green
Write-Host "افتح المتصفح على:" -ForegroundColor Green
Write-Host "  الموقع التعريفي:  http://localhost:5173"
Write-Host "  بوابة الطالب:     http://localhost:5173/student/login"
Write-Host "  لوحة الأدمن:      http://localhost:5173/admin/login"
Write-Host ""
Write-Host "قفل النوافذ التلاتة اللي اتفتحت عشان توقف كل حاجة." -ForegroundColor DarkGray
