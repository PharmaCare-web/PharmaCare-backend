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

module.exports = {
  getPendingManagers,
  getActivatedManagers,
  getAllManagers,
  activateManager,
  deactivateManager,
  getManagersByBranch
};

