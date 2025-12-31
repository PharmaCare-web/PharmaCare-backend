// Pharmacist Authentication Middleware
// Ensures only users with 'Pharmacist' role can access certain routes

const pool = require('../config/database');

const pharmacistAuth = async (req, res, next) => {
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

    // Check if user is a Pharmacist
    if (user.role_name !== 'Pharmacist') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Pharmacist role required.'
      });
    }

    // Check if pharmacist belongs to a branch
    if (!user.branch_id) {
      return res.status(403).json({
        success: false,
        message: 'Pharmacist must belong to a branch'
      });
    }

    // Update req.user with current role info
    req.user.role_name = user.role_name;
    req.user.branch_id = user.branch_id;

    next();
  } catch (error) {
    console.error('Pharmacist auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = pharmacistAuth;

