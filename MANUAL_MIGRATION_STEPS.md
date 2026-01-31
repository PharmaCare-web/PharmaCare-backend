# Manual Migration Steps - Quick Guide

Since the automated script can't connect to your database, here's how to run the migration manually:

## Option 1: Using pgAdmin (Easiest - Recommended)

1. **Open pgAdmin**
   - If you don't have it, download from: https://www.pgadmin.org/download/

2. **Connect to your database**
   - Right-click on "Servers" → "Create" → "Server"
   - Enter your connection details:
     - **Name**: Any name (e.g., "PharmaCare")
     - **Host**: Your DB_HOST from .env (or `localhost` if local)
     - **Port**: 5432 (or your DB_PORT)
     - **Database**: pharmacare (or your DB_NAME)
     - **Username**: Your DB_USER
     - **Password**: Your DB_PASSWORD
     - **SSL Mode**: "Require" if remote database, "Disable" if local

3. **Open Query Tool**
   - Expand your server → Databases → pharmacare
   - Right-click on "pharmacare" → **Query Tool**

4. **Run the migration**
   - Click "Open File" (folder icon) or press Ctrl+O
   - Navigate to: `database/migrations/create_audit_trail_and_refund_policy.sql`
   - Click "Execute" (play button) or press F5

5. **Verify success**
   - You should see: "Query returned successfully"
   - Check the tables exist by running:
     ```sql
     SELECT table_name 
     FROM information_schema.tables 
     WHERE table_name IN ('audit_trail', 'refund_policy');
     ```

---

## Option 2: Using psql Command Line

### For Local Database:
```bash
psql -U postgres -d pharmacare -f database/migrations/create_audit_trail_and_refund_policy.sql
```

### For Remote Database (Render, etc.):
```bash
# Get connection string from your database provider
psql "postgresql://username:password@host:port/database" -f database/migrations/create_audit_trail_and_refund_policy.sql
```

**Example for Render:**
```bash
psql "postgresql://user:pass@dpg-xxxxx.render.com:5432/pharmacare" -f database/migrations/create_audit_trail_and_refund_policy.sql
```

---

## Option 3: Using Render Dashboard (If using Render)

1. Go to your Render dashboard
2. Click on your PostgreSQL database
3. Click on the **"SQL Editor"** tab
4. Copy the entire contents of `database/migrations/create_audit_trail_and_refund_policy.sql`
5. Paste into the SQL editor
6. Click **"Run"**

---

## Option 4: Copy-Paste SQL Directly

1. Open the file: `database/migrations/create_audit_trail_and_refund_policy.sql`
2. Copy **ALL** the SQL code (from line 1 to the end)
3. Open your database client (pgAdmin, DBeaver, TablePlus, etc.)
4. Paste the SQL
5. Execute it

---

## What the Migration Creates

The migration creates two tables:

1. **`audit_trail`** - Tracks all system actions
   - Columns: audit_id, branch_id, user_id, action_type, entity_type, entity_id, description, created_at

2. **`refund_policy`** - Stores branch refund policies
   - Columns: policy_id, branch_id, refund_days_limit, refund_conditions, requires_receipt, refund_methods, notes, created_at, updated_at

---

## Verify Migration Success

After running the migration, test it:

1. **Check tables exist:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('audit_trail', 'refund_policy');
   ```
   Should return 2 rows.

2. **Test the endpoint:**
   - In Postman: `GET /api/manager/audit-trail`
   - Should return: `{"success": true, "data": [], ...}` (empty array if no logs yet)

---

## Still Having Issues?

- Make sure you're connected to the correct database
- Verify your database user has CREATE TABLE permissions
- Check that the main schema (postgresql_schema.sql) was run first
- The migration uses `IF NOT EXISTS`, so it's safe to run multiple times
