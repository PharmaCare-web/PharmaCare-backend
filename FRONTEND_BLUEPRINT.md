# PharmaCare Frontend Blueprint

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Authentication & Authorization](#authentication--authorization)
4. [Page Structure by Role](#page-structure-by-role)
5. [User Flows](#user-flows)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Component Architecture](#component-architecture)
8. [State Management](#state-management)

---

## Project Overview

**PharmaCare** is a pharmacy management system with role-based access control (RBAC) for four user roles:
- **Admin** - System-level management
- **Manager** - Branch-level management
- **Pharmacist** - Medicine inventory and sales
- **Cashier** - Payment processing and returns

**Backend API Base URL:**
- Production: `https://your-backend.onrender.com`
- Development: `http://localhost:10000`

---

## Technology Stack

### Recommended Frontend Stack
- **Framework:** React.js (with Vite) or Next.js
- **Styling:** Tailwind CSS or Material-UI
- **HTTP Client:** Axios
- **Routing:** React Router DOM
- **State Management:** Context API or Redux Toolkit
- **Form Handling:** React Hook Form
- **Date Handling:** date-fns or Day.js
- **Charts:** Chart.js or Recharts
- **Notifications:** React Toastify
- **Icons:** React Icons or Heroicons

### Project Setup
```bash
# Create React app with Vite
npm create vite@latest pharmacare-frontend -- --template react

# Install dependencies
npm install axios react-router-dom react-hook-form
npm install tailwindcss postcss autoprefixer
npm install react-toastify chart.js react-chartjs-2
npm install date-fns react-icons
```

---

## Authentication & Authorization

### JWT Token Management
```javascript
// Store token after login
localStorage.setItem('token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.user));

// Add token to all API requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Remove token on logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### Protected Routes
```javascript
// PrivateRoute component
const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### Role-Based Access
- **Admin:** role_id = 1, role_name = "Admin"
- **Manager:** role_id = 2, role_name = "Manager"
- **Pharmacist:** role_id = 3, role_name = "Pharmacist"
- **Cashier:** role_id = 4, role_name = "Cashier"

---

## Page Structure by Role

### 🔐 PUBLIC PAGES (No Authentication Required)

#### 1. Login Page
**Route:** `/login`

**Features:**
- Email input field
- Password input field
- "Remember Me" checkbox
- Login button
- "Forgot Password" link
- Redirect to role-specific dashboard after login

**API Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "user_id": 1,
    "full_name": "John Doe",
    "email": "user@example.com",
    "role_id": 2,
    "role_name": "Manager",
    "branch_id": 1,
    "branch_name": "PharmaCare - Addis Ababa"
  }
}
```

---

#### 2. Register Page
**Route:** `/register`

**Features:**
- Full name input
- Email input
- Password input (min 6 characters)
- Role selection dropdown (Manager, Pharmacist, Cashier only)
- Branch selection dropdown (shown only for pharmacy roles)
- Register button
- "Already have an account? Login" link
- Redirect to email verification page after registration

**API Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role_id": 2,
  "branch_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "user_id": 5
}
```

---

#### 3. Email Verification Page
**Route:** `/verify-email`

**Features:**
- Email input (pre-filled if coming from registration)
- 6-digit verification code input
- Verify button
- "Resend Code" button
- Success message and redirect to login

**API Endpoints:**

**Verify Email:** `POST /api/auth/verify-email`
```json
{
  "email": "john@example.com",
  "verification_code": "123456"
}
```

**Resend Verification Code:** `POST /api/auth/resend-verification`
```json
{
  "email": "john@example.com"
}
```

---

#### 4. Forgot Password Page
**Route:** `/forgot-password`

**Features:**
- Email input
- Submit button
- Success message (temporary password sent to email)
- "Back to Login" link

**API Endpoint:** `POST /api/auth/forgot-password`
```json
{
  "email": "john@example.com"
}
```

---

### 👤 SHARED AUTHENTICATED PAGES (All Roles)

#### 5. Change Password Page
**Route:** `/change-password`

**Features:**
- Current password input
- New password input (min 6 characters)
- Confirm new password input
- Submit button
- **Required on first login** for staff created by manager

**API Endpoint:** `POST /api/auth/change-password`
```json
{
  "current_password": "TempPass123",
  "new_password": "NewSecurePass456"
}
```

---

#### 6. Profile Page
**Route:** `/profile`

**Features:**
- Display user information:
  - Full name
  - Email
  - Role
  - Branch (if applicable)
  - Account status
- "Change Password" button
- Logout button

**API Endpoint:** `GET /api/auth/me`

**Response:**
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role_name": "Manager",
    "branch_name": "PharmaCare - Addis Ababa",
    "is_active": true
  }
}
```

---

## 🛡️ ADMIN PAGES

### 7. Admin Dashboard Home
**Route:** `/admin/dashboard`

**Features:**
- **Summary Cards:**
  - Total Branches
  - Total Users (excluding admin)
  - Total Completed Sales
  - Pending Managers
  - Activated Managers
- **Branch List Table:**
  - Branch name
  - Location
  - Total employees
  - View details link

**API Endpoint:** `GET /api/admin/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBranches": 2,
      "totalUsers": 15,
      "totalSales": 250,
      "pendingManagers": 2,
      "activatedManagers": 3
    }
  }
}
```

**Branch List:** `GET /api/admin/dashboard/branches-list`

---

### 8. Manager Management Page
**Route:** `/admin/managers`

**Features:**
- **Tabs:**
  - All Managers
  - Pending Managers (awaiting activation)
  - Activated Managers
- **Manager Table:**
  - Full name
  - Email
  - Branch name
  - Status (Active/Inactive)
  - Actions: Activate/Deactivate buttons
- **Filter by Branch** dropdown

**API Endpoints:**

**Get All Managers:** `GET /api/admin/managers`

**Get Pending Managers:** `GET /api/admin/managers/pending`

**Get Activated Managers:** `GET /api/admin/managers/activated`

**Get Managers by Branch:** `GET /api/admin/managers/branch/:branch_id`

**Activate Manager:** `PUT /api/admin/managers/:user_id/activate`

**Deactivate Manager:** `PUT /api/admin/managers/:user_id/deactivate`

---

## 📊 MANAGER PAGES

### 9. Manager Dashboard Home
**Route:** `/manager/dashboard`

**Features:**
- **Branch Overview Cards:**
  - Branch name & location
  - Total managers
  - Total employees (active/inactive)
- **Inventory Summary Cards:**
  - Total medicines
  - Total quantity in stock
  - Low stock count
  - Expiring soon count
  - Expired count
- **Sales Summary Cards:**
  - Today's sales (count & revenue)
  - This week's sales
  - This month's sales
  - Pending sales
  - Pending returns
- **Top Selling Medicines** table (top 5)
- **Low Stock Alerts** list (10 items)
- **Expired/Expiring Medicines** list (10 items)
- **Recent Notifications** panel

**API Endpoint:** `GET /api/manager/dashboard`

**Response includes:**
```json
{
  "success": true,
  "data": {
    "branchOverview": {
      "branchName": "PharmaCare - Addis Ababa",
      "location": "Bole, Addis Ababa",
      "totalManagers": 2,
      "totalEmployees": 8,
      "activeEmployees": 7,
      "inactiveEmployees": 1
    },
    "inventorySummary": {
      "totalMedicines": 150,
      "totalQuantity": 5000,
      "lowStockCount": 12,
      "expiringSoonCount": 5,
      "expiredCount": 2
    },
    "salesSummary": {
      "today": { "count": 25, "revenue": 15000 },
      "thisWeek": { "count": 120, "revenue": 75000 }
    }
  }
}
```

---

### 10. Staff Management Page
**Route:** `/manager/staff`

**Features:**

**A. Create New Staff Section:**
- Form fields:
  - Full name
  - Email
  - Role dropdown (Pharmacist or Cashier only)
- Create Staff button
- **Success modal showing:**
  - Generated verification code
  - Instructions for staff to verify

**B. Staff List Table:**
- Columns: Name, Email, Role, Status (Active/Inactive)
- Actions per row:
  - Edit button
  - Delete button
  - Reset Password button
- Search/filter by name or role

**C. Verify Staff Account:**
- Email input
- Verification code input
- Verify button

**API Endpoints:**

**Create Staff:** `POST /api/manager/staff`
```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "role_id": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff member created successfully",
  "verification_code": "ABC123",
  "user": {
    "user_id": 10,
    "full_name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

**Verify Staff:** `POST /api/manager/staff/verify`
```json
{
  "email": "jane@example.com",
  "verification_code": "ABC123"
}
```

**Get All Staff:** `GET /api/manager/staff`

**Update Staff:** `PUT /api/manager/staff/:user_id`
```json
{
  "full_name": "Jane Doe",
  "email": "jane.doe@example.com"
}
```

**Remove Staff:** `DELETE /api/manager/staff/:user_id`

**Reset Staff Password:** `POST /api/manager/staff/:user_id/reset-password`


---

### 11. Medicine Inventory Page
**Route:** `/manager/medicines`

**Features:**
- **Add Medicine Button** (opens modal/form)
- **Medicine List Table:**
  - Name
  - Category
  - Quantity in stock
  - Price
  - Expiry date
  - Barcode
  - Manufacturer
  - Actions: Edit, Delete
- Search bar (by name or barcode)
- Filter by category
- Sort by name, quantity, expiry date

**Add/Edit Medicine Form:**
- Name
- Category dropdown
- Type (Tablet, Syrup, Injection, etc.)
- Quantity in stock
- Price
- Expiry date
- Barcode
- Manufacturer

**API Endpoints:**

**Get All Medicines:** `GET /api/manager/medicines`

**Get Medicine by ID:** `GET /api/manager/medicines/:medicine_id`

**Add Medicine:** `POST /api/manager/medicines`
```json
{
  "name": "Paracetamol",
  "category_id": 1,
  "type": "Tablet",
  "quantity_in_stock": 100,
  "price": 50.00,
  "expiry_date": "2025-12-31",
  "barcode": "123456789",
  "manufacturer": "PharmaCo"
}
```

**Update Medicine Stock:** `PUT /api/manager/medicines/:medicine_id/stock`
```json
{
  "quantity_in_stock": 150,
  "price": 55.00
}
```

**Delete Medicine:** `DELETE /api/manager/medicines/:medicine_id`

---

### 12. Sales Reports Page
**Route:** `/manager/reports/sales`

**Features:**
- **Date Range Filter:**
  - Today
  - This Week
  - This Month
  - This Year
  - Custom date range
- **Summary Cards:**
  - Total sales count
  - Total revenue
  - Average sale amount
- **Sales Chart** (line/bar chart showing daily/weekly/monthly sales)
- **Top Selling Medicines** table
- **Pending sales** count
- **Pending returns** count

**API Endpoint:** `GET /api/manager/dashboard/sales?year=2026`

**Response:**
```json
{
  "success": true,
  "data": {
    "today": { "count": 25, "revenue": 15000 },
    "thisWeek": { "count": 120, "revenue": 75000 },
    "thisMonth": { "count": 450, "revenue": 280000 },
    "thisYear": { "count": 5000, "revenue": 3200000 },
    "topSellingMedicines": [
      {
        "medicine_id": 1,
        "name": "Paracetamol",
        "total_sold": 500,
        "total_revenue": 25000
      }
    ]
  }
}
```

---

### 13. Inventory Reports Page
**Route:** `/manager/reports/inventory`

**Features:**
- **Tabs:**
  - Inventory Summary
  - Low Stock Report
  - Expiry Report

**A. Inventory Summary Tab:**
- Total medicines count
- Total quantity in stock
- Total inventory value
- Breakdown by category (chart)

**B. Low Stock Report Tab:**
- Table of medicines with low stock (quantity < 10 or custom threshold)
- Columns: Name, Current Stock, Category, Price

**C. Expiry Report Tab:**
- Table of medicines expiring soon (within 30 days or custom)
- Columns: Name, Expiry Date, Days Until Expiry, Quantity, Category

**API Endpoint:** `GET /api/manager/dashboard/inventory`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMedicines": 150,
      "totalQuantity": 5000,
      "lowStockCount": 12,
      "expiringSoonCount": 5,
      "expiredCount": 2
    },
    "lowStockMedicines": [
      {
        "medicine_id": 5,
        "name": "Amoxicillin",
        "quantity_in_stock": 8
      }
    ],
    "expiredMedicines": [
      {
        "medicine_id": 10,
        "name": "Aspirin",
        "expiry_date": "2026-08-15",
        "quantity_in_stock": 25
      }
    ]
  }
}
```

---

### 14. Notifications Page
**Route:** `/manager/notifications`

**Features:**
- **Notification List:**
  - Title
  - Message
  - Type (Low Stock, Restock Request, Return, etc.)
  - Date/Time
  - Read/Unread status
- **Filter by type** dropdown
- **Mark as Read** button
- **Badge showing unread count** in sidebar

**API Endpoint:** `GET /api/manager/dashboard/notifications`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Low Stock Alert",
      "message": "Paracetamol stock is low (5 remaining)",
      "type": "warning",
      "isRead": false,
      "createdAt": "2026-07-09T10:30:00Z"
    },
    {
      "id": 2,
      "title": "Restock Request",
      "message": "Pharmacist John requested 50 units of Amoxicillin",
      "type": "info",
      "isRead": false,
      "createdAt": "2026-07-09T09:15:00Z"
    }
  ]
}
```

---

## 💊 PHARMACIST PAGES

### 15. Pharmacist Dashboard Home
**Route:** `/pharmacist/dashboard`

**Features:**
- **Quick Access Cards:**
  - View All Medicines
  - Create New Sale
  - Manage Stock
  - View Reports
- **Low Stock Alerts** (top 5)
- **Expiring Soon Medicines** (top 5)
- **Recent Sales** list

---

### 16. Medicine Search & View Page
**Route:** `/pharmacist/medicines`

**Features:**
- **Search Bar:**
  - Search by name, barcode, or category
  - Real-time search results
- **Filter Dropdown:** By category
- **Medicine List/Grid:**
  - Medicine name
  - Category
  - Quantity in stock
  - Price
  - Expiry date
  - View Details button

**API Endpoints:**

**Get All Medicines:** `GET /api/pharmacist/medicines`

**Search Medicines:** `GET /api/pharmacist/medicines/search?query=paracetamol`

**Get by Category:** `GET /api/pharmacist/medicines/category/:category_id`

**Get Medicine Details:** `GET /api/pharmacist/medicines/:medicine_id`

---

### 17. Create Sale Page (POS - Point of Sale)
**Route:** `/pharmacist/sales/new`

**Features:**
- **Search/Scan Medicine:**
  - Search bar with autocomplete
  - Barcode scanner support (if available)
- **Shopping Cart:**
  - List of selected medicines
  - Quantity input per item (with +/- buttons)
  - Unit price display
  - Subtotal per item
  - Remove item button
- **Cart Summary:**
  - Total items count
  - Total amount (large, prominent)
- **Payment Type Dropdown:**
  - Cash
  - Card
  - Mobile Money
- **Customer Info (Optional):**
  - Customer name
  - Phone number
- **Submit Sale Button** (creates sale with status: pending_payment)
- **Success Modal:**
  - Sale ID
  - Total amount
  - "Sale created successfully. Please send to cashier for payment."

**API Endpoint:** `POST /api/pharmacist/sales`

**Request Body:**
```json
{
  "items": [
    {
      "medicine_id": 1,
      "quantity": 2
    },
    {
      "medicine_id": 5,
      "quantity": 1
    }
  ],
  "payment_type": "cash",
  "customer_name": "Ahmed Ali",
  "customer_phone": "+251912345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sale created successfully. Payment pending cashier approval.",
  "data": {
    "sale": {
      "sale_id": 123,
      "sale_date": "2026-07-09T14:30:00Z",
      "total_amount": 350.00,
      "status": "pending_payment"
    },
    "items": [
      {
        "medicine_name": "Paracetamol",
        "quantity": 2,
        "unit_price": 50.00,
        "subtotal": 100.00
      }
    ]
  }
}
```

---

### 18. View Sale Details/Receipt Page
**Route:** `/pharmacist/sales/:sale_id`

**Features:**
- **Receipt Header:**
  - Branch name & location
  - Receipt number
  - Sale ID
  - Sale date & time
- **Items Table:**
  - Medicine name
  - Quantity
  - Unit price
  - Subtotal
- **Total Amount** (prominent)
- **Payment Status** badge (Pending/Completed)
- **Pharmacist Name**
- **Print Receipt** button

**API Endpoint:** `GET /api/pharmacist/sales/:sale_id`

---

### 19. Manage Medicine Stock Page
**Route:** `/pharmacist/medicines/manage`

**Features:**

**A. Add New Medicine:**
- Form with fields:
  - Name
  - Category dropdown
  - Type
  - Quantity
  - Price
  - Expiry date
  - Barcode
  - Manufacturer
- Submit button

**B. Update Stock:**
- Search medicine
- Display current stock
- Action buttons:
  - Add Stock (+ quantity)
  - Remove Stock (- quantity)
  - Set Absolute Quantity
- Quantity input
- Submit button

**C. Remove Medicine:**
- Search and select medicine
- Confirmation modal
- Delete button

**API Endpoints:**

**Add Medicine:** `POST /api/pharmacist/medicines`
```json
{
  "name": "Ibuprofen",
  "category_id": 1,
  "type": "Tablet",
  "quantity_in_stock": 100,
  "price": 75.00,
  "expiry_date": "2027-06-30",
  "barcode": "987654321",
  "manufacturer": "MediCorp"
}
```

**Update Stock:** `PUT /api/pharmacist/medicines/:medicine_id/stock`
```json
{
  "action": "add",
  "quantity_change": 50
}
```
or
```json
{
  "quantity_in_stock": 150
}
```

**Remove Medicine:** `DELETE /api/pharmacist/medicines/:medicine_id`

---

### 20. Request Restock Page
**Route:** `/pharmacist/restock`

**Features:**
- **Medicine Selection:**
  - Dropdown or search (shows medicines with current stock)
  - Display current quantity in stock
- **Requested Quantity** input
- **Notes** textarea (optional)
- **Submit Request** button
- **Success Message:** "Restock request sent to manager"

**API Endpoint:** `POST /api/pharmacist/inventory/request-restock`

**Request Body:**
```json
{
  "medicine_id": 5,
  "requested_quantity": 100,
  "notes": "Running low, high demand medicine"
}
```

---

### 21. Pharmacist Reports Page
**Route:** `/pharmacist/reports`

**Features:**

**Tabs:**
- Low Stock Report
- Expiry Report
- Inventory Summary

**A. Low Stock Report:**
- Threshold slider (default: 10)
- Table showing medicines below threshold
- Columns: Name, Current Stock, Price, Category
- "Request Restock" button per item

**B. Expiry Report:**
- Days ahead slider (default: 30)
- Table of medicines expiring soon
- Columns: Name, Expiry Date, Days Until Expiry, Quantity
- Highlight expired items in red

**C. Inventory Summary:**
- Total medicines count
- Total quantity in stock
- Total inventory value
- Breakdown by category (pie chart)

**API Endpoints:**

**Low Stock Report:** `GET /api/pharmacist/reports/low-stock?threshold=10`

**Expiry Report:** `GET /api/pharmacist/reports/expiry?days=30`

**Inventory Summary:** `GET /api/pharmacist/reports/inventory-summary`

---

## 💰 CASHIER PAGES

### 22. Cashier Dashboard Home
**Route:** `/cashier/dashboard`

**Features:**
- **Pending Payments Count Card** (large, prominent)
- **Today's Summary Cards:**
  - Completed payments count
  - Total revenue collected
  - Returns processed
- **Recent Transactions** list (last 10)
- **Quick Action Buttons:**
  - View Pending Payments
  - Process Returns

---

### 23. Pending Payments Page
**Route:** `/cashier/payments/pending`

**Features:**
- **Pending Sales Table:**
  - Sale ID
  - Date
  - Pharmacist Name
  - Total Amount
  - Item Count
  - Actions: "View Details" button
- **Refresh button**
- **Auto-refresh** (every 30 seconds)

**View Details Modal:**
- Sale summary (ID, date, total)
- Items list with quantities and prices
- **Accept Payment Form:**
  - Payment Type dropdown (Cash, Card, Mobile Money)
  - Reference Number input (for card/mobile)
  - "Accept Payment" button
- **Cancel** button

**API Endpoints:**

**Get Pending Payments:** `GET /api/cashier/payments/pending`

**Get Payment Details:** `GET /api/cashier/payments/:sale_id`

**Accept Payment:** `POST /api/cashier/payments/:sale_id/accept`

**Request Body:**
```json
{
  "payment_type": "card",
  "reference_number": "REF123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment accepted successfully",
  "data": {
    "sale": {
      "sale_id": 123,
      "sale_date": "2026-07-09T14:30:00Z",
      "total_amount": 350.00,
      "status": "completed",
      "payment_type": "card"
    },
    "receipt_number": "REC-000123"
  }
}
```

---

### 24. Payment Confirmation/Receipt Page
**Route:** `/cashier/receipts/:sale_id`

**Features:**
- **Receipt Header:**
  - Branch info
  - Receipt number
  - Sale ID
  - Date & time
- **Items List:**
  - Medicine name
  - Quantity × Unit Price
  - Subtotal
- **Total Amount** (large font)
- **Payment Info:**
  - Payment type
  - Reference number (if applicable)
  - Payment date
- **Cashier Name**
- **Print Receipt** button
- **Generate PDF** button
- **Email Receipt** button (optional)

**API Endpoint:** `GET /api/cashier/receipts/:sale_id`

---

### 25. Process Returns Page
**Route:** `/cashier/returns`

**Features:**

**Step 1: Find Sale**
- Search by Sale ID input
- OR: Recent completed sales list (last 100)
- Sale search results showing:
  - Sale ID
  - Date
  - Total Amount
  - Pharmacist Name
  - "Select" button

**Step 2: View Sale Items**
- **Items Table:**
  - Medicine name
  - Quantity sold
  - Already returned (if any)
  - Available to return
  - Select checkbox
- Select item to return

**Step 3: Return Form**
- Selected medicine display
- **Quantity to Return** input (max: available quantity)
- **Return Reason** dropdown:
  - Expired
  - Damaged
  - Wrong medication
  - Customer request
  - Other
- **Return Condition** dropdown:
  - Good
  - Damaged
- **Process Return** button

**Success Modal:**
- Return confirmation
- Stock updated message
- Return ID

**API Endpoints:**

Failed to load resource: the server responded with a status of 500 ()Failed to load resource: the server responded with a status of 500 ()Failed to load resource: the server responded with a status of 500 ()**Get Sales for Return:** `GET /api/cashier/returns/sales?sale_id=123`

**Get Sale Items:** `GET /api/cashier/returns/sales/:sale_id/items`

**Process Return:** `POST /api/cashier/returns`

**Request Body:**
```json
{
  "sale_id": 123,
  "medicine_id": 5,
  "quantity_returned": 2,
  "return_reason": "Expired",
  "return_condition": "damaged"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Return processed successfully and stock updated",
  "data": {
    "return_id": 45,
    "sale_id": 123,
    "medicine_name": "Paracetamol",
    
    "quantity_returned": 2,
    "return_reason": "Expired",
    "return_date": "2026-07-09T15:00:00Z"
  }
}
```

---

### 26. Payment Reports Page
**Route:** `/cashier/reports/payments`

**Features:**
- **Date Range Filter:**
  - Start date picker
  - End date picker
  - Quick filters: Today, This Week, This Month
- **Payment Type Filter** dropdown (All, Cash, Card, Mobile)
- **Summary Cards:**
  - Total payments count
  - Total amount collected
  - Breakdown by payment type (Cash: X, Card: Y, Mobile: Z)
- **Payments Table:**
  - Payment ID
  - Sale ID
  - Date & Time
  - Amount
  - Payment Type
  - Reference Number
  - View Receipt button
- **Export to CSV/Excel** button

**API Endpoint:** `GET /api/cashier/reports/payments?start_date=2026-07-01&end_date=2026-07-09&payment_type=card`

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "payment_id": 1,
        "sale_id": 123,
        "payment_date": "2026-07-09T14:35:00Z",
        "amount": 350.00,
        "payment_type": "card",
        "reference_number": "REF123456"
      }
    ],
    "summary": {
      "total_amount": 15000.00,
      "total_count": 45,
      "payment_type_summary": {
        "cash": 8000.00,
        "card": 5000.00,
        "mobile": 2000.00
      }
    }
  }
}
```

---

### 27. Return Reports Page
**Route:** `/cashier/reports/returns`

**Features:**
- **Date Range Filter:**
  - Start date picker
  - End date picker
- **Summary Cards:**
  - Total returns count
  - Total quantity returned
  - Total return value
- **Returns Table:**
  - Return ID
  - Sale ID
  - Date
  - Medicine Name
  - Quantity Returned
  - Reason
  - Return Value
- **Reason Breakdown** chart (pie chart)
- **Export to CSV** button

**API Endpoint:** `GET /api/cashier/reports/returns?start_date=2026-07-01&end_date=2026-07-09`

**Response:**
```json
{
  "success": true,
  "data": {
    "returns": [
      {
        "return_id": 45,
        "sale_id": 123,
        "medicine_name": "Paracetamol",
        "quantity_returned": 2,
        "return_reason": "Expired",
        "return_date": "2026-07-09T15:00:00Z",
        "return_value": 100.00
      }
    ],
    "summary": {
      "total_quantity_returned": 50,
      "total_return_value": 2500.00,
      "total_count": 15,
      "reason_summary": {
        "Expired": 5,
        "Damaged": 3,
        "Customer request": 7
      }
    }
  }
}
```

---

## User Flows

### Flow 1: Manager Creates Staff Account
1. Manager logs in → Manager Dashboard
2. Navigate to **Staff Management** (`/manager/staff`)
3. Click **"Create Staff"** button
4. Fill form:
   - Full name: "Jane Smith"
   - Email: "jane@pharmacare.com"
   - Role: "Pharmacist"
5. Submit form
6. **Success Modal appears** showing:
   - Verification Code: "ABC123"
   - Instructions: "Share this code with Jane"
7. Manager copies code and shares with staff member
8. Staff member receives email with verification link
9. Staff clicks link or goes to `/verify-email`
10. Enters email and verification code "ABC123"
11. Account verified → Redirect to `/login`
12. Staff logs in with email and temporary password
13. **Forced to change password** → Redirect to `/change-password`
14. Sets new password → Access dashboard

---

### Flow 2: Pharmacist Creates Sale
1. Pharmacist logs in → Pharmacist Dashboard
2. Navigate to **Create Sale** (`/pharmacist/sales/new`)
3. Search for medicine "Paracetamol"
4. Select medicine → Add to cart (quantity: 2)
5. Search for "Amoxicillin"
6. Add to cart (quantity: 1)
7. Review cart:
   - Paracetamol: 2 × 50 = 100
   - Amoxicillin: 1 × 250 = 250
   - **Total: 350**
8. Select payment type: "Cash"
9. (Optional) Enter customer name
10. Click **"Submit Sale"**
11. API creates sale with status `pending_payment`
12. **Success Modal shows:**
    - Sale ID: 123
    - Total: 350
    - Message: "Sale created. Send to cashier for payment."
13. Pharmacist informs customer: "Please go to cashier with Sale ID: 123"

---

### Flow 3: Cashier Accepts Payment
1. Cashier logs in → Cashier Dashboard
2. Navigate to **Pending Payments** (`/cashier/payments/pending`)
3. See list of pending sales (auto-refreshes)
4. Find Sale ID 123 (Total: 350, Pharmacist: John)
5. Click **"View Details"**
6. Modal opens showing:
   - Sale items (Paracetamol × 2, Amoxicillin × 1)
   - Total: 350
7. Customer arrives at cashier
8. Cashier confirms amount with customer
9. Customer pays cash
10. Cashier selects payment type: "Cash"
11. (If card/mobile, enters reference number)
12. Clicks **"Accept Payment"**
13. API updates sale status to `completed`
14. Success message appears
15. **Receipt page opens** (`/cashier/receipts/123`)
16. Cashier prints receipt for customer
17. Transaction complete

---

### Flow 4: Cashier Processes Return
1. Customer comes with receipt wanting to return medicine
2. Cashier logs in → Navigate to **Process Returns** (`/cashier/returns`)
3. Enter Sale ID from receipt: 123
4. Click **"Search"**
5. Sale details load showing:
   - Paracetamol × 2
   - Amoxicillin × 1
6. Customer wants to return 1 Paracetamol (expired)
7. Cashier selects Paracetamol checkbox
8. Enters quantity: 1
9. Selects return reason: "Expired"
10. Selects condition: "Damaged"
11. Clicks **"Process Return"**
12. API:
    - Creates return record
    - Adds 1 Paracetamol back to stock
13. Success modal shows:
    - Return ID: 45
    - Stock updated
14. Cashier confirms with customer
15. Return complete

---

### Flow 5: Pharmacist Requests Restock
1. Pharmacist notices Amoxicillin low stock (8 remaining)
2. Navigate to **Request Restock** (`/pharmacist/restock`)
3. Search/select "Amoxicillin"
4. Current stock displayed: 8
5. Enter requested quantity: 100
6. Add notes: "High demand medicine, running low"
7. Click **"Submit Request"**
8. API creates notification for manager
9. Success message: "Restock request sent to manager"
10. Manager receives notification in dashboard
11. Manager reviews notification
12. Manager navigates to **Medicine Inventory**
13. Finds Amoxicillin → Click **"Edit"**
14. Updates stock: Action "Add", Quantity: 100
15. Submits → Stock updated to 108
16. (Optional) Manager responds to pharmacist

---

### Flow 6: Admin Activates New Manager
1. New manager registers at `/register`:
   - Name: "Ahmed Hassan"
   - Email: "ahmed@pharmacare.com"
   - Role: Manager
   - Branch: Addis Ababa Branch
2. Manager verifies email
3. Manager account created but **inactive** (cannot access dashboard)
4. Admin logs in
5. Navigate to **Manager Management** (`/admin/managers`)
6. Click **"Pending Managers"** tab
7. See Ahmed Hassan in list
8. Review details (email, branch)
9. Click **"Activate"** button
10. Confirmation modal: "Activate Ahmed Hassan?"
11. Confirm
12. API updates manager: `is_active = TRUE`
13. Success message: "Manager activated"
14. Ahmed can now log in with full access
15. Manager appears in "Activated Managers" tab

---

## Component Architecture

### Shared Components
```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Table.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Spinner.jsx
│   │   ├── Alert.jsx
│   │   └── SearchBar.jsx
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── DashboardLayout.jsx
│   ├── auth/
│   │   ├── PrivateRoute.jsx
│   │   ├── RoleBasedRoute.jsx
│   │   └── LoginForm.jsx
│   ├── dashboard/
│   │   ├── SummaryCard.jsx
│   │   ├── StatsCard.jsx
│   │   └── QuickActionButton.jsx
│   ├── medicine/
│   │   ├── MedicineCard.jsx
│   │   ├── MedicineTable.jsx
│   │   ├── MedicineForm.jsx
│   │   └── MedicineSearch.jsx
│   ├── sales/
│   │   ├── SaleCart.jsx
│   │   ├── CartItem.jsx
│   │   ├── Receipt.jsx
│   │   └── SalesSummary.jsx
│   └── reports/
│       ├── ChartCard.jsx
│       ├── ReportTable.jsx
│       └── DateRangeFilter.jsx
```

---

## State Management

### Option 1: Context API
```javascript
// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Option 2: Redux Toolkit
```javascript
// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }) => {
    const response = await axios.post('/api/auth/login', { email, password });
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## API Integration

### Axios Configuration
```javascript
// src/api/axios.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## Complete API Endpoints Reference

### Authentication APIs
```javascript
// POST /api/auth/register
POST /api/auth/register
Body: { full_name, email, password, role_id, branch_id }

// POST /api/auth/login
POST /api/auth/login
Body: { email, password }

// POST /api/auth/verify-email
POST /api/auth/verify-email
Body: { email, verification_code }

// POST /api/auth/resend-verification
POST /api/auth/resend-verification
Body: { email }

// POST /api/auth/forgot-password
POST /api/auth/forgot-password
Body: { email }

// GET /api/auth/me (Protected)
GET /api/auth/me
Headers: { Authorization: Bearer <token> }

// POST /api/auth/logout (Protected)
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }

// POST /api/auth/change-password (Protected)
POST /api/auth/change-password
Headers: { Authorization: Bearer <token> }
Body: { current_password, new_password }
```

### Admin APIs
```javascript
// Dashboard
GET /api/admin/dashboard
GET /api/admin/dashboard/branches
GET /api/admin/dashboard/users
GET /api/admin/dashboard/sales
GET /api/admin/dashboard/branches-list

// Manager Management
GET /api/admin/managers
GET /api/admin/managers/pending
GET /api/admin/managers/activated
GET /api/admin/managers/branch/:branch_id
PUT /api/admin/managers/:user_id/activate
PUT /api/admin/managers/:user_id/deactivate
```

### Manager APIs
```javascript
// Dashboard
GET /api/manager/dashboard
GET /api/manager/dashboard/branch
GET /api/manager/dashboard/inventory
GET /api/manager/dashboard/sales?year=2026
GET /api/manager/dashboard/notifications

// Staff Management
POST /api/manager/staff
Body: { full_name, email, role_id }

POST /api/manager/staff/verify
Body: { email, verification_code }

GET /api/manager/staff
PUT /api/manager/staff/:user_id
Body: { full_name, email }

DELETE /api/manager/staff/:user_id
POST /api/manager/staff/:user_id/reset-password

// Medicine Management
GET /api/manager/medicines
GET /api/manager/medicines/:medicine_id

POST /api/manager/medicines
Body: { name, category_id, type, quantity_in_stock, price, expiry_date, barcode, manufacturer }

PUT /api/manager/medicines/:medicine_id/stock
Body: { quantity_in_stock, price, expiry_date }

DELETE /api/manager/medicines/:medicine_id
```

### Pharmacist APIs
```javascript
// Medicines
GET /api/pharmacist/medicines
GET /api/pharmacist/medicines/search?query=paracetamol
GET /api/pharmacist/medicines/category/:category_id
GET /api/pharmacist/medicines/:medicine_id

// Inventory
POST /api/pharmacist/inventory/request-restock
Body: { medicine_id, requested_quantity, notes }

POST /api/pharmacist/inventory/mark-low-stock
Body: { medicine_id, threshold, notes }

GET /api/pharmacist/inventory/stock-history?medicine_id=5

// Medicine Stock Management
POST /api/pharmacist/medicines
Body: { name, category_id, type, quantity_in_stock, price, expiry_date, barcode, manufacturer }

PUT /api/pharmacist/medicines/:medicine_id/stock
Body: { action: "add", quantity_change: 50 } or { quantity_in_stock: 150 }

DELETE /api/pharmacist/medicines/:medicine_id

// Sales
POST /api/pharmacist/sales
Body: { items: [{ medicine_id, quantity }], payment_type, customer_name, customer_phone }

GET /api/pharmacist/sales/:sale_id

// Reports
GET /api/pharmacist/reports/low-stock?threshold=10
GET /api/pharmacist/reports/expiry?days=30
GET /api/pharmacist/reports/inventory-summary
```

### Cashier APIs
```javascript
// Payments
GET /api/cashier/payments/pending
GET /api/cashier/payments/:sale_id

POST /api/cashier/payments/:sale_id/accept
Body: { payment_type, reference_number }

GET /api/cashier/receipts/:sale_id

// Returns
GET /api/cashier/returns/sales?sale_id=123
GET /api/cashier/returns/sales/:sale_id/items

POST /api/cashier/returns
Body: { sale_id, medicine_id, quantity_returned, return_reason, return_condition }

// Reports
GET /api/cashier/reports/payments?start_date=2026-07-01&end_date=2026-07-09&payment_type=card
GET /api/cashier/reports/returns?start_date=2026-07-01&end_date=2026-07-09
```

---

## Environment Variables

### Frontend `.env` file
```env
VITE_API_URL=http://localhost:10000
VITE_APP_NAME=PharmaCare
```

### Backend `.env` file (already exists)
```env
DB_HOST=dpg-xxx.frankfurt-postgres.render.com
DB_PORT=5432
DB_USER=pharmacare_user
DB_PASSWORD=your_password
DB_NAME=pharmacare
DB_SSL=true

PORT=10000
NODE_ENV=production

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

BREVO_API_KEY=your_brevo_api_key
FROM_EMAIL=no-reply@pharmacare.com
FROM_NAME=PharmaCare

FRONTEND_URL=http://localhost:3000
```

---

## Routing Structure

```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/auth/PrivateRoute';

// Public pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManagerManagement from './pages/admin/ManagerManagement';

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard';
import StaffManagement from './pages/manager/StaffManagement';
import MedicineInventory from './pages/manager/MedicineInventory';
import ManagerSalesReports from './pages/manager/SalesReports';
import InventoryReports from './pages/manager/InventoryReports';
import Notifications from './pages/manager/Notifications';

// Pharmacist pages
import PharmacistDashboard from './pages/pharmacist/Dashboard';
import MedicineSearch from './pages/pharmacist/MedicineSearch';
import CreateSale from './pages/pharmacist/CreateSale';
import ManageStock from './pages/pharmacist/ManageStock';
import RequestRestock from './pages/pharmacist/RequestRestock';
import PharmacistReports from './pages/pharmacist/Reports';
import ViewSale from './pages/pharmacist/ViewSale';

// Cashier pages
import CashierDashboard from './pages/cashier/Dashboard';
import PendingPayments from './pages/cashier/PendingPayments';
import ProcessReturns from './pages/cashier/ProcessReturns';
import PaymentReports from './pages/cashier/PaymentReports';
import ReturnReports from './pages/cashier/ReturnReports';
import Receipt from './pages/cashier/Receipt';

// Shared pages
import Profile from './pages/shared/Profile';
import ChangePassword from './pages/shared/ChangePassword';
import Unauthorized from './pages/shared/Unauthorized';

function App() {
  return (
    <BrowserRouter>
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
          <Route path="managers" element={<ManagerManagement />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={<PrivateRoute allowedRoles={['Manager']} />}>
          <Route index element={<Navigate to="/manager/dashboard" />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="medicines" element={<MedicineInventory />} />
          <Route path="reports/sales" element={<ManagerSalesReports />} />
          <Route path="reports/inventory" element={<InventoryReports />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Pharmacist Routes */}
        <Route path="/pharmacist" element={<PrivateRoute allowedRoles={['Pharmacist']} />}>
          <Route index element={<Navigate to="/pharmacist/dashboard" />} />
          <Route path="dashboard" element={<PharmacistDashboard />} />
          <Route path="medicines" element={<MedicineSearch />} />
          <Route path="medicines/manage" element={<ManageStock />} />
          <Route path="sales/new" element={<CreateSale />} />
          <Route path="sales/:sale_id" element={<ViewSale />} />
          <Route path="restock" element={<RequestRestock />} />
          <Route path="reports" element={<PharmacistReports />} />
        </Route>

        {/* Cashier Routes */}
        <Route path="/cashier" element={<PrivateRoute allowedRoles={['Cashier']} />}>
          <Route index element={<Navigate to="/cashier/dashboard" />} />
          <Route path="dashboard" element={<CashierDashboard />} />
          <Route path="payments/pending" element={<PendingPayments />} />
          <Route path="receipts/:sale_id" element={<Receipt />} />
          <Route path="returns" element={<ProcessReturns />} />
          <Route path="reports/payments" element={<PaymentReports />} />
          <Route path="reports/returns" element={<ReturnReports />} />
        </Route>

        {/* Shared Protected Routes */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Next Steps

1. **Set up React project** with Vite
2. **Install dependencies** (axios, react-router-dom, tailwindcss, etc.)
3. **Configure Tailwind CSS**
4. **Create folder structure** as outlined
5. **Implement authentication context/store**
6. **Build shared components** (Button, Input, Table, etc.)
7. **Implement layout components** (Sidebar, Navbar, DashboardLayout)
8. **Build role-specific pages** starting with authentication pages
9. **Integrate APIs** using axios
10. **Test all user flows**
11. **Deploy frontend** (Vercel, Netlify, or Render)
12. **Update backend CORS** to allow frontend origin

---

**End of Blueprint**
