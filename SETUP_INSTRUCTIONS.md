# PharmaCare - Complete Setup Instructions

## Overview

This guide will walk you through setting up both the backend and frontend of the PharmaCare Pharmacy Management System.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed
- **PostgreSQL** database (local or cloud like Render)
- **Git** (optional, for version control)
- **Text editor** (VS Code recommended)

---

## Part 1: Backend Setup

### Step 1: Install Backend Dependencies

```bash
# From the root directory (where package.json is)
npm install
```

### Step 2: Configure Environment Variables

Your `.env` file should already be configured. Verify it has:

```env
# Database Configuration
DB_HOST=your-database-host
DB_PORT=5432
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=pharmacare
DB_SSL=true

# Server Configuration
PORT=10000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key
FROM_EMAIL=no-reply@pharmacare.com
FROM_NAME=PharmaCare

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000,http://localhost:5173
```

### Step 3: Initialize Database

```bash
# Run database initialization
node initDb.js
```

This will create all necessary tables and initial data.

### Step 4: Start Backend Server

```bash
# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The backend API should now be running at **http://localhost:10000**

### Step 5: Test Backend

Open your browser or Postman and test:
- Health check: http://localhost:10000/api/health
- Auth endpoints: http://localhost:10000/api/auth

---

## Part 2: Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

**This will install:**
- React 18
- React Router DOM
- Axios
- Tailwind CSS
- React Toastify
- React Icons
- React Hook Form
- Chart.js
- And more...

### Step 3: Verify Environment Variables

Check `frontend/.env` file:

```env
VITE_API_URL=http://localhost:10000
VITE_APP_NAME=PharmaCare
```

### Step 4: Start Frontend Development Server

```bash
npm run dev
```

The frontend should now be running at **http://localhost:3000**

---

## Part 3: Testing the Integration

### 1. Access the Application

Open your browser and go to: **http://localhost:3000**

You should see the PharmaCare login page.

### 2. Create a Test Admin Account

**Option A: Register through UI**
1. Click "Register here" on login page
2. Fill in details:
   - Full Name: Admin User
   - Email: admin@pharmacare.com
   - Password: Admin123!
   - Role: Manager (you'll activate as admin later)
   - Branch: Select any branch

**Option B: Use backend script**
```bash
# From root directory
node create_test_user.js
```

### 3. Verify Email

After registration, you'll receive a verification code:
1. Check your terminal/logs for the verification code
2. Or use: `node get_verification_code.js`
3. Enter the code on the verification page

### 4. Login

Use your credentials to log in. You'll be redirected to the appropriate dashboard based on your role.

### 5. Test Role-Based Access

**Admin Dashboard:**
- Navigate to: http://localhost:3000/admin/dashboard
- View system statistics
- Manage managers

**Manager Dashboard:**
- Navigate to: http://localhost:3000/manager/dashboard
- View branch statistics
- Manage staff
- Manage medicines

**Pharmacist Dashboard:**
- Navigate to: http://localhost:3000/pharmacist/dashboard
- Search medicines
- Create sales
- View reports

**Cashier Dashboard:**
- Navigate to: http://localhost:3000/cashier/dashboard
- Accept pending payments
- Process returns
- View payment reports

---

## Part 4: Common Issues & Solutions

### Issue 1: "Failed to resolve import" for react-toastify

**Solution:**
```bash
cd frontend
npm install react-toastify
```

### Issue 2: Backend CORS Error

**Solution:**
Ensure `.env` has correct frontend URL:
```env
FRONTEND_URL=http://localhost:3000,http://localhost:5173
```

### Issue 3: Database Connection Failed

**Solution:**
1. Check database credentials in `.env`
2. Ensure PostgreSQL is running
3. Test connection:
```bash
node verify_env.js
```

### Issue 4: Port Already in Use

**Frontend:**
```bash
# Change port in vite.config.js
server: {
  port: 3001, // Change from 3000
}
```

**Backend:**
```bash
# Change PORT in .env
PORT=10001
```

### Issue 5: Module Not Found

**Solution:**
```bash
# Backend
npm install

# Frontend
cd frontend
npm install
```

---

## Part 5: Development Workflow

### Making Changes

**Backend Changes:**
1. Edit files in `controllers/`, `routes/`, or `middleware/`
2. Server auto-reloads if using `npm run dev`
3. Test changes at http://localhost:10000/api

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. Vite hot-reloads automatically
3. Check browser at http://localhost:3000

### Adding New Features

**Backend (API Endpoint):**
1. Create controller function in `controllers/`
2. Add route in `routes/index.js`
3. Add middleware if needed
4. Test with Postman

**Frontend (Page/Component):**
1. Create component in `frontend/src/pages/` or `frontend/src/components/`
2. Add route in `frontend/src/App.jsx`
3. Create API service in `frontend/src/api/`
4. Update sidebar menu if needed

---

## Part 6: Building for Production

### Backend Production Build

```bash
# Set environment to production
NODE_ENV=production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name pharmacare-api
```

### Frontend Production Build

```bash
cd frontend

# Build
npm run build

# Output will be in frontend/dist/
```

### Deploy Frontend Build to Backend

```bash
# Copy frontend build to backend
cp -r frontend/dist/* ./public/

# Or move it
mv frontend/dist ./public
```

Now the backend will serve the frontend at http://localhost:10000

---

## Part 7: Deployment

### Deploy to Render (Backend)

1. Push code to GitHub
2. Go to render.com and create new Web Service
3. Connect your repository
4. Set environment variables from `.env`
5. Deploy

### Deploy to Vercel (Frontend)

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_API_URL=https://your-backend.onrender.com
```

### Update CORS After Deployment

Update backend `.env`:
```env
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Part 8: Next Steps

### Immediate Tasks

1. ✅ Install dependencies (backend & frontend)
2. ✅ Configure environment variables
3. ✅ Initialize database
4. ✅ Start both servers
5. ✅ Test login flow

### Development Tasks

1. **Complete remaining pages:**
   - Register page
   - Verify email page
   - Forgot password page
   - Dashboard pages with real data
   - Medicine inventory CRUD
   - Sales creation (POS)
   - Payment processing
   - Reports with charts

2. **Implement API services:**
   - Manager API (`frontend/src/api/manager.api.js`)
   - Pharmacist API (`frontend/src/api/pharmacist.api.js`)
   - Cashier API (`frontend/src/api/cashier.api.js`)
   - Admin API (`frontend/src/api/admin.api.js`)

3. **Add features:**
   - Real-time notifications
   - Search functionality
   - Data tables with pagination
   - Charts and graphs
   - Export to PDF/Excel
   - Print receipts

4. **Testing:**
   - Test all user flows
   - Test error handling
   - Test role-based access
   - Mobile responsiveness

5. **Deployment:**
   - Deploy backend to Render
   - Deploy frontend to Vercel
   - Configure custom domain
   - Set up SSL certificates

---

## Part 9: Helpful Commands

### Backend Commands

```bash
# Start server
npm start

# Development mode with auto-reload
npm run dev

# Initialize database
node initDb.js

# Reset database
node resetDb.js

# Create test user
node create_test_user.js

# Get verification code
node get_verification_code.js

# List users
node list-users.js

# Check environment
node verify_env.js
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## Support

If you encounter any issues:

1. Check the error message carefully
2. Review the console logs (browser & terminal)
3. Verify environment variables
4. Ensure all dependencies are installed
5. Check database connection
6. Review CORS configuration

---

**You're all set! Start building your pharmacy management system! 🚀**
