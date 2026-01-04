# Database Update Guide for Render

This guide shows you how to update your deployed PostgreSQL database on Render.

## Method 1: Using Render Dashboard (Easiest)

### Step 1: Access Your Database
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to your PostgreSQL database service
3. Click on your database instance

### Step 2: Open the Shell/Query Interface
1. In your database dashboard, look for **"Connect"** or **"Shell"** button
2. Click on it to open the database shell
3. Or look for **"Query"** or **"SQL Editor"** option

### Step 3: Run the SQL Script
Copy and paste this SQL into the query editor:

```sql
-- Create notification table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_branch_id ON notification(branch_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);

-- Verify table was created
SELECT 'Notification table created successfully!' as status;
```

4. Click **"Run"** or **"Execute"**

---

## Method 2: Using psql Command Line

### Step 1: Get Connection String
1. In Render dashboard, go to your PostgreSQL database
2. Find the **"Internal Database URL"** or **"Connection String"**
3. It should look like: `postgresql://pharmacare_user:password@dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com:5432/pharmacare`

### Step 2: Connect Using psql
Open your terminal/command prompt and run:

```bash
psql "postgresql://pharmacare_user:YOUR_PASSWORD@dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com:5432/pharmacare?sslmode=require"
```

**Note:** Replace `YOUR_PASSWORD` with your actual database password.

### Step 3: Run the SQL
Once connected, paste and run:

```sql
CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_branch_id ON notification(branch_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
```

### Step 4: Verify
```sql
-- Check if table exists
\dt notification

-- Or query the table
SELECT * FROM notification LIMIT 1;
```

---

## Method 3: Using pgAdmin (GUI Tool)

### Step 1: Download pgAdmin
1. Download from: https://www.pgadmin.org/download/
2. Install and open pgAdmin

### Step 2: Add Server
1. Right-click **"Servers"** → **"Create"** → **"Server"**
2. **General Tab:**
   - Name: `Render PharmaCare DB`
3. **Connection Tab:**
   - Host: `dpg-d4t1j075r7bs73c71060-a.frankfurt-postgres.render.com`
   - Port: `5432`
   - Database: `pharmacare`
   - Username: `pharmacare_user`
   - Password: Your database password
   - **Check "Save password"**
4. **SSL Tab:**
   - SSL mode: `Require`
5. Click **"Save"**

### Step 3: Run SQL Script
1. Right-click on your database → **"Query Tool"**
2. Open the file: `database/create_notification_table.sql`
3. Or paste the SQL from Method 1
4. Click **"Execute"** (F5)

---

## Method 4: Using Node.js Script (Automated)

Create a script to run the migration:

```javascript
// update-database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createNotificationTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification (
        notification_id SERIAL PRIMARY KEY,
        branch_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_branch_id ON notification(branch_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
    `);

    console.log('✅ Notification table created successfully!');
  } catch (error) {
    console.error('❌ Error creating notification table:', error.message);
  } finally {
    await pool.end();
  }
}

createNotificationTable();
```

Run it:
```bash
node update-database.js
```

---

## Verify the Update

After running any method, verify the table was created:

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'notification';

-- Check table structure
\d notification

-- Or in psql
\dt notification
```

---

## Quick Reference: SQL to Run

```sql
CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_branch_id ON notification(branch_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
```

---

## Troubleshooting

### Error: "relation already exists"
- The table already exists - this is fine! The `IF NOT EXISTS` clause prevents errors.

### Error: "permission denied"
- Make sure you're using the correct database user credentials
- Check that the user has CREATE TABLE permissions

### Error: "connection refused"
- Verify your database is running on Render
- Check the connection string is correct
- Ensure SSL is enabled for production connections

### Can't find database in Render dashboard
- Go to Render dashboard → Your account → Databases
- Look for your PostgreSQL service

---

## Need Help?

If you encounter issues:
1. Check Render database logs
2. Verify connection credentials in your `.env` file
3. Ensure your database is active (not paused) on Render

