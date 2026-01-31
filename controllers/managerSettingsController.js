// Manager Settings Controller
// Allows managers to manage branch settings like refund policy

const pool = require('../config/database');

// Get refund policy settings
const getRefundPolicy = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;

    // Check if refund_policy table exists, if not return default
    // First, try to get refund policy for this branch
    let refundPolicy;
    try {
      const [policies] = await pool.execute(
        `SELECT 
           policy_id,
           branch_id,
           refund_days_limit,
           refund_conditions,
           requires_receipt,
           refund_methods,
           notes,
           created_at,
           updated_at
         FROM refund_policy
         WHERE branch_id = ?`,
        [branchId]
      );

      if (policies.length > 0) {
        refundPolicy = policies[0];
      } else {
        // Return default policy if none exists
        refundPolicy = {
          policy_id: null,
          branch_id: branchId,
          refund_days_limit: 30,
          refund_conditions: 'Items must be unopened and in original packaging',
          requires_receipt: true,
          refund_methods: 'original_payment',
          notes: 'Default refund policy',
          created_at: null,
          updated_at: null
        };
      }
    } catch (error) {
      // If table doesn't exist, return default policy
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        refundPolicy = {
          policy_id: null,
          branch_id: branchId,
          refund_days_limit: 30,
          refund_conditions: 'Items must be unopened and in original packaging',
          requires_receipt: true,
          refund_methods: 'original_payment',
          notes: 'Default refund policy (table not created yet)',
          created_at: null,
          updated_at: null
        };
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      data: refundPolicy,
      message: 'Refund policy retrieved successfully'
    });
  } catch (error) {
    console.error('Get refund policy error:', error);
    next(error);
  }
};

// Update refund policy settings
const updateRefundPolicy = async (req, res, next) => {
  try {
    const branchId = req.users.branch_id;
    const { refund_days_limit, refund_conditions, requires_receipt, refund_methods, notes } = req.body;

    // Validate required fields
    if (refund_days_limit !== undefined && (isNaN(refund_days_limit) || refund_days_limit < 0)) {
      return res.status(400).json({
        success: false,
        message: 'refund_days_limit must be a non-negative number'
      });
    }

    // Check if refund_policy table exists
    let policyExists = false;
    try {
      const [existingPolicies] = await pool.execute(
        'SELECT policy_id FROM refund_policy WHERE branch_id = ?',
        [branchId]
      );
      policyExists = existingPolicies.length > 0;
    } catch (error) {
      // Table doesn't exist, we'll create it or return error
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
        return res.status(500).json({
          success: false,
          message: 'Refund policy table does not exist. Please create the refund_policy table first.',
          note: 'You need to run a migration to create the refund_policy table with columns: policy_id, branch_id, refund_days_limit, refund_conditions, requires_receipt, refund_methods, notes, created_at, updated_at'
        });
      }
      throw error;
    }

    if (policyExists) {
      // Update existing policy
      const updates = [];
      const values = [];

      if (refund_days_limit !== undefined) {
        updates.push('refund_days_limit = ?');
        values.push(refund_days_limit);
      }
      if (refund_conditions !== undefined) {
        updates.push('refund_conditions = ?');
        values.push(refund_conditions);
      }
      if (requires_receipt !== undefined) {
        updates.push('requires_receipt = ?');
        values.push(requires_receipt);
      }
      if (refund_methods !== undefined) {
        updates.push('refund_methods = ?');
        values.push(refund_methods);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(branchId);

      await pool.execute(
        `UPDATE refund_policy SET ${updates.join(', ')} WHERE branch_id = ?`,
        values
      );
    } else {
      // Create new policy
      await pool.execute(
        `INSERT INTO refund_policy (branch_id, refund_days_limit, refund_conditions, requires_receipt, refund_methods, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          branchId,
          refund_days_limit !== undefined ? refund_days_limit : 30,
          refund_conditions !== undefined ? refund_conditions : 'Items must be unopened and in original packaging',
          requires_receipt !== undefined ? requires_receipt : true,
          refund_methods !== undefined ? refund_methods : 'original_payment',
          notes || null
        ]
      );
    }

    // Get updated policy
    const [updatedPolicy] = await pool.execute(
      `SELECT 
         policy_id,
         branch_id,
         refund_days_limit,
         refund_conditions,
         requires_receipt,
         refund_methods,
         notes,
         created_at,
         updated_at
       FROM refund_policy
       WHERE branch_id = ?`,
      [branchId]
    );

    res.json({
      success: true,
      message: 'Refund policy updated successfully',
      data: updatedPolicy[0]
    });
  } catch (error) {
    console.error('Update refund policy error:', error);
    next(error);
  }
};

module.exports = {
  getRefundPolicy,
  updateRefundPolicy
};
