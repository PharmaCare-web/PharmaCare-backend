# ⚡ Database Setup - Quick Start

## 🎯 Your Goal
Initialize your new Render PostgreSQL database with PharmaCare schema and admin user.

---

## ✅ Prerequisites Check

Before you start, verify:

1. **Backend deployed:** https://pharmacare-api.onrender.com ✅
2. **Database created:** PostgreSQL on Render ✅
3. **Database credentials:** In your `.env` file ✅
4. **Node.js installed:** v18+ ✅

---

## 🚀 Quick Setup (3 Commands)

### Command 1: Install Dependencies (if not done)
```bash
npm install
```

### Command 2: Run Database Migration
```bash
node initDb.js
```

**Or on Windows, double-click:** `RUN_MIGRATION.bat`

### Command 3: Verify Setup
```bash
node list-users.js
```

---

## 📋 Expected Output

### After Running `node initDb.js`:

```
🛠️ Init DB with config:
   host: dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com
   port: 5432
   user: pharmacare_user
   db:   pharmacare
   ssl:  enabled

🔌 Connecting to PostgreSQL database...
✅ Connected successfully!

📄 Executing schema...
✅ Schema executed successfully!

📊 Created tables:
   1. branch
   2. category
   3. medicine
   4. notification
   5. payment
   6. pharmacy
   7. refund
   8. return_table
   9. role
   10. sale
   11. sale_item
   12. users

👥 Roles:
   - Admin
   - Manager
   - Pharmacist
   - Cashier

👤 Admin Account:
   Email: admin@pharmacare.com
   Name: Admin User
   Role: Admin
   Active: Yes
   Password: Admin@123

🎉 Database initialization complete!
```

---

## 🔑 Default Admin Credentials

After migration, use these to login:

**Email:** `admin@pharmacare.com`  
**Password:** `Admin@123`

---

## 🧪 Test It Works

### Test 1: Check Backend Health
```bash
curl https://pharmacare-api.onrender.com/api/health
```

**Expected:** `{"success":true,"message":"PharmaCare API is running"}`

### Test 2: Test Admin Login via API
```bash
curl -X POST https://pharmacare-api.onrender.com/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "admin@pharmacare.com",
  "password": "Admin@123"
}'
```

**Expected:** JSON response with token and user data

### Test 3: Login via Frontend
1. Start frontend: `cd frontend && npm run dev`
2. Open: http://localhost:3000
3. Login with admin credentials
4. Should redirect to Admin Dashboard

---

## 🗄️ What Gets Created

### Database Tables (12)
- **pharmacy** - Company information
- **branch** - Branch locations (2 default branches)
- **role** - User roles (4 roles)
- **users** - User accounts (1 admin user)
- **category** - Medicine categories (10 categories)
- **medicine** - Medicine inventory
- **sale** - Sales transactions
- **sale_item** - Sale line items
- **payment** - Payment records
- **return_table** - Product returns
- **refund** - Refund processing
- **notification** - System notifications

### Initial Data
- **4 Roles:** Admin, Manager, Pharmacist, Cashier
- **2 Branches:** Addis Ababa, Debre Berhan
- **10 Categories:** Antibiotics, Pain Relievers, Vitamins, etc.
- **1 Admin User:** admin@pharmacare.com

---

## ❌ Common Errors & Fixes

### Error: "Connection refused" or "ECONNREFUSED"

**Problem:** Can't connect to database

**Fix:**
1. Check `.env` file has correct database credentials
2. Verify database is running on Render
3. Make sure `DB_SSL=true`

### Error: "Authentication failed" or "password authentication failed"

**Problem:** Wrong username/password

**Fix:**
1. Go to Render Dashboard → Your PostgreSQL database
2. Go to "Connect" section
3. Copy the exact credentials
4. Update your `.env` file:
   ```env
   DB_HOST=your-actual-host
   DB_USER=your-actual-username
   DB_PASSWORD=your-actual-password
   DB_NAME=your-actual-database-name
   ```

### Error: "database does not exist"

**Problem:** Wrong database name

**Fix:**
1. Check Render shows your database name
2. Update `DB_NAME` in `.env`

### Error: "relation already exists"

**Problem:** Tables already exist (database was already initialized)

**Fix:**
This is okay! Your database is already set up. You can:
- Skip to testing (step 🧪)
- Or reset and re-initialize:
  ```bash
  node resetDb.js
  node initDb.js
  ```

### Error: "SSL connection required"

**Problem:** SSL not enabled

**Fix:**
Update `.env`:
```env
DB_SSL=true
```

---

## 🔄 Reset Database (if needed)

**⚠️ WARNING: This will delete ALL data!**

```bash
node resetDb.js
```

Then re-initialize:
```bash
node initDb.js
```

---

## 📝 After Setup Checklist

- [ ] Database initialized successfully
- [ ] Admin user created
- [ ] Can list users with `node list-users.js`
- [ ] API health check works
- [ ] Admin login works via API
- [ ] Admin login works via frontend

---

## 🎯 Next Steps

After database setup:

1. ✅ Database is ready
2. ⏳ Install frontend: `cd frontend && npm install`
3. ⏳ Start frontend: `npm run dev`
4. ⏳ Login as admin
5. ⏳ Start building features!

---

## 📞 Need Help?

If you encounter issues:

1. Check your `.env` file matches Render credentials exactly
2. Verify database is running on Render Dashboard
3. Check backend logs on Render for errors
4. Try `node verify_env.js` to check configuration

---

## 🎉 Success!

Once you see:
```
✅ Schema executed successfully!
👤 Admin Account: admin@pharmacare.com
   Password: Admin@123
🎉 Database initialization complete!
```

**Your database is ready! Start the frontend and login! 🚀**

---

## Quick Reference

```bash
# Initialize database
node initDb.js

# List all users
node list-users.js

# Reset database (deletes all data)
node resetDb.js

# Check environment
node verify_env.js

# Get verification code
node get_verification_code.js
```

**Admin Login:**
- Email: `admin@pharmacare.com`
- Password: `Admin@123`
