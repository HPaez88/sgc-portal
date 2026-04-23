@echo off
cd /d "%~dp0frontend\dist"
echo Serving from port 8080...
python -m http.server 8080