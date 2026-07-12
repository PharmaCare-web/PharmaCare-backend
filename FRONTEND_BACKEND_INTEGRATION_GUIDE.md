# Frontend-Backend Integration Guide

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [CORS Configuration](#cors-configuration)
3. [API Service Layer](#api-service-layer)
4. [Authentication Integration](#authentication-integration)
5. [Role-Based Routing](#role-based-routing)
6. [API Integration Examples](#api-integration-examples)
7. [Error Handling](#error-handling)
8. [Deployment](#deployment)

---

## Setup & Configuration

### Step 1: Create React Project with Vite
```bash
# Create new Vite project
npm create vite@latest pharmacare-frontend -- --template react

cd pharmacare-frontend

# Install core dependencies
npm install axios react-router-dom

# Install UI libraries
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional utilities
npm install react-hook-form react-toastify date-fns react-icons
npm install chart.js react-chartjs-2

# Development dependencies
npm install -D @types/node
```

### Step 2: Project Folder Structure
```
pharmacare-frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js
│   │   ├── auth.api.js
│   │   ├── admin.api.js
│   │   ├── manager.api.js
│   │   ├── pharmacist.api.js
│   │   └── cashier.api.js
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── auth/
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── manager/
│   │   ├── pharmacist/
│   │   ├── cashier/
│   │   └── shared/
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.js
```

### Step 3: Environment Configuration

**Create `.env` file:**
```env
VITE_API_URL=http://localhost:10000
VITE_APP_NAME=PharmaCare
```

**Create `.env.example` file:**
```env
VITE_API_URL=your_backend_url
VITE_APP_NAME=PharmaCare
```

**Update `vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## CORS Configuration

### Backend: Update `server.js` to allow frontend origin

**Location:** `backend/server.js`

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Local development
    'http://localhost:5173',           // Vite default
    'https://your-frontend.vercel.app' // Production frontend
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// ... rest of your server configuration
```

---

## API Service Layer

### Base Axios Configuration

**File:** `src/api/axios.js`
```javascript
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data, // Return only data
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## Authentication Integration

### Auth Context

**File:** `src/context/AuthContext.jsx`
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Verify token is still valid
        const response = await api.get('/auth/me');
        setUser(response.user);
      } catch (error) {
        // Token is invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success(`Welcome back, ${user.full_name}!`);

      // Redirect based on role
      redirectBasedOnRole(user.role_name);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email', { state: { email: userData.email } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
      toast.info('Logged out successfully');
    }
  };

  const redirectBasedOnRole = (roleName) => {
    const roleRoutes = {
      Admin: '/admin/dashboard',
      Manager: '/manager/dashboard',
      Pharmacist: '/pharmacist/dashboard',
      Cashier: '/cashier/dashboard',
    };
    navigate(roleRoutes[roleName] || '/');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Private Route Component

**File:** `src/components/auth/PrivateRoute.jsx`
```javascript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default PrivateRoute;
```

---

## Role-Based Routing

### App Router

**File:** `src/App.jsx`
```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import pages (examples - you'll create these)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';

import AdminDashboard from './pages/admin/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';
import PharmacistDashboard from './pages/pharmacist/Dashboard';
import CashierDashboard from './pages/cashier/Dashboard';

import Unauthorized from './pages/shared/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute allowedRoles={['Admin']} />}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            {/* Add more admin routes */}
          </Route>

          {/* Manager Routes */}
          <Route path="/manager" element={<PrivateRoute allowedRoles={['Manager']} />}>
            <Route index element={<Navigate to="/manager/dashboard" />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            {/* Add more manager routes */}
          </Route>

          {/* Pharmacist Routes */}
          <Route path="/pharmacist" element={<PrivateRoute allowedRoles={['Pharmacist']} />}>
            <Route index element={<Navigate to="/pharmacist/dashboard" />} />
            <Route path="dashboard" element={<PharmacistDashboard />} />
            {/* Add more pharmacist routes */}
          </Route>

          {/* Cashier Routes */}
          <Route path="/cashier" element={<PrivateRoute allowedRoles={['Cashier']} />}>
            <Route index element={<Navigate to="/cashier/dashboard" />} />
            <Route path="dashboard" element={<CashierDashboard />} />
            {/* Add more cashier routes */}
          </Route>

          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## API Integration Examples

### Auth API Service

**File:** `src/api/auth.api.js`
```javascript
import api from './axios';

export const authAPI = {
  // Login
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },

  // Register
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Verify Email
  verifyEmail: async (email, verification_code) => {
    return await api.post('/auth/verify-email', { email, verification_code });
  },

  // Resend Verification Code
  resendVerification: async (email) => {
    return await api.post('/auth/resend-verification', { email });
  },

  // Forgot Password
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Get Current User
  getMe: async () => {
    return await api.get('/auth/me');
  },

  // Change Password
  changePassword: async (current_password, new_password) => {
    return await api.post('/auth/change-password', { current_password, new_password });
  },

  // Logout
  logout: async () => {
    return await api.post('/auth/logout');
  },
};
```

### Manager API Service

**File:** `src/api/manager.api.js`
```javascript
import api from './axios';

export const managerAPI = {
  // Dashboard
  getDashboard: async () => {
    return await api.get('/manager/dashboard');
  },

  getBranchOverview: async () => {
    return await api.get('/manager/dashboard/branch');
  },

  getInventorySummary: async () => {
    return await api.get('/manager/dashboard/inventory');
  },

  getSalesSummary: async (year) => {
    return await api.get('/manager/dashboard/sales', { params: { year } });
  },

  getNotifications: async () => {
    return await api.get('/manager/dashboard/notifications');
  },

  // Staff Management
  getAllStaff: async () => {
    return await api.get('/manager/staff');
  },

  createStaff: async (staffData) => {
    return await api.post('/manager/staff', staffData);
  },

  verifyStaff: async (email, verification_code) => {
    return await api.post('/manager/staff/verify', { email, verification_code });
  },

  updateStaff: async (user_id, staffData) => {
    return await api.put(`/manager/staff/${user_id}`, staffData);
  },

  removeStaff: async (user_id) => {
    return await api.delete(`/manager/staff/${user_id}`);
  },

  resetStaffPassword: async (user_id) => {
    return await api.post(`/manager/staff/${user_id}/reset-password`);
  },

  // Medicine Management
  getAllMedicines: async () => {
    return await api.get('/manager/medicines');
  },

  getMedicineById: async (medicine_id) => {
    return await api.get(`/manager/medicines/${medicine_id}`);
  },

  addMedicine: async (medicineData) => {
    return await api.post('/manager/medicines', medicineData);
  },

  updateMedicineStock: async (medicine_id, stockData) => {
    return await api.put(`/manager/medicines/${medicine_id}/stock`, stockData);
  },

  removeMedicine: async (medicine_id) => {
    return await api.delete(`/manager/medicines/${medicine_id}`);
  },
};
```

### Pharmacist API Service

**File:** `src/api/pharmacist.api.js`
```javascript
import api from './axios';

export const pharmacistAPI = {
  // Medicines
  getAllMedicines: async () => {
    return await api.get('/pharmacist/medicines');
  },

  searchMedicines: async (query) => {
    return await api.get('/pharmacist/medicines/search', { params: { query } });
  },

  getMedicinesByCategory: async (category_id) => {
    return await api.get(`/pharmacist/medicines/category/${category_id}`);
  },

  getMedicineById: async (medicine_id) => {
    return await api.get(`/pharmacist/medicines/${medicine_id}`);
  },

  // Inventory
  requestRestock: async (medicine_id, requested_quantity, notes) => {
    return await api.post('/pharmacist/inventory/request-restock', {
      medicine_id,
      requested_quantity,
      notes,
    });
  },

  markLowStock: async (medicine_id, threshold, notes) => {
    return await api.post('/pharmacist/inventory/mark-low-stock', {
      medicine_id,
      threshold,
      notes,
    });
  },

  getStockHistory: async (medicine_id) => {
    return await api.get('/pharmacist/inventory/stock-history', {
      params: { medicine_id },
    });
  },

  // Medicine Stock Management
  addMedicine: async (medicineData) => {
    return await api.post('/pharmacist/medicines', medicineData);
  },

  updateMedicineStock: async (medicine_id, stockData) => {
    return await api.put(`/pharmacist/medicines/${medicine_id}/stock`, stockData);
  },

  removeMedicine: async (medicine_id) => {
    return await api.delete(`/pharmacist/medicines/${medicine_id}`);
  },

  // Sales
  createSale: async (saleData) => {
    return await api.post('/pharmacist/sales', saleData);
  },

  getSaleById: async (sale_id) => {
    return await api.get(`/pharmacist/sales/${sale_id}`);
  },

  // Reports
  getLowStockReport: async (threshold = 10) => {
    return await api.get('/pharmacist/reports/low-stock', { params: { threshold } });
  },

  getExpiryReport: async (days = 30) => {
    return await api.get('/pharmacist/reports/expiry', { params: { days } });
  },

  getInventorySummary: async () => {
    return await api.get('/pharmacist/reports/inventory-summary');
  },
};
```

### Cashier API Service

**File:** `src/api/cashier.api.js`
```javascript
import api from './axios';

export const cashierAPI = {
  // Payments
  getPendingPayments: async () => {
    return await api.get('/cashier/payments/pending');
  },

  getPaymentDetails: async (sale_id) => {
    return await api.get(`/cashier/payments/${sale_id}`);
  },

  acceptPayment: async (sale_id, payment_type, reference_number) => {
    return await api.post(`/cashier/payments/${sale_id}/accept`, {
      payment_type,
      reference_number,
    });
  },

  getReceipt: async (sale_id) => {
    return await api.get(`/cashier/receipts/${sale_id}`);
  },

  // Returns
  getSalesForReturn: async (sale_id) => {
    return await api.get('/cashier/returns/sales', { params: { sale_id } });
  },

  getSaleItems: async (sale_id) => {
    return await api.get(`/cashier/returns/sales/${sale_id}/items`);
  },

  processReturn: async (returnData) => {
    return await api.post('/cashier/returns', returnData);
  },

  // Reports
  getPaymentReports: async (filters) => {
    return await api.get('/cashier/reports/payments', { params: filters });
  },

  getReturnReports: async (filters) => {
    return await api.get('/cashier/reports/returns', { params: filters });
  },
};
```

### Admin API Service

**File:** `src/api/admin.api.js`
```javascript
import api from './axios';

export const adminAPI = {
  // Dashboard
  getDashboard: async () => {
    return await api.get('/admin/dashboard');
  },

  getTotalBranches: async () => {
    return await api.get('/admin/dashboard/branches');
  },

  getTotalUsers: async () => {
    return await api.get('/admin/dashboard/users');
  },

  getTotalSales: async () => {
    return await api.get('/admin/dashboard/sales');
  },

  getBranchList: async () => {
    return await api.get('/admin/dashboard/branches-list');
  },

  // Manager Management
  getAllManagers: async () => {
    return await api.get('/admin/managers');
  },

  getPendingManagers: async () => {
    return await api.get('/admin/managers/pending');
  },

  getActivatedManagers: async () => {
    return await api.get('/admin/managers/activated');
  },

  getManagersByBranch: async (branch_id) => {
    return await api.get(`/admin/managers/branch/${branch_id}`);
  },

  activateManager: async (user_id) => {
    return await api.put(`/admin/managers/${user_id}/activate`);
  },

  deactivateManager: async (user_id) => {
    return await api.put(`/admin/managers/${user_id}/deactivate`);
  },
};
```

---

## Error Handling

### Global Error Handler

**File:** `src/utils/errorHandler.js`
```javascript
import { toast } from 'react-toastify';

export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const message = error.response.data?.message || 'An error occurred';

    switch (status) {
      case 400:
        toast.error(`Bad Request: ${message}`);
        break;
      case 401:
        toast.error('Unauthorized. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(message);
    }
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error. Please check your connection.');
  } else {
    // Something else happened
    toast.error('An unexpected error occurred.');
  }
};

export const handleFormValidation = (errors) => {
  Object.keys(errors).forEach((key) => {
    toast.error(errors[key].message);
  });
};
```

---

## Deployment

### Frontend Deployment (Vercel)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Deploy**
```bash
# From frontend directory
vercel

# Or for production
vercel --prod
```

**Step 4: Configure Environment Variables in Vercel**
- Go to your Vercel project dashboard
- Navigate to Settings → Environment Variables
- Add: `VITE_API_URL` = `https://your-backend.onrender.com`

### Backend Deployment (Render)

**Already deployed, but update CORS and FRONTEND_URL:**

**Update `.env` on Render:**
```env
FRONTEND_URL=https://your-frontend.vercel.app
```

**Update `server.js` CORS:**
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app' // Add your deployed frontend URL
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### Alternative: Deploy Frontend to Render

**Create `render.yaml` in frontend folder:**
```yaml
services:
  - type: web
    name: pharmacare-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://your-backend.onrender.com
```

---

## Testing Integration

### Test Login Flow
```javascript
// Test in browser console or create a test page

const testLogin = async () => {
  const API_URL = 'http://localhost:10000/api';
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('Login Response:', data);
    
    if (data.token) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
    }
  } catch (error) {
    console.error('❌ Login failed:', error);
  }
};

testLogin();
```

### Test Protected Route
```javascript
const testProtectedRoute = async (token) => {
  const API_URL = 'http://localhost:10000/api';
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('User Info:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Quick Start Checklist

### Backend Setup
- [ ] Database deployed on Render
- [ ] Backend deployed on Render
- [ ] Environment variables configured
- [ ] CORS configured for frontend origin
- [ ] Test API endpoints with Postman

### Frontend Setup
- [ ] React project created with Vite
- [ ] Dependencies installed
- [ ] Tailwind CSS configured
- [ ] Environment variables set
- [ ] Axios instance configured
- [ ] Auth context created
- [ ] Private route component created
- [ ] Basic routing structure set up

### Integration
- [ ] Test login from frontend to backend
- [ ] Verify JWT token storage
- [ ] Test protected routes
- [ ] Test role-based access
- [ ] Test all CRUD operations
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add success/error notifications

### Deployment
- [ ] Frontend deployed (Vercel/Render)
- [ ] Backend CORS updated with frontend URL
- [ ] Environment variables set in deployment platform
- [ ] Test production deployment
- [ ] Monitor for errors

---

**Integration Complete!** 

Your PharmaCare frontend is now ready to communicate with the backend. Start building your pages and components using the API services provided.
