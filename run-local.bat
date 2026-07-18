@echo off
echo =======================================================
echo   Baltium Reservas - Iniciando Servidores de Desarrollo
echo =======================================================

echo Iniciando Backend en una nueva ventana de terminal...
start cmd /k "cd backend && npm run dev"

echo Iniciando Frontend en una nueva ventana de terminal...
start cmd /k "cd frontend && npm run dev"

echo Servidores lanzados. 
echo Backend disponible en http://localhost:3001
echo Frontend disponible en http://localhost:5173
pause
