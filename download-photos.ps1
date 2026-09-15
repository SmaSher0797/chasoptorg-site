# Скачивает все фото товаров из photos-list.csv в папку .\product-photos
# Запуск: находясь в папке chasoptorg-site, выполнить в PowerShell:
#   .\download-photos.ps1

$ErrorActionPreference = "Continue"
$csvPath = Join-Path $PSScriptRoot "photos-list.csv"
$outDir  = Join-Path $PSScriptRoot "product-photos"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$rows = Import-Csv -Path $csvPath
$total = $rows.Count
$i = 0
$ok = 0
$fail = 0
$failedList = @()

foreach ($row in $rows) {
    $i++
    $sku = $row.sku
    $url = $row.url

    if ([string]::IsNullOrWhiteSpace($url)) { continue }

    $ext = [System.IO.Path]::GetExtension($url)
    if ([string]::IsNullOrWhiteSpace($ext)) { $ext = ".jpg" }

    # Имя файла: артикул + расширение (артикул делаем безопасным для имени файла)
    $safeSku = ($sku -replace '[\\/:*?"<>|]', '_')
    $outFile = Join-Path $outDir ($safeSku + $ext)

    if (Test-Path $outFile) {
        Write-Host "[$i/$total] уже есть, пропуск: $safeSku"
        $ok++
        continue
    }

    try {
        Invoke-WebRequest -Uri $url -OutFile $outFile -UserAgent "Mozilla/5.0" -TimeoutSec 30
        Write-Host "[$i/$total] OK: $safeSku"
        $ok++
    } catch {
        Write-Host "[$i/$total] ОШИБКА: $safeSku ($url) - $($_.Exception.Message)"
        $fail++
        $failedList += "$sku,$url"
    }

    Start-Sleep -Milliseconds 150
}

Write-Host ""
Write-Host "Готово. Успешно: $ok, ошибок: $fail из $total"

if ($failedList.Count -gt 0) {
    $failedList | Out-File -FilePath (Join-Path $PSScriptRoot "failed-downloads.csv") -Encoding utf8
    Write-Host "Список неудачных загрузок сохранён в failed-downloads.csv"
}
