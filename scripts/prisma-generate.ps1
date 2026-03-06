# Fix EPERM: Stops Node (dev server) that locks the Prisma engine, then runs generate.
# Run: npm run prisma:generate   (with dev server stopped, or this script will stop it)

$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."
Set-Location $root

Write-Host "`n[1/4] Stopping Node processes (dev server, etc.)..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "[2/4] Clearing .next cache so Next.js uses new client..." -ForegroundColor Yellow
if (Test-Path ".next") {
  Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
}

Write-Host "[3/4] Running prisma generate..." -ForegroundColor Cyan
$attempt = 1
$maxAttempts = 2
while ($attempt -le $maxAttempts) {
  npx prisma generate
  if ($LASTEXITCODE -eq 0) { break }
  $attempt++
  if ($attempt -le $maxAttempts) {
    Write-Host "Retry in 3s..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
  }
}

Write-Host "[4/4] Done." -ForegroundColor Green
if ($LASTEXITCODE -eq 0) {
  Write-Host "Prisma client generated. Start dev server: npm run dev`n" -ForegroundColor Green
} else {
  Write-Host "`nGenerate still failed (EPERM). Do this:" -ForegroundColor Red
  Write-Host "  1. Close Cursor/VS Code completely." -ForegroundColor White
  Write-Host "  2. Open a new PowerShell, cd to project, run: npx prisma generate" -ForegroundColor White
  Write-Host "  3. Reopen the project.`n" -ForegroundColor White
  exit 1
}
