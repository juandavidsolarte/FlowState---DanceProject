# Script para iniciar backend
$projectPath = "C:\Users\juand\Desktop\ju\UNIVALLE\PREGRADO\4TO\DWEB\PROYECTO\FlowState"
Set-Location $projectPath

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Ir al backend y ejecutar
cd backend
python manage.py runserver
