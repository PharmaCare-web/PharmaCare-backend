// Pharmacist Controller
// Handles pharmacist-specific operations: inventory interactions, sales support, reports

const pool = require('../config/database');

// ============================================================================
// 1. INVENTORY INTERACTIONS (Limited)
// ============================================================================

// Request restock from Manager
const requestRestock = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const pharmacistId = req.users.user_id;
    const { medicine_id, requested_quantity, notes } = req.body;

    if (!medicine_id || !requested_quantity) {
      return res.status(400).json({
        success: false,
        message: 'medicine_id and requested_quantity are required'
      });
    }

    // Verify medicine belongs to pharmacist's branch
    const [medicine] = await pool.execute(
      'SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE medicine_id = ? AND branch_id = ?',
      [medicine_id, branchId]
    );

    if (medicine.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your branch'
      });
    }

    // Create notification for manager
    await pool.execute(
      `INSERT INTO notification (branch_id, title, message, type, is_read)
       VALUES (?, ?, ?, 'restock_request', FALSE)`,
      [
        branchId,
        'Restock Request',
        `Pharmacist ${req.users.full_name} requested ${requested_quantity} units of ${medicine[0].name}. Current stock: ${medicine[0].quantity_in_stock}. ${notes ? 'Notes: ' + notes : ''}`,
        'restock_request'
      ]
    );

    res.json({
      success: true,
      message: 'Restock request sent to manager successfully',
      data: {
        medicine_id,
        medicine_name: medicine[0].name,
        current_stock: medicine[0].quantity_in_stock,
        requested_quantity
      }
    });
  } catch (error) {
    console.error('Request restock error:', error);
    next(error);
  }
};

// Mark item as low stock (notification to Manager)
const markLowStock = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { medicine_id, threshold, notes } = req.body;

    if (!medicine_id) {
      return res.status(400).json({
        success: false,
        message: 'medicine_id is required'
      });
    }

    // Use provided threshold or default to 10
    const stockThreshold = threshold || 10;

    // Verify medicine belongs to pharmacist's branch
    const [medicine] = await pool.execute(
      'SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE medicine_id = ? AND branch_id = ?',
      [medicine_id, branchId]
    );

    if (medicine.length === 0) {
      // Check if medicine exists in other branches or doesn't exist at all
      const [medicineExists] = await pool.execute(
        'SELECT medicine_id, branch_id FROM medicine WHERE medicine_id = ?',
        [medicine_id]
      );

      if (medicineExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${medicine_id} does not exist. Please verify the medicine_id.`
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${medicine_id} not found in your branch (branch_id: ${branchId}). The medicine belongs to a different branch.`
        });
      }
    }

    // Create low stock notification for manager
    const notificationMessage = `Pharmacist ${req.users.full_name} marked ${medicine[0].name} as low stock. Current quantity: ${medicine[0].quantity_in_stock}, Threshold: ${stockThreshold}.${notes ? ' Notes: ' + notes : ''}`;
    
    await pool.execute(
      `INSERT INTO notification (branch_id, title, message, type, is_read)
       VALUES (?, ?, ?, 'low_stock', FALSE)`,
      [
        branchId,
        'Low Stock Alert',
        notificationMessage,
        'low_stock'
      ]
    );

    res.json({
      success: true,
      message: 'Low stock alert sent to manager successfully',
      data: {
        medicine_id,
        medicine_name: medicine[0].name,
        current_stock: medicine[0].quantity_in_stock,
        threshold: stockThreshold
      }
    });
  } catch (error) {
    console.error('Mark low stock error:', error);
    next(error);
  }
};

// View stock level changes (history)
const getStockHistory = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { medicine_id } = req.query;

    let query = `
      SELECT 
        m.medicine_id,
        m.name,
        m.quantity_in_stock as current_quantity,
        m.updated_at as last_updated
      FROM medicine m
      WHERE m.branch_id = ?
    `;
    const params = [branchId];

    if (medicine_id) {
      query += ' AND m.medicine_id = ?';
      params.push(medicine_id);
    }

    query += ' ORDER BY m.updated_at DESC LIMIT 100';

    const [history] = await pool.execute(query, params);

    res.json({
      success: true,
      data: history,
      message: 'Stock history retrieved successfully',
      count: history.length
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    next(error);
  }
};

// ============================================================================
// 2. SALES SUPPORT
// ============================================================================

// Create new sales order
const createSale = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const usersId = req.users.user_id;
    const { items, payment_type, customer_name, customer_phone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required and must not be empty'
      });
    }

    if (!payment_type) {
      return res.status(400).json({
        success: false,
        message: 'payment_type is required'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    let saleId = null; // Declare saleId outside transaction so it's accessible after
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Validate all items and check stock
      for (const item of items) {
        const { medicine_id, quantity } = item;

        if (!medicine_id || !quantity || quantity <= 0) {
          throw new Error('Each item must have medicine_id and quantity > 0');
        }

        const [medicine] = await connection.execute(
          'SELECT medicine_id, name, price, quantity_in_stock FROM medicine WHERE medicine_id = ? AND branch_id = ?',
          [medicine_id, branchId]
        );

        if (medicine.length === 0) {
          throw new Error(`Medicine ID ${medicine_id} not found in your branch`);
        }

        if (medicine[0].quantity_in_stock < quantity) {
          throw new Error(`Insufficient stock for ${medicine[0].name}. Available: ${medicine[0].quantity_in_stock}, Requested: ${quantity}`);
        }

        totalAmount += medicine[0].price * quantity;
      }

      // Create sale record with pending_payment status (cashier will accept payment)
      const [saleResult] = await connection.execute(
        `INSERT INTO sale (branch_id, user_id, total_amount, status, sale_date)
         VALUES (?, ?, ?, 'pending_payment', CURRENT_TIMESTAMP) RETURNING sale_id`,
        [branchId, usersId, totalAmount]
      );

      saleId = saleResult.length > 0 ? (saleResult[0].sale_id || saleResult[0].id) : null;
      if (!saleId) {
        throw new Error('Failed to create sale record');
      }

      // Create sale items and update stock
      for (const item of items) {
        const { medicine_id, quantity } = item;

        const [medicine] = await connection.execute(
          'SELECT price FROM medicine WHERE medicine_id = ?',
          [medicine_id]
        );

        const unitPrice = medicine[0].price;
        const subtotal = unitPrice * quantity;

        // Insert sale item
        await connection.execute(
          `INSERT INTO sale_item (sale_id, medicine_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, medicine_id, quantity, unitPrice, subtotal]
        );

        // Stock will be updated when cashier accepts payment
      }

      // Payment record will be created by cashier when accepting payment
      // Don't create payment here - cashier will handle it

      // Create notification for cashier about the payment request
      const pharmacistName = req.users.full_name;
      
      // Get medicine names for notification
      const medicineIds = items.map(item => item.medicine_id);
      if (medicineIds.length > 0) {
        try {
          const placeholders = medicineIds.map(() => '?').join(',');
          const [medicines] = await connection.execute(
            `SELECT medicine_id, name FROM medicine WHERE medicine_id IN (${placeholders})`,
            medicineIds
          );
          const medicineNamesList = medicines.map(m => m.name).join(', ');

          // Try to create notification (table might not exist in older databases)
          await connection.execute(
            `INSERT INTO notification (branch_id, title, message, type, is_read, created_at)
             VALUES (?, ?, ?, 'payment_request', FALSE, CURRENT_TIMESTAMP)`,
            [
              branchId,
              'New Payment Request',
              `Pharmacist ${pharmacistName} sent a payment request (Sale ID: ${saleId}) for: ${medicineNamesList}`
            ]
          );
        } catch (notificationError) {
          // If notification table doesn't exist, log but don't fail the sale
          console.warn('⚠️  Could not create notification (table may not exist):', notificationError.message);
          // Continue with sale creation - notification is optional
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      // Always release the connection, even if there was an error
      if (connection && typeof connection.release === 'function') {
        connection.release();
      }
    }

    // Verify saleId was created successfully
    if (!saleId) {
      throw new Error('Failed to create sale - saleId is missing');
    }

    // Get complete sale details using a fresh connection from the pool (outside transaction)
    // Try users table first (production), fallback to "user" if needed
    let saleDetails;
    try {
      [saleDetails] = await pool.execute(
        `SELECT 
          s.sale_id,
          s.sale_date,
          s.total_amount,
          s.status,
          u.full_name as pharmacist_name,
          p.payment_type,
          p.amount as payment_amount
        FROM sale s
        LEFT JOIN users u ON s.user_id = u.user_id
        LEFT JOIN payment p ON s.sale_id = p.sale_id
        WHERE s.sale_id = ?`,
        [saleId]
      );
    } catch (userTableError) {
      // If users table doesn't exist (42P01), try "user" table (quoted)
      if (userTableError.code === '42P01') {
        try {
          [saleDetails] = await pool.execute(
            `SELECT 
              s.sale_id,
              s.sale_date,
              s.total_amount,
              s.status,
              u.full_name as pharmacist_name,
              p.payment_type,
              p.amount as payment_amount
            FROM sale s
            LEFT JOIN "user" u ON s.user_id = u.user_id
            LEFT JOIN payment p ON s.sale_id = p.sale_id
            WHERE s.sale_id = ?`,
            [saleId]
          );
        } catch (quotedUserError) {
          // If both fail, just get sale without user info
          [saleDetails] = await pool.execute(
            `SELECT 
              s.sale_id,
              s.sale_date,
              s.total_amount,
              s.status,
              NULL as pharmacist_name,
              p.payment_type,
              p.amount as payment_amount
            FROM sale s
            LEFT JOIN payment p ON s.sale_id = p.sale_id
            WHERE s.sale_id = ?`,
            [saleId]
          );
        }
      } else {
        // Re-throw if it's a different error
        throw userTableError;
      }
    }

    const [saleItems] = await pool.execute(
      `SELECT 
        si.sale_item_id,
        si.quantity,
        si.unit_price,
        si.subtotal,
        m.name as medicine_name,
        m.barcode
      FROM sale_item si
      LEFT JOIN medicine m ON si.medicine_id = m.medicine_id
      WHERE si.sale_id = ?`,
      [saleId]
    );

    res.status(201).json({
      success: true,
      message: 'Sale created successfully. Payment pending cashier approval.',
      data: {
        sale: saleDetails[0],
        items: saleItems,
        status: 'pending_payment',
        note: 'Payment will be processed by cashier'
      }
    });
  } catch (error) {
    console.error('Create sale error:', error);
    next(error);
  }
};

// Get sale by ID (for printing receipt)
const getSaleById = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { sale_id } = req.params;

    const [sale] = await pool.execute(
      `SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        s.status,
        u.full_name as cashier_name,
        b.branch_name,
        b.location,
        p.payment_type,
        p.amount as payment_amount
      FROM sale s
      LEFT JOIN "user" u ON s.user_id = u.user_id
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      LEFT JOIN payment p ON s.sale_id = p.sale_id
      WHERE s.sale_id = ? AND s.branch_id = ?`,
      [sale_id, branchId]
    );

    if (sale.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const [items] = await pool.execute(
      `SELECT 
        si.sale_item_id,
        si.quantity,
        si.unit_price,
        si.subtotal,
        m.name as medicine_name,
        m.barcode,
        c.category_name
      FROM sale_item si
      LEFT JOIN medicine m ON si.medicine_id = m.medicine_id
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE si.sale_id = ?`,
      [sale_id]
    );

    res.json({
      success: true,
      data: {
        sale: sale[0],
        items: items,
        receipt_number: `REC-${sale_id.toString().padStart(6, '0')}`
      },
      message: 'Sale retrieved successfully'
    });
  } catch (error) {
    console.error('Get sale by ID error:', error);
    next(error);
  }
};

// ============================================================================
// 3. MEDICINE STOCK MANAGEMENT (Add/Remove Medicine)
// ============================================================================

// Add medicine to stock
const addMedicineToStock = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const pharmacistId = req.users.user_id;

    const {
      name,
      category_id,
      type,
      quantity_in_stock,
      price,
      expiry_date,
      barcode,
      manufacturer
    } = req.body;

    // Validate required fields
    if (!name || !category_id || !price) {
      return res.status(400).json({
        success: false,
        message: 'name, category_id, and price are required'
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING medicine_id`,
      [
        branchId,
        category_id,
        name,
        type || null,
        quantity_in_stock || 0,
        price,
        expiry_date || null,
        barcode || null,
        manufacturer || null
      ]
    );

    const medicineId = result.length > 0 ? (result[0].medicine_id || result[0].id) : null;
    if (!medicineId) {
      throw new Error('Failed to create medicine record');
    }

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
      [medicineId]
    );

    // Check if low stock and create notification
    if (quantity_in_stock < 10) {
      await pool.execute(
        `INSERT INTO notification (branch_id, title, message, type, is_read)
         VALUES (?, ?, ?, 'low_stock', FALSE)`,
        [
          branchId,
          'Low Stock Alert',
          `Pharmacist ${req.users.full_name} added new medicine "${name}" with low stock (${quantity_in_stock} units)`
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
    const branchId = req.users.branch_id;
    const pharmacistId = req.users.user_id;
    const { medicine_id } = req.params;
    const { quantity_in_stock, price, expiry_date, action, quantity_change } = req.body;

    // Verify medicine belongs to pharmacist's branch
    const [medicine] = await pool.execute(
      'SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE medicine_id = ? AND branch_id = ?',
      [medicine_id, branchId]
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

    // Handle quantity update - can be absolute or relative
    if (quantity_in_stock !== undefined) {
      // Absolute quantity
      if (quantity_in_stock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity cannot be negative'
        });
      }
      updates.push('quantity_in_stock = ?');
      values.push(quantity_in_stock);
    } else if (action === 'add' && quantity_change) {
      // Add to existing stock
      const newQuantity = medicine[0].quantity_in_stock + quantity_change;
      updates.push('quantity_in_stock = ?');
      values.push(newQuantity);
    } else if (action === 'remove' && quantity_change) {
      // Remove from existing stock
      const newQuantity = medicine[0].quantity_in_stock - quantity_change;
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot remove ${quantity_change} units. Only ${medicine[0].quantity_in_stock} units available.`
        });
      }
      updates.push('quantity_in_stock = ?');
      values.push(newQuantity);
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
        message: 'No fields to update. Provide quantity_in_stock, action with quantity_change, price, or expiry_date.'
      });
    }

    values.push(medicine_id, branchId);

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
          branchId,
          'Low Stock Alert',
          `Pharmacist ${req.users.full_name} updated "${medicine[0].name}" stock. Current quantity: ${finalQuantity} units (low stock)`
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
    const branchId = req.users.branch_id;
    const pharmacistId = req.users.user_id;
    const { medicine_id } = req.params;

    // Verify medicine belongs to pharmacist's branch
    const [medicine] = await pool.execute(
      'SELECT medicine_id, name, quantity_in_stock FROM medicine WHERE medicine_id = ? AND branch_id = ?',
      [medicine_id, branchId]
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
      [medicine_id, branchId]
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

// ============================================================================
// 4. REPORTS (Limited)
// ============================================================================

// View low-stock report
const getLowStockReport = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { threshold = 10 } = req.query; // Default threshold is 10

    const [medicines] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        c.category_name,
        m.manufacturer
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.branch_id = ? AND m.quantity_in_stock <= ?
      ORDER BY m.quantity_in_stock ASC`,
      [branchId, threshold]
    );

    res.json({
      success: true,
      data: medicines,
      message: 'Low stock report retrieved successfully',
      count: medicines.length,
      threshold: parseInt(threshold)
    });
  } catch (error) {
    console.error('Get low stock report error:', error);
    next(error);
  }
};

// View expiry-date report
const getExpiryReport = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { days = 30 } = req.query; // Default: medicines expiring in next 30 days

    const [medicines] = await pool.execute(
      `SELECT 
        m.medicine_id,
        m.name,
        m.quantity_in_stock,
        m.price,
        m.expiry_date,
        (m.expiry_date - CURRENT_DATE) as days_until_expiry,
        c.category_name,
        m.manufacturer
      FROM medicine m
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE m.branch_id = ? 
      AND m.expiry_date IS NOT NULL
      AND m.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * ?
      ORDER BY m.expiry_date ASC`,
      [branchId, days]
    );

    res.json({
      success: true,
      data: medicines,
      message: 'Expiry report retrieved successfully',
      count: medicines.length,
      days_ahead: parseInt(days)
    });
  } catch (error) {
    console.error('Get expiry report error:', error);
    next(error);
  }
};

// View branch inventory summary
const getInventorySummary = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;

    const [summary] = await pool.execute(
      `SELECT 
        COUNT(*) as total_medicines,
        SUM(quantity_in_stock) as total_quantity,
        SUM(price * quantity_in_stock) as total_value,
        COUNT(CASE WHEN quantity_in_stock <= 10 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon_count
      FROM medicine
      WHERE branch_id = ?`,
      [branchId]
    );

    // Get recent returns (last 30 days) that affected stock
    const [recentReturns] = await pool.execute(
      `SELECT 
        COUNT(*) as total_returns,
        SUM(rt.quantity_returned) as total_quantity_returned,
        COUNT(DISTINCT rt.medicine_id) as medicines_returned
      FROM return_table rt
      INNER JOIN sale s ON rt.sale_id = s.sale_id
      WHERE s.branch_id = ?
        AND rt.return_date >= CURRENT_DATE - INTERVAL '30 days'
        AND rt.status = 'completed'`,
      [branchId]
    );

    const [categories] = await pool.execute(
      `SELECT 
        c.category_name,
        COUNT(m.medicine_id) as medicine_count,
        SUM(m.quantity_in_stock) as total_quantity
      FROM category c
      LEFT JOIN medicine m ON c.category_id = m.category_id AND m.branch_id = ?
      GROUP BY c.category_id, c.category_name
      HAVING COUNT(m.medicine_id) > 0
      ORDER BY COUNT(m.medicine_id) DESC`,
      [branchId]
    );

    res.json({
      success: true,
      data: {
        summary: {
          ...summary[0],
          recent_returns: recentReturns[0] || {
            total_returns: 0,
            total_quantity_returned: 0,
            medicines_returned: 0
          }
        },
        by_category: categories
      },
      message: 'Inventory summary retrieved successfully'
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    next(error);
  }
};

// ============================================================================
// 5. DASHBOARD
// ============================================================================

// Get pharmacist dashboard summary
const getDashboard = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const pharmacistId = req.users.user_id;

    // Get today's sales created by this pharmacist
    const [todaySales] = await pool.execute(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM sale
      WHERE branch_id = ? 
        AND user_id = ?
        AND sale_date::date = CURRENT_DATE`,
      [branchId, pharmacistId]
    );

    // Get pending payment requests (sales waiting for cashier)
    const [pendingPayments] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM sale
       WHERE branch_id = ? 
         AND user_id = ?
         AND status = 'pending_payment'`,
      [branchId, pharmacistId]
    );

    // Get completed sales today
    const [completedToday] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM sale
       WHERE branch_id = ? 
         AND user_id = ?
         AND sale_date::date = CURRENT_DATE
         AND status = 'completed'`,
      [branchId, pharmacistId]
    );

    // Get this week's sales
    const [weekSales] = await pool.execute(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM sale
      WHERE branch_id = ? 
        AND user_id = ?
        AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(WEEK FROM sale_date) = EXTRACT(WEEK FROM CURRENT_DATE)
        AND status = 'completed'`,
      [branchId, pharmacistId]
    );

    // Get this month's sales
    const [monthSales] = await pool.execute(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM sale
      WHERE branch_id = ? 
        AND user_id = ?
        AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND status = 'completed'`,
      [branchId, pharmacistId]
    );

    // Get low stock medicines
    const [lowStock] = await pool.execute(
      `SELECT medicine_id, name, quantity_in_stock, price
       FROM medicine
       WHERE branch_id = ?
         AND quantity_in_stock <= 10
       ORDER BY quantity_in_stock ASC
       LIMIT 10`,
      [branchId]
    );

    // Get expiring medicines (next 30 days)
    const [expiringMedicines] = await pool.execute(
      `SELECT medicine_id, name, expiry_date, quantity_in_stock
       FROM medicine
       WHERE branch_id = ?
         AND expiry_date IS NOT NULL
         AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
         AND expiry_date >= CURRENT_DATE
       ORDER BY expiry_date ASC
       LIMIT 10`,
      [branchId]
    );

    // Get recent sales (last 5)
    const [recentSales] = await pool.execute(
      `SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        s.status,
        COUNT(si.sale_item_id) as item_count
      FROM sale s
      LEFT JOIN sale_item si ON s.sale_id = si.sale_id
      WHERE s.branch_id = ? 
        AND s.user_id = ?
      GROUP BY s.sale_id, s.sale_date, s.total_amount, s.status
      ORDER BY s.sale_date DESC
      LIMIT 5`,
      [branchId, pharmacistId]
    );

    // Get inventory summary
    const [inventorySummary] = await pool.execute(
      `SELECT 
        COUNT(*) as total_medicines,
        SUM(quantity_in_stock) as total_quantity,
        COUNT(CASE WHEN quantity_in_stock <= 10 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon_count
      FROM medicine
      WHERE branch_id = ?`,
      [branchId]
    );

    res.json({
      success: true,
      message: 'Pharmacist dashboard retrieved successfully',
      data: {
        sales: {
          today: {
            count: parseInt(todaySales[0].count) || 0,
            revenue: parseFloat(todaySales[0].total_revenue) || 0
          },
          thisWeek: {
            count: parseInt(weekSales[0].count) || 0,
            revenue: parseFloat(weekSales[0].total_revenue) || 0
          },
          thisMonth: {
            count: parseInt(monthSales[0].count) || 0,
            revenue: parseFloat(monthSales[0].total_revenue) || 0
          },
          pendingPayments: parseInt(pendingPayments[0].count) || 0,
          completedToday: parseInt(completedToday[0].count) || 0,
          recentSales: recentSales
        },
        inventory: {
          summary: {
            totalMedicines: parseInt(inventorySummary[0].total_medicines) || 0,
            totalQuantity: parseInt(inventorySummary[0].total_quantity) || 0,
            lowStockCount: parseInt(inventorySummary[0].low_stock_count) || 0,
            expiringSoonCount: parseInt(inventorySummary[0].expiring_soon_count) || 0
          },
          lowStockMedicines: lowStock,
          expiringMedicines: expiringMedicines
        }
      }
    });
  } catch (error) {
    console.error('Get pharmacist dashboard error:', error);
    next(error);
  }
};

// ============================================================================
// 6. SOLD ITEMS HISTORY
// ============================================================================

// Get sold items history (for frontend table display)
const getSoldItemsHistory = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const pharmacistId = req.users.user_id;
    const { 
      start_date, 
      end_date, 
      medicine_id, 
      category_id,
      page = 1, 
      limit = 50 
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
      SELECT 
        si.sale_item_id,
        si.sale_id,
        si.medicine_id,
        si.quantity,
        si.unit_price,
        si.subtotal,
        si.created_at as sold_date,
        m.name as medicine_name,
        m.barcode,
        m.type as medicine_type,
        c.category_id,
        c.category_name,
        s.sale_date,
        s.total_amount as sale_total,
        s.status as sale_status,
        u.full_name as pharmacist_name
      FROM sale_item si
      INNER JOIN sale s ON si.sale_id = s.sale_id
      INNER JOIN medicine m ON si.medicine_id = m.medicine_id
      LEFT JOIN category c ON m.category_id = c.category_id
      LEFT JOIN users u ON s.user_id = u.user_id
      WHERE s.branch_id = ?
        AND s.user_id = ?
        AND s.status = 'completed'
    `;

    const params = [branchId, pharmacistId];

    // Add filters
    if (start_date) {
      baseQuery += ` AND DATE(s.sale_date) >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      baseQuery += ` AND DATE(s.sale_date) <= ?`;
      params.push(end_date);
    }

    if (medicine_id) {
      baseQuery += ` AND m.medicine_id = ?`;
      params.push(medicine_id);
    }

    if (category_id) {
      baseQuery += ` AND m.category_id = ?`;
      params.push(category_id);
    }

    // Get total count for pagination
    let countQuery = baseQuery.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM'
    ).replace(/ORDER BY[\s\S]*$/, '');

    // Try users table first, fallback to "user" if needed
    let countResult, soldItems;
    try {
      [countResult] = await pool.execute(countQuery, params);
      const total = countResult[0].total;

      // Add ordering and pagination
      const dataQuery = baseQuery + ` ORDER BY s.sale_date DESC, si.sale_item_id DESC LIMIT ${limitNum} OFFSET ${offset}`;
      [soldItems] = await pool.execute(dataQuery, params);
    } catch (userTableError) {
      if (userTableError.code === '42P01') { // relation "users" does not exist
        // Retry with "user" table
        baseQuery = baseQuery.replace(/LEFT JOIN users u/, 'LEFT JOIN "user" u');
        countQuery = baseQuery.replace(
          /SELECT[\s\S]*?FROM/,
          'SELECT COUNT(*) as total FROM'
        ).replace(/ORDER BY[\s\S]*$/, '');
        
        [countResult] = await pool.execute(countQuery, params);
        const total = countResult[0].total;

        const dataQuery = baseQuery + ` ORDER BY s.sale_date DESC, si.sale_item_id DESC LIMIT ${limitNum} OFFSET ${offset}`;
        [soldItems] = await pool.execute(dataQuery, params);
      } else {
        throw userTableError;
      }
    }

    const total = countResult[0].total;

    // Calculate summary statistics
    const totalQuantity = soldItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const totalRevenue = soldItems.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
    const uniqueMedicines = new Set(soldItems.map(item => item.medicine_id)).size;
    const uniqueSales = new Set(soldItems.map(item => item.sale_id)).size;

    res.json({
      success: true,
      message: 'Sold items history retrieved successfully',
      data: {
        items: soldItems,
        summary: {
          total_items: parseInt(total),
          total_quantity_sold: totalQuantity,
          total_revenue: totalRevenue,
          unique_medicines: uniqueMedicines,
          unique_sales: uniqueSales
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: parseInt(total),
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get sold items history error:', error);
    next(error);
  }
};

module.exports = {
  // Inventory Interactions
  requestRestock,
  markLowStock,
  getStockHistory,
  // Medicine Stock Management
  addMedicineToStock,
  updateMedicineStock,
  removeMedicineFromStock,
  // Sales Support
  createSale,
  getSaleById,
  // Reports
  getLowStockReport,
  getExpiryReport,
  getInventorySummary,
  // Dashboard
  getDashboard,
  // Sold Items History
  getSoldItemsHistory
};

