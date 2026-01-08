# Pharmacist & Cashier Testing Guide

This guide provides step-by-step testing instructions for Pharmacist and Cashier workflows.

## 📋 Prerequisites

- Postman installed
- API server running
- Valid JWT tokens for Pharmacist and Cashier accounts
- Environment variable: `{{base_url}}` set (e.g., `http://localhost:5000` or your production URL)

---

## 🔐 Step 1: Authentication

### Login as Pharmacist

**Endpoint:** `POST {{base_url}}/api/auth/login`

**Body:**
```json
{
  "email": "pharmacist@example.com",
  "password": "your_password"
}
```

**Save:** Copy the `token` from response → Set as `{{pharmacist_token}}`

### Login as Cashier

**Endpoint:** `POST {{base_url}}/api/auth/login`

**Body:**
```json
{
  "email": "cashier@example.com",
  "password": "your_password"
}
```

**Save:** Copy the `token` from response → Set as `{{cashier_token}}`

---

## 👨‍⚕️ PHARMACIST WORKFLOW

### Test 1: Create Payment Request (Sale)

**Endpoint:** `POST {{base_url}}/api/pharmacist/sales`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "medicine_id": 2,
      "quantity": 2
    },
    {
      "medicine_id": 1,
      "quantity": 1
    }
  ],
  "payment_type": "cash",
  "customer_name": "John Doe",
  "customer_phone": "1234567890"
}
```

**Expected:** 201 Created
- Sale created with `status: "pending_payment"`
- Notification created for cashier
- Stock is NOT updated yet
- Save `sale_id` from response

**Verify:**
- ✅ Response contains `sale_id`
- ✅ Status is `"pending_payment"`
- ✅ Items are listed correctly

---

## 💰 CASHIER WORKFLOW

### Test 2: View Notifications

**Endpoint:** `GET {{base_url}}/api/cashier/notifications`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
```

**Expected:** 200 OK
- Shows notification with pharmacist name
- Shows sale ID in the message
- `sale_id` is extracted and available

**Verify:**
- ✅ Notification appears with pharmacist name
- ✅ Sale ID is visible
- ✅ `is_read: false` for new notifications

---

### Test 3: View Pending Payments

**Endpoint:** `GET {{base_url}}/api/cashier/payments/pending`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
```

**Expected:** 200 OK
- Lists all pending payment requests
- Shows pharmacist name, total amount, item count

**Verify:**
- ✅ Sale from Test 1 appears in the list
- ✅ Pharmacist name is shown
- ✅ Total amount is correct
- ✅ Item count matches

---

### Test 4: Get Payment Request Details

**Endpoint:** `GET {{base_url}}/api/cashier/payments/:sale_id`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
```

**Replace:** `:sale_id` with the sale_id from Test 1

**Expected:** 200 OK
- Shows complete sale details
- Lists all items with medicine names
- Shows quantities and prices

**Verify:**
- ✅ All items from Test 1 are listed
- ✅ Medicine names are correct
- ✅ Quantities match

---

### Test 5: Accept Payment

**Endpoint:** `POST {{base_url}}/api/cashier/payments/:sale_id/accept`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "payment_type": "cash",
  "reference_number": null
}
```

**Expected:** 200 OK
- Sale status changes to `"completed"`
- **Stock is updated** (reduced)
- Notification is marked as read
- Receipt number is generated

**Verify:**
- ✅ Status is `"completed"`
- ✅ Receipt number is in format `REC-000XXX`
- ✅ Items are listed
- ✅ Check stock quantity decreased (use inventory endpoint)

---

### Test 6: Get Receipt

**Endpoint:** `GET {{base_url}}/api/cashier/receipts/:sale_id`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
```

**Expected:** 200 OK
- Shows complete receipt details
- Includes all items, prices, totals

**Verify:**
- ✅ Receipt number matches
- ✅ All items are listed
- ✅ Totals are correct

---

### Test 7: View Sold Medicines Report

**Endpoint:** `GET {{base_url}}/api/cashier/reports/sold-medicines`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
```

**Expected:** 200 OK
- Shows the medicine from Test 5 in the report
- Displays total quantity sold, revenue

**Verify:**
- ✅ Medicine from Test 5 appears
- ✅ Quantity sold matches
- ✅ Revenue is calculated correctly

---

## 🔄 RETURN WORKFLOW

> **⚠️ Important:** To process a return, you must use **POST** method, not GET. The endpoint `/api/cashier/returns` only accepts POST requests.

### Test 8: Find Sale by Receipt Number

**Endpoint:** `GET {{base_url}}/api/cashier/returns/receipt/REC-000008`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
```

**Note:** Replace `REC-000008` with the actual receipt number from Test 5

**Expected:** 200 OK
- Returns sale details
- Shows all items with `already_returned` quantities

**Verify:**
- ✅ Sale is found
- ✅ Items are listed
- ✅ `already_returned: 0` for new items

---

### Test 9: Process Return

> **⚠️ CRITICAL:** This endpoint requires **POST** method, not GET. Make sure you select **POST** in Postman.

**Endpoint:** `POST {{base_url}}/api/cashier/returns`

**Method:** `POST` (not GET!)

**Headers:**
```
Authorization: Bearer {{cashier_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "sale_id": 8,
  "medicine_id": 2,
  "quantity_returned": 1,
  "return_reason": "defective",
  "return_condition": "damaged"
}
```

**Note:** Use the `sale_id` and `medicine_id` from Test 5

**Expected:** 201 Created
- Return record created
- **Stock is automatically added back**
- Return appears in reports

**Verify:**
- ✅ Return is created successfully
- ✅ Check stock quantity increased (use inventory endpoint)
- ✅ Return reason is saved

---

### Test 10: View Return Reports

**Endpoint:** `GET {{base_url}}/api/cashier/reports/returns`

**Headers:**
```
Authorization: Bearer {{cashier_token}}
```

**Expected:** 200 OK
- Shows the return from Test 9
- Includes summary statistics

**Verify:**
- ✅ Return from Test 9 appears
- ✅ Summary shows correct totals

---

## 📊 INVENTORY SUMMARY (Manager & Pharmacist)

### Test 11: Pharmacist - View Inventory Summary

**Endpoint:** `GET {{base_url}}/api/pharmacist/reports/inventory-summary`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
```

**Expected:** 200 OK
- Shows inventory summary
- Includes `recentReturns` information
- Stock quantities reflect returned items

**Verify:**
- ✅ Total quantity includes returned items
- ✅ `recentReturns` shows return statistics
- ✅ Stock levels are accurate

---

### Test 12: Manager - View Inventory Summary

**Endpoint:** `GET {{base_url}}/api/manager/reports/inventory-summary`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Expected:** 200 OK
- Shows inventory summary
- Includes `recentReturns` information
- Shows low stock and expired medicines

**Verify:**
- ✅ Total quantity includes returned items
- ✅ `recentReturns` shows return statistics
- ✅ Low stock medicines are listed

---

## ✅ Complete Test Checklist

### Payment Request Flow
- [ ] Pharmacist creates sale
- [ ] Cashier receives notification
- [ ] Cashier sees pending payment
- [ ] Cashier views payment details
- [ ] Cashier accepts payment
- [ ] Stock is reduced
- [ ] Receipt is generated
- [ ] Sold medicine appears in report

### Return Flow
- [ ] Customer provides receipt number
- [ ] Cashier finds sale by receipt number
- [ ] Cashier processes return with reason
- [ ] Stock is added back
- [ ] Return appears in return reports
- [ ] Return statistics appear in inventory summary (Manager)
- [ ] Return statistics appear in inventory summary (Pharmacist)

---

## 🔍 Verification Endpoints

### Check Stock After Sale
**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/:medicine_id`

**Expected:** Stock quantity decreased by sold quantity

### Check Stock After Return
**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/:medicine_id`

**Expected:** Stock quantity increased by returned quantity

---

## 📝 Test Data Examples

### Sample Medicine IDs
- Medicine ID 1: Paracetamol
- Medicine ID 2: Ibuprofen
- Medicine ID 3: Aspirin

### Sample Return Reasons
- "defective"
- "wrong item"
- "customer changed mind"
- "expired product"
- "damaged packaging"

### Sample Return Conditions
- "good" (can be resold)
- "damaged" (cannot be resold)
- "expired" (cannot be resold)

---

## 🐛 Common Test Scenarios

### Scenario 1: Multiple Items Sale
Create a sale with 3+ different medicines and verify all appear in pending payments.

### Scenario 2: Partial Return
Return only 1 item from a sale with multiple items. Verify:
- Only that item's stock is added back
- Other items remain sold
- `already_returned` shows correct quantity

### Scenario 3: Multiple Returns
Return items from the same sale multiple times. Verify:
- `already_returned` increments correctly
- Cannot return more than was sold
- Stock updates correctly each time

### Scenario 4: Return After Stock Check
1. Check stock quantity before return
2. Process return
3. Check stock quantity after return
4. Verify difference equals returned quantity

---

## 📊 Expected Results Summary

| Action | Stock Change | Report Update |
|--------|-------------|---------------|
| Pharmacist creates sale | ❌ No change | ❌ Not in sold report |
| Cashier accepts payment | ✅ Reduced | ✅ Appears in sold report |
| Cashier processes return | ✅ Increased | ✅ Appears in return report |
| View inventory summary | ✅ Reflects returns | ✅ Shows return stats |

---

## 🎯 Quick Test Sequence

Run these in order for a complete test:

1. **Login** → Get tokens
2. **Create Sale** (Pharmacist) → Note sale_id
3. **View Notifications** (Cashier) → Verify notification
4. **View Pending Payments** (Cashier) → Verify sale appears
5. **Accept Payment** (Cashier) → Note receipt number
6. **Check Stock** → Verify stock decreased
7. **View Sold Report** → Verify sale appears
8. **Find by Receipt** (Cashier) → Use receipt number
9. **Process Return** (Cashier) → Note return_id
10. **Check Stock** → Verify stock increased
11. **View Inventory Summary** (Pharmacist/Manager) → Verify return stats

---

## 🚨 Troubleshooting

### Error: "Cannot GET /api/cashier/returns" (404 Not Found)

**Problem:** You're using `GET` method instead of `POST`.

**Solution:**
1. Change the HTTP method from `GET` to `POST` in Postman
2. Make sure the URL is: `{{base_url}}/api/cashier/returns`
3. Ensure you have a JSON body with the return details
4. Verify the `Content-Type: application/json` header is set

**Correct Request:**
- Method: `POST` ✅
- URL: `{{base_url}}/api/cashier/returns`
- Body: JSON with `sale_id`, `medicine_id`, `quantity_returned`, etc.

**Incorrect Request:**
- Method: `GET` ❌ (This will cause 404 error)

### Error: "401 Unauthorized"

**Problem:** Missing or invalid authentication token.

**Solution:**
1. Make sure you're logged in as a cashier
2. Copy the token from the login response
3. Add it to the `Authorization` header: `Bearer {{cashier_token}}`

### Error: "403 Forbidden"

**Problem:** User doesn't have cashier role or password change is required.

**Solution:**
1. Verify the user has `role: 'cashier'` in the database
2. Make sure the user has changed their temporary password
3. Log in again to get a fresh token

### Error: "400 Bad Request" when processing return

**Problem:** Missing required fields or invalid data.

**Solution:**
1. Verify all required fields are present:
   - `sale_id` (integer)
   - `medicine_id` (integer)
   - `quantity_returned` (integer, must be > 0)
   - `return_reason` (string)
   - `return_condition` (string)
2. Check that `quantity_returned` doesn't exceed the sold quantity
3. Verify `sale_id` exists and payment was accepted

---

## 💡 Tips

- Use Postman environment variables for tokens
- Save sale_id and receipt_number for later tests
- Check stock quantities before and after operations
- Verify notifications are marked as read after payment acceptance
- Test with different return reasons and conditions

---

## 🔍 MEDICINE MANAGEMENT

### Test 13: Search Medicines by Category (Pharmacist)

**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/category/:category_id`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
```

**Example:**
```
GET {{base_url}}/api/pharmacist/medicines/category/1
```

**Expected:** 200 OK
- List of medicines in the specified category
- Includes category information

**Verify:**
- ✅ All medicines belong to the category
- ✅ Medicines are from pharmacist's branch

---

### Test 14: Search Medicines (Pharmacist)

**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/search?q=aspirin`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
```

**Query Parameters:**
- `q` or `search`: Search term (name, barcode, category, manufacturer)

**Expected:** 200 OK
- List of matching medicines

---

### Test 15: Add Medicine (Pharmacist)

**Endpoint:** `POST {{base_url}}/api/pharmacist/medicines`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "New Medicine",
  "category_id": 1,
  "price": 25.50,
  "quantity_in_stock": 100,
  "type": "Tablet",
  "barcode": "123456789",
  "manufacturer": "Pharma Co",
  "expiry_date": "2025-12-31"
}
```

**Expected:** 201 Created
- Medicine added to stock
- Returns created medicine details

**Verify:**
- ✅ Medicine appears in medicine list
- ✅ Stock quantity is correct

---

### Test 16: Update Medicine Stock (Pharmacist)

**Endpoint:** `PUT {{base_url}}/api/pharmacist/medicines/:medicine_id/stock`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
Content-Type: application/json
```

**Body (Absolute Quantity):**
```json
{
  "quantity_in_stock": 150
}
```

**Body (Relative Change):**
```json
{
  "action": "add",
  "quantity_change": 50
}
```

**Expected:** 200 OK
- Stock updated successfully

**Verify:**
- ✅ Stock quantity updated correctly

---

### Test 17: Delete Medicine (Pharmacist)

**Endpoint:** `DELETE {{base_url}}/api/pharmacist/medicines/:medicine_id`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
```

**Expected:** 200 OK
- Medicine removed from stock

**Verify:**
- ✅ Medicine no longer appears in list

---

### Test 18: Search Medicines by Category (Manager)

**Endpoint:** `GET {{base_url}}/api/manager/medicines/category/:category_id`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Example:**
```
GET {{base_url}}/api/manager/medicines/category/1
```

**Expected:** 200 OK
- List of medicines in the specified category

---

### Test 19: Search Medicines (Manager)

**Endpoint:** `GET {{base_url}}/api/manager/medicines/search?q=aspirin`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Query Parameters:**
- `q` or `search`: Search term

**Expected:** 200 OK
- List of matching medicines

---

### Test 20: Add Medicine (Manager)

**Endpoint:** `POST {{base_url}}/api/manager/medicines`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "New Medicine",
  "category_id": 1,
  "price": 25.50,
  "quantity_in_stock": 100,
  "type": "Tablet",
  "barcode": "123456789",
  "manufacturer": "Pharma Co",
  "expiry_date": "2025-12-31"
}
```

**Expected:** 201 Created
- Medicine added to stock

---

### Test 21: Update Medicine Stock (Manager)

**Endpoint:** `PUT {{base_url}}/api/manager/medicines/:medicine_id/stock`

**Headers:**
```
Authorization: Bearer {{manager_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "quantity_in_stock": 150,
  "price": 26.00
}
```

**Expected:** 200 OK
- Stock and/or price updated

---

### Test 22: Delete Medicine (Manager)

**Endpoint:** `DELETE {{base_url}}/api/manager/medicines/:medicine_id`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Expected:** 200 OK
- Medicine removed from stock

---

## 📈 SOLD ITEMS HISTORY

### Test 23: Get Sold Items History (Pharmacist)

**Endpoint:** `GET {{base_url}}/api/pharmacist/medicines/sold-items/history`

**Headers:**
```
Authorization: Bearer {{pharmacist_token}}
```

**Query Parameters:**
- `start_date` (optional): Start date filter (YYYY-MM-DD)
- `end_date` (optional): End date filter (YYYY-MM-DD)
- `medicine_id` (optional): Filter by medicine ID
- `category_id` (optional): Filter by category ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Example:**
```
GET {{base_url}}/api/pharmacist/medicines/sold-items/history?start_date=2024-01-01&end_date=2024-12-31&page=1&limit=50
```

**Expected:** 200 OK
- List of sold items with details
- Summary statistics
- Pagination information

**Response Structure:**
```json
{
  "success": true,
  "message": "Sold items history retrieved successfully",
  "data": {
    "items": [
      {
        "sale_item_id": 1,
        "sale_id": 5,
        "medicine_id": 2,
        "quantity": 2,
        "unit_price": 10.50,
        "subtotal": 21.00,
        "sold_date": "2024-01-15T10:30:00Z",
        "medicine_name": "Aspirin",
        "barcode": "123456",
        "medicine_type": "Tablet",
        "category_id": 1,
        "category_name": "Pain Relief",
        "sale_date": "2024-01-15T10:30:00Z",
        "sale_total": 21.00,
        "sale_status": "completed",
        "pharmacist_name": "John Doe"
      }
    ],
    "summary": {
      "total_items": 100,
      "total_quantity_sold": 250,
      "total_revenue": 5250.00,
      "unique_medicines": 15,
      "unique_sales": 50
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

**Verify:**
- ✅ Items are from pharmacist's sales only
- ✅ All sales have status "completed"
- ✅ Summary statistics are accurate
- ✅ Pagination works correctly

---

### Test 24: Get Sold Items History (Manager)

**Endpoint:** `GET {{base_url}}/api/manager/medicines/sold-items/history`

**Headers:**
```
Authorization: Bearer {{manager_token}}
```

**Query Parameters:**
- `start_date` (optional): Start date filter (YYYY-MM-DD)
- `end_date` (optional): End date filter (YYYY-MM-DD)
- `medicine_id` (optional): Filter by medicine ID
- `category_id` (optional): Filter by category ID
- `pharmacist_id` (optional): Filter by pharmacist ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Example:**
```
GET {{base_url}}/api/manager/medicines/sold-items/history?start_date=2024-01-01&pharmacist_id=5&page=1&limit=50
```

**Expected:** 200 OK
- List of all sold items from manager's branch
- Can filter by pharmacist
- Summary statistics
- Pagination information

**Verify:**
- ✅ Items are from manager's branch
- ✅ Can filter by pharmacist
- ✅ Summary includes all pharmacists' sales

---

## 🔗 Related Endpoints

### Pharmacist Endpoints
- `GET /api/pharmacist/medicines` - View all medicines
- `GET /api/pharmacist/medicines/search` - Search medicines
- `GET /api/pharmacist/medicines/category/:category_id` - Get medicines by category
- `GET /api/pharmacist/medicines/:medicine_id` - Get medicine by ID
- `POST /api/pharmacist/medicines` - Add medicine to stock
- `PUT /api/pharmacist/medicines/:medicine_id/stock` - Update medicine stock
- `DELETE /api/pharmacist/medicines/:medicine_id` - Delete medicine
- `GET /api/pharmacist/medicines/sold-items/history` - Sold items history
- `GET /api/pharmacist/dashboard` - Dashboard summary
- `GET /api/pharmacist/reports/inventory-summary` - Inventory summary
- `GET /api/pharmacist/reports/low-stock` - Low stock report
- `GET /api/pharmacist/reports/expiry` - Expiry report
- `POST /api/pharmacist/sales` - Create sale
- `GET /api/pharmacist/sales/:sale_id` - Get sale details

### Manager Endpoints
- `GET /api/manager/medicines` - View all medicines
- `GET /api/manager/medicines/search` - Search medicines
- `GET /api/manager/medicines/category/:category_id` - Get medicines by category
- `GET /api/manager/medicines/:medicine_id` - Get medicine by ID
- `POST /api/manager/medicines` - Add medicine to stock
- `PUT /api/manager/medicines/:medicine_id/stock` - Update medicine stock
- `DELETE /api/manager/medicines/:medicine_id` - Delete medicine
- `GET /api/manager/medicines/sold-items/history` - Sold items history

### Cashier Endpoints
- `GET /api/cashier/notifications` - View notifications
- `GET /api/cashier/payments/pending` - Pending payments
- `GET /api/cashier/payments/:sale_id` - Payment request details
- `POST /api/cashier/payments/:sale_id/accept` - Accept payment
- `GET /api/cashier/receipts/:sale_id` - Get receipt
- `GET /api/cashier/dashboard` - Dashboard summary
- `GET /api/cashier/reports/sold-medicines` - Sold medicines report
- `GET /api/cashier/reports/returns` - Return reports
- `GET /api/cashier/returns/sales` - Get sales for return
- `GET /api/cashier/returns/receipt/:receipt_number` - Find sale by receipt
- `GET /api/cashier/returns/sales/:sale_id/items` - Get sale items for return
- `POST /api/cashier/returns` - Process return

---

**Last Updated:** 2024-01-15
**Version:** 1.0

