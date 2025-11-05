# Testing Guide - How to Run and Test PharmaCare Backend

## Prerequisites

1. **XAMPP** installed and running
2. **Node.js** installed (v14 or higher)
3. **MySQL** running in XAMPP

## Step 1: Setup Database

### Option A: Using phpMyAdmin (Recommended)
1. Start XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. Open **phpMyAdmin**: http://localhost/phpmyadmin
4. Click on **"Import"** tab
5. Choose file: `database/schema.sql` (from project root)
6. Click **"Go"** to import

### Option B: Using Command Line
```bash
# Navigate to project root
cd c:\Projects\pharmacare

# Import database (replace 'root' with your MySQL username if different)
mysql -u root -p < database/schema.sql
# Enter password when prompted (press Enter if no password)
```

### Verify Database
- Database name: `pharmacare`
- Check if tables are created: `pharmacy`, `branch`, `role`, `user`, `category`, `medicine`, etc.
- Check if default roles are inserted (Admin, Manager, Pharmacist, Cashier)

## Step 2: Configure Environment

1. Navigate to backend folder:
```bash
cd backend
```

2. Create `.env` file (copy from `.env.example`):
```bash
# On Windows PowerShell
copy .env.example .env

# On Git Bash or Linux/Mac
cp .env.example .env
```

3. Edit `.env` file with your settings:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Leave empty if no password
DB_NAME=pharmacare
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=my-super-secret-key-change-this-in-production-123456789
JWT_EXPIRE=7d
```

## Step 3: Install Dependencies

```bash
# Make sure you're in the backend folder
npm install
```

This will install:
- express
- mysql2
- bcryptjs
- jsonwebtoken
- dotenv
- cors
- express-validator

## Step 4: Start the Server

```bash
npm start
```

You should see:
```
✅ Database connected successfully
🚀 Server running on http://localhost:5000
📡 API endpoints available at http://localhost:5000/api
```

## Step 5: Test the API

### Option A: Using Postman

#### 1. Test Health Endpoint
```
GET http://localhost:5000/api/health
```

Expected Response:
```json
{
  "success": true,
  "message": "PharmaCare API is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

#### 2. Register a New User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "full_name": "Selam T.",
  "email": "selam@example.com",
  "password": "SecurePass123",
  "role_id": 3,
  "branch_id": 1
}
```

**Available Roles:**
- 1 = Admin
- 2 = Manager
- 3 = Pharmacist
- 4 = Cashier

**Available Branches (from schema):**
- 1 = PharmaCare - Addis Ababa Branch
- 2 = PharmaCare - Debre Berhan Branch

Expected Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "full_name": "Selam T.",
    "email": "selam@example.com",
    "role_id": 3,
    "branch_id": 1,
    "role_name": "Pharmacist",
    "branch_name": "PharmaCare - Addis Ababa Branch"
  }
}
```

**Save the token** from the response for the next step!

#### 3. Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "selam@example.com",
  "password": "SecurePass123"
}
```

Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "full_name": "Selam T.",
    "email": "selam@example.com",
    "role_id": 3,
    "branch_id": 1,
    "role_name": "Pharmacist",
    "branch_name": "PharmaCare - Addis Ababa Branch"
  }
}
```

#### 4. Get Current User (Protected Route)
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with the token from login/register response.

Expected Response:
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "full_name": "Selam T.",
    "email": "selam@example.com",
    "role_id": 3,
    "branch_id": 1,
    "role_name": "Pharmacist",
    "branch_name": "PharmaCare - Addis Ababa Branch",
    "location": "Addis Ababa, Bole"
  }
}
```

#### 5. Test Protected Route (Get All Users)
```
GET http://localhost:5000/api/users
Authorization: Bearer YOUR_TOKEN_HERE
```

### Option B: Using cURL (Command Line)

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"full_name\":\"Selam T.\",\"email\":\"selam@example.com\",\"password\":\"SecurePass123\",\"role_id\":3,\"branch_id\":1}"
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"selam@example.com\",\"password\":\"SecurePass123\"}"
```

#### Get Current User (Replace TOKEN with actual token)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option C: Using Browser (for GET requests only)

1. Health Check:
   - Open: http://localhost:5000/api/health

2. For protected routes, use browser extensions like:
   - **ModHeader** (Chrome extension)
   - Add header: `Authorization: Bearer YOUR_TOKEN`

## Troubleshooting

### Database Connection Error
```
❌ Database connection failed: Access denied for user 'root'@'localhost'
```

**Solution:**
- Check MySQL is running in XAMPP
- Verify username and password in `.env`
- Try: `mysql -u root -p` to test connection

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
- Change PORT in `.env` file
- Or kill the process using port 5000

### Import Database Error
```
Unknown database 'pharmacare'
```

**Solution:**
- Database might not exist
- Create it manually: `CREATE DATABASE pharmacare;`
- Then import schema.sql again

### Token Errors
- Make sure you copy the **entire token** (it's long)
- Token expires after 7 days by default
- Re-login to get a new token

## Quick Test Script

Create a file `test.js` in backend folder:

```javascript
const fetch = require('node-fetch'); // npm install node-fetch@2

async function test() {
  // Register
  const registerRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
      role_id: 4,
      branch_id: 1
    })
  });
  const registerData = await registerRes.json();
  console.log('Register:', registerData);
  
  const token = registerData.token;
  
  // Get Me
  const meRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('Get Me:', meData);
}

test();
```

Run: `node test.js`

## Success Checklist

- [ ] Database imported successfully
- [ ] `.env` file created and configured
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors
- [ ] Health endpoint returns success
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Can access protected routes with token

## Next Steps

After authentication works:
1. Create frontend to consume these APIs
2. Implement medicine management endpoints
3. Implement sales endpoints
4. Add notifications system

