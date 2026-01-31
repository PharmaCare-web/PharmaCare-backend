#!/bin/bash
# Migration Runner for Linux/Mac
# This script runs the audit_trail and refund_policy migration

echo "========================================"
echo "Running Database Migration"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env file with your database credentials."
    exit 1
fi

# Source .env file to get database credentials
export $(grep -v '^#' .env | xargs)

# Set defaults if not in .env
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-pharmacare}

echo "Reading database configuration from .env..."
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql command not found!"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  Mac: brew install postgresql"
    echo "  Or use: npm run migrate:audit"
    exit 1
fi

echo "Running migration..."
echo ""

# Run the migration
if [ -z "$DB_PASSWORD" ]; then
    # No password in .env, will prompt
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f database/migrations/create_audit_trail_and_refund_policy.sql
else
    # Use password from .env
    export PGPASSWORD="$DB_PASSWORD"
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f database/migrations/create_audit_trail_and_refund_policy.sql
    unset PGPASSWORD
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "Migration completed successfully!"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "Migration failed!"
    echo "========================================"
    echo ""
    echo "Please check:"
    echo "1. PostgreSQL is running"
    echo "2. Database credentials in .env are correct"
    echo "3. Database exists and is accessible"
    exit 1
fi
