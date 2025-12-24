# Database Migrations

This directory contains database migration scripts.

## Available Migrations

### add_sale_status_index.js
Adds an index on `sale.status` column for better query performance.

**Run this migration:**
```bash
npm run migrate:index
```

Or directly:
```bash
node migrations/add_sale_status_index.js
```

**What it does:**
- Creates index `idx_sale_status` on `sale(status)` table
- Improves performance for cashier pending payments queries
- Safe to run multiple times (uses `IF NOT EXISTS`)

**Prerequisites:**
- Database connection configured in `.env`
- Database schema already imported
- `sale` table exists

## Adding New Migrations

1. Create a new file in this directory: `migrations/your_migration_name.js`
2. Use the template from `add_sale_status_index.js`
3. Add a script to `package.json` if needed
4. Document what the migration does

