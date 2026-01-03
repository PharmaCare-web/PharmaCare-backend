# Postman Test Guide: Pharmacist & Cashier Endpoints

This guide provides step-by-step instructions for testing Pharmacist and Cashier endpoints in Postman.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Authentication Flow](#authentication-flow)
4. [Pharmacist Endpoints](#pharmacist-endpoints)
5. [Cashier Endpoints](#cashier-endpoints)
6. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Prerequisites

- Postman installed
- API server running
- Manager account with created Pharmacist/Cashier accounts
- Valid JWT token for authentication

**Note:** Pharmacist and Cashier accounts are created by Managers. They cannot register themselves.

---

## Setup

### 1. Environment Variables

Set up Postman environment variables:
- `base_url`: Your API base URL (e.g., `http://localhost:5000` or `https://your-api.com`)

### 2. Collection Setup

Create a new Postman collection:
- Name: `PharmaCare - Pharmacist & Cashier Tests`
- Organize requests into folders:
  - `Authentication`
  - `Pharmacist - Medicines`
  - `Pharmacist - Inventory`
  - `Pharmacist - Sales`
  - `Pharmacist - Reports`
  - `Cashier - Payments`
  - `Cashier - Receipts`
  - `Cashier - Returns`
  - `Cashier - Reports`

---

## Authentication Flow

### Step 1: Manager Creates Staff Account

**Note:** Pharmacist and Cashier accounts must be created by a Manager first.

**Endpoint:** `POST {{base_url}}/api/manager/staff`

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "full_name": "John Pharmacist",
  "email": "pharmacist@example.com",
  "role_ids": [3],
  "temporary_password": null
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Staff member account created. Verification code sent to email.",
  "data": {
    "users": {
      "user_id": 42,
      "full_name": "John Pharmacist",
      "email": "pharmacist@example.com",
      "role_id": 3,
      "branch_id": 23,
      "is_active": false,
      "is_email_verified": false
    },
    "verificationCode": "123456",
    "emailSent": true
  }
}
```

**Save:** Copy the `verificationCode` for the next step.

### Step 2: Manager Verifies Staff Email

**Endpoint:** `POST {{base_url}}/api/manager/staff/verify`

**Headers:**
```
Authorization: Bearer <manager_token>
Content-Type: application/json
```

**Body:**
```json
{
  "user_id": 42,
  "verification_code": "123456"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Email verified successfully. Staff account activated automatically (no admin approval needed).",
  "data": {
    "users": {...},
    "temporaryPassword": "Abc123Xyz789",
    "emailSent": true,
    "accountStatus": {
      "is_active": true,
      "is_email_verified": true,
      "can_login": true
    }
  }
}
```

**Save:** Copy the `temporaryPassword` for login.

### Step 3: Staff Login (First Time)

**Endpoint:** `POST {{base_url}}/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "pharmacist@example.com",
  "password": "Abc123Xyz789"
}
```

**Expected Response:** 200 OK (but may require password change)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "users": {
    "user_id": 42,
    "full_name": "John Pharmacist",
    "email": "pharmacist@example.com",
    "role_id": 3,
    "must_change_password": true
  },
  "requiresPasswordChange": true
}
```

**Important:** If `requiresPasswordChange: true`, you MUST change the password before accessing other endpoints.

### Step 4: Change Password (Required on First Login)

**Endpoint:** `POST {{base_url}}/api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token_from_step_3>
Content-Type: application/json
```

**Body:**
```json
{
  "current_password": "Abc123Xyz789",
  "new_password": "NewSecurePass123"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Step 5: Login Again with New Password

**Endpoint:** `POST {{base_url}}/api/auth/login`

**Body:**
```json
{
  "email": "pharmacist@example.com",
  "password": "NewSecurePass123"
}
```

**Save the token:** Use this token for all subsequent requests.

---

## Pharmacist Endpoints

### 1. Medicine Information (View Only)

#### Get All Medicines

**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `search`: Search term (name, barcode, manufacturer)

**Example:**
```
GET {{base_url}}/api/pharmacist/medicines?page=1&limit=20&search=aspirin
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "medicines": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### Search Medicines

**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/search`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Query Parameters:**
- `q`: Search query (required)
- `page`: Page number
- `limit`: Items per page

**Example:**
```
GET {{base_url}}/api/pharmacist/medicines/search?q=paracetamol
```

#### Get Medicines by Category

**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/category/:category_id`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Example:**
```
GET {{base_url}}/api/pharmacist/medicines/category/1
```

#### Get Medicine by ID

**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/:medicine_id`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Example:**
```
GET {{base_url}}/api/pharmacist/medicines/5
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "medicine_id": 5,
    "name": "Paracetamol 500mg",
    "quantity_in_stock": 150,
    "price": 2.50,
    "expiry_date": "2025-12-31",
    "category_name": "Pain Relief"
  }
}
```

---

### 2. Inventory Interactions

#### Request Restock

**Endpoint:** `POST {{base_url}}/api/pharmacist/inventory/request-restock`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
Content-Type: application/json
```

**Body:**
```json
{
  "medicine_id": 5,
  "requested_quantity": 100,
  "notes": "Running low on stock"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Restock request submitted successfully",
  "data": {
    "request_id": 10,
    "medicine_id": 5,
    "requested_quantity": 100
  }
}
```

#### Mark Low Stock

**Endpoint:** `POST {{base_url}}/api/pharmacist/inventory/mark-low-stock`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
Content-Type: application/json
```

**Body:**
```json
{
  "medicine_id": 5,
  "alert_threshold": 20
}
```

#### Get Stock History

**Endpoint:** `GET {{base_url}}/api/pharmacist/inventory/stock-history`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Query Parameters (Optional):**
- `medicine_id`: Filter by medicine
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Example:**
```
GET {{base_url}}/api/pharmacist/inventory/stock-history?medicine_id=5&start_date=2024-01-01
```

---

### 3. Medicine Stock Management

#### Add Medicine to Stock

**Endpoint:** `POST {{base_url}}/api/pharmacist/medicines`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Ibuprofen 400mg",
  "type": "Tablet",
  "quantity_in_stock": 200,
  "price": 3.50,
  "expiry_date": "2025-06-30",
  "barcode": "1234567890123",
  "manufacturer": "PharmaCorp",
  "category_id": 2
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Medicine added to stock successfully",
  "data": {
    "medicine_id": 15,
    "name": "Ibuprofen 400mg",
    "quantity_in_stock": 200
  }
}
```

#### Update Medicine Stock

**Endpoint:** `PUT {{base_url}}/api/pharmacist/medicines/:medicine_id/stock`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
Content-Type: application/json
```

**Body:**
```json
{
  "quantity_in_stock": 250,
  "price": 3.75
}
```

#### Remove Medicine from Stock

**Endpoint:** `DELETE {{base_url}}/api/pharmacist/medicines/:medicine_id`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Medicine removed from stock successfully"
}
```

---

### 4. Sales Support

#### Create Sale

**Endpoint:** `POST {{base_url}}/api/pharmacist/sales`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "medicine_id": 5,
      "quantity": 2,
      "price": 2.50
    },
    {
      "medicine_id": 10,
      "quantity": 1,
      "price": 5.00
    }
  ],
  "customer_name": "John Doe",
  "payment_method": "cash"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Sale created successfully",
  "data": {
    "sale_id": 100,
    "total_amount": 10.00,
    "status": "pending_payment"
  }
}
```

#### Get Sale by ID

**Endpoint:** `GET {{base_url}}/api/pharmacist/sales/:sale_id`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Example:**
```
GET {{base_url}}/api/pharmacist/sales/100
```

---

### 5. Reports

#### Low Stock Report

**Endpoint:** `GET {{base_url}}/api/pharmacist/reports/low-stock`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "medicine_id": 5,
        "name": "Paracetamol",
        "quantity_in_stock": 8,
        "threshold": 10
      }
    ]
  }
}
```

#### Expiry Report

**Endpoint:** `GET {{base_url}}/api/pharmacist/reports/expiry`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Query Parameters (Optional):**
- `days`: Days ahead to check (default: 30)

**Example:**
```
GET {{base_url}}/api/pharmacist/reports/expiry?days=60
```

#### Inventory Summary

**Endpoint:** `GET {{base_url}}/api/pharmacist/reports/inventory-summary`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "total_medicines": 150,
    "total_quantity": 5000,
    "low_stock_count": 12,
    "expiring_soon_count": 5
  }
}
```

---

## Cashier Endpoints

### 1. Payment Management

#### Get Pending Payments

**Endpoint:** `GET {{base_url}}/api/cashier/payments/pending`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "sale_id": 100,
        "total_amount": 25.50,
        "customer_name": "John Doe",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### Get Payment Request Details

**Endpoint:** `GET {{base_url}}/api/cashier/payments/:sale_id`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Example:**
```
GET {{base_url}}/api/cashier/payments/100
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "sale_id": 100,
    "total_amount": 25.50,
    "items": [
      {
        "medicine_name": "Paracetamol",
        "quantity": 2,
        "price": 2.50,
        "subtotal": 5.00
      }
    ],
    "customer_name": "John Doe"
  }
}
```

#### Accept Payment

**Endpoint:** `POST {{base_url}}/api/cashier/payments/:sale_id/accept`

**Headers:**
```
Authorization: Bearer <cashier_token>
Content-Type: application/json
```

**Body:**
```json
{
  "payment_method": "cash",
  "amount_paid": 25.50,
  "change": 0.00
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Payment accepted successfully",
  "data": {
    "sale_id": 100,
    "status": "completed",
    "payment_id": 50
  }
}
```

---

### 2. Receipts

#### Get Receipt

**Endpoint:** `GET {{base_url}}/api/cashier/receipts/:sale_id`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Example:**
```
GET {{base_url}}/api/cashier/receipts/100
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "receipt_number": "REC-100",
    "sale_id": 100,
    "date": "2024-01-15T10:30:00Z",
    "items": [...],
    "total_amount": 25.50,
    "payment_method": "cash"
  }
}
```

---

### 3. Returns

#### Get Sales for Return

**Endpoint:** `GET {{base_url}}/api/cashier/returns/sales`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Query Parameters (Optional):**
- `sale_id`: Filter by sale ID
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Example:**
```
GET {{base_url}}/api/cashier/returns/sales?start_date=2024-01-01
```

#### Get Sale Items for Return

**Endpoint:** `GET {{base_url}}/api/cashier/returns/sales/:sale_id/items`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Example:**
```
GET {{base_url}}/api/cashier/returns/sales/100/items
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "sale_id": 100,
    "items": [
      {
        "sale_item_id": 50,
        "medicine_id": 5,
        "medicine_name": "Paracetamol",
        "quantity": 2,
        "price": 2.50
      }
    ]
  }
}
```

#### Process Return

**Endpoint:** `POST {{base_url}}/api/cashier/returns`

**Headers:**
```
Authorization: Bearer <cashier_token>
Content-Type: application/json
```

**Body:**
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

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Return processed successfully",
  "data": {
    "return_id": 10,
    "sale_id": 100,
    "total_refund": 2.50
  }
}
```

---

### 4. Reports

#### Payment Reports

**Endpoint:** `GET {{base_url}}/api/cashier/reports/payments`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Query Parameters (Optional):**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `payment_method`: Filter by payment method (cash, card, etc.)

**Example:**
```
GET {{base_url}}/api/cashier/reports/payments?start_date=2024-01-01&payment_method=cash
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "total_payments": 150,
    "total_amount": 3750.50,
    "by_method": {
      "cash": 1000.00,
      "card": 2750.50
    }
  }
}
```

#### Return Reports

**Endpoint:** `GET {{base_url}}/api/cashier/reports/returns`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Query Parameters (Optional):**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Example:**
```
GET {{base_url}}/api/cashier/reports/returns?start_date=2024-01-01
```

---

## Common Issues & Troubleshooting

### 1. 401 Unauthorized

**Problem:** Token is missing or invalid.

**Solution:**
- Check that `Authorization: Bearer <token>` header is present
- Verify token is not expired
- Login again to get a new token

### 2. 403 Forbidden - Password Change Required

**Problem:** Account requires password change on first login.

**Solution:**
1. Use the temporary password from account creation/verification
2. Login with temporary password
3. Call `/api/auth/change-password` endpoint
4. Login again with new password

### 3. 403 Forbidden - Access Denied

**Problem:** User doesn't have the required role (Pharmacist or Cashier).

**Solution:**
- Verify the account has the correct role_id (3 for Pharmacist, 4 for Cashier)
- Ensure account is active and email is verified
- Contact manager/admin to verify account status

### 4. 404 Not Found - Branch Not Found

**Problem:** User doesn't belong to a branch.

**Solution:**
- Pharmacist/Cashier accounts must belong to a branch
- Contact manager/admin to assign branch

### 5. 500 Internal Server Error

**Problem:** Server-side error.

**Solution:**
- Check server logs for detailed error messages
- Verify database connection
- Check if all required fields are provided
- Ensure data types match expected format (e.g., booleans use TRUE/FALSE, not 1/0)

### 6. Token Expired

**Problem:** JWT token has expired.

**Solution:**
- Default token expiration is 7 days
- Login again to get a new token
- Save the new token in environment variables

---

## Testing Checklist

### Pharmacist Account Setup
- [ ] Manager creates Pharmacist account
- [ ] Manager verifies Pharmacist email
- [ ] Pharmacist logs in with temporary password
- [ ] Pharmacist changes password
- [ ] Pharmacist logs in with new password
- [ ] Token saved for subsequent requests

### Pharmacist Endpoints Testing
- [ ] Get all medicines
- [ ] Search medicines
- [ ] Get medicines by category
- [ ] Get medicine by ID
- [ ] Request restock
- [ ] Mark low stock
- [ ] Get stock history
- [ ] Add medicine to stock
- [ ] Update medicine stock
- [ ] Remove medicine from stock
- [ ] Create sale
- [ ] Get sale by ID
- [ ] Get low stock report
- [ ] Get expiry report
- [ ] Get inventory summary

### Cashier Account Setup
- [ ] Manager creates Cashier account
- [ ] Manager verifies Cashier email
- [ ] Cashier logs in with temporary password
- [ ] Cashier changes password
- [ ] Cashier logs in with new password
- [ ] Token saved for subsequent requests

### Cashier Endpoints Testing
- [ ] Get pending payments
- [ ] Get payment request details
- [ ] Accept payment
- [ ] Get receipt
- [ ] Get sales for return
- [ ] Get sale items for return
- [ ] Process return
- [ ] Get payment reports
- [ ] Get return reports

---

## Notes

1. **Password Requirements:**
   - Minimum 6 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

2. **Role IDs:**
   - 1: Admin
   - 2: Manager
   - 3: Pharmacist
   - 4: Cashier

3. **Authentication:**
   - All endpoints (except login/register) require JWT token
   - Token must be included in `Authorization` header as `Bearer <token>`
   - Token expires after 7 days (default)

4. **Password Change:**
   - Required on first login (temporary password)
   - Pharmacist and Cashier MUST change password before accessing endpoints
   - Use `/api/auth/change-password` endpoint

5. **Branch Association:**
   - Pharmacist and Cashier accounts belong to a specific branch
   - All operations are scoped to their branch
   - Cannot access data from other branches

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database is properly configured
4. Contact system administrator for account issues

---

**Last Updated:** 2024-01-15
**API Version:** 1.0.0

