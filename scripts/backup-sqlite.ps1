# Backup SQLite database daily
# Usage: Set up as a Windows scheduled task (daily at 03:00)
# schtasks /Create /SC DAILY /TN "signal-ia-backup" /TR "powershell -File C:\Users\nicol\Documents\www\ai-news\scripts\backup-sqlite.ps1" /ST 03:00

$dbPath = "C:\Users\nicol\Documents\www\ai-news\database.sqlite"
$backupDir = "C:\Users\nicol\Documents\www\ai-news\backups"
$date = Get-Date -Format "yyyy-MM-dd"
$backupPath = "$backupDir\database-$date.sqlite"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

Copy-Item -Path $dbPath -Destination $backupPath -Force
Write-Output "Backup créé : $backupPath"

# Keep only last 30 backups
$oldBackups = Get-ChildItem -Path $backupDir -Filter "database-*.sqlite" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 30

foreach ($f in $oldBackups) {
    Remove-Item $f.FullName -Force
    Write-Output "Supprimé : $($f.Name)"
}
