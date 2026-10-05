@echo off
setlocal

echo ========================================
echo SGC Portal - OOMAPASC de Cajeme
echo ========================================
echo.

set "PROJECT_ROOT=%~dp0"
cd "%PROJECT_ROOT%"

echo [1/3] Verificando Python...
set "PYTHON_EXE=python"
if exist "%PROJECT_ROOT%.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%PROJECT_ROOT%.venv\Scripts\python.exe"
) else (
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python no esta instalado
        pause
        exit /b 1
    )
)

echo [2/3] Iniciando Backend (Puerto 8080)...
set PYTHONPATH=%PROJECT_ROOT%
start "SGC Backend" cmd /k "cd /d "%PROJECT_ROOT%" && "%PYTHON_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8080"
echo      Esperando...
timeout /t 3 /nobreak >nul

echo [3/3] Iniciando Frontend (Puerto 5180)...
start "SGC Frontend" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

echo.
echo ========================================
echo SGC Portal iniciado!
echo.
echo   Backend API: http://127.0.0.1:8080
echo   Frontend:    http://127.0.0.1:5180 (o http://localhost:5180)
echo.
echo Presiona cualquier tecla para salir...
echo ========================================

pause >nul