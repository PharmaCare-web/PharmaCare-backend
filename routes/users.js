// src/routes/users.js
const express = require('express');
const router = express.Router(); // <-- THIS IS REQUIRED
const db = require('../db'); // your database connection

// Temporary route: delete all non-admin users
router.delete('/delete-all-users-temp', (req, res) => {
  const sql = 'DELETE FROM users WHERE role_id != 1';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: 'All non-admin users deleted successfully',
      affectedRows: result.affectedRows
    });
  });
});

module.exports = router;
