// Admin Manager Management Controller
// Allows admin to view and activate/deactivate manager accounts

const pool = require('../config/database');

// Get all pending managers (inactive, waiting for activation)
const getPendingManagers = async (req, res, next) => {
  try {
    const [managers] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         u.is_email_verified,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE r.role_name = 'Manager' 
       AND u.is_active = FALSE
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: managers,
      count: managers.length,
      message: 'Pending managers retrieved successfully'
    });
  } catch (error) {
    console.error('Get pending managers error:', error);
    next(error);
  }
};

// Get all activated managers (active)
const getActivatedManagers = async (req, res, next) => {
  try {
    const [managers] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         u.last_login,
         u.is_email_verified,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE r.role_name = 'Manager' 
       AND u.is_active = TRUE
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: managers,
      count: managers.length,
      message: 'Activated managers retrieved successfully'
    });
  } catch (error) {
    console.error('Get activated managers error:', error);
    next(error);
  }
};

// Get all managers (both pending and activated)
const getAllManagers = async (req, res, next) => {
  try {
    const [managers] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         u.last_login,
         u.is_email_verified,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE r.role_name = 'Manager'
       ORDER BY u.is_active DESC, u.created_at DESC`
    );

    // Separate pending and activated
    const pending = managers.filter(m => !m.is_active);
    const activated = managers.filter(m => m.is_active);

    res.json({
      success: true,
      data: {
        all: managers,
        pending: pending,
        activated: activated
      },
      counts: {
        total: managers.length,
        pending: pending.length,
        activated: activated.length
      },
      message: 'All managers retrieved successfully'
    });
  } catch (error) {
    console.error('Get all managers error:', error);
    next(error);
  }
};

// Activate manager account
const activateManager = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    // Verify the users is a manager
    const [userss] = await pool.execute(
      `SELECT u.user_id, u.role_id, r.role_name, u.is_active, u.branch_id
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [user_id]
    );

    if (userss.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const users = userss[0];

    if (users.role_name !== 'Manager') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for activating Manager accounts'
      });
    }

    if (users.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Manager account is already active'
      });
    }

    // Activate the manager
    await pool.execute(
      'UPDATE users SET is_active = TRUE WHERE user_id = ?',
      [user_id]
    );

    // Get updated users info
    const [updatedUsers] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [user_id]
    );

    res.json({
      success: true,
      message: 'Manager account activated successfully',
      data: updatedUsers[0]
    });
  } catch (error) {
    console.error('Activate manager error:', error);
    next(error);
  }
};

// Deactivate manager account
const deactivateManager = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    // Verify the users is a manager
    const [userss] = await pool.execute(
      `SELECT u.user_id, u.role_id, r.role_name, u.is_active
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [user_id]
    );

    if (userss.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const users = userss[0];

    if (users.role_name !== 'Manager') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for deactivating Manager accounts'
      });
    }

    if (!users.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Manager account is already inactive'
      });
    }

    // Deactivate the manager
    await pool.execute(
      'UPDATE users SET is_active = FALSE WHERE user_id = ?',
      [user_id]
    );

    // Get updated users info
    const [updatedUsers] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [user_id]
    );

    res.json({
      success: true,
      message: 'Manager account deactivated successfully',
      data: updatedUsers[0]
    });
  } catch (error) {
    console.error('Deactivate manager error:', error);
    next(error);
  }
};

// Get managers by branch (to verify multiple managers per branch)
const getManagersByBranch = async (req, res, next) => {
  try {
    const { branch_id } = req.params;

    const [managers] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         u.last_login,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE r.role_name = 'Manager'
       AND u.branch_id = ?
       ORDER BY u.is_active DESC, u.created_at DESC`,
      [branch_id]
    );

    res.json({
      success: true,
      data: managers,
      count: managers.length,
      message: `Managers for branch ${branch_id} retrieved successfully`
    });
  } catch (error) {
    console.error('Get managers by branch error:', error);
    next(error);
  }
};

// Create new manager
const createManager = async (req, res, next) => {
  try {
    const adminId = req.user ? req.user.user_id : (req.users ? req.users.user_id : null);
    const { full_name, email, password, branch_id, branch_name, location } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'full_name, email, and password are required'
      });
    }

    // Get Manager role_id
    const [roles] = await pool.execute(
      "SELECT role_id FROM role WHERE role_name = 'Manager'"
    );

    if (roles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Manager role not found in database'
      });
    }

    const roleId = roles[0].role_id;

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    let finalBranchId = null;

    // Handle branch creation or assignment
    if (branch_name) {
      // Create new branch
      if (branch_id) {
        return res.status(400).json({
          success: false,
          message: 'Do not provide branch_id when creating a new branch. Only provide branch_name and location.'
        });
      }

      if (!location) {
        return res.status(400).json({
          success: false,
          message: 'location is required when creating a new branch'
        });
      }

      // Get default pharmacy_id
      const [pharmacies] = await pool.execute('SELECT pharmacy_id FROM pharmacy LIMIT 1');
      if (pharmacies.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No pharmacy found. Please create a pharmacy first.'
        });
      }
      const pharmacy_id = pharmacies[0].pharmacy_id;

      // Check if branch name already exists
      const [existingBranches] = await pool.execute(
        'SELECT branch_id FROM branch WHERE branch_name = ?',
        [branch_name]
      );

      if (existingBranches.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Branch with this name already exists'
        });
      }

      // Create new branch
      const [branchResult] = await pool.execute(
        'INSERT INTO branch (pharmacy_id, branch_name, location, created_by) VALUES (?, ?, ?, ?) RETURNING branch_id',
        [pharmacy_id, branch_name, location, adminId]
      );

      if (branchResult.length > 0) {
        finalBranchId = branchResult[0].branch_id || branchResult[0].id;
      }
    } else if (branch_id) {
      // Use existing branch
      const [branchCheck] = await pool.execute(
        'SELECT branch_id FROM branch WHERE branch_id = ?',
        [branch_id]
      );

      if (branchCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      finalBranchId = branch_id;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either branch_id or branch_name with location is required'
      });
    }

    // Create manager user
    const [userResult] = await pool.execute(
      `INSERT INTO users (full_name, email, password, role_id, branch_id, is_active, is_email_verified, created_by)
       VALUES (?, ?, ?, ?, ?, FALSE, FALSE, ?) RETURNING user_id`,
      [full_name, email, hashedPassword, roleId, finalBranchId, adminId]
    );

    const userId = userResult.length > 0 ? (userResult[0].user_id || userResult[0].id) : null;

    // Get created manager
    const [newManager] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Manager created successfully. Account is pending activation.',
      data: newManager[0]
    });
  } catch (error) {
    console.error('Create manager error:', error);
    next(error);
  }
};

// Verify manager (verify email/account)
const verifyManager = async (req, res, next) => {
  try {
    const { email, verification_code } = req.body;

    if (!email || !verification_code) {
      return res.status(400).json({
        success: false,
        message: 'email and verification_code are required'
      });
    }

    // Check if user exists and is a manager
    const [users] = await pool.execute(
      `SELECT u.user_id, u.email, u.verification_code, u.verification_code_expires, u.is_email_verified, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.email = ? AND r.role_name = 'Manager'`,
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    const user = users[0];

    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Manager email is already verified'
      });
    }

    if (!user.verification_code) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new verification code.'
      });
    }

    if (user.verification_code !== verification_code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    if (new Date(user.verification_code_expires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Verify the manager
    await pool.execute(
      'UPDATE users SET is_email_verified = TRUE, verification_code = NULL, verification_code_expires = NULL WHERE user_id = ?',
      [user.user_id]
    );

    // Get updated manager
    const [updatedManager] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.is_email_verified,
         u.is_active,
         r.role_name,
         b.branch_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [user.user_id]
    );

    res.json({
      success: true,
      message: 'Manager verified successfully',
      data: updatedManager[0]
    });
  } catch (error) {
    console.error('Verify manager error:', error);
    next(error);
  }
};

// Update manager
const updateManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, branch_id, is_active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }

    // Check if manager exists
    const [existingManager] = await pool.execute(
      `SELECT u.user_id, u.email, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ? AND r.role_name = 'Manager'`,
      [id]
    );

    if (existingManager.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingManager[0].email) {
      const [emailCheck] = await pool.execute(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Check if branch_id is valid
    if (branch_id !== undefined) {
      const [branchCheck] = await pool.execute(
        'SELECT branch_id FROM branch WHERE branch_id = ?',
        [branch_id]
      );

      if (branchCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (branch_id !== undefined) {
      updates.push('branch_id = ?');
      values.push(branch_id);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    // Get updated manager
    const [updatedManager] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.role_id,
         u.branch_id,
         u.is_active,
         u.created_at,
         u.updated_at,
         r.role_name,
         b.branch_name,
         b.location
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       LEFT JOIN branch b ON u.branch_id = b.branch_id
       WHERE u.user_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Manager updated successfully',
      data: updatedManager[0]
    });
  } catch (error) {
    console.error('Update manager error:', error);
    next(error);
  }
};

// Delete manager
const deleteManager = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }

    // Check if manager exists
    const [existingManager] = await pool.execute(
      `SELECT u.user_id, u.full_name, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ? AND r.role_name = 'Manager'`,
      [id]
    );

    if (existingManager.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Check if manager has created sales (optional check)
    const [sales] = await pool.execute(
      'SELECT COUNT(*) as count FROM sale WHERE user_id = ?',
      [id]
    );

    if (parseInt(sales[0].count) > 0) {
      // Instead of blocking, we'll just warn
      // You might want to soft delete or keep the user but mark as inactive
    }

    // Delete manager
    await pool.execute('DELETE FROM users WHERE user_id = ?', [id]);

    res.json({
      success: true,
      message: 'Manager deleted successfully'
    });
  } catch (error) {
    console.error('Delete manager error:', error);
    next(error);
  }
};

// Reset manager password
const resetManagerPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password, temporary_password } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }

    // Check if manager exists
    const [existingManager] = await pool.execute(
      `SELECT u.user_id, u.full_name, r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ? AND r.role_name = 'Manager'`,
      [id]
    );

    if (existingManager.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    const password = new_password || temporary_password;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters'
      });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await pool.execute(
      `UPDATE users 
       SET password = ?, 
           is_temporary_password = ?,
           must_change_password = ?,
           password_changed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [hashedPassword, temporary_password === true, temporary_password === true, id]
    );

    // Get updated manager
    const [updatedManager] = await pool.execute(
      `SELECT 
         u.user_id,
         u.full_name,
         u.email,
         u.is_temporary_password,
         u.must_change_password,
         r.role_name
       FROM users u
       LEFT JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: temporary_password ? 'Temporary password set successfully. Manager must change password on next login.' : 'Password reset successfully',
      data: {
        user_id: updatedManager[0].user_id,
        full_name: updatedManager[0].full_name,
        email: updatedManager[0].email,
        is_temporary_password: updatedManager[0].is_temporary_password,
        must_change_password: updatedManager[0].must_change_password
      }
    });
  } catch (error) {
    console.error('Reset manager password error:', error);
    next(error);
  }
};

// Get audit logs (admin can view all audit logs)
const getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, branch_id, user_id, action_type, entity_type, start_date, end_date } = req.query;

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
        r.role_name,
        b.branch_name
      FROM audit_trail at
      LEFT JOIN users u ON at.user_id = u.user_id
      LEFT JOIN role r ON u.role_id = r.role_id
      LEFT JOIN branch b ON at.branch_id = b.branch_id
      WHERE 1=1
    `;

    const params = [];

    if (branch_id) {
      query += ' AND at.branch_id = ?';
      params.push(branch_id);
    }

    if (user_id) {
      query += ' AND at.user_id = ?';
      params.push(user_id);
    }

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
    let countQuery = `SELECT COUNT(*) as total FROM audit_trail WHERE 1=1`;
    const countParams = [];

    if (branch_id) {
      countQuery += ' AND branch_id = ?';
      countParams.push(branch_id);
    }

    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(user_id);
    }

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
      message: 'Audit logs retrieved successfully'
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    // If audit_trail table doesn't exist, return helpful message
    if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
      return res.status(500).json({
        success: false,
        message: 'Audit trail table does not exist. Please create the audit_trail table first.',
        note: 'You need to run a migration to create the audit_trail table'
      });
    }
    next(error);
  }
};

module.exports = {
  getPendingManagers,
  getActivatedManagers,
  getAllManagers,
  activateManager,
  deactivateManager,
  getManagersByBranch,
  createManager,
  verifyManager,
  updateManager,
  deleteManager,
  resetManagerPassword,
  getAuditLogs
};

