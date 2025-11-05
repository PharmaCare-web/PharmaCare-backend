@echo off
echo =====================================
echo   PharmaCare Backend Server
echo =====================================
echo.

cd backend

echo [1/3] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies OK
)
echo.

echo [2/3] Checking .env file...
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo Please edit .env file with your database settings!
    pause
)
echo.

echo [3/3] Starting server...
echo.
echo =====================================
echo   Server starting...
echo   Open: http://localhost:5000
echo   Health: http://localhost:5000/api/health
echo   Auth: http://localhost:5000/api/auth
echo =====================================
echo.
call npm start

