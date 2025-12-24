// Admin authentication middleware
// Verifies that the user is an Admin
// Must be used after authMiddleware

const adminAuth = (req, res, next) => {
  // Check if user is authenticated (authMiddleware should have set req.user)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user is Admin
  if (req.user.role_name !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

module.exports = adminAuth;

