# One-command start for the whole stack (Windows PowerShell).
#   .\start.ps1          local demo (http://localhost:3000)
#   .\start.ps1 -Prod    production override (docker-compose.prod.yml, ports 8310/3310)
#   .\start.ps1 -Stop    stop containers (data volume is kept)
param([switch]$Prod, [switch]$Stop)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$files = @("-f", "docker-compose.yml")
if ($Prod) {
  $files += @("-f", "docker-compose.prod.yml")
  if (-not $env:BACKEND_PORT) { $env:BACKEND_PORT = "8310" }
  if (-not $env:FRONTEND_PORT) { $env:FRONTEND_PORT = "3310" }
} else {
  if (-not $env:BACKEND_PORT) { $env:BACKEND_PORT = "8000" }
  if (-not $env:FRONTEND_PORT) { $env:FRONTEND_PORT = "3000" }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Write-Error "Docker is not installed." }
docker compose version *> $null
if ($LASTEXITCODE -ne 0) { Write-Error "Docker Compose v2 ('docker compose') is not available." }

if ($Stop) {
  docker compose @files down
  Write-Host "Stopped. Data is kept (use 'docker compose down -v' only if you want to wipe the database)."
  exit 0
}

if (-not (Test-Path "backend/.env")) {
  Copy-Item "backend/.env.example" "backend/.env"
  Write-Host "Created backend/.env from backend/.env.example."
  Write-Host "Fill GAPGPT_API_KEY in backend/.env to enable real AI (the app works without it, using the fallback)."
}

docker compose @files up -d --build
if ($LASTEXITCODE -ne 0) { Write-Error "docker compose up failed." }

function Wait-For($name, $url) {
  for ($i = 0; $i -lt 90; $i++) {
    try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host "$name is up."; return }
    catch { Start-Sleep -Seconds 2 }
  }
  Write-Error "$name did not respond at $url in time. Check: docker compose logs"
}
Wait-For "Backend" "http://127.0.0.1:$($env:BACKEND_PORT)/api/health"
Wait-For "Frontend" "http://127.0.0.1:$($env:FRONTEND_PORT)/"

Write-Host ""
Write-Host "Frontend: http://localhost:$($env:FRONTEND_PORT)"
Write-Host "Backend:  http://localhost:$($env:BACKEND_PORT)  (health: /api/health)"
Write-Host ("Stop with: .\start.ps1 -Stop" + $(if ($Prod) { " -Prod" } else { "" }))
