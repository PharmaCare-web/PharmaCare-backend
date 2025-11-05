# PharmaCare - Pharmacy Management System

## 🎯 Project Overview

Complete pharmacy management system with authentication, inventory management, and sales tracking.

## ✅ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database (XAMPP)
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📁 Project Structure

```
pharmacare/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── userController.js    # User management
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── errorHandler.js      # Error handling
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   └── index.js             # Main routes
│   ├── utils/
│   │   └── validation.js        # Input validation
│   ├── models/
│   │   └── user.js              # User model
│   ├── data/
│   │   └── users.json           # Sample data
│   ├── server.js                # Main server
│   └── package.json             # Dependencies
├── database/
│   └── schema.sql               # Complete database schema
└── README.md
```

## 🗄️ Database Schema

**Authentication Tables:**
1. **pharmacy** - Company/chain information
2. **branch** - Individual pharmacy outlets
3. **role** - User roles (Admin, Manager, Pharmacist, Cashier)
4. **user** - Employee accounts with authentication

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

### 1. Setup Database

**Using phpMyAdmin (Recommended):**
1. Start XAMPP Control Panel
2. Start **MySQL**
3. Open http://localhost/phpmyadmin
4. Click "Import" tab
5. Choose `database/schema.sql`
6. Click "Go"

**Using Command Line:**
```bash
mysql -u root -p < database/schema.sql
```

### 2. Configure Backend

```bash
cd backend
```

Create `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pharmacare
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d
```

### 3. Install & Run

```bash
npm install
npm start
```

Server runs on: **http://localhost:5000**

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

- **1** - Admin (Full system access)
- **2** - Manager (Branch-level management)
- **3** - Pharmacist (Stock management)
- **4** - Cashier (Sales only)

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

- **START_HERE.md** - Quick start guide
- **RUN_TESTS.md** - Testing instructions
- **backend/README_AUTH.md** - Authentication details
- **backend/TESTING_GUIDE.md** - Complete testing guide

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
