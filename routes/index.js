// Optional: separate route files
// Example route handling

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminManagerController = require('../controllers/adminManagerController');
const managerDashboardController = require('../controllers/managerDashboardController');
const managerStaffController = require('../controllers/managerStaffController');
const managerMedicineController = require('../controllers/managerMedicineController');
const managerBranchController = require('../controllers/managerBranchController');
const managerSalesController = require('../controllers/managerSalesController');
const managerSettingsController = require('../controllers/managerSettingsController');
const medicineController = require('../controllers/medicineController');
const pharmacistController = require('../controllers/pharmacistController');
const cashierController = require('../controllers/cashierController');
const authRoutes = require('./authRoutes');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const managerAuth = require('../middleware/managerAuth');
const pharmacistAuth = require('../middleware/pharmacistAuth');
const cashierAuth = require('../middleware/cashierAuth');
const requirePasswordChange = require('../middleware/requirePasswordChange');

// Authentication routes
router.use('/auth', authRoutes);

// Admin Dashboard Routes (Admin only - summary data only)
router.get('/admin/dashboard', authMiddleware, adminAuth, adminDashboardController.getDashboardSummary);
router.get('/admin/dashboard/branches', authMiddleware, adminAuth, adminDashboardController.getTotalBranches);
router.get('/admin/dashboard/users', authMiddleware, adminAuth, adminDashboardController.getTotalUsers);
router.get('/admin/dashboard/sales', authMiddleware, adminAuth, adminDashboardController.getTotalSales);
router.get('/admin/dashboard/branches-list', authMiddleware, adminAuth, adminDashboardController.getBranchList);

// Admin Manager Management Routes (Admin only - view and activate managers)
router.get('/admin/managers', authMiddleware, adminAuth, adminManagerController.getAllManagers);
router.get('/admin/managers/pending', authMiddleware, adminAuth, adminManagerController.getPendingManagers);
router.get('/admin/managers/activated', authMiddleware, adminAuth, adminManagerController.getActivatedManagers);
router.get('/admin/managers/branch/:branch_id', authMiddleware, adminAuth, adminManagerController.getManagersByBranch);
router.put('/admin/managers/:user_id/activate', authMiddleware, adminAuth, adminManagerController.activateManager);
router.put('/admin/managers/:user_id/deactivate', authMiddleware, adminAuth, adminManagerController.deactivateManager);
router.post('/admin/managers', authMiddleware, adminAuth, adminManagerController.createManager);
router.post('/admin/managers/verify', authMiddleware, adminAuth, adminManagerController.verifyManager);
router.put('/admin/managers/:id', authMiddleware, adminAuth, adminManagerController.updateManager);
router.delete('/admin/managers/:id', authMiddleware, adminAuth, adminManagerController.deleteManager);
router.post('/admin/managers/:id/reset-password', authMiddleware, adminAuth, adminManagerController.resetManagerPassword);
router.get('/admin/audit-logs', authMiddleware, adminAuth, adminManagerController.getAuditLogs);

// Shorter alias routes for activation (for convenience)
// Note: PUT is preferred for state-changing operations, but GET is also supported for convenience
router.put('/admin/activate/:id', authMiddleware, adminAuth, (req, res, next) => {
  req.params.user_id = req.params.id;
  adminManagerController.activateManager(req, res, next);
});
router.get('/admin/activate/:id', authMiddleware, adminAuth, (req, res, next) => {
  req.params.user_id = req.params.id;
  adminManagerController.activateManager(req, res, next);
});
router.put('/admin/deactivate/:id', authMiddleware, adminAuth, (req, res, next) => {
  req.params.user_id = req.params.id;
  adminManagerController.deactivateManager(req, res, next);
});
router.get('/admin/deactivate/:id', authMiddleware, adminAuth, (req, res, next) => {
  req.params.user_id = req.params.id;
  adminManagerController.deactivateManager(req, res, next);
});

// Manager Dashboard Routes (Manager only - branch-specific data)
router.get('/manager/dashboard', authMiddleware, managerAuth, managerDashboardController.getDashboardSummary);
router.get('/manager/dashboard/branch', authMiddleware, managerAuth, managerDashboardController.getBranchOverview);
router.get('/manager/dashboard/inventory', authMiddleware, managerAuth, managerDashboardController.getInventorySummary);
router.get('/manager/dashboard/sales', authMiddleware, managerAuth, managerDashboardController.getSalesSummary);
router.get('/manager/dashboard/notifications', authMiddleware, managerAuth, managerDashboardController.getNotifications);
router.get('/manager/dashboard/top-selling', authMiddleware, managerAuth, managerDashboardController.getTopSelling);

// Manager Staff Management Routes (Manager only - manage their branch staff)
router.post('/manager/staff', authMiddleware, managerAuth, managerStaffController.createStaff);
router.post('/manager/staff/verify', authMiddleware, managerAuth, managerStaffController.verifyStaffCode);
router.get('/manager/staff', authMiddleware, managerAuth, managerStaffController.getStaffMembers);
router.put('/manager/staff/:user_id', authMiddleware, managerAuth, managerStaffController.updateStaff);
router.delete('/manager/staff/:user_id', authMiddleware, managerAuth, managerStaffController.removeStaff);
router.post('/manager/staff/:user_id/reset-password', authMiddleware, managerAuth, managerStaffController.resetStaffPassword);

// Manager can create other manager accounts (requires admin activation)
router.post('/manager/managers', authMiddleware, managerAuth, managerStaffController.createManager);

// Manager Medicine Management Routes (Manager only - view and manage medicines)
router.get('/manager/medicines', authMiddleware, managerAuth, managerMedicineController.getAllMedicines);
router.get('/manager/medicines/search', authMiddleware, managerAuth, managerMedicineController.searchMedicines);
router.get('/manager/medicines/category/:category_id', authMiddleware, managerAuth, managerMedicineController.getMedicinesByCategory);
router.get('/manager/medicines/:medicine_id', authMiddleware, managerAuth, managerMedicineController.getMedicineById);
router.post('/manager/medicines', authMiddleware, managerAuth, managerMedicineController.addMedicineToStock);
router.put('/manager/medicines/:medicine_id/stock', authMiddleware, managerAuth, managerMedicineController.updateMedicineStock);
router.delete('/manager/medicines/:medicine_id', authMiddleware, managerAuth, managerMedicineController.removeMedicineFromStock);
router.get('/manager/medicines/sold-items/history', authMiddleware, managerAuth, managerMedicineController.getSoldItemsHistory);

// Manager Branch Management Routes (Manager only - manage branches)
router.get('/manager/branches', authMiddleware, managerAuth, managerBranchController.getAllBranches);
router.post('/manager/branches', authMiddleware, managerAuth, managerBranchController.createBranch);
router.post('/manager/branches/request', authMiddleware, managerAuth, managerBranchController.requestBranch);
router.put('/manager/branches/:id', authMiddleware, managerAuth, managerBranchController.updateBranch);
router.delete('/manager/branches/:id', authMiddleware, managerAuth, managerBranchController.deleteBranch);
router.put('/manager/branches/:id/activate', authMiddleware, managerAuth, managerBranchController.activateBranch);
router.put('/manager/branches/:id/deactivate', authMiddleware, managerAuth, managerBranchController.deactivateBranch);

// Manager Sales & Payments Routes (Manager only - sales, payments, refunds, audit trail)
router.post('/manager/sales', authMiddleware, managerAuth, managerSalesController.createSale);
router.post('/manager/sales/:id/payment', authMiddleware, managerAuth, managerSalesController.processPayment);
router.post('/manager/sales/:id/refund', authMiddleware, managerAuth, managerSalesController.processRefund);
router.get('/manager/audit-trail', authMiddleware, managerAuth, managerSalesController.getAuditTrail);
router.get('/manager/audit-trail/:id', authMiddleware, managerAuth, managerSalesController.getAuditTrailById);

// Manager Settings Routes (Manager only - refund policy)
router.get('/manager/settings/refund-policy', authMiddleware, managerAuth, managerSettingsController.getRefundPolicy);
router.put('/manager/settings/refund-policy', authMiddleware, managerAuth, managerSettingsController.updateRefundPolicy);

// ============================================================================
// PHARMACIST ROUTES (Pharmacist only - view medicines, inventory, sales, reports)
// ============================================================================

// 1. Medicine Information (View Only)
router.get('/pharmacist/medicines', authMiddleware, requirePasswordChange, pharmacistAuth, medicineController.getAllMedicines);
router.get('/pharmacist/medicines/search', authMiddleware, requirePasswordChange, pharmacistAuth, medicineController.searchMedicines);
router.get('/pharmacist/medicines/category/:category_id', authMiddleware, requirePasswordChange, pharmacistAuth, medicineController.getMedicinesByCategory);
router.get('/pharmacist/medicines/:medicine_id', authMiddleware, requirePasswordChange, pharmacistAuth, medicineController.getMedicineById);

// 2. Inventory Interactions (Limited)
router.post('/pharmacist/inventory/request-restock', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.requestRestock);
router.post('/pharmacist/inventory/mark-low-stock', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.markLowStock);
router.get('/pharmacist/inventory/stock-history', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.getStockHistory);

// 2.5. Medicine Stock Management (Add/Remove Medicine)
router.post('/pharmacist/medicines', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.addMedicineToStock);
router.put('/pharmacist/medicines/:medicine_id/stock', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.updateMedicineStock);
router.delete('/pharmacist/medicines/:medicine_id', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.removeMedicineFromStock);

// 3. Sales Support
router.post('/pharmacist/sales', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.createSale);
router.get('/pharmacist/sales/:sale_id', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.getSaleById);

// 4. Reports (Limited)
router.get('/pharmacist/reports/low-stock', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.getLowStockReport);
router.get('/pharmacist/reports/expiry', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.getExpiryReport);
router.get('/pharmacist/reports/inventory-summary', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.getInventorySummary);

// 5. Dashboard
router.get('/pharmacist/dashboard', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.getDashboard);

// 6. Sold Items History
router.get('/pharmacist/medicines/sold-items/history', authMiddleware, requirePasswordChange, pharmacistAuth, pharmacistController.getSoldItemsHistory);

// ============================================================================
// CASHIER ROUTES (Cashier only - payment acceptance, receipts, returns, reports)
// ============================================================================

// 1. Payment Management
router.get('/cashier/payments/pending', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getPendingPayments);
router.get('/cashier/payments/:sale_id', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getPaymentRequestDetails);
router.post('/cashier/payments/:sale_id/accept', authMiddleware, requirePasswordChange, cashierAuth, cashierController.acceptPayment);
router.get('/cashier/receipts/:sale_id', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getReceipt);

// 2. Payment Reports
router.get('/cashier/reports/payments', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getPaymentReports);
router.get('/cashier/reports/sold-medicines', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getSoldMedicinesReport);

// 3. Notifications
router.get('/cashier/notifications', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getNotifications);

// 3. Return Management
router.get('/cashier/returns/sales', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getSalesForReturn);
router.get('/cashier/returns/receipt/:receipt_number', authMiddleware, requirePasswordChange, cashierAuth, cashierController.findSaleByReceiptNumber);
router.get('/cashier/returns/sales/:sale_id/items', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getSaleItemsForReturn);
router.post('/cashier/returns', authMiddleware, requirePasswordChange, cashierAuth, cashierController.processReturn);
router.get('/cashier/reports/returns', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getReturnReports);

// 4. Dashboard
router.get('/cashier/dashboard', authMiddleware, requirePasswordChange, cashierAuth, cashierController.getDashboard);

// Protected user routes (require authentication)
router.get('/users', authMiddleware, userController.getAllUsers);
router.get('/users/:id', authMiddleware, userController.getUserById);
router.post('/users', authMiddleware, userController.createUser);
router.put('/users/:id', authMiddleware, userController.updateUser);
router.delete('/users/:id', authMiddleware, userController.deleteUser);

// Debug routes (for troubleshooting - remove in production)
const debugController = require('../controllers/debugController');
router.get('/debug/account-status', debugController.checkAccountStatus);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

