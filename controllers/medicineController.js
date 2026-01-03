// Medicine Controller - Read-only access for Pharmacist and Cashier
// Allows viewing medicine information but not editing or deleting

const pool = require('../config/database');

// Get all medicines for the staff member's branch (view only)
const getAllMedicines = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;

    const [medicines] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.type,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        m.barcode,
        m.manufacturer,
        c.category_name,
        c.description as category_description,
        m.created_at,
        m.updated_at
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.branch_id = ?
      ORDER BY m.name ASC`,
      [branchId]
    );

    res.json({
      success: true,
      data: medicines,
      message: 'Medicines retrieved successfully',
      count: medicines.length
    });
  } catch (error) {
    console.error('Get all medicines error:', error);
    next(error);
  }
};

// Get single medicine by ID (view only)
const getMedicineById = async (req, res, next) => {
  try {
    const { medicine_id } = req.params;
    const branchId = req.user.branch_id;

    const [medicines] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.type,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        m.barcode,
        m.manufacturer,
        c.category_name,
        c.description as category_description,
        m.created_at,
        m.updated_at
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.medicine_id = ? AND m.branch_id = ?`,
      [medicine_id, branchId]
    );

    if (medicines.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      data: medicines[0],
      message: 'Medicine retrieved successfully'
    });
  } catch (error) {
    console.error('Get medicine by ID error:', error);
    next(error);
  }
};

// Search medicines by name, category, or barcode
const searchMedicines = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    // Accept both 'q' and 'search' query parameters for compatibility
    const searchQuery = req.query.q || req.query.search;

    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required. Use query parameter "q" or "search".'
      });
    }

    const searchTerm = `%${searchQuery.trim()}%`;

    const [medicines] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.type,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        m.barcode,
        m.manufacturer,
        c.category_name,
        c.description as category_description
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.branch_id = ?
      AND (
        m.name LIKE ? OR
        m.barcode LIKE ? OR
        c.category_name LIKE ? OR
        m.manufacturer LIKE ?
      )
      ORDER BY m.name ASC`,
      [branchId, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json({
      success: true,
      data: medicines,
      message: 'Search completed successfully',
      count: medicines.length,
      searchQuery: searchQuery
    });
  } catch (error) {
    console.error('Search medicines error:', error);
    next(error);
  }
};

// Get medicines by category
const getMedicinesByCategory = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const { category_id } = req.params;

    const [medicines] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.type,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        m.barcode,
        m.manufacturer,
        c.category_name,
        c.description as category_description
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.branch_id = ? AND m.category_id = ?
      ORDER BY m.name ASC`,
      [branchId, category_id]
    );

    res.json({
      success: true,
      data: medicines,
      message: 'Medicines retrieved successfully',
      count: medicines.length
    });
  } catch (error) {
    console.error('Get medicines by category error:', error);
    next(error);
  }
};

module.exports = {
  getAllMedicines,
  getMedicineById,
  searchMedicines,
  getMedicinesByCategory
};

