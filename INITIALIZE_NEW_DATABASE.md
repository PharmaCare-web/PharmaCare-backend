# 🗄️ Initialize New Render PostgreSQL Database

## Your Setup
- ✅ Backend deployed: https://pharmacare-api.onrender.com
- ✅ Database: New PostgreSQL on Render
- ⏳ Need to: Initialize database schema and create admin user

---

## Step 1: Verify Database Credentials

Your `.env` file shows:
```env
DB_HOST=dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com
DB_PORT=5432
DB_USER=pharmacare_user
DB_PASSWORD=6qS1ylyQXCvF6FVMhGDrsMTAxauAh1x5
DB_NAME=pharmacare
DB_SSL=true
```

**Make sure these match your Render database connection details!**

To check:
1. Go to Render Dashboard → Your PostgreSQL database
2. Check "Connections" section
3. Verify: Hostname, Port, Database, Username, Password

---

## Step 2: Initialize Database Schema

You have 2 options:

### Option A: Using initDb.js Script (Recommended)

This script will:
- Create all tables
- Insert initial data (roles, branches, categories, admin user)

**Run this command:**

```bash
node initDb.js
```

**Expected Output:**
```
🔌 Connecting to PostgreSQL database...
✅ Connected successfully!
📄 Creating tables...
✅ All tables created successfully!
👥 Inserting roles...
✅ Roles inserted
🏢 Inserting branches...
✅ Branches inserted
📦 Inserting categories...
✅ Categories inserted
👤 Creating admin user...
✅ Admin user created
🎉 Database initialization complete!
```

### Option B: Using setup-database.js Script

**Run this command:**

```bash
node setup-database.js
```

This script executes the SQL schema file directly.

---

## Step 3: Verify Database Setup

After running the initialization, verify it worked:

```bash
node list-users.js
```

**Expected Output:**
```
=== Users in Database ===
1. Admin User (admin@pharmacare.com) - Admin
```

---

## Step 4: Test Admin Login

### Default Admin Credentials:
- **Email:** `admin@pharmacare.com`
- **Password:** `Admin@123`

### Test via API:

```bash
curl -X POST https://pharmacare-api.onrender.com/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@pharmacare.com",
  "password": "Admin@123"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "user_id": 1,
    "full_name": "Admin User",
    "email": "admin@pharmacare.com",
    "role_name": "Admin",
    "is_active": true
  }
}
```

---

## Step 5: Test Frontend Login

1. Start frontend: `cd frontend && npm run dev`
2. Open: http://localhost:3000
3. Login with:
   - Email: `admin@pharmacare.com`
   - Password: `Admin@123`
4. You should be redirected to Admin Dashboard

---

## What Gets Created

### Tables (12 tables)
1. `pharmacy` - Main pharmacy/company info
2. `branch` - Individual branch locations
3. `role` - User roles (Admin, Manager, Pharmacist, Cashier)
4. `users` - User accounts (renamed from "user")
5. `category` - Medicine categories
6. `medicine` - Medicine inventory
7. `sale` - Sales transactions
8. `sale_item` - Items in each sale
9. `payment` - Payment records
10. `return_table` - Product returns
11. `refund` - Refund processing
12. `notification` - System notifications

### Initial Data

**Roles:**
1. Admin (System role)
2. Manager (Branch management)
3. Pharmacist (Stock management)
4. Cashier (Payment processing)

**Branches:**
1. PharmaCare - Addis Ababa Branch
2. PharmaCare - Debre Berhan Branch

**Categories:**
1. Antibiotics
2. Pain Relievers
3. Vitamins
4. Cold & Flu
5. Digestive Health
6. Cardiovascular
7. Diabetes
8. Supplements
9. First Aid
10. Prescription

**Admin User:**
- Name: Admin User
- Email: admin@pharmacare.com
- Password: Admin@123
- Role: Admin
- Status: Active

---

## Troubleshooting

### Error: "Connection refused"

**Problem:** Can't connect to database

**Solution:**
1. Check `.env` credentials match Render
2. Ensure database is running on Render
3. Check SSL is enabled (`DB_SSL=true`)

### Error: "Authentication failed"

**Problem:** Wrong username or password

**Solution:**
1. Go to Render Dashboard → Database
2. Copy exact credentials from "Connections"
3. Update `.env` file
4. Try again

### Error: "Database does not exist"

**Problem:** Database name is wrong

**Solution:**
1. Check Render shows database name
2. Update `DB_NAME` in `.env`
3. Try again

### Error: "Table already exists"

**Problem:** Database was already initialized

**Solution:**
This is okay! Your database is already set up. Skip to Step 4 to test login.

### Error: "Cannot find module"

**Problem:** Missing npm packages

**Solution:**
```bash
npm install
```

---

## Alternative: Manual Database Setup

If scripts don't work, you can set up manually:

### Using Render SQL Editor

1. Go to Render Dashboard → Your PostgreSQL database
2. Click "Connect" → "External Connection"
3. Use a PostgreSQL client (pgAdmin, DBeaver, etc.)
4. Connect with your credentials
5. Run the SQL file: `database/postgresql_schema.sql`

### Using psql Command Line

```bash
psql postgresql://pharmacare_user:6qS1ylyQXCvF6FVMhGDrsMTAxauAh1x5@dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com:5432/pharmacare?sslmode=require < database/postgresql_schema.sql
```

---

## After Initialization

### Create Test Users

**Manager:**
```bash
curl -X POST https://pharmacare-api.onrender.com/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "full_name": "Manager User",
  "email": "manager@pharmacare.com",
  "password": "Manager@123",
  "role_id": 2,
  "branch_id": 1
}'
```

**Pharmacist:**
```bash
curl -X POST https://pharmacare-api.onrender.com/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "full_name": "Pharmacist User",
  "email": "pharmacist@pharmacare.com",
  "password": "Pharmacist@123",
  "role_id": 3,
  "branch_id": 1
}'
```

**Cashier:**
```bash
curl -X POST https://pharmacare-api.onrender.com/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "full_name": "Cashier User",
  "email": "cashier@pharmacare.com",
  "password": "Cashier@123",
  "role_id": 4,
  "branch_id": 1
}'
```

**Note:** New users need email verification. Check your logs or use `node get_verification_code.js`

---

## Quick Commands Reference

```bash
# Initialize database
node initDb.js

# List all users
node list-users.js

# Get verification code for a user
node get_verification_code.js

# Create test user
node create_test_user.js

# Reset database (CAUTION: Deletes all data!)
node resetDb.js

# Check environment variables
node verify_env.js
```

---

## Next Steps

After database initialization:

1. ✅ Database initialized
2. ✅ Admin user created
3. ⏳ Login to frontend
4. ⏳ Create additional users (managers, pharmacists, cashiers)
5. ⏳ Start developing features
6. ⏳ Deploy frontend

---

## Summary

**To initialize your new Render PostgreSQL database:**

```bash
# Step 1: Make sure .env has correct credentials
# Step 2: Run initialization
node initDb.js

# Step 3: Verify
node list-users.js

# Step 4: Test login
# Email: admin@pharmacare.com
# Password: Admin@123
```

**Your database will be ready to use! 🎉**
