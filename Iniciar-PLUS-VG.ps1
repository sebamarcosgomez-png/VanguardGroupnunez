# PLUS VG · Ejecutar en local sin contraseña.
Set-Location $PSScriptRoot
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
  Write-Host 'No se encontro dotnet. Instala .NET 8 SDK desde dotnet.microsoft.com' -ForegroundColor Red
  exit 1
}
Write-Host 'Web: http://localhost:5186/   Editor: http://localhost:5186/admin.html' -ForegroundColor Cyan
dotnet run --launch-profile 'PLUS VG - Local'
