# Postman Test Guide: Manager Endpoints

This guide provides step-by-step instructions for testing all Manager endpoints in Postman.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Authentication Flow](#authentication-flow)
4. [Dashboard Endpoints](#dashboard-endpoints)
5. [Manager Management Endpoints (Manager can create managers)](#manager-management-endpoints-manager-can-create-managers)
6. [Medicine Import (Excel)](#medicine-import-excel)
7. [Branch Management Endpoints](#branch-management-endpoints)
8. [Sales & Payments Endpoints](#sales--payments-endpoints)
9. [Settings Endpoints](#settings-endpoints)
10. [Admin Manager Management Endpoints](#admin-manager-management-endpoints)
11. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

- Postman installed
- API server running
- Database with `audit_trail` and `refund_policy` tables created (run migration)
- Manager account (created by Admin)
- Valid JWT token for authentication

**Note:** Manager accounts are created by Admin. They cannot register themselves.

---

## Setup

### 1. Environment Variables

Set up Postman environment variables:
- `base_url`: Your API base URL (e.g., `http://localhost:5000` or `https://your-api.com`)
- `manager_token`: JWT token for Manager (will be set after login)
- `admin_token`: JWT token for Admin (for admin endpoints)
- `branch_id`: Branch ID (will be set after getting branch info)
- `sale_id`: Sale ID (for testing sales endpoints)
- `return_id`: Return ID (for testing refunds)

### 2. Collection Setup

Create a new Postman collection:
- Name: `PharmaCare - Manager Tests`
- Organize requests into folders:
  - `Authentication`
  - `Dashboard`
  - `Medicine`
  - `Branch Management`
  - `Sales & Payments`
  - `Settings`
  - `Admin - Manager Management`

### 3. Database Migration

**Important:** Before testing, run the database migration to create required tables:

```sql
-- Run this file: database/migrations/create_audit_trail_and_refund_policy.sql
```

---

## Authentication Flow

### Step 1: Admin Login (for creating managers)

**Endpoint:** `POST {{base_url}}/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@pharmacare.com",
  "password": "Admin@123"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "full_name": "System Administrator",
    "email": "admin@pharmacare.com",
    "role_name": "Admin"
  }
}
```

**Save:** Copy the `token` and set it as `admin_token` in environment variables.

### Step 2: Manager Login

**Endpoint:** `POST {{base_url}}/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "manager@example.com",
  "password": "Manager@123"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 2,
    "full_name": "John Manager",
    "email": "manager@example.com",
    "role_name": "Manager",
    "branch_id": 1
  }
}
```

**Save:** Copy the `token` and set it as `manager_token` in environment variables. Also save `branch_id`.

---

## Dashboard Endpoints

### 1. Get Top Selling Medicines

**Endpoint:** `GET {{base_url}}/api/manager/dashboard/top-selling`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Query Parameters (Optional):**
- `limit`: Number of results (default: 10)
- `period`: Time period - `today`, `week`, `month`, `year`, `all` (default: `all`)

**Example:** `GET {{base_url}}/api/manager/dashboard/top-selling?limit=5&period=month`

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "medicine_id": 1,
        "name": "Paracetamol 500mg",
        "barcode": "123456789",
        "price": "25.00",
        "total_sold": 150,
        "total_revenue": "3750.00",
        "sale_count": 45,
        "avg_price": "25.00"
      }
    ],
    "period": "month",
    "limit": 5,
    "count": 5
  },
  "message": "Top selling medicines retrieved successfully"
}
```

---

## Manager Management Endpoints (Manager can create managers)

### 1. Create Manager Account (by Manager)

**Endpoint:** `POST {{base_url}}/api/manager/managers`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "full_name": "Jane Manager",
  "email": "jane.manager@pharmacare.com",
  "password": "Manager@123",
  "branch_id": 1
}
```

**Note:** `branch_id` is optional. If not provided, the new manager will be assigned to the creating manager's branch.

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Manager account created successfully. Account is pending admin activation.",
  "data": {
    "user": {
      "user_id": 5,
      "full_name": "Jane Manager",
      "email": "jane.manager@pharmacare.com",
      "role_id": 2,
      "branch_id": 1,
      "is_active": false,
      "is_email_verified": false,
      "role_name": "Manager",
      "branch_name": "Main Branch"
    },
    "verificationCode": "123456",
    "emailSent": true,
    "accountStatus": {
      "is_active": false,
      "is_email_verified": false,
      "requires_admin_activation": true,
      "note": "This manager account must be activated by an admin before it can be used."
    },
    "nextSteps": [
      "1. Manager should verify email (optional)",
      "2. Admin must activate the account using: PUT /api/admin/managers/:id/activate",
      "3. After activation, manager can login"
    ]
  }
}
```

**Important:** 
- The created manager account is **INACTIVE** (`is_active: false`)
- Only an **Admin** can activate it using: `PUT /api/admin/managers/:id/activate`
- The manager cannot login until activated by admin
- This is different from staff accounts (Pharmacist/Cashier) which are activated automatically after email verification

---

## Medicine Import (Excel)

This endpoint lets a Manager import medicines from an Excel file into the existing `medicine` table.

### 1. Import Medicines from Excel (.xlsx)

**Endpoint:** `POST {{base_url}}/api/manager/medicines/import-excel`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Body:** `form-data` (multipart)
- **file** (type: File) → select your `.xlsx` file
- **category_id** (type: Text, optional) → required by current DB schema
  - If omitted, backend uses the **first category** found in DB

**Excel columns (required, case-insensitive):**
- `name`
- `price`
- `quantity`
- `manufacturer`
- `expiry_date`

**Supported `expiry_date` formats:**
- Excel Date cell
- `YYYY-MM-DD` (recommended)
- Most common date strings that JavaScript can parse

**Duplicates (skipped):**
- Duplicate inside the same file
- Duplicate already in DB for the manager’s branch  
  Duplicate key used: `(branch_id, lower(name), lower(manufacturer), expiry_date)`

**Example: Postman setup**
1. Go to **Body** → select **form-data**
2. Add key `file` → change type to **File** → choose the Excel file
3. (Optional) Add key `category_id` → type **Text** → value like `1`
4. Click **Send**

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Excel import completed",
  "data": {
    "totalRows": 120,
    "inserted": 95,
    "skippedMissing": 10,
    "skippedDuplicateFile": 5,
    "skippedDuplicateDb": 10,
    "rowErrors": 0
  }
}
```

**Common Errors**

**Missing file:** 400
```json
{
  "success": false,
  "message": "Excel file is required (multipart/form-data field name: file)"
}
```

**Invalid category_id:** 400
```json
{
  "success": false,
  "message": "Invalid category_id"
}
```

**No categories exist in DB (and category_id not provided):** 400
```json
{
  "success": false,
  "message": "No categories found. Create at least one category or provide category_id."
}
```

---

## Branch Management Endpoints

### 1. Get All Branches

**Endpoint:** `GET {{base_url}}/api/manager/branches`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "branch_id": 1,
      "branch_name": "Main Branch",
      "location": "Addis Ababa",
      "email": "main@pharmacare.com",
      "phone": "+251-11-123-4567",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "pharmacy_name": "PharmaCare PLC",
      "total_staff": 5,
      "active_staff": 4
    }
  ],
  "count": 1,
  "message": "Branches retrieved successfully"
}
```

### 2. Create Branch

**Endpoint:** `POST {{base_url}}/api/manager/branches`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "branch_name": "New Branch",
  "location": "Addis Ababa, Bole",
  "email": "newbranch@pharmacare.com",
  "phone": "+251-11-987-6543"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Branch created successfully",
  "data": {
    "branch_id": 2,
    "branch_name": "New Branch",
    "location": "Addis Ababa, Bole",
    "email": "newbranch@pharmacare.com",
    "phone": "+251-11-987-6543",
    "created_at": "2024-01-20T10:00:00.000Z"
  }
}
```

**Save:** Copy the `branch_id` for later use.

### 3. Request Branch Creation

**Endpoint:** `POST {{base_url}}/api/manager/branches/request`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "branch_name": "Requested Branch",
  "location": "Addis Ababa, CMC",
  "email": "requested@pharmacare.com",
  "phone": "+251-11-555-1234",
  "request_notes": "Need approval for new branch location"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Branch request submitted successfully. Waiting for admin approval.",
  "data": {
    "branch": {
      "branch_id": 3,
      "branch_name": "Requested Branch",
      "location": "Addis Ababa, CMC"
    },
    "status": "pending_approval",
    "note": "Need approval for new branch location"
  }
}
```

### 4. Update Branch

**Endpoint:** `PUT {{base_url}}/api/manager/branches/:id`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "branch_name": "Updated Branch Name",
  "location": "Updated Location",
  "email": "updated@pharmacare.com",
  "phone": "+251-11-999-8888"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Branch updated successfully",
  "data": {
    "branch_id": 1,
    "branch_name": "Updated Branch Name",
    "location": "Updated Location",
    "email": "updated@pharmacare.com",
    "phone": "+251-11-999-8888",
    "updated_at": "2024-01-20T11:00:00.000Z"
  }
}
```

### 5. Delete Branch

**Endpoint:** `DELETE {{base_url}}/api/manager/branches/:id`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Note:** Branch can only be deleted if it has no associated users or sales.

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Branch deleted successfully"
}
```

### 6. Activate Branch

**Endpoint:** `PUT {{base_url}}/api/manager/branches/:id/activate`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Branch activated successfully",
  "data": {
    "branch_id": 1,
    "branch_name": "Main Branch",
    "location": "Addis Ababa"
  },
  "note": "Note: Branch activation is currently handled through user management..."
}
```

### 7. Deactivate Branch

**Endpoint:** `PUT {{base_url}}/api/manager/branches/:id/deactivate`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Branch deactivated successfully",
  "data": {
    "branch_id": 1,
    "branch_name": "Main Branch"
  },
  "note": "Note: Branch deactivation is currently handled through user management..."
}
```

---

## Sales & Payments Endpoints

### 1. Create Sale

**Endpoint:** `POST {{base_url}}/api/manager/sales`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "medicine_id": 1,
      "quantity": 2
    },
    {
      "medicine_id": 2,
      "quantity": 1
    }
  ],
  "payment_type": "cash",
  "customer_name": "John Doe",
  "customer_phone": "+251-911-123-456"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "sale": {
      "sale_id": 10,
      "branch_id": 1,
      "user_id": 2,
      "sale_date": "2024-01-20T12:00:00.000Z",
      "total_amount": "150.00",
      "status": "completed",
      "created_by_name": "John Manager"
    },
    "items": [
      {
        "sale_item_id": 1,
        "quantity": 2,
        "unit_price": "50.00",
        "subtotal": "100.00",
        "medicine_name": "Paracetamol 500mg",
        "barcode": "123456789"
      }
    ],
    "payment_type": "cash"
  }
}
```

**Save:** Copy the `sale_id` for later use.

### 2. Process Payment

**Endpoint:** `POST {{base_url}}/api/manager/sales/:id/payment`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "payment_type": "card",
  "reference_number": "TXN-123456789"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "sale_id": 10,
    "branch_id": 1,
    "total_amount": "150.00",
    "status": "completed",
    "payment_type": "card",
    "payment_date": "2024-01-20T12:05:00.000Z",
    "reference_number": "TXN-123456789"
  }
}
```

### 3. Process Refund

**Endpoint:** `POST {{base_url}}/api/manager/sales/:id/refund`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "return_id": 1,
  "refund_amount": 50.00,
  "refund_method": "cash",
  "notes": "Customer returned unopened medicine"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refund_id": 1,
    "return_id": 1,
    "user_id": 2,
    "refund_amount": "50.00",
    "refund_date": "2024-01-20T12:10:00.000Z",
    "refund_method": "cash",
    "notes": "Customer returned unopened medicine",
    "sale_id": 10,
    "processed_by": "John Manager"
  }
}
```

### 4. Get Audit Trail

**Endpoint:** `GET {{base_url}}/api/manager/audit-trail`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Query Parameters (Optional):**
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)
- `action_type`: Filter by action type (e.g., `create`, `update`, `payment`, `refund`)
- `entity_type`: Filter by entity type (e.g., `sale`, `medicine`, `user`)
- `start_date`: Filter from date (ISO format)
- `end_date`: Filter to date (ISO format)

**Example:** `GET {{base_url}}/api/manager/audit-trail?limit=50&action_type=payment&start_date=2024-01-01`

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "audit_id": 1,
      "branch_id": 1,
      "user_id": 2,
      "action_type": "create",
      "entity_type": "sale",
      "entity_id": 10,
      "description": "Manager created sale #10 with total amount 150.00",
      "created_at": "2024-01-20T12:00:00.000Z",
      "user_name": "John Manager",
      "user_email": "manager@example.com",
      "role_name": "Manager"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "message": "Audit trail retrieved successfully"
}
```

### 5. Get Audit Trail by ID

**Endpoint:** `GET {{base_url}}/api/manager/audit-trail/:id`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "audit_id": 1,
    "branch_id": 1,
    "user_id": 2,
    "action_type": "create",
    "entity_type": "sale",
    "entity_id": 10,
    "description": "Manager created sale #10 with total amount 150.00",
    "created_at": "2024-01-20T12:00:00.000Z",
    "user_name": "John Manager",
    "user_email": "manager@example.com",
    "role_name": "Manager",
    "branch_name": "Main Branch"
  },
  "message": "Audit trail entry retrieved successfully"
}
```

---

## Settings Endpoints

### 1. Get Refund Policy

**Endpoint:** `GET {{base_url}}/api/manager/settings/refund-policy`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "policy_id": 1,
    "branch_id": 1,
    "refund_days_limit": 30,
    "refund_conditions": "Items must be unopened and in original packaging",
    "requires_receipt": true,
    "refund_methods": "original_payment",
    "notes": "Default refund policy",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  },
  "message": "Refund policy retrieved successfully"
}
```

**Note:** If no policy exists, it returns a default policy structure.

### 2. Update Refund Policy

**Endpoint:** `PUT {{base_url}}/api/manager/settings/refund-policy`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "refund_days_limit": 14,
  "refund_conditions": "Items must be unopened, in original packaging, and returned within 14 days",
  "requires_receipt": true,
  "refund_methods": "original_payment,cash",
  "notes": "Updated refund policy - 14 day limit"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Refund policy updated successfully",
  "data": {
    "policy_id": 1,
    "branch_id": 1,
    "refund_days_limit": 14,
    "refund_conditions": "Items must be unopened, in original packaging, and returned within 14 days",
    "requires_receipt": true,
    "refund_methods": "original_payment,cash",
    "notes": "Updated refund policy - 14 day limit",
    "updated_at": "2024-01-20T12:00:00.000Z"
  }
}
```

---

## Admin Manager Management Endpoints

### 1. Create Manager

**Endpoint:** `POST {{base_url}}/api/admin/managers`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body (Option 1 - Create with existing branch):**
```json
{
  "full_name": "Jane Manager",
  "email": "jane.manager@pharmacare.com",
  "password": "Manager@123",
  "branch_id": 1
}
```

**Body (Option 2 - Create with new branch):**
```json
{
  "full_name": "Bob Manager",
  "email": "bob.manager@pharmacare.com",
  "password": "Manager@123",
  "branch_name": "Second Branch",
  "location": "Addis Ababa, Piassa"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Manager created successfully. Account is pending activation.",
  "data": {
    "user_id": 3,
    "full_name": "Jane Manager",
    "email": "jane.manager@pharmacare.com",
    "role_id": 2,
    "branch_id": 1,
    "is_active": false,
    "role_name": "Manager",
    "branch_name": "Main Branch"
  }
}
```

### 2. Verify Manager

**Endpoint:** `POST {{base_url}}/api/admin/managers/verify`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "jane.manager@pharmacare.com",
  "verification_code": "123456"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Manager verified successfully",
  "data": {
    "user_id": 3,
    "full_name": "Jane Manager",
    "email": "jane.manager@pharmacare.com",
    "is_email_verified": true,
    "is_active": false,
    "role_name": "Manager",
    "branch_name": "Main Branch"
  }
}
```

### 3. Update Manager

**Endpoint:** `PUT {{base_url}}/api/admin/managers/:id`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body (all fields optional):**
```json
{
  "full_name": "Jane Manager Updated",
  "email": "jane.updated@pharmacare.com",
  "branch_id": 2,
  "is_active": true
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Manager updated successfully",
  "data": {
    "user_id": 3,
    "full_name": "Jane Manager Updated",
    "email": "jane.updated@pharmacare.com",
    "branch_id": 2,
    "is_active": true,
    "role_name": "Manager",
    "branch_name": "Second Branch"
  }
}
```

### 4. Delete Manager

**Endpoint:** `DELETE {{base_url}}/api/admin/managers/:id`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Manager deleted successfully"
}
```

### 5. Reset Manager Password

**Endpoint:** `POST {{base_url}}/api/admin/managers/:id/reset-password`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body (Option 1 - Regular password reset):**
```json
{
  "new_password": "NewPassword@123"
}
```

**Body (Option 2 - Temporary password):**
```json
{
  "temporary_password": true,
  "new_password": "TempPass@123"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Temporary password set successfully. Manager must change password on next login.",
  "data": {
    "user_id": 3,
    "full_name": "Jane Manager",
    "email": "jane.manager@pharmacare.com",
    "is_temporary_password": true,
    "must_change_password": true
  }
}
```

### 6. Get Audit Logs (Admin)

**Endpoint:** `GET {{base_url}}/api/admin/audit-logs`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Parameters (Optional):**
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)
- `branch_id`: Filter by branch ID
- `user_id`: Filter by user ID
- `action_type`: Filter by action type
- `entity_type`: Filter by entity type
- `start_date`: Filter from date (ISO format)
- `end_date`: Filter to date (ISO format)

**Example:** `GET {{base_url}}/api/admin/audit-logs?branch_id=1&limit=50&action_type=payment`

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "audit_id": 1,
      "branch_id": 1,
      "user_id": 2,
      "action_type": "create",
      "entity_type": "sale",
      "entity_id": 10,
      "description": "Manager created sale #10 with total amount 150.00",
      "created_at": "2024-01-20T12:00:00.000Z",
      "user_name": "John Manager",
      "user_email": "manager@example.com",
      "role_name": "Manager",
      "branch_name": "Main Branch"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "message": "Audit logs retrieved successfully"
}
```

---

## Common Issues & Troubleshooting

### Issue 1: "Audit trail table does not exist"

**Error:**
```json
{
  "success": false,
  "message": "Audit trail table does not exist. Please create the audit_trail table first."
}
```

**Solution:**
Run the database migration:
```sql
-- Execute: database/migrations/create_audit_trail_and_refund_policy.sql
```

### Issue 2: "Refund policy table does not exist"

**Error:**
```json
{
  "success": false,
  "message": "Refund policy table does not exist. Please create the refund_policy table first."
}
```

**Solution:**
Run the database migration (same file as above).

### Issue 3: "Manager must belong to a branch"

**Error:**
```json
{
  "success": false,
  "message": "Manager must belong to a branch"
}
```

**Solution:**
Ensure the manager account has a `branch_id` assigned. Managers cannot be system-level users.

### Issue 4: "Sale not found or does not belong to your branch"

**Error:**
```json
{
  "success": false,
  "message": "Sale not found or does not belong to your branch"
}
```

**Solution:**
- Verify the sale exists
- Ensure the sale belongs to the manager's branch
- Check that you're using the correct `sale_id`

### Issue 5: "Insufficient stock"

**Error:**
```json
{
  "success": false,
  "message": "Insufficient stock for Paracetamol. Available: 5, Requested: 10"
}
```

**Solution:**
- Check medicine stock levels
- Reduce the quantity requested
- Restock the medicine first

### Issue 6: "Branch cannot be deleted"

**Error:**
```json
{
  "success": false,
  "message": "Cannot delete branch with associated users. Please reassign or remove users first."
}
```

**Solution:**
- Reassign users to other branches
- Or delete users first (if appropriate)
- Or deactivate the branch instead

### Issue 7: Token Expired

**Error:**
```json
{
  "success": false,
  "message": "Token expired"
}
```

**Solution:**
- Login again to get a new token
- Update the `manager_token` or `admin_token` in environment variables

### Issue 8: "Access denied. Manager privileges required."

**Error:**
```json
{
  "success": false,
  "message": "Access denied. Manager privileges required."
}
```

**Solution:**
- Ensure you're using a Manager account token
- Verify the user's role is "Manager"
- Check that the account is active

---

## Testing Checklist

### Dashboard
- [ ] Get top selling medicines (all periods)
- [ ] Get top selling with filters

### Medicine
- [ ] Import medicines from Excel (`POST /api/manager/medicines/import-excel`)
- [ ] Verify duplicates are skipped (same name+manufacturer+expiry_date)
- [ ] Verify missing fields are skipped

### Branch Management
- [ ] Get all branches
- [ ] Create new branch
- [ ] Request branch creation
- [ ] Update branch
- [ ] Activate branch
- [ ] Deactivate branch
- [ ] Delete branch (if no users/sales)

### Sales & Payments
- [ ] Create sale
- [ ] Process payment
- [ ] Process refund
- [ ] Get audit trail (all filters)
- [ ] Get audit trail by ID

### Settings
- [ ] Get refund policy
- [ ] Update refund policy

### Admin Manager Management
- [ ] Create manager (existing branch)
- [ ] Create manager (new branch)
- [ ] Verify manager
- [ ] Update manager
- [ ] Reset manager password (regular)
- [ ] Reset manager password (temporary)
- [ ] Get audit logs (all filters)
- [ ] Delete manager

---

## Tips for Testing

1. **Use Environment Variables:** Set up Postman environment variables for tokens and IDs to avoid manual updates.

2. **Test in Order:** Some endpoints depend on others (e.g., refunds need returns, payments need sales).

3. **Check Database:** After creating/updating records, verify in the database to ensure data integrity.

4. **Test Error Cases:** Try invalid IDs, missing fields, and unauthorized access.

5. **Use Collection Runner:** Run the entire collection in sequence for comprehensive testing.

6. **Save Responses:** Use Postman's "Save Response" feature to keep examples for documentation.

---

## Additional Notes

- All timestamps are in ISO 8601 format
- All monetary values are returned as strings to preserve decimal precision
- Pagination is available for list endpoints
- Filtering is available for audit trail and audit logs
- Branch activation/deactivation currently returns a note about implementation (requires `is_active` column on branch table)

---

**Last Updated:** January 2024
**Version:** 1.0
