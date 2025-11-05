// Optional: separate route files
// Example route handling

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authRoutes = require('./authRoutes');
const authMiddleware = require('../middleware/auth');

// Authentication routes
router.use('/auth', authRoutes);

// Protected user routes (require authentication)
router.get('/users', authMiddleware, userController.getAllUsers);
router.get('/users/:id', authMiddleware, userController.getUserById);
router.post('/users', authMiddleware, userController.createUser);
router.put('/users/:id', authMiddleware, userController.updateUser);
router.delete('/users/:id', authMiddleware, userController.deleteUser);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

