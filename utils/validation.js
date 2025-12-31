// Validation utilities for authentication

const validateRegister = (req, res, next) => {
  const { full_name, email, password, role_id, branch_id, branch_name, location } = req.body;
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

  // Check for at least one uppercase, one lowercase, and one number
  if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  // Validate role_id
  if (!role_id || isNaN(role_id)) {
    errors.push('Valid role_id is required');
  }

  // Validate branch requirements based on role
  const roleIdNum = parseInt(role_id);
  
  // Admin (role_id = 1) does not require branch_id (system role, not branch-specific)
  if (roleIdNum === 1) {
    // Admin should not have branch_id
    if (branch_id) {
      errors.push('Admin role (role_id=1) should not have a branch_id');
    }
  }
  // Manager (role_id = 2) can create new branch OR join existing branch
  else if (roleIdNum === 2) {
    // Manager must provide either:
    // 1. branch_name + location (to create new branch), OR
    // 2. branch_id (to join existing branch)
    if (branch_name) {
      // Creating new branch - location is required, branch_id should not be provided
      if (!location || location.trim().length === 0) {
        errors.push('location is required when creating a new branch (branch_name provided)');
      }
      if (branch_id) {
        errors.push('Do not provide branch_id when creating a new branch. Only provide branch_name and location.');
      }
    } else if (branch_id) {
      // Joining existing branch - branch_id is required and must be valid
      if (isNaN(branch_id)) {
        errors.push('Valid branch_id is required when joining an existing branch');
      }
      if (location) {
        errors.push('Do not provide location when joining an existing branch. Only provide branch_id.');
      }
    } else {
      // Neither branch_name nor branch_id provided
      errors.push('Manager must provide either: (1) branch_name + location to create a new branch, OR (2) branch_id to join an existing branch');
    }
  }
  // Pharmacist (role_id = 3) and Cashier (role_id = 4) require branch_id (they cannot create branches)
  else if (roleIdNum === 3 || roleIdNum === 4) {
    if (!branch_id || isNaN(branch_id)) {
      errors.push('Valid branch_id is required for Pharmacist and Cashier roles');
    }
    if (branch_name || location) {
      errors.push('Pharmacist and Cashier cannot create branches. Only provide branch_id to join an existing branch.');
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

