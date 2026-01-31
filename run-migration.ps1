# PowerShell Migration Script
# Run this script to create audit_trail and refund_policy tables

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Migration Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your database credentials." -ForegroundColor Yellow
    exit 1
}

# Load .env file
Write-Host "Loading database configuration from .env..." -ForegroundColor Yellow
$envVars = Get-Content .env | Where-Object { $_ -match '^DB_' } | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [PSCustomObject]@{Key = $key; Value = $value}
    }
}

# Extract values
$DB_HOST = ($envVars | Where-Object { $_.Key -eq 'DB_HOST' }).Value
$DB_PORT = ($envVars | Where-Object { $_.Key -eq 'DB_PORT' }).Value
$DB_USER = ($envVars | Where-Object { $_.Key -eq 'DB_USER' }).Value
$DB_PASSWORD = ($envVars | Where-Object { $_.Key -eq 'DB_PASSWORD' }).Value
$DB_NAME = ($envVars | Where-Object { $_.Key -eq 'DB_NAME' }).Value
$DB_SSL = ($envVars | Where-Object { $_.Key -eq 'DB_SSL' }).Value

# Set defaults
if (-not $DB_HOST) { $DB_HOST = "localhost" }
if (-not $DB_PORT) { $DB_PORT = "5432" }
if (-not $DB_USER) { $DB_USER = "postgres" }
if (-not $DB_NAME) { $DB_NAME = "pharmacare" }

Write-Host "Database Configuration:" -ForegroundColor Green
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host "  User: $DB_USER"
Write-Host "  Database: $DB_NAME"
Write-Host ""

# Check if psql exists
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql command not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "  2. Or use pgAdmin to run the SQL file manually" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternative: Open database/migrations/create_audit_trail_and_refund_policy.sql" -ForegroundColor Yellow
    Write-Host "            and run it in pgAdmin or your database client" -ForegroundColor Yellow
    exit 1
}

# Check if migration file exists
$migrationFile = "database\migrations\create_audit_trail_and_refund_policy.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Running migration..." -ForegroundColor Yellow
Write-Host ""

# Build psql command
$psqlArgs = @(
    "-U", $DB_USER
    "-h", $DB_HOST
    "-p", $DB_PORT
    "-d", $DB_NAME
    "-f", $migrationFile
)

# Set password if provided
if ($DB_PASSWORD) {
    $env:PGPASSWORD = $DB_PASSWORD
}

try {
    # Run psql
    & psql $psqlArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Migration completed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Tables created:" -ForegroundColor Cyan
        Write-Host "  - audit_trail" -ForegroundColor White
        Write-Host "  - refund_policy" -ForegroundColor White
        Write-Host ""
        Write-Host "You can now use the audit trail endpoints!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Migration failed!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  1. PostgreSQL is running" -ForegroundColor White
        Write-Host "  2. Database credentials are correct" -ForegroundColor White
        Write-Host "  3. Database exists" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clear password
    if ($DB_PASSWORD) {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

Write-Host ""
