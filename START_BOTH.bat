@echo off
echo ================================
echo Starting PharmaCare Application
echo ================================
echo.
echo Backend API: http://localhost:10000
echo Frontend UI: http://localhost:3000
echo.
echo Starting backend...
start "PharmaCare Backend" cmd /k "npm start"

echo.
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting frontend...
start "PharmaCare Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ================================
echo Both servers started!
echo ================================
echo.
echo Backend: http://localhost:10000/api/health
echo Frontend: http://localhost:3000
echo.
pause
