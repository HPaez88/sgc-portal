@echo off
echo ============================================
echo SGC Portal - INSTRUCTIONS
echo ============================================
echo.
echo El frontend esta en la carpeta: frontend\dist
echo.
echo Para abrir la pagina:
echo 1. Abre el explorador de archivos
echo 2. Navega a: This PC ^> Documents and Settings ^> ^... SGC page ^> frontend ^> dist
echo 3. Haz doble click en: index.html
echo.
echo O alternativamente, copia esta ruta:
echo %~dp0frontend\dist\index.html
echo.
echo.
echo El backend debe estar corriendo en puerto 8000
echo Para iniciar el backend manualmente:
echo   cd [carpeta del proyecto]
echo   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
echo.
pause