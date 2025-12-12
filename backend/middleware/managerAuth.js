// Manager authentication middleware
// Verifies that the user is a Manager and belongs to a branch
// Must be used after authMiddleware

const managerAuth = (req, res, next) => {
  // Check if user is authenticated (authMiddleware should have set req.user)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user is Manager
  if (req.user.role_name !== 'Manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Manager privileges required.'
    });
  }

  // Check if manager belongs to a branch
  if (!req.user.branch_id) {
    return res.status(400).json({
      success: false,
      message: 'Manager must belong to a branch'
    });
  }

  next();
};

module.exports = managerAuth;

