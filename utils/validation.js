// Validation utilities for authentication

const validateRegister = async(req, res, next) => {
  const { full_name, email, password, role_id, branch_id, branch_name } = req.body;
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

  // Validate branch_id
  // Admin (role_id = 1) does not require branch_id (system role, not branch-specific)
  // Pharmacy roles (Manager=2, Pharmacist=3, Cashier=4) require branch_id
 if (parseInt(role_id) === 2) { // Manager
  if (branch_id && branch_name) {
    // Joining branch
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      errors.push('Branch ID does not exist');
    } else if (branch.name !== branch_name) {
      errors.push('Branch name does not match the branch ID');
    }
  } else if (!branch_id && branch_name) {
    // Creating new branch
    const branchExists = await Branch.findOne({ name: branch_name });
    if (branchExists) {
      errors.push('Branch name already exists');
    }
  } else {
    errors.push('To join a branch, provide both branch ID and branch name; to create a branch, provide branch name only.');
  }
}

  // For Admin role, branch_id should be null or not provided

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

