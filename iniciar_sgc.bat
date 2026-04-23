@echo off
setlocal

echo ========================================
echo SGC Portal - OOMAPASC de Cajeme
echo ========================================
echo.

set "PROJECT_ROOT=%~dp0"
cd "%PROJECT_ROOT%"

echo [1/3] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado
    pause
    exit /b 1
)

echo [2/3] Iniciando Backend (Puerto 8000)...
set PYTHONPATH=%PROJECT_ROOT%
start "SGC Backend" cmd /k "cd /d "%PROJECT_ROOT%" && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"
echo      Esperando...
timeout /t 3 /nobreak >nul

echo [3/3] Iniciando Frontend (Puerto 5173)...
start "SGC Frontend" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

echo.
echo ========================================
echo SGC Portal iniciado!
echo.
echo   Backend API: http://127.0.0.1:8000
echo   Frontend:    http://localhost:5173
echo.
echo Presiona cualquier tecla para salir...
echo ========================================

pause >nul