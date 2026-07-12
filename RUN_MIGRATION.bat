@echo off
echo ================================================
echo PharmaCare Database Migration Script
echo ================================================
echo.
echo This will initialize your Render PostgreSQL database
echo.
echo Database: dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com
echo.
echo What will be created:
echo  - 12 database tables
echo  - 4 user roles
echo  - 2 branches
echo  - 10 medicine categories
echo  - 1 admin user
echo.
pause
echo.
echo Running database initialization...
echo.
node initDb.js
echo.
echo ================================================
echo Migration Complete!
echo ================================================
echo.
echo Default Admin Credentials:
echo   Email: admin@pharmacare.com
echo   Password: Admin@123
echo.
echo Test login at: https://pharmacare-api.onrender.com/api/auth/login
echo.
pause
