# Script para iniciar backend
$projectPath = $PSScriptRoot
Set-Location $projectPath

# Activar entorno virtual
.\.venv\Scripts\Activate.ps1

# Ir al backend y ejecutar
Set-Location (Join-Path $projectPath "backend")
python manage.py runserver
