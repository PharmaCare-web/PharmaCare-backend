// Manager Medicine Management Controller
// Allows managers to view medicine details and add medicines to stock

const pool = require('../config/database');

// Get all medicines for manager's branch with details
const getAllMedicines = async (req, res, next) => {
  try {
    const managerBranchId = req.user.branch_id;

    if (!managerBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Manager must belong to a branch'
      });
    }

    const { page = 1, limit = 50, search, category_id, low_stock_only } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        m.medicine_id,
        m.name,
        m.type,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        m.barcode,
        m.manufacturer,
        m.created_at,
        m.updated_at,
        c.category_id,
        c.category_name,
        CASE 
          WHEN m.quantity_in_stock < 10 THEN 'low_stock'
          WHEN m.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN m.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'normal'
        END as stock_status
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.branch_id = ?
    `;

    const queryParams = [managerBranchId];

    // Add filters
    if (search) {
      query += ` AND (m.name LIKE ? OR m.barcode LIKE ? OR m.manufacturer LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      query += ` AND m.category_id = ?`;
      queryParams.push(parseInt(category_id));
    }

    if (low_stock_only === 'true') {
      query += ` AND m.quantity_in_stock < 10`;
    }

    // LIMIT and OFFSET cannot be used as placeholders in MySQL prepared statements
    // Must insert values directly (safe since we've already parsed them as integers)
    query += ` ORDER BY m.name ASC LIMIT ${limitNum} OFFSET ${offset}`;

    const [medicines] = await pool.execute(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM medicine WHERE branch_id = ?`;
    const countParams = [managerBranchId];

    if (search) {
      countQuery += ` AND (name LIKE ? OR barcode LIKE ? OR manufacturer LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      countQuery += ` AND category_id = ?`;
      countParams.push(parseInt(category_id));
    }

    if (low_stock_only === 'true') {
      countQuery += ` AND quantity_in_stock < 10`;
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        medicines: medicines,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          totalPages: Math.ceil(total / limitNum)
        }
      },
      message: 'Medicines retrieved successfully'
    });
  } catch (error) {
    console.error('Get all medicines error:', error);
    next(error);
  }
};

// Get medicine by ID with full details
const getMedicineById = async (req, res, next) => {
  try {
    const managerBranchId = req.user.branch_id;
    const { medicine_id } = req.params;

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
        m.created_at,
        m.updated_at,
        c.category_id,
        c.category_name,
        c.description as category_description,
        CASE 
          WHEN m.quantity_in_stock < 10 THEN 'low_stock'
          WHEN m.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN m.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'normal'
        END as stock_status
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.medicine_id = ? AND m.branch_id = ?`,
      [medicine_id, managerBranchId]
    );

    if (medicines.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your branch'
      });
    }

    res.json({
      success: true,
      data: medicines[0],
      message: 'Medicine details retrieved successfully'
    });
  } catch (error) {
    console.error('Get medicine by ID error:', error);
    next(error);
  }
};

// Add medicine to stock (create new medicine)
const addMedicineToStock = async (req, res, next) => {
  try {
    const managerBranchId = req.user.branch_id;

    if (!managerBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Manager must belong to a branch'
      });
    }

    const {
      name,
      medicine_name, // Accept both 'name' and 'medicine_name'
      category_id,
      type,
      quantity_in_stock,
      stock_quantity, // Accept both 'quantity_in_stock' and 'stock_quantity'
      price,
      expiry_date,
      barcode,
      manufacturer,
      manufacturer_id, // Accept both 'manufacturer' and 'manufacturer_id'
      batch_number,
      description
    } = req.body;

    // Use medicine_name if provided, otherwise use name
    const medicineName = medicine_name || name;
    // Use stock_quantity if provided, otherwise use quantity_in_stock
    const stockQty = stock_quantity !== undefined ? stock_quantity : quantity_in_stock;
    // Use manufacturer_id if provided, otherwise use manufacturer
    const manufacturerName = manufacturer_id || manufacturer;

    // Validate required fields
    if (!medicineName || !category_id || !price) {
      return res.status(400).json({
        success: false,
        message: 'name (or medicine_name), category_id, and price are required'
      });
    }

    // Validate category exists
    const [categories] = await pool.execute(
      'SELECT category_id FROM category WHERE category_id = ?',
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category_id'
      });
    }

    // Insert new medicine
    const [result] = await pool.execute(
      `INSERT INTO medicine (
        branch_id, category_id, name, type, quantity_in_stock, 
        price, expiry_date, barcode, manufacturer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        managerBranchId,
        category_id,
        medicineName,
        type || null,
        stockQty || 0,
        price,
        expiry_date || null,
        barcode || null,
        manufacturerName || null
      ]
    );

    // Get created medicine with details
    const [newMedicine] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.type,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        m.barcode,
        m.manufacturer,
        c.category_name
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.medicine_id = ?`,
      [result.insertId]
    );

    // Check if low stock and create notification
    if (stockQty < 10) {
      await pool.execute(
        `INSERT INTO notification (branch_id, title, message, type, is_read)
         VALUES (?, ?, ?, 'low_stock', FALSE)`,
        [
          managerBranchId,
          'Low Stock Alert',
          `New medicine "${medicineName}" added with low stock (${stockQty} units)`
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Medicine added to stock successfully',
      data: newMedicine[0]
    });
  } catch (error) {
    console.error('Add medicine to stock error:', error);
    next(error);
  }
};

// Update medicine stock quantity (add or remove)
const updateMedicineStock = async (req, res, next) => {
  try {
    const managerBranchId = req.user.branch_id;
    const { medicine_id } = req.params;
    const { 
      quantity_in_stock, 
      stock_quantity, // Accept both 'quantity_in_stock' and 'stock_quantity'
      price, 
      expiry_date, 
      action, 
      quantity_change 
    } = req.body;

    // Verify medicine belongs to manager's branch
    const [medicine] = await pool.execute(
      'SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE medicine_id = ? AND branch_id = ?',
      [medicine_id, managerBranchId]
    );

    if (medicine.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your branch'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    // Use stock_quantity if provided, otherwise use quantity_in_stock
    const qtyToUpdate = stock_quantity !== undefined ? stock_quantity : quantity_in_stock;

    // Handle quantity update - can be absolute or relative
    // Priority: action with quantity_change > absolute quantity
    if (action) {
      // Relative change (add/remove) - requires quantity_change
      if (quantity_change === undefined) {
        // If action is provided but no quantity_change, check if they meant to use stock_quantity
        if (qtyToUpdate !== undefined) {
          // Interpret stock_quantity with action as quantity_change
          const qtyChange = qtyToUpdate;
          if (action === 'add') {
            const newQuantity = medicine[0].quantity_in_stock + qtyChange;
            updates.push('quantity_in_stock = ?');
            values.push(newQuantity);
          } else if (action === 'remove' || action === 'subtract') {
            const newQuantity = medicine[0].quantity_in_stock - qtyChange;
            if (newQuantity < 0) {
              return res.status(400).json({
                success: false,
                message: `Cannot remove ${qtyChange} units. Only ${medicine[0].quantity_in_stock} units available.`
              });
            }
            updates.push('quantity_in_stock = ?');
            values.push(newQuantity);
          } else {
            return res.status(400).json({
              success: false,
              message: 'Invalid action. Use "add" or "remove" (or "subtract").'
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: 'When using action, provide quantity_change (or stock_quantity/quantity_in_stock).'
          });
        }
      } else {
        // Use quantity_change explicitly provided
        if (action === 'add') {
          const newQuantity = medicine[0].quantity_in_stock + quantity_change;
          updates.push('quantity_in_stock = ?');
          values.push(newQuantity);
        } else if (action === 'remove' || action === 'subtract') {
          const newQuantity = medicine[0].quantity_in_stock - quantity_change;
          if (newQuantity < 0) {
            return res.status(400).json({
              success: false,
              message: `Cannot remove ${quantity_change} units. Only ${medicine[0].quantity_in_stock} units available.`
            });
          }
          updates.push('quantity_in_stock = ?');
          values.push(newQuantity);
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use "add" or "remove" (or "subtract") with quantity_change.'
          });
        }
      }
    } else if (qtyToUpdate !== undefined) {
      // Absolute quantity (set exact value) - no action provided
      if (qtyToUpdate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity cannot be negative'
        });
      }
      updates.push('quantity_in_stock = ?');
      values.push(qtyToUpdate);
    }

    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }

    if (expiry_date !== undefined) {
      updates.push('expiry_date = ?');
      values.push(expiry_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update. Provide quantity_in_stock (or stock_quantity), action with quantity_change, price, or expiry_date.'
      });
    }

    values.push(medicine_id, managerBranchId);

    await pool.execute(
      `UPDATE medicine SET ${updates.join(', ')} WHERE medicine_id = ? AND branch_id = ?`,
      values
    );

    // Get updated medicine to check final quantity
    const [updatedMedicine] = await pool.execute(
      'SELECT quantity_in_stock FROM medicine WHERE medicine_id = ?',
      [medicine_id]
    );

    const finalQuantity = updatedMedicine[0].quantity_in_stock;

    // Check if low stock and create notification
    if (finalQuantity < 10) {
      await pool.execute(
        `INSERT INTO notification (branch_id, title, message, type, is_read)
         VALUES (?, ?, ?, 'low_stock', FALSE)`,
        [
          managerBranchId,
          'Low Stock Alert',
          `Manager updated "${medicine[0].name}" stock. Current quantity: ${finalQuantity} units (low stock)`
        ]
      );
    }

    // Get complete updated medicine details
    const [completeMedicine] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.type,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        m.barcode,
        m.manufacturer,
        c.category_name
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.medicine_id = ?`,
      [medicine_id]
    );

    res.json({
      success: true,
      message: 'Medicine stock updated successfully',
      data: completeMedicine[0]
    });
  } catch (error) {
    console.error('Update medicine stock error:', error);
    next(error);
  }
};

// Remove medicine from stock (delete medicine record)
const removeMedicineFromStock = async (req, res, next) => {
  try {
    const managerBranchId = req.user.branch_id;
    const { medicine_id } = req.params;

    // Verify medicine belongs to manager's branch
    const [medicine] = await pool.execute(
      'SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE medicine_id = ? AND branch_id = ?',
      [medicine_id, managerBranchId]
    );

    if (medicine.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your branch'
      });
    }

    // Check if medicine has any sales (optional - you might want to prevent deletion if there are sales)
    const [sales] = await pool.execute(
      'SELECT COUNT(*) as count FROM sale_item WHERE medicine_id = ?',
      [medicine_id]
    );

    // Delete medicine
    await pool.execute(
      'DELETE FROM medicine WHERE medicine_id = ? AND branch_id = ?',
      [medicine_id, managerBranchId]
    );

    res.json({
      success: true,
      message: 'Medicine removed from stock successfully',
      data: {
        medicine_id,
        medicine_name: medicine[0].name,
        had_sales: sales[0].count > 0
      }
    });
  } catch (error) {
    console.error('Remove medicine from stock error:', error);
    next(error);
  }
};

module.exports = {
  getAllMedicines,
  getMedicineById,
  addMedicineToStock,
  updateMedicineStock,
  removeMedicineFromStock
};

