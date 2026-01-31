# Database Migration Guide

## Creating Audit Trail and Refund Policy Tables

This migration creates the `audit_trail` and `refund_policy` tables required for the manager endpoints.

### Quick Setup (Recommended)

**Option 1: Using Node.js Script (Easiest)**

Simply run:
```bash
npm run migrate:audit
```

Or directly:
```bash
node run-migration.js
```

This script will:
- ✅ Read the migration file
- ✅ Execute all SQL statements
- ✅ Verify tables were created
- ✅ Show you the results

**Option 2: Using psql (Command Line)**

```bash
psql -U your_username -d pharmacare -f database/migrations/create_audit_trail_and_refund_policy.sql
```

**Option 3: Using pgAdmin**

1. Open pgAdmin
2. Connect to your database
3. Right-click on your database → Query Tool
4. Open the file: `database/migrations/create_audit_trail_and_refund_policy.sql`
5. Execute the query (F5 or click Execute)

**Option 4: Using Database Client (DBeaver, TablePlus, etc.)**

1. Connect to your PostgreSQL database
2. Open the SQL file: `database/migrations/create_audit_trail_and_refund_policy.sql`
3. Execute the script

### What This Migration Creates

1. **audit_trail table** - Tracks all system actions (sales, payments, refunds, etc.)
2. **refund_policy table** - Stores branch-specific refund policies

### Verification

After running the migration, verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('audit_trail', 'refund_policy')
ORDER BY table_name;
```

You should see both tables listed.

### Troubleshooting

**Error: "relation 'users' does not exist"**
- Make sure your user table is named `users` (not `user`)
- If your table is named `user`, update the migration file to use `"user"` instead of `users`

**Error: "function update_updated_at_column() does not exist"**
- This function should already exist from the main schema
- If not, run the main schema file first: `database/postgresql_schema.sql`

### After Migration

Once the migration is complete, you can test the endpoints:
- `GET /api/manager/audit-trail` - Should return empty array (no errors)
- `GET /api/manager/settings/refund-policy` - Should return default policy
