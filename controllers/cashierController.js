// Cashier Controller
// Handles cashier-specific operations: payment acceptance, receipts, returns, reports

const pool = require('../config/database');

// ============================================================================
// 1. PAYMENT MANAGEMENT
// ============================================================================

// Get pending payment requests from pharmacists
const getPendingPayments = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const cashierId = req.cashier.user_id;

    const [pendingSales] = await pool.execute(
      `SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        s.status,
        u.full_name as pharmacist_name,
        u.user_id as pharmacist_id,
        COUNT(si.sale_item_id) as item_count
      FROM sale s
      INNER JOIN "user" u ON s.user_id = u.user_id
      INNER JOIN role r ON u.role_id = r.role_id
      LEFT JOIN sale_item si ON s.sale_id = si.sale_id
      WHERE s.branch_id = ? 
        AND s.status = 'pending_payment'
        AND r.role_name = 'Pharmacist'
      GROUP BY s.sale_id, s.sale_date, s.total_amount, s.status, u.full_name, u.user_id
      ORDER BY s.sale_date DESC`,
      [branchId]
    );

    res.json({
      success: true,
      message: 'Pending payments retrieved successfully',
      data: pendingSales
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    next(error);
  }
};

// Get payment request details (sale with items)
const getPaymentRequestDetails = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const { sale_id } = req.params;

    // Get sale details
    const [sales] = await pool.execute(
      `SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        s.status,
        u.full_name as pharmacist_name,
        u.user_id as pharmacist_id
      FROM sale s
      INNER JOIN "user" u ON s.user_id = u.user_id
      WHERE s.sale_id = ? AND s.branch_id = ?`,
      [sale_id, branchId]
    );

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found'
      });
    }

    // Get sale items
    const [saleItems] = await pool.execute(
      `SELECT 
        si.sale_item_id,
        si.quantity,
        si.unit_price,
        si.subtotal,
        m.name as medicine_name,
        m.barcode,
        m.medicine_id
      FROM sale_item si
      INNER JOIN medicine m ON si.medicine_id = m.medicine_id
      WHERE si.sale_id = ?`,
      [sale_id]
    );

    res.json({
      success: true,
      message: 'Payment request details retrieved successfully',
      data: {
        sale: sales[0],
        items: saleItems
      }
    });
  } catch (error) {
    console.error('Get payment request details error:', error);
    next(error);
  }
};

// Accept payment and create receipt
const acceptPayment = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const cashierId = req.cashier.user_id;
    const { sale_id } = req.params;
    const { payment_type, reference_number } = req.body;

    if (!payment_type) {
      return res.status(400).json({
        success: false,
        message: 'payment_type is required'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Verify sale exists and is pending payment
      const [sales] = await connection.execute(
        `SELECT sale_id, total_amount, status, branch_id
         FROM sale 
         WHERE sale_id = ? AND branch_id = ?`,
        [sale_id, branchId]
      );

      if (sales.length === 0) {
        throw new Error('Sale not found or does not belong to your branch');
      }

      const sale = sales[0];

      if (sale.status !== 'pending_payment') {
        throw new Error(`Sale is not pending payment. Current status: ${sale.status}`);
      }

      // Update sale status to completed
      await connection.execute(
        `UPDATE sale 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE sale_id = ?`,
        [sale_id]
      );

      // Create or update payment record
      const [existingPayments] = await connection.execute(
        `SELECT payment_id FROM payment WHERE sale_id = ?`,
        [sale_id]
      );

      if (existingPayments.length > 0) {
        // Update existing payment
        await connection.execute(
          `UPDATE payment 
           SET payment_type = ?, 
               reference_number = ?,
               payment_date = CURRENT_TIMESTAMP
           WHERE sale_id = ?`,
          [payment_type, reference_number || null, sale_id]
        );
      } else {
        // Create new payment record
        await connection.execute(
          `INSERT INTO payment (sale_id, payment_type, amount, payment_date, reference_number)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
          [sale_id, payment_type, sale.total_amount, reference_number || null]
        );
      }

      // Update stock for all medicines in the sale
      const [saleItemsForStock] = await connection.execute(
        `SELECT medicine_id, quantity FROM sale_item WHERE sale_id = ?`,
        [sale_id]
      );

      for (const item of saleItemsForStock) {
        await connection.execute(
          `UPDATE medicine 
           SET quantity_in_stock = quantity_in_stock - ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE medicine_id = ? AND branch_id = ?`,
          [item.quantity, item.medicine_id, branchId]
        );
      }

      // Mark notification as read
      await connection.execute(
        `UPDATE notification 
         SET is_read = TRUE 
         WHERE branch_id = ? 
           AND type = 'payment_request' 
           AND message LIKE ?`,
        [branchId, `%Sale ID: ${sale_id}%`]
      );

      await connection.commit();

      // Get complete sale details for receipt
      const [saleDetails] = await pool.execute(
        `SELECT 
          s.sale_id,
          s.sale_date,
          s.total_amount,
          s.status,
          u.full_name as cashier_name,
          p.payment_type,
          p.amount as payment_amount,
          p.payment_date,
          p.reference_number
        FROM sale s
        LEFT JOIN "user" u ON s.user_id = u.user_id
        LEFT JOIN payment p ON s.sale_id = p.sale_id
        WHERE s.sale_id = ?`,
        [sale_id]
      );

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
        [sale_id]
      );

      connection.release();

      res.json({
        success: true,
        message: 'Payment accepted successfully',
        data: {
          sale: saleDetails[0],
          items: saleItems,
          receipt_number: `REC-${sale_id.toString().padStart(6, '0')}`,
          processed_by: req.cashier.user_id
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Accept payment error:', error);
    next(error);
  }
};

// Get receipt by sale ID
const getReceipt = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const { sale_id } = req.params;

    // Get sale details
    const [saleDetails] = await pool.execute(
      `SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        s.status,
        u.full_name as cashier_name,
        p.payment_type,
        p.amount as payment_amount,
        p.payment_date,
        p.reference_number
      FROM sale s
      LEFT JOIN "user" u ON s.user_id = u.user_id
      LEFT JOIN payment p ON s.sale_id = p.sale_id
      WHERE s.sale_id = ? AND s.branch_id = ?`,
      [sale_id, branchId]
    );

    if (saleDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Get sale items
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
      [sale_id]
    );

    res.json({
      success: true,
      message: 'Receipt retrieved successfully',
      data: {
        sale: saleDetails[0],
        items: saleItems,
        receipt_number: `REC-${sale_id.toString().padStart(6, '0')}`
      }
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    next(error);
  }
};

// ============================================================================
// 2. PAYMENT REPORTS
// ============================================================================

// Get payment reports
const getPaymentReports = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const { start_date, end_date, payment_type } = req.query;

    let query = `
      SELECT 
        p.payment_id,
        p.payment_type,
        p.amount,
        p.payment_date,
        p.reference_number,
        s.sale_id,
        s.sale_date,
        s.total_amount,
        u.full_name as cashier_name
      FROM payment p
      INNER JOIN sale s ON p.sale_id = s.sale_id
      LEFT JOIN "user" u ON s.user_id = u.user_id
      WHERE s.branch_id = ?
    `;
    const params = [branchId];

    if (start_date) {
      query += ` AND DATE(p.payment_date) >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(p.payment_date) <= ?`;
      params.push(end_date);
    }

    if (payment_type) {
      query += ` AND p.payment_type = ?`;
      params.push(payment_type);
    }

    query += ` ORDER BY p.payment_date DESC`;

    const [payments] = await pool.execute(query, params);

    // Calculate summary
    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paymentTypeSummary = payments.reduce((acc, p) => {
      const type = p.payment_type || 'Unknown';
      acc[type] = (acc[type] || 0) + parseFloat(p.amount || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Payment reports retrieved successfully',
      data: {
        payments,
        summary: {
          total_amount: totalAmount,
          total_count: payments.length,
          payment_type_summary: paymentTypeSummary
        }
      }
    });
  } catch (error) {
    console.error('Get payment reports error:', error);
    next(error);
  }
};

// ============================================================================
// 3. RETURN MANAGEMENT
// ============================================================================

// Process medication return
const processReturn = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const cashierId = req.cashier.user_id;
    const { sale_id, medicine_id, quantity_returned, return_reason, return_condition } = req.body;

    if (!sale_id || !medicine_id || !quantity_returned || !return_reason) {
      return res.status(400).json({
        success: false,
        message: 'sale_id, medicine_id, quantity_returned, and return_reason are required'
      });
    }

    if (quantity_returned <= 0) {
      return res.status(400).json({
        success: false,
        message: 'quantity_returned must be greater than 0'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Verify sale exists and belongs to branch
      const [sales] = await connection.execute(
        `SELECT sale_id, branch_id, status FROM sale WHERE sale_id = ?`,
        [sale_id]
      );

      if (sales.length === 0) {
        throw new Error('Sale not found');
      }

      if (sales[0].branch_id !== branchId) {
        throw new Error('Sale does not belong to your branch');
      }

      // Verify medicine was in the sale
      const [saleItems] = await connection.execute(
        `SELECT si.quantity, m.medicine_id, m.name, m.branch_id
         FROM sale_item si
         INNER JOIN medicine m ON si.medicine_id = m.medicine_id
         WHERE si.sale_id = ? AND si.medicine_id = ?`,
        [sale_id, medicine_id]
      );

      if (saleItems.length === 0) {
        throw new Error('Medicine was not part of this sale');
      }

      const saleItem = saleItems[0];

      if (saleItem.branch_id !== branchId) {
        throw new Error('Medicine does not belong to your branch');
      }

      if (quantity_returned > saleItem.quantity) {
        throw new Error(`Cannot return more than was sold. Sold: ${saleItem.quantity}, Requested: ${quantity_returned}`);
      }

      // Create return record
      const [returnResult] = await connection.execute(
        `INSERT INTO return_table (sale_id, medicine_id, quantity_returned, return_reason, return_condition, status, return_date)
         VALUES (?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)
         RETURNING return_id`,
        [sale_id, medicine_id, quantity_returned, return_reason, return_condition || 'good']
      );

      const returnId = returnResult.length > 0 ? (returnResult[0].return_id || returnResult[0].id) : null;
      if (!returnId) {
        throw new Error('Failed to create return record');
      }

      // Add returned medication back to stock
      await connection.execute(
        `UPDATE medicine 
         SET quantity_in_stock = quantity_in_stock + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE medicine_id = ? AND branch_id = ?`,
        [quantity_returned, medicine_id, branchId]
      );

      await connection.commit();

      // Get return details
      const [returnDetails] = await pool.execute(
        `SELECT 
          rt.return_id,
          rt.sale_id,
          rt.medicine_id,
          rt.quantity_returned,
          rt.return_reason,
          rt.return_condition,
          rt.return_date,
          rt.status,
          m.name as medicine_name,
          m.barcode
        FROM return_table rt
        INNER JOIN medicine m ON rt.medicine_id = m.medicine_id
        WHERE rt.return_id = ?`,
        [returnId]
      );

      connection.release();

      res.status(201).json({
        success: true,
        message: 'Return processed successfully and stock updated',
        data: returnDetails[0]
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Process return error:', error);
    next(error);
  }
};

// Get return reports
const getReturnReports = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        rt.return_id,
        rt.sale_id,
        rt.medicine_id,
        rt.quantity_returned,
        rt.return_reason,
        rt.return_condition,
        rt.return_date,
        rt.status,
        m.name as medicine_name,
        m.barcode,
        m.price,
        (rt.quantity_returned * m.price) as return_value
      FROM return_table rt
      INNER JOIN medicine m ON rt.medicine_id = m.medicine_id
      INNER JOIN sale s ON rt.sale_id = s.sale_id
      WHERE s.branch_id = ?
    `;
    const params = [branchId];

    if (start_date) {
      query += ` AND DATE(rt.return_date) >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(rt.return_date) <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY rt.return_date DESC`;

    const [returns] = await pool.execute(query, params);

    // Calculate summary
    const totalQuantity = returns.reduce((sum, r) => sum + (r.quantity_returned || 0), 0);
    const totalValue = returns.reduce((sum, r) => sum + parseFloat(r.return_value || 0), 0);
    const reasonSummary = returns.reduce((acc, r) => {
      const reason = r.return_reason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Return reports retrieved successfully',
      data: {
        returns,
        summary: {
          total_quantity_returned: totalQuantity,
          total_return_value: totalValue,
          total_count: returns.length,
          reason_summary: reasonSummary
        }
      }
    });
  } catch (error) {
    console.error('Get return reports error:', error);
    next(error);
  }
};

// Get all sales for return processing (to find which sale to return from)
const getSalesForReturn = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const { sale_id } = req.query;

    let query = `
      SELECT 
        s.sale_id,
        s.sale_date,
        s.total_amount,
        s.status,
        u.full_name as pharmacist_name
      FROM sale s
      LEFT JOIN "user" u ON s.user_id = u.user_id
      WHERE s.branch_id = ? AND s.status = 'completed'
    `;
    const params = [branchId];

    if (sale_id) {
      query += ` AND s.sale_id = ?`;
      params.push(sale_id);
    }

    query += ` ORDER BY s.sale_date DESC LIMIT 100`;

    const [sales] = await pool.execute(query, params);

    res.json({
      success: true,
      message: 'Sales retrieved successfully',
      data: sales
    });
  } catch (error) {
    console.error('Get sales for return error:', error);
    next(error);
  }
};

// Get sale items for a specific sale (for return processing)
const getSaleItemsForReturn = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const { sale_id } = req.params;

    // Verify sale belongs to branch
    const [sales] = await pool.execute(
      `SELECT sale_id FROM sale WHERE sale_id = ? AND branch_id = ?`,
      [sale_id, branchId]
    );

    if (sales.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found or does not belong to your branch'
      });
    }

    // Get sale items
    const [saleItems] = await pool.execute(
      `SELECT 
        si.sale_item_id,
        si.medicine_id,
        si.quantity,
        si.unit_price,
        si.subtotal,
        m.name as medicine_name,
        m.barcode,
        COALESCE(SUM(rt.quantity_returned), 0) as already_returned
      FROM sale_item si
      INNER JOIN medicine m ON si.medicine_id = m.medicine_id
      LEFT JOIN return_table rt ON si.sale_id = rt.sale_id AND si.medicine_id = rt.medicine_id
      WHERE si.sale_id = ?
      GROUP BY si.sale_item_id, si.medicine_id, si.quantity, si.unit_price, si.subtotal, m.name, m.barcode`,
      [sale_id]
    );

    res.json({
      success: true,
      message: 'Sale items retrieved successfully',
      data: saleItems
    });
  } catch (error) {
    console.error('Get sale items for return error:', error);
    next(error);
  }
};

// ============================================================================
// 4. NOTIFICATIONS
// ============================================================================

// Get notifications for cashier (payment requests)
const getNotifications = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;

    // Get payment request notifications
    const [notifications] = await pool.execute(
      `SELECT 
        notification_id,
        title,
        message,
        type,
        is_read,
        created_at
       FROM notification
       WHERE branch_id = ?
         AND type = 'payment_request'
       ORDER BY created_at DESC
       LIMIT 50`,
      [branchId]
    );

    // Extract sale_id from message for easier frontend use
    const formattedNotifications = notifications.map(n => {
      const saleIdMatch = n.message.match(/Sale ID: (\d+)/);
      return {
        notification_id: n.notification_id,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.is_read,
        created_at: n.created_at,
        sale_id: saleIdMatch ? parseInt(saleIdMatch[1]) : null
      };
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: formattedNotifications,
        unread_count: unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
};

// ============================================================================
// 5. SOLD MEDICINES REPORT
// ============================================================================

// Get sold medicines report
const getSoldMedicinesReport = async (req, res, next) => {
  try {
    const branchId = req.cashier.branch_id;
    const { start_date, end_date, medicine_id } = req.query;

    let query = `
      SELECT 
        m.medicine_id,
        m.name as medicine_name,
        m.barcode,
        m.type,
        c.category_name,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.subtotal) as total_revenue,
        COUNT(DISTINCT s.sale_id) as sale_count,
        AVG(si.unit_price) as average_price
      FROM sale_item si
      INNER JOIN sale s ON si.sale_id = s.sale_id
      INNER JOIN medicine m ON si.medicine_id = m.medicine_id
      LEFT JOIN category c ON m.category_id = c.category_id
      WHERE s.branch_id = ? AND s.status = 'completed'
    `;
    const params = [branchId];

    if (start_date) {
      query += ` AND DATE(s.sale_date) >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(s.sale_date) <= ?`;
      params.push(end_date);
    }

    if (medicine_id) {
      query += ` AND m.medicine_id = ?`;
      params.push(medicine_id);
    }

    query += ` 
      GROUP BY m.medicine_id, m.name, m.barcode, m.type, c.category_name
      ORDER BY total_quantity_sold DESC
    `;

    const [soldMedicines] = await pool.execute(query, params);

    // Calculate summary
    const totalQuantity = soldMedicines.reduce((sum, m) => sum + (parseInt(m.total_quantity_sold) || 0), 0);
    const totalRevenue = soldMedicines.reduce((sum, m) => sum + parseFloat(m.total_revenue || 0), 0);
    const totalSales = soldMedicines.reduce((sum, m) => sum + (parseInt(m.sale_count) || 0), 0);

    res.json({
      success: true,
      message: 'Sold medicines report retrieved successfully',
      data: {
        medicines: soldMedicines,
        summary: {
          total_medicines_sold: soldMedicines.length,
          total_quantity_sold: totalQuantity,
          total_revenue: totalRevenue,
          total_sales: totalSales
        }
      }
    });
  } catch (error) {
    console.error('Get sold medicines report error:', error);
    next(error);
  }
};

module.exports = {
  // Payment Management
  getPendingPayments,
  getPaymentRequestDetails,
  acceptPayment,
  getReceipt,
  // Payment Reports
  getPaymentReports,
  // Return Management
  processReturn,
  getReturnReports,
  getSalesForReturn,
  getSaleItemsForReturn,
  // Notifications
  getNotifications,
  // Sold Medicines Report
  getSoldMedicinesReport
};

