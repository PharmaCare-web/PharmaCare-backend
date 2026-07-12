# PharmaCare - Pharmacy Management System

## 🎯 Project Overview

Complete full-stack pharmacy management system with authentication, inventory management, sales tracking, and role-based access control.

## ✅ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React** 18.2 - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Toastify** - Notifications

## 📁 Project Structure

```
pharmacare/
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── api/                 # API service layer
│   │   ├── components/          # Reusable components
│   │   ├── context/             # React context (Auth)
│   │   ├── pages/               # Page components
│   │   ├── App.jsx              # Main app with routes
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   └── vite.config.js
├── config/
│   └── database.js              # PostgreSQL connection
├── controllers/                  # Business logic
├── middleware/                   # Auth & validation
├── routes/                       # API routes
├── models/                       # Data models
├── database/
│   └── postgresql_schema.sql   # Database schema
├── server.js                     # Backend server
└── README.md
```

## 🗄️ Database Schema

**Authentication Tables:**
1. **pharmacy** - Company/chain information
2. **branch** - Individual pharmacy outlets
3. **role** - User roles
   - **System role:** Admin (system-level, does not belong to any branch)
   - **Pharmacy roles:** Manager, Pharmacist, Cashier (belong to a branch)
4. **user** - Employee accounts with authentication
   - Note: `branch_id` is NULL for Admin users, required for pharmacy roles

**Feature Tables:**
5. **category** - Medicine categories
6. **medicine** - Inventory per branch
7. **sale** - Sales transactions
8. **sale_item** - Items in each sale
9. **payment** - Payment tracking
10. **return_table** - Product returns
11. **refund** - Refund processing
12. **notification** - System alerts

## 🚀 Quick Start

See **SETUP_INSTRUCTIONS.md** for detailed setup guide.

### Backend Setup (Quick)

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file (update with your database credentials)
# See .env file in root

# 3. Initialize database
node initDb.js

# 4. Start backend server
npm start
```

Backend runs on: **http://localhost:10000**

### Frontend Setup (Quick)

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

### Start Both Servers (Windows)

```bash
# Double-click start-dev.bat
# OR
start-dev.bat
```

---

## 📖 Documentation

- **SETUP_INSTRUCTIONS.md** - Complete setup guide
- **FRONTEND_BLUEPRINT.md** - Frontend architecture & pages
- **FRONTEND_BACKEND_INTEGRATION_GUIDE.md** - Integration guide
- **frontend/README.md** - Frontend-specific documentation

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role_id": 4,
  "branch_id": 1
}

Note: For Admin users (role_id=1), omit branch_id as Admin is a system role.
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### View Auth Endpoints
```http
GET /api/auth
```

## 👥 User Roles

### System Role
- **1** - Admin (System-level access across all branches)
  - ⚠️ **Admin is NOT a pharmacy role**
  - Does not belong to any branch (`branch_id` is NULL)
  - System-level access only

### Pharmacy Roles (Branch-specific)
- **2** - Manager (Branch-level management and oversight)
- **3** - Pharmacist (Medicine stock management and dispensing)
- **4** - Cashier (Sales transactions only)

**Note:** Only Manager, Pharmacist, and Cashier are actual pharmacy roles that belong to a branch. Admin belongs to the system, not to any branch.

## 🏢 Sample Branches

- **1** - PharmaCare - Addis Ababa Branch
- **2** - PharmaCare - Debre Berhan Branch

## 🧪 Testing

### Test Health
```
GET http://localhost:5000/api/health
```

### Test Registration
Use Postman or curl to register a new user (see RUN_TESTS.md for details)

## 📝 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token-based authentication
- ✅ Secure password requirements
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ CORS configuration
- ✅ Token expiration

## 📚 Documentation

- **SETUP_INSTRUCTIONS.md** - Complete setup guide
- **FRONTEND_BLUEPRINT.md** - Frontend architecture & all pages
- **FRONTEND_BACKEND_INTEGRATION_GUIDE.md** - API integration guide
- **frontend/README.md** - Frontend-specific docs

## 🌐 URLs

- **Backend API:** http://localhost:10000
- **Frontend:** http://localhost:3000
- **API Health:** http://localhost:10000/api/health
- **API Docs:** http://localhost:10000/api/auth

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 👤 Author

- Kalddass

## 📄 License

ISC License

---

**Note:** Make sure to:
1. Import the database schema first
2. Create `.env` file in backend folder
3. Install dependencies with `npm install`
