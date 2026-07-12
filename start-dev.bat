@echo off
echo ====================================
echo   PharmaCare Development Startup
echo ====================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================
echo   Servers Starting...
echo ====================================
echo   Backend:  http://localhost:10000
echo   Frontend: http://localhost:3000
echo ====================================
echo.
echo Press any key to close this window...
pause >nul
