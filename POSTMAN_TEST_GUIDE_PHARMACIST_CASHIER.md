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
  - `Pharmacist - Import`
  - `Pharmacist - Inventory`
  - `Pharmacist - Sales`
  - `Pharmacist - Reports`
  - `Cashier - Import`
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

### 1.5. Import Medicines from Excel (Pharmacist)

**Endpoint:** `POST {{base_url}}/api/pharmacist/medicines/import-excel`

**Headers:**
```
Authorization: Bearer <pharmacist_token>
```

**Body:** `form-data` (multipart)
- **file** (type: File) → select your `.xlsx`
- **category_id** (type: Text, optional)  
  - If omitted, backend uses the **first category** found in DB

**Excel required columns (case-insensitive):**
- `name`
- `price`
- `quantity`
- `manufacturer`
- `expiry_date`

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Excel import completed",
  "data": {
    "totalRows": 10,
    "inserted": 8,
    "skippedMissing": 1,
    "skippedDuplicateFile": 0,
    "skippedDuplicateDb": 1,
    "rowErrors": 0
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
      "quantity": 2
    },
    {
      "medicine_id": 10,
      "quantity": 1
    }
  ],
  "payment_type": "cash",
  "customer_name": "John Doe",
  "customer_phone": "1234567890"
}
```

**Note:** 
- `payment_type` is required (e.g., "cash", "card")
- `customer_name` and `customer_phone` are optional
- Medicine prices are automatically retrieved from the database
- Stock is NOT updated at this stage - it will be updated when cashier accepts payment
- A notification is automatically created for cashiers

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Sale created successfully. Payment pending cashier approval.",
  "data": {
    "sale": {
      "sale_id": 100,
      "sale_date": "2024-01-15T10:30:00Z",
      "total_amount": 10.00,
      "status": "pending_payment",
      "pharmacist_name": "John Pharmacist"
    },
    "items": [
      {
        "sale_item_id": 50,
        "medicine_id": 5,
        "medicine_name": "Paracetamol",
        "quantity": 2,
        "unit_price": 2.50,
        "subtotal": 5.00
      },
      {
        "sale_item_id": 51,
        "medicine_id": 10,
        "medicine_name": "Ibuprofen",
        "quantity": 1,
        "unit_price": 5.00,
        "subtotal": 5.00
      }
    ],
    "status": "pending_payment",
    "note": "Payment will be processed by cashier"
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

### 0. Import Medicines from Excel (Cashier)

**Endpoint:** `POST {{base_url}}/api/cashier/medicines/import-excel`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Body:** `form-data` (multipart)
- **file** (type: File) → select your `.xlsx`
- **category_id** (type: Text, optional)  
  - If omitted, backend uses the **first category** found in DB

**Excel required columns (case-insensitive):**
- `name`
- `price`
- `quantity`
- `manufacturer`
- `expiry_date`

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Excel import completed",
  "data": {
    "totalRows": 10,
    "inserted": 8,
    "skippedMissing": 1,
    "skippedDuplicateFile": 0,
    "skippedDuplicateDb": 1,
    "rowErrors": 0
  }
}
```

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
  "message": "Pending payments retrieved successfully",
  "data": [
    {
      "sale_id": 100,
      "sale_date": "2024-01-15T10:30:00Z",
      "total_amount": 25.50,
      "status": "pending_payment",
      "pharmacist_name": "John Pharmacist",
      "pharmacist_id": 42,
      "item_count": 2
    }
  ]
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
  "message": "Payment request details retrieved successfully",
  "data": {
    "sale": {
      "sale_id": 100,
      "sale_date": "2024-01-15T10:30:00Z",
      "total_amount": 25.50,
      "status": "pending_payment",
      "pharmacist_name": "John Pharmacist",
      "pharmacist_id": 42
    },
    "items": [
      {
        "sale_item_id": 50,
        "medicine_id": 5,
        "medicine_name": "Paracetamol",
        "barcode": "1234567890123",
        "quantity": 2,
        "unit_price": 2.50,
        "subtotal": 5.00
      }
    ]
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
  "payment_type": "cash",
  "reference_number": null
}
```

**Note:**
- `payment_type` is required (e.g., "cash", "card", "mobile_payment")
- `reference_number` is optional (for card transactions, etc.)
- When payment is accepted:
  - Sale status changes to "completed"
  - Stock is updated (quantity reduced)
  - Notification is marked as read
  - Payment record is created

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Payment accepted successfully",
  "data": {
    "sale": {
      "sale_id": 100,
      "sale_date": "2024-01-15T10:30:00Z",
      "total_amount": 25.50,
      "status": "completed",
      "cashier_name": "Jane Cashier",
      "payment_type": "cash",
      "payment_amount": 25.50,
      "payment_date": "2024-01-15T10:35:00Z",
      "reference_number": null
    },
    "items": [
      {
        "sale_item_id": 50,
        "medicine_name": "Paracetamol",
        "barcode": "1234567890123",
        "quantity": 2,
        "unit_price": 2.50,
        "subtotal": 5.00
      }
    ],
    "receipt_number": "REC-000100",
    "processed_by": 43
  }
}
```

---

### 2. Notifications

#### Get Notifications

**Endpoint:** `GET {{base_url}}/api/cashier/notifications`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Description:** 
Retrieves payment request notifications for the cashier. Notifications are automatically created when a pharmacist creates a sale with `pending_payment` status.

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "notification_id": 15,
        "title": "New Payment Request",
        "message": "Pharmacist John Pharmacist sent a payment request (Sale ID: 100) for: Paracetamol, Ibuprofen",
        "type": "payment_request",
        "is_read": false,
        "created_at": "2024-01-15T10:30:00Z",
        "sale_id": 100
      }
    ],
    "unread_count": 1
  }
}
```

**Note:**
- Notifications are automatically marked as read when payment is accepted
- `sale_id` is extracted from the message for easy access
- Only payment request notifications are returned

---

### 3. Receipts

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

### 4. Returns

#### Get Sales for Return

**Endpoint:** `GET {{base_url}}/api/cashier/returns/sales`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Query Parameters (Optional):**
- `sale_id`: Filter by sale ID
- `receipt_number`: Filter by receipt number (e.g., "REC-000008" or "REC000008")

**Example:**
```
GET {{base_url}}/api/cashier/returns/sales?receipt_number=REC-000008
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Sales retrieved successfully",
  "data": [
    {
      "sale_id": 8,
      "sale_date": "2024-01-15T10:30:00Z",
      "total_amount": 25.50,
      "status": "completed",
      "pharmacist_name": "John Pharmacist",
      "receipt_number": "REC-000008"
    }
  ]
}
```

#### Find Sale by Receipt Number

**Endpoint:** `GET {{base_url}}/api/cashier/returns/receipt/:receipt_number`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Description:** 
Finds a completed sale by receipt number. This is useful when a customer wants to return items and provides their receipt number.

**Example:**
```
GET {{base_url}}/api/cashier/returns/receipt/REC-000008
```

**Note:** Receipt number format can be:
- `REC-000008` (with dash)
- `REC000008` (without dash)
- Case insensitive

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Sale found successfully",
  "data": {
    "sale": {
      "sale_id": 8,
      "sale_date": "2024-01-15T10:30:00Z",
      "total_amount": 25.50,
      "status": "completed",
      "receipt_number": "REC-000008",
      "pharmacist_name": "John Pharmacist"
    },
    "items": [
      {
        "sale_item_id": 50,
        "medicine_id": 2,
        "medicine_name": "Paracetamol",
        "barcode": "1234567890123",
        "quantity": 2,
        "unit_price": 2.50,
        "subtotal": 5.00,
        "already_returned": 0
      }
    ]
  }
}
```

**Note:** 
- `already_returned` shows how many items have already been returned from this sale
- Only completed sales can be returned

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
  "medicine_id": 5,
  "quantity_returned": 1,
  "return_reason": "defective",
  "return_condition": "damaged"
}
```

**Workflow:**
1. Customer provides receipt number (e.g., "REC-000008")
2. Cashier uses `GET /cashier/returns/receipt/:receipt_number` to find the sale
3. Cashier selects the medicine and quantity to return
4. Cashier processes the return with reason
5. Stock is automatically added back
6. Return appears in inventory summary reports

**Note:**
- `sale_id`, `medicine_id`, `quantity_returned`, and `return_reason` are required
- `return_condition` is optional (defaults to "good")
- Stock is automatically updated when return is processed
- Return will appear in manager and pharmacist inventory summary reports

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Return processed successfully and stock updated",
  "data": {
    "return_id": 10,
    "sale_id": 100,
    "medicine_id": 5,
    "quantity_returned": 1,
    "return_reason": "defective",
    "return_condition": "damaged",
    "return_date": "2024-01-15T11:00:00Z",
    "status": "completed",
    "medicine_name": "Paracetamol",
    "barcode": "1234567890123"
  }
}
```

---

### 5. Reports

#### Payment Reports

**Endpoint:** `GET {{base_url}}/api/cashier/reports/payments`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Query Parameters (Optional):**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `payment_type`: Filter by payment type (cash, card, mobile_payment, etc.)

**Example:**
```
GET {{base_url}}/api/cashier/reports/payments?start_date=2024-01-01&payment_type=cash
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Payment reports retrieved successfully",
  "data": {
    "payments": [
      {
        "payment_id": 50,
        "payment_type": "cash",
        "amount": 25.50,
        "payment_date": "2024-01-15T10:35:00Z",
        "reference_number": null,
        "sale_id": 100,
        "sale_date": "2024-01-15T10:30:00Z",
        "total_amount": 25.50,
        "cashier_name": "Jane Cashier"
      }
    ],
    "summary": {
      "total_amount": 3750.50,
      "total_count": 150,
      "payment_type_summary": {
        "cash": 1000.00,
        "card": 2750.50
      }
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

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Return reports retrieved successfully",
  "data": {
    "returns": [
      {
        "return_id": 10,
        "sale_id": 100,
        "medicine_id": 5,
        "medicine_name": "Paracetamol",
        "barcode": "1234567890123",
        "quantity_returned": 1,
        "return_reason": "defective",
        "return_condition": "damaged",
        "return_date": "2024-01-15T11:00:00Z",
        "status": "completed",
        "price": 2.50,
        "return_value": 2.50
      }
    ],
    "summary": {
      "total_quantity_returned": 1,
      "total_return_value": 2.50,
      "total_count": 1,
      "reason_summary": {
        "defective": 1
      }
    }
  }
}
```

#### Sold Medicines Report

**Endpoint:** `GET {{base_url}}/api/cashier/reports/sold-medicines`

**Headers:**
```
Authorization: Bearer <cashier_token>
```

**Description:** 
Retrieves a report of all sold medicines. Shows aggregated data including total quantity sold, revenue, and number of sales per medicine.

**Query Parameters (Optional):**
- `start_date`: Start date (YYYY-MM-DD) - Filter sales from this date
- `end_date`: End date (YYYY-MM-DD) - Filter sales until this date
- `medicine_id`: Filter by specific medicine ID

**Example:**
```
GET {{base_url}}/api/cashier/reports/sold-medicines?start_date=2024-01-01&end_date=2024-01-31
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Sold medicines report retrieved successfully",
  "data": {
    "medicines": [
      {
        "medicine_id": 5,
        "medicine_name": "Paracetamol",
        "barcode": "1234567890123",
        "type": "Tablet",
        "category_name": "Pain Relief",
        "total_quantity_sold": 25,
        "total_revenue": 62.50,
        "sale_count": 12,
        "average_price": 2.50
      },
      {
        "medicine_id": 10,
        "medicine_name": "Ibuprofen",
        "barcode": "9876543210987",
        "type": "Tablet",
        "category_name": "Pain Relief",
        "total_quantity_sold": 15,
        "total_revenue": 75.00,
        "sale_count": 8,
        "average_price": 5.00
      }
    ],
    "summary": {
      "total_medicines_sold": 2,
      "total_quantity_sold": 40,
      "total_revenue": 137.50,
      "total_sales": 20
    }
  }
}
```

**Note:**
- Only completed sales are included in the report
- Results are sorted by total quantity sold (descending)
- Summary provides aggregate statistics

---

## Complete Workflow Example

### Payment Request Flow: Pharmacist → Cashier

This section demonstrates the complete workflow from pharmacist creating a sale to cashier processing payment.

#### Step 1: Pharmacist Creates Sale

**Endpoint:** `POST {{base_url}}/api/pharmacist/sales`

**Request:**
```json
{
  "items": [
    {
      "medicine_id": 5,
      "quantity": 2
    }
  ],
  "payment_type": "cash",
  "customer_name": "John Doe"
}
```

**Result:**
- Sale created with `status: "pending_payment"`
- Stock is NOT updated yet
- Notification automatically created for cashiers
- Returns `sale_id` (e.g., 100)

#### Step 2: Cashier Views Notifications

**Endpoint:** `GET {{base_url}}/api/cashier/notifications`

**Result:**
- Shows notification with pharmacist name and sale ID
- Example: "Pharmacist John Pharmacist sent a payment request (Sale ID: 100) for: Paracetamol"

#### Step 3: Cashier Views Pending Payments

**Endpoint:** `GET {{base_url}}/api/cashier/payments/pending`

**Result:**
- Lists all pending payment requests
- Shows sale_id, total_amount, pharmacist_name, item_count

#### Step 4: Cashier Gets Payment Details

**Endpoint:** `GET {{base_url}}/api/cashier/payments/100`

**Result:**
- Shows complete sale details with all items
- Displays medicine names, quantities, prices

#### Step 5: Cashier Accepts Payment

**Endpoint:** `POST {{base_url}}/api/cashier/payments/100/accept`

**Request:**
```json
{
  "payment_type": "cash",
  "reference_number": null
}
```

**Result:**
- Sale status changes to `"completed"`
- **Stock is updated** (quantity reduced)
- Notification is marked as read
- Payment record is created
- Returns receipt details

#### Step 6: View Sold Medicines Report

**Endpoint:** `GET {{base_url}}/api/cashier/reports/sold-medicines`

**Result:**
- Shows the sold medicine in the report
- Displays total quantity sold, revenue, etc.

---

### Return Flow: Customer Return with Receipt

This section demonstrates the complete return workflow when a customer wants to return items.

#### Step 1: Customer Provides Receipt Number

Customer provides receipt number (e.g., "REC-000008")

#### Step 2: Cashier Finds Sale by Receipt Number

**Endpoint:** `GET {{base_url}}/api/cashier/returns/receipt/REC-000008`

**Result:**
- Returns sale details with all items
- Shows `already_returned` quantity for each item
- Displays receipt number, date, pharmacist name

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Sale found successfully",
  "data": {
    "sale": {
      "sale_id": 8,
      "sale_date": "2024-01-15T10:30:00Z",
      "total_amount": 25.50,
      "status": "completed",
      "receipt_number": "REC-000008",
      "pharmacist_name": "John Pharmacist"
    },
    "items": [
      {
        "sale_item_id": 50,
        "medicine_id": 2,
        "medicine_name": "Paracetamol",
        "barcode": "1234567890123",
        "quantity": 2,
        "unit_price": 2.50,
        "subtotal": 5.00,
        "already_returned": 0
      }
    ]
  }
}
```

#### Step 3: Cashier Processes Return

**Endpoint:** `POST {{base_url}}/api/cashier/returns`

**Request:**
```json
{
  "sale_id": 8,
  "medicine_id": 2,
  "quantity_returned": 1,
  "return_reason": "defective",
  "return_condition": "damaged"
}
```

**Result:**
- Return record created
- **Stock is automatically added back** to inventory
- Return appears in reports

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Return processed successfully and stock updated",
  "data": {
    "return_id": 10,
    "sale_id": 8,
    "medicine_id": 2,
    "quantity_returned": 1,
    "return_reason": "defective",
    "return_condition": "damaged",
    "return_date": "2024-01-15T11:00:00Z",
    "status": "completed",
    "medicine_name": "Paracetamol",
    "barcode": "1234567890123"
  }
}
```

#### Step 4: Manager/Pharmacist Views Inventory Summary

**Manager Endpoint:** `GET {{base_url}}/api/manager/reports/inventory-summary`

**Pharmacist Endpoint:** `GET {{base_url}}/api/pharmacist/reports/inventory-summary`

**Result:**
- Shows updated stock quantities (includes returned items)
- Displays `recentReturns` information:
  - Total returns in last 30 days
  - Total quantity returned
  - Number of medicines returned

**Example Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMedicines": 150,
      "totalQuantity": 5012,
      "lowStockCount": 12,
      "expiringSoonCount": 5,
      "recentReturns": {
        "total_returns": 5,
        "total_quantity_returned": 12,
        "medicines_returned": 3
      }
    },
    "lowStockMedicines": [...],
    "expiredMedicines": [...]
  }
}
```

**Note:**
- The `totalQuantity` includes items that were returned and added back to stock
- `recentReturns` shows return activity in the last 30 days
- Both Manager and Pharmacist can see this information in their inventory summary

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

