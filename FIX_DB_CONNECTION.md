# Fix Database Connection Issue

## Problem
The error `getaddrinfo ENOTFOUND dpg-d97do5d7vvec73ej7ej0-a` means the database hostname is incomplete.

## Solution

Your `.env` file has an incomplete hostname. Update it with the FULL hostname including the region:

### 1. Open `.env` file in the root directory

### 2. Find this line:
```
DB_HOST=dpg-d97do5d7vvec73ej7ej0-a
```

### 3. Replace it with the COMPLETE hostname:
```
DB_HOST=dpg-d97do5d7vvec73ej7ej0-a.frankfurt-postgres.render.com
```

### 4. Verify your complete `.env` database section looks like this:
```env
# -------------------------
# Database (PostgreSQL)
# -------------------------
DB_HOST=dpg-d97do5d7vvec73ej7ej0-a.frankfurt-postgres.render.com
DB_PORT=5432
DB_USER=pharmacare_user
DB_PASSWORD=6590fRxNKza6c3p6F5gN2KqammybXcYo
DB_NAME=pharmacare_jz9s
DB_SSL=true
```

### 5. Save the file and run again:
```bash
node initDb.js
```

## What Was Wrong?
Render PostgreSQL hostnames have the format: `{instance-id}.{region}-postgres.render.com`

Your hostname was missing the `.frankfurt-postgres.render.com` part, which is why Node.js couldn't find the server.

## Expected Output After Fix
```
🛠️ Init DB with config:
   host: dpg-d97do5d7vvec73ej7ej0-a.frankfurt-postgres.render.com
   port: 5432
   user: pharmacare_user
   db:   pharmacare_jz9s
   ssl:  enabled
🚀 Executing schema...
✅ Schema applied successfully
```

## Next Steps After Success
1. Verify admin user was created: `node list-users.js`
2. Start frontend: `cd frontend && npm run dev`
3. Login with: `admin@pharmacare.com` / `Admin@123`
