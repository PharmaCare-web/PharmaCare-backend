// Middleware to enforce password change for Pharmacist and Cashier ONLY on first login
// Blocks access to all endpoints except change-password if must_change_password is true
// IMPORTANT: This middleware ONLY applies to Pharmacist and Cashier roles
// Admin and Manager are NOT affected by this middleware

const pool = require('../config/database');

const requirePasswordChange = async (req, res, next) => {
  try {
    // Skip this check for the change-password endpoint itself and auth endpoints
    if (req.path.includes('/auth/change-password') || 
        req.path.includes('/change-password') ||
        req.path.includes('/auth/me') ||
        req.path.includes('/auth/logout')) {
      return next();
    }

    // Check if user is authenticated (from authMiddleware)
    if (!req.user || !req.user.user_id) {
      return next(); // Let auth middleware handle this
    }

    const userId = req.user.user_id;

    // Use password change flags from authMiddleware if available, otherwise query database
    let mustChangePassword = false;
    let roleName = null;

    if (req.user.must_change_password !== undefined && req.user.is_temporary_password !== undefined) {
      // Use data from authMiddleware (more efficient)
      mustChangePassword = req.user.must_change_password === true || req.user.must_change_password === 1 || 
                          req.user.is_temporary_password === true || req.user.is_temporary_password === 1;
      roleName = req.user.role_name;
    } else {
      // Fallback: query database if flags not in req.user
      const [users] = await pool.execute(
        `SELECT u.user_id, u.must_change_password, u.is_temporary_password, r.role_name
         FROM user u
         LEFT JOIN role r ON u.role_id = r.role_id
         WHERE u.user_id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return next(); // User not found, let other middleware handle
      }

      const user = users[0];
      mustChangePassword = user.must_change_password === true || user.must_change_password === 1 || 
                          user.is_temporary_password === true || user.is_temporary_password === 1;
      roleName = user.role_name;
    }

    // For Pharmacist and Cashier, password change is CRITICAL on first login
    if (mustChangePassword && (roleName === 'Pharmacist' || roleName === 'Cashier')) {
      return res.status(403).json({
        success: false,
        message: 'Password change required. Please change your password before accessing this resource.',
        mustChangePassword: true,
        redirectTo: '/change-password'
      });
    }

    // For Admin and Manager, allow access (no password change enforcement)
    // Only Pharmacist and Cashier are blocked above

    next();
  } catch (error) {
    console.error('Require password change middleware error:', error);
    // Don't block on error, let request continue
    next();
  }
};

module.exports = requirePasswordChange;

