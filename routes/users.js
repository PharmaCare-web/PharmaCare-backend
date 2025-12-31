// src/routes/users.js
const express = require('express');
const router = express.Router(); // <-- THIS IS REQUIRED
const pool = require('../config/database');
// correct path
 // your database connection

// Temporary route: delete all non-admin users
router.delete('/delete-all-users-temp', async (req, res, next) => {
  try {
    // Get count before deletion
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role_id != 1'
    );
    const countToDelete = parseInt(countResult[0].count) || 0;
    
    // Delete users
    await pool.execute('DELETE FROM users WHERE role_id != 1');
    
    res.json({
      success: true,
      message: 'All non-admin users deleted successfully',
      affectedRows: countToDelete
    });
  } catch (err) {
    console.error('Delete users error:', err);
    next(err);
  }
});

module.exports = router;
