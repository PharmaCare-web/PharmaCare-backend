// Admin Dashboard Controller
// Provides high-level summary data for admin dashboard
// Admin can ONLY see summaries, NOT detailed data

const pool = require('../config/database');

// Get dashboard summary (total branches, userss, sales count - NO revenue/profit data)
const getDashboardSummary = async (req, res, next) => {
  try {
    // Get total branches count
    const [branchCount] = await pool.execute(
      'SELECT COUNT(*) as total FROM branch'
    );
    const totalBranches = branchCount[0].total;

    // Get total userss count (excluding admin)
    const [usersCount] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE r.role_name != 'Admin' OR r.role_name IS NULL`
    );
    const totalUsers = usersCount[0].total;

    // Get manager counts (pending and activated)
    const [pendingManagers] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE r.role_name = 'Manager' AND u.is_active = FALSE`
    );

    const [activatedManagers] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE r.role_name = 'Manager' AND u.is_active = TRUE`
    );

    // Get total sales count only (NO revenue/profit data for admin)
    const [salesData] = await pool.execute(
      `SELECT COUNT(*) as total_sales
       FROM sale
       WHERE status = 'completed'`
    );
    const totalSales = salesData[0].total_sales;

    res.json({
      success: true,
      data: {
        summary: {
          totalBranches: totalBranches,
          totalUsers: totalUsers,
          totalSales: totalSales,
          pendingManagers: pendingManagers[0].total,
          activatedManagers: activatedManagers[0].total
        }
      },
      message: 'Dashboard summary retrieved successfully'
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    next(error);
  }
};

// Get total branches count
const getTotalBranches = async (req, res, next) => {
  try {
    const [result] = await pool.execute('SELECT COUNT(*) as total FROM branch');
    res.json({
      success: true,
      data: {
        totalBranches: result[0].total
      },
      message: 'Total branches retrieved successfully'
    });
  } catch (error) {
    console.error('Get total branches error:', error);
    next(error);
  }
};

// Get total userss count (excluding admin)
const getTotalUsers = async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE r.role_name != 'Admin' OR r.role_name IS NULL`
    );
    res.json({
      success: true,
      data: {
        totalUsers: result[0].total
      },
      message: 'Total userss retrieved successfully'
    });
  } catch (error) {
    console.error('Get total userss error:', error);
    next(error);
  }
};

// Get total sales summary (count only, NO revenue data for admin)
const getTotalSales = async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      `SELECT COUNT(*) as total_sales
       FROM sale
       WHERE status = 'completed'`
    );
    res.json({
      success: true,
      data: {
        totalSales: result[0].total_sales
      },
      message: 'Total sales retrieved successfully'
    });
  } catch (error) {
    console.error('Get total sales error:', error);
    next(error);
  }
};

// Get branch list (NO financial data - admin cannot see revenue/profit)
const getBranchList = async (req, res, next) => {
  try {
    const [branches] = await pool.execute(
      `SELECT 
         b.branch_id,
         b.branch_name,
         b.location,
         COUNT(DISTINCT u.user_id) as total_employees
       FROM branch b
       LEFT JOIN users u ON b.branch_id = u.branch_id
       GROUP BY b.branch_id, b.branch_name, b.location
       ORDER BY b.branch_name ASC`
    );

    res.json({
      success: true,
      data: branches.map(branch => ({
        branchId: branch.branch_id,
        branchName: branch.branch_name,
        location: branch.location,
        totalEmployees: branch.total_employees
      })),
      message: 'Branch list retrieved successfully'
    });
  } catch (error) {
    console.error('Get branch list error:', error);
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getTotalBranches,
  getTotalUsers,
  getTotalSales,
  getBranchList
};

