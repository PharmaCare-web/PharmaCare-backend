# Frontend Developer Guide - PharmaCare System

This guide explains each page/component in the PharmaCare system, their functionalities, required API endpoints, and implementation details for frontend developers.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Authentication Pages](#authentication-pages)
4. [Admin Pages](#admin-pages)
5. [Manager Pages](#manager-pages)
6. [Pharmacist Pages](#pharmacist-pages)
7. [Cashier Pages](#cashier-pages)
8. [Common Components](#common-components)
9. [API Integration Guide](#api-integration-guide)

---

## System Overview

PharmaCare is a pharmacy management system with four main user roles:
- **Admin**: System-level management
- **Manager**: Branch-level management
- **Pharmacist**: Stock management and sales support
- **Cashier**: Payment processing and returns

Each role has access to different pages and functionalities based on their permissions.

---

## User Roles & Permissions

### Role Hierarchy

```
Admin (System Level)
  └── Manager (Branch Level)
        ├── Pharmacist (Staff)
        └── Cashier (Staff)
```

### Permissions Matrix

| Feature | Admin | Manager | Pharmacist | Cashier |
|---------|-------|---------|------------|---------|
| View Dashboard | ✅ | ✅ | ❌ | ❌ |
| Manage Branches | ✅ | ❌ | ❌ | ❌ |
| Manage Managers | ✅ | ❌ | ❌ | ❌ |
| Manage Staff | ❌ | ✅ | ❌ | ❌ |
| Manage Medicines | ❌ | ✅ | ✅ | ❌ |
| View Medicines | ❌ | ✅ | ✅ | ❌ |
| Create Sales | ❌ | ❌ | ✅ | ❌ |
| Process Payments | ❌ | ❌ | ❌ | ✅ |
| Handle Returns | ❌ | ❌ | ❌ | ✅ |
| View Reports | ✅ | ✅ | ✅ (Limited) | ✅ (Limited) |

---

## Authentication Pages

### 1. Login Page

**Route:** `/login`

**Functionality:**
- User authentication
- Role-based redirect after login
- Password change prompt for first-time users

**API Endpoint:**
```
POST /api/auth/login
```

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "users": {
    "user_id": 1,
    "full_name": "John Doe",
    "email": "user@example.com",
    "role_id": 2,
    "role_name": "Manager",
    "branch_id": 5,
    "must_change_password": false
  },
  "requiresPasswordChange": false
}
```

**UI Components:**
- Email input field
- Password input field
- Login button
- "Forgot Password?" link
- Error message display area

**Redirect Logic:**
```javascript
if (response.requiresPasswordChange) {
  // Redirect to change password page
  navigate('/change-password');
} else {
  // Redirect based on role
  switch (response.users.role_name) {
    case 'Admin':
      navigate('/admin/dashboard');
      break;
    case 'Manager':
      navigate('/manager/dashboard');
      break;
    case 'Pharmacist':
      navigate('/pharmacist/medicines');
      break;
    case 'Cashier':
      navigate('/cashier/payments');
      break;
  }
}
```

**Error Handling:**
- Display error message for invalid credentials
- Show "Account not activated" message if account is inactive
- Handle email verification requirements

---

### 2. Change Password Page

**Route:** `/change-password`

**Functionality:**
- Required for first-time login (temporary password)
- Allows users to set a permanent password
- Validates password requirements

**API Endpoint:**
```
POST /api/auth/change-password
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "current_password": "TempPass123",
  "new_password": "NewSecurePass123"
}
```

**Password Requirements:**
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**UI Components:**
- Current password input
- New password input
- Confirm password input
- Password strength indicator
- Submit button
- Back to login link

**Validation:**
- Real-time password strength checking
- Confirm password matching
- Display requirements checklist

---

### 3. Forgot Password Page

**Route:** `/forgot-password`

**Functionality:**
- Request password reset
- Sends temporary password via email

**API Endpoint:**
```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Temporary password sent to your email"
}
```

**UI Components:**
- Email input field
- Submit button
- Success message display
- Back to login link

---

## Admin Pages

### 1. Admin Dashboard

**Route:** `/admin/dashboard`

**Functionality:**
- Overview of system-wide statistics
- Summary data only (no detailed data)
- View total branches, users, and sales count

**API Endpoint:**
```
GET /api/admin/dashboard
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBranches": 10,
      "totalUsers": 150,
      "totalSales": 5000,
      "pendingManagers": 3,
      "activatedManagers": 7
    }
  }
}
```

**UI Components:**
- Statistics cards (Total Branches, Total Users, Total Sales)
- Pending Managers count
- Activated Managers count
- Quick action buttons:
  - View All Branches
  - View All Managers
  - View Pending Managers

**Data Display:**
- Use cards/widgets for each statistic
- Color coding: Green for good, Yellow for pending, Red for issues
- Refresh button to reload data

---

### 2. Admin - Manage Branches

**Route:** `/admin/branches`

**Functionality:**
- View all branches in the system
- View branch details
- No edit/delete functionality (branches managed by managers)

**API Endpoint:**
```
GET /api/admin/dashboard/branches-list
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branches": [
      {
        "branch_id": 1,
        "branch_name": "Downtown Branch",
        "location": "123 Main St",
        "total_managers": 2,
        "total_staff": 15
      }
    ]
  }
}
```

**UI Components:**
- Branch list table
- Search/filter functionality
- Branch details modal/view
- Statistics per branch

---

### 3. Admin - Manage Managers

**Route:** `/admin/managers`

**Functionality:**
- View all managers
- View pending managers (awaiting activation)
- Activate/deactivate manager accounts
- Filter by branch

**API Endpoints:**

**Get All Managers:**
```
GET /api/admin/managers
```

**Get Pending Managers:**
```
GET /api/admin/managers/pending
```

**Get Activated Managers:**
```
GET /api/admin/managers/activated
```

**Activate Manager:**
```
PUT /api/admin/managers/:user_id/activate
```

**Deactivate Manager:**
```
PUT /api/admin/managers/:user_id/deactivate
```

**Response Example (Get All Managers):**
```json
{
  "success": true,
  "data": {
    "managers": [
      {
        "user_id": 5,
        "full_name": "John Manager",
        "email": "manager@example.com",
        "branch_id": 1,
        "branch_name": "Downtown Branch",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pending": [...],
    "activated": [...]
  }
}
```

**UI Components:**
- Tabs: All Managers / Pending / Activated
- Manager list table with columns:
  - Name
  - Email
  - Branch
  - Status (Active/Inactive)
  - Created Date
  - Actions (Activate/Deactivate buttons)
- Search/filter by branch
- Status badges (Active/Inactive/Pending)
- Confirmation modal for activate/deactivate actions

**Actions:**
- Click "Activate" → Show confirmation → Call activate endpoint
- Click "Deactivate" → Show confirmation → Call deactivate endpoint
- Filter by branch dropdown
- Search by name/email

---

## Manager Pages

### 1. Manager Dashboard

**Route:** `/manager/dashboard`

**Functionality:**
- Branch-specific overview
- Inventory summary
- Sales summary
- Staff overview
- Low stock alerts
- Expiring medicines alerts

**API Endpoint:**
```
GET /api/manager/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "branch_id": 1,
    "branchOverview": {
      "branch_id": 1,
      "branchId": 1,
      "branchName": "Downtown Branch",
      "location": "123 Main St",
      "totalManagers": 2,
      "totalEmployees": 15,
      "activeEmployees": 12,
      "inactiveEmployees": 3
    },
    "inventorySummary": {
      "totalMedicines": 150,
      "totalQuantity": 5000,
      "lowStockCount": 12,
      "expiringSoonCount": 5,
      "expiredCount": 2,
      "lowStockMedicines": [...],
      "expiredMedicines": [...]
    },
    "salesSummary": {
      "today": {
        "count": 25,
        "revenue": 1250.50
      },
      "thisWeek": {
        "count": 150,
        "revenue": 7500.00
      },
      "thisMonth": {
        "count": 600,
        "revenue": 30000.00
      },
      "pendingSales": 5,
      "pendingReturns": 2,
      "topSellingMedicines": [...]
    }
  }
}
```

**UI Components:**
- Branch info card (name, location, branch_id)
- Statistics cards:
  - Total Employees
  - Active Employees
  - Total Medicines
  - Low Stock Alerts
- Sales summary cards:
  - Today's Sales
  - This Week's Sales
  - This Month's Sales
- Charts/Graphs:
  - Sales trend chart
  - Top selling medicines chart
- Alerts section:
  - Low stock medicines list
  - Expiring medicines list
- Quick actions:
  - View All Medicines
  - View All Staff
  - View All Sales

**Data Visualization:**
- Use charts for sales trends (line chart)
- Use bar charts for top selling medicines
- Use pie charts for employee status
- Color-coded alerts (red for urgent, yellow for warning)

---

### 2. Manager - Staff Management

**Route:** `/manager/staff`

**Functionality:**
- Create new staff (Pharmacist/Cashier)
- View all staff members
- Update staff information
- Remove/deactivate staff
- Reset staff password
- Verify staff email codes

**API Endpoints:**

**Create Staff:**
```
POST /api/manager/staff
```

**Request Body:**
```json
{
  "full_name": "John Pharmacist",
  "email": "pharmacist@example.com",
  "role_ids": [3],
  "temporary_password": null
}
```

**Get All Staff:**
```
GET /api/manager/staff
```

**Update Staff:**
```
PUT /api/manager/staff/:user_id
```

**Remove Staff:**
```
DELETE /api/manager/staff/:user_id
```

**Reset Password:**
```
POST /api/manager/staff/:user_id/reset-password
```

**Verify Staff Code:**
```
POST /api/manager/staff/verify
```

**Request Body:**
```json
{
  "user_id": 42,
  "verification_code": "123456"
}
```

**UI Components:**
- Staff list table
- Create staff button (opens modal/form)
- Staff creation form:
  - Full Name input
  - Email input
  - Role selection (Pharmacist/Cashier - can select multiple)
  - Submit button
- Staff verification modal:
  - User ID input
  - Verification code input
  - Verify button
- Staff actions dropdown:
  - Edit
  - Reset Password
  - Remove
- Status badges (Active/Inactive/Unverified)
- Filter by role
- Search functionality

**Workflow:**
1. Manager creates staff → System sends verification code to email
2. Manager receives code (or from email)
3. Manager enters code in verification modal
4. System activates account and sends temporary password
5. Staff can now login

---

### 3. Manager - Medicine Management

**Route:** `/manager/medicines`

**Functionality:**
- View all medicines in branch
- Add new medicines to stock
- Update medicine stock quantities
- Update medicine prices
- Remove medicines from stock
- Filter and search medicines
- View low stock medicines

**API Endpoints:**

**Get All Medicines:**
```
GET /api/manager/medicines?page=1&limit=50&search=aspirin&category_id=1&low_stock_only=true
```

**Get Medicine by ID:**
```
GET /api/manager/medicines/:medicine_id
```

**Add Medicine:**
```
POST /api/manager/medicines
```

**Request Body:**
```json
{
  "name": "Paracetamol 500mg",
  "type": "Tablet",
  "quantity_in_stock": 200,
  "price": 2.50,
  "expiry_date": "2025-12-31",
  "barcode": "1234567890123",
  "manufacturer": "PharmaCorp",
  "category_id": 2
}
```

**Update Stock:**
```
PUT /api/manager/medicines/:medicine_id/stock
```

**Request Body:**
```json
{
  "quantity_in_stock": 250,
  "price": 2.75
}
```

**Remove Medicine:**
```
DELETE /api/manager/medicines/:medicine_id
```

**UI Components:**
- Medicine list table with columns:
  - Name
  - Type
  - Quantity in Stock
  - Price
  - Expiry Date
  - Category
  - Stock Status (Normal/Low/Expiring/Expired)
  - Actions
- Search bar
- Filter options:
  - By category
  - Low stock only
  - Expiring soon
  - Expired
- Add medicine button (opens modal/form)
- Medicine form fields:
  - Name (required)
  - Type (required)
  - Quantity (required)
  - Price (required)
  - Expiry Date (required)
  - Barcode (optional)
  - Manufacturer (optional)
  - Category (dropdown)
- Edit button (opens edit modal)
- Delete button (with confirmation)
- Stock status indicators (color-coded badges)
- Pagination controls

**Features:**
- Real-time stock status calculation
- Low stock warning (quantity < 10)
- Expiry date warnings (30 days before expiry)
- Bulk operations (if needed)
- Export to CSV/Excel (optional)

---

### 4. Manager - Sales Overview

**Route:** `/manager/sales`

**Functionality:**
- View all sales for the branch
- Filter by date range
- View sales details
- View sales statistics

**API Endpoint:**
```
GET /api/manager/dashboard/sales
```

**UI Components:**
- Sales list table
- Date range filter
- Sales statistics cards
- Sales details modal
- Export functionality

---

## Pharmacist Pages

### 1. Pharmacist - Medicines List

**Route:** `/pharmacist/medicines`

**Functionality:**
- View all medicines in branch
- Search medicines
- Filter by category
- View medicine details
- Add medicines to stock
- Update stock quantities
- Remove medicines

**API Endpoints:**

**Get All Medicines:**
```
GET /api/pharmacist/medicines?page=1&limit=50&search=aspirin
```

**Search Medicines:**
```
GET /api/pharmacist/medicines/search?q=paracetamol
```

**Get by Category:**
```
GET /api/pharmacist/medicines/category/:category_id
```

**Get by ID:**
```
GET /api/pharmacist/medicines/:medicine_id
```

**Add Medicine:**
```
POST /api/pharmacist/medicines
```

**Update Stock:**
```
PUT /api/pharmacist/medicines/:medicine_id/stock
```

**Remove Medicine:**
```
DELETE /api/pharmacist/medicines/:medicine_id
```

**UI Components:**
- Medicine grid/list view
- Search bar (real-time search)
- Category filter dropdown
- Medicine card showing:
  - Name
  - Stock quantity
  - Price
  - Expiry date
  - Stock status badge
- Medicine details modal
- Add/Edit/Delete buttons
- Stock status indicators

**Note:** Pharmacist has same medicine management capabilities as Manager for their branch.

---

### 2. Pharmacist - Inventory Management

**Route:** `/pharmacist/inventory`

**Functionality:**
- Request restock from manager
- Mark medicines as low stock
- View stock history
- Track inventory changes

**API Endpoints:**

**Request Restock:**
```
POST /api/pharmacist/inventory/request-restock
```

**Request Body:**
```json
{
  "medicine_id": 5,
  "requested_quantity": 100,
  "notes": "Running low on stock"
}
```

**Mark Low Stock:**
```
POST /api/pharmacist/inventory/mark-low-stock
```

**Get Stock History:**
```
GET /api/pharmacist/inventory/stock-history?medicine_id=5&start_date=2024-01-01
```

**UI Components:**
- Restock request form
- Low stock alert button
- Stock history table
- Date range filter
- Medicine filter

---

### 3. Pharmacist - Sales

**Route:** `/pharmacist/sales`

**Functionality:**
- Create new sales
- View sale details
- Process sales transactions

**API Endpoints:**

**Create Sale:**
```
POST /api/pharmacist/sales
```

**Request Body:**
```json
{
  "items": [
    {
      "medicine_id": 5,
      "quantity": 2,
      "price": 2.50
    }
  ],
  "customer_name": "John Doe",
  "payment_method": "cash"
}
```

**Get Sale:**
```
GET /api/pharmacist/sales/:sale_id
```

**UI Components:**
- Sales creation form
- Medicine selection/search
- Cart/Items list
- Quantity input
- Price display
- Total calculation
- Customer name input
- Payment method selection
- Submit button
- Sales list view
- Sale details modal

**Workflow:**
1. Search/select medicines
2. Add to cart with quantities
3. Enter customer name
4. Select payment method
5. Review total
6. Submit sale
7. Sale created with "pending_payment" status
8. Cashier processes payment

---

### 4. Pharmacist - Reports

**Route:** `/pharmacist/reports`

**Functionality:**
- View low stock report
- View expiry report
- View inventory summary

**API Endpoints:**

**Low Stock Report:**
```
GET /api/pharmacist/reports/low-stock
```

**Expiry Report:**
```
GET /api/pharmacist/reports/expiry?days=30
```

**Inventory Summary:**
```
GET /api/pharmacist/reports/inventory-summary
```

**UI Components:**
- Report tabs
- Low stock medicines table
- Expiring medicines table
- Summary statistics cards
- Export buttons
- Date range filters

---

## Cashier Pages

### 1. Cashier - Pending Payments

**Route:** `/cashier/payments`

**Functionality:**
- View all pending payments
- View payment details
- Accept payments
- Process transactions

**API Endpoints:**

**Get Pending Payments:**
```
GET /api/cashier/payments/pending
```

**Get Payment Details:**
```
GET /api/cashier/payments/:sale_id
```

**Accept Payment:**
```
POST /api/cashier/payments/:sale_id/accept
```

**Request Body:**
```json
{
  "payment_method": "cash",
  "amount_paid": 25.50,
  "change": 0.00
}
```

**UI Components:**
- Pending payments list
- Payment card showing:
  - Sale ID
  - Customer name
  - Total amount
  - Items count
  - Created time
- Payment details modal
- Payment acceptance form:
  - Payment method selection (cash/card)
  - Amount paid input
  - Change calculation (auto)
  - Accept button
- Payment method icons
- Real-time change calculation

**Workflow:**
1. View pending payments list
2. Click on payment to see details
3. Enter payment method and amount
4. System calculates change
5. Accept payment
6. Sale status changes to "completed"
7. Generate receipt

---

### 2. Cashier - Receipts

**Route:** `/cashier/receipts`

**Functionality:**
- View receipts for completed sales
- Print receipts
- Search receipts

**API Endpoint:**
```
GET /api/cashier/receipts/:sale_id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "receipt_number": "REC-100",
    "sale_id": 100,
    "date": "2024-01-15T10:30:00Z",
    "items": [
      {
        "medicine_name": "Paracetamol",
        "quantity": 2,
        "price": 2.50,
        "subtotal": 5.00
      }
    ],
    "total_amount": 25.50,
    "payment_method": "cash"
  }
}
```

**UI Components:**
- Receipt display (printable format)
- Receipt header (company info, branch info)
- Receipt items table
- Receipt footer (total, payment method, date)
- Print button
- Search by sale ID
- Receipt list view

**Receipt Design:**
- Company logo
- Branch name and address
- Receipt number
- Date and time
- Items table
- Subtotal, tax (if applicable), total
- Payment method
- Thank you message
- Footer with contact info

---

### 3. Cashier - Returns

**Route:** `/cashier/returns`

**Functionality:**
- View sales eligible for return
- View sale items
- Process returns
- Handle refunds

**API Endpoints:**

**Get Sales for Return:**
```
GET /api/cashier/returns/sales?start_date=2024-01-01
```

**Get Sale Items:**
```
GET /api/cashier/returns/sales/:sale_id/items
```

**Process Return:**
```
POST /api/cashier/returns
```

**Request Body:**
```json
{
  "sale_id": 100,
  "items": [
    {
      "sale_item_id": 50,
      "medicine_id": 5,
      "quantity_returned": 1,
      "return_reason": "defective",
      "return_condition": "damaged"
    }
  ]
}
```

**UI Components:**
- Sales list (eligible for return)
- Sale selection
- Sale items list
- Return form:
  - Item selection checkboxes
  - Quantity to return input
  - Return reason dropdown
  - Return condition dropdown
  - Submit button
- Return confirmation modal
- Refund amount display

**Return Reasons:**
- Defective
- Wrong item
- Expired
- Customer request
- Other

**Return Conditions:**
- Damaged
- Unopened
- Opened
- Expired

---

### 4. Cashier - Reports

**Route:** `/cashier/reports`

**Functionality:**
- View payment reports
- View return reports
- Filter by date range
- View statistics

**API Endpoints:**

**Payment Reports:**
```
GET /api/cashier/reports/payments?start_date=2024-01-01&payment_method=cash
```

**Return Reports:**
```
GET /api/cashier/reports/returns?start_date=2024-01-01
```

**UI Components:**
- Report tabs (Payments/Returns)
- Date range picker
- Payment method filter
- Statistics cards
- Report tables
- Charts/graphs
- Export buttons

---

## Common Components

### 1. Navigation Bar

**Components:**
- Logo/Brand name
- User info (name, role, branch)
- Navigation menu (role-based)
- Logout button
- Notifications icon (if applicable)

**Role-based Menu Items:**

**Admin:**
- Dashboard
- Branches
- Managers
- Logout

**Manager:**
- Dashboard
- Staff
- Medicines
- Sales
- Reports
- Logout

**Pharmacist:**
- Medicines
- Inventory
- Sales
- Reports
- Logout

**Cashier:**
- Payments
- Receipts
- Returns
- Reports
- Logout

---

### 2. Sidebar Navigation

**Features:**
- Collapsible menu
- Active route highlighting
- Icons for each menu item
- Badge for notifications/alerts
- Responsive design

---

### 3. Data Tables

**Features:**
- Sorting by columns
- Pagination
- Search/filter
- Row actions dropdown
- Bulk actions (if applicable)
- Export functionality
- Responsive design

**Common Columns:**
- ID
- Name
- Status badge
- Created date
- Actions

---

### 4. Modals/Forms

**Features:**
- Form validation
- Error message display
- Loading states
- Success/error notifications
- Cancel/Submit buttons
- Responsive design

---

### 5. Status Badges

**Colors:**
- Green: Active, Completed, Success
- Yellow: Pending, Warning
- Red: Inactive, Error, Expired
- Blue: Info, Processing

---

### 6. Notifications/Toasts

**Types:**
- Success (green)
- Error (red)
- Warning (yellow)
- Info (blue)

**Features:**
- Auto-dismiss after 5 seconds
- Manual dismiss button
- Stack multiple notifications
- Position: Top-right (recommended)

---

## API Integration Guide

### 1. Authentication

**Store Token:**
```javascript
// After login
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.users));
```

**Include Token in Requests:**
```javascript
const token = localStorage.getItem('token');
fetch(`${API_URL}/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Handle Token Expiry:**
```javascript
if (response.status === 401) {
  // Token expired or invalid
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate('/login');
}
```

---

### 2. Error Handling

**Common Error Responses:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Error 1", "Error 2"] // For validation errors
}
```

**Error Handling Pattern:**
```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized
    } else if (response.status === 403) {
      // Handle forbidden
    } else {
      // Show error message
      showError(data.message || 'An error occurred');
    }
    return;
  }
  
  // Handle success
  handleSuccess(data);
} catch (error) {
  showError('Network error. Please try again.');
}
```

---

### 3. Loading States

**Pattern:**
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await fetch(url);
    const data = await response.json();
    // Handle data
  } finally {
    setLoading(false);
  }
};
```

**UI:**
- Show loading spinner during API calls
- Disable buttons during submission
- Show skeleton loaders for lists

---

### 4. Form Validation

**Client-side Validation:**
- Validate before API call
- Show inline error messages
- Disable submit button if invalid

**Server-side Validation:**
- Display server validation errors
- Highlight invalid fields
- Show error summary

---

### 5. Real-time Updates

**Polling Pattern:**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 30000); // Poll every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

**WebSocket (if implemented):**
- Connect to WebSocket server
- Listen for updates
- Update UI in real-time

---

## State Management

### Recommended Approach

**For Small Apps:**
- React Context API
- Local component state

**For Large Apps:**
- Redux or Zustand
- Separate stores for:
  - Auth state
  - User data
  - Medicines data
  - Sales data
  - UI state

---

## Routing Structure

### Recommended Routes

```
/login
/change-password
/forgot-password

/admin
  /dashboard
  /branches
  /managers

/manager
  /dashboard
  /staff
  /medicines
  /sales
  /reports

/pharmacist
  /medicines
  /inventory
  /sales
  /reports

/cashier
  /payments
  /receipts
  /returns
  /reports
```

---

## UI/UX Guidelines

### 1. Color Scheme

**Primary:** Green (#4CAF50) - Success, primary actions
**Secondary:** Blue (#2196F3) - Info, secondary actions
**Warning:** Yellow (#FFC107) - Warnings, pending
**Error:** Red (#F44336) - Errors, danger
**Neutral:** Gray (#757575) - Text, borders

### 2. Typography

**Headings:** Bold, larger font size
**Body:** Regular, readable font size
**Labels:** Medium weight, smaller size
**Buttons:** Medium weight, uppercase (optional)

### 3. Spacing

- Consistent padding/margins
- Use 8px or 16px grid system
- Adequate whitespace

### 4. Responsive Design

- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### 5. Accessibility

- Proper ARIA labels
- Keyboard navigation
- Focus indicators
- Color contrast (WCAG AA)
- Screen reader support

---

## Testing Checklist

### Functional Testing
- [ ] All API endpoints work correctly
- [ ] Error handling works
- [ ] Form validation works
- [ ] Navigation works
- [ ] Role-based access control works

### UI Testing
- [ ] Responsive design works
- [ ] Loading states display
- [ ] Error messages display
- [ ] Success messages display
- [ ] Modals work correctly

### Integration Testing
- [ ] Authentication flow works
- [ ] Data fetching works
- [ ] Data submission works
- [ ] Token refresh works
- [ ] Logout works

---

## Support & Resources

### API Documentation
- Base URL: Check environment configuration
- All endpoints: See `routes/index.js`
- Authentication: See `routes/authRoutes.js`

### Error Codes
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

### Contact
- For API issues: Check server logs
- For account issues: Contact system administrator

---

**Last Updated:** 2024-01-15
**API Version:** 1.0.0
**Frontend Framework:** (Specify your framework - React, Vue, Angular, etc.)

