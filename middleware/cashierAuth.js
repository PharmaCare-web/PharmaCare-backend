// Cashier Authentication Middleware
// Ensures only users with 'Cashier' role can access certain routes

const pool = require('../config/database');

const cashierAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated (from authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user's role from database to ensure it's current
    const [users] = await pool.execute(
      `SELECT u.user_id, u.role_id, u.branch_id, u.is_active, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact your manager.'
      });
    }

    // Check if user is a Cashier
    if (user.role_name !== 'Cashier') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cashier role required.'
      });
    }

    // Check if cashier belongs to a branch
    if (!user.branch_id) {
      return res.status(403).json({
        success: false,
        message: 'Cashier must belong to a branch'
      });
    }

    // Update req.user with current role info
    req.user.role_name = user.role_name;
    req.user.branch_id = user.branch_id;
    req.cashier = {
      user_id: user.user_id,
      branch_id: user.branch_id,
      role_name: user.role_name
    };

    next();
  } catch (error) {
    console.error('Cashier auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = cashierAuth;

