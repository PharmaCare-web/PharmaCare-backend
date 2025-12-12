// Manager Dashboard Controller
// Provides branch-specific data for manager's own branch only
// All data is filtered by manager's branch_id

const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Get complete dashboard summary for manager's branch
const getDashboardSummary = async (req, res, next) => {
  try {
    const managerBranchId = req.user.branch_id;

    if (!managerBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Manager must belong to a branch'
      });
    }

    // Get branch overview
    const [branchInfo] = await pool.execute(
      `SELECT branch_id, branch_name, location, email, phone
       FROM branch
       WHERE branch_id = ?`,
      [managerBranchId]
    );

    if (branchInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const branch = branchInfo[0];

    // Get manager count (how many managers in this branch)
    const [managerCount] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM user u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.branch_id = ? 
       AND r.role_name = 'Manager'`,
      [managerBranchId]
    );

    // Get employee count (Pharmacists and Cashiers in this branch)
    const [employeeCount] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM user u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.branch_id = ? 
       AND r.role_name IN ('Pharmacist', 'Cashier')`,
      [managerBranchId]
    );

    // Get active/inactive employee counts (Pharmacists and Cashiers only)
    const [activeCount] = await pool.execute(
      `SELECT COUNT(*) as active
       FROM user u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.branch_id = ? 
       AND r.role_name IN ('Pharmacist', 'Cashier')
       AND u.is_active = TRUE`,
      [managerBranchId]
    );

    const [inactiveCount] = await pool.execute(
      `SELECT COUNT(*) as inactive
       FROM user u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.branch_id = ? 
       AND r.role_name IN ('Pharmacist', 'Cashier')
       AND u.is_active = FALSE`,
      [managerBranchId]
    );

    // Get inventory summary
    const [inventoryData] = await pool.execute(
      `SELECT 
         COUNT(*) as total_medicines,
         SUM(quantity_in_stock) as total_quantity,
         COUNT(CASE WHEN quantity_in_stock < 10 THEN 1 END) as low_stock_count,
         COUNT(CASE WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN 1 END) as expiring_soon_count,
         COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_count
       FROM medicine
       WHERE branch_id = ?`,
      [managerBranchId]
    );

    // Get sales summary (today, this week, this month)
    const [salesToday] = await pool.execute(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM sale
       WHERE branch_id = ? 
       AND sale_date::date = CURRENT_DATE
       AND status = 'completed'`,
      [managerBranchId]
    );

    const [salesThisWeek] = await pool.execute(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM sale
       WHERE branch_id = ? 
       AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(WEEK FROM sale_date) = EXTRACT(WEEK FROM CURRENT_DATE)
       AND status = 'completed'`,
      [managerBranchId]
    );

    const [salesThisMonth] = await pool.execute(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM sale
       WHERE branch_id = ? 
       AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND status = 'completed'`,
      [managerBranchId]
    );

    // Get pending sales/returns
    const [pendingSales] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM sale
       WHERE branch_id = ? 
       AND status != 'completed'`,
      [managerBranchId]
    );

    const [pendingReturns] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM return_table rt
       INNER JOIN sale s ON rt.sale_id = s.sale_id
       WHERE s.branch_id = ? 
       AND rt.status = 'pending'`,
      [managerBranchId]
    );

    // Get top 5 selling medicines
    const [topMedicines] = await pool.execute(
      `SELECT 
         m.medicine_id,
         m.name,
         SUM(si.quantity) as total_sold,
         SUM(si.subtotal) as total_revenue
       FROM sale_item si
       INNER JOIN sale s ON si.sale_id = s.sale_id
       INNER JOIN medicine m ON si.medicine_id = m.medicine_id
       WHERE s.branch_id = ?
       AND s.status = 'completed'
       GROUP BY m.medicine_id, m.name
       ORDER BY total_sold DESC
       LIMIT 5`,
      [managerBranchId]
    );

    // Get low stock medicines
    const [lowStockMedicines] = await pool.execute(
      `SELECT medicine_id, name, quantity_in_stock
       FROM medicine
       WHERE branch_id = ?
       AND quantity_in_stock < 10
       ORDER BY quantity_in_stock ASC
       LIMIT 10`,
      [managerBranchId]
    );

    // Get expired/expiring medicines
    const [expiredMedicines] = await pool.execute(
      `SELECT medicine_id, name, expiry_date, quantity_in_stock
       FROM medicine
       WHERE branch_id = ?
       AND expiry_date < CURRENT_DATE + INTERVAL '30 days'
       ORDER BY expiry_date ASC
       LIMIT 10`,
      [managerBranchId]
    );

    res.json({
      success: true,
      data: {
        branchOverview: {
          branchId: branch.branch_id,
          branchName: branch.branch_name,
          location: branch.location || null,
          email: branch.email || null,
          phone: branch.phone || null,
          totalManagers: parseInt(managerCount[0].total) || 0,
          totalEmployees: parseInt(employeeCount[0].total) || 0,
          activeEmployees: parseInt(activeCount[0].active) || 0,
          inactiveEmployees: parseInt(inactiveCount[0].inactive) || 0
        },
        inventorySummary: {
          totalMedicines: inventoryData[0].total_medicines,
          totalQuantity: parseInt(inventoryData[0].total_quantity) || 0,
          lowStockCount: inventoryData[0].low_stock_count,
          expiringSoonCount: inventoryData[0].expiring_soon_count,
          expiredCount: inventoryData[0].expired_count,
          lowStockMedicines: lowStockMedicines,
          expiredMedicines: expiredMedicines
        },
        salesSummary: {
          today: {
            count: salesToday[0].count,
            revenue: parseFloat(salesToday[0].revenue) || 0
          },
          thisWeek: {
            count: salesThisWeek[0].count,
            revenue: parseFloat(salesThisWeek[0].revenue) || 0
          },
          thisMonth: {
            count: salesThisMonth[0].count,
            revenue: parseFloat(salesThisMonth[0].revenue) || 0
          },
          pendingSales: pendingSales[0].count,
          pendingReturns: pendingReturns[0].count,
          topSellingMedicines: topMedicines
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
    const managerBranchId = req.user.branch_id;

    if (!managerBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Manager must belong to a branch'
      });
    }

    const [branchInfo] = await pool.execute(
      `SELECT branch_id, branch_name, location, email, phone
       FROM branch
       WHERE branch_id = ?`,
      [managerBranchId]
    );

    if (branchInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const [employeeCount] = await pool.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN u.is_active = TRUE THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN u.is_active = FALSE THEN 1 ELSE 0 END) as inactive
       FROM user u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.branch_id = ? 
       AND r.role_name IN ('Pharmacist', 'Cashier')`,
      [managerBranchId]
    );

    // Get manager count for this branch
    const [managerCount] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM user u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.branch_id = ? 
       AND r.role_name = 'Manager'`,
      [managerBranchId]
    );

    res.json({
      success: true,
      data: {
        branchId: branchInfo[0].branch_id,
        branchName: branchInfo[0].branch_name,
        location: branchInfo[0].location || null,
        email: branchInfo[0].email || null,
        phone: branchInfo[0].phone || null,
        totalManagers: parseInt(managerCount[0].total) || 0,
        totalEmployees: parseInt(employeeCount[0].total) || 0,
        activeEmployees: parseInt(employeeCount[0].active) || 0,
        inactiveEmployees: parseInt(employeeCount[0].inactive) || 0
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
    const managerBranchId = req.user.branch_id;

    const [inventoryData] = await pool.execute(
      `SELECT 
         COUNT(*) as total_medicines,
         SUM(quantity_in_stock) as total_quantity,
         COUNT(CASE WHEN quantity_in_stock < 10 THEN 1 END) as low_stock_count,
         COUNT(CASE WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' AND expiry_date >= CURRENT_DATE THEN 1 END) as expiring_soon_count,
         COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_count
       FROM medicine
       WHERE branch_id = ?`,
      [managerBranchId]
    );

    const [lowStockMedicines] = await pool.execute(
      `SELECT medicine_id, name, quantity_in_stock
       FROM medicine
       WHERE branch_id = ?
       AND quantity_in_stock < 10
       ORDER BY quantity_in_stock ASC`,
      [managerBranchId]
    );

    const [expiredMedicines] = await pool.execute(
      `SELECT medicine_id, name, expiry_date, quantity_in_stock
       FROM medicine
       WHERE branch_id = ?
       AND expiry_date < CURRENT_DATE + INTERVAL '30 days'
       ORDER BY expiry_date ASC`,
      [managerBranchId]
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalMedicines: inventoryData[0].total_medicines,
          totalQuantity: parseInt(inventoryData[0].total_quantity) || 0,
          lowStockCount: inventoryData[0].low_stock_count,
          expiringSoonCount: inventoryData[0].expiring_soon_count,
          expiredCount: inventoryData[0].expired_count
        },
        lowStockMedicines: lowStockMedicines,
        expiredMedicines: expiredMedicines
      },
      message: 'Inventory summary retrieved successfully'
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    next(error);
  }
};

// Get sales summary with day, month, year
const getSalesSummary = async (req, res, next) => {
  try {
    const managerBranchId = req.user.branch_id;
    const { year } = req.query; // Optional: filter by specific year

    const [salesToday] = await pool.execute(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM sale
       WHERE branch_id = ? 
       AND sale_date::date = CURRENT_DATE
       AND status = 'completed'`,
      [managerBranchId]
    );

    const [salesThisWeek] = await pool.execute(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM sale
       WHERE branch_id = ? 
       AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(WEEK FROM sale_date) = EXTRACT(WEEK FROM CURRENT_DATE)
       AND status = 'completed'`,
      [managerBranchId]
    );

    const [salesThisMonth] = await pool.execute(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM sale
       WHERE branch_id = ? 
       AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND status = 'completed'`,
      [managerBranchId]
    );

    // Get sales for current year
    const [salesThisYear] = await pool.execute(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(total_amount), 0) as revenue
       FROM sale
       WHERE branch_id = ? 
       AND YEAR(sale_date) = YEAR(CURRENT_DATE)
       AND status = 'completed'`,
      [managerBranchId]
    );

    // Get sales for specific year if provided
    let salesByYear = null;
    if (year) {
      const [yearSales] = await pool.execute(
        `SELECT 
           COUNT(*) as count,
           COALESCE(SUM(total_amount), 0) as revenue
         FROM sale
         WHERE branch_id = ? 
         AND EXTRACT(YEAR FROM sale_date) = ?
         AND status = 'completed'`,
        [managerBranchId, year]
      );
      salesByYear = {
        year: parseInt(year),
        count: yearSales[0].count,
        revenue: parseFloat(yearSales[0].revenue) || 0
      };
    }

    const [topMedicines] = await pool.execute(
      `SELECT 
         m.medicine_id,
         m.name,
         SUM(si.quantity) as total_sold,
         SUM(si.subtotal) as total_revenue
       FROM sale_item si
       INNER JOIN sale s ON si.sale_id = s.sale_id
       INNER JOIN medicine m ON si.medicine_id = m.medicine_id
       WHERE s.branch_id = ?
       AND s.status = 'completed'
       GROUP BY m.medicine_id, m.name
       ORDER BY total_sold DESC
       LIMIT 5`,
      [managerBranchId]
    );

    const [pendingSales] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM sale
       WHERE branch_id = ? 
       AND status != 'completed'`,
      [managerBranchId]
    );

    const [pendingReturns] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM return_table rt
       INNER JOIN sale s ON rt.sale_id = s.sale_id
       WHERE s.branch_id = ? 
       AND rt.status = 'pending'`,
      [managerBranchId]
    );

    res.json({
      success: true,
      data: {
        today: {
          count: salesToday[0].count,
          revenue: parseFloat(salesToday[0].revenue) || 0
        },
        thisWeek: {
          count: salesThisWeek[0].count,
          revenue: parseFloat(salesThisWeek[0].revenue) || 0
        },
        thisMonth: {
          count: salesThisMonth[0].count,
          revenue: parseFloat(salesThisMonth[0].revenue) || 0
        },
        thisYear: {
          count: salesThisYear[0].count,
          revenue: parseFloat(salesThisYear[0].revenue) || 0
        },
        byYear: salesByYear,
        pendingSales: pendingSales[0].count,
        pendingReturns: pendingReturns[0].count,
        topSellingMedicines: topMedicines
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
    const managerBranchId = req.user.branch_id;

    // Get notifications from notification table
    const [notifications] = await pool.execute(
      `SELECT notification_id, title, message, type, is_read, created_at
       FROM notification
       WHERE branch_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [managerBranchId]
    );

    // Get low stock alerts
    const [lowStockAlerts] = await pool.execute(
      `SELECT 
         CONCAT(name, ' stock is low (', quantity_in_stock, ' remaining)') as message,
         'warning' as type
       FROM medicine
       WHERE branch_id = ?
       AND quantity_in_stock < 10
       ORDER BY quantity_in_stock ASC
       LIMIT 5`,
      [managerBranchId]
    );

    // Get expired medicine alerts
    const [expiredAlerts] = await pool.execute(
      `SELECT 
         CONCAT(name, ' expired on ', expiry_date) as message,
         'error' as type
       FROM medicine
       WHERE branch_id = ?
       AND expiry_date < CURRENT_DATE
       ORDER BY expiry_date DESC
       LIMIT 5`,
      [managerBranchId]
    );

    // Get pending return alerts
    const [returnAlerts] = await pool.execute(
      `SELECT 
         CONCAT('Pending return for sale #', rt.sale_id) as message,
         'info' as type
       FROM return_table rt
       INNER JOIN sale s ON rt.sale_id = s.sale_id
       WHERE s.branch_id = ?
       AND rt.status = 'pending'
       LIMIT 5`,
      [managerBranchId]
    );

    const allAlerts = [
      ...notifications.map(n => ({
        id: n.notification_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        createdAt: n.created_at
      })),
      ...lowStockAlerts.map(a => ({
        id: null,
        title: 'Low Stock Alert',
        message: a.message,
        type: a.type,
        isRead: false,
        createdAt: new Date()
      })),
      ...expiredAlerts.map(a => ({
        id: null,
        title: 'Expired Medicine Alert',
        message: a.message,
        type: a.type,
        isRead: false,
        createdAt: new Date()
      })),
      ...returnAlerts.map(a => ({
        id: null,
        title: 'Pending Return',
        message: a.message,
        type: a.type,
        isRead: false,
        createdAt: new Date()
      }))
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

