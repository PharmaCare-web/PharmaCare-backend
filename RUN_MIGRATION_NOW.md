# 🚀 Run Migration Now - Quick Guide

You're seeing the error because the `audit_trail` table doesn't exist. Run one of these commands:

## ✅ Option 1: PowerShell Script (Easiest)

```powershell
.\run-migration.ps1
```

Or:

```powershell
npm run migrate:audit:psql
```

## ✅ Option 2: Direct psql Command

```powershell
psql -U postgres -d pharmacare -f database\migrations\create_audit_trail_and_refund_policy.sql
```

**If your database is different, use:**
```powershell
psql -U your_username -h localhost -p 5432 -d your_database_name -f database\migrations\create_audit_trail_and_refund_policy.sql
```

## ✅ Option 3: If Using Remote Database (Render)

```powershell
$env:PGPASSWORD="your_password"
psql -U your_username -h your-host.render.com -p 5432 -d pharmacare -f database\migrations\create_audit_trail_and_refund_policy.sql
```

## ✅ Option 4: Copy SQL and Run in Database Client

1. Open: `database\migrations\create_audit_trail_and_refund_policy.sql`
2. Copy ALL the SQL code
3. Open pgAdmin → Query Tool (or your database client)
4. Paste and Execute (F5)

---

## 🔍 Check Your .env File

Make sure your `.env` file has:
```env
DB_HOST=localhost          # or your remote host
DB_PORT=5432
DB_USER=postgres           # your database user
DB_PASSWORD=your_password  # your password
DB_NAME=pharmacare         # your database name
DB_SSL=false              # true for remote databases
```

---

## ✅ Verify Migration Worked

After running, test in Postman:
- `GET /api/manager/audit-trail`
- Should return: `{"success": true, "data": [], ...}`

---

## ❓ If psql Command Not Found

Install PostgreSQL client:
1. Download: https://www.postgresql.org/download/windows/
2. Install (include Command Line Tools)
3. Or use pgAdmin to run the SQL file manually
