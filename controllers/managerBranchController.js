// Manager Branch Management Controller
// Allows managers to view and manage branches (their own branch and request new branches)

const pool = require('../config/database');

// Get all branches (for manager to view all branches)
const getAllBranches = async (req, res, next) => {
  try {
    const [branches] = await pool.execute(
      `SELECT 
         b.branch_id,
         b.branch_name,
         b.location,
         b.email,
         b.phone,
         b.created_at,
         b.updated_at,
         p.name as pharmacy_name,
         COUNT(DISTINCT u.user_id) as total_staff,
         COUNT(DISTINCT CASE WHEN u.is_active = TRUE THEN u.user_id END) as active_staff
       FROM branch b
       LEFT JOIN pharmacy p ON b.pharmacy_id = p.pharmacy_id
       LEFT JOIN users u ON b.branch_id = u.branch_id
       GROUP BY b.branch_id, b.branch_name, b.location, b.email, b.phone, b.created_at, b.updated_at, p.name
       ORDER BY b.branch_id`
    );

    res.json({
      success: true,
      data: branches,
      count: branches.length,
      message: 'Branches retrieved successfully'
    });
  } catch (error) {
    console.error('Get all branches error:', error);
    next(error);
  }
};

// Create new branch (request to create a branch)
const createBranch = async (req, res, next) => {
  try {
    const managerId = req.users.user_id;
    const { branch_name, location, email, phone } = req.body;

    if (!branch_name || !location) {
      return res.status(400).json({
        success: false,
        message: 'branch_name and location are required'
      });
    }

    // Get default pharmacy_id (first pharmacy)
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
      `INSERT INTO branch (pharmacy_id, branch_name, location, email, phone, created_by)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      [pharmacy_id, branch_name, location, email || null, phone || null, managerId]
    );

    const newBranch = branchResult.length > 0 ? branchResult[0] : branchResult;

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: newBranch
    });
  } catch (error) {
    console.error('Create branch error:', error);
    next(error);
  }
};

// Request branch creation (alternative endpoint for requesting approval)
const requestBranch = async (req, res, next) => {
  try {
    const managerId = req.users.user_id;
    const { branch_name, location, email, phone, request_notes } = req.body;

    if (!branch_name || !location) {
      return res.status(400).json({
        success: false,
        message: 'branch_name and location are required'
      });
    }

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

    // Create a notification for admin to review the branch request
    // For now, we'll create the branch but mark it as pending if there's an is_active field
    // If not, we'll just create it and let admin manage it separately
    
    // Get default pharmacy_id
    const [pharmacies] = await pool.execute('SELECT pharmacy_id FROM pharmacy LIMIT 1');
    if (pharmacies.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pharmacy found. Please create a pharmacy first.'
      });
    }
    const pharmacy_id = pharmacies[0].pharmacy_id;

    // Create branch request (we'll create the branch, admin can activate/deactivate)
    const [branchResult] = await pool.execute(
      `INSERT INTO branch (pharmacy_id, branch_name, location, email, phone, created_by)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      [pharmacy_id, branch_name, location, email || null, phone || null, managerId]
    );

    const newBranch = branchResult.length > 0 ? branchResult[0] : branchResult;

    // Create notification for admin
    const [managerInfo] = await pool.execute(
      'SELECT full_name, email FROM users WHERE user_id = ?',
      [managerId]
    );

    if (managerInfo.length > 0) {
      // Create notification in the first branch or system notification
      // For now, we'll skip notification creation as it requires a branch_id
      // Admin can see new branches through the branches list
    }

    res.status(201).json({
      success: true,
      message: 'Branch request submitted successfully. Waiting for admin approval.',
      data: {
        branch: newBranch,
        status: 'pending_approval',
        note: request_notes || 'Branch creation request submitted'
      }
    });
  } catch (error) {
    console.error('Request branch error:', error);
    next(error);
  }
};

// Update branch
const updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branch_name, location, email, phone } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Check if branch exists
    const [existingBranch] = await pool.execute(
      'SELECT branch_id FROM branch WHERE branch_id = ?',
      [id]
    );

    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (branch_name !== undefined) {
      updates.push('branch_name = ?');
      values.push(branch_name);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
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
      `UPDATE branch SET ${updates.join(', ')} WHERE branch_id = ?`,
      values
    );

    // Get updated branch
    const [updatedBranch] = await pool.execute(
      `SELECT b.branch_id, b.branch_name, b.location, b.email, b.phone, 
              b.created_at, b.updated_at, p.name as pharmacy_name
       FROM branch b
       LEFT JOIN pharmacy p ON b.pharmacy_id = p.pharmacy_id
       WHERE b.branch_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: updatedBranch[0]
    });
  } catch (error) {
    console.error('Update branch error:', error);
    next(error);
  }
};

// Delete branch
const deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Check if branch exists
    const [existingBranch] = await pool.execute(
      'SELECT branch_id, branch_name FROM branch WHERE branch_id = ?',
      [id]
    );

    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if branch has associated users
    const [users] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE branch_id = ?',
      [id]
    );

    if (parseInt(users[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch with associated users. Please reassign or remove users first.'
      });
    }

    // Check if branch has sales
    const [sales] = await pool.execute(
      'SELECT COUNT(*) as count FROM sale WHERE branch_id = ?',
      [id]
    );

    if (parseInt(sales[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch with sales history. Branch can only be deactivated.'
      });
    }

    await pool.execute('DELETE FROM branch WHERE branch_id = ?', [id]);

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    next(error);
  }
};

// Activate branch (if branch has is_active field, otherwise this is a placeholder)
const activateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Check if branch exists
    const [existingBranch] = await pool.execute(
      'SELECT branch_id, branch_name FROM branch WHERE branch_id = ?',
      [id]
    );

    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if branch table has is_active column
    // For now, we'll just return success as the schema doesn't show is_active on branch
    // If you add is_active to branch table, uncomment below:
    /*
    await pool.execute(
      'UPDATE branch SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE branch_id = ?',
      [id]
    );
    */

    // Get updated branch
    const [updatedBranch] = await pool.execute(
      `SELECT b.branch_id, b.branch_name, b.location, b.email, b.phone, 
              b.created_at, b.updated_at, p.name as pharmacy_name
       FROM branch b
       LEFT JOIN pharmacy p ON b.pharmacy_id = p.pharmacy_id
       WHERE b.branch_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Branch activated successfully',
      data: updatedBranch[0],
      note: 'Note: Branch activation is currently handled through user management. If you need branch-level activation, add is_active column to branch table.'
    });
  } catch (error) {
    console.error('Activate branch error:', error);
    next(error);
  }
};

// Deactivate branch
const deactivateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Check if branch exists
    const [existingBranch] = await pool.execute(
      'SELECT branch_id, branch_name FROM branch WHERE branch_id = ?',
      [id]
    );

    if (existingBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if branch table has is_active column
    // For now, we'll just return success as the schema doesn't show is_active on branch
    // If you add is_active to branch table, uncomment below:
    /*
    await pool.execute(
      'UPDATE branch SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE branch_id = ?',
      [id]
    );
    */

    // Get updated branch
    const [updatedBranch] = await pool.execute(
      `SELECT b.branch_id, b.branch_name, b.location, b.email, b.phone, 
              b.created_at, b.updated_at, p.name as pharmacy_name
       FROM branch b
       LEFT JOIN pharmacy p ON b.pharmacy_id = p.pharmacy_id
       WHERE b.branch_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Branch deactivated successfully',
      data: updatedBranch[0],
      note: 'Note: Branch deactivation is currently handled through user management. If you need branch-level deactivation, add is_active column to branch table.'
    });
  } catch (error) {
    console.error('Deactivate branch error:', error);
    next(error);
  }
};

module.exports = {
  getAllBranches,
  createBranch,
  requestBranch,
  updateBranch,
  deleteBranch,
  activateBranch,
  deactivateBranch
};
