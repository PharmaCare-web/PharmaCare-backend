// Reference data controller
// Handles fetching roles, branches, and other reference data for dropdowns

const pool = require('../config/database');

// Get all roles
const getRoles = async (req, res, next) => {
  try {
    const [roles] = await pool.execute(
      'SELECT role_id, role_name, description FROM role ORDER BY role_id'
    );

    // Separate system roles from pharmacy roles for frontend convenience
    const systemRoles = roles.filter(r => r.role_name === 'Admin');
    const pharmacyRoles = roles.filter(r => r.role_name !== 'Admin');

    res.json({
      success: true,
      data: {
        all: roles,
        system: systemRoles,
        pharmacy: pharmacyRoles
      },
      message: 'Roles retrieved successfully'
    });
  } catch (error) {
    console.error('Get roles error:', error);
    next(error);
  }
};

// Get all branches
const getBranches = async (req, res, next) => {
  try {
    const [branches] = await pool.execute(
      `SELECT b.branch_id, b.branch_name, b.location, b.email, b.phone, 
              p.name as pharmacy_name
       FROM branch b
       LEFT JOIN pharmacy p ON b.pharmacy_id = p.pharmacy_id
       ORDER BY b.branch_id`
    );

    res.json({
      success: true,
      data: branches,
      message: 'Branches retrieved successfully'
    });
  } catch (error) {
    console.error('Get branches error:', error);
    next(error);
  }
};

// Get all categories (bonus - useful for medicine management)
const getCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.execute(
      'SELECT category_id, category_name, description FROM category ORDER BY category_name'
    );

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Get categories error:', error);
    next(error);
  }
};

module.exports = {
  getRoles,
  getBranches,
  getCategories
};

