// Manager Sales & Payments Controller
// Allows managers to create sales, process payments, handle refunds, and view audit trails

const pool = require('../config/database');

// Create a sale (manager can create sales)
const createSale = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const userId = req.users.user_id;
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
    let saleId = null;
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

      // Create sale record
      const [saleResult] = await connection.execute(
        `INSERT INTO sale (branch_id, user_id, total_amount, status, sale_date)
         VALUES (?, ?, ?, 'completed', CURRENT_TIMESTAMP) RETURNING sale_id`,
        [branchId, userId, totalAmount]
      );

      saleId = saleResult.length > 0 ? (saleResult[0].sale_id || saleResult[0].id) : null;
      if (!saleId) {
        throw new Error('Failed to create sale record');
      }

      // Create sale items and update stock
      for (const item of items) {
        const { medicine_id, quantity } = item;

        const [medicine] = await connection.execute(
          'SELECT price FROM medicine WHERE medicine_id = ? AND branch_id = ?',
          [medicine_id, branchId]
        );

        const unitPrice = medicine[0].price;
        const subtotal = unitPrice * quantity;

        // Create sale item
        await connection.execute(
          `INSERT INTO sale_item (sale_id, medicine_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, medicine_id, quantity, unitPrice, subtotal]
        );

        // Update stock
        await connection.execute(
          `UPDATE medicine 
           SET quantity_in_stock = quantity_in_stock - ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE medicine_id = ? AND branch_id = ?`,
          [quantity, medicine_id, branchId]
        );
      }

      // Create payment record
      await connection.execute(
        `INSERT INTO payment (sale_id, payment_type, amount, payment_date)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [saleId, payment_type, totalAmount]
      );

      // Create audit trail entry
      await connection.execute(
        `INSERT INTO audit_trail (branch_id, user_id, action_type, entity_type, entity_id, description, created_at)
         VALUES (?, ?, 'create', 'sale', ?, ?, CURRENT_TIMESTAMP)`,
        [branchId, userId, saleId, `Manager created sale #${saleId} with total amount ${totalAmount}`]
      );

      await connection.commit();

      // Get complete sale details
      const [saleDetails] = await connection.execute(
        `SELECT 
           s.sale_id,
           s.branch_id,
           s.user_id,
           s.sale_date,
           s.total_amount,
           s.status,
           u.full_name as created_by_name,
           b.branch_name
         FROM sale s
         LEFT JOIN users u ON s.user_id = u.user_id
         LEFT JOIN branch b ON s.branch_id = b.branch_id
         WHERE s.sale_id = ?`,
        [saleId]
      );

      const [saleItems] = await connection.execute(
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
        message: 'Sale created successfully',
        data: {
          sale: saleDetails[0],
          items: saleItems,
          payment_type: payment_type
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create sale error:', error);
    next(error);
  }
};

// Process payment for a sale
const processPayment = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const userId = req.users.user_id;
    const { id } = req.params;
    const { payment_type, reference_number } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Sale ID is required'
      });
    }

    if (!payment_type) {
      return res.status(400).json({
        success: false,
        message: 'payment_type is required'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Verify sale exists and belongs to branch
      const [sales] = await connection.execute(
        `SELECT sale_id, total_amount, status, branch_id
         FROM sale 
         WHERE sale_id = ? AND branch_id = ?`,
        [id, branchId]
      );

      if (sales.length === 0) {
        throw new Error('Sale not found or does not belong to your branch');
      }

      const sale = sales[0];

      // Check if payment already exists
      const [existingPayments] = await connection.execute(
        `SELECT payment_id FROM payment WHERE sale_id = ?`,
        [id]
      );

      if (existingPayments.length > 0) {
        // Update existing payment
        await connection.execute(
          `UPDATE payment 
           SET payment_type = ?, 
               reference_number = ?,
               payment_date = CURRENT_TIMESTAMP
           WHERE sale_id = ?`,
          [payment_type, reference_number || null, id]
        );
      } else {
        // Create new payment record
        await connection.execute(
          `INSERT INTO payment (sale_id, payment_type, amount, payment_date, reference_number)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
          [id, payment_type, sale.total_amount, reference_number || null]
        );
      }

      // Update sale status to completed if it was pending
      if (sale.status !== 'completed') {
        await connection.execute(
          `UPDATE sale 
           SET status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE sale_id = ?`,
          [id]
        );
      }

      // Create audit trail entry
      await connection.execute(
        `INSERT INTO audit_trail (branch_id, user_id, action_type, entity_type, entity_id, description, created_at)
         VALUES (?, ?, 'payment', 'sale', ?, ?, CURRENT_TIMESTAMP)`,
        [branchId, userId, id, `Manager processed payment for sale #${id}. Payment type: ${payment_type}, Amount: ${sale.total_amount}`]
      );

      await connection.commit();

      // Get updated sale with payment info
      const [saleDetails] = await connection.execute(
        `SELECT 
           s.sale_id,
           s.branch_id,
           s.user_id,
           s.sale_date,
           s.total_amount,
           s.status,
           p.payment_type,
           p.payment_date,
           p.reference_number
         FROM sale s
         LEFT JOIN payment p ON s.sale_id = p.sale_id
         WHERE s.sale_id = ?`,
        [id]
      );

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: saleDetails[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Process payment error:', error);
    next(error);
  }
};

// Process refund for a sale
const processRefund = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const userId = req.users.user_id;
    const { id } = req.params;
    const { return_id, refund_amount, refund_method, notes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Sale ID is required'
      });
    }

    if (!return_id) {
      return res.status(400).json({
        success: false,
        message: 'return_id is required'
      });
    }

    if (!refund_amount || refund_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'refund_amount is required and must be greater than 0'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Verify sale exists and belongs to branch
      const [sales] = await connection.execute(
        `SELECT sale_id, total_amount, branch_id
         FROM sale 
         WHERE sale_id = ? AND branch_id = ?`,
        [id, branchId]
      );

      if (sales.length === 0) {
        throw new Error('Sale not found or does not belong to your branch');
      }

      // Verify return exists and belongs to this sale
      const [returns] = await connection.execute(
        `SELECT return_id, sale_id, status
         FROM return_table 
         WHERE return_id = ? AND sale_id = ?`,
        [return_id, id]
      );

      if (returns.length === 0) {
        throw new Error('Return not found or does not belong to this sale');
      }

      const returnRecord = returns[0];

      // Check if refund already exists for this return
      const [existingRefunds] = await connection.execute(
        `SELECT refund_id FROM refund WHERE return_id = ?`,
        [return_id]
      );

      if (existingRefunds.length > 0) {
        throw new Error('Refund already processed for this return');
      }

      // Create refund record
      const [refundResult] = await connection.execute(
        `INSERT INTO refund (return_id, user_id, refund_amount, refund_date, refund_method, notes)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?) RETURNING refund_id`,
        [return_id, userId, refund_amount, refund_method || null, notes || null]
      );

      const refundId = refundResult.length > 0 ? (refundResult[0].refund_id || refundResult[0].id) : null;

      // Update return status to completed
      await connection.execute(
        `UPDATE return_table 
         SET status = 'completed', return_date = CURRENT_TIMESTAMP
         WHERE return_id = ?`,
        [return_id]
      );

      // Create audit trail entry
      await connection.execute(
        `INSERT INTO audit_trail (branch_id, user_id, action_type, entity_type, entity_id, description, created_at)
         VALUES (?, ?, 'refund', 'refund', ?, ?, CURRENT_TIMESTAMP)`,
        [branchId, userId, refundId, `Manager processed refund for return #${return_id} from sale #${id}. Amount: ${refund_amount}, Method: ${refund_method || 'N/A'}`]
      );

      await connection.commit();

      // Get refund details
      const [refundDetails] = await connection.execute(
        `SELECT 
           r.refund_id,
           r.return_id,
           r.user_id,
           r.refund_amount,
           r.refund_date,
           r.refund_method,
           r.notes,
           rt.sale_id,
           u.full_name as processed_by
         FROM refund r
         LEFT JOIN return_table rt ON r.return_id = rt.return_id
         LEFT JOIN users u ON r.user_id = u.user_id
         WHERE r.refund_id = ?`,
        [refundId]
      );

      res.status(201).json({
        success: true,
        message: 'Refund processed successfully',
        data: refundDetails[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Process refund error:', error);
    next(error);
  }
};

// Get audit trail (all actions)
const getAuditTrail = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { limit = 100, offset = 0, action_type, entity_type, start_date, end_date } = req.query;

    let query = `
      SELECT 
        at.audit_id,
        at.branch_id,
        at.user_id,
        at.action_type,
        at.entity_type,
        at.entity_id,
        at.description,
        at.created_at,
        u.full_name as user_name,
        u.email as user_email,
        r.role_name
      FROM audit_trail at
      LEFT JOIN users u ON at.user_id = u.user_id
      LEFT JOIN role r ON u.role_id = r.role_id
      WHERE at.branch_id = ?
    `;

    const params = [branchId];

    if (action_type) {
      query += ' AND at.action_type = ?';
      params.push(action_type);
    }

    if (entity_type) {
      query += ' AND at.entity_type = ?';
      params.push(entity_type);
    }

    if (start_date) {
      query += ' AND at.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND at.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY at.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [auditLogs] = await pool.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM audit_trail
      WHERE branch_id = ?
    `;
    const countParams = [branchId];

    if (action_type) {
      countQuery += ' AND action_type = ?';
      countParams.push(action_type);
    }

    if (entity_type) {
      countQuery += ' AND entity_type = ?';
      countParams.push(entity_type);
    }

    if (start_date) {
      countQuery += ' AND created_at >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ' AND created_at <= ?';
      countParams.push(end_date);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = parseInt(countResult[0].total);

    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      },
      message: 'Audit trail retrieved successfully'
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    next(error);
  }
};

// Get specific audit trail entry by ID
const getAuditTrailById = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Audit ID is required'
      });
    }

    const [auditLog] = await pool.execute(
      `SELECT 
         at.audit_id,
         at.branch_id,
         at.user_id,
         at.action_type,
         at.entity_type,
         at.entity_id,
         at.description,
         at.created_at,
         u.full_name as user_name,
         u.email as user_email,
         r.role_name,
         b.branch_name
       FROM audit_trail at
       LEFT JOIN users u ON at.user_id = u.user_id
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON at.branch_id = b.branch_id
       WHERE at.audit_id = ? AND at.branch_id = ?`,
      [id, branchId]
    );

    if (auditLog.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit trail entry not found'
      });
    }

    res.json({
      success: true,
      data: auditLog[0],
      message: 'Audit trail entry retrieved successfully'
    });
  } catch (error) {
    console.error('Get audit trail by ID error:', error);
    next(error);
  }
};

module.exports = {
  createSale,
  processPayment,
  processRefund,
  getAuditTrail,
  getAuditTrailById
};
