// Manager Dashboard Controller
// Provides branch-specific data for manager's own branch only
// All data is filtered by manager's branch_id

const pool = require('../config/database');

// Get complete dashboard summary for manager's branch
const getDashboardSummary = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;

    if (!managerBranchId) {
      return res.status(400).json({ success: false, message: 'Manager must belong to a branch' });
    }

    const branchInfo = await pool.query(
      'SELECT branch_id, branch_name, location, email, phone FROM branch WHERE branch_id = $1',
      [managerBranchId]
    );
    if (branchInfo.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    const branch = branchInfo.rows[0];

    const [managerCount, employeeCount, activeCount, inactiveCount, inventoryData,
      salesToday, salesThisWeek, salesThisMonth, pendingSales, pendingReturns,
      topMedicines, lowStockMedicines, expiredMedicines] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total FROM users u LEFT JOIN role r ON u.role_id=r.role_id WHERE u.branch_id=$1 AND r.role_name='Manager'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as total FROM users u LEFT JOIN role r ON u.role_id=r.role_id WHERE u.branch_id=$1 AND r.role_name IN ('Pharmacist','Cashier')`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as active FROM users u LEFT JOIN role r ON u.role_id=r.role_id WHERE u.branch_id=$1 AND r.role_name IN ('Pharmacist','Cashier') AND u.is_active=TRUE`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as inactive FROM users u LEFT JOIN role r ON u.role_id=r.role_id WHERE u.branch_id=$1 AND r.role_name IN ('Pharmacist','Cashier') AND u.is_active=FALSE`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as total_medicines, COALESCE(SUM(quantity_in_stock),0) as total_quantity,
        COUNT(CASE WHEN quantity_in_stock < 10 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN 1 END) as expiring_soon_count,
        COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_count
        FROM medicine WHERE branch_id=$1`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND DATE(sale_date)=CURRENT_DATE AND status='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND EXTRACT(YEAR FROM sale_date)=EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(WEEK FROM sale_date)=EXTRACT(WEEK FROM CURRENT_DATE) AND status='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND EXTRACT(YEAR FROM sale_date)=EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM sale_date)=EXTRACT(MONTH FROM CURRENT_DATE) AND status='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count FROM sale WHERE branch_id=$1 AND status!='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count FROM return_table rt INNER JOIN sale s ON rt.sale_id=s.sale_id WHERE s.branch_id=$1 AND rt.status='pending'`, [managerBranchId]),
      pool.query(`SELECT m.medicine_id, m.name, SUM(si.quantity) as total_sold, SUM(si.subtotal) as total_revenue FROM sale_item si INNER JOIN sale s ON si.sale_id=s.sale_id INNER JOIN medicine m ON si.medicine_id=m.medicine_id WHERE s.branch_id=$1 AND s.status='completed' GROUP BY m.medicine_id, m.name ORDER BY total_sold DESC LIMIT 5`, [managerBranchId]),
      pool.query(`SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE branch_id=$1 AND quantity_in_stock < 10 ORDER BY quantity_in_stock ASC LIMIT 10`, [managerBranchId]),
      pool.query(`SELECT medicine_id, name, expiry_date, quantity_in_stock FROM medicine WHERE branch_id=$1 AND expiry_date < CURRENT_DATE + INTERVAL '30 days' ORDER BY expiry_date ASC LIMIT 10`, [managerBranchId]),
    ]);

    res.json({
      success: true,
      data: {
        branchOverview: {
          branchId: branch.branch_id, branchName: branch.branch_name,
          location: branch.location || null, email: branch.email || null, phone: branch.phone || null,
          totalManagers: parseInt(managerCount.rows[0].total) || 0,
          totalEmployees: parseInt(employeeCount.rows[0].total) || 0,
          activeEmployees: parseInt(activeCount.rows[0].active) || 0,
          inactiveEmployees: parseInt(inactiveCount.rows[0].inactive) || 0,
          totalStaff: parseInt(employeeCount.rows[0].total) || 0,
        },
        inventorySummary: {
          totalMedicines: parseInt(inventoryData.rows[0].total_medicines) || 0,
          total_medicines: parseInt(inventoryData.rows[0].total_medicines) || 0,
          totalQuantity: parseInt(inventoryData.rows[0].total_quantity) || 0,
          lowStockCount: parseInt(inventoryData.rows[0].low_stock_count) || 0,
          low_stock: parseInt(inventoryData.rows[0].low_stock_count) || 0,
          expiringSoonCount: parseInt(inventoryData.rows[0].expiring_soon_count) || 0,
          expiredCount: parseInt(inventoryData.rows[0].expired_count) || 0,
          lowStockMedicines: lowStockMedicines.rows,
          expiredMedicines: expiredMedicines.rows
        },
        salesSummary: {
          today: { count: parseInt(salesToday.rows[0].count)||0, revenue: parseFloat(salesToday.rows[0].revenue)||0 },
          thisWeek: { count: parseInt(salesThisWeek.rows[0].count)||0, revenue: parseFloat(salesThisWeek.rows[0].revenue)||0 },
          thisMonth: { count: parseInt(salesThisMonth.rows[0].count)||0, revenue: parseFloat(salesThisMonth.rows[0].revenue)||0 },
          pendingSales: parseInt(pendingSales.rows[0].count)||0,
          pendingReturns: parseInt(pendingReturns.rows[0].count)||0,
          topSellingMedicines: topMedicines.rows
        }
      },
      message: 'Dashboard summary retrieved successfully'
    });
  } catch (error) {
    console.error('Get manager dashboard error:', error);
    next(error);
  }
};

// Get branch overview only
const getBranchOverview = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    if (!managerBranchId) return res.status(400).json({ success: false, message: 'Manager must belong to a branch' });

    const branchInfo = await pool.query('SELECT branch_id, branch_name, location, email, phone FROM branch WHERE branch_id=$1', [managerBranchId]);
    if (branchInfo.rows.length === 0) return res.status(404).json({ success: false, message: 'Branch not found' });

    const [employeeCount, managerCount] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN u.is_active=TRUE THEN 1 ELSE 0 END) as active, SUM(CASE WHEN u.is_active=FALSE THEN 1 ELSE 0 END) as inactive FROM users u LEFT JOIN role r ON u.role_id=r.role_id WHERE u.branch_id=$1 AND r.role_name IN ('Pharmacist','Cashier')`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as total FROM users u LEFT JOIN role r ON u.role_id=r.role_id WHERE u.branch_id=$1 AND r.role_name='Manager'`, [managerBranchId]),
    ]);

    const b = branchInfo.rows[0];
    res.json({
      success: true,
      data: {
        branchId: b.branch_id, branchName: b.branch_name, location: b.location||null, email: b.email||null, phone: b.phone||null,
        totalManagers: parseInt(managerCount.rows[0].total)||0,
        totalEmployees: parseInt(employeeCount.rows[0].total)||0,
        activeEmployees: parseInt(employeeCount.rows[0].active)||0,
        inactiveEmployees: parseInt(employeeCount.rows[0].inactive)||0
      },
      message: 'Branch overview retrieved successfully'
    });
  } catch (error) {
    console.error('Get branch overview error:', error);
    next(error);
  }
};

// Get inventory summary
const getInventorySummary = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;

    const [inventoryData, lowStockMedicines, expiredMedicines] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total_medicines, COALESCE(SUM(quantity_in_stock),0) as total_quantity,
        COUNT(CASE WHEN quantity_in_stock < 10 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN 1 END) as expiring_soon_count,
        COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_count
        FROM medicine WHERE branch_id=$1`, [managerBranchId]),
      pool.query(`SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE branch_id=$1 AND quantity_in_stock < 10 ORDER BY quantity_in_stock ASC`, [managerBranchId]),
      pool.query(`SELECT medicine_id, name, expiry_date, quantity_in_stock FROM medicine WHERE branch_id=$1 AND expiry_date < CURRENT_DATE + INTERVAL '30 days' ORDER BY expiry_date ASC`, [managerBranchId]),
    ]);

    const inv = inventoryData.rows[0];
    res.json({
      success: true,
      data: {
        total_medicines: parseInt(inv.total_medicines)||0,
        totalMedicines: parseInt(inv.total_medicines)||0,
        in_stock: Math.max(0, parseInt(inv.total_medicines) - parseInt(inv.low_stock_count) - parseInt(inv.expired_count)),
        inStock: Math.max(0, parseInt(inv.total_medicines) - parseInt(inv.low_stock_count) - parseInt(inv.expired_count)),
        low_stock: parseInt(inv.low_stock_count)||0,
        lowStock: parseInt(inv.low_stock_count)||0,
        out_of_stock: parseInt(inv.expired_count)||0,
        outOfStock: parseInt(inv.expired_count)||0,
        expiring_soon: parseInt(inv.expiring_soon_count)||0,
        expiringSoon: parseInt(inv.expiring_soon_count)||0,
        totalQuantity: parseInt(inv.total_quantity)||0,
        summary: {
          totalMedicines: parseInt(inv.total_medicines)||0,
          totalQuantity: parseInt(inv.total_quantity)||0,
          lowStockCount: parseInt(inv.low_stock_count)||0,
          expiringSoonCount: parseInt(inv.expiring_soon_count)||0,
          expiredCount: parseInt(inv.expired_count)||0,
        },
        lowStockMedicines: lowStockMedicines.rows,
        expiredMedicines: expiredMedicines.rows
      },
      message: 'Inventory summary retrieved successfully'
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    next(error);
  }
};

// Get sales summary with monthly breakdown
const getSalesSummary = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const [salesToday, salesThisWeek, salesThisMonth, salesThisYear,
      monthlySales, topMedicines, pendingSales, pendingReturns] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND DATE(sale_date)=CURRENT_DATE AND status='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND EXTRACT(YEAR FROM sale_date)=EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(WEEK FROM sale_date)=EXTRACT(WEEK FROM CURRENT_DATE) AND status='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND EXTRACT(YEAR FROM sale_date)=EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM sale_date)=EXTRACT(MONTH FROM CURRENT_DATE) AND status='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND EXTRACT(YEAR FROM sale_date)=$2 AND status='completed'`, [managerBranchId, year]),
      pool.query(`SELECT EXTRACT(MONTH FROM sale_date) as month, COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM sale WHERE branch_id=$1 AND EXTRACT(YEAR FROM sale_date)=$2 AND status='completed' GROUP BY month ORDER BY month`, [managerBranchId, year]),
      pool.query(`SELECT m.medicine_id, m.name, SUM(si.quantity) as total_sold, SUM(si.subtotal) as total_revenue FROM sale_item si INNER JOIN sale s ON si.sale_id=s.sale_id INNER JOIN medicine m ON si.medicine_id=m.medicine_id WHERE s.branch_id=$1 AND s.status='completed' GROUP BY m.medicine_id, m.name ORDER BY total_sold DESC LIMIT 5`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count FROM sale WHERE branch_id=$1 AND status!='completed'`, [managerBranchId]),
      pool.query(`SELECT COUNT(*) as count FROM return_table rt INNER JOIN sale s ON rt.sale_id=s.sale_id WHERE s.branch_id=$1 AND rt.status='pending'`, [managerBranchId]),
    ]);

    // Build 12-element monthly array
    const monthlyArr = Array(12).fill(0);
    monthlySales.rows.forEach(r => { monthlyArr[parseInt(r.month) - 1] = parseFloat(r.revenue) || 0; });

    res.json({
      success: true,
      data: {
        today: { count: parseInt(salesToday.rows[0].count)||0, revenue: parseFloat(salesToday.rows[0].revenue)||0 },
        thisWeek: { count: parseInt(salesThisWeek.rows[0].count)||0, revenue: parseFloat(salesThisWeek.rows[0].revenue)||0 },
        thisMonth: { count: parseInt(salesThisMonth.rows[0].count)||0, revenue: parseFloat(salesThisMonth.rows[0].revenue)||0 },
        thisYear: { count: parseInt(salesThisYear.rows[0].count)||0, revenue: parseFloat(salesThisYear.rows[0].revenue)||0 },
        byYear: { year, count: parseInt(salesThisYear.rows[0].count)||0, revenue: parseFloat(salesThisYear.rows[0].revenue)||0 },
        monthly: monthlyArr,
        monthlySales: monthlySales.rows.map(r => ({ month: parseInt(r.month), count: parseInt(r.count), revenue: parseFloat(r.revenue)||0 })),
        pendingSales: parseInt(pendingSales.rows[0].count)||0,
        pendingReturns: parseInt(pendingReturns.rows[0].count)||0,
        topSellingMedicines: topMedicines.rows
      },
      message: 'Sales summary retrieved successfully'
    });
  } catch (error) {
    console.error('Get sales summary error:', error);
    next(error);
  }
};

// Get notifications/alerts
const getNotifications = async (req, res, next) => {
  try {
    const managerBranchId = req.users.branch_id;

    const [notifications, lowStockAlerts, expiredAlerts, returnAlerts] = await Promise.all([
      pool.query(`SELECT notification_id, title, message, type, is_read, created_at FROM notification WHERE branch_id=$1 ORDER BY created_at DESC LIMIT 20`, [managerBranchId]),
      pool.query(`SELECT name || ' stock is low (' || quantity_in_stock || ' remaining)' as message, 'warning' as type FROM medicine WHERE branch_id=$1 AND quantity_in_stock < 10 ORDER BY quantity_in_stock ASC LIMIT 5`, [managerBranchId]),
      pool.query(`SELECT name || ' expired on ' || expiry_date as message, 'error' as type FROM medicine WHERE branch_id=$1 AND expiry_date < CURRENT_DATE ORDER BY expiry_date DESC LIMIT 5`, [managerBranchId]),
      pool.query(`SELECT 'Pending return for sale #' || rt.sale_id as message, 'info' as type FROM return_table rt INNER JOIN sale s ON rt.sale_id=s.sale_id WHERE s.branch_id=$1 AND rt.status='pending' LIMIT 5`, [managerBranchId]),
    ]);

    const allAlerts = [
      ...notifications.rows.map(n => ({ id: n.notification_id, title: n.title, message: n.message, type: n.type, is_read: n.is_read, createdAt: n.created_at })),
      ...lowStockAlerts.rows.map(a => ({ id: null, title: 'Low Stock Alert', message: a.message, type: a.type, is_read: false, createdAt: new Date() })),
      ...expiredAlerts.rows.map(a => ({ id: null, title: 'Expired Medicine Alert', message: a.message, type: a.type, is_read: false, createdAt: new Date() })),
      ...returnAlerts.rows.map(a => ({ id: null, title: 'Pending Return', message: a.message, type: a.type, is_read: false, createdAt: new Date() })),
    ];

    res.json({
      success: true,
      data: allAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getBranchOverview,
  getInventorySummary,
  getSalesSummary,
  getNotifications
};
