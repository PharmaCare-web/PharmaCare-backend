// Validation utilities for authentication

const validateRegister = (req, res, next) => {
  const { full_name, email, password, role_id, branch_id } = req.body;
  const errors = [];

  // Validate full_name
  if (!full_name || full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  // Validate email
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Validate role_id
  if (!role_id || isNaN(role_id)) {
    errors.push('Valid role_id is required');
  }

  // Validate branch_id
  // Admin (role_id = 1) does not require branch_id (system role, not branch-specific)
  // Manager (role_id = 2) can either create new branch (branch_name) or join existing (branch_id)
  // Pharmacy staff (Pharmacist=3, Cashier=4) MUST have branch_id (created by Manager with branch already assigned)
  
  const roleIdInt = parseInt(role_id);
  
  if (roleIdInt === 1) {
    // Admin: branch_id should be null or not provided
    // No validation needed
  } else if (roleIdInt === 2) {
    // Manager: Can create new branch OR join existing branch
    // Either branch_name (creating new) OR branch_id (joining existing) is acceptable
    // Validation is handled in controller logic, not here
  } else if (roleIdInt === 3 || roleIdInt === 4) {
    // Pharmacist/Cashier: MUST have branch_id (they don't register themselves, Manager creates them)
    if (!branch_id || isNaN(branch_id)) {
      errors.push('Valid branch_id is required for Pharmacist and Cashier roles');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!password || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  validateRegister,
  validateLogin,
  isValidEmail
};

