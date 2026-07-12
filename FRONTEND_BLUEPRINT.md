# PharmaCare Frontend Blueprint

## 📋 Project Overview

**Project Name:** PharmaCare Pharmacy Management System - Frontend  
**Backend API:** Node.js + Express + PostgreSQL  
**Target Users:** Admin, Manager, Pharmacist, Cashier

---

## 🎯 Technology Stack Recommendations

### Core Framework
- **React.js** (v18+) with **TypeScript**
- **Vite** for build tooling

### Routing
- **React Router DOM** (v6+)

### State Management
- **React Context API** + **useReducer** (for auth and global state)
- **TanStack Query (React Query)** for server state management

### HTTP Client
- **Axios** with interceptors for JWT token handling

### UI Framework/Styling
- **Tailwind CSS** + **shadcn/ui** components
- **Lucide React** for icons

### Form Handling
- **React Hook Form** + **Zod** for validation

### Additional Libraries
- **date-fns** for date formatting
- **recharts** for data visualization
- **react-to-print** for receipt printing
- **sonner** for toast notifications

---

## 🔐 Authentication & Authorization

### JWT Token Management
```javascript
// Store token in localStorage
localStorage.setItem('auth_token', token)

// Store user data
localStorage.setItem('user', JSON.stringify(userData))

// Axios interceptor for adding token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Protected Routes
```javascript
// ProtectedRoute component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) return <Navigate to="/login" />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />
  
  return children
}
```

### Role-Based Access
- **Admin:** role_id = 1
- **Manager:** role_id = 2  
- **Pharmacist:** role_id = 3
- **Cashier:** role_id = 4

---

## 📁 Project Structure

```
pharmacare-frontend/
├── public/
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── api/              # API service layer
│   │   ├── auth.api.ts
│   │   ├── admin.api.ts
│   │   ├── manager.api.ts
│   │   ├── pharmacist.api.ts
│   │   ├── cashier.api.ts
│   │   └── axios.config.ts
│   ├── components/       # Reusable components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── StatCard.tsx
│   │       └── LoadingSpinner.tsx
│   ├── pages/            # Page components
│   │   ├── public/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── VerifyEmailPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── shared/
│   │   │   ├── ProfilePage.tsx
│   │   │   └── ChangePasswordPage.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── ManagerManagement.tsx
│   │   ├── manager/
│   │   │   ├── ManagerDashboard.tsx
│   │   │   ├── StaffManagement.tsx
│   │   │   ├── MedicineInventory.tsx
│   │   │   ├── SalesReports.tsx
│   │   │   ├── InventoryReports.tsx
│   │   │   └── Notifications.tsx
│   │   ├── pharmacist/
│   │   │   ├── PharmacistDashboard.tsx
│   │   │   ├── MedicineSearch.tsx
│   │   │   ├── CreateSalePOS.tsx
│   │   │   ├── SaleDetails.tsx
│   │   │   ├── ManageStock.tsx
│   │   │   ├── RequestRestock.tsx
│   │   │   └── PharmacistReports.tsx
│   │   └── cashier/
│   │       ├── CashierDashboard.tsx
│   │       ├── PendingPayments.tsx
│   │       ├── PaymentReceipt.tsx
│   │       ├── ProcessReturns.tsx
│   │       ├── PaymentReports.tsx
│   │       └── ReturnReports.tsx
│   ├── context/          # React Context
│   │   └── AuthContext.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useApi.ts
│   ├── types/            # TypeScript types
│   │   ├── user.types.ts
│   │   ├── medicine.types.ts
│   │   ├── sale.types.ts
│   │   └── api.types.ts
│   ├── utils/            # Utility functions
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── routes/           # Route definitions
│   │   └── AppRoutes.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 🗺️ Complete Page List & Routes

### Public Pages (No Authentication Required)

| Page | Route | Component | API Endpoint | Description |
|------|-------|-----------|--------------|-------------|
| Login | `/login` | `LoginPage` | `POST /api/auth/login` | User login with email/password |
| Register | `/register` | `RegisterPage` | `POST /api/auth/register` | User registration |
| Verify Email | `/verify-email` | `VerifyEmailPage` | `POST /api/auth/verify-email` | Email verification with code |
| Forgot Password | `/forgot-password` | `ForgotPasswordPage` | `POST /api/auth/forgot-password` | Request password reset |
| Resend Verification | - | - | `POST /api/auth/resend-verification` | Resend verification code |

### Shared Authenticated Pages (All Roles)

| Page | Route | Component | API Endpoint | Description |
|------|-------|-----------|--------------|-------------|
| Profile | `/profile` | `ProfilePage` | `GET /api/auth/me` | View/edit user profile |
| Change Password | `/change-password` | `ChangePasswordPage` | `POST /api/auth/change-password` | Change password (required on first login) |

### Admin Pages (role_id = 1)

| Page | Route | Component | API Endpoints | Description |
|------|-------|-----------|---------------|-------------|
| Admin Dashboard | `/admin/dashboard` | `AdminDashboard` | `GET /api/admin/dashboard` | System overview with totals |
| Manager Management | `/admin/managers` | `ManagerManagement` | `GET /api/admin/managers/*` | View/activate/deactivate managers |

**Admin Dashboard Features:**
- Total branches count
- Total users count (excluding admins)
- Total completed sales count
- Pending managers count
- Activated managers count
- Branch list with employee counts

**Manager Management Features:**
- View all managers
- Filter pending managers
- Filter activated managers
- Filter by branch
- Activate manager accounts
- Deactivate manager accounts

---

### Manager Pages (role_id = 2)

| Page | Route | Component | API Endpoints | Description |
|------|-------|-----------|---------------|-------------|
| Manager Dashboard | `/manager/dashboard` | `ManagerDashboard` | `GET /api/manager/dashboard` | Branch overview, inventory, sales |
| Staff Management | `/manager/staff` | `StaffManagement` | `GET/POST/PUT/DELETE /api/manager/staff/*` | Manage pharmacists & cashiers |
| Medicine Inventory | `/manager/medicines` | `MedicineInventory` | `GET/POST/PUT/DELETE /api/manager/medicines/*` | Manage medicine stock |
| Sales Reports | `/manager/reports/sales` | `SalesReports` | `GET /api/manager/dashboard/sales` | Sales analytics |
| Inventory Reports | `/manager/reports/inventory` | `InventoryReports` | `GET /api/manager/dashboard/inventory` | Inventory analytics |
| Notifications | `/manager/notifications` | `Notifications` | `GET /api/manager/dashboard/notifications` | System alerts & requests |

**Manager Dashboard Features:**
- Branch overview (name, location, staff counts)
- Inventory summary (total medicines, low stock, expiring)
- Sales summary (today, week, month, year)
- Top selling medicines
- Low stock alerts
- Expired/expiring medicines
- Pending sales & returns
- Notifications panel

**Staff Management Features:**
- Create staff (Pharmacist/Cashier)
- Generate verification codes
- View all staff members
- Edit staff details
- Remove staff
- Reset staff passwords
- Verify staff with code

**Medicine Inventory Features:**
- View all medicines
- Search by name/barcode
- Filter by category
- Add new medicine
- Update stock quantity
- Update price
- Remove medicine

---

### Pharmacist Pages (role_id = 3)

| Page | Route | Component | API Endpoints | Description |
|------|-------|-----------|---------------|-------------|
| Pharmacist Dashboard | `/pharmacist/dashboard` | `PharmacistDashboard` | - | Quick access & alerts |
| Medicine Search | `/pharmacist/medicines` | `MedicineSearch` | `GET /api/pharmacist/medicines/*` | View & search medicines |
| Create Sale (POS) | `/pharmacist/sales/new` | `CreateSalePOS` | `POST /api/pharmacist/sales` | Point of sale system |
| Sale Details | `/pharmacist/sales/:id` | `SaleDetails` | `GET /api/pharmacist/sales/:sale_id` | View sale/receipt |
| Manage Stock | `/pharmacist/medicines/manage` | `ManageStock` | `POST/PUT/DELETE /api/pharmacist/medicines/*` | Add/update/remove medicines |
| Request Restock | `/pharmacist/restock` | `RequestRestock` | `POST /api/pharmacist/inventory/request-restock` | Request stock from manager |
| Reports | `/pharmacist/reports` | `PharmacistReports` | `GET /api/pharmacist/reports/*` | Low stock, expiry, inventory |

**Pharmacist Dashboard Features:**
- Quick access cards (Medicines, Sales, Reports)
- Recent low stock alerts
- Expiring medicines list

**Medicine Search Features:**
- Search by name, barcode, category
- Filter by category
- View medicine details (quantity, price, expiry)
- Stock levels

**Create Sale (POS) Features:**
- Medicine search/barcode scanner
- Shopping cart
- Add/remove items
- Quantity adjustment
- Real-time total calculation
- Payment type selection
- Submit sale (creates pending_payment status)
- Show sale ID for cashier

**Manage Stock Features:**
- Add new medicine to inventory
- Update stock quantity (add/remove)
- Update medicine price
- Remove medicine from inventory
- Low stock notifications

**Request Restock Features:**
- Select medicine from dropdown
- Enter requested quantity
- Add notes
- Submit request (notifies manager)

**Reports Features:**
- Low stock report (medicines below threshold)
- Expiry report (medicines expiring soon)
- Inventory summary (by category)

---

### Cashier Pages (role_id = 4)

| Page | Route | Component | API Endpoints | Description |
|------|-------|-----------|---------------|-------------|
| Cashier Dashboard | `/cashier/dashboard` | `CashierDashboard` | - | Pending payments overview |
| Pending Payments | `/cashier/payments/pending` | `PendingPayments` | `GET /api/cashier/payments/pending` | Accept payments from pharmacists |
| Payment Receipt | `/cashier/receipts/:id` | `PaymentReceipt` | `GET /api/cashier/receipts/:sale_id` | View & print receipt |
| Process Returns | `/cashier/returns` | `ProcessReturns` | `GET/POST /api/cashier/returns/*` | Process medicine returns |
| Payment Reports | `/cashier/reports/payments` | `PaymentReports` | `GET /api/cashier/reports/payments` | Payment analytics |
| Return Reports | `/cashier/reports/returns` | `ReturnReports` | `GET /api/cashier/reports/returns` | Return analytics |

**Cashier Dashboard Features:**
- Pending payments count
- Today's completed payments summary
- Recent transactions list

**Pending Payments Features:**
- List all pending sales from pharmacists
- View sale details (items, quantities, prices)
- Accept payment button
- Payment type selection (cash, card, mobile)
- Reference number input (for card/mobile)
- Change sale status to completed
- Generate receipt

**Payment Receipt Features:**
- Display sale ID & receipt number
- Date & time
- Items list with prices
- Total amount
- Payment type & reference
- Print receipt button

**Process Returns Features:**
- Search for completed sale by ID
- View sale items
- Select medicine to return
- Enter quantity to return (max: quantity sold)
- Return reason (dropdown/textarea)
- Return condition (good/damaged)
- Submit return (updates stock automatically)

**Payment Reports Features:**
- Filter by date range, payment type
- Payment transactions list
- Summary: total amount, count, breakdown by type

**Return Reports Features:**
- Filter by date range
- Returns list (date, medicine, quantity, reason, value)
- Summary: total quantity, total value, reasons breakdown

---

## 🔄 User Flows

### Flow 1: Manager Creates Staff Account
```
1. Manager logs in → Redirected to Manager Dashboard
2. Navigate to "Staff Management" page
3. Click "Create Staff" button
4. Fill form:
   - Full name
   - Email
   - Role (Pharmacist or Cashier)
5. Submit form
6. System generates 6-digit verification code
7. Display code to manager (copy button)
8. Manager shares email + code with new staff member
9. Staff member receives email with code
10. Staff member can now log in with email + temporary password from email
11. On first login: forced to change password
```

### Flow 2: Staff Member First Login
```
1. Staff receives email + verification code from manager
2. Go to login page
3. Enter email + password from email
4. After login: redirected to "Change Password" page (forced)
5. Enter current password + new password
6. Submit password change
7. Redirected to role-specific dashboard
```

### Flow 3: Pharmacist Creates Sale (POS Flow)
```
1. Pharmacist logs in → Pharmacist Dashboard
2. Navigate to "Create Sale" (POS)
3. Search medicine by:
   - Name search
   - Barcode scan
   - Category browse
4. Select medicine → Add to cart
5. Adjust quantity if needed
6. Repeat for more medicines
7. Review cart:
   - Items list
   - Quantities
   - Subtotals
   - Total amount
8. Select payment type (cash/card/mobile)
9. Click "Submit Sale"
10. Sale created with status: "pending_payment"
11. Display sale ID + success message
12. Pharmacist informs cashier of sale ID
```

### Flow 4: Cashier Accepts Payment
```
1. Cashier logs in → Cashier Dashboard
2. Navigate to "Pending Payments"
3. View list of pending sales
4. Click "View Details" on a sale
5. Review modal/page:
   - Sale ID
   - Pharmacist name
   - Items list (name, quantity, price)
   - Total amount
6. Click "Accept Payment"
7. Payment form:
   - Payment type (cash/card/mobile)
   - Reference number (if card/mobile)
8. Submit payment
9. Sale status changes to "completed"
10. Receipt generated automatically
11. Display/print receipt
12. Customer receives receipt
```

### Flow 5: Cashier Processes Return
```
1. Cashier logs in → Cashier Dashboard
2. Navigate to "Process Returns"
3. Search for sale:
   - Enter sale ID manually, OR
   - Search from list of completed sales
4. Select sale
5. View sale items list
6. Select medicine to return
7. Enter quantity to return (validation: max = quantity sold)
8. Select return reason from dropdown:
   - Wrong medicine
   - Damaged
   - Expired
   - Customer changed mind
   - Other
9. Select return condition:
   - Good (can restock)
   - Damaged (cannot restock)
10. Click "Process Return"
11. System:
    - Creates return record
    - Updates medicine stock (adds quantity back if condition = good)
    - Generates return confirmation
12. Display return confirmation
13. Option to print return receipt
```

### Flow 6: Pharmacist Requests Restock
```
1. Pharmacist notices low stock while browsing medicines
2. Navigate to "Request Restock"
3. Select medicine from dropdown (filtered by branch)
4. Enter requested quantity
5. Add optional notes
6. Click "Submit Request"
7. System creates notification for manager
8. Display success message
9. Manager receives notification in dashboard
10. Manager reviews request in "Notifications" page
11. Manager updates stock in "Medicine Inventory"
```

### Flow 7: Admin Activates New Manager
```
1. New manager registers via register page:
   - Full name
   - Email
   - Password
   - Role: Manager
   - Branch selection
2. Manager receives verification email
3. Manager verifies email with code
4. Manager account created but inactive (is_active = false)
5. Admin logs in → Admin Dashboard
6. Navigate to "Manager Management"
7. Click "Pending Managers" tab
8. View list of pending managers
9. Find new manager in list
10. Click "Activate" button
11. Manager account activated (is_active = true)
12. Manager can now log in and access full dashboard
```

### Flow 8: User Forgot Password
```
1. User goes to login page
2. Click "Forgot Password" link
3. Enter email address
4. Submit
5. System sends temporary password to email
6. User checks email
7. User returns to login page
8. Enter email + temporary password
9. Login successful
10. Forced to change password immediately
11. Enter new password
12. Submit password change
13. Redirected to dashboard
```

---

## 🎨 UI/UX Design Guidelines

### Color Scheme (Tailwind CSS)
```javascript
// Primary: Blue (healthcare trust)
primary: 'bg-blue-600 text-white hover:bg-blue-700'

// Success: Green
success: 'bg-green-600 text-white hover:bg-green-700'

// Warning: Yellow (low stock alerts)
warning: 'bg-yellow-500 text-black hover:bg-yellow-600'

// Danger: Red (expired, delete actions)
danger: 'bg-red-600 text-white hover:bg-red-700'

// Info: Cyan
info: 'bg-cyan-600 text-white hover:bg-cyan-700'

// Neutral: Gray
neutral: 'bg-gray-100 text-gray-800'
```

### Layout Components

#### Sidebar Navigation (Role-Based)
```javascript
// Admin Sidebar
- Dashboard
- Manager Management
- Logout

// Manager Sidebar
- Dashboard
- Staff Management
- Medicine Inventory
- Reports
  - Sales Reports
  - Inventory Reports
  - Notifications
- Profile
- Logout

// Pharmacist Sidebar
- Dashboard
- Medicines
- Create Sale (POS)
- Manage Stock
- Request Restock
- Reports
  - Low Stock
  - Expiry
  - Inventory Summary
- Profile
- Logout

// Cashier Sidebar
- Dashboard
- Pending Payments
- Process Returns
- Reports
  - Payment Reports
  - Return Reports
- Profile
- Logout
```

#### Top Navbar
```javascript
- Logo (PharmaCare)
- Branch name (for branch-specific roles)
- User menu dropdown:
  - Profile
  - Change Password
  - Logout
- Notifications icon (for Manager)
```

### Common Components

#### StatCard Component
```typescript
interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  variant: 'default' | 'success' | 'warning' | 'danger'
  subtitle?: string
}
```

#### DataTable Component
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchable?: boolean
  filterable?: boolean
  pagination?: boolean
  actions?: (row: T) => React.ReactNode
}
```

#### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

---

## 📊 Data Models (TypeScript Types)

```typescript
// User Types
interface User {
  user_id: number
  full_name: string
  email: string
  role_id: number
  role_name: string
  branch_id: number | null
  branch_name?: string
  is_active: boolean
  is_email_verified: boolean
  require_password_change: boolean
  created_at: string
  updated_at: string
}

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  token: string
  user: User
  message: string
}

interface RegisterRequest {
  full_name: string
  email: string
  password: string
  role_id: number
  branch_id?: number
}

// Medicine Types
interface Medicine {
  medicine_id: number
  name: string
  category_id: number
  category_name: string
  type: string | null
  quantity_in_stock: number
  price: number
  expiry_date: string | null
  barcode: string | null
  manufacturer: string | null
  branch_id: number
  created_at: string
  updated_at: string
}

interface MedicineFormData {
  name: string
  category_id: number
  type?: string
  quantity_in_stock: number
  price: number
  expiry_date?: string
  barcode?: string
  manufacturer?: string
}

// Sale Types
interface Sale {
  sale_id: number
  branch_id: number
  user_id: number
  total_amount: number
  status: 'pending_payment' | 'completed' | 'cancelled'
  sale_date: string
  pharmacist_name?: string
  cashier_name?: string
  payment_type?: string
  payment_amount?: number
  reference_number?: string
}

interface SaleItem {
  sale_item_id: number
  sale_id: number
  medicine_id: number
  medicine_name: string
  barcode?: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface CreateSaleRequest {
  items: {
    medicine_id: number
    quantity: number
  }[]
  payment_type: 'cash' | 'card' | 'mobile'
  customer_name?: string
  customer_phone?: string
}

interface AcceptPaymentRequest {
  payment_type: 'cash' | 'card' | 'mobile'
  reference_number?: string
}

// Return Types
interface Return {
  return_id: number
  sale_id: number
  medicine_id: number
  medicine_name: string
  barcode?: string
  quantity_returned: number
  return_reason: string
  return_condition: 'good' | 'damaged'
  status: 'pending' | 'completed'
  return_date: string
  return_value?: number
}

interface ProcessReturnRequest {
  sale_id: number
  medicine_id: number
  quantity_returned: number
  return_reason: string
  return_condition: 'good' | 'damaged'
}

// Staff Types
interface StaffMember {
  user_id: number
  full_name: string
  email: string
  role_id: number
  role_name: string
  is_active: boolean
  created_at: string
}

interface CreateStaffRequest {
  full_name: string
  email: string
  role_id: number
}

interface CreateStaffResponse {
  success: boolean
  user: StaffMember
  verification_code: string
  temporary_password: string
  message: string
}

// Dashboard Types
interface AdminDashboardSummary {
  totalBranches: number
  totalUsers: number
  totalSales: number
  pendingManagers: number
  activatedManagers: number
}

interface ManagerDashboardSummary {
  branchOverview: {
    branchId: number
    branchName: string
    location: string | null
    email: string | null
    phone: string | null
    totalManagers: number
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
  }
  inventorySummary: {
    totalMedicines: number
    totalQuantity: number
    lowStockCount: number
    expiringSoonCount: number
    expiredCount: number
    lowStockMedicines: Medicine[]
    expiredMedicines: Medicine[]
  }
  salesSummary: {
    today: { count: number; revenue: number }
    thisWeek: { count: number; revenue: number }
    thisMonth: { count: number; revenue: number }
    pendingSales: number
    pendingReturns: number
    topSellingMedicines: {
      medicine_id: number
      name: string
      total_sold: number
      total_revenue: number
    }[]
  }
}

// Notification Types
interface Notification {
  notification_id: number | null
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'low_stock' | 'restock_request'
  is_read: boolean
  created_at: string
}

// Branch Types
interface Branch {
  branch_id: number
  branch_name: string
  location: string | null
  email: string | null
  phone: string | null
  total_employees?: number
}

// Category Types
interface Category {
  category_id: number
  category_name: string
  description: string | null
}

// API Response Types
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

---

## 🔌 API Integration Examples

### Axios Configuration
```typescript
// src/api/axios.config.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:10000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### Auth API Service
```typescript
// src/api/auth.api.ts
import api from './axios.config'

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post<ApiResponse>('/auth/register', data)
    return response.data
  },

  verifyEmail: async (email: string, verification_code: string) => {
    const response = await api.post<ApiResponse>('/auth/verify-email', {
      email,
      verification_code,
    })
    return response.data
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', {
      email,
    })
    return response.data
  },

  changePassword: async (current_password: string, new_password: string) => {
    const response = await api.post<ApiResponse>('/auth/change-password', {
      current_password,
      new_password,
    })
    return response.data
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout')
    return response.data
  },
}
```

### Manager API Service
```typescript
// src/api/manager.api.ts
import api from './axios.config'

export const managerApi = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get<ApiResponse<ManagerDashboardSummary>>('/manager/dashboard')
    return response.data
  },

  // Staff Management
  getStaff: async () => {
    const response = await api.get<ApiResponse<StaffMember[]>>('/manager/staff')
    return response.data
  },

  createStaff: async (data: CreateStaffRequest) => {
    const response = await api.post<CreateStaffResponse>('/manager/staff', data)
    return response.data
  },

  verifyStaff: async (email: string, verification_code: string) => {
    const response = await api.post<ApiResponse>('/manager/staff/verify', {
      email,
      verification_code,
    })
    return response.data
  },

  updateStaff: async (user_id: number, data: Partial<StaffMember>) => {
    const response = await api.put<ApiResponse>(`/manager/staff/${user_id}`, data)
    return response.data
  },

  removeStaff: async (user_id: number) => {
    const response = await api.delete<ApiResponse>(`/manager/staff/${user_id}`)
    return response.data
  },

  resetStaffPassword: async (user_id: number) => {
    const response = await api.post<ApiResponse>(`/manager/staff/${user_id}/reset-password`)
    return response.data
  },

  // Medicine Management
  getMedicines: async () => {
    const response = await api.get<ApiResponse<Medicine[]>>('/manager/medicines')
    return response.data
  },

  addMedicine: async (data: MedicineFormData) => {
    const response = await api.post<ApiResponse<Medicine>>('/manager/medicines', data)
    return response.data
  },

  updateMedicineStock: async (medicine_id: number, data: { quantity_in_stock?: number; price?: number }) => {
    const response = await api.put<ApiResponse>(`/manager/medicines/${medicine_id}/stock`, data)
    return response.data
  },

  removeMedicine: async (medicine_id: number) => {
    const response = await api.delete<ApiResponse>(`/manager/medicines/${medicine_id}`)
    return response.data
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get<ApiResponse<Notification[]>>('/manager/dashboard/notifications')
    return response.data
  },
}
```

### Pharmacist API Service
```typescript
// src/api/pharmacist.api.ts
import api from './axios.config'

export const pharmacistApi = {
  // Medicines
  getMedicines: async () => {
    const response = await api.get<ApiResponse<Medicine[]>>('/pharmacist/medicines')
    return response.data
  },

  searchMedicines: async (query: string) => {
    const response = await api.get<ApiResponse<Medicine[]>>(`/pharmacist/medicines/search?q=${query}`)
    return response.data
  },

  getMedicineById: async (medicine_id: number) => {
    const response = await api.get<ApiResponse<Medicine>>(`/pharmacist/medicines/${medicine_id}`)
    return response.data
  },

  // Sales
  createSale: async (data: CreateSaleRequest) => {
    const response = await api.post<ApiResponse<{ sale: Sale; items: SaleItem[] }>>('/pharmacist/sales', data)
    return response.data
  },

  getSaleById: async (sale_id: number) => {
    const response = await api.get<ApiResponse<{ sale: Sale; items: SaleItem[] }>>(`/pharmacist/sales/${sale_id}`)
    return response.data
  },

  // Stock Management
  addMedicine: async (data: MedicineFormData) => {
    const response = await api.post<ApiResponse<Medicine>>('/pharmacist/medicines', data)
    return response.data
  },

  updateMedicineStock: async (medicine_id: number, data: any) => {
    const response = await api.put<ApiResponse>(`/pharmacist/medicines/${medicine_id}/stock`, data)
    return response.data
  },

  removeMedicine: async (medicine_id: number) => {
    const response = await api.delete<ApiResponse>(`/pharmacist/medicines/${medicine_id}`)
    return response.data
  },

  // Restock
  requestRestock: async (medicine_id: number, requested_quantity: number, notes?: string) => {
    const response = await api.post<ApiResponse>('/pharmacist/inventory/request-restock', {
      medicine_id,
      requested_quantity,
      notes,
    })
    return response.data
  },

  // Reports
  getLowStockReport: async (threshold?: number) => {
    const response = await api.get<ApiResponse<Medicine[]>>(`/pharmacist/reports/low-stock?threshold=${threshold || 10}`)
    return response.data
  },

  getExpiryReport: async (days?: number) => {
    const response = await api.get<ApiResponse<Medicine[]>>(`/pharmacist/reports/expiry?days=${days || 30}`)
    return response.data
  },

  getInventorySummary: async () => {
    const response = await api.get<ApiResponse>('/pharmacist/reports/inventory-summary')
    return response.data
  },
}
```

### Cashier API Service
```typescript
// src/api/cashier.api.ts
import api from './axios.config'

export const cashierApi = {
  // Payments
  getPendingPayments: async () => {
    const response = await api.get<ApiResponse<Sale[]>>('/cashier/payments/pending')
    return response.data
  },

  getPaymentRequestDetails: async (sale_id: number) => {
    const response = await api.get<ApiResponse<{ sale: Sale; items: SaleItem[] }>>(`/cashier/payments/${sale_id}`)
    return response.data
  },

  acceptPayment: async (sale_id: number, data: AcceptPaymentRequest) => {
    const response = await api.post<ApiResponse>(`/cashier/payments/${sale_id}/accept`, data)
    return response.data
  },

  getReceipt: async (sale_id: number) => {
    const response = await api.get<ApiResponse<{ sale: Sale; items: SaleItem[] }>>(`/cashier/receipts/${sale_id}`)
    return response.data
  },

  // Returns
  getSalesForReturn: async (sale_id?: number) => {
    const url = sale_id ? `/cashier/returns/sales?sale_id=${sale_id}` : '/cashier/returns/sales'
    const response = await api.get<ApiResponse<Sale[]>>(url)
    return response.data
  },

  getSaleItemsForReturn: async (sale_id: number) => {
    const response = await api.get<ApiResponse<SaleItem[]>>(`/cashier/returns/sales/${sale_id}/items`)
    return response.data
  },

  processReturn: async (data: ProcessReturnRequest) => {
    const response = await api.post<ApiResponse<Return>>('/cashier/returns', data)
    return response.data
  },

  // Reports
  getPaymentReports: async (start_date?: string, end_date?: string, payment_type?: string) => {
    const params = new URLSearchParams()
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)
    if (payment_type) params.append('payment_type', payment_type)
    
    const response = await api.get<ApiResponse>(`/cashier/reports/payments?${params.toString()}`)
    return response.data
  },

  getReturnReports: async (start_date?: string, end_date?: string) => {
    const params = new URLSearchParams()
    if (start_date) params.append('start_date', start_date)
    if (end_date) params.append('end_date', end_date)
    
    const response = await api.get<ApiResponse<{ returns: Return[]; summary: any }>>(`/cashier/reports/returns?${params.toString()}`)
    return response.data
  },
}
```

---

