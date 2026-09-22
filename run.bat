@echo off
title Sales Project Launcher
echo ===================================================
echo Starting Sales Project Backend and Frontend...
echo ===================================================

:: 1. Launch Django Backend in a separate command window
echo Starting Backend (Django)...
start "Backend - Django Server (Port 8000)" cmd /k "cd /d "%~dp0backend" && (if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) else (echo Notice: .venv not found, using system Python.)) && python manage.py runserver"

:: 2. Launch Next.js Frontend in a separate command window
echo Starting Frontend (Next.js)...
start "Frontend - Next.js (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo ===================================================
echo Both server windows have been launched!
echo - Backend:  http://127.0.0.1:8000
echo - Frontend: http://localhost:3000
echo ===================================================
pause
