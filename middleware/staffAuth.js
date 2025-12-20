// Staff Authentication Middleware
// Ensures user is either Pharmacist or Cashier and belongs to a branch

module.exports = (req, res, next) => {
  try {
    // Check if user is authenticated (from authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has a valid role (Pharmacist or Cashier)
    const allowedRoles = ['Pharmacist', 'Cashier'];
    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Pharmacists and Cashiers can access this resource.'
      });
    }

    // Check if user belongs to a branch
    if (!req.user.branch_id) {
      return res.status(400).json({
        success: false,
        message: 'User must belong to a branch'
      });
    }

    // Check if user is active
    if (!req.user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact your manager.'
      });
    }

    next();
  } catch (error) {
    console.error('Staff auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

