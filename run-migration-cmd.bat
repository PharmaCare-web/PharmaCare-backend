@echo off
REM Migration Runner for Windows
REM This script runs the audit_trail and refund_policy migration

echo ========================================
echo Running Database Migration
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with your database credentials.
    pause
    exit /b 1
)

REM Read database credentials from .env (simple parsing)
REM Note: This is a basic parser. For production, use a proper .env parser.

echo Reading database configuration from .env...
echo.

REM Try to connect and run migration
echo Attempting to run migration...
echo.

REM Option 1: Using psql if available
where psql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using psql command...
    echo.
    
    REM Try to get credentials from .env (basic parsing)
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_USER=" .env') do set DB_USER=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_NAME=" .env') do set DB_NAME=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_HOST=" .env') do set DB_HOST=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_PORT=" .env') do set DB_PORT=%%a
    for /f "tokens=2 delims==" %%a in ('findstr /b "DB_PASSWORD=" .env') do set DB_PASSWORD=%%a
    
    REM Set defaults if not found
    if "%DB_USER%"=="" set DB_USER=postgres
    if "%DB_NAME%"=="" set DB_NAME=pharmacare
    if "%DB_HOST%"=="" set DB_HOST=localhost
    if "%DB_PORT%"=="" set DB_PORT=5432
    
    echo Database: %DB_NAME%
    echo Host: %DB_HOST%
    echo Port: %DB_PORT%
    echo User: %DB_USER%
    echo.
    
    REM Run the migration
    if "%DB_PASSWORD%"=="" (
        echo Running migration (will prompt for password)...
        psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f database\migrations\create_audit_trail_and_refund_policy.sql
    ) else (
        echo Running migration...
        set PGPASSWORD=%DB_PASSWORD%
        psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f database\migrations\create_audit_trail_and_refund_policy.sql
        set PGPASSWORD=
    )
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo Migration completed successfully!
        echo ========================================
    ) else (
        echo.
        echo ========================================
        echo Migration failed!
        echo ========================================
        echo.
        echo Please check:
        echo 1. PostgreSQL is running
        echo 2. Database credentials in .env are correct
        echo 3. psql is in your PATH
    )
) else (
    echo psql command not found!
    echo.
    echo Please install PostgreSQL client tools or use one of these alternatives:
    echo.
    echo Option 1: Install PostgreSQL (includes psql)
    echo   Download from: https://www.postgresql.org/download/windows/
    echo.
    echo Option 2: Use pgAdmin
    echo   1. Open pgAdmin
    echo   2. Connect to your database
    echo   3. Right-click database -^> Query Tool
    echo   4. Open: database\migrations\create_audit_trail_and_refund_policy.sql
    echo   5. Execute (F5)
    echo.
    echo Option 3: Use Node.js script (if database is accessible)
    echo   npm run migrate:audit
    echo.
)

echo.
pause
