// Optional: data models (plain JS objects or JSON)
// User model - data structure and model methods

// Create a new user object (for non-auth users)
const createUser = (name, email, id) => {
  return {
    id: id,
    name: name,
    email: email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Create user object with password (for authenticated users)
const createUserWithPassword = (name, email, password, id) => {
  return {
    id: id,
    name: name,
    email: email,
    password: password, // This should be hashed before creating
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Validate user data
const validateUser = (user) => {
  const errors = [];

  if (!user.name || user.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!user.email || !isValidEmail(user.email)) {
    errors.push('Valid email is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format user for response (exclude sensitive data if any)
const formatUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

module.exports = {
  createUser,
  createUserWithPassword,
  validateUser,
  isValidEmail,
  formatUser
};

