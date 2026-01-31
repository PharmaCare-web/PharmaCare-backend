# Quick Start: Run Database Migration

## 🚀 Fastest Way to Fix the Error

You're seeing this error because the `audit_trail` table doesn't exist yet. Here's how to fix it:

### Step 1: Run the Migration

Open your terminal in the `PharmaCare-backend` folder and run:

```bash
npm run migrate:audit
```

Or:

```bash
node run-migration.js
```

### Step 2: Verify It Worked

You should see output like:

```
🔄 Starting database migration...
📝 Executing migration SQL...
✅ Migration SQL executed successfully
🔍 Verifying tables were created...
✅ Migration completed successfully!
📊 Created tables:
   - audit_trail
   - refund_policy
✨ You can now use the audit trail and refund policy endpoints!
```

### Step 3: Test the Endpoint

Now try your Postman request again:
- `GET /api/manager/audit-trail`

It should work! You'll get an empty array `[]` if there are no audit logs yet, or a list of audit entries if any exist.

---

## ❓ Troubleshooting

### Error: "Cannot find module './config/database'"

Make sure you're in the `PharmaCare-backend` directory:
```bash
cd PharmaCare-backend
npm run migrate:audit
```

### Error: "Connection refused" or database connection error

1. Check your `.env` file has correct database credentials
2. Make sure your PostgreSQL database is running
3. Verify the database name matches your `.env` file

### Error: "relation 'users' does not exist"

This means your main database schema hasn't been set up. Run the main schema first:
```bash
# Run the main PostgreSQL schema
psql -U your_username -d pharmacare -f database/postgresql_schema.sql
```

Then run the migration:
```bash
npm run migrate:audit
```

---

## 📝 What This Migration Does

Creates two new tables:

1. **`audit_trail`** - Tracks all system actions (sales, payments, refunds, etc.)
2. **`refund_policy`** - Stores branch-specific refund policies

These tables are required for:
- `/api/manager/audit-trail` endpoints
- `/api/manager/settings/refund-policy` endpoints
- `/api/admin/audit-logs` endpoint

---

## ✅ After Migration

Once the migration completes successfully, all manager endpoints will work properly!
